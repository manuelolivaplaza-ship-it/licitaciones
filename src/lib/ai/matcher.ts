import { queryOpenRouter } from './openrouter';
import { Database } from '../supabase/schema';

type Company = Database['public']['Tables']['companies']['Row'];
type Licitacion = Database['public']['Tables']['licitaciones']['Row'];

interface MatchResult {
  score: number; // 0-100
  recommendation_level: 'alta' | 'media' | 'baja' | 'descartada';
  insights: string;
  matched_keywords: string[];
}

/**
 * Filtro previo para evitar usar el LLM si no hay absolutamente ninguna relación
 * entre la licitación y la empresa.
 * Se puede mejorar usando embeddings en el futuro, por ahora es búsqueda de texto simple.
 */
function preFilter(licitacion: Licitacion, company: Company): boolean {
  // Siempre lo pasamos al LLM de momento para probar la funcionalidad real,
  // En producción, aquí podríamos chequear si al menos 1 keyword coincide con el texto
  // para ahorrar dinero.
  const textToSearch = `${licitacion.nombre} ${licitacion.descripcion || ''} ${licitacion.organismo || ''}`.toLowerCase();
  
  // Si la empresa no tiene keywords, asumimos match para evaluar
  if (!company.keywords || company.keywords.length === 0) return true;

  // Si al menos una keyword de la empresa está en el texto de la licitación
  for (const kw of company.keywords) {
    if (textToSearch.includes(kw.toLowerCase())) {
      return true;
    }
  }

  return false;
}

function localHeuristicMatch(licitacion: Licitacion, company: Company): MatchResult | null {
  const nameLower = (licitacion.nombre || '').toLowerCase();
  const descLower = (licitacion.descripcion || '').toLowerCase();
  const text = `${nameLower} ${descLower}`;

  const isProgramBi = company.name?.toLowerCase().includes('programbi') || 
                      (company as any).email?.toLowerCase().includes('programbi');

  if (isProgramBi) {
    const matchedTopics: string[] = [];
    if (text.includes('power bi') || text.includes('powerbi') || text.includes('dax')) matchedTopics.push('Power BI');
    if (text.includes('sql') || text.includes('base de datos') || text.includes('relacional')) matchedTopics.push('SQL Server');
    if (text.includes('python') || text.includes('pandas') || text.includes('scripting')) matchedTopics.push('Python');
    if (text.includes('excel') || text.includes('planilla') || text.includes('office')) matchedTopics.push('Excel');
    if (text.includes('ia') || text.includes('inteligencia artificial') || text.includes('machine learning') || text.includes('aprendizaje automatico') || text.includes('aprendizaje automático')) matchedTopics.push('Inteligencia Artificial');
    if (text.includes('rpa') || text.includes('automatización') || text.includes('automate') || text.includes('flujos de trabajo')) matchedTopics.push('Automatización RPA');
    
    const isTech = text.includes('programac') || text.includes('desarrollo de software') || text.includes('desarrollo web') || text.includes('desarrollo de sistemas') || text.includes('codigo') || text.includes('código') || text.includes('informatic') || text.includes('computac') || text.includes('tecnolog') || text.includes('analitic') || text.includes('data science') || text.includes('big data') || text.includes('ciencia de datos') || text.includes('redes') || text.includes('servidores') || text.includes('ciberseguridad') || text.includes('ti') || text.includes('tic');
    const isTraining = text.includes('capacitac') || text.includes('curso') || text.includes('taller') || text.includes('formacion') || text.includes('e-learning') || text.includes('elearning') || text.includes('clase') || text.includes('charla') || text.includes('educacion') || text.includes('diplomado') || text.includes('docente') || text.includes('enseñanza') || text.includes('relator') || text.includes('relatoría');

    if (matchedTopics.length > 0 && isTraining) {
      const score = 90 + Math.min(8, matchedTopics.length * 2);
      return {
        score,
        recommendation_level: 'alta',
        insights: `🎯 Oportunidad de capacitación ideal para ProgramBi. Requiere instrucción y relatores en ${matchedTopics.join(' y ')}, lo cual está alineado perfectamente con tus cursos y certificaciones.`,
        matched_keywords: matchedTopics,
      };
    } else if (isTech && isTraining) {
      return {
        score: 80,
        recommendation_level: 'alta',
        insights: `📚 Licitación de capacitación tecnológica detectada. Se alinea con tus servicios y catálogo de ProgramBi.`,
        matched_keywords: ['Capacitación', 'Tecnología'],
      };
    } else if (matchedTopics.length > 0) {
      return {
        score: 70,
        recommendation_level: 'media',
        insights: `💻 Contrato tecnológico relacionado con ${matchedTopics.join(', ')}. Aunque no es explícitamente de capacitación, puede incluir componentes de asesoría, consultoría o desarrollo relevante.`,
        matched_keywords: matchedTopics,
      };
    } else if (isTech) {
      return {
        score: 60,
        recommendation_level: 'media',
        insights: `💻 Licitación tecnológica general detectada. Evalúa si el temario se adapta a tus cursos de ProgramBi.`,
        matched_keywords: ['Tecnología'],
      };
    } else {
      return {
        score: 0,
        recommendation_level: 'descartada',
        insights: 'La licitación no contiene temas de programación, datos o tecnología de interés para tu empresa.',
        matched_keywords: [],
      };
    }
  }
  return null;
}

