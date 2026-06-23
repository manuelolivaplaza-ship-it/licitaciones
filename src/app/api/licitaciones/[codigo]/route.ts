import { NextRequest, NextResponse } from 'next/server';
import { ChileCompraClient } from '@/lib/chilecompra/client';
import { ESTADO_MAP } from '@/types/licitacion';
import type { Licitacion, LicitacionEstado } from '@/types/licitacion';
import { getMatchesForCompany, getCompanies, getSession, getCompanyById } from '@/lib/store';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * GET /api/licitaciones/[codigo]
 * 
 * Fetches a specific licitación by its ChileCompra code (e.g., "2239-15-LP09")
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;

    if (!codigo) {
      return NextResponse.json({ error: 'Código de licitación requerido' }, { status: 400 });
    }

    // Resolve UUID to ChileCompra code if necessary
    let chileCompraCodigo = codigo;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codigo);
    
    if (isUuid && supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const supabaseClient = createSupabaseClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabaseClient
          .from('licitaciones')
          .select('codigo')
          .eq('id', codigo)
          .single();
        
        if (!error && data?.codigo) {
          chileCompraCodigo = data.codigo;
        }
      } catch (dbErr) {
        console.warn('Failed to resolve UUID to ChileCompra code:', dbErr);
      }
    }

    const client = new ChileCompraClient();
    let raw = await client.getLicitacion(chileCompraCodigo);

    if (!raw) {
      const { getMockLicitaciones } = require('@/lib/mock/data');
      const mocks = getMockLicitaciones();
      const mockLic = mocks.find((m: any) => m.codigo === chileCompraCodigo || m.id === chileCompraCodigo);
      if (mockLic) {
        return NextResponse.json({ data: mockLic });
      }
      return NextResponse.json({ error: 'Licitación no encontrada' }, { status: 404 });
    }

    const estadoKey = ESTADO_MAP[raw.CodigoEstado] || 'publicada';

    // Evaluate or retrieve AI score and insights
    let company = null;
    const token = req.cookies.get('licitahub_session')?.value;
    if (token) {
      const session = getSession(token);
      if (session) {
        company = getCompanyById(session.companyId);
      }
    }
    
    if (!company) {
      const companies = getCompanies() || [];
      company = companies[0]; // Active company fallback
    }
    
    let score = 0;
    let insights = 'La licitación no contiene temas de programación, datos o tecnología de interés para tu empresa.';
    let reasons: string[] = [];
    let matchedCategories: string[] = [];
    let recommendation = 'no_recomendar';

    if (company) {
      const matches = getMatchesForCompany(company.id) || [];
      const match = matches.find((m: any) => m.licitacionCodigo === codigo);

      if (match) {
        score = match.aiScore || 0;
        insights = match.aiInsights || '';
        reasons = match.aiReasons || [];
        matchedCategories = match.aiMatchedCategories || [];
        recommendation = match.aiRecommendation || 'media';
      } else {
        // Run heuristic match
        const nameLower = (raw.Nombre || '').toLowerCase();
        const descLower = (raw.Descripcion || '').toLowerCase();
        const text = `${nameLower} ${descLower}`;

        const isExcluded = company.excludeKeywords?.some((ek: string) =>
          nameLower.includes(ek.toLowerCase()) || descLower.includes(ek.toLowerCase())
        );

        if (!isExcluded) {
          const matchedTopics: string[] = [];
          
          const regexPowerBI = new RegExp(`(^|[^a-záéíóúüñ])(power bi|powerbi|dax|tableau)([^a-záéíóúüñ]|$)`, 'i');
          const regexSQL = new RegExp(`(^|[^a-záéíóúüñ])(sql|base de datos|relacional|postgres|mysql|oracle|databases)([^a-záéíóúüñ]|$)`, 'i');
          const regexPython = new RegExp(`(^|[^a-záéíóúüñ])(python|pandas|scripting|ciencia de datos|data science|big data|analítica de datos|data analytics)([^a-záéíóúüñ]|$)`, 'i');
          const regexExcel = new RegExp(`(^|[^a-záéíóúüñ])(excel|planilla|office|vba)([^a-záéíóúüñ]|$)`, 'i');
          const regexIA = new RegExp(`(^|[^a-záéíóúüñ])(ia|inteligencia artificial|machine learning|aprendizaje automatico|aprendizaje automático|deep learning|chatgpt|copilot|openai|generativa)([^a-záéíóúüñ]|$)`, 'i');
          const regexRPA = new RegExp(`(^|[^a-záéíóúüñ])(rpa|automatización|automate|flujos de trabajo|automatizacion)([^a-záéíóúüñ]|$)`, 'i');
          const regexJS = new RegExp(`(^|[^a-záéíóúüñ])(javascript|typescript|react|node|next.js|nextjs|desarrollo web|frontend|backend|fullstack|html|css)([^a-záéíóúüñ]|$)`, 'i');
          const regexScrum = new RegExp(`(^|[^a-záéíóúüñ])(scrum|agilidad|agiles|ágiles|devops|docker|kubernetes|aws|azure|gcp|cloud|nube)([^a-záéíóúüñ]|$)`, 'i');

          if (regexPowerBI.test(text)) matchedTopics.push('Power BI & Business Intelligence');
          if (regexSQL.test(text)) matchedTopics.push('Bases de Datos');
          if (regexPython.test(text)) matchedTopics.push('Python & Ciencia de Datos');
          if (regexExcel.test(text)) matchedTopics.push('Excel Avanzado');
          if (regexIA.test(text)) matchedTopics.push('Inteligencia Artificial');
          if (regexRPA.test(text)) matchedTopics.push('Automatización & RPA');
          if (regexJS.test(text)) matchedTopics.push('Desarrollo Web & Frontend/Backend');
          if (regexScrum.test(text)) matchedTopics.push('Metodologías Ágiles & Cloud DevOps');

          const techTerms = ['programac', 'desarrollo de software', 'desarrollo web', 'desarrollo de sistemas', 'código fuente', 'código de software', 'código de programación', 'informatic', 'computac', 'tecnolog', 'analitic', 'data science', 'big data', 'ciencia de datos', 'redes de datos', 'redes informáticas', 'redes ti', 'servidores', 'ciberseguridad', 'ti', 'tic', 'software', 'hardware', 'digital', 'sistemas ti'];
          const trainingTerms = ['capacitac', 'curso', 'taller', 'formacion', 'e-learning', 'elearning', 'clase', 'charla', 'educacion', 'diplomado', 'docente', 'enseñanza', 'relator', 'relatoría', 'enseñar', 'instrucción', 'aprendizaje'];

          const isTech = techTerms.some(term => {
            const regex = new RegExp(`(^|[^a-záéíóúüñ])${term}([^a-záéíóúüñ]|$)`, 'i');
            return regex.test(text);
          });
          const isTraining = trainingTerms.some(term => {
            const regex = new RegExp(`(^|[^a-záéíóúüñ])${term}([^a-záéíóúüñ]|$)`, 'i');
            return regex.test(text);
          });

          if (matchedTopics.length > 0 || isTech) {
            if (isTraining) {
              if (matchedTopics.length > 0) {
                score = 95;
                insights = `🎯 Oportunidad de capacitación excelente en ${matchedTopics.join(' y ')}. Calza directamente con tus especializaciones de ProgramBi.`;
                recommendation = 'alta';
              } else {
                score = 90;
                insights = `📚 Licitación de capacitación tecnológica detectada. Se alinea con tus servicios y catálogo de ProgramBi.`;
                recommendation = 'alta';
              }
            } else {
              if (matchedTopics.length > 0) {
                score = 85;
                insights = `💻 Requerimiento técnico relacionado con ${matchedTopics.join(', ')}. Puede requerir servicios de consultoría o desarrollo.`;
                recommendation = 'alta';
              } else {
                score = 0;
                insights = 'La licitación no contiene temas de programación, datos o tecnología de interés para tu empresa.';
                recommendation = 'no_recomendar';
              }
            }
            reasons = matchedTopics.length > 0 ? matchedTopics : ['Tecnología'];
            matchedCategories = matchedTopics;
          } else {
            score = 0;
            insights = 'La licitación no contiene temas de programación, datos o tecnología de interés para tu empresa.';
            recommendation = 'no_recomendar';
          }
        } else {
          score = 0;
          insights = `🚫 Licitación descartada: contiene palabras clave excluidas.`;
          recommendation = 'no_recomendar';
        }
      }
    }
    
    const licitacion: Licitacion = {
      id: raw.CodigoExterno,
      codigo: raw.CodigoExterno,
      nombre: raw.Nombre || 'Sin nombre',
      descripcion: raw.Descripcion || '',
      estado: estadoKey as LicitacionEstado,
      tipo: String(raw.Tipo || ''),
      organismo: raw.Comprador?.NombreOrganismo || 'Organismo no especificado',
      organismoCode: raw.Comprador?.CodigoOrganismo || '',
      region: raw.Comprador?.RegionUnidad || 'Sin región',
      compradorContacto: raw.Comprador?.NombreContacto || '',
      compradorEmail: raw.Comprador?.MailContacto || '',
      compradorFono: raw.Comprador?.FonoContacto || '',
      compradorCargo: raw.Comprador?.CargoContacto || '',
      compradorUnidad: raw.Comprador?.NombreUnidad || '',
      compradorDireccion: raw.Comprador?.DireccionUnidad || '',
      compradorComuna: raw.Comprador?.ComunaUnidad || '',
      fechaPublicacion: raw.FechaPublicacion || raw.FechaInicio || new Date().toISOString(),
      fechaCierre: raw.FechaCierre || '',
      fechaAdjudicacion: raw.FechaAdjudicacion,
      montoEstimado: raw.MontoEstimado || 0,
      moneda: raw.Moneda || 'CLP',
      items: (raw.Items?.Listado || []).map((item) => ({
        correlativo: item.Correlativo,
        codigoCategoria: item.CodigoCategoria,
        categoria: item.Categoria,
        codigoProducto: item.CodigoProducto,
        nombreProducto: item.NombreProducto,
        descripcion: item.Descripcion,
        unidadMedida: item.UnidadMedida,
        cantidad: item.Cantidad,
      })),
      adjudicacion: raw.Adjudicacion ? {
        tipo: raw.Adjudicacion.Tipo,
        fecha: raw.Adjudicacion.Fecha,
        numeroOferentes: raw.Adjudicacion.NumeroOferentes,
        urlActa: raw.Adjudicacion.UrlActaAdjudicacion,
      } : undefined,
      syncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      aiScore: score,
      aiInsights: insights,
      aiKeywords: matchedCategories,
    };

    return NextResponse.json({ data: licitacion });
  } catch (error: any) {
    console.error('API /licitaciones/[codigo] error:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching licitación' },
      { status: 500 }
    );
  }
}
