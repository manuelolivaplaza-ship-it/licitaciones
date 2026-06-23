'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Package,
  Shield,
  MessageSquare,
  Sparkles,
  BookmarkPlus,
  Share2,
  ExternalLink,
  Copy,
  CheckCircle2,
  TrendingUp,
  Send,
  ChevronRight,
  ClipboardList,
  Loader2,
  Mail,
  Phone,
  User,
  Briefcase,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/ui/score-ring';
import { cn, formatCLP, formatDate, formatDateRelative } from '@/lib/utils';
import { ESTADO_LABELS, TIPO_LABELS } from '@/types';
import type { Licitacion, LicitacionEstado } from '@/types';
import type { AIRequirement, AIRiskAnalysis } from '@/lib/ai/analysis';
import { getMockLicitaciones } from '@/lib/mock/data';

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: FileText },
  { id: 'items', label: 'Ítems', icon: Package },
  { id: 'analisis', label: 'Análisis IA', icon: Sparkles },
  { id: 'chat', label: 'Chat IA', icon: MessageSquare },
  { id: 'propuesta', label: 'Propuesta IA', icon: ClipboardList },
] as const;

type TabId = (typeof TABS)[number]['id'];

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-primary/60 last:border-0 text-left">
      {Icon && <Icon className="h-4 w-4 text-sidebar-active-border mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-text-light uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xs font-medium text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}

// --- Chat Message Component ---
function ChatMessage({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  return (
    <div className={cn('flex gap-3 animate-fade-in', role === 'user' ? 'flex-row-reverse' : '')}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold shadow-sm border border-border-primary',
        role === 'user'
          ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
          : 'bg-slate-100 dark:bg-white/5 text-text-secondary'
      )}>
        {role === 'user' ? 'TÚ' : 'IA'}
      </div>
      <div className={cn(
        'max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm font-normal text-left',
        role === 'user'
          ? 'bg-accent-600 text-white rounded-tr-sm'
          : 'bg-white/60 dark:bg-white/[0.01] text-text-primary border border-border-primary/80 rounded-tl-sm'
      )}>
        {content}
      </div>
    </div>
  );
}

// --- Proposal Templates and Checklist ---
const COMPANY_PROFILE = {
  name: 'TechSoluciones Chile Ltda.',
  rut: '76.543.210-K',
  address: 'Av. Providencia 1250, Of. 401, Santiago',
  representative: 'Manuel Rodríguez',
  repRut: '15.654.321-0',
  email: 'manuel@techsoluciones.cl',
  phone: '+56 2 2345 6789'
};

const CHECKLIST_ITEMS = [
  { id: 'seriedad', category: 'Administrativo', name: 'Garantía de Seriedad de la Oferta', desc: 'Boleta de garantía bancaria o póliza de seguro equivalente al monto solicitado.' },
  { id: 'anexo1', category: 'Administrativo', name: 'Anexo N° 1 — Identificación del Oferente', desc: 'Formulario estándar pre-llenado firmado por representante legal.' },
  { id: 'declaracion', category: 'Administrativo', name: 'Declaración Jurada de Incompatibilidad', desc: 'Declaración simple firmada indicando no estar afecto a inhabilidades.' },
  { id: 'anexo2', category: 'Técnico', name: 'Anexo N° 2 — Oferta Técnica detallada', desc: 'Documento que detalla el cumplimiento de las especificaciones técnicas solicitadas.' },
  { id: 'referencias', category: 'Técnico', name: 'Certificados de Experiencia / Referencias', desc: 'Copias de facturas, contratos o actas de recepción de clientes anteriores.' },
  { id: 'anexo3', category: 'Económico', name: 'Anexo N° 3 — Oferta Económica', desc: 'Desglose detallado de precios unitarios e impuestos ingresado al portal.' },
];

