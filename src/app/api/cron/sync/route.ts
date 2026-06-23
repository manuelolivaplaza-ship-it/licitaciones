import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ChileCompraClient } from '@/lib/chilecompra/client';
import { evaluateMatch } from '@/lib/ai/matcher';
import { Database } from '@/lib/supabase/schema';

// Supabase client (using service role key for cron if available, or anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  // Configurar autenticación del cron job (ej. header Authorization)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Para entornos locales, podemos ignorar esto si no hay CRON_SECRET, pero en prod es útil
    // return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const chileCompra = new ChileCompraClient();
    
    // 1. Obtener licitaciones nuevas (ejemplo: obtenemos las publicadas hoy)
    // Para simplificar, asumiremos un formato ddmmyyyy para hoy
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Enero es 0!
    const yyyy = today.getFullYear();
    const formattedDate = `${dd}${mm}${yyyy}`;

    console.log(`[Cron] Obteniendo licitaciones para la fecha: ${formattedDate}`);
    const licitacionesApi = await chileCompra.getLicitacionesPorFecha(formattedDate);
    
    if (!licitacionesApi || licitacionesApi.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay licitaciones nuevas hoy.' });
    }

    console.log(`[Cron] Se obtuvieron ${licitacionesApi.length} licitaciones.`);

    // 2. Insertar/Actualizar licitaciones en Supabase
    // Transformamos las licitaciones de ChileCompra a nuestro modelo
    const licitacionesRows = licitacionesApi.map(lic => ({
      id: lic.CodigoExterno,
      nombre: lic.Nombre,
      estado: String(lic.CodigoEstado), // Simplificado
      descripcion: lic.Descripcion || '',
      fecha_cierre: lic.FechaCierre || null,
      fecha_publicacion: lic.FechaPublicacion || null,
      monto_estimado: lic.MontoEstimado || 0,
      moneda: lic.Moneda || 'CLP',
      organismo: lic.Comprador?.NombreOrganismo || '',
      region: lic.Comprador?.RegionUnidad || '',
      raw_data: lic as any, // Full payload
    }));

    const isPlaceholder = supabaseUrl.includes('placeholder');
    let companies: any[] = [];

    if (!isPlaceholder) {
      // In a real scenario, we'd upsert these:
      const { error: insertError } = await supabase
        .from('licitaciones')
        .upsert(licitacionesRows as any, { onConflict: 'id' });

      if (insertError) {
        console.error('[Cron] Error al guardar licitaciones:', insertError);
        // Continue anyway, maybe they exist already
      }

      // 3. Obtener todas las empresas registradas
      const { data, error: companiesError } = await supabase
        .from('companies')
        .select('*');

      if (companiesError || !data) {
        throw new Error(`Error obteniendo empresas: ${companiesError?.message}`);
      }
      companies = data;
    } else {
      // Modo local/placeholder sin DB
      const { getCompanies } = require('@/lib/store');
      companies = getCompanies() || [];
    }

    let matchesEvaluated = 0;
    let matchesSaved = 0;

    // 4. Evaluar cada licitación contra cada empresa
    // Limitamos a las primeras 10 licitaciones para no colapsar la API en pruebas
    const licitacionesAProcesar = licitacionesRows.slice(0, 10);

    for (const licitacion of licitacionesAProcesar) {
      for (const company of companies) {
        matchesEvaluated++;
        
        // El matcher internamente filtra si vale la pena o no llamar al LLM
        const matchResult = await evaluateMatch(licitacion as any, company);

        if (matchResult.recommendation_level !== 'descartada') {
          matchesSaved++;
          
          if (!isPlaceholder) {
            // Guardar el match en base de datos
            await supabase.from('company_licitacion_matches').upsert({
              company_id: company.id,
              licitacion_id: licitacion.id,
              score: matchResult.score,
              recommendation_level: matchResult.recommendation_level,
              insights: matchResult.insights,
              matched_keywords: matchResult.matched_keywords,
            } as any, { onConflict: 'company_id,licitacion_id' });
          } else {
            // Guardar el match en memoria local
            const { saveMatch } = require('@/lib/store');
            saveMatch({
              companyId: company.id,
              licitacionCodigo: licitacion.id,
              licitacionNombre: licitacion.nombre,
              licitacionEstado: licitacion.estado,
              licitacionRegion: licitacion.region,
              licitacionMontoEstimado: licitacion.monto_estimado,
              aiScore: matchResult.score,
              aiRecommendation: matchResult.recommendation_level,
              aiInsights: matchResult.insights,
              aiReasons: matchResult.insights ? [matchResult.insights] : [],
              aiMatchedCategories: matchResult.matched_keywords || [],
              matchedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronización completada',
      stats: {
        licitaciones_fetch: licitacionesApi.length,
        licitaciones_procesadas: licitacionesAProcesar.length,
        matches_evaluados: matchesEvaluated,
        matches_relevantes_guardados: matchesSaved,
      }
    });

  } catch (error: any) {
    console.error('[Cron Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
