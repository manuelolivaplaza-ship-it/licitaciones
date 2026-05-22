// ============================================================================
// LicitaHub - Core Types for Licitaciones
// Based on api.mercadopublico.cl response structure
// ============================================================================

// --- ChileCompra API Response Types ---

export interface ChileCompraApiResponse {
  Cantidad: number;
  FechaCreacion: string;
  Version: string;
  Listado: ChileCompraLicitacion[];
}

export interface ChileCompraLicitacion {
  CodigoExterno: string;
  Nombre: string;
  CodigoEstado: number;
  Descripcion: string;
  FechaCierre: string;
  FechaPublicacion: string;
  FechaInicio: string;
  FechaFinal: string;
  FechaAdjudicacion?: string;
  MontoEstimado: number;
  Moneda: string;
  Etapas: number;
  EstadoEtapas: number;
  Tipo: number;
  TipoConvocatoria: number;
  Comprador: ChileCompraComprador;
  Items: { Cantidad: number; Listado: ChileCompraItem[] };
  Adjudicacion?: ChileCompraAdjudicacion;
}

export interface ChileCompraComprador {
  CodigoOrganismo: string;
  NombreOrganismo: string;
  RutUnidad: string;
  CodigoUnidad: string;
  NombreUnidad: string;
  DireccionUnidad: string;
  ComunaUnidad: string;
  RegionUnidad: string;
  NombreContacto: string;
  CargoContacto: string;
  FonoContacto: string;
  MailContacto: string;
}

export interface ChileCompraItem {
  Correlativo: number;
  CodigoCategoria: string;
  Categoria: string;
  CodigoProducto: string;
  NombreProducto: string;
  Descripcion: string;
  UnidadMedida: string;
  Cantidad: number;
  Adjudicacion?: {
    CantidadAdjudicada: number;
    MontoUnitario: number;
    PrecioNeto: number;
    RutProveedor: string;
    NombreProveedor: string;
  };
}

export interface ChileCompraAdjudicacion {
  Tipo: number;
  Fecha: string;
  NumeroOferentes: number;
  UrlActaAdjudicacion: string;
}

// --- Application Domain Types ---

export type LicitacionEstado =
  | 'publicada'
  | 'cerrada'
  | 'desierta'
  | 'adjudicada'
  | 'revocada'
  | 'suspendida';

export const ESTADO_MAP: Record<number, LicitacionEstado> = {
  5: 'publicada',
  6: 'cerrada',
  7: 'desierta',
  8: 'adjudicada',
  18: 'revocada',
  19: 'suspendida',
};

export const ESTADO_LABELS: Record<LicitacionEstado, string> = {
  publicada: 'Publicada',
  cerrada: 'Cerrada',
  desierta: 'Desierta',
  adjudicada: 'Adjudicada',
  revocada: 'Revocada',
  suspendida: 'Suspendida',
};

export const ESTADO_COLORS: Record<LicitacionEstado, string> = {
  publicada: 'emerald',
  cerrada: 'slate',
  desierta: 'amber',
  adjudicada: 'blue',
  revocada: 'red',
  suspendida: 'orange',
};

export type LicitacionTipo = 'L1' | 'LE' | 'LP' | 'LQ' | 'LR' | 'LS' | 'CO' | 'B2' | 'H2' | 'E2' | 'CA';

export const TIPO_LABELS: Record<string, string> = {
  L1: 'Licitación Pública menor a 100 UTM',
  LE: 'Licitación Pública menor a 1000 UTM',
  LP: 'Licitación Pública mayor a 1000 UTM',
  LQ: 'Licitación Pública mayor a 2000 UTM',
  LR: 'Licitación Pública mayor a 5000 UTM',
  LS: 'Licitación Pública Servicios Especiales',
  CO: 'Compra Ágil',
  B2: 'Trato Directo',
  H2: 'Trato Directo - Alta Complejidad',
  E2: 'Trato Directo - Previa Licitación Desierta',
  CA: 'Convenio Marco',
};

export const REGIONES_CHILE = [
  { code: '01', name: 'Arica y Parinacota' },
  { code: '02', name: 'Tarapacá' },
  { code: '03', name: 'Antofagasta' },
  { code: '04', name: 'Atacama' },
  { code: '05', name: 'Coquimbo' },
  { code: '06', name: 'Valparaíso' },
  { code: '07', name: 'Metropolitana de Santiago' },
  { code: '08', name: "O'Higgins" },
  { code: '09', name: 'Maule' },
  { code: '10', name: 'Ñuble' },
  { code: '11', name: 'Biobío' },
  { code: '12', name: 'La Araucanía' },
  { code: '13', name: 'Los Ríos' },
  { code: '14', name: 'Los Lagos' },
  { code: '15', name: 'Aysén' },
  { code: '16', name: 'Magallanes' },
] as const;