function getCartaPresentacion(lic: Licitacion) {
  const todayStr = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  return `Santiago, ${todayStr}

Señores
${lic.organismo || 'Organismo Comprador'}
Presente

Ref: Presentación de Oferta - Licitación ID: ${lic.codigo}
Proyecto: "${lic.nombre}"

De nuestra consideración:

Por medio de la presente, ${COMPANY_PROFILE.name}, representada por don ${COMPANY_PROFILE.representative}, manifiesta su formal interés y presenta su oferta técnica y económica para participar en la licitación pública del rubro, identificada con el ID ${lic.codigo}, cuyo objeto es "${lic.nombre}".

Declaramos conocer y aceptar en su totalidad las Bases Administrativas y Técnicas que rigen este proceso de contratación. Asimismo, certificamos que nuestra empresa cuenta con la capacidad técnica, operacional y financiera requerida para la correcta ejecución del servicio y/o entrega de los bienes licitados, de acuerdo a las especificaciones técnicas estipuladas.

Adjuntamos a esta postulación todos los antecedentes administrativos, técnicos y económicos solicitados, incluyendo la garantía de seriedad de la oferta respectiva.

Sin otro particular, saluda atentamente a ustedes,

${COMPANY_PROFILE.representative}
Representante Legal
${COMPANY_PROFILE.name}
RUT: ${COMPANY_PROFILE.rut}
Email: ${COMPANY_PROFILE.email}`;
}

function getDeclaracionJurada(lic: Licitacion) {
  return `DECLARACIÓN JURADA SIMPLE
DECLARACIÓN DE INCOMPATIBILIDADES Y CUMPLIMIENTO DE BASES

Yo, ${COMPANY_PROFILE.representative}, Cédula de Identidad N° ${COMPANY_PROFILE.repRut}, en representación legal de la empresa ${COMPANY_PROFILE.name}, RUT N° ${COMPANY_PROFILE.rut}, ambos domiciliados para estos efectos en ${COMPANY_PROFILE.address}, declaro bajo juramento lo siguiente:

1. Que mi representada no registra saldos insolutos de remuneraciones o cotizaciones de seguridad social con sus actuales trabajadores ni con trabajadores contratados en los últimos dos años.
2. Que la empresa que represento no se encuentra afecta a ninguna de las inhabilidades contempladas en el artículo 4° de la Ley N° 19.886 de Bases sobre Contratos Administrativos de Suministro y Prestación de Servicios.
3. Que no tenemos vínculos de parentesco ni comerciales con funcionarios del organismo licitante (${lic.organismo || 'el organismo'}) involucrados en el diseño, evaluación o adjudicación de esta propuesta pública.
4. Que aceptamos íntegramente las Bases Técnicas y Administrativas de la Licitación ID: ${lic.codigo}, comprometiéndonos a cumplir rigurosamente con los plazos y condiciones ofertados.

Para constancia de su veracidad, se extiende la presente declaración simple para ser ingresada en el portal MercadoPúblico de ChileCompra.


Manuel Rodríguez
Representante Legal
TechSoluciones Chile Ltda.`;
}

