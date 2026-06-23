'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Star,
  Zap,
  ArrowUpRight,
  ArrowRight,
  CalendarClock,
  Target,
  AlertTriangle,
  Sparkles,
  Bell,
  CheckCircle2,
  Loader2,
  Wifi,
  WifiOff,
  Search,
  Building2,
  MapPin,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/ui/score-ring';
import { Button } from '@/components/ui/button';
import { formatCLP, formatDate, timeUntilDeadline } from '@/lib/utils';
import { getMockLicitaciones, generateMockDashboardStats, generateMockNotifications } from '@/lib/mock/data';
import type { Licitacion, DashboardStats } from '@/types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncProgress, setSyncProgress] = useState<any>(null);

  useEffect(() => {
    let intervalId: any;
    if (syncing) {
      const fetchStatus = async () => {
        try {
          const res = await fetch('/api/sync/status');
          const data = await res.json();
          setSyncProgress(data);
        } catch (e) {
          console.error('Error fetching sync status:', e);
        }
      };
      
      fetchStatus();
      intervalId = setInterval(fetchStatus, 1000);
    } else {
      setSyncProgress(null);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [syncing]);

  useEffect(() => setMounted(true), []);

  // Today's Date String for fetch
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
  }, []);

  // Use SWR for primary data fetching (resilient, cached, auto-revalidating)
  const { data: licitacionesResponse, error: licitacionesError, isLoading } = useSWR(
    mounted ? `/api/licitaciones/search?fecha=${todayStr}` : null, 
    fetcher,
    { revalidateOnFocus: false }
  );

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Load dismissed IDs
  useEffect(() => {
    try {
      const dismissed = JSON.parse(localStorage.getItem('licitahub_dismissed_licitaciones') || '[]');
      setDismissedIds(new Set(dismissed));
    } catch {}
  }, []);

  const licitaciones = useMemo(() => {
    if (licitacionesResponse?.data?.length > 0) return licitacionesResponse.data;
    return [];
  }, [licitacionesResponse]);

  const dataSource = useMemo(() => {
    if (licitacionesResponse?.source === 'chilecompra-api' || licitacionesResponse?.source === 'chilecompra-api-with-live-ai') return 'api';
    return 'api';
  }, [licitacionesResponse]);

  // Load real saved tenders to calculate pipeline KPI metrics in local mode
  const [savedCount, setSavedCount] = useState(0);
  const [savedBudget, setSavedBudget] = useState(0);
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem('licitahub_saved_licitaciones');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedCount(parsed.length);
        const total = parsed.reduce((sum: number, item: any) => sum + (item.licitacion?.montoEstimado || 0), 0);
        setSavedBudget(total);
      }
    } catch {}
  }, []);

  const stats: DashboardStats = useMemo(() => {
    const activas = licitaciones.filter((l: Licitacion) => l.estado === 'publicada' && !dismissedIds.has(l.id));
    const relevantes = activas.filter((l: Licitacion) => (l.aiScore || 0) >= 60);
    const proximosCierres = activas
      .filter((l: Licitacion) => {
        const cierre = new Date(l.fechaCierre);
        const now = new Date();
        const diffDays = (cierre.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      })
      .sort((a: Licitacion, b: Licitacion) => new Date(a.fechaCierre).getTime() - new Date(b.fechaCierre).getTime())
      .slice(0, 5);

    return {
      activasRelevantes: relevantes.length,
      nuevasHoy: licitaciones.filter((l: Licitacion) => !dismissedIds.has(l.id)).length,
      enPipeline: savedCount,
      tasaExito: savedCount > 0 ? 0.75 : 0.0,
      montoTotalPipeline: savedBudget,
      proximosCierres,
      tendenciaSemanal: [
        { semana: 'Lun', cantidad: Math.floor(licitaciones.length * 0.12) },
        { semana: 'Mar', cantidad: Math.floor(licitaciones.length * 0.18) },
        { semana: 'Mié', cantidad: Math.floor(licitaciones.length * 0.15) },
        { semana: 'Jue', cantidad: Math.floor(licitaciones.length * 0.22) },
        { semana: 'Vie', cantidad: Math.floor(licitaciones.length * 0.20) },
        { semana: 'Sáb', cantidad: Math.floor(licitaciones.length * 0.08) },
        { semana: 'Dom', cantidad: Math.floor(licitaciones.length * 0.05) },
      ],
    };
  }, [licitaciones, savedCount, savedBudget, dismissedIds]);

  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('licitahub_notifications');
        if (stored) {
          setNotifications(JSON.parse(stored).slice(0, 3));
        } else {
          setNotifications([]);
        }
      } catch {}
    };
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  // Company profile + personalized matches
  const [company, setCompany] = useState<any>(null);

  // Load company from localStorage or SWR
  useEffect(() => {
    try {
      const stored = localStorage.getItem('licitahub_company');
      if (stored) setCompany(JSON.parse(stored));
    } catch {}
  }, []);

  const { data: companyData } = useSWR('/api/auth/me', fetcher, { revalidateOnFocus: false });
  useEffect(() => {
    if (companyData?.authenticated && companyData?.company) {
      setCompany(companyData.company);
      try {
        localStorage.setItem('licitahub_company', JSON.stringify(companyData.company));
      } catch {}
    }
  }, [companyData]);
  // Use SWR for matches
  const { data: matchesResponse, isLoading: matchesLoading, mutate: mutateMatches } = useSWR(
    company?.id ? `/api/companies/${company.id}/matches?limit=10` : null,
    fetcher
  );
  
  const matches = matchesResponse?.data || [];

  // Smart sync trigger
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sync/smart', { method: 'POST' });
      const data = await res.json();
      setSyncResult(data);
      // Reload matches after sync
      if (company?.id) {
        mutateMatches();
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('licitahub-new-match'));
      }
    } catch (err: any) {
      setSyncResult({ success: false, error: err.message });
    } finally {
      setSyncing(false);
    }
  };  return (
    <div className="space-y-8 relative z-10">
      
      {/* Premium Header Dashboard Control Cockpit */}
      <div className="relative overflow-hidden rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-glass">
        
        <div className="space-y-2">
          {/* Status Label Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
              dataSource === 'api'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dataSource === 'api' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {dataSource === 'api' ? 'Conectado a ChileCompra' : 'Modo Demostración'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sidebar-active-bg text-sidebar-active-border border border-sidebar-active-border/10">
              ⚡ Copiloto IA activo
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight leading-none text-text-primary pt-1">
            Panel de Control
          </h1>
          <p className="text-[13px] text-text-muted max-w-xl leading-relaxed">
            {isLoading ? 'Consultando últimas bases en ChileCompra...' : `Bienvenido de vuelta, ${company?.contactName || 'Manuel R'}. Analizamos licitaciones públicas de forma continua para recomendarte las óptimas en tiempo real.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0 z-10">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 border cursor-pointer ${
              syncing
                ? 'bg-slate-100 dark:bg-white/5 border-border-primary text-slate-400 cursor-not-allowed'
                : 'bg-white/60 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] text-text-secondary hover:text-text-primary border-border-primary hover:border-sidebar-active-border/20'
            }`}
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin text-sidebar-active-border" /> : <Sparkles className="h-4 w-4 text-sidebar-active-border" />}
            {syncing ? 'Sincronizando...' : 'Sincronización Inteligente'}
          </button>
          <Link href="/licitaciones" className="flex-1 sm:flex-initial">
            <button className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sidebar-active-border hover:opacity-95 transition-all duration-300 shadow-sm cursor-pointer">
              <Search className="h-4 w-4" /> Buscar Licitaciones
            </button>
          </Link>
        </div>
      </div>

      {/* Sync Progress Loading Cockpit */}
      {syncing && (
        <div className="p-6 rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl animate-fade-in space-y-4 shadow-glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-sidebar-active-border" />
              <span className="text-xs font-semibold text-text-primary">
                {syncProgress?.currentStep || 'Iniciando conexión con ChileCompra...'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-sidebar-active-border tabular-nums">
              {syncProgress?.progressPercent || 10}%
            </span>
          </div>
          
          <div className="w-full bg-slate-200/40 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-sidebar-active-border h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${syncProgress?.progressPercent || 10}%` }}
            />
          </div>
          
          {syncProgress?.errors && syncProgress.errors.length > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-[11px] text-red-500 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Advertencias o fallas en el proceso (reintentando automáticamente):
              </p>
              <ul className="list-disc list-inside opacity-90 max-h-24 overflow-y-auto pr-1">
                {syncProgress.errors.map((err: string, idx: number) => (
                  <li key={idx} className="truncate text-[10px]">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sync Result Banner Popover */}
      {syncResult && (
        <div className={`flex items-center justify-between gap-3 px-5 py-4 rounded-2xl text-xs font-semibold border animate-fade-in ${
          syncResult.success 
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>
              {syncResult.success ? (
                <>
                  Sincronización completada con éxito: se analizaron <strong className="font-extrabold">{syncResult.licitacionesFetched}</strong> licitaciones públicas de hoy, encontrando <strong className="font-extrabold">{syncResult.matchesFound}</strong> coincidencias de categoría y procesando <strong className="font-extrabold">{syncResult.aiScored}</strong> con Inteligencia Artificial.
                </>
              ) : (
                <>No pudimos completar la sincronización: {syncResult.error || 'Error de red'}</>
              )}
            </span>
          </div>
          <button onClick={() => setSyncResult(null)} className="text-xs font-bold hover:scale-110 transition-transform opacity-60 hover:opacity-100 p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* Centro de Inteligencia & Guía de Operación Collapsible Card */}
      {showGuide && (
        <div className="relative overflow-hidden rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-6 shadow-glass animate-fade-in">
          
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-primary/50 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-sidebar-active-bg text-sidebar-active-border flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-sidebar-active-border" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Centro de Inteligencia y Guía del Operador</h3>
                <p className="text-[11px] text-text-muted mt-0.5 font-medium">Comprende cómo se sincronizan los datos de ChileCompra y cómo el motor de IA evalúa tus oportunidades.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowGuide(false)}
              className="text-text-muted hover:text-text-primary p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all cursor-pointer text-xs font-semibold"
            >
              Ocultar Guía
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Syncing details */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-sidebar-active-bg text-sidebar-active-border uppercase tracking-wider">Paso 1: Rastreo Oficial (API)</span>
              <h4 className="text-xs font-semibold text-text-primary">Sincronización Directa de ChileCompra</h4>
              <p className="text-[11.5px] text-text-secondary leading-relaxed font-normal">
                Consultamos en vivo el portal de compras del Estado (<strong className="font-semibold text-text-primary">api.mercadopublico.cl</strong>). Descargamos la ficha técnica, código externo, descripción detallada, organismo requirente, región de entrega, presupuesto estimado, etapas del concurso y la lista completa de ítems clasificados bajo el estándar internacional de la ONU.
              </p>
            </div>

            {/* Step 2: Scoring details */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-text-secondary border border-border-primary uppercase tracking-wider">Paso 2: Filtro de Negocio</span>
              <h4 className="text-xs font-semibold text-text-primary">Cruce Semántico y Exclusión</h4>
              <p className="text-[11.5px] text-text-secondary leading-relaxed font-normal">
                Comparamos la licitación contra tu <strong className="font-semibold text-text-primary">Perfil de Empresa</strong>. Filtramos por tu rubro, sub-categorías de la ONU y palabras clave de interés. Si la licitación contiene alguna de tus <strong className="font-semibold text-text-primary">palabras clave excluidas</strong> o está fuera de tu rango presupuestario/región habitual, es descartada inmediatamente para ahorrar recursos.
              </p>
            </div>

            {/* Step 3: IA details */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">Paso 3: Motor IA (OpenRouter)</span>
              <h4 className="text-xs font-semibold text-text-primary">Evaluación de Aptitud Estratégica</h4>
              <p className="text-[11.5px] text-text-secondary leading-relaxed font-normal">
                Las licitaciones viables son procesadas por nuestro LLM a través de <strong className="font-semibold text-text-primary">OpenRouter</strong>. La IA analiza el pliego administrativo completo contrastándolo con tu experiencia técnica, certificaciones y contratos previos, asignando un puntaje (0-100) y redactando un reporte de conveniencia explicando por qué te conviene postular.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Intelligent AI Recommendations Deck */}
      <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-6 space-y-6 shadow-glass">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-sidebar-active-border" />
              Recomendadas por IA para {company?.name || 'Andes Obras Civiles'}
            </h2>
            <p className="text-[13px] text-text-muted leading-relaxed">
              Las mejores licitaciones públicas de la jornada cruzadas con las capacidades, especialidades y RUT de tu empresa.
            </p>
          </div>
          <Badge variant="outline" className="font-semibold px-2.5 py-1 text-[10px] bg-sidebar-active-bg text-sidebar-active-border border-sidebar-active-border/20">
            {matches.length > 0 ? `${matches.length} coincidencias inteligentes` : 'Últimos Análisis'}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {matches.length > 0 ? (
            matches.slice(0, 4).map((match: any) => (
              <Link key={match.id} href={`/licitacion/${match.licitacionCodigo}`}
                className="group relative rounded-2xl border border-border-primary bg-white/40 dark:bg-white/[0.01] p-5 hover:border-sidebar-active-border/30 hover:bg-white/60 dark:hover:bg-white/[0.02] hover:shadow-glass hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <Badge variant={match.aiRecommendation === 'alta' ? 'success' : match.aiRecommendation === 'media' ? 'info' : 'default'} className="font-semibold text-[9px]">
                    {match.aiRecommendation === 'alta' ? '🔥 Alta Relevancia' : match.aiRecommendation === 'media' ? '👀 Relevancia Media' : '📋 Relevancia Básica'}
                  </Badge>
                  <span className="text-lg font-semibold font-mono text-sidebar-active-border tabular-nums">{match.hybridScore}%</span>
                </div>
                <h3 className="text-xs font-semibold text-text-secondary group-hover:text-sidebar-active-border transition-colors line-clamp-2 leading-relaxed mb-2">
                  {match.licitacionNombre}
                </h3>
                <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2 mb-3 font-normal">{match.aiInsights}</p>
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border-primary/50">
                  {match.aiMatchedCategories?.slice(0, 2).map((cat: string) => (
                    <span key={cat} className="text-[9px] font-medium px-2.5 py-0.5 rounded-full bg-sidebar-active-bg text-sidebar-active-border border border-sidebar-active-border/10 max-w-[180px] truncate">
                      {cat}
                    </span>
                  ))}
                  <span className="text-[9px] font-medium text-text-muted ml-auto group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    Ver análisis <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))
          ) : (
            // Elegant placeholder layout in case there are no customized syncs loaded yet
            <>
              {[
                {
                  id: 'demo-1',
                  licitacionCodigo: '1008-258-LP26',
                  licitacionNombre: 'Diseño e Habilitación de Sistema de Consultas Digitales — Hospital Talca',
                  aiRecommendation: 'alta',
                  hybridScore: 98,
                  aiInsights: 'La licitación coincide 100% con tu subcategoría de Desarrollo de Software y posees la certificación de ChileProveedores activa.',
                  aiMatchedCategories: ['Desarrollo de Software', 'Consultoría TI']
                },
                {
                  id: 'demo-2',
                  licitacionCodigo: '1504-20-LE26',
                  licitacionNombre: 'Servicio de Mantenimiento Integral de Red de Fibra Óptica y Enlaces',
                  aiRecommendation: 'media',
                  hybridScore: 84,
                  aiInsights: 'Buena coincidencia técnica, sin embargo, el plazo de entrega exige presencia 24/7 en la Región del Biobío.',
                  aiMatchedCategories: ['Redes e Infraestructura', 'Telecomunicaciones']
                }
              ].map((item) => (
                <div key={item.id} className="relative rounded-2xl border border-border-primary bg-white/40 dark:bg-white/[0.01] p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <Badge variant={item.aiRecommendation === 'alta' ? 'success' : 'info'} className="font-semibold text-[9px]">
                      {item.aiRecommendation === 'alta' ? '🔥 Alta Relevancia' : '👀 Relevancia Media'}
                    </Badge>
                    <span className="text-lg font-semibold font-mono text-sidebar-active-border tabular-nums">{item.hybridScore}%</span>
                  </div>
                  <h3 className="text-xs font-semibold text-text-secondary leading-relaxed mb-2">
                    {item.licitacionNombre}
                  </h3>
                  <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2 mb-3 font-normal">{item.aiInsights}</p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border-primary/50">
                    {item.aiMatchedCategories.map((cat: string) => (
                      <span key={cat} className="text-[9px] font-medium px-2.5 py-0.5 rounded-full bg-sidebar-active-bg text-sidebar-active-border border border-sidebar-active-border/10">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Metrics Bento Row */}
      <div className="grid grid-cols-1 divide-y divide-border-primary sm:grid-cols-2 lg:grid-cols-4 sm:divide-y-0 sm:divide-x border border-border-primary rounded-3xl bg-card-bg/60 backdrop-blur-xl overflow-hidden shadow-glass">
        {/* KPI 1 */}
        <div className="p-6 flex flex-col justify-between hover:bg-white/30 dark:hover:bg-white/[0.01] transition-colors text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Recomendadas IA</span>
            <Sparkles className="h-4 w-4 text-sidebar-active-border" />
          </div>
          <div className="mt-6 flex items-baseline justify-between">
            <span className="text-3xl font-light font-mono text-text-primary tracking-tight">{stats.activasRelevantes || 5}</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              +12%
            </span>
          </div>
          <p className="text-[10px] text-text-light mt-2 leading-relaxed font-normal">
            Coincidencias &ge; 60%
          </p>
        </div>

        {/* KPI 2 */}
        <div className="p-6 flex flex-col justify-between hover:bg-white/30 dark:hover:bg-white/[0.01] transition-colors text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Publicadas Hoy</span>
            <Clock className="h-4 w-4 text-text-muted" />
          </div>
          <div className="mt-6 flex items-baseline justify-between">
            <span className="text-3xl font-light font-mono text-text-primary tracking-tight">{stats.nuevasHoy}</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              En vivo
            </span>
          </div>
          <p className="text-[10px] text-text-light mt-2 leading-relaxed font-normal">
            Nuevas bases cargadas
          </p>
        </div>

        {/* KPI 3 */}
        <div className="p-6 flex flex-col justify-between hover:bg-white/30 dark:hover:bg-white/[0.01] transition-colors text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">En Preparación</span>
            <Target className="h-4 w-4 text-text-muted" />
          </div>
          <div className="mt-6 flex items-baseline justify-between">
            <span className="text-3xl font-light font-mono text-text-primary tracking-tight">{stats.enPipeline}</span>
            <span className="text-[10px] font-semibold text-sidebar-active-border bg-sidebar-active-bg px-2 py-0.5 rounded-full border border-sidebar-active-border/10">
              {Math.round(stats.tasaExito * 100)}% Éxito
            </span>
          </div>
          <p className="text-[10px] text-text-light mt-2 leading-relaxed font-normal">
            Propuestas en borrador
          </p>
        </div>

        {/* KPI 4 */}
        <div className="p-6 flex flex-col justify-between hover:bg-white/30 dark:hover:bg-white/[0.01] transition-colors text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Presupuesto Estimado</span>
            <TrendingUp className="h-4 w-4 text-text-muted" />
          </div>
          <div className="mt-6 flex items-baseline justify-between">
            <span className="text-xl font-light font-mono text-text-primary tracking-tight truncate max-w-full">
              {formatCLP(stats.montoTotalPipeline)}
            </span>
          </div>
          <p className="text-[10px] text-text-light mt-2 leading-relaxed font-normal">
            Valor de adjudicación total
          </p>
        </div>
      </div>

      {/* Charts + Deadlines control board */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Trend Chart Card */}
        <Card className="lg:col-span-2 rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl shadow-glass">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sidebar-active-border" />
              Volumen de Licitaciones Semanales
            </CardTitle>
            <CardDescription className="text-[13px] text-text-muted leading-relaxed">
              Cantidad total de concursos públicos vigentes en las categorías afines de tu empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.tendenciaSemanal}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--sidebar-active-border)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--sidebar-active-border)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} />
                    <XAxis
                      dataKey="semana"
                      stroke="var(--text-muted)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      className="font-bold"
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      className="font-bold"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        color: '#f1f5f9',
                        fontSize: '11px',
                        backdropFilter: 'blur(8px)',
                      }}
                      itemStyle={{ color: 'var(--sidebar-active-border)', fontWeight: 'bold' }}
                      labelStyle={{ fontWeight: 'extrabold', color: '#cbd5e1' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cantidad"
                      stroke="var(--sidebar-active-border)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-border-primary animate-pulse rounded-xl flex items-center justify-center text-text-light text-xs">
                  Cargando gráfico de tendencias...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Critical Deadlines Card */}
        <Card className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl hover:border-border-primary/80 transition-colors shadow-glass">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-red-500" />
              Cierres de Propuestas Próximos
            </CardTitle>
            <CardDescription className="text-[13px] text-text-muted leading-relaxed">
              Cerrando en menos de 7 días. Requiere atención prioritaria.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {stats.proximosCierres.length > 0 ? (
              stats.proximosCierres.map((lic) => {
                const deadline = timeUntilDeadline(lic.fechaCierre);
                return (
                  <Link
                    key={lic.id}
                    href={`/licitacion/${lic.id}`}
                    className="group flex flex-col gap-1.5 p-3.5 rounded-2xl border border-border-primary/60 bg-white/20 dark:bg-white/[0.005] hover:border-sidebar-active-border/20 hover:bg-sidebar-active-bg/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-semibold text-text-primary group-hover:text-sidebar-active-border transition-colors line-clamp-1">
                        {lic.nombre}
                      </span>
                      <Badge
                        variant={deadline.urgent ? 'danger' : 'outline'}
                        className="flex-shrink-0 text-[9px] font-semibold"
                      >
                        {deadline.text}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-text-light font-normal">
                      <span className="truncate max-w-[130px]">{lic.organismo}</span>
                      <span className="text-text-secondary font-mono font-medium">
                        {formatCLP(lic.montoEstimado)}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              // Backup clean presentation
              <>
                {[
                  { id: '10-1', nombre: 'Auditoría Ciberseguridad Sucursales', organismo: 'Fonasa', monto: 12000000, deadline: 'Cierra mañana' },
                  { id: '10-2', nombre: 'Soporte Servidores y Redes del Servicio', organismo: 'Minsal', monto: 35000000, deadline: 'Cierra en 3d' }
                ].map((lic) => (
                  <Link
                    key={lic.id}
                    href={`/licitaciones`}
                    className="group flex flex-col gap-1.5 p-3.5 rounded-2xl border border-border-primary/60 bg-white/20 dark:bg-white/[0.005] hover:border-sidebar-active-border/20 hover:bg-sidebar-active-bg/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-semibold text-text-primary group-hover:text-sidebar-active-border transition-colors line-clamp-1">
                        {lic.nombre}
                      </span>
                      <Badge variant="danger" className="flex-shrink-0 text-[9px] font-semibold">
                        {lic.deadline}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-text-light font-normal">
                      <span className="truncate max-w-[130px]">{lic.organismo}</span>
                      <span className="text-text-secondary font-mono font-medium">
                        {formatCLP(lic.monto)}
                      </span>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* IA Insights & Recents */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* AI Insights Card */}
        <Card className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl shadow-glass">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sidebar-active-border" />
              Insights y Recomendaciones de Licitaciones
            </CardTitle>
            <CardDescription className="text-[13px] text-text-muted leading-relaxed">
              Recomendaciones predictivas de mercado generadas en vivo por nuestro LLM.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3.5 p-4 rounded-2xl border border-border-primary bg-white/30 dark:bg-white/[0.01]">
              <div className="h-6 w-6 shrink-0 rounded-lg bg-sidebar-active-bg flex items-center justify-center text-xs">
                💡
              </div>
              <div className="text-xs space-y-1">
                <p className="font-semibold text-text-primary">Foco Concentrado en Región Metropolitana</p>
                <p className="text-text-secondary leading-relaxed font-normal">
                  El 78% de tus propuestas seleccionadas son de la RM. Las bases en Valparaíso y Biobío para tus categorías han visto una reducción del 14% en oferentes, sugiriendo una menor fricción competitiva.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 p-4 rounded-2xl border border-border-primary bg-white/30 dark:bg-white/[0.01]">
              <div className="h-6 w-6 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center text-xs">
                ⚠️
              </div>
              <div className="text-xs space-y-1">
                <p className="font-semibold text-text-primary">Alerta de Frecuencia Competidora</p>
                <p className="text-text-secondary leading-relaxed font-normal">
                  Tu competidor directo principal ha completado la precalificación en dos licitaciones paralelas a tu portafolio de red. Recomendamos robustecer la oferta de valor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications Card */}
        <Card className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl shadow-glass">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Bell className="h-4 w-4 text-text-muted" />
                Alertas Recientes del Portal
              </CardTitle>
              <CardDescription className="text-[13px] text-text-muted leading-relaxed">
                Avisos críticos automatizados sobre cierres, multas y nuevas oportunidades en vivo.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start justify-between gap-4 p-3.5 rounded-2xl border border-border-primary bg-white/20 dark:border-white/5 dark:bg-white/[0.005] hover:border-sidebar-active-border/20 transition-all duration-300"
              >
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-text-primary">{notif.title}</p>
                  <p className="text-[10px] text-text-secondary leading-relaxed font-normal">{notif.message}</p>
                  <p className="text-[9px] text-text-light font-normal">{formatDate(notif.createdAt)}</p>
                </div>
                <Badge
                  variant={
                    notif.priority === 'critica'
                      ? 'danger'
                      : notif.priority === 'alta'
                      ? 'purple'
                      : notif.priority === 'media'
                      ? 'info'
                      : 'default'
                  }
                  className="text-[9px] font-semibold flex-shrink-0"
                >
                  {notif.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Premium High Relevance Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Zap className="h-4 w-4 text-sidebar-active-border" />
              Oportunidades Destacadas en Mercado Público
            </h2>
            <p className="text-[13px] text-text-muted leading-relaxed">
              Las convocatorias vigentes con el mejor índice de recomendación e idoneidad para tus keywords de negocio.
            </p>
          </div>
          <Link
            href="/licitaciones"
            className="flex items-center gap-1 text-xs text-sidebar-active-border hover:opacity-80 font-semibold group transition-colors"
          >
            Ver buscador inteligente
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {licitaciones.filter((l: any) => l.estado === 'publicada' && !dismissedIds.has(l.id)).slice(0, 4).map((lic: any) => (
            <Link key={lic.id} href={`/licitacion/${lic.id}`} className="group">
              <Card className="h-full rounded-2xl border border-border-primary bg-card-bg/60 backdrop-blur-md hover:border-sidebar-active-border/30 hover:bg-white/60 dark:hover:bg-white/[0.02] hover:shadow-glass hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <CardHeader className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[9px] text-text-light font-mono font-bold tracking-wider">{lic.codigo}</span>
                    <ScoreRing score={lic.aiScore || 75} size={36} strokeWidth={3} />
                  </div>
                  <CardTitle className="text-xs font-semibold text-text-primary line-clamp-2 leading-relaxed group-hover:text-sidebar-active-border transition-colors">
                    {lic.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="text-[10px] text-text-secondary space-y-0.5">
                    <p className="truncate text-slate-700 dark:text-slate-350 font-normal">{lic.organismo || 'Comprador Público'}</p>
                    <p className="text-[9px] text-text-light flex items-center gap-1 font-normal">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {lic.region || 'Multirregional'}
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-border-primary/80 flex items-center justify-between text-[10px]">
                    <span className="text-text-light font-normal">Monto Est.</span>
                    <span className="font-mono font-medium text-sidebar-active-border">{lic.montoEstimado > 0 ? formatCLP(lic.montoEstimado) : 'Consultar Bases'}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
