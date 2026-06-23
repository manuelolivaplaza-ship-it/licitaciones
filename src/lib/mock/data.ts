// ============================================================================
// LicitaHub - Realistic Mock Data Generator
// Generates 200+ realistic Chilean public procurement tenders
// ============================================================================

import type { Licitacion, LicitacionEstado, Notification, DashboardStats, SavedLicitacion, Priority, PipelineStatus, Alert } from '@/types';

const ORGANISMOS = [
  { code: '6530', name: 'Hospital Clínico Universidad de Chile', region: 'Metropolitana de Santiago' },
  { code: '7710', name: 'Municipalidad de Santiago', region: 'Metropolitana de Santiago' },
  { code: '8230', name: 'Ministerio de Obras Públicas', region: 'Metropolitana de Santiago' },
  { code: '2175', name: 'Servicio de Salud Valparaíso - San Antonio', region: 'Valparaíso' },
  { code: '3340', name: 'Municipalidad de Viña del Mar', region: 'Valparaíso' },
  { code: '4510', name: 'Universidad de Concepción', region: 'Biobío' },
  { code: '1120', name: 'Carabineros de Chile', region: 'Metropolitana de Santiago' },
  { code: '5660', name: 'Ejército de Chile', region: 'Metropolitana de Santiago' },
  { code: '9010', name: 'Corporación Nacional Forestal - CONAF', region: 'Metropolitana de Santiago' },
  { code: '1540', name: 'Servicio Nacional de Aduanas', region: 'Valparaíso' },
  { code: '2290', name: 'Hospital Regional de Antofagasta', region: 'Antofagasta' },
  { code: '3450', name: 'Municipalidad de Temuco', region: 'La Araucanía' },
  { code: '4620', name: 'Gobierno Regional de Atacama', region: 'Atacama' },
  { code: '5780', name: 'Dirección General de Aguas', region: 'Metropolitana de Santiago' },
  { code: '6890', name: 'JUNAEB', region: 'Metropolitana de Santiago' },
  { code: '7400', name: 'Servicio de Salud Araucanía Sur', region: 'La Araucanía' },
  { code: '8510', name: 'Municipalidad de La Serena', region: 'Coquimbo' },
  { code: '9200', name: 'Ministerio de Educación', region: 'Metropolitana de Santiago' },
  { code: '1050', name: 'Policía de Investigaciones', region: 'Metropolitana de Santiago' },
  { code: '2360', name: 'Hospital Base de Valdivia', region: 'Los Ríos' },
  { code: '3570', name: 'Municipalidad de Puerto Montt', region: 'Los Lagos' },
  { code: '4680', name: 'SERNAGEOMIN', region: 'Metropolitana de Santiago' },
  { code: '5830', name: 'Dirección de Vialidad', region: 'Metropolitana de Santiago' },
  { code: '6940', name: 'Servicio de Registro Civil', region: 'Metropolitana de Santiago' },
  { code: '7500', name: 'Corporación de Asistencia Judicial', region: 'Metropolitana de Santiago' },
  { code: '8620', name: 'Municipalidad de Iquique', region: 'Tarapacá' },
  { code: '9310', name: 'Ministerio de Salud', region: 'Metropolitana de Santiago' },
  { code: '1160', name: 'Gendarmería de Chile', region: 'Metropolitana de Santiago' },
  { code: '2470', name: 'Hospital de Coquimbo', region: 'Coquimbo' },
  { code: '3680', name: 'Municipalidad de Rancagua', region: "O'Higgins" },
];