function getBorradorPropuesta(lic: Licitacion) {
  const itemsListText = (lic.items || []).map(it => `  - Ítem ${it.correlativo}: ${it.nombreProducto} (Cantidad: ${it.cantidad} ${it.unidadMedida})
    Descripción: ${it.descripcion || 'Sin descripción adicional.'}`).join('\n');

  return `PROPUESTA TÉCNICA
PROYECTO: "${lic.nombre}" (ID: ${lic.codigo})
OFERENTE: ${COMPANY_PROFILE.name}

1. RESUMEN EJECUTIVO
${COMPANY_PROFILE.name} presenta esta propuesta para responder en su totalidad al requerimiento de "${lic.nombre}" para ${lic.organismo || 'el organismo comprador'}. Contamos con amplia experiencia en el rubro, asegurando una implementación rápida, eficiente y de calidad profesional para los ítems solicitados.

2. ESPECIFICACIONES DE LA SOLUCIÓN Y LOGÍSTICA
Nos comprometemos a suministrar los siguientes productos/servicios en estricto apego a las bases técnicas:
${itemsListText || '  (Ítems disponibles al consultar el detalle completo en MercadoPúblico)'}

3. PLAN DE TRABAJO Y LOGÍSTICA DE ENTREGA
- Hito 1: Coordinación inicial y validación de requerimientos (Día 1 a 5)
- Hito 2: Preparación y despacho logístico a la región de interés (${lic.region || 'correspondiente'}) (Día 6 a 15)
- Hito 3: Entrega formal, pruebas técnicas de funcionamiento y recepción conforme (Día 16 a 20)
- Hito 4: Soporte post-venta permanente y garantía.

4. CERTIFICACIONES Y EQUIPO TÉCNICO
El equipo asignado para este proyecto está compuesto por profesionales certificados en el área. Contamos con procesos estandarizados en la entrega de suministros y servicios.

5. POLÍTICA DE GARANTÍA Y SOPORTE POST-VENTA
Todos los ítems suministrados cuentan con una garantía técnica de fábrica de 12 meses. Nuestro soporte incluye una mesa de ayuda con SLA prioritario de respuesta.`;
}

