// ============================================================
// Company Profile & Matching Types
// ============================================================

/** Tamaño de empresa por número de empleados */
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';

/** Rango de ingresos anuales */
export type RevenueRange = 
  | 'bajo_100m'      // < $100M CLP
  | '100m_500m'      // $100M - $500M
  | '500m_1b'        // $500M - $1B
  | '1b_5b'          // $1B - $5B
  | 'sobre_5b';      // > $5B

/** Nivel de experiencia en licitaciones públicas */
export type ExperienceLevel = 'sin_experiencia' | 'principiante' | 'intermedio' | 'avanzado' | 'experto';

/** Tipos de licitación de interés */
export type TipoLicitacion = 'L1' | 'LE' | 'LP' | 'LQ' | 'LR' | 'LS' | 'CO' | 'B2' | 'E2' | 'H2' | 'I2';

/** Recomendación de la IA */
export type AIRecommendation = 'alta' | 'media' | 'baja' | 'no_recomendar';

// ============================================================
// Company Profile — Perfil extenso de empresa
// ============================================================

export interface CompanyProfile {
  id: string;

  // --- Datos básicos ---
  name: string;                      // Razón social
  rut: string;                       // RUT empresa
  email: string;                     // Email corporativo
  contactName: string;               // Nombre del contacto
  phone: string;                     // Teléfono
  passwordHash: string;              // Hash de contraseña (bcrypt-like)
  
  // --- Perfil de negocio ---
  industry: string;                  // Rubro principal
  industryCode: string;              // Código de categoría ChileCompra
  subCategories: string[];           // Sub-categorías adicionales
  description: string;               // Descripción de la empresa (qué hacen, qué ofrecen)
  specializations: string[];         // Especializaciones (ej: "cirugía laparoscópica", "redes cisco")
  productsServices: string[];        // Productos/servicios que ofrecen
  
  // --- Capacidades ---
  certifications: string[];          // ISO 9001, ISO 14001, OHSAS 18001, etc.
  yearsExperience: number;           // Años de experiencia en el rubro
  employeeCount: CompanySize;        // Tamaño de empresa
  annualRevenue: RevenueRange;       // Rango de ingresos
  previousPublicContracts: number;   // # contratos públicos completados
  experienceLevel: ExperienceLevel;  // Nivel de experiencia en licitaciones
  maxContractCapacity: number;       // Monto máximo que pueden manejar (CLP)
  
  // --- Preferencias de búsqueda ---
  keywords: string[];                // Palabras clave de interés para matching
  excludeKeywords: string[];         // Palabras clave a EXCLUIR
  regions: string[];                 // Regiones donde opera
  montoMin: number;                  // Monto mínimo de interés (CLP)
  montoMax: number;                  // Monto máximo de interés (CLP)
  tiposLicitacion: TipoLicitacion[]; // Tipos de licitación de interés
  
  // --- Configuración de alertas ---
  alertFrequency: 'instant' | 'daily' | 'weekly';
  alertMinScore: number;             // Score mínimo para alertar (0-100)
  
  // --- Metadata ---
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// ============================================================
// Company Match — Match entre licitación y empresa
// ============================================================

export interface CompanyMatch {
  id: string;
  companyId: string;
  companyName: string;
  
  // --- Datos de la licitación ---
  licitacionCodigo: string;
  licitacionNombre: string;
  licitacionEstado: string;
  licitacionFechaCierre: string;
  licitacionMontoEstimado: number;
  licitacionOrganismo?: string;
  licitacionRegion?: string;
  compradorContacto?: string;
  compradorEmail?: string;
  compradorFono?: string;
  
  // --- Scoring ---
  ruleScore: number;                 // Score por reglas determinísticas (0-100)
  aiScore: number;                   // Score semántico del LLM (0-100)
  hybridScore: number;               // Score combinado: 60% reglas + 40% IA
  
  // --- Insights del LLM ---
  aiInsights: string;                // Análisis personalizado para esta empresa
  aiRecommendation: AIRecommendation;
  aiReasons: string[];               // Razones específicas del score
  aiMatchedCategories: string[];     // Categorías que matchearon
  