export async function evaluateMatch(licitacion: Licitacion, company: Company): Promise<MatchResult> {
  // 0. Heurística local para respuestas rápidas y funcionales
  const localResult = localHeuristicMatch(licitacion, company);
  if (localResult) {
    return localResult;
  }

  // 1. Pre-filtro para no gastar API keys en licitaciones inútiles
  if (!preFilter(licitacion, company)) {
    return {
      score: 0,
      recommendation_level: 'descartada',
      insights: 'La licitación no contiene ninguna de las palabras clave de la empresa.',
      matched_keywords: [],
    };
  }

  // 2. Armar el Prompt para el LLM
  const prompt = `
Eres un analista de licitaciones experto en compras públicas de Chile (ChileCompra).
Tu objetivo es evaluar qué tan relevante es una Licitación Pública para una Empresa específica.

PERFIL DE LA EMPRESA:
- Nombre: ${company.name}
- Industria: ${company.industry}
- Palabras clave de interés: ${company.keywords?.join(', ')}

DATOS DE LA LICITACIÓN:
- Nombre: ${licitacion.nombre}
- Organismo: ${licitacion.organismo}
- Descripción: ${licitacion.descripcion}
- Monto estimado: ${licitacion.monto_estimado ? `$${licitacion.monto_estimado} CLP` : 'No especificado'}

INSTRUCCIONES:
Devuelve un objeto JSON estrictamente con la siguiente estructura, sin texto adicional:
{
  "score": <número entre 0 y 100 indicando el % de relevancia>,
  "recommendation_level": <"alta", "media", "baja", o "descartada">,
  "insights": <"Explicación en 1 o 2 oraciones de por qué esta licitación es buena o mala para la empresa">,
  "matched_keywords": [<lista de strings de las palabras clave de la empresa que se relacionan directamente con la licitación>]
}
  `.trim();

  try {
    const responseText = await queryOpenRouter([{ role: 'user', content: prompt }], {
      model: 'google/gemini-pro', // Using a fast/free model for scoring if possible, or fallback to default
      temperature: 0.1, // Baja temperatura para resultados consistentes
    });

    // Intentar extraer JSON de la respuesta (a veces el modelo incluye markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM no devolvió JSON válido');
    }

    const result = JSON.parse(jsonMatch[0]) as MatchResult;
    
    // Validar el resultado
    return {
      score: typeof result.score === 'number' ? result.score : 0,
      recommendation_level: ['alta', 'media', 'baja', 'descartada'].includes(result.recommendation_level) ? result.recommendation_level : 'baja',
      insights: result.insights || 'Sin justificación generada.',
      matched_keywords: Array.isArray(result.matched_keywords) ? result.matched_keywords : [],
    };

  } catch (error) {
    console.error('Error evaluando match con OpenRouter:', error);
    // Fallback pasivo en caso de error
    return {
      score: 50,
      recommendation_level: 'media',
      insights: 'Error al evaluar la licitación con inteligencia artificial. Se asignó un valor por defecto.',
      matched_keywords: [],
    };
  }
}