export default function LicitacionDetallePage() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de IA para esta licitación. Analicé todas las bases administrativas y puedo ayudarte a redactar anexos, responder dudas o analizar las multas del contrato. ¿Qué te gustaría hacer?',
    },
  ]);

  // Proposal Toolkit Interactive State
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<'carta' | 'declaracion' | 'propuesta'>('carta');
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const handleToggleCheck = (itemId: string) => {
    setCheckedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Real data loading state
  const [licitacion, setLicitacion] = useState<Licitacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('mock');

  // AI Analysis state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiRequirements, setAiRequirements] = useState<AIRequirement[] | null>(null);
  const [aiRisks, setAiRisks] = useState<AIRiskAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (licitacion) {
      setIsUrgent(licitacion.estado === 'publicada' &&
        new Date(licitacion.fechaCierre).getTime() - Date.now() < 48 * 60 * 60 * 1000);
    }
  }, [licitacion]);

  // Fetch licitación data from real API
  useEffect(() => {
    async function fetchLicitacion() {
      setLoading(true);
      try {
        const response = await fetch(`/api/licitaciones/${encodeURIComponent(id)}`);
        const result = await response.json();
        
        if (response.ok && result.data) {
          setLicitacion(result.data);
          setDataSource('api');
        } else {
          throw new Error('Not found in API');
        }
      } catch (err) {
        console.warn('Detail: API failed for', id, err);
        const mocks = getMockLicitaciones();
        const found = mocks.find((m: any) => m.id === id || m.codigo === id);
        if (found) {
          setLicitacion(found as Licitacion);
          setDataSource('mock');
        } else {
          setLicitacion((mocks[0] || null) as Licitacion | null);
          setDataSource('mock');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLicitacion();
  }, [id]);

  // Trigger AI analysis when switching to the Analysis tab
  const loadAiAnalysis = async () => {
    if (!licitacion || aiSummary !== null || aiLoading) return;
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: licitacion.nombre,
          descripcion: licitacion.descripcion,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
        setAiRequirements(data.requirements);
        setAiRisks(data.risks);
      }
    } catch (err) {
      console.warn('AI Analysis failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analisis') {
      loadAiAnalysis();
    }
  }, [activeTab, licitacion]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-sidebar-active-border" />
        <p className="text-xs font-bold text-text-muted">Cargando bases públicas desde ChileCompra...</p>
      </div>
    );
  }

  if (!licitacion) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <p className="text-sm font-semibold text-text-secondary">No pudimos cargar esta licitación desde ChileCompra.</p>
        <p className="text-xs text-text-muted">Puede que el código haya expirado o que la API no esté disponible momentáneamente.</p>
        <Link href="/licitaciones" className="text-xs font-semibold text-sidebar-active-border hover:underline">
          ← Volver al explorador
        </Link>
      </div>
    );
  }

  const score = licitacion.aiScore || 0;

  const estadoVariant: Record<LicitacionEstado, 'success' | 'default' | 'warning' | 'danger' | 'info' | 'purple'> = {
    publicada: 'success',
    cerrada: 'default',
    adjudicada: 'info',
    desierta: 'warning',
    revocada: 'danger',
    suspendida: 'warning',
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isTyping) return;
    const userMsg = chatInput.trim();
    const currentHistory = [...chatMessages];
    
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: licitacion.nombre,
          descripcion: licitacion.descripcion,
          history: currentHistory,
          question: userMsg
        })
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      console.warn('Chat API error:', e);
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Respecto a tu consulta sobre "${licitacion.nombre}": Te recomiendo revisar las bases administrativas y técnicas para los detalles específicos. ¿Hay algo más en lo que pueda ayudarte?` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6 relative z-10 text-left">
      
      {/* Dynamic back navigation */}
      <Link href="/licitaciones" className="inline-flex items-center gap-2 text-xs font-bold uppercase text-text-muted hover:text-sidebar-active-border transition-all group cursor-pointer tracking-wider">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
        Volver al explorador
      </Link>

      {/* Header Glass Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-6 space-y-5 shadow-glass text-left">
        

        <div className="flex items-start justify-between gap-6 relative z-10">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={estadoVariant[licitacion.estado]} className="font-extrabold text-[9px] uppercase tracking-wider">
                {ESTADO_LABELS[licitacion.estado]}
              </Badge>
              {isUrgent && <Badge variant="danger" className="font-extrabold text-[9px] uppercase tracking-wider">⏰ Cierra pronto</Badge>}
              {score >= 80 && <Badge variant="purple" className="font-extrabold text-[9px] uppercase tracking-wider">🔥 Alta relevancia</Badge>}
              <span className="text-[10px] text-text-light font-mono font-bold tracking-wider">{licitacion.codigo}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary leading-tight tracking-tight">
              {licitacion.nombre}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-slate-400" />
                {licitacion.organismo || 'Comprador Público no detallado'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                {licitacion.region || 'Multiregional'}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <ScoreRing score={score} size={64} strokeWidth={4} />
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Score IA</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-border-primary/50 relative z-10">
          <div>
            <p className="text-[9px] text-text-light font-bold uppercase tracking-wider">Monto Estimado</p>
            <p className="text-sm font-semibold font-mono text-text-primary mt-0.5">{formatCLP(licitacion.montoEstimado)}</p>
          </div>
          <div>
            <p className="text-[9px] text-text-light font-bold uppercase tracking-wider">Publicación</p>
            <p className="text-xs font-medium text-text-secondary mt-1">{formatDate(licitacion.fechaPublicacion)}</p>
          </div>
          <div>
            <p className="text-[9px] text-text-light font-bold uppercase tracking-wider">Cierre</p>
            <p className={cn('text-xs font-medium mt-1', isUrgent ? 'text-red-500 animate-pulse' : 'text-text-secondary')}>
              {formatDate(licitacion.fechaCierre)}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-text-light font-bold uppercase tracking-wider">Tipo Licitación</p>
            <p className="text-xs font-medium text-text-secondary mt-1 truncate">{TIPO_LABELS[licitacion.tipo] || licitacion.tipo}</p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap items-center gap-3 pt-3 relative z-10">
          <button className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-white bg-sidebar-active-border hover:opacity-90 transition-all duration-300 shadow-sm cursor-pointer">
            <BookmarkPlus className="h-4 w-4" />
            Guardar en Pipeline
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-text-secondary bg-white/40 dark:bg-white/[0.02] border border-border-primary hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer">
            <Share2 className="h-4 w-4" />
            Compartir
          </button>
          <a
            href={`https://www.mercadopublico.cl/FichaLicitacion.html?idLicitacion=${licitacion.codigo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-text-secondary bg-white/40 dark:bg-white/[0.02] border border-border-primary hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
            Ver en ChileCompra
          </a>
        </div>
      </div>

      {/* Main Glass Tabs Navigator */}
      <div className="flex p-1 rounded-2xl bg-card-bg/60 backdrop-blur-xl border border-border-primary overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all duration-300 flex-1 justify-center whitespace-nowrap cursor-pointer',
              activeTab === tab.id
                ? 'bg-sidebar-active-bg text-sidebar-active-border border border-sidebar-active-border/20 shadow-sm'
                : 'text-text-muted hover:text-text-primary hover:bg-white/10 dark:hover:bg-white/[0.02]'
            )}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactive Tabs Contents */}
      <div className="animate-fade-in">
        
        {/* Resumen Tab */}
        {activeTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            <div className="lg:col-span-2 space-y-6">
              {/* AI Frosted Summary */}
              {licitacion.aiInsights && (
                <div className="rounded-3xl border border-sidebar-active-border/15 bg-sidebar-active-bg/25 p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sidebar-active-border animate-status-breathe" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Resumen Ejecutivo Inteligente (IA)</h3>
                  </div>
                  <p className="text-xs font-normal leading-relaxed text-text-secondary">{licitacion.aiInsights}</p>
                </div>
              )}

              {/* Descripción */}
              <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-6 space-y-3 shadow-glass">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Descripción Técnica de las Bases</h3>
                <p className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap font-normal">{licitacion.descripcion || 'Sin especificaciones complementarias ingresadas por el comprador.'}</p>
              </div>

              {/* Keywords IA */}
              {licitacion.aiKeywords && licitacion.aiKeywords.length > 0 && (
                <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-6 space-y-3 shadow-glass">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Palabras Clave Indexadas (IA)</h3>
                  <div className="flex flex-wrap gap-2">
                    {licitacion.aiKeywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="font-bold text-[9px] uppercase border-sidebar-active-border/20 text-sidebar-active-border bg-sidebar-active-bg/30">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info Sidebar */}
            <div className="space-y-4">
              <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-6 shadow-glass">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4 border-b border-border-primary/50 pb-2">Información del Concurso</h3>
                <InfoRow label="Organismo Comprador" value={licitacion.organismo || 'Detallado en bases'} icon={Building2} />
                <InfoRow label="Lugar/Región" value={licitacion.region || 'Nacional'} icon={MapPin} />
                <InfoRow label="Fecha Publicación" value={formatDate(licitacion.fechaPublicacion)} icon={Calendar} />
                <InfoRow label="Plazo de Cierre" value={formatDate(licitacion.fechaCierre)} icon={Clock} />
                <InfoRow label="Presupuesto Estimado" value={formatCLP(licitacion.montoEstimado)} icon={DollarSign} />
                <InfoRow label="Código Licitación" value={licitacion.codigo} icon={FileText} />
              </div>

              {(licitacion.compradorContacto || licitacion.compradorEmail || licitacion.compradorFono || licitacion.compradorCargo || licitacion.compradorUnidad || licitacion.compradorDireccion || licitacion.compradorComuna) && (
                <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-6 shadow-glass space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary border-b border-border-primary/50 pb-2">Contacto de Compras</h3>
                  {licitacion.compradorContacto && (
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-sidebar-active-border mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] text-text-light uppercase font-bold tracking-wider block">Nombre</span>
                        <span className="text-xs font-semibold text-text-primary">{licitacion.compradorContacto}</span>
                      </div>
                    </div>
                  )}
                  {licitacion.compradorCargo && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] text-text-light uppercase font-bold tracking-wider block">Cargo</span>
                        <span className="text-xs font-semibold text-text-primary">{licitacion.compradorCargo}</span>
                      </div>
                    </div>
                  )}
                  {licitacion.compradorUnidad && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] text-text-light uppercase font-bold tracking-wider block">Unidad / Departamento</span>
                        <span className="text-xs font-semibold text-text-primary">{licitacion.compradorUnidad}</span>
                      </div>
                    </div>
                  )}
                  {licitacion.compradorEmail && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-sidebar-active-border mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-text-light uppercase font-bold tracking-wider block">Correo Electrónico</span>
                        <a
                          href={`mailto:${licitacion.compradorEmail}`}
                          className="text-xs font-semibold text-sidebar-active-border hover:underline block truncate"
                        >
                          {licitacion.compradorEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  {licitacion.compradorFono && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] text-text-light uppercase font-bold tracking-wider block">Teléfono / Fono</span>
                        <a
                          href={`tel:${licitacion.compradorFono}`}
                          className="text-xs font-semibold text-text-primary hover:underline hover:text-sidebar-active-border block"
                        >
                          {licitacion.compradorFono}
                        </a>
                      </div>
                    </div>
                  )}
                  {(licitacion.compradorDireccion || licitacion.compradorComuna) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] text-text-light uppercase font-bold tracking-wider block">Dirección de Despacho</span>
                        <span className="text-xs font-semibold text-text-primary">
                          {licitacion.compradorDireccion}
                          {licitacion.compradorDireccion && licitacion.compradorComuna && ', '}
                          {licitacion.compradorComuna}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-primary bg-white/40 dark:bg-white/[0.015]">
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider w-12">#</th>
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Producto</th>
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Categoría ONU</th>
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Detalle</th>
                    <th className="py-4 px-4 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider">Cantidad</th>
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider w-20">Unidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary/50">
                  {Array.isArray(licitacion.items) && licitacion.items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.015] transition-colors duration-200">
                      <td className="py-4 px-4 text-xs font-medium text-text-light">{item.correlativo}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-text-primary">{item.nombreProducto}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="text-[9px] font-medium uppercase border-border-primary bg-slate-50/50 dark:bg-white/[0.02]">{item.categoria}</Badge>
                      </td>
                      <td className="py-4 px-4 text-xs font-normal text-text-secondary max-w-xs truncate">{item.descripcion || '—'}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-text-primary text-right font-mono">{item.cantidad}</td>
                      <td className="py-4 px-4 text-xs font-medium text-text-muted">{item.unidadMedida}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'analisis' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Scoring Breakdown with Gradient Progress bars */}
            <div className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 space-y-5 shadow-md">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-2 border-b border-border-primary/45 pb-2">
                <TrendingUp className="h-4 w-4 text-accent-600 dark:text-accent-400" />
                Desglose de Compatibilidad Semántica
              </h3>
              {[
                { label: 'Coincidencia de keywords técnicas', score: Math.min(100, score + 8), color: 'bg-accent-500' },
                { label: 'Idoneidad geográfica de entrega', score: Math.min(100, score + 4), color: 'bg-accent-400' },
                { label: 'Alineación presupuestaria', score: Math.max(20, score - 6), color: 'bg-accent-600' },
                { label: 'Experiencia y rubro categorizado', score: Math.max(20, score - 12), color: 'bg-emerald-500 dark:bg-emerald-600' },
                { label: 'Similitud contractual histórica', score: Math.max(10, score - 18), color: 'bg-slate-400 dark:bg-zinc-650' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-text-secondary">{item.label}</span>
                    <span className="text-text-primary font-mono">{item.score}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-1000',
                        item.color
                      )}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Risk Analysis */}
            <div className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 space-y-5 shadow-md">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-2 border-b border-border-primary/45 pb-2">
                <Shield className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                Matriz Predictiva de Riesgos (IA)
              </h3>
              <div className="space-y-1">
                {[
                  { label: 'Complejidad técnica del pliego', level: 'Medio', color: 'warning' },
                  { label: 'Fricción competitiva estimada', level: 'Alta', color: 'danger' },
                  { label: 'Flexibilidad en plazo operacional', level: 'Bajo', color: 'success' },
                  { label: 'Exigencia de solvencia financiera', level: 'Medio', color: 'warning' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border-primary/40 last:border-0">
                    <span className="text-xs font-bold text-text-secondary">{item.label}</span>
                    <Badge variant={item.color as any} className="font-extrabold text-[9px] uppercase tracking-wider px-2">
                      {item.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="md:col-span-2 rounded-3xl border border-border-primary bg-white/40 dark:bg-white/[0.015] backdrop-blur-xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Guía Estratégica para la Preparación de la Oferta
              </h3>
              <ul className="space-y-3.5 pr-2">
                {[
                  'Integrar de forma mandatoria al menos 3 certificados de actas de recepción de organismos estatales anteriores para superar el corte de experiencia.',
                  'Adquirir con al menos 48h de antelación la boleta de seriedad de la oferta (equivalente al 5% presupuestado) para validar el Anexo N° 1.',
                  'Destacar la dotación con certificaciones ISO 9001 e ISO 27001 para obtener el puntaje de valor técnico opcional (representa el 10% del puntaje total).',
                  'Desglosar el plan logístico de distribución en la zona de entrega, demostrando capacidad de despacho menor a 15 días corridos.',
                  'Revisar el análisis de precios unitarios y subir la oferta en el formato de dos decimales para evitar el rechazo por redondeo automático del portal.',
                ].map((rec, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs font-semibold text-text-secondary leading-relaxed">
                    <ChevronRight className="h-4 w-4 text-emerald-600 dark:text-emerald-450 shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl flex flex-col h-[520px] shadow-glass overflow-hidden">
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {chatMessages.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} />
              ))}
              {isTyping && (
                <div className="flex gap-3 animate-pulse text-left">
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-sidebar-active-bg text-sidebar-active-border flex items-center justify-center text-xs font-semibold">
                    IA
                  </div>
                  <div className="bg-white/40 dark:bg-white/[0.01] border border-border-primary text-text-secondary rounded-2xl px-4 py-3 text-xs font-normal">
                    Analizando las bases administrativas de ChileCompra...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-5 py-2.5 border-t border-border-primary/50 bg-slate-50/20 dark:bg-white/[0.01]">
              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                {[
                  '¿Cuáles son los requisitos obligatorios?',
                  'Redacta un resumen para mi equipo',
                  '¿Qué boleta de garantía exige?',
                  '¿Permite subcontratación parcial?',
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => { setChatInput(suggestion); }}
                    className="flex-shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-bold text-sidebar-active-border bg-sidebar-active-bg border border-sidebar-active-border/20 hover:opacity-85 transition-all cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input panel */}
            <div className="p-4 border-t border-border-primary/65 bg-white/60 dark:bg-slate-950/40 backdrop-blur-md">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Escribe una pregunta sobre estas bases técnicas (ej. multas, plazos, requerimientos)..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/15 border border-border-primary/60 text-xs font-medium text-text-primary placeholder:text-text-light focus:outline-none focus:border-sidebar-active-border/45 transition-all"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="px-5 py-3 rounded-2xl bg-sidebar-active-border hover:opacity-90 text-white font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Propuesta IA Tab */}
        {activeTab === 'propuesta' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in text-left">
            {/* Checklist of Annexes */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-5 space-y-4 shadow-glass">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-sidebar-active-border" />
                    Lista de Verificación (Checklist)
                  </h3>
                  <span className="text-[10px] text-text-light font-bold uppercase">
                    {checkedItems.length} de {CHECKLIST_ITEMS.length} Listos
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sidebar-active-border transition-all duration-500"
                      style={{ width: `${(checkedItems.length / CHECKLIST_ITEMS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Category checklist items */}
                {['Administrativo', 'Técnico', 'Económico'].map(category => {
                  const items = CHECKLIST_ITEMS.filter(it => it.category === category);
                  if (items.length === 0) return null;
                  return (
                    <div key={category} className="space-y-2.5 pt-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
                        {category}
                      </p>
                      <div className="space-y-2">
                        {items.map(item => {
                          const isChecked = checkedItems.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleToggleCheck(item.id)}
                              className={cn(
                                'flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer',
                                isChecked
                                  ? 'bg-sidebar-active-bg border-sidebar-active-border/30 text-text-primary'
                                  : 'bg-white/30 dark:bg-white/[0.005] border-border-primary/60 text-text-secondary hover:border-border-primary hover:bg-slate-50/50'
                              )}
                            >
                              <div className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all mt-0.5',
                                isChecked
                                  ? 'bg-sidebar-active-border border-sidebar-active-border text-white shadow-sm'
                                  : 'border-border-primary bg-white dark:bg-slate-950'
                              )}>
                                {isChecked && <CheckCircle2 className="h-3 w-3" />}
                              </div>
                              <div className="space-y-1">
                                <p className={cn(
                                  'text-xs font-semibold leading-tight',
                                  isChecked ? 'text-sidebar-active-border' : 'text-text-primary'
                                )}>
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-text-light leading-relaxed font-normal">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Template Selector & Text Viewer */}
            <div className="lg:col-span-3 space-y-6">
              <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-5 flex flex-col h-full space-y-4 shadow-glass">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-primary/50">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-sidebar-active-border" />
                      Documentación pre-redactada (IA)
                    </h3>
                    <p className="text-[9px] font-semibold text-text-light">
                      Borradores legales pre-llenados listos para descargar y firmar.
                    </p>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={async () => {
                      const text = selectedTemplate === 'carta'
                        ? getCartaPresentacion(licitacion)
                        : selectedTemplate === 'declaracion'
                        ? getDeclaracionJurada(licitacion)
                        : getBorradorPropuesta(licitacion);
                      try {
                        await navigator.clipboard.writeText(text);
                        setCopiedTemplate(true);
                        setTimeout(() => setCopiedTemplate(false), 2000);
                      } catch (err) {
                        console.error('Failed to copy text: ', err);
                      }
                    }}
                    className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase bg-sidebar-active-border text-white hover:opacity-90 transition-all shadow-sm cursor-pointer"
                  >
                    {copiedTemplate ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 animate-bounce" />
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copiar plantilla
                      </>
                    )}
                  </button>
                </div>

                {/* Inner Template Tabs Selector */}
                <div className="flex gap-1 p-1 rounded-xl bg-slate-100/50 dark:bg-white/[0.015] border border-border-primary/60 flex-shrink-0">
                  {[
                    { id: 'carta', label: 'Carta Presentación' },
                    { id: 'declaracion', label: 'Decl. Jurada Simple' },
                    { id: 'propuesta', label: 'Propuesta Técnica' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSelectedTemplate(tab.id as any);
                        setCopiedTemplate(false);
                      }}
                      className={cn(
                        'flex-1 text-center py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer',
                        selectedTemplate === tab.id
                          ? 'bg-white dark:bg-slate-950 text-sidebar-active-border font-bold shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Paper sheet styled viewer */}
                <div className="flex-1 min-h-[350px] max-h-[500px] overflow-y-auto rounded-2xl border border-border-primary/60 bg-white/20 dark:bg-white/[0.005] p-4 font-mono text-[11px] text-text-secondary whitespace-pre-wrap leading-relaxed select-all scrollbar-thin">
                  {selectedTemplate === 'carta' && getCartaPresentacion(licitacion)}
                  {selectedTemplate === 'declaracion' && getDeclaracionJurada(licitacion)}
                  {selectedTemplate === 'propuesta' && getBorradorPropuesta(licitacion)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
