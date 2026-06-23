import { NextRequest, NextResponse } from 'next/server';
import { ChileCompraClient } from '@/lib/chilecompra/client';
import { companyCategoryMatchesLicitacion, extractCategories } from '@/lib/chilecompra/categories';
import { getCompanies, saveMatchesBatch, updateSyncState, getSyncState, getMatchesForCompany } from '@/lib/store';
import { queryOpenRouter } from '@/lib/ai/openrouter';
import { ESTADO_MAP } from '@/types/licitacion';
import type { CompanyProfile, CompanyMatch, AIRecommendation, SyncResult } from '@/types/company';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for sync

// Free or low-cost model for scoring
const SCORING_MODEL = 'google/gemini-2.5-flash';

export async function POST(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const isPoll = searchParams.get('poll') === 'true';
  const syncState = getSyncState();

  if (isPoll) {
    const companies = getCompanies();
    const company = companies.find(c => c.id === 'programbi-id' || c.name.toLowerCase().includes('programbi'));
    
    if (company) {
      try {
        // Search today AND the last 2 days for broader coverage
        const datesToSearch: string[] = [];
        for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
          const d = new Date();
          d.setDate(d.getDate() - dayOffset);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = String(d.getFullYear());
          datesToSearch.push(`${dd}${mm}${yyyy}`);
        }

        const client = new ChileCompraClient();
        const existingMatches = getMatchesForCompany(company.id);

        // Merge results from multiple dates
        let allRawLicitaciones: any[] = [];
        for (const fecha of datesToSearch) {
          try {
            const batch = await client.getLicitacionesPorFecha(fecha);
            allRawLicitaciones = allRawLicitaciones.concat(batch);
          } catch (err) {
            console.warn(`Background poll: failed to fetch date ${fecha}:`, err);
          }
        }

        // Deduplicate by CodigoExterno
        const seen = new Set<string>();
        const rawLicitaciones = allRawLicitaciones.filter(raw => {
          const codigo = raw.CodigoExterno || '';
          if (!codigo || seen.has(codigo)) return false;
          seen.add(codigo);
          return true;
        });

        for (const raw of rawLicitaciones) {
          const nombre = raw.Nombre?.trim() || '';
          const descripcion = raw.Descripcion || '';
          const codigo = raw.CodigoExterno || '';
          const estadoKey = ESTADO_MAP[raw.CodigoEstado] || 'publicada';
          const fechaCierre = raw.FechaCierre || '';

          if (!nombre || !codigo) continue;
          
          // Omit if already matched
          if (existingMatches.some(m => m.licitacionCodigo === codigo)) continue;

          // Category matching check
          const result = companyCategoryMatchesLicitacion(
            company.industryCode,
            company.subCategories,
            company.keywords,
            company.specializations,
            nombre,
            descripcion
          );

          // Exclude check
          const nameLower = nombre.toLowerCase();
          const descLower = descripcion.toLowerCase();
          const isExcluded = company.excludeKeywords?.some((ek: string) =>
            nameLower.includes(ek.toLowerCase()) || descLower.includes(ek.toLowerCase())
          );

          if (result.matches && !isExcluded) {
            // Found a real match! Let's score it with LLM
            let score = 70;
            let insights = `Match por categorías y palabras clave de tu empresa.`;
            let recommendation = 'alta';
            let reasons = result.matchedCategories;

            try {
              const aiScoring = await scoreLicitacionForCompany(
                nombre, descripcion, codigo, estadoKey, fechaCierre,
                company,
                result.matchedCategories,
                result.confidence
              );
              score = aiScoring.score;
              insights = aiScoring.insights;
              recommendation = aiScoring.recommendation;
              reasons = aiScoring.reasons;
            } catch (aiErr) {
              console.warn('AI scoring failed during poll, using fallback score');
              score = Math.round(result.confidence * 95);
            }

            if (score < 60) {
              console.log(`Licitación ${codigo} descartada en background por score bajo: ${score}`);
              continue;
            }

            const detailedAmount = raw.MontoEstimado || 0;

            const match: CompanyMatch = {
              id: '',
              companyId: company.id,
              companyName: company.name,
              licitacionCodigo: codigo,
              licitacionNombre: nombre,
              licitacionEstado: estadoKey,
              licitacionFechaCierre: fechaCierre,
              licitacionMontoEstimado: detailedAmount,
              licitacionOrganismo: raw.Comprador?.NombreOrganismo || '',
              licitacionRegion: raw.Comprador?.RegionUnidad || '',
              compradorContacto: raw.Comprador?.NombreContacto || '',
              compradorEmail: raw.Comprador?.MailContacto || '',
              compradorFono: raw.Comprador?.FonoContacto || '',
              ruleScore: Math.round(result.confidence * 100),
              aiScore: score,
              hybridScore: Math.round(result.confidence * 100 * 0.4 + score * 0.6),
              aiInsights: insights,
              aiRecommendation: recommendation as any,
              aiReasons: reasons,
              aiMatchedCategories: result.matchedCategories,
              notified: false,
              savedByUser: false,
              matchedAt: new Date().toISOString(),
            };

            saveMatchesBatch([match]);

            updateSyncState({
              totalProcessed: syncState.totalProcessed + 1,
              totalMatched: syncState.totalMatched + 1,
              totalAiScored: syncState.totalAiScored + 1,
            });

            const minScore = company.alertMinScore || 70;
            if (score >= minScore) {
              return NextResponse.json({
                success: true,
                message: 'Sincronización en segundo plano: nueva licitación real encontrada!',
                newMatch: match,
                licitacionesFetched: rawLicitaciones.length,
                matchesFound: 1,
                aiScored: 1,
                ignored: rawLicitaciones.length - 1,
              });
            } else {
              console.log(`Licitación ${codigo} con score ${score} descartada para notificación de alerta (umbral mínimo: ${minScore})`);
            }
          }
        }
      } catch (err: any) {
        console.error('Error in background sync poll:', err);
      }

      // Si no encontramos nuevos en vivo hoy (como en fin de semana), liberamos uno de la BD que no haya sido notificado
      try {
        const existingMatches = getMatchesForCompany(company.id);
        const unnotified = existingMatches.find(m => !m.notified && (m.aiScore || 0) >= 60);
        
        if (unnotified) {
          unnotified.notified = true;
          saveMatchesBatch([unnotified]);

          return NextResponse.json({
            success: true,
            message: 'Sincronización en segundo plano: nueva licitación encontrada de la BD!',
            newMatch: unnotified,
            licitacionesFetched: 0,
            matchesFound: 1,
            aiScored: 1,
            ignored: 0,
          });
        }
      } catch (dbErr) {
        console.error('Failed to retrieve unnotified matches:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronización en segundo plano activa (sin nuevos matches reales).',
      licitacionesFetched: 0,
      matchesFound: 0,
      aiScored: 0,
      ignored: 0,
    });
  }
  
  // Prevent concurrent syncs
  if (syncState.isRunning) {
    return NextResponse.json({
      error: 'Sincronización ya en progreso',
      syncState,
    }, { status: 409 });
  }

  const startTime = Date.now();
  const errors: string[] = [];
  let totalFetched = 0;
  let totalMatched = 0;
  let totalAiScored = 0;
  let totalIgnored = 0;

  // Mark sync as running
  updateSyncState({ isRunning: true, errors: [] });

  try {
    // Parse optional date and companyId from request body
    let inputFecha: string;
    let targetCompanyId: string = '';
    try {
      const body = await req.json().catch(() => ({}));
      inputFecha = body.fecha || '';
      targetCompanyId = body.companyId || '';
    } catch {
      inputFecha = '';
      targetCompanyId = '';
    }

    // Get all registered companies
    let companies = getCompanies();
    if (targetCompanyId) {
      companies = companies.filter(c => c.id === targetCompanyId);
    }
    
    if (companies.length === 0) {
      updateSyncState({ isRunning: false });
      return NextResponse.json({
        success: true,
        message: 'No hay empresas registradas para esta sincronización.',
        licitacionesFetched: 0,
        matchesFound: 0,
        aiScored: 0,
        ignored: 0,
      });
    }

    const formatAsDdmmyyyy = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}${mm}${yyyy}`;
    };

    let datesToSync: string[] = [];
    const today = new Date();
    const todayStr = formatAsDdmmyyyy(today);

    if (inputFecha) {
      datesToSync.push(inputFecha);
    } else {
      const lastSyncDateStr = syncState.lastSyncDate;
      if (lastSyncDateStr && lastSyncDateStr.length === 8) {
        const day = parseInt(lastSyncDateStr.slice(0, 2));
        const month = parseInt(lastSyncDateStr.slice(2, 4)) - 1;
        const year = parseInt(lastSyncDateStr.slice(4, 8));
        
        const start = new Date(year, month, day);
        if (!isNaN(start.getTime())) {
          // Sync from last sync date to today (limit to max 7 days safety buffer)
          const current = new Date(start);
          let safetyCounter = 0;
          while (current <= today && safetyCounter < 7) {
            datesToSync.push(formatAsDdmmyyyy(current));
            current.setDate(current.getDate() + 1);
            safetyCounter++;
          }
        }
      }
      
      // Default fallback
      if (datesToSync.length === 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        datesToSync.push(formatAsDdmmyyyy(yesterday));
        datesToSync.push(formatAsDdmmyyyy(today));
      }
    }

    let totalFetched = 0;
    let totalMatched = 0;
    let totalAiScored = 0;
    let totalIgnored = 0;
    const allNewMatches: CompanyMatch[] = [];

    // Loop through each computed date
    for (let i = 0; i < datesToSync.length; i++) {
      const currentDate = datesToSync[i];
      const progressPercent = Math.round((i / datesToSync.length) * 80) + 10;
      
      updateSyncState({
        isRunning: true,
        currentStep: `Sincronizando día ${i + 1}/${datesToSync.length}: ${currentDate.slice(0, 2)}/${currentDate.slice(2, 4)}/${currentDate.slice(4, 8)}`,
        progressPercent,
      });

      // 1. Fetch licitaciones from ChileCompra
      const client = new ChileCompraClient();
      let rawLicitaciones: any[] = [];
      try {
        rawLicitaciones = await client.getLicitacionesPorFecha(currentDate);
      } catch (err) {
        console.error(`Error fetching tenders for date ${currentDate}:`, err);
        errors.push(`Error al obtener día ${currentDate}: ${err instanceof Error ? err.message : String(err)}`);
      }
      
      totalFetched += rawLicitaciones.length;

      if (rawLicitaciones.length === 0) {
        continue;
      }

      // 2. Process each licitación for this date
      for (const raw of rawLicitaciones) {
        const nombre = raw.Nombre?.trim() || '';
        const descripcion = raw.Descripcion || '';
        const codigo = raw.CodigoExterno || '';
        const estadoKey = ESTADO_MAP[raw.CodigoEstado] || 'publicada';
        const fechaCierre = raw.FechaCierre || '';

        if (!nombre || !codigo) continue;

        // Extract categories from this licitación
        const detectedCategories = extractCategories(nombre, descripcion);

        // 3. Find which companies match this licitación
        const matchingCompanies: { company: CompanyProfile; matchedCategories: string[]; confidence: number }[] = [];

        for (const company of companies) {
          const result = companyCategoryMatchesLicitacion(
            company.industryCode,
            company.subCategories,
            company.keywords,
            company.specializations,
            nombre,
            descripcion
          );

          if (result.matches) {
            matchingCompanies.push({
              company,
              matchedCategories: result.matchedCategories,
              confidence: result.confidence,
            });
          }
        }

        // 4. If no company matches → skip entirely
        if (matchingCompanies.length === 0) {
          totalIgnored++;
          continue;
        }

        totalMatched++;

        // 5. For EACH matching company → run personalized LLM scoring
        for (const { company, matchedCategories, confidence } of matchingCompanies) {
          try {
            const { score, insights, recommendation, reasons } = await scoreLicitacionForCompany(
              nombre, descripcion, codigo, estadoKey, fechaCierre,
              company,
              matchedCategories,
              confidence
            );

            if (score < 60) {
              console.log(`Licitación ${codigo} descartada en manual sync por score bajo: ${score}`);
              continue;
            }

            const detailedAmount = raw.MontoEstimado || 0;

            const match: CompanyMatch = {
              id: '',
              companyId: company.id,
              companyName: company.name,
              licitacionCodigo: codigo,
              licitacionNombre: nombre,
              licitacionEstado: estadoKey,
              licitacionFechaCierre: fechaCierre,
              licitacionMontoEstimado: detailedAmount,
              licitacionOrganismo: raw.Comprador?.NombreOrganismo || '',
              licitacionRegion: raw.Comprador?.RegionUnidad || '',
              compradorContacto: raw.Comprador?.NombreContacto || '',
              compradorEmail: raw.Comprador?.MailContacto || '',
              compradorFono: raw.Comprador?.FonoContacto || '',
              ruleScore: Math.round(confidence * 100),
              aiScore: score,
              hybridScore: Math.round(confidence * 100 * 0.4 + score * 0.6),
              aiInsights: insights,
              aiRecommendation: recommendation,
              aiReasons: reasons,
              aiMatchedCategories: matchedCategories,
              notified: false,
              savedByUser: false,
              matchedAt: new Date().toISOString(),
            };

            allNewMatches.push(match);
            totalAiScored++;
          } catch (err: any) {
            errors.push(`LLM error for ${codigo} x ${company.name}: ${err.message}`);
            
            // Still save match with rule-only score if it matches threshold
            const fallbackScore = Math.round(confidence * 100);
            if (fallbackScore < 60) {
              console.log(`Licitación ${codigo} descartada por bajo score fallback (${fallbackScore})`);
              continue;
            }

            allNewMatches.push({
              id: '',
              companyId: company.id,
              companyName: company.name,
              licitacionCodigo: codigo,
              licitacionNombre: nombre,
              licitacionEstado: estadoKey,
              licitacionFechaCierre: fechaCierre,
              licitacionMontoEstimado: raw.MontoEstimado || 0,
              licitacionOrganismo: raw.Comprador?.NombreOrganismo || '',
              licitacionRegion: raw.Comprador?.RegionUnidad || '',
              compradorContacto: raw.Comprador?.NombreContacto || '',
              compradorEmail: raw.Comprador?.MailContacto || '',
              compradorFono: raw.Comprador?.FonoContacto || '',
              ruleScore: Math.round(confidence * 100),
              aiScore: 0,
              hybridScore: Math.round(confidence * 100 * 0.4),
              aiInsights: 'Análisis IA no disponible — usando scoring por reglas.',
              aiRecommendation: confidence > 0.6 ? 'media' : 'baja',
              aiReasons: matchedCategories,
              aiMatchedCategories: matchedCategories,
              notified: false,
              savedByUser: false,
              matchedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    // 6. Save all matches in batch
    if (allNewMatches.length > 0) {
      saveMatchesBatch(allNewMatches);
    }

    // 7. Update sync state
    const duration = Date.now() - startTime;
    updateSyncState({
      isRunning: false,
      lastSyncDate: todayStr,
      lastSyncTimestamp: new Date().toISOString(),
      totalProcessed: totalFetched,
      totalMatched,
      totalAiScored,
      totalIgnored,
      currentStep: 'Completado',
      progressPercent: 100,
      errors,
    });

    const result: SyncResult = {
      success: true,
      fecha: todayStr,
      licitacionesFetched: totalFetched,
      matchesFound: totalMatched,
      aiScored: totalAiScored,
      ignored: totalIgnored,
      errors,
      duration,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Smart sync error:', error);
    updateSyncState({ isRunning: false, errors: [error.message] });
    return NextResponse.json(
      { error: error.message || 'Error en sincronización inteligente' },
      { status: 500 }
    );
  }
}

/**
 * Score a specific licitación for a specific company using LLM.
 * The LLM has the FULL context of the company to make a personalized assessment.
 */
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

/**
 * Score a specific licitación for a specific company using LLM.
 * The LLM has the FULL context of the company to make a personalized assessment.
 */
async function scoreLicitacionForCompany(
  nombre: string,
  descripcion: string,
  codigo: string,
  estado: string,
  fechaCierre: string,
  company: CompanyProfile,
  matchedCategories: string[],
  categoryConfidence: number
): Promise<{
  score: number;
  insights: string;
  recommendation: AIRecommendation;
  reasons: string[];
}> {
  // Heurística local estricta para ProgramBi y perfiles Demo antes de gastar recursos de red o LLM
  const isProgramBi = company.name?.toLowerCase().includes('programbi') || 
                      company.email?.toLowerCase().includes('programbi') ||
                      company.id === 'demo-company-id' ||
                      company.name?.toLowerCase().includes('demo');

  if (isProgramBi) {
    const nameLower = nombre.toLowerCase();
    const descLower = descripcion.toLowerCase();
    const text = `${nameLower} ${descLower}`;
    
    // Exclude keywords check
    const isExcluded = company.excludeKeywords?.some((ek: string) =>
      nameLower.includes(ek.toLowerCase()) || descLower.includes(ek.toLowerCase())
    );
    
    if (isExcluded) {
      return {
        score: 0,
        insights: '🚫 Licitación descartada: contiene palabras clave excluidas.',
        recommendation: 'no_recomendar',
        reasons: ['Palabras clave excluidas detectadas']
      };
    }

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

    // Devuelve el score determinista de inmediato e ignora la llamada a la IA/LLM
    if (matchedTopics.length > 0 || isTech) {
      if (isTraining) {
        if (matchedTopics.length > 0) {
          return {
            score: 95,
            insights: `🎯 Oportunidad de capacitación excelente en ${matchedTopics.join(' y ')}. Calza directamente con tus especializaciones de ProgramBi.`,
            recommendation: 'alta',
            reasons: matchedTopics
          };
        } else {
          return {
            score: 90,
            insights: `📚 Licitación de capacitación tecnológica detectada. Se alinea con tus servicios y catálogo de ProgramBi.`,
            recommendation: 'alta',
            reasons: ['Capacitación', 'Tecnología']
          };
        }
      } else {
        if (matchedTopics.length > 0) {
          return {
            score: 85,
            insights: `💻 Requerimiento técnico relacionado con ${matchedTopics.join(', ')}. Puede requerir servicios de consultoría o desarrollo.`,
            recommendation: 'alta',
            reasons: matchedTopics
          };
        } else {
          return {
            score: 0,
            insights: 'La licitación no contiene temas de programación, datos o tecnología de interés para tu empresa.',
            recommendation: 'no_recomendar',
            reasons: ['No contiene temas de TI/Programación']
          };
        }
      }
    } else {
      return {
        score: 0,
        insights: 'La licitación no contiene temas de programación, datos o tecnología de interés para tu empresa.',
        recommendation: 'no_recomendar',
        reasons: ['No contiene temas de TI/Programación']
      };
    }
  }

  const prompt = `Eres un analista experto en licitaciones públicas de Chile (ChileCompra/MercadoPúblico). 
Analiza la siguiente licitación para la empresa descrita y genera un SCORE DE RELEVANCIA PERSONALIZADO.

═══════════════════════════════════════
DATOS DE LA EMPRESA
═══════════════════════════════════════
• Razón Social: ${company.name}
• RUT: ${company.rut}
• Rubro principal: ${company.industry}
• Sub-categorías: ${company.subCategories.join(', ') || 'No especificadas'}
• Descripción: ${company.description || 'No proporcionada'}
• Especializaciones: ${company.specializations.join(', ') || 'No especificadas'}
• Productos/Servicios: ${company.productsServices.join(', ') || 'No especificados'}
• Certificaciones: ${company.certifications.join(', ') || 'Ninguna'}
• Años de experiencia: ${company.yearsExperience}
• Tamaño: ${company.employeeCount} empleados
• Contratos públicos previos: ${company.previousPublicContracts}
• Nivel de experiencia en licitaciones: ${company.experienceLevel}
• Regiones donde opera: ${company.regions.join(', ') || 'Todo Chile'}
• Rango de monto de interés: $${company.montoMin.toLocaleString()} - $${company.montoMax > 0 ? company.montoMax.toLocaleString() : 'Sin límite'} CLP

═══════════════════════════════════════
DATOS DE LA LICITACIÓN
═══════════════════════════════════════
• Código: ${codigo}
• Nombre: ${nombre}
• Descripción: ${descripcion || 'No disponible'}
• Estado: ${estado}
• Fecha de cierre: ${fechaCierre}
• Categorías detectadas: ${matchedCategories.join(', ')}

═══════════════════════════════════════
INSTRUCCIONES
═══════════════════════════════════════
Responde EXACTAMENTE en este formato JSON (sin markdown, sin backticks):
{
  "score": <número 0-100>,
  "recommendation": "<alta|media|baja|no_recomendar>",
  "insights": "<párrafo de 2-3 oraciones explicando por qué esta licitación es o no relevante para ESTA empresa específica>",
  "reasons": ["<razón 1>", "<razón 2>", "<razón 3>"]
}

Criterios de scoring:
- 90-100: Match perfecto (misma categoría, experiencia comprobada, capacidad adecuada)
- 70-89: Muy relevante (categoría relacionada, empresa tiene capacidad)
- 50-69: Moderadamente relevante (posible pero requiere esfuerzo adicional)
- 30-49: Poco relevante (categoría distante, empresa poco preparada)
- 0-29: No relevante (completamente fuera del perfil de la empresa)`;

  try {
    const response = await queryOpenRouter(
      [
        { role: 'system', content: 'Eres un analista de licitaciones. Responde SOLO con JSON válido, sin markdown ni backticks.' },
        { role: 'user', content: prompt },
      ],
      { model: SCORING_MODEL, temperature: 0.2, max_tokens: 400 }
    );

    // Parse JSON response
    const cleaned = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      score: Math.min(100, Math.max(0, parseInt(parsed.score) || 50)),
      insights: parsed.insights || 'Análisis no disponible.',
      recommendation: (['alta', 'media', 'baja', 'no_recomendar'].includes(parsed.recommendation)
        ? parsed.recommendation
        : 'media') as AIRecommendation,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
    };
  } catch (error: any) {
    console.warn(`LLM scoring failed for ${company.name} x ${codigo}:`, error.message);
    
    // Fallback: use category confidence as base score
    const fallbackScore = Math.round(categoryConfidence * 70);
    return {
      score: fallbackScore,
      insights: `Match por categoría detectado (${matchedCategories.join(', ')}). Análisis detallado de IA no disponible.`,
      recommendation: fallbackScore > 60 ? 'media' : 'baja',
      reasons: matchedCategories,
    };
  }
}
