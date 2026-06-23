'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Zap,
  Search,
  Star,
  Sparkles,
  Loader2,
  MapPin,
  ChevronRight,
  RefreshCw,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  Building2,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/ui/score-ring';
import { formatCLP, formatDate, timeUntilDeadline } from '@/lib/utils';
import type { Licitacion, DashboardStats } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  
  // Feed filters
  const [filterQuery, setFilterQuery] = useState('');
  const [minRelevance, setMinRelevance] = useState<'all' | 'alta' | 'media'>('all');

  useEffect(() => {
    setMounted(true);
    // Load local storage states
    try {
      const storedCompany = localStorage.getItem('licitahub_company');
      if (storedCompany) setCompany(JSON.parse(storedCompany));
      
      const saved = JSON.parse(localStorage.getItem('licitahub_saved') || '[]');
      setSavedIds(new Set(saved));
    } catch (e) {}
  }, []);

  // User Profile
  const { data: companyData } = useSWR('/api/auth/me', fetcher, { revalidateOnFocus: false });
  useEffect(() => {
    if (companyData?.authenticated && companyData?.company) {
      setCompany(companyData.company);
      try {
        localStorage.setItem('licitahub_company', JSON.stringify(companyData.company));
      } catch {}
    }
  }, [companyData]);

  // Sync Progress & Stats from API
  const { data: syncProgress, mutate: mutateSyncStatus } = useSWR(
    mounted ? '/api/sync/status' : null,
    fetcher,
    { refreshInterval: syncing ? 1500 : 5000 }
  );

  // Personalized Matches Feed
  const { data: matchesResponse, isLoading: matchesLoading, mutate: mutateMatches } = useSWR(
    company?.id ? `/api/companies/${company.id}/matches?limit=100` : null,
    fetcher
  );

  const matches = matchesResponse?.data || [];

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sync/smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId: company?.id }),
      });
      const data = await res.json();
      setSyncResult(data);
      mutateSyncStatus();
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
      mutateSyncStatus();
    }
  };

  const handleToggleSave = (match: any) => {
    const id = match.licitacionCodigo || match.id;
    let isCurrentlySaved = false;

    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        isCurrentlySaved = false;
      } else {
        next.add(id);
        isCurrentlySaved = true;
      }
      return next;
    });

    const saved = JSON.parse(localStorage.getItem('licitahub_saved') || '[]');
    const idx = saved.indexOf(id);
    if (idx >= 0) saved.splice(idx, 1);
    else saved.push(id);
    localStorage.setItem('licitahub_saved', JSON.stringify(saved));

    const savedLics = JSON.parse(localStorage.getItem('licitahub_saved_licitaciones') || '[]');
    const licIdx = savedLics.findIndex((s: any) => s.licitacionId === id);
    if (licIdx >= 0) {
      savedLics.splice(licIdx, 1);
    } else {
      const wrapper = {
        id: `saved-${id}`,
        organizationId: company?.id || 'programbi-id',
        licitacionId: id,
        licitacion: {
          id: id,
          codigo: id,
          nombre: match.licitacionNombre || match.nombre,
          descripcion: match.aiInsights || match.descripcion || '',
          estado: match.licitacionEstado || match.estado || 'publicada',
          tipo: match.tipo || 'LP',
          organismo: match.licitacionOrganismo || match.organismo || '',
          region: match.licitacionRegion || match.region || '',
          fechaCierre: match.licitacionFechaCierre || match.fechaCierre || '',
          montoEstimado: match.licitacionMontoEstimado || match.montoEstimado || 0,
          aiScore: match.aiScore || 70,
          aiInsights: match.aiInsights || '',
        },
        status: 'guardada',
        notes: '',
        priority: 'media',
        tags: [],
        createdAt: new Date().toISOString()
      };
      savedLics.push(wrapper);
    }
    localStorage.setItem('licitahub_saved_licitaciones', JSON.stringify(savedLics));
  };

  // Filter recommendations feed
  const filteredMatches = useMemo(() => {
    let result = matches;

    if (minRelevance !== 'all') {
      result = result.filter((m: any) => m.aiRecommendation === minRelevance);
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      result = result.filter((m: any) =>
        m.licitacionNombre.toLowerCase().includes(q) ||
        m.licitacionOrganismo.toLowerCase().includes(q) ||
        m.licitacionCodigo.toLowerCase().includes(q) ||
        (m.aiInsights && m.aiInsights.toLowerCase().includes(q))
      );
    }

    return result;
  }, [matches, filterQuery, minRelevance]);

  // Derived stats
  const stats = useMemo(() => {
    const total = syncProgress?.totalProcessed || 0;
    const ignored = syncProgress?.totalIgnored || 0;
    const matched = syncProgress?.totalAiScored || 0;
    
    return {
      total,
      ignored,
      matched,
      hasRan: total > 0,
      lastSync: syncProgress?.lastSyncTimestamp ? new Date(syncProgress.lastSyncTimestamp) : null
    };
  }, [syncProgress]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-sidebar-active-border" />
      </div>
    );
  }

  const isSyncActive = syncing || syncProgress?.isRunning;

  return (
    <div className="space-y-6 relative z-10 animate-fade-in">
      
      {/* Header Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-glass">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ChileCompra API Conectada
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sidebar-active-bg text-sidebar-active-border border border-sidebar-active-border/10">
              ⚡ Copiloto IA listo
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Panel de Control: Licitaciones para {company?.name || 'ProgramBi'}
          </h1>
          <p className="text-[13px] text-text-secondary max-w-xl leading-relaxed">
            Escaneamos de forma continua Mercado Público para extraer las oportunidades de capacitación y desarrollo tecnológico idóneas para tu catálogo de servicios.
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncActive}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-semibold transition-all duration-300 border shadow-sm cursor-pointer ${
            isSyncActive
              ? 'bg-slate-100 dark:bg-white/5 border-border-primary text-slate-400 cursor-not-allowed'
              : 'bg-sidebar-active-border text-white hover:opacity-90 border-transparent'
          }`}
        >
          {isSyncActive ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isSyncActive ? 'Escaneando...' : 'Sincronizar Hoy'}
        </button>
      </div>

      {/* Syncing active status card */}
      {isSyncActive && (
        <div className="p-6 rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl animate-fade-in space-y-4 shadow-glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-sidebar-active-border" />
              <span className="text-xs font-semibold text-text-primary">
                {syncProgress?.currentStep || 'Iniciando escaneo en Mercado Público...'}
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
        </div>
      )}

      {/* Sync Result Toast Banner */}
      {syncResult && (
        <div className={`flex items-center justify-between gap-3 px-5 py-4 rounded-2xl text-xs font-semibold border animate-fade-in ${
          syncResult.success 
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 border-emerald-500/20'
            : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
        }`}>
          <div className="flex items-center gap-2">
            {syncResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
            )}
            <span>
              {syncResult.success ? (
                <>
                  Escaneo finalizado: se analizaron <strong className="font-extrabold">{syncResult.licitacionesFetched}</strong> licitaciones públicas de hoy, filtrando <strong className="font-extrabold">{syncResult.ignored}</strong> no afines y guardando <strong className="font-extrabold">{syncResult.aiScored}</strong> recomendadas para tu perfil.
                </>
              ) : (
                <>No se pudo completar la sincronización: {syncResult.error || 'Error en conexión a la API'}</>
              )}
            </span>
          </div>
          <button onClick={() => setSyncResult(null)} className="text-xs font-bold hover:scale-110 transition-transform opacity-60 hover:opacity-100 p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* Statistics and Filtering Overview */}
      <div className="grid grid-cols-1 divide-y divide-border-primary sm:grid-cols-2 lg:grid-cols-4 sm:divide-y-0 sm:divide-x border border-border-primary rounded-3xl bg-card-bg/60 backdrop-blur-xl overflow-hidden shadow-glass">
        
        {/* Metric 1 */}
        <div className="p-5 flex flex-col justify-between hover:bg-white/30 dark:hover:bg-white/[0.01] transition-colors text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">ChileCompra Ingeridas</span>
            <Building2 className="h-4 w-4 text-text-muted" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary tracking-tight">{stats.hasRan ? stats.total : 0}</span>
            <span className="text-[9px] font-semibold text-text-light">Totales hoy</span>
          </div>
          <p className="text-[10px] text-text-light mt-1.5 leading-relaxed font-normal">
            Bases de licitaciones publicadas
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 flex flex-col justify-between hover:bg-white/30 dark:hover:bg-white/[0.01] transition-colors text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Filtradas por Rubro</span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary tracking-tight">{stats.hasRan ? stats.ignored : 0}</span>
            <span className="text-[9px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {stats.total ? Math.round((stats.ignored / stats.total) * 100) : 0}%
            </span>
          </div>
          <p className="text-[10px] text-text-light mt-1.5 leading-relaxed font-normal">
            Descartadas automáticamente
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 flex flex-col justify-between hover:bg-white/30 dark:hover:bg-white/[0.01] transition-colors text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Recomendadas por IA</span>
            <Sparkles className="h-4 w-4 text-sidebar-active-border" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary tracking-tight">{stats.hasRan ? stats.matched : 0}</span>
            <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {stats.total ? Math.round((stats.matched / stats.total) * 100) : 0}% Afin
            </span>
          </div>
          <p className="text-[10px] text-text-light mt-1.5 leading-relaxed font-normal">
            Pasan umbral de relevancia &ge; 60%
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 flex flex-col justify-between hover:bg-white/30 dark:hover:bg-white/[0.01] transition-colors text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Última Sincronización</span>
            <Clock className="h-4 w-4 text-text-muted" />
          </div>
          <div className="mt-4 flex flex-col justify-end">
            <span className="text-xs font-semibold text-text-primary tracking-tight leading-none">
              {stats.lastSync ? stats.lastSync.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'Sin sincronizar'}
            </span>
            <span className="text-[9px] text-text-light mt-1 block">
              {stats.lastSync ? stats.lastSync.toLocaleDateString('es-CL') : 'Ejecuta una sincronización'}
            </span>
          </div>
          <p className="text-[10px] text-text-light mt-1.5 leading-relaxed font-normal">
            Historial de escaneo diario
          </p>
        </div>
      </div>

      {/* Main Content Area - AI Recommendations Feed */}
      <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-6 space-y-6 shadow-glass">
        
        {/* Feed Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-primary/50">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-sidebar-active-border" />
              Feed de Recomendaciones Inteligentes
            </h2>
            <p className="text-[12.5px] text-text-muted">
              Licitaciones que mejor se alinean a tu catálogo de Power BI, SQL, Python y Capacitación.
            </p>
          </div>

          {/* Inline filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search filter input */}
            <div className="relative group w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted group-focus-within:text-sidebar-active-border transition-colors" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filtrar feed..."
                className="w-full pl-8.5 pr-7 py-1.5 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-border-primary text-xs font-semibold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-sidebar-active-border/40 transition-all"
              />
              {filterQuery && (
                <button onClick={() => setFilterQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-500 cursor-pointer">✕</button>
              )}
            </div>

            {/* Relevance toggle dropdown */}
            <select
              value={minRelevance}
              onChange={(e: any) => setMinRelevance(e.target.value)}
              className="bg-white/40 dark:bg-slate-950/40 border border-border-primary rounded-xl px-2.5 py-1.5 text-xs font-semibold text-text-primary focus:outline-none focus:border-sidebar-active-border/40 cursor-pointer"
            >
              <option value="all">Toda Relevancia</option>
              <option value="alta">🔥 Alta Relevancia</option>
              <option value="media">👀 Relevancia Media</option>
            </select>
          </div>
        </div>

        {/* Matches Feed Cards */}
        {matchesLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-7 w-7 animate-spin text-sidebar-active-border" />
            <p className="text-xs font-semibold text-text-muted">Cargando recomendaciones...</p>
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredMatches.map((match: any) => {
              const isSaved = savedIds.has(match.licitacionCodigo);
              const deadlineInfo = match.licitacionFechaCierre ? timeUntilDeadline(match.licitacionFechaCierre) : null;
              
              return (
                <div 
                  key={match.id}
                  className="group relative rounded-2xl border border-border-primary bg-white/45 dark:bg-white/[0.015] p-5 hover:border-sidebar-active-border/30 hover:bg-white/75 dark:hover:bg-white/[0.03] transition-all duration-300 hover:shadow-glass flex flex-col md:flex-row justify-between gap-5"
                >
                  
                  {/* Left Column: Core Info + AI analysis */}
                  <div className="flex-1 space-y-3 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-text-light font-mono font-bold tracking-wider">{match.licitacionCodigo}</span>
                      
                      <Badge 
                        variant={match.aiRecommendation === 'alta' ? 'success' : match.aiRecommendation === 'media' ? 'info' : 'default'} 
                        className="font-bold text-[9px] py-0.5 px-1.5 uppercase"
                      >
                        {match.aiRecommendation === 'alta' ? 'Relevancia Alta' : match.aiRecommendation === 'media' ? 'Relevancia Media' : 'Relevancia Básica'}
                      </Badge>
                      
                      {deadlineInfo?.urgent && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" title="Próximo cierre" />
                      )}
                    </div>

                    <h3 className="text-[14px] font-bold text-text-primary leading-snug group-hover:text-sidebar-active-border transition-colors">
                      <Link href={`/licitacion/${match.licitacionCodigo}`}>
                        {match.licitacionNombre}
                      </Link>
                    </h3>

                    {/* AI Insights Description block */}
                    <div className="p-3.5 rounded-xl border border-border-primary/50 bg-slate-50/50 dark:bg-[#121214]/60 text-[11.5px] leading-relaxed text-text-secondary font-normal">
                      <strong className="font-semibold text-text-primary block mb-1">🤖 Análisis de Copiloto IA:</strong>
                      {match.aiInsights || 'Licitación alineada a tus keywords configuradas. Consulta los pliegos técnicos para detalles.'}
                    </div>

                    {/* Meta Info Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] text-text-light font-medium pt-1">
                      <span className="flex items-center gap-1.5 max-w-[200px] truncate" title={match.licitacionOrganismo}>
                        <Building2 className="h-3.5 w-3.5 text-text-light" />
                        {match.licitacionOrganismo || 'Organismo Público'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-text-light" />
                        {match.licitacionRegion || 'Multirregional'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-text-light" />
                        Cierre: {match.licitacionFechaCierre ? formatDate(match.licitacionFechaCierre) : 'bases'}
                      </span>
                      {match.licitacionMontoEstimado > 0 && (
                        <span className="text-sidebar-active-border font-bold font-mono">
                          {formatCLP(match.licitacionMontoEstimado)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Relevance Circle, Bookmark Action */}
                  <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-4 shrink-0 border-t md:border-t-0 border-border-primary/40 pt-3 md:pt-0">
                    
                    {/* IA Score ring indicator */}
                    <div className="flex items-center gap-3">
                      <div className="text-right space-y-0.5">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Score de Afinida</span>
                        <span className="text-xs font-semibold text-text-secondary block">ProgramBi.com</span>
                      </div>
                      <ScoreRing score={match.hybridScore || match.aiScore || 70} size={48} strokeWidth={3.5} />
                    </div>

                    {/* Actions: Save/Favorite button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSave(match)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/25'
                            : 'bg-white/40 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-white/[0.04] text-text-secondary border-border-primary hover:border-sidebar-active-border/20'
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${isSaved ? 'fill-emerald-500 text-emerald-500' : 'text-text-muted'}`} />
                        <span>{isSaved ? 'Guardada' : 'Guardar'}</span>
                      </button>
                      
                      <Link href={`/licitacion/${match.licitacionCodigo}`}>
                        <button className="p-2 rounded-xl border border-border-primary bg-white/40 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-white/[0.04] text-text-secondary cursor-pointer">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Feed state block */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Zap className="h-10 w-10 text-text-muted mb-4 animate-bounce" />
            <h3 className="text-sm font-semibold text-text-secondary mb-2">No hay recomendaciones cargadas aún</h3>
            <p className="text-xs text-text-muted max-w-sm mb-6 leading-relaxed font-normal">
              {stats.hasRan 
                ? 'No encontramos licitaciones que superaran el 60% de afinidad con tu perfil el día de hoy. Prueba ajustando tus palabras clave o regiones.'
                : 'Aún no has sincronizado licitaciones el día de hoy. Presiona el botón "Sincronizar Hoy" para iniciar el análisis semántico de IA.'
              }
            </p>
            {!stats.hasRan && (
              <button 
                onClick={handleSync}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-sidebar-active-border hover:opacity-95 shadow-sm transition-all cursor-pointer"
              >
                Ejecutar Sincronización
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
