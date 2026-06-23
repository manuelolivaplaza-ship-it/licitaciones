// ============================================================
// ChileCompra Category Matching Engine
// ============================================================
// Intelligent category extraction and matching for licitaciones
// Maps licitación text to industry categories and sub-categories.

import { INDUSTRY_CATEGORIES } from '@/types/company';

/** Category match result */
export interface CategoryMatch {
  code: string;
  name: string;
  confidence: number; // 0-1
  matchedKeywords: string[];
}

/**
 * Keywords map for each industry category.
 * Includes synonyms, abbreviations, and related terms in Spanish.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  TI: [
    'software', 'hardware', 'computador', 'computacional', 'informática', 'informático',
    'tecnología', 'tecnológico', 'sistema de información', 'plataforma digital', 'digitalización',
    'soporte ti', 'soporte técnico', 'soporte informático', 'red de datos', 'redes',
    'servidor', 'servidores', 'data center', 'cloud', 'nube', 'ciberseguridad',
    'ciberdefensa', 'antivirus', 'firewall', 'telecomunicación', 'fibra óptica',
    'internet', 'conectividad', 'wifi', 'impresora', 'notebook', 'desktop',
    'licencia de software', 'licenciamiento', 'desarrollo web', 'aplicación',
    'app', 'erp', 'crm', 'base de datos', 'programación', 'sitio web', 'página web',
    'digitalizar', 'ott', 'streaming', 'videoconferencia', 'microsoft', 'google',
    'oracle', 'sap', 'azure', 'aws', 'hosting', 'dominio', 'correo electrónico',
    'backup', 'respaldo', 'switch', 'router', 'cableado estructurado', 'ups',
    'monitoreo', 'mesa de ayuda', 'help desk', 'certificación digital', 'firma electrónica',
  ],
  CONST: [
    'construcción', 'obra', 'edificación', 'edificio', 'infraestructura',
    'pavimentación', 'camino', 'puente', 'vial', 'carretera', 'demolición',
    'remodelación', 'ampliación', 'habilitación', 'restauración',
    'hormigón', 'albañilería', 'fierro', 'estructura metálica', 'techumbre',
    'cubierta', 'impermeabilización', 'paisajismo', 'jardinería',
    'climatización', 'hvac', 'aire acondicionado', 'calefacción',
    'aislación', 'ventilación', 'alcantarillado', 'agua potable',
    'urbanización', 'loteo', 'excavación', 'movimiento de tierra',
    'diseño arquitectónico', 'planos', 'arquitectura', 'topografía',
  ],
  SALUD: [
    'salud', 'médico', 'médica', 'hospital', 'clínico', 'clínica',
    'equipamiento médico', 'insumo médico', 'insumos clínicos',
    'farmacia', 'fármaco', 'medicamento', 'vacuna', 'laboratorio',
    'imagenología', 'radiología', 'ecografía', 'resonancia', 'tomografía',
    'quirúrgico', 'cirugía', 'instrumental', 'bisturí', 'ambulancia',
    'dental', 'odontología', 'prótesis', 'ortopedia', 'rehabilitación',
    'oxígeno', 'ventilador', 'desfibrilador', 'monitor paciente',
    'esterilización', 'autoclave', 'mascarilla', 'guante', 'bata',
    'camilla', 'cama clínica', 'microscopio', 'reactivo',
  ],
  LIMP: [
    'limpieza', 'aseo', 'sanitización', 'desinfección', 'higiene',
    'servicio de aseo', 'aseo industrial', 'control de plagas', 'fumigación',
    'lavandería', 'lavado', 'residuos', 'basura', 'recolección',
    'barrido', 'aspirado', 'cristales', 'ventanas',
    'detergente', 'jabón', 'desengrasante', 'alcohol', 'cloro',
    'papel higiénico', 'toalla', 'dispensador', 'contenedor',
  ],
  ALIM: [
    'alimentación', 'alimento', 'ración', 'comida', 'catering',
    'servicio alimentario', 'casino', 'comedor', 'cocina',
    'desayuno', 'almuerzo', 'cena', 'colación', 'snack',
    'agua mineral', 'bebida', 'café', 'jugo', 'lácteo',
    'fruta', 'verdura', 'carne', 'pan', 'galleta',
    'congelado', 'refrigerado', 'vending', 'máquina expendedora',
  ],
  SEG: [
    'seguridad', 'vigilancia', 'guardia', 'custodio', 'rondín',
    'cctv', 'cámara', 'circuito cerrado', 'monitoreo',
    'control de acceso', 'torniquete', 'alarma', 'detector',
    'transporte de valores', 'blindado', 'bóveda',
    'seguridad electrónica', 'sensor', 'perímetro',
  ],
  TRANS: [
    'transporte', 'logística', 'flete', 'carga', 'despacho',
    'vehículo', 'camión', 'furgón', 'van', 'bus', 'minibús',
    'arriendo vehicular', 'leasing', 'flota', 'combustible',
    'bencina', 'diésel', 'petróleo', 'gasolina', 'lubricante',
    'mudanza', 'traslado', 'courier', 'mensajería', 'encomienda',
  ],
  EDUC: [
    'educación', 'educacional', 'educativo', 'capacitación',
    'formación', 'curso', 'taller', 'seminario', 'diplomado',
    'libro', 'texto escolar', 'material didáctico', 'lectura',
    'e-learning', 'plataforma educativa', 'aula virtual',
    'mobiliario escolar', 'pupitre', 'pizarra', 'proyector',
    'deporte', 'deportivo', 'implemento deportivo', 'gimnasio',
  ],
  CONS: [
    'consultoría', 'asesoría', 'estudio', 'ingeniería',
    'evaluación', 'diagnóstico', 'auditoría', 'inspección',
    'supervisión', 'fiscalización', 'peritaje',
    'estudio de impacto', 'ambiental', 'factibilidad',
    'financiero', 'contable', 'tributario', 'jurídico', 'legal',
    'gestión de proyectos', 'pmo', 'planificación',
  ],
  MOB: [
    'mueble', 'mobiliario', 'escritorio', 'silla', 'mesa',
    'estantería', 'archivador', 'gabinete', 'cajonera',
    'mobiliario de oficina', 'mobiliario clínico',
    'carpintería', 'señalética', 'letrero', 'señalización',
  ],
  IMP: [
    'imprenta', 'impresión', 'publicidad', 'marketing',
    'diseño gráfico', 'diagramación', 'folleto', 'afiche',
    'banner', 'pendón', 'gigantografía', 'producción audiovisual',
    'video', 'fotografía', 'evento', 'actividad conmemorativa',
    'merchandising', 'artículo promocional', 'souvenir',
    'producción de eventos', 'promoción',
  ],
  VEST: [
    'vestuario', 'uniforme', 'ropa', 'textil', 'tela',
    'calzado', 'zapato', 'bota', 'zapatilla',
    'overol', 'parka', 'chaleco', 'polera', 'pantalón',
    'epp', 'protección personal', 'casco', 'guante', 'lente',
    'protector auditivo', 'respirador', 'arnés',
  ],
  MAQEQ: [
    'maquinaria', 'equipo', 'máquina', 'herramienta',
    'generador', 'grupo electrógeno', 'compresor', 'bomba',
    'soldadora', 'taladro', 'sierra', 'esmeril',
    'laboratorio', 'instrumento', 'calibración', 'medición',
    'equipo industrial', 'montacargas', 'grúa',
  ],
  MEDIO: [
    'medio ambiente', 'ambiental', 'ecología', 'ecológico',
    'residuo', 'reciclaje', 'reutilización', 'sustentable',
    'energía renovable', 'solar', 'eólico', 'fotovoltaico',
    'tratamiento de agua', 'planta de tratamiento',
    'reforestación', 'restauración ecológica', 'biodiversidad',
    'sello verde', 'huella de carbono',
  ],
  MANT: [
    'mantención', 'mantenimiento', 'reparación', 'arreglo',
    'mantención preventiva', 'mantención correctiva',
    'eléctrico', 'electricidad', 'gasfitería', 'plomería',
    'pintura', 'barniz', 'revestimiento', 'pisos',
    'ascensor', 'escalera mecánica', 'elevador',
    'cerrajería', 'vidriería', 'cortina',
  ],
  OFC: [
    'oficina', 'papelería', 'artículo de oficina',
    'tóner', 'tinta', 'cartucho', 'impresora',
    'papel', 'cuaderno', 'lápiz', 'bolígrafo',
    'carpeta', 'archivador', 'sobre', 'clip',
  ],
  AGRO: [
    'agrícola', 'agricultura', 'ganadería', 'ganado',
    'semilla', 'fertilizante', 'plaguicida', 'herbicida',
    'riego', 'aspersión', 'goteo', 'invernadero',
    'tractor', 'cosechadora', 'veterinario', 'animal',
  ],
  ENER: [
    'energía', 'eléctrico', 'electricidad', 'electrificación',
    'panel solar', 'fotovoltaico', 'iluminación', 'led',
    'transformador', 'subestación', 'tendido eléctrico',
    'eficiencia energética', 'smart grid', 'medidor',
  ],
};

/**
 * Strict keyword boundary matching helper for Spanish.
 * Returns true only if the keyword matches as a standalone word/phrase.
 */