const NOMBRES_LICITACIONES = [
  'Adquisición de Equipamiento Médico para Unidad de Cuidados Intensivos',
  'Servicio de Mantención y Reparación de Vehículos Institucionales',
  'Construcción de Infraestructura Deportiva Municipal',
  'Suministro de Insumos de Oficina y Papelería',
  'Servicio de Aseo y Limpieza para Dependencias Institucionales',
  'Adquisición de Mobiliario Escolar para Establecimientos Educacionales',
  'Contratación de Servicio de Vigilancia y Seguridad Privada',
  'Mejoramiento de Red de Agua Potable Rural',
  'Adquisición de Equipos Computacionales y Periféricos',
  'Servicio de Alimentación para Programa de Alimentación Escolar',
  'Construcción de Pavimentación y Obras Viales',
  'Adquisición de Medicamentos e Insumos Farmacéuticos',
  'Servicio de Consultoría en Tecnologías de la Información',
  'Habilitación de Oficinas y Espacios de Trabajo',
  'Adquisición de Vestuario Institucional y Uniformes',
  'Servicio de Transporte de Personal',
  'Instalación de Sistema de Cámaras de Seguridad',
  'Adquisición de Maquinaria Pesada para Obras Públicas',
  'Servicio de Capacitación y Formación Profesional',
  'Remodelación y Ampliación de Centro de Salud',
  'Adquisición de Software de Gestión Administrativa',
  'Servicio de Recolección y Disposición de Residuos',
  'Construcción de Centro Comunitario Vecinal',
  'Adquisición de Instrumental Quirúrgico Especializado',
  'Servicio de Mantenimiento de Áreas Verdes',
  'Diseño e Implementación de Plataforma Digital',
  'Adquisición de Ambulancias Equipadas',
  'Servicio de Auditoría Externa y Compliance',
  'Construcción de Puente Vehicular y Peatonal',
  'Adquisición de Equipos de Telecomunicaciones',
  'Servicio de Ingeniería Estructural y Geotécnica',
  'Mejoramiento de Sistema de Iluminación Pública',
  'Adquisición de Material Didáctico y Educativo',
  'Servicio de Desarrollo de Aplicaciones Móviles',
  'Construcción de Sistema de Alcantarillado',
  'Adquisición de Equipos de Laboratorio Clínico',
  'Servicio de Marketing Digital y Comunicación',
  'Rehabilitación de Edificio Patrimonial',
  'Adquisición de Equipos de Protección Personal',
  'Servicio de Soporte Técnico TI 24/7',
  'Implementación de Sistema de Energía Solar Fotovoltaica',
  'Adquisición de Vehículos para Operaciones',
  'Servicio de Consultoría Ambiental',
  'Construcción de Planta de Tratamiento de Aguas',
  'Adquisición de Equipamiento para Cocina Industrial',
  'Servicio de Gestión Documental y Archivo',
  'Modernización de Red de Datos y Conectividad',
  'Adquisición de Insumos Médicos Desechables',
  'Servicio de Diseño Arquitectónico',
  'Construcción de Ciclovías y Espacios Públicos',
];

const DESCRIPCIONES_COMPLEMENTO = [
  'Se requiere proveedor con experiencia comprobada en el rubro. Incluye instalación, capacitación y garantía mínima de 24 meses.',
  'Proceso contempla evaluación técnica y económica. Se privilegiará la calidad del servicio y cumplimiento de plazos.',
  'La presente licitación busca contratar servicios profesionales de alta calidad para satisfacer las necesidades institucionales.',
  'Se requiere cumplimiento estricto de normativas vigentes. Incluye supervisión técnica durante toda la ejecución.',
  'Contratación orientada a mejorar la eficiencia operacional. Se valorará la innovación tecnológica en las propuestas.',
  'Proceso abierto a todos los proveedores inscritos en ChileCompra. Visita a terreno obligatoria antes de ofertar.',
  'Se requiere certificación ISO y experiencia mínima de 3 años en proyectos similares.',
  'Incluye fase de prueba piloto de 30 días. Adjudicación sujeta a disponibilidad presupuestaria.',
];

