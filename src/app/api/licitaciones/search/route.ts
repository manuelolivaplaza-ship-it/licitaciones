import { NextRequest, NextResponse } from 'next/server';
import { ChileCompraClient } from '@/lib/chilecompra/client';
import { ESTADO_MAP } from '@/types/licitacion';
import type { Licitacion, LicitacionEstado } from '@/types/licitacion';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/schema';
import { getSession, getCompanyById, getMatchesForCompany } from '@/lib/store';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Strict keyword boundary matching helper for Spanish.
 * Returns true only if the keyword matches as a standalone word/phrase.
 */
function matchesKeywordStrict(text: string, kw: string): boolean {
  const cleanKw = kw.toLowerCase().trim();
  if (!cleanKw) return false;
  const escaped = cleanKw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(^|[^a-záéíóúüñ])${escaped}([^a-záéíóúüñ]|$)`, 'i');
  return regex.test(text);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get('fecha');
    const estadoParam = searchParams.get('estado');
    const queryParam = searchParams.get('q');
    const regionParam = searchParams.get('region');
    const companyProfileParam = searchParams.get('profile'); // JSON stringified from frontend

    let companyProfile = null;
    try {
      if (companyProfileParam) companyProfile = JSON.parse(decodeURIComponent(companyProfileParam));
    } catch (e) {}

    if (!companyProfile) {
      try {
        const token = req.cookies.get('licitahub_session')?.value;
        if (token) {
          const session = getSession(token);
          if (session) {
            companyProfile = getCompanyById(session.companyId);
          }
        }
      } catch (cookieErr) {
        console.warn('Failed to resolve company profile from cookie in search route:', cookieErr);
      }
    }

    // 1. INTENTAR CON SUPABASE (Producción)
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const { data: dbLicitaciones, error } = await supabase
        .from('licitaciones')
        .select('*')
        .order('fecha_publicacion', { ascending: false })
        .limit(100);

      if (!error && dbLicitaciones && dbLicitaciones.length > 0) {
        // Map database snake_case structure to camelCase Licitacion structure
        const mappedLicitaciones: Licitacion[] = dbLicitaciones.map((row: any) => ({
          id: row.id,
          codigo: row.codigo,
          nombre: row.nombre || 'Sin nombre',
          descripcion: row.descripcion || '',
          estado: row.estado as LicitacionEstado,
          tipo: row.tipo || 'LP',
          organismo: row.organismo || '',
          organismoCode: row.organismo_codigo || '',
          region: row.region || '',
          fechaPublicacion: row.fecha_publicacion || '',
          fechaCierre: row.fecha_cierre || '',
          fechaAdjudicacion: row.fecha_adjudicacion || undefined,
          montoEstimado: row.monto_estimado || 0,
          moneda: row.moneda || 'CLP',
          items: Array.isArray(row.items) ? row.items : [],
          adjudicacion: row.adjudicacion || undefined,
          aiScore: row.ai_score || 0,
          aiInsights: row.ai_summary || '',
          syncedAt: row.synced_at || '',
          createdAt: row.created_at || '',
        }));

        return NextResponse.json({
          data: mappedLicitaciones,
          total: mappedLicitaciones.length,
          source: 'supabase',
        });
      }
    }

    // 2. FALLBACK A CHILECOMPRA API + IA ON-THE-FLY (Local / Sin DB)
    const client = new ChileCompraClient();
    let rawResults: any[] = [];
    let fecha = fechaParam || '';
    if (!fecha) {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = String(now.getFullYear());
      fecha = `${dd}${mm}${yyyy}`;
    }

    if (estadoParam) {
      rawResults = await client.getLicitacionesPorEstado(estadoParam);
    } else {
      rawResults = await client.getLicitacionesPorFecha(fecha);
    }

    let licitaciones: Licitacion[] = [];
    let isMockFallback = false;

    if (rawResults && rawResults.length > 0) {
      licitaciones = rawResults.map((raw) => {
        const estadoKey = ESTADO_MAP[raw.CodigoEstado] || 'publicada';
        const codeParts = raw.CodigoExterno?.split('-') || [];
        const tipoCode = codeParts.length >= 3 ? codeParts[2].replace(/\d+/g, '') : '';

        return {
          id: raw.CodigoExterno,
          codigo: raw.CodigoExterno,
          nombre: raw.Nombre?.trim() || 'Sin nombre',
          descripcion: raw.Descripcion || '',
          estado: estadoKey as LicitacionEstado,
          tipo: tipoCode || String(raw.Tipo || ''),
          organismo: raw.Comprador?.NombreOrganismo || '',
          organismoCode: raw.Comprador?.CodigoOrganismo || '',
          region: raw.Comprador?.RegionUnidad || '',
          fechaPublicacion: raw.FechaPublicacion || raw.FechaInicio || new Date().toISOString(),
          fechaCierre: raw.FechaCierre || '',
          fechaAdjudicacion: raw.FechaAdjudicacion,
          montoEstimado: raw.MontoEstimado || 0,
          moneda: raw.Moneda || 'CLP',
          items: (raw.Items?.Listado || []).map((item: any) => ({
            correlativo: item.Correlativo,
            codigoCategoria: item.CodigoCategoria,
            categoria: item.Categoria,
            codigoProducto: item.CodigoProducto,
            nombreProducto: item.NombreProducto,
            descripcion: item.Descripcion || '',
            unidadMedida: item.UnidadMedida || '',
            cantidad: item.Cantidad || 1,
          })),
          aiScore: 0, 
          aiInsights: '',
          syncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
      });
    } else {
      const { getMockLicitaciones } = require('@/lib/mock/data');
      licitaciones = getMockLicitaciones();
      isMockFallback = true;
    }

    if (queryParam) {
      const q = queryParam.toLowerCase();
      licitaciones = licitaciones.filter((l) =>
        l.nombre.toLowerCase().includes(q) ||
        l.descripcion.toLowerCase().includes(q) ||
        l.organismo.toLowerCase().includes(q) ||
        l.codigo.toLowerCase().includes(q)
      );
    }

    if (regionParam) {
      const r = regionParam.toLowerCase();
      licitaciones = licitaciones.filter((l) => l.region.toLowerCase().includes(r));
    }

    // 3. EVALUACIÓN Y SCORING REAL EN VIVO MEDIANTE REGLAS DETERMINISTAS
    if (companyProfile) {
      const savedMatches = getMatchesForCompany(companyProfile.id) || [];
      
      const mappedSaved: Licitacion[] = savedMatches
        .filter((m: any) => (m.aiScore || 0) >= 60)
        .map((m: any) => ({
          id: m.licitacionCodigo,
          codigo: m.licitacionCodigo,
          nombre: m.licitacionNombre,
          descripcion: m.aiInsights || 'Sin descripción técnica detallada.',
          estado: m.licitacionEstado as LicitacionEstado,
          tipo: 'L1',
          organismo: m.licitacionOrganismo || 'Comprador Público',
          organismoCode: '9999',
          region: m.licitacionRegion || 'Metropolitana de Santiago',
          fechaPublicacion: m.matchedAt || new Date().toISOString(),
          fechaCierre: m.licitacionFechaCierre || new Date().toISOString(),
          montoEstimado: m.licitacionMontoEstimado || 0,
          moneda: 'CLP',
          aiScore: m.aiScore || 0,
          aiInsights: m.aiInsights || '',
          items: [],
          syncedAt: m.matchedAt || new Date().toISOString(),
          createdAt: m.matchedAt || new Date().toISOString(),
        }));

      const realLics = licitaciones.filter(l => !mappedSaved.some(s => s.codigo === l.codigo));

      for (const lic of realLics) {
        const nameLower = lic.nombre.toLowerCase();
        const descLower = lic.descripcion.toLowerCase();
        const text = `${nameLower} ${descLower}`;
        
        let score = 0;
        let insights = 'La licitación no calza con los servicios principales de capacitación de tu empresa.';
        
        // Exclude keyword check (absolute rejection if matches)
        const isExcluded = companyProfile.excludeKeywords?.some((ek: string) =>
          nameLower.includes(ek.toLowerCase()) || descLower.includes(ek.toLowerCase())
        );
        
        if (!isExcluded) {
          const matchedTopics: string[] = [];
          if (matchesKeywordStrict(text, 'power bi') || matchesKeywordStrict(text, 'powerbi') || matchesKeywordStrict(text, 'dax') || matchesKeywordStrict(text, 'tableau')) matchedTopics.push('Power BI & Business Intelligence');
          if (matchesKeywordStrict(text, 'sql') || matchesKeywordStrict(text, 'base de datos') || matchesKeywordStrict(text, 'relacional') || matchesKeywordStrict(text, 'postgres') || matchesKeywordStrict(text, 'mysql') || matchesKeywordStrict(text, 'oracle') || matchesKeywordStrict(text, 'databases')) matchedTopics.push('Bases de Datos');
          if (matchesKeywordStrict(text, 'python') || matchesKeywordStrict(text, 'pandas') || matchesKeywordStrict(text, 'scripting') || matchesKeywordStrict(text, 'ciencia de datos') || matchesKeywordStrict(text, 'data science') || matchesKeywordStrict(text, 'big data') || matchesKeywordStrict(text, 'analítica de datos') || matchesKeywordStrict(text, 'data analytics')) matchedTopics.push('Python & Ciencia de Datos');
          if (matchesKeywordStrict(text, 'excel') || matchesKeywordStrict(text, 'planilla') || matchesKeywordStrict(text, 'office') || matchesKeywordStrict(text, 'vba')) matchedTopics.push('Excel Avanzado');
          if (matchesKeywordStrict(text, 'ia') || matchesKeywordStrict(text, 'inteligencia artificial') || matchesKeywordStrict(text, 'machine learning') || matchesKeywordStrict(text, 'aprendizaje automatico') || matchesKeywordStrict(text, 'aprendizaje automático') || matchesKeywordStrict(text, 'deep learning') || matchesKeywordStrict(text, 'chatgpt') || matchesKeywordStrict(text, 'copilot') || matchesKeywordStrict(text, 'openai') || matchesKeywordStrict(text, 'generativa')) matchedTopics.push('Inteligencia Artificial');
          if (matchesKeywordStrict(text, 'rpa') || matchesKeywordStrict(text, 'automatización') || matchesKeywordStrict(text, 'automate') || matchesKeywordStrict(text, 'flujos de trabajo') || matchesKeywordStrict(text, 'automatizacion')) matchedTopics.push('Automatización & RPA');
          if (matchesKeywordStrict(text, 'javascript') || matchesKeywordStrict(text, 'typescript') || matchesKeywordStrict(text, 'react') || matchesKeywordStrict(text, 'node') || matchesKeywordStrict(text, 'next.js') || matchesKeywordStrict(text, 'nextjs') || matchesKeywordStrict(text, 'desarrollo web') || matchesKeywordStrict(text, 'frontend') || matchesKeywordStrict(text, 'backend') || matchesKeywordStrict(text, 'fullstack') || matchesKeywordStrict(text, 'html') || matchesKeywordStrict(text, 'css')) matchedTopics.push('Desarrollo Web & Frontend/Backend');
          if (matchesKeywordStrict(text, 'scrum') || matchesKeywordStrict(text, 'agilidad') || matchesKeywordStrict(text, 'agiles') || matchesKeywordStrict(text, 'ágiles') || matchesKeywordStrict(text, 'devops') || matchesKeywordStrict(text, 'docker') || matchesKeywordStrict(text, 'kubernetes') || matchesKeywordStrict(text, 'aws') || matchesKeywordStrict(text, 'azure') || matchesKeywordStrict(text, 'gcp') || matchesKeywordStrict(text, 'cloud') || matchesKeywordStrict(text, 'nube')) matchedTopics.push('Metodologías Ágiles & Cloud DevOps');
          
          const isTech = ['programac', 'desarrollo de software', 'desarrollo web', 'desarrollo de sistemas', 'código fuente', 'código de software', 'código de programación', 'informatic', 'computac', 'tecnolog', 'analitic', 'data science', 'big data', 'ciencia de datos', 'redes de datos', 'redes informáticas', 'redes ti', 'servidores', 'ciberseguridad', 'ti', 'tic', 'software', 'hardware', 'digital', 'sistemas ti'].some(term => matchesKeywordStrict(text, term));
          const isTraining = ['capacitac', 'curso', 'taller', 'formacion', 'e-learning', 'elearning', 'clase', 'charla', 'educacion', 'diplomado', 'docente', 'enseñanza', 'relator', 'relatoría', 'enseñar', 'instrucción', 'aprendizaje'].some(term => matchesKeywordStrict(text, term));

          if (matchedTopics.length > 0 || isTech) {
            if (isTraining) {
              if (matchedTopics.length > 0) {
                score = 95;
                insights = `🎯 Oportunidad de capacitación excelente en ${matchedTopics.join(' y ')}. Calza directamente con tus especializaciones de ProgramBi.`;
              } else {
                score = 90;
                insights = `📚 Licitación de capacitación tecnológica detectada. Se alinea con tus servicios y catálogo de ProgramBi.`;
              }
            } else {
              if (matchedTopics.length > 0) {
                score = 85;
                insights = `💻 Requerimiento técnico relacionado con ${matchedTopics.join(', ')}. Puede requerir servicios de consultoría o desarrollo.`;
              } else {
                score = 0;
                insights = 'La licitación no contiene temas de programación, datos o tecnología de interés para tu empresa.';
              }
            }
          } else {
            score = 0;
            insights = 'La licitación no contiene temas de programación, datos o tecnología de interés para tu empresa.';
          }
        } else {
          score = 0;
          insights = `🚫 Licitación descartada: contiene palabras clave excluidas.`;
        }
        
        lic.aiScore = score;
        lic.aiInsights = insights;

        if (score >= 60) {
          try {
            const detailed = await client.getLicitacion(lic.codigo);
            if (detailed) {
              lic.descripcion = detailed.Descripcion || lic.descripcion;
              lic.montoEstimado = detailed.MontoEstimado || lic.montoEstimado;
              lic.organismo = detailed.Comprador?.NombreOrganismo || lic.organismo;
              lic.organismoCode = detailed.Comprador?.CodigoOrganismo || lic.organismoCode;
              lic.region = detailed.Comprador?.RegionUnidad || lic.region;
              if (detailed.Items?.Listado) {
                lic.items = detailed.Items.Listado.map((item: any) => ({
                  correlativo: item.Correlativo,
                  codigoCategoria: item.CodigoCategoria,
                  categoria: item.Categoria,
                  codigoProducto: item.CodigoProducto,
                  nombreProducto: item.NombreProducto,
                  descripcion: item.Descripcion || '',
                  unidadMedida: item.UnidadMedida || '',
                  cantidad: item.Cantidad || 1,
                }));
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch deep details for search match ${lic.codigo}:`, err);
          }
        }
      }
      
      licitaciones = [...mappedSaved, ...realLics];
      
      // Ordenar por fecha de sincronización (syncedAt) descendente (las más nuevas encontradas arriba)
      licitaciones.sort((a, b) => {
        const timeA = new Date(a.syncedAt || 0).getTime();
        const timeB = new Date(b.syncedAt || 0).getTime();
        if (timeB !== timeA) {
          return timeB - timeA;
        }
        const pubA = new Date(a.fechaPublicacion || 0).getTime();
        const pubB = new Date(b.fechaPublicacion || 0).getTime();
        return pubB - pubA;
      });
    } else {
      // Si no hay perfil, score 0 para todas
      for (const lic of licitaciones) {
        lic.aiScore = 0;
        lic.aiInsights = 'Registra el perfil de tu empresa para evaluar compatibilidad.';
      }
    }

    return NextResponse.json({
      data: licitaciones,
      total: licitaciones.length,
      fecha,
      source: isMockFallback ? 'mock-fallback' : 'chilecompra-api-with-live-ai',
    });
  } catch (error: any) {
    console.error('API /licitaciones/search error:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching licitaciones', data: [], total: 0 },
      { status: 500 }
    );
  }
}