export type RegionCode = (typeof REGIONES_CHILE)[number]['code'];

// --- Licitacion (app-level normalized model) ---

export interface Licitacion {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: LicitacionEstado;
  tipo: string;
  organismo: string;
  organismoCode: string;
  region: string;
  fechaPublicacion: string;
  fechaCierre: string;
  fechaAdjudicacion?: string;
  montoEstimado: number;
  moneda: string;
  items: LicitacionItem[];
  adjudicacion?: AdjudicacionInfo;
  // AI-enriched fields
  aiScore?: number;
  aiSummary?: string;
  aiKeywords?: string[];
  // Metadata
  syncedAt: string;
  createdAt: string;
}

export interface LicitacionItem {
  correlativo: number;
  codigoCategoria: string;
  categoria: string;
  codigoProducto: string;
  nombreProducto: string;
  descripcion: string;
  unidadMedida: string;
  cantidad: number;
}

export interface AdjudicacionInfo {
  tipo: number;
  fecha: string;
  numeroOferentes: number;
  urlActa: string;
}

// --- Search & Filters ---

export interface SearchFilters {
  query?: string;
  estado?: LicitacionEstado[];
  regiones?: string[];
  tipos?: string[];
  montoMin?: number;
  montoMax?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  organismos?: string[];
  categorias?: string[];
  soloRelevantes?: boolean;
  scoreMin?: number;
}

export interface SortConfig {
  field: 'relevancia' | 'fechaPublicacion' | 'fechaCierre' | 'montoEstimado' | 'aiScore';
  direction: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// --- Saved Licitaciones / Pipeline ---

export type PipelineStatus =
  | 'guardada'
  | 'en_revision'
  | 'preparando'
  | 'enviada'
  | 'ganada'
  | 'perdida';

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  guardada: 'Guardada',
  en_revision: 'En Revisión',
  preparando: 'Preparando Propuesta',
  enviada: 'Enviada',
  ganada: 'Ganada',
  perdida: 'Perdida',
};

export const PIPELINE_COLORS: Record<PipelineStatus, string> = {
  guardada: 'slate',
  en_revision: 'blue',
  preparando: 'amber',
  enviada: 'violet',
  ganada: 'emerald',
  perdida: 'red',
};

export type Priority = 'baja' | 'media' | 'alta' | 'critica';

export const PRIORITY_LABELS: Record<Priority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

export interface SavedLicitacion {
  id: string;
  organizationId: string;
  licitacionId: string;
  licitacion: Licitacion;
  status: PipelineStatus;
  notes: string;
  assignedTo?: string;
  priority: Priority;
  tags: string[];
  deadlineReminder?: string;
  createdAt: string;
}

// --- Alerts ---

export interface Alert {
  id: string;
  organizationId: string;
  name: string;
  filters: SearchFilters;
  frequency: 'instant' | 'daily' | 'weekly';
  channels: ('email' | 'push' | 'in_app')[];
  isActive: boolean;
  lastTriggeredAt?: string;
  matchCount: number;
  createdAt: string;
}

// --- Organization & User ---

export interface Organization {
  id: string;
  name: string;
  rut: string;
  industry: string;
  regions: string[];
  categories: string[];
  keywords: string[];
  minAmount?: number;
  maxAmount?: number;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface UserProfile {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  avatarUrl?: string;
  notificationPrefs: NotificationPrefs;
  createdAt: string;
}

export interface NotificationPrefs {
  newMatchesInApp: boolean;
  newMatchesEmail: boolean;
  deadlineReminders: boolean;
  weeklyDigest: boolean;
}

// --- Notifications ---

export interface Notification {
  id: string;
  organizationId: string;
  userId?: string;
  type: 'new_match' | 'deadline' | 'status_change' | 'ai_insight' | 'system';
  title: string;
  message: string;
  licitacionId?: string;
  priority: Priority;
  read: boolean;
  createdAt: string;
}

// --- Analytics ---

export interface DashboardStats {
  activasRelevantes: number;
  nuevasHoy: number;
  enPipeline: number;
  tasaExito: number;
  montoTotalPipeline: number;
  proximosCierres: Licitacion[];
  tendenciaSemanal: { semana: string; cantidad: number }[];
}
