import { NextResponse } from 'next/server';
import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { ChileCompraClient } from '@/lib/chilecompra/client';
import { AIScoringEngine } from '@/lib/ai/scoring';
import { AIAnalysisService } from '@/lib/ai/analysis';
import { getMockLicitaciones } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

/**
 * Helper para formatear una fecha en formato ddmmyyyy según la zona horaria de Chile (America/Santiago)
 */
function getChileDateString(dateInput?: string): string {
  if (dateInput) {
    // Si viene en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const parts = dateInput.split('-');
      return `${parts[2]}${parts[1]}${parts[0]}`;
    }
    // Si viene en formato ddmmyyyy y tiene 8 dígitos
    if (/^\d{8}$/.test(dateInput)) {
      return dateInput;
    }
  }

  // Zona horaria de Chile
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  const formatter = new Intl.DateTimeFormat('es-CL', options);
  const parts = formatter.formatToParts(now);
  
  const day = parts.find(p => p.type === 'day')?.value || '22';
  const month = parts.find(p => p.type === 'month')?.value || '05';
  const year = parts.find(p => p.type === 'year')?.value || '2026';

  return `${day}${month}${year}`;
}

/**
 * Mapea una licitación cruda de ChileCompra al formato del esquema de nuestra base de datos
 */
function mapToDatabaseLicitacion(raw: any) {
  // Mapear estado
  let estado = 'publicada';
  const codigoEstado = Number(raw.CodigoEstado);
  if (codigoEstado === 6) estado = 'cerrada';
  else if (codigoEstado === 7) estado = 'desierta';
  else if (codigoEstado === 8) estado = 'adjudicada';
  else if (codigoEstado === 18) estado = 'revocada';
  else if (codigoEstado === 19) estado = 'suspendida';

  // Obtener items
  const itemsList = raw.Items?.Listado || [];
  const items = itemsList.map((it: any) => ({
    correlativo: Number(it.Correlativo),
    codigoCategoria: it.CodigoCategoria,
    categoria: it.Categoria,
    codigoProducto: it.CodigoProducto,
    nombreProducto: it.NombreProducto,
    descripcion: it.Descripcion,
    unidadMedida: it.UnidadMedida,
    cantidad: Number(it.Cantidad)
  }));

  // Retornar en formato snake_case para Supabase
  return {
    codigo: raw.CodigoExterno,
    nombre: raw.Nombre,
    descripcion: raw.Descripcion || '',
    estado: estado,
    tipo: raw.Tipo ? String(raw.Tipo) : 'LP',
    organismo: raw.Comprador?.NombreOrganismo || 'Desconocido',
    organismo_codigo: raw.Comprador?.CodigoOrganismo || '9999',
    region: raw.Comprador?.RegionUnidad || 'Metropolitana de Santiago',
    fecha_publicacion: raw.FechaPublicacion ? new Date(raw.FechaPublicacion).toISOString() : null,
    fecha_cierre: raw.FechaCierre ? new Date(raw.FechaCierre).toISOString() : null,
    fecha_adjudicacion: raw.FechaAdjudicacion ? new Date(raw.FechaAdjudicacion).toISOString() : null,
    monto_estimado: raw.MontoEstimado ? Math.round(Number(raw.MontoEstimado)) : 0,
    moneda: raw.Moneda || 'CLP',
    items: items,
    adjudicacion: raw.Adjudicacion ? {
      tipo: raw.Adjudicacion.Tipo,
      fecha: raw.Adjudicacion.Fecha,
      numeroOferentes: raw.Adjudicacion.NumeroOferentes,
      urlActa: raw.Adjudicacion.UrlActaAdjudicacion
    } : null,
    raw_data: raw,
    synced_at: new Date().toISOString()
  };
}

/**
 * Evalúa si una licitación coincide con los filtros de una alerta
 */