const CATEGORIAS = [
  { code: '42000000', name: 'Equipamiento médico' },
  { code: '43000000', name: 'Tecnología de la información' },
  { code: '72000000', name: 'Servicios de construcción' },
  { code: '80000000', name: 'Servicios de gestión' },
  { code: '44000000', name: 'Equipamiento de oficina' },
  { code: '25000000', name: 'Vehículos y transporte' },
  { code: '56000000', name: 'Muebles y mobiliario' },
  { code: '76000000', name: 'Servicios de limpieza' },
  { code: '51000000', name: 'Medicamentos' },
  { code: '46000000', name: 'Seguridad y defensa' },
  { code: '81000000', name: 'Ingeniería y consultoría' },
  { code: '86000000', name: 'Educación y capacitación' },
  { code: '50000000', name: 'Alimentos y bebidas' },
  { code: '39000000', name: 'Iluminación y electricidad' },
  { code: '73000000', name: 'Servicios de producción industrial' },
];

const TIPOS_LICITACION = ['L1', 'LE', 'LP', 'LQ', 'LR', 'CO', 'B2'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateCodigo(index: number): string {
  const org = randomInt(1000, 9999);
  const seq = index + 1;
  const tipo = randomElement(['LP', 'LE', 'L1', 'LQ', 'CO', 'B2']);
  const year = '26';
  return `${org}-${seq}-${tipo}${year}`;
}

function generateItems(count: number): import('@/types').LicitacionItem[] {
  const items = [];
  for (let i = 0; i < count; i++) {
    const cat = randomElement(CATEGORIAS);
    items.push({
      correlativo: i + 1,
      codigoCategoria: cat.code,
      categoria: cat.name,
      codigoProducto: `${cat.code.slice(0, 4)}${randomInt(1000, 9999)}`,
      nombreProducto: cat.name,
      descripcion: `Ítem ${i + 1}: ${cat.name} según especificaciones técnicas`,
      unidadMedida: randomElement(['Unidad', 'Kit', 'Servicio', 'Metro', 'Kilogramo', 'Litro', 'Global']),
      cantidad: randomInt(1, 500),
    });
  }
  return items;
}

function generateEstado(): LicitacionEstado {
  const r = Math.random();
  if (r < 0.45) return 'publicada';
  if (r < 0.65) return 'cerrada';
  if (r < 0.85) return 'adjudicada';
  if (r < 0.92) return 'desierta';
  if (r < 0.96) return 'revocada';
  return 'suspendida';
}

export function generateMockLicitaciones(count: number = 250): Licitacion[] {
  const licitaciones: Licitacion[] = [];
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const twoMonthsFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Inyectar licitaciones específicas para ProgramBi.com
  const programbiTenders: Licitacion[] = [
    {
      id: 'lic-pbi-001',
      codigo: '1250-45-LP26',
      nombre: 'Servicio de Capacitación en Power BI y Análisis de Datos para Dirección del Trabajo',
      descripcion: 'Se solicita la contratación de un servicio técnico de capacitación avanzada en modelamiento de datos con Power BI y SQL Server, en modalidad e-learning (clases sincrónicas) para personal administrativo de la Dirección del Trabajo.',
      estado: 'publicada',
      tipo: 'LP',
      organismo: 'Dirección del Trabajo',
      organismoCode: '1250',
      region: 'Metropolitana de Santiago',
      fechaPublicacion: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      fechaCierre: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      montoEstimado: 25000000,
      moneda: 'CLP',
      items: [
        {
          correlativo: 1,
          codigoCategoria: '86000000',
          categoria: 'Educación y capacitación',
          codigoProducto: '86121501',
          nombreProducto: 'Capacitación en Software de BI',
          descripcion: 'Curso de Power BI y DAX intermedio-avanzado',
          unidadMedida: 'Servicio',
          cantidad: 1
        }
      ],
      aiScore: 96,
      aiInsights: '🎯 Excelente oportunidad. El requerimiento solicita capacitaciones avanzadas en Power BI y SQL Server, que constituye el núcleo de la oferta de ProgramBi. Cumple con la certificación NCh 2728 requerida.',
      aiKeywords: ['Power BI', 'SQL Server', 'Capacitación', 'E-learning'],
      syncedAt: now.toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'lic-pbi-002',
      codigo: '7710-108-LE26',
      nombre: 'Taller de Programación en Python y Automatización de Procesos RPA para CORFO',
      descripcion: 'Desarrollo e impartición de taller práctico de programación en Python orientado a la automatización de procesos internos y flujos de trabajo RPA mediante scripts y Power Automate para profesionales de CORFO.',
      estado: 'publicada',
      tipo: 'LE',
      organismo: 'Corporación de Fomento de la Producción - CORFO',
      organismoCode: '7710',
      region: 'Metropolitana de Santiago',
      fechaPublicacion: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      fechaCierre: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      montoEstimado: 18000000,
      moneda: 'CLP',
      items: [
        {
          correlativo: 1,
          codigoCategoria: '86000000',
          categoria: 'Educación y capacitación',
          codigoProducto: '86121502',
          nombreProducto: 'Cursos de lenguajes de programación',
          descripcion: 'Taller práctico de desarrollo y scripting en Python',
          unidadMedida: 'Servicio',
          cantidad: 1
        }
      ],
      aiScore: 94,
      aiInsights: '🎯 Match de alta prioridad. CORFO licita capacitación técnica en Python y automatización RPA (Power Automate). Se alinea con tus especializaciones clave de cursos y consultoría local.',
      aiKeywords: ['Python', 'Power Automate', 'Automatización', 'RPA'],
      syncedAt: now.toISOString(),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'lic-pbi-003',
      codigo: '2290-88-LP26',
      nombre: 'Curso de SQL Server y Big Data para Analistas de Gestión de CODELCO',
      descripcion: 'Servicio de capacitación y entrenamiento presencial en bases de datos relacionales SQL Server, extracción de información, ETL y fundamentos de Big Data aplicados al análisis operativo en faenas mineras para analistas de Codelco Distrito Norte.',
      estado: 'publicada',
      tipo: 'LP',
      organismo: 'CODELCO Chile - División Chuquicamata',
      organismoCode: '2290',
      region: 'Antofagasta',
      fechaPublicacion: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      fechaCierre: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      montoEstimado: 45000000,
      moneda: 'CLP',
      items: [
        {
          correlativo: 1,
          codigoCategoria: '86000000',
          categoria: 'Educación y capacitación',
          codigoProducto: '86121503',
          nombreProducto: 'Capacitación en bases de datos',
          descripcion: 'Curso SQL Server intermedio y analítica de datos',
          unidadMedida: 'Servicio',
          cantidad: 1
        }
      ],
      aiScore: 98,
      aiInsights: '🎯 Match perfecto. Licitación corporativa de Codelco para entrenar a sus analistas en SQL Server y Big Data. Encaja directamente con tu especialización en Analítica Minera y consultoría de datos.',
      aiKeywords: ['SQL Server', 'Big Data', 'Minería', 'Analítica'],
      syncedAt: now.toISOString(),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'lic-pbi-004',
      codigo: '9200-244-LP26',
      nombre: 'Plataforma E-Learning y Curso de Excel Avanzado y Analítica para el SENCE',
      descripcion: 'Licitación pública para proveer el diseño y licenciamiento de una plataforma e-learning autoinstruccional y el material pedagógico para impartir cursos de Excel avanzado y análisis de datos aplicados a la gestión para 500 postulantes a nivel nacional.',
      estado: 'publicada',
      tipo: 'LP',
      organismo: 'Servicio Nacional de Capacitación y Empleo - SENCE',
      organismoCode: '9200',
      region: 'Valparaíso',
      fechaPublicacion: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      fechaCierre: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      montoEstimado: 35000000,
      moneda: 'CLP',
      items: [
        {
          correlativo: 1,
          codigoCategoria: '86000000',
          categoria: 'Educación y capacitación',
          codigoProducto: '86121504',
          nombreProducto: 'Servicio de capacitación online',
          descripcion: 'Suministro de plataforma e-learning y cursos de Excel',
          unidadMedida: 'Servicio',
          cantidad: 1
        }
      ],
      aiScore: 92,
      aiInsights: '🎯 Match de alta prioridad. SENCE requiere plataforma e-learning y cursos de Excel intermedio y avanzado con analítica. ProgramBi ofrece cursos premium online y cuenta con infraestructura para responder a este llamado.',
      aiKeywords: ['Excel Avanzado', 'E-learning', 'SENCE', 'Plataforma'],
      syncedAt: now.toISOString(),
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'lic-pbi-005',
      codigo: '4620-12-LE26',
      nombre: 'Servicio de Asesoría en Inteligencia Artificial y Machine Learning para GORE Atacama',
      descripcion: 'Contratación de un servicio de consultoría avanzada para la evaluación, diseño e implementación piloto de herramientas de Inteligencia Artificial (IA) y modelos predictivos (Machine Learning) para la optimización de procesos internos del Gobierno Regional.',
      estado: 'publicada',
      tipo: 'LE',
      organismo: 'Gobierno Regional de Atacama',
      organismoCode: '4620',
      region: 'Atacama',
      fechaPublicacion: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      fechaCierre: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      montoEstimado: 60000000,
      moneda: 'CLP',
      items: [
        {
          correlativo: 1,
          codigoCategoria: '81101508',
          categoria: 'Ingeniería y consultoría',
          codigoProducto: '81101508',
          nombreProducto: 'Consultoría en IA',
          descripcion: 'Servicio de consultoría y diseño de soluciones basadas en IA',
          unidadMedida: 'Servicio',
          cantidad: 1
        }
      ],
      aiScore: 89,
      aiInsights: '🎯 Alta relevancia. Licitación para la consultoría e implementación de soluciones basadas en Inteligencia Artificial. Ideal para aplicar tus servicios de asesoría avanzada y desarrollo en IA.',
      aiKeywords: ['Inteligencia Artificial', 'Consultoría', 'Machine Learning', 'Modelos Predictivos'],
      syncedAt: now.toISOString(),
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'lic-pbi-006',
      codigo: '6940-39-CO26',
      nombre: 'Capacitación en Power Automate y Automatización de Procesos Administrativos',
      descripcion: 'Compra Ágil para dictar curso taller de Power Automate sincrónico a personal de TI y jefes de unidad, enfocado a la creación de flujos automatizados de tareas y correos institucionales.',
      estado: 'publicada',
      tipo: 'CO',
      organismo: 'Servicio de Registro Civil e Identificación',
      organismoCode: '6940',
      region: 'Metropolitana de Santiago',
      fechaPublicacion: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      fechaCierre: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      montoEstimado: 3500000,
      moneda: 'CLP',
      items: [
        {
          correlativo: 1,
          codigoCategoria: '86000000',
          categoria: 'Educación y capacitación',
          codigoProducto: '86121500',
          nombreProducto: 'Capacitación informática',
          descripcion: 'Curso práctico sincrónico de Power Automate de 20 horas cronológicas',
          unidadMedida: 'Unidad',
          cantidad: 1
        }
      ],
      aiScore: 91,
      aiInsights: '🎯 Relevancia sobresaliente. Capacitación de personal en automatizaciones de flujos con Power Automate. ProgramBi tiene instructores especializados listos para este taller con baja fricción (Compra Ágil).',
      aiKeywords: ['Power Automate', 'Automatización', 'Compra Ágil', 'Registro Civil'],
      syncedAt: now.toISOString(),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  licitaciones.push(...programbiTenders);

  // Generar las restantes
  for (let i = 0; i < count - programbiTenders.length; i++) {
    const organismo = randomElement(ORGANISMOS);
    const estado = generateEstado();
    const fechaPublicacion = randomDate(threeMonthsAgo, now);
    const fechaCierre = estado === 'publicada'
      ? randomDate(now, twoMonthsFromNow)
      : randomDate(fechaPublicacion, now);
    const monto = randomElement([
      randomInt(500000, 5000000),       // < 5M (pequeña)
      randomInt(5000000, 50000000),     // 5M-50M (mediana)
      randomInt(50000000, 500000000),   // 50M-500M (grande)
      randomInt(500000000, 5000000000), // 500M-5B (mega)
    ]);

    const nombre = randomElement(NOMBRES_LICITACIONES);
    const desc = randomElement(DESCRIPCIONES_COMPLEMENTO);
    const aiScore = randomInt(15, 98);

    licitaciones.push({
      id: `lic-${String(i + 1).padStart(4, '0')}`,
      codigo: generateCodigo(i),
      nombre,
      descripcion: `${nombre}. ${desc}`,
      estado,
      tipo: randomElement(TIPOS_LICITACION),
      organismo: organismo.name,
      organismoCode: organismo.code,
      region: organismo.region,
      fechaPublicacion: fechaPublicacion.toISOString(),
      fechaCierre: fechaCierre.toISOString(),
      fechaAdjudicacion: estado === 'adjudicada'
        ? randomDate(fechaCierre, now).toISOString()
        : undefined,
      montoEstimado: monto,
      moneda: 'CLP',
      items: generateItems(randomInt(1, 8)),
      adjudicacion: estado === 'adjudicada' ? {
        tipo: 1,
        fecha: randomDate(fechaCierre, now).toISOString(),
        numeroOferentes: randomInt(1, 15),
        urlActa: '#',
      } : undefined,
      aiScore,
      aiInsights: aiScore > 70
        ? `🎯 Alta relevancia: Esta licitación coincide con ${randomInt(3, 7)} de tus criterios clave. ${nombre.includes('Equip') ? 'El equipamiento solicitado está en tu rubro principal.' : 'El servicio requerido se alinea con tu experiencia.'} Monto estimado atractivo para tu segmento.`
        : aiScore > 40
          ? `📊 Relevancia media: Coincide parcialmente con tu perfil. Revisa los requisitos técnicos específicos antes de decidir participar.`
          : `ℹ️ Baja relevancia: Esta licitación tiene poca coincidencia con tu perfil actual. Considera solo si deseas expandir tu cartera.`,
      aiKeywords: [
        randomElement(['equipamiento', 'servicio', 'construcción', 'consultoría', 'suministro']),
        randomElement(['médico', 'tecnológico', 'educacional', 'industrial', 'ambiental']),
        randomElement(['instalación', 'mantenimiento', 'adquisición', 'diseño', 'implementación']),
      ],
      syncedAt: now.toISOString(),
      createdAt: fechaPublicacion.toISOString(),
    });
  }

  // Sort by AI score descending for default view
  return licitaciones.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
}

// --- Mock Notifications ---

export function generateMockNotifications(): Notification[] {
  const now = new Date();
  return [
    {
      id: 'notif-001',
      organizationId: 'org-001',
      type: 'new_match',
      title: '🎯 Nueva licitación de alta relevancia',
      message: 'Adquisición de Equipamiento Médico - Hospital Clínico U. de Chile. Score: 95/100',
      licitacionId: 'lic-0001',
      priority: 'alta',
      read: false,
      createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-002',
      organizationId: 'org-001',
      type: 'deadline',
      title: '⏰ Cierre en 24 horas',
      message: 'La licitación "Servicio de Consultoría TI" cierra mañana a las 15:00.',
      licitacionId: 'lic-0005',
      priority: 'critica',
      read: false,
      createdAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-003',
      organizationId: 'org-001',
      type: 'new_match',
      title: '📋 3 nuevas licitaciones relevantes',
      message: 'Se encontraron 3 licitaciones nuevas que coinciden con tus alertas configuradas.',
      priority: 'media',
      read: false,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-004',
      organizationId: 'org-001',
      type: 'status_change',
      title: '🔄 Cambio de estado',
      message: 'La licitación "Construcción Centro Comunitario" fue adjudicada.',
      licitacionId: 'lic-0012',
      priority: 'media',
      read: true,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-005',
      organizationId: 'org-001',
      type: 'ai_insight',
      title: '🤖 Insight de IA',
      message: 'Detectamos un aumento del 40% en licitaciones de tecnología en la Región Metropolitana esta semana.',
      priority: 'baja',
      read: true,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-006',
      organizationId: 'org-001',
      type: 'new_match',
      title: '🎯 Licitación relevante detectada',
      message: 'Servicio de Desarrollo de Aplicaciones Móviles - Ministerio de Educación. Score: 88/100',
      licitacionId: 'lic-0003',
      priority: 'alta',
      read: true,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

// --- Mock Dashboard Stats ---

export function generateMockDashboardStats(licitaciones: Licitacion[]): DashboardStats {
  const activas = licitaciones.filter(l => l.estado === 'publicada');
  const relevantes = activas.filter(l => (l.aiScore || 0) >= 60);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const nuevasHoy = licitaciones.filter(l => {
    const pub = new Date(l.fechaPublicacion);
    pub.setHours(0, 0, 0, 0);
    return pub.getTime() === hoy.getTime();
  }).length;

  const proximosCierres = activas
    .filter(l => {
      const cierre = new Date(l.fechaCierre);
      const diff = cierre.getTime() - Date.now();
      return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(a.fechaCierre).getTime() - new Date(b.fechaCierre).getTime())
    .slice(0, 5);

  // Generate weekly trend
  const tendencia = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    tendencia.push({
      semana: weekLabel,
      cantidad: randomInt(20, 85),
    });
  }

  return {
    activasRelevantes: relevantes.length,
    nuevasHoy: nuevasHoy || randomInt(5, 25),
    enPipeline: randomInt(8, 24),
    tasaExito: randomInt(15, 45) / 100,
    montoTotalPipeline: randomInt(100000000, 2000000000),
    proximosCierres,
    tendenciaSemanal: tendencia,
  };
}

// --- Mock Saved Licitaciones ---

export function generateMockSavedLicitaciones(licitaciones: Licitacion[]): SavedLicitacion[] {
  const statuses: PipelineStatus[] = ['guardada', 'en_revision', 'preparando', 'enviada', 'ganada', 'perdida'];
  const priorities: Priority[] = ['baja', 'media', 'alta', 'critica'];
  
  return licitaciones.slice(0, 18).map((lic, i) => ({
    id: `saved-${String(i + 1).padStart(3, '0')}`,
    organizationId: 'org-001',
    licitacionId: lic.id,
    licitacion: lic,
    status: statuses[i % statuses.length],
    notes: i % 3 === 0 ? 'Revisar requisitos técnicos antes de preparar propuesta' : '',
    priority: priorities[i % priorities.length],
    tags: [randomElement(['urgente', 'TI', 'salud', 'educación', 'construcción', 'consultoría'])],
    createdAt: lic.createdAt,
  }));
}

// --- Mock Alerts ---

export function generateMockAlerts(): Alert[] {
  return [
    {
      id: 'alert-001',
      organizationId: 'org-001',
      name: 'Equipamiento Médico - RM',
      filters: {
        query: 'equipamiento médico',
        regiones: ['Metropolitana de Santiago'],
        montoMin: 10000000,
      },
      frequency: 'instant',
      channels: ['in_app'],
      isActive: true,
      matchCount: 12,
      lastTriggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-002',
      organizationId: 'org-001',
      name: 'Tecnología > $50M Nacional',
      filters: {
        query: 'software tecnología plataforma',
        montoMin: 50000000,
      },
      frequency: 'instant',
      channels: ['in_app'],
      isActive: true,
      matchCount: 8,
      lastTriggeredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-003',
      organizationId: 'org-001',
      name: 'Consultoría en todas las regiones',
      filters: {
        query: 'consultoría asesoría',
      },
      frequency: 'daily',
      channels: ['in_app'],
      isActive: true,
      matchCount: 23,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-004',
      organizationId: 'org-001',
      name: 'Construcción Zona Sur',
      filters: {
        query: 'construcción obra',
        regiones: ['Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos'],
        montoMin: 100000000,
      },
      frequency: 'daily',
      channels: ['in_app'],
      isActive: false,
      matchCount: 5,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

// Singleton cached data
let _cachedLicitaciones: Licitacion[] | null = null;

export function getMockLicitaciones(): Licitacion[] {
  if (!_cachedLicitaciones) {
    _cachedLicitaciones = generateMockLicitaciones(250);
  }
  return _cachedLicitaciones;
}