function matchesKeywordStrict(text: string, kw: string): boolean {
  const cleanKw = kw.toLowerCase().trim();
  if (!cleanKw) return false;
  const escaped = cleanKw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  // A word is a standalone match if it is preceded and followed by non-alphabetic Spanish characters
  const regex = new RegExp(`(^|[^a-záéíóúüñ])${escaped}([^a-záéíóúüñ]|$)`, 'i');
  return regex.test(text);
}

/**
 * Extract probable categories from a licitación name and description.
 * Returns sorted by confidence (highest first).
 */
export function extractCategories(nombre: string, descripcion?: string): CategoryMatch[] {
  const text = `${nombre} ${descripcion || ''}`.toLowerCase();
  const results: CategoryMatch[] = [];

  for (const [code, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchedKeywords: string[] = [];
    
    for (const kw of keywords) {
      if (matchesKeywordStrict(text, kw)) {
        matchedKeywords.push(kw);
      }
    }

    if (matchedKeywords.length > 0) {
      const category = INDUSTRY_CATEGORIES.find(c => c.code === code);
      if (category) {
        // Confidence based on number of keywords matched vs total available
        const confidence = Math.min(1, matchedKeywords.length / 3);
        results.push({
          code,
          name: category.name,
          confidence,
          matchedKeywords,
        });
      }
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Check if a company's profile matches a licitación by category.
 * Returns true if there's ANY overlap.
 */
export function companyCategoryMatchesLicitacion(
  companyIndustryCode: string,
  companySubCategories: string[],
  companyKeywords: string[],
  companySpecializations: string[],
  licitacionNombre: string,
  licitacionDescripcion?: string
): { matches: boolean; matchedCategories: string[]; confidence: number } {
  const licitacionCategories = extractCategories(licitacionNombre, licitacionDescripcion);
  
  if (licitacionCategories.length === 0) {
    // No category detected — do a keyword-based fallback match
    const text = `${licitacionNombre} ${licitacionDescripcion || ''}`.toLowerCase();
    const keywordMatches = companyKeywords.filter(kw => matchesKeywordStrict(text, kw));
    const specMatches = companySpecializations.filter(sp => matchesKeywordStrict(text, sp));
    
    const allMatches = [...keywordMatches, ...specMatches];
    return {
      matches: allMatches.length > 0,
      matchedCategories: allMatches,
      confidence: Math.min(1, allMatches.length / 2),
    };
  }

  // Check if company's industry code matches any detected category
  const directMatch = licitacionCategories.find(lc => lc.code === companyIndustryCode);
  
  // Check subcategories match against detected keywords
  const subcatMatches = companySubCategories.filter(sc => {
    const scLower = sc.toLowerCase();
    return licitacionCategories.some(lc => 
      lc.matchedKeywords.some(kw => kw.includes(scLower) || scLower.includes(kw))
    );
  });

  // Check company keywords
  const text = `${licitacionNombre} ${licitacionDescripcion || ''}`.toLowerCase();
  const keywordMatches = companyKeywords.filter(kw => matchesKeywordStrict(text, kw));

  const allMatched = [
    ...(directMatch ? [directMatch.name] : []),
    ...subcatMatches,
    ...keywordMatches,
  ];

  const bestConfidence = directMatch 
    ? directMatch.confidence 
    : (subcatMatches.length > 0 ? 0.6 : (keywordMatches.length > 0 ? 0.4 : 0));

  return {
    matches: allMatched.length > 0,
    matchedCategories: [...new Set(allMatched)],
    confidence: bestConfidence,
  };
}