function evaluateAlertMatch(lic: any, filters: any): boolean {
  if (!filters) return false;

  // 1. Filtrado por texto/palabras clave (query o keywords)
  const query = filters.query || filters.keywords;
  if (query) {
    const licText = `${lic.nombre} ${lic.descripcion || ''}`.toLowerCase();
    if (typeof query === 'string') {
      const words = query.toLowerCase().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const match = words.some(w => licText.includes(w));
        if (!match) return false;
      }
    } else if (Array.isArray(query)) {
      const match = query.some(q => licText.includes(String(q).toLowerCase()));
      if (!match) return false;
    }
  }

  // 2. Filtrado por región (regiones o regions)
  const regions = filters.regiones || filters.regions;
  if (regions && regions.length > 0) {
    const licRegion = (lic.region || '').toLowerCase();
    const match = regions.some((r: string) => 
      licRegion.includes(r.toLowerCase()) || 
      r.toLowerCase().includes('todas') || 
      r.toLowerCase() === 'all'
    );
    if (!match) return false;
  }

  // 3. Filtrado por monto mínimo (montoMin o minAmount)
  const minAmount = filters.montoMin !== undefined ? filters.montoMin : filters.minAmount;
  if (minAmount !== undefined && minAmount !== null) {
    const licAmount = lic.monto_estimado || lic.montoEstimado || 0;
    if (licAmount < minAmount) return false;
  }

  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dateParam = body.date;
    const authHeader = request.headers.get('Authorization');

    // Validación de Token Secreto en producción (opcional si CRON_SECRET está configurado)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && cronSecret !== '') {
      const expectedAuth = `Bearer ${cronSecret}`;
      if (authHeader !== expectedAuth) {
        return NextResponse.json(
          { success: false, error: 'No autorizado. Token inválido.' },
          { status: 401 }
        );
      }
    }

    const targetDate = getChileDateString(dateParam);
    console.log(`[Sync Engine] Iniciando sincronización para fecha: ${targetDate}`);

    const isDbConfigured = isSupabaseAdminConfigured();
    const chileCompra = new ChileCompraClient();
    const scoringEngine = new AIScoringEngine();
    const analysisService = new AIAnalysisService();

    // 1. Obtener licitaciones desde ChileCompra
    const rawLicitaciones = await chileCompra.getLicitacionesPorFecha(targetDate);
    console.log(`[Sync Engine] Obtenidas ${rawLicitaciones.length} licitaciones desde ChileCompra API.`);

    if (rawLicitaciones.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron licitaciones para sincronizar en esta fecha.',
        stats: { processed: 0, inserted: 0, alertsMatched: 0 }
      });
    }

    const results = {
      isMockMode: !isDbConfigured,
      processed: rawLicitaciones.length,
      inserted: 0,
      alreadyExists: 0,
      aiSummariesGenerated: 0,
      aiScoresComputed: 0,
      alertsMatched: 0,
      errors: [] as string[]
    };

    if (!isDbConfigured) {
      // --- MOCK MODE FALLBACK ---
      console.warn('[Sync Engine] Supabase no está configurado o usa placeholders. Corriendo en MOCK MODE.');
      
      // Simulamos la lógica para fines demostrativos
      const mockOrgs = [
        { id: 'org-001', name: 'TecnoChile S.A.', industry: 'Tecnología', keywords: ['tecnología', 'software', 'sistemas'] },
        { id: 'org-002', name: 'SaludPlus Ltda.', industry: 'Salud', keywords: ['médico', 'clínico', 'insumos'] }
      ];
      
      const mockAlerts = [
        { id: 'alert-1', organization_id: 'org-001', name: 'Alerta TI', filters: { query: 'software' } },
        { id: 'alert-2', organization_id: 'org-002', name: 'Alerta Hospitales', filters: { query: 'médico' } }
      ];

      for (const raw of rawLicitaciones.slice(0, 5)) { // procesamos un subconjunto para no ralentizar el mock
        results.inserted++;
        results.aiSummariesGenerated++;
        
        const mappedLic = mapToDatabaseLicitacion(raw);
        let totalScore = 0;
        
        for (const org of mockOrgs) {
          const score = scoringEngine.calculateRuleScore(mappedLic as any, org as any);
          results.aiScoresComputed++;
          totalScore += score;
          
          // Evaluar alertas
          const orgAlerts = mockAlerts.filter(a => a.organization_id === org.id);
          for (const alert of orgAlerts) {
            if (evaluateAlertMatch(mappedLic, alert.filters)) {
              results.alertsMatched++;
              console.log(`[Sync Engine] MATCH SIMULADO: Licitación ${mappedLic.codigo} coincide con alerta "${alert.name}" para ${org.name}`);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Sincronización simulada completada exitosamente (Modo Demo/Mock).',
        results
      });
    }

    // --- REAL DATABASE OPERATION ---
    const supabase = createAdminClient();

    // Cargar organizaciones y alertas activas
    const { data: orgs, error: orgsError } = await supabase.from('organizations').select('*');
    if (orgsError) throw orgsError;

    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('is_active', true);
    if (alertsError) throw alertsError;

    console.log(`[Sync Engine] Cargadas ${orgs.length} organizaciones y ${alerts.length} alertas activas de la BD.`);

    // Consultar cuáles de las licitaciones ya existen en la base de datos
    const codigos = rawLicitaciones.map(r => r.CodigoExterno);
    
    // Consultar por lotes de 100 para evitar límites
    const existingCodigosSet = new Set<string>();
    const batchSize = 100;
    for (let i = 0; i < codigos.length; i += batchSize) {
      const batch = codigos.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('licitaciones')
        .select('codigo')
        .in('codigo', batch);
      
      if (error) {
        console.error('[Sync Engine] Error al verificar duplicados:', error);
        throw error;
      }
      data?.forEach(row => existingCodigosSet.add(row.codigo));
    }

    // Filtrar licitaciones nuevas
    const newLicitacionesRaw = rawLicitaciones.filter(r => !existingCodigosSet.has(r.CodigoExterno));
    results.alreadyExists = rawLicitaciones.length - newLicitacionesRaw.length;
    console.log(`[Sync Engine] Encontradas ${newLicitacionesRaw.length} licitaciones nuevas. Saltando ${results.alreadyExists} duplicados.`);

    for (const raw of newLicitacionesRaw) {
      try {
        const mappedLic = mapToDatabaseLicitacion(raw);
        
        // Generar resumen ejecutivo vía IA
        let summary = '';
        try {
          summary = await analysisService.generateSummary(mappedLic.nombre, mappedLic.descripcion);
          results.aiSummariesGenerated++;
        } catch (summaryErr) {
          console.warn(`[Sync Engine] Error generando resumen IA para ${mappedLic.codigo}:`, summaryErr);
        }

        // Insertar licitación en BD primero para obtener el id
        const { data: insertedLic, error: insertError } = await supabase
          .from('licitaciones')
          .insert({
            ...mappedLic,
            ai_summary: summary
          })
          .select('id, codigo, nombre, descripcion, region, monto_estimado')
          .single();

        if (insertError) {
          console.error(`[Sync Engine] Error al insertar licitación ${mappedLic.codigo}:`, insertError);
          results.errors.push(`Error inserción ${mappedLic.codigo}: ${insertError.message}`);
          continue;
        }

        results.inserted++;
        const licId = insertedLic.id;

        // Procesamiento específico por organización
        let scoreSum = 0;
        let scoreCount = 0;

        for (const org of orgs) {
          // Calcular score híbrido
          let score = 0;
          try {
            score = await scoringEngine.computeHybridScore(insertedLic as any, org as any);
            results.aiScoresComputed++;
            scoreSum += score;
            scoreCount++;
          } catch (scoreErr) {
            console.warn(`[Sync Engine] Error calculando score para org ${org.id} en ${insertedLic.codigo}:`, scoreErr);
          }

          // Guardar puntaje de IA en la tabla ai_analyses
          const { error: analysisErr } = await supabase
            .from('ai_analyses')
            .upsert({
              organization_id: org.id,
              licitacion_id: licId,
              analysis_type: 'scoring',
              result: { score },
              model_used: 'openrouter/hybrid',
              created_at: new Date().toISOString()
            }, {
              onConflict: 'organization_id,licitacion_id,analysis_type'
            });

          if (analysisErr) {
            console.error(`[Sync Engine] Error al guardar scoring en ai_analyses:`, analysisErr);
          }

          // Evaluar alertas configuradas de esta organización
          const orgAlerts = alerts.filter(a => a.organization_id === org.id);
          for (const alert of orgAlerts) {
            const matches = evaluateAlertMatch(insertedLic, alert.filters);
            if (matches) {
              results.alertsMatched++;
              
              // Guardar coincidencia en alert_matches
              const { error: matchErr } = await supabase
                .from('alert_matches')
                .insert({
                  alert_id: alert.id,
                  licitacion_id: licId,
                  matched_at: new Date().toISOString()
                });

              if (matchErr) {
                console.error(`[Sync Engine] Error al registrar match de alerta:`, matchErr);
              }

              // Registrar en activity_log
              await supabase
                .from('activity_log')
                .insert({
                  organization_id: org.id,
                  action: 'alert_match',
                  entity_type: 'licitacion',
                  entity_id: licId,
                  metadata: {
                    alert_name: alert.name,
                    lic_codigo: insertedLic.codigo,
                    ai_score: score
                  }
                });
            }
          }
        }

        // Actualizar el puntaje global/promedio en la licitación
        if (scoreCount > 0) {
          const globalScore = Math.round(scoreSum / scoreCount);
          await supabase
            .from('licitaciones')
            .update({ ai_score: globalScore })
            .eq('id', licId);
        }

      } catch (err: any) {
        console.error(`[Sync Engine] Error procesando licitación ${raw.CodigoExterno}:`, err);
        results.errors.push(`General ${raw.CodigoExterno}: ${err.message || err}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronización completada. Procesados: ${results.processed}, Nuevos insertados: ${results.inserted}, Existentes: ${results.alreadyExists}.`,
      results
    });

  } catch (error: any) {
    console.error('[Sync Engine] Error crítico en endpoint de sincronización:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