  // --- Estado ---
  notified: boolean;
  viewedAt?: string;
  savedByUser: boolean;
  matchedAt: string;
}

// ============================================================
// Sync State — Estado de sincronización
// ============================================================

export interface SyncState {
  lastSyncDate: string;              // Última fecha sincronizada (ddmmyyyy)
  lastSyncTimestamp: string;         // Timestamp ISO de última sync
  totalProcessed: number;            // Total licitaciones procesadas
  totalMatched: number;              // Total que tuvieron match
  totalAiScored: number;             // Total que pasaron por LLM
  totalIgnored: number;              // Total ignoradas (sin match)
  errors: string[];                  // Errores de la última sync
  isRunning: boolean;                // ¿Sync en progreso?
  currentStep?: string;              // Descripción del paso actual
  progressPercent?: number;          // Porcentaje del progreso general (0-100)
}

// ============================================================
// Sync Result — Resultado de una sincronización
// ============================================================

export interface SyncResult {
  success: boolean;
  fecha: string;
  licitacionesFetched: number;
  matchesFound: number;
  aiScored: number;
  ignored: number;
  errors: string[];
  duration: number;                  // milisegundos
}

// ============================================================
// Registration Steps Data
// ============================================================

export interface RegistrationStep1 {
  contactName: string;
  email: string;
  password: string;
}

export interface RegistrationStep2 {
  companyName: string;
  rut: string;
  phone: string;
}

export interface RegistrationStep3 {
  industry: string;
  industryCode: string;
  subCategories: string[];
  description: string;
  specializations: string[];
  productsServices: string[];
}

export interface RegistrationStep4 {
  certifications: string[];
  yearsExperience: number;
  employeeCount: CompanySize;
  annualRevenue: RevenueRange;
  previousPublicContracts: number;
  experienceLevel: ExperienceLevel;
}

export interface RegistrationStep5 {
  keywords: string[];
  excludeKeywords: string[];
  regions: string[];
  montoMin: number;
  montoMax: number;
  tiposLicitacion: TipoLicitacion[];
}

// ============================================================
// Industry Categories (ChileCompra rubros principales)
// ============================================================

export const INDUSTRY_CATEGORIES = [
  { code: 'TI', name: 'Tecnología de la Información', subcats: ['Software', 'Hardware', 'Redes', 'Ciberseguridad', 'Cloud', 'Soporte TI', 'Desarrollo web/móvil', 'Consultoría TI', 'Data centers', 'Telecomunicaciones'] },
  { code: 'CONST', name: 'Construcción e Infraestructura', subcats: ['Edificación', 'Obras viales', 'Obras hidráulicas', 'Demolición', 'Mantención de edificios', 'Paisajismo', 'Ingeniería estructural', 'Climatización/HVAC'] },
  { code: 'SALUD', name: 'Salud y Equipamiento Médico', subcats: ['Equipos médicos', 'Insumos médicos', 'Farmacia', 'Laboratorio clínico', 'Imagenología', 'Instrumental quirúrgico', 'Ambulancias', 'Servicio dental'] },
  { code: 'LIMP', name: 'Servicios de Limpieza y Aseo', subcats: ['Aseo industrial', 'Aseo oficinas', 'Control de plagas', 'Desinfección', 'Lavandería industrial', 'Jardinería', 'Residuos'] },
  { code: 'ALIM', name: 'Alimentación y Catering', subcats: ['Raciones alimenticias', 'Catering eventos', 'Alimentación hospitalaria', 'Vending', 'Cocina industrial', 'Comedores'] },
  { code: 'SEG', name: 'Seguridad y Vigilancia', subcats: ['Guardias de seguridad', 'CCTV/Cámaras', 'Control de acceso', 'Alarmas', 'Transporte de valores', 'Seguridad electrónica'] },
  { code: 'TRANS', name: 'Transporte y Logística', subcats: ['Transporte de carga', 'Transporte de personas', 'Flota vehicular', 'Courier/Mensajería', 'Mudanzas', 'Arriendo vehículos', 'Combustible'] },
  { code: 'EDUC', name: 'Educación y Capacitación', subcats: ['Capacitación empresarial', 'Material didáctico', 'Libros', 'E-learning', 'Mobiliario escolar', 'Equipamiento deportivo escolar'] },
  { code: 'CONS', name: 'Consultoría e Ingeniería', subcats: ['Estudios de ingeniería', 'Consultoría ambiental', 'Consultoría financiera', 'Asesoría legal', 'Auditoría', 'Estudios de mercado', 'Gestión de proyectos'] },
  { code: 'MOB', name: 'Muebles y Mobiliario', subcats: ['Mobiliario de oficina', 'Mobiliario educacional', 'Mobiliario clínico', 'Carpintería', 'Señalética'] },
  { code: 'IMP', name: 'Imprenta y Publicidad', subcats: ['Imprenta offset/digital', 'Diseño gráfico', 'Marketing digital', 'Producción audiovisual', 'Eventos', 'Merchandising'] },
  { code: 'VEST', name: 'Vestuario y Textiles', subcats: ['Uniformes', 'Ropa de trabajo', 'EPP (Elementos de Protección Personal)', 'Textiles hospitalarios', 'Calzado de seguridad'] },
  { code: 'MAQEQ', name: 'Maquinaria y Equipos', subcats: ['Maquinaria pesada', 'Equipos industriales', 'Herramientas', 'Generadores', 'Equipos de laboratorio', 'Instrumentación'] },
  { code: 'MEDIO', name: 'Medio Ambiente', subcats: ['Gestión de residuos', 'Reciclaje', 'Energía renovable', 'Evaluación ambiental', 'Tratamiento de aguas', 'Reforestación'] },
  { code: 'MANT', name: 'Mantención y Reparación', subcats: ['Mantención industrial', 'Mantención de vehículos', 'Mantención eléctrica', 'Gasfitería', 'Mantención de ascensores', 'Pintura'] },
  { code: 'OFC', name: 'Material de Oficina y Papelería', subcats: ['Artículos de oficina', 'Tóner e impresión', 'Papelería', 'Suministros de impresora'] },
  { code: 'AGRO', name: 'Agricultura y Ganadería', subcats: ['Insumos agrícolas', 'Maquinaria agrícola', 'Semillas', 'Fertilizantes', 'Veterinaria', 'Riego'] },
  { code: 'ENER', name: 'Energía y Electricidad', subcats: ['Instalaciones eléctricas', 'Paneles solares', 'Suministro eléctrico', 'Eficiencia energética', 'Iluminación LED'] },
] as const;

export const CERTIFICATIONS_LIST = [
  'ISO 9001 (Gestión de Calidad)',
  'ISO 14001 (Gestión Ambiental)',
  'ISO 45001 / OHSAS 18001 (Seguridad y Salud)',
  'ISO 27001 (Seguridad de la Información)',
  'ISO 22000 (Seguridad Alimentaria)',
  'NCh 2728 (Gestión de Calidad Chile)',
  'Certificación Sello Verde',
  'Certificación ChileCompra Proveedor',
  'Registro de Proveedores del Estado',
  'Certificación Empresa B',
  'LEED (Construcción Sustentable)',
  'Certificación HACCP',
  'Licencia SEC (Superintendencia de Electricidad)',
  'Inscripción Registro MINVU',
  'Certificación SAG',
] as const;

export const TIPOS_LICITACION_LABELS: Record<TipoLicitacion, string> = {
  L1: 'Licitación Pública < 100 UTM',
  LE: 'Licitación Pública 100–1000 UTM',
  LP: 'Licitación Pública > 1000 UTM',
  LQ: 'Licitación Pública > 2000 UTM',
  LR: 'Licitación Pública > 5000 UTM',
  LS: 'Licitación de Servicios Personales',
  CO: 'Compra Ágil',
  B2: 'Compra por Convenio Marco',
  E2: 'Licitación Privada',
  H2: 'Compra Directa',
  I2: 'Licitación Innovación',
};
