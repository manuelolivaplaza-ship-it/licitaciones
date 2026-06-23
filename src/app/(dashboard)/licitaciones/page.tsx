'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  Clock,
  MapPin,
  Building2,
  BookmarkPlus,
  Loader2,
  RefreshCw,
  Calendar,
  Wifi,
  WifiOff,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/ui/score-ring';
import { cn, formatCLP, formatDate, formatDateRelative } from '@/lib/utils';
import { LicitacionCard } from '@/components/ui/licitacion-card';
import type { Licitacion, LicitacionEstado } from '@/types';
import { REGIONES_CHILE, ESTADO_LABELS } from '@/types';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('API request failed');
  return res.json();
});

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sidebar-active-bg text-sidebar-active-border border border-sidebar-active-border/20 animate-fade-in">
      {label}
      <button onClick={onRemove} className="hover:scale-110 transition-transform text-text-muted hover:text-red-500 cursor-pointer">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}


// --- Licitación Row (Table View) ---
function LicitacionRow({
  licitacion,
  onSave,
  onDismiss,
  isSaved
}: {
  licitacion: Licitacion;
  onSave: (id: string) => void;
  onDismiss?: (id: string) => void;
  isSaved: boolean;
}) {
  const score = licitacion.aiScore || 0;
  const isUrgent = licitacion.estado === 'publicada' &&
    new Date(licitacion.fechaCierre).getTime() - Date.now() < 48 * 60 * 60 * 1000;

  const estadoBadge: Record<LicitacionEstado, { variant: 'success' | 'default' | 'warning' | 'danger' | 'info' | 'purple'; label: string }> = {
    publicada: { variant: 'success', label: 'Activa' },
    cerrada: { variant: 'default', label: 'Cerrada' },
    adjudicada: { variant: 'info', label: 'Adjudicada' },
    desierta: { variant: 'warning', label: 'Desierta' },
    revocada: { variant: 'danger', label: 'Revocada' },
    suspendida: { variant: 'warning', label: 'Suspendida' },
  };

  return (
    <tr className="group border-b border-border-primary/50 hover:bg-slate-100/50 dark:hover:bg-white/[0.015] transition-colors duration-200">
      <td className="py-4 px-4">
        <ScoreRing score={score} size={34} strokeWidth={2.5} />
      </td>
      <td className="py-4 px-4 max-w-sm">
        <div>
          <p className="text-xs font-semibold text-text-primary group-hover:text-sidebar-active-border transition-colors leading-relaxed line-clamp-2 font-normal">
            <Link href={`/licitacion/${licitacion.id}`} className="transition-colors">
              {licitacion.nombre}
            </Link>
          </p>
          <p className="text-[9px] text-text-light font-mono tracking-wider mt-1">{licitacion.codigo}</p>
        </div>
      </td>
      <td className="py-4 px-4">
        <p className="text-xs font-medium text-slate-550 dark:text-slate-400 truncate max-w-[200px]">{licitacion.organismo || '—'}</p>
      </td>
      <td className="py-4 px-4">
        <p className="text-xs font-medium text-text-light truncate max-w-[150px]">{licitacion.region || '—'}</p>
      </td>
      <td className="py-4 px-4">
        <Badge variant={estadoBadge[licitacion.estado].variant} className="text-[9px] font-semibold">
          {estadoBadge[licitacion.estado].label}
        </Badge>
      </td>
      <td className="py-4 px-4 text-right">
        <p className="text-xs font-semibold text-text-primary tabular-nums">{licitacion.montoEstimado > 0 ? formatCLP(licitacion.montoEstimado) : '—'}</p>
      </td>
      <td className="py-4 px-4">
        <p className="text-xs font-medium text-text-light">
          {licitacion.fechaPublicacion ? formatDate(licitacion.fechaPublicacion) : '—'}
        </p>
      </td>
      <td className="py-4 px-4">
        <p className={cn('text-xs font-medium', isUrgent ? 'text-red-500' : 'text-text-light')}>
          {formatDate(licitacion.fechaCierre)}
        </p>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onSave(licitacion.id); }}
            className={cn(
              'p-2 rounded-lg border transition-all duration-200 cursor-pointer',
              isSaved
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                : 'text-text-muted border-border-primary/50 hover:text-sidebar-active-border hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            )}
            title="Guardar"
          >
            <BookmarkPlus className="h-4 w-4" />
          </button>
          {onDismiss && (
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(licitacion.id); }}
              className="p-2 rounded-lg border border-border-primary/50 text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-550/15 transition-colors cursor-pointer"
              title="Ocultar de la lista"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// --- Main Page ---
export default function LicitacionesPage() {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('mock');
  const [showApiDetails, setShowApiDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  
  // Custom smart filter "Para mi empresa"
  const [company, setCompany] = useState<any | null>(null);
  const [paraMiEmpresa, setParaMiEmpresa] = useState(true);

  // Date picker state
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  // Convert yyyy-mm-dd to ddmmyyyy for ChileCompra API
  const formatDateForApi = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}${parts[1]}${parts[0]}`;
  };

  // Fetch company profile on mount via SWR
  const { data: companyData, isLoading: companyLoading } = useSWR('/api/auth/me', fetcher, { revalidateOnFocus: false });
  useEffect(() => {
    if (companyData?.authenticated && companyData?.company) {
      setCompany(companyData.company);
    }
  }, [companyData]);

  // Format URL for SWR
  const getSearchUrl = () => {
    if (companyLoading) return null; // Prevent fetching until auth is determined to avoid double-hitting external APIs
    if (!selectedDate) return null;
    const fecha = formatDateForApi(selectedDate);
    const profileParam = company ? `&profile=${encodeURIComponent(JSON.stringify(company))}` : '';
    return `/api/licitaciones/search?fecha=${fecha}${profileParam}`;
  };

  // Use SWR for licitaciones fetching
  const { data: searchResponse, error: searchError, isLoading: searchLoading, mutate: refetch } = useSWR(
    getSearchUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (searchLoading) setLoading(true);
    else setLoading(false);
  }, [searchLoading]);

  // Resolve final Licitaciones Data
  useEffect(() => {
    if (searchResponse?.data) {
      setLicitaciones(searchResponse.data);
      setDataSource(searchResponse.source === 'mock-fallback' ? 'mock' : (searchResponse.source || 'api'));
      setError(null);
    } else if (searchResponse?.error) {
      console.warn('API returned error field:', searchResponse.error);
      const { getMockLicitaciones } = require('@/lib/mock/data');
      setLicitaciones(getMockLicitaciones());
      setDataSource('mock');
      setError(searchResponse.error);
    } else if (searchError) {
      console.warn('Failed to fetch from API:', searchError);
      const { getMockLicitaciones } = require('@/lib/mock/data');
      setLicitaciones(getMockLicitaciones());
      setDataSource('mock');
      setError(searchError.message || 'Error fetching data');
    }
  }, [searchResponse, searchError]);

  // Escuchar por nuevos matches en background para actualizar la lista de forma automática
  useEffect(() => {
    const handleNewMatch = () => {
      console.log('Nuevo match detectado. Refetching licitaciones de forma dinámica...');
      refetch();
    };
    window.addEventListener('licitahub-new-match', handleNewMatch);
    return () => window.removeEventListener('licitahub-new-match', handleNewMatch);
  }, [refetch]);


  // Filter states
  const [selectedEstados, setSelectedEstados] = useState<LicitacionEstado[]>([]);
  const [selectedRegiones, setSelectedRegiones] = useState<string[]>([]);
  const [montoMin, setMontoMin] = useState<string>('');
  const [montoMax, setMontoMax] = useState<string>('');
  const [soloRelevantes, setSoloRelevantes] = useState(false);

  const handleSave = useCallback(async (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Store in localStorage
    const saved = JSON.parse(localStorage.getItem('licitahub_saved') || '[]');
    const idx = saved.indexOf(id);
    if (idx >= 0) saved.splice(idx, 1);
    else saved.push(id);
    localStorage.setItem('licitahub_saved', JSON.stringify(saved));

    // Save full SavedLicitacion object wrapper for favorites page local persistence
    const savedLics = JSON.parse(localStorage.getItem('licitahub_saved_licitaciones') || '[]');
    const licIdx = savedLics.findIndex((s: any) => s.licitacionId === id);
    if (licIdx >= 0) {
      savedLics.splice(licIdx, 1);
    } else {
      const lic = licitaciones.find((l: any) => l.id === id);
      if (lic) {
        const wrapper = {
          id: `saved-${lic.id}`,
          organizationId: company?.id || 'programbi-id',
          licitacionId: lic.id,
          licitacion: lic,
          status: 'guardada',
          notes: '',
          priority: 'media',
          tags: [],
          createdAt: new Date().toISOString()
        };
        savedLics.push(wrapper);
      }
    }
    localStorage.setItem('licitahub_saved_licitaciones', JSON.stringify(savedLics));
  }, [licitaciones, company]);

  // Load saved IDs and dismissed IDs
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('licitahub_saved') || '[]');
      setSavedIds(new Set(saved));
      
      const dismissed = JSON.parse(localStorage.getItem('licitahub_dismissed_licitaciones') || '[]');
      setDismissedIds(new Set(dismissed));
    } catch {}
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      localStorage.setItem('licitahub_dismissed_licitaciones', JSON.stringify(Array.from(updated)));
      return updated;
    });
  }, []);

  const toggleEstado = (estado: LicitacionEstado) => {
    setSelectedEstados(prev =>
      prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
    );
  };

  const toggleRegion = (region: string) => {
    setSelectedRegiones(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const clearFilters = () => {
    setSelectedEstados([]);
    setSelectedRegiones([]);
    setMontoMin('');
    setMontoMax('');
    setSoloRelevantes(false);
    setSearchQuery('');
  };

  // Apply filters
  const filteredLicitaciones = useMemo(() => {
    let result = licitaciones;

    // 0. Filter out dismissed tenders
    if (dismissedIds && dismissedIds.size > 0) {
      result = result.filter(l => !dismissedIds.has(l.id));
    }

    // 1. Standard text query search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.nombre.toLowerCase().includes(q) ||
        l.descripcion.toLowerCase().includes(q) ||
        l.organismo.toLowerCase().includes(q) ||
        l.codigo.toLowerCase().includes(q)
      );
    }

    // 2. Active filters from slideout drawer
    if (selectedEstados.length > 0) {
      result = result.filter(l => selectedEstados.includes(l.estado));
    }

    if (selectedRegiones.length > 0) {
      result = result.filter(l => selectedRegiones.includes(l.region));
    }

    if (montoMin) {
      result = result.filter(l => l.montoEstimado >= parseInt(montoMin));
    }

    if (montoMax) {
      result = result.filter(l => l.montoEstimado <= parseInt(montoMax));
    }

    if (soloRelevantes) {
      result = result.filter(l => (l.aiScore || 0) >= 60);
    }

    // 3. Smart corporate custom filter "Para mi empresa"
    if (paraMiEmpresa && company) {
      result = result.filter(l => (l.aiScore || 0) >= 60);
    }

    return result;
  }, [licitaciones, searchQuery, selectedEstados, selectedRegiones, montoMin, montoMax, soloRelevantes, paraMiEmpresa, company, dismissedIds]);

  const hasActiveFilters = selectedEstados.length > 0 || selectedRegiones.length > 0 || montoMin || montoMax || soloRelevantes || paraMiEmpresa;

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Connected / Demo Status Banner */}
      <div className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs font-medium border transition-all animate-fade-in',
        dataSource === 'api'
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      )}>
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full shrink-0 ${dataSource === 'api' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {dataSource === 'api' ? (
            <span>Buscador conectado en tiempo real a la API de Mercado Público — {licitaciones.length} convocatorias procesadas</span>
          ) : (
            <span>Modo Demostración — {error ? `Error API: ${error}` : 'Demostración con datos locales integrados'}</span>
          )}
        </div>
        <button
          onClick={() => setShowApiDetails(!showApiDetails)}
          className="text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary underline cursor-pointer self-start sm:self-auto"
        >
          {showApiDetails ? 'Ocultar Estructura' : 'Ver Estructura de Datos'}
        </button>
      </div>

      {/* Explanatory Data Structure Card */}
      {showApiDetails && (
        <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-5 space-y-4 animate-fade-in shadow-glass">
          <div className="flex items-center gap-2 border-b border-border-primary/50 pb-2">
            <Wifi className="h-4 w-4 text-sidebar-active-border" />
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Estructura de Datos Ingerida desde ChileCompra</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed font-normal">
            Cada licitación pública descargada desde la API oficial de Mercado Público contiene los siguientes campos clave que indexamos en nuestra base de datos para el motor de Inteligencia Artificial:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-border-primary/55 space-y-1">
              <span className="text-[9px] font-bold text-sidebar-active-border uppercase">Identificación</span>
              <p className="text-xs font-semibold text-text-primary">ID de Licitación</p>
              <p className="text-[10.5px] text-text-light font-normal leading-normal">
                El <strong className="font-semibold text-text-primary">Código Externo</strong> oficial del portal (ej. 2392-12-LE26) y el <strong className="font-semibold text-text-primary">Nombre descriptivo</strong> de la convocatoria.
              </p>
            </div>
            
            <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-border-primary/55 space-y-1">
              <span className="text-[9px] font-bold text-violet-500 uppercase">Especificaciones</span>
              <p className="text-xs font-semibold text-text-primary">Ficha y Categorías ONU</p>
              <p className="text-[10.5px] text-text-light font-normal leading-normal">
                La <strong className="font-semibold text-text-primary">Descripción</strong> técnica completa de bases, junto con el desglose de <strong className="font-semibold text-text-primary">Ítems</strong> codificados bajo el clasificador internacional de la ONU.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-border-primary/55 space-y-1">
              <span className="text-[9px] font-bold text-emerald-500 uppercase">Valores e Hitos</span>
              <p className="text-xs font-semibold text-text-primary">Presupuesto y Fechas</p>
              <p className="text-[10.5px] text-text-light font-normal leading-normal">
                El <strong className="font-semibold text-text-primary">Monto Estimado</strong> en moneda origen (CLP o UF), la <strong className="font-semibold text-text-primary">Fecha de Publicación</strong> y la <strong className="font-semibold text-text-primary">Fecha y Hora de Cierre</strong> de ofertas.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-border-primary/55 space-y-1">
              <span className="text-[9px] font-bold text-pink-500 uppercase">Comprador</span>
              <p className="text-xs font-semibold text-text-primary">Institución y Cobertura</p>
              <p className="text-[10.5px] text-text-light font-normal leading-normal">
                El <strong className="font-semibold text-text-primary">Organismo Comprador</strong> (Ministerio, Hospital, Municipalidad), comuna y la <strong className="font-semibold text-text-primary">Región</strong> correspondiente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Explorador de Licitaciones</h1>
          <p className="text-[13px] text-text-muted leading-relaxed font-normal">
            {loading ? 'Consultando bases de datos...' : `Encontramos ${filteredLicitaciones.length} licitaciones del portal ChileCompra`}
            {hasActiveFilters && ' aplicando filtros'}
          </p>
        </div>

        {/* Date Selection Panel */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative group shrink-0">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-light group-hover:text-sidebar-active-border transition-colors pointer-events-none z-10" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-3.5 py-2.5 rounded-xl bg-card-bg/60 border border-border-primary text-xs font-medium text-text-primary focus:outline-none focus:border-sidebar-active-border/50 transition-all cursor-pointer select-none"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={loading}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all duration-300 cursor-pointer shrink-0',
              'bg-sidebar-active-bg text-sidebar-active-border border-sidebar-active-border/20 hover:opacity-90',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-sidebar-active-border" /> : <RefreshCw className="h-4 w-4" />}
            Actualizar
          </button>
        </div>
      </div>

      {/* Spotlight Search & Filters Bar */}
      <div className="flex flex-col gap-4">
        {/* Spotlight-style search box */}
        <div className="relative w-full group shadow-diffusion">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-hover:text-sidebar-active-border group-focus-within:text-sidebar-active-border transition-colors duration-200" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por palabra clave, código, organismo..."
            className="w-full pl-12 pr-12 py-4 rounded-2xl bg-card-bg/85 backdrop-blur-xl border border-border-primary text-sm font-normal text-text-primary placeholder:text-text-muted focus:outline-none focus:border-sidebar-active-border focus:ring-4 focus:ring-sidebar-active-border/5 transition-all shadow-glass"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-500 hover:scale-110 transition-all cursor-pointer p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer',
                showFilters || hasActiveFilters
                  ? 'bg-sidebar-active-bg text-sidebar-active-border border-sidebar-active-border/25 shadow-sm'
                  : 'bg-card-bg/60 text-text-secondary border-border-primary hover:border-sidebar-active-border/20'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
              {hasActiveFilters && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sidebar-active-border text-white text-[9px] font-bold border border-white dark:border-[#09090b]">
                  {selectedEstados.length + selectedRegiones.length + (montoMin ? 1 : 0) + (montoMax ? 1 : 0) + (soloRelevantes ? 1 : 0) + (paraMiEmpresa ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Relevance Toggle */}
            <button
              onClick={() => setSoloRelevantes(!soloRelevantes)}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer',
                soloRelevantes
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                  : 'bg-card-bg/60 text-text-secondary border-border-primary hover:border-sidebar-active-border/20'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Solo Relevantes
            </button>

            {/* Para mi Empresa Toggle */}
            {company && (
              <button
                onClick={() => setParaMiEmpresa(!paraMiEmpresa)}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer',
                  paraMiEmpresa
                    ? 'bg-sidebar-active-bg text-sidebar-active-border border-sidebar-active-border/30 shadow-sm'
                    : 'bg-card-bg/60 text-text-secondary border-border-primary hover:border-sidebar-active-border/20'
                )}
              >
                <Building2 className="h-3.5 w-3.5" />
                Para Mi Empresa
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-xl border border-border-primary overflow-hidden bg-card-bg/60">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2.5 transition-colors cursor-pointer',
                viewMode === 'grid' ? 'bg-sidebar-active-bg text-sidebar-active-border' : 'text-text-light hover:text-text-primary'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2.5 transition-colors cursor-pointer',
                viewMode === 'table' ? 'bg-sidebar-active-bg text-sidebar-active-border' : 'text-text-light hover:text-text-primary'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filter Popout Panel */}
      {showFilters && (
        <div className="rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl p-6 space-y-6 shadow-glass animate-fade-in">
          <div className="flex items-center justify-between border-b border-border-primary/45 pb-3">
            <h3 className="text-xs font-semibold text-text-primary flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-sidebar-active-border" />
              Panel de Filtros Avanzados
            </h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-bold text-red-650 dark:text-red-400 hover:underline cursor-pointer">
                Limpiar todo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Estado */}
            <div className="space-y-2 text-left">
              <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider">Estado Licitación</p>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {(Object.entries(ESTADO_LABELS) as [LicitacionEstado, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleEstado(key)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border cursor-pointer',
                      selectedEstados.includes(key)
                        ? 'bg-sidebar-active-bg text-sidebar-active-border border-sidebar-active-border/30'
                        : 'bg-white/30 dark:bg-white/[0.01] text-text-secondary border-border-primary hover:border-sidebar-active-border/20'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Región */}
            <div className="space-y-2 text-left">
              <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider">Filtrar por Región</p>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                {REGIONES_CHILE.map(r => (
                  <button
                    key={r.code}
                    onClick={() => toggleRegion(r.name)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border cursor-pointer',
                      selectedRegiones.includes(r.name)
                        ? 'bg-sidebar-active-bg text-sidebar-active-border border-sidebar-active-border/30'
                        : 'bg-white/30 dark:bg-white/[0.01] text-text-secondary border-border-primary hover:border-sidebar-active-border/20'
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Monto Rango */}
            <div className="space-y-2 text-left">
              <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider">Rango Presupuesto (CLP)</p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={montoMin}
                    onChange={e => setMontoMin(e.target.value)}
                    placeholder="Mínimo ($)"
                    className="w-full px-3 py-2 rounded-xl bg-white/30 dark:bg-white/[0.01] border border-border-primary text-xs font-semibold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-sidebar-active-border/40"
                  />
                </div>
                <span className="text-text-muted font-bold">—</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={montoMax}
                    onChange={e => setMontoMax(e.target.value)}
                    placeholder="Máximo ($)"
                    className="w-full px-3 py-2 rounded-xl bg-white/30 dark:bg-white/[0.01] border border-border-primary text-xs font-semibold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-sidebar-active-border/40"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Pill Feed */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 animate-fade-in pt-1">
          {selectedEstados.map(e => (
            <FilterChip key={e} label={ESTADO_LABELS[e]} onRemove={() => toggleEstado(e)} />
          ))}
          {selectedRegiones.map(r => (
            <FilterChip key={r} label={r} onRemove={() => toggleRegion(r)} />
          ))}
          {montoMin && <FilterChip label={`Mín: $${parseInt(montoMin).toLocaleString('es-CL')}`} onRemove={() => setMontoMin('')} />}
          {montoMax && <FilterChip label={`Máx: $${parseInt(montoMax).toLocaleString('es-CL')}`} onRemove={() => setMontoMax('')} />}
          {soloRelevantes && <FilterChip label="Solo recomendados IA" onRemove={() => setSoloRelevantes(false)} />}
        </div>
      )}

      {/* Search Grid / Table Results */}
      {loading ? (
        // Premium layout skeleton boxes
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 p-5 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-5 w-16 bg-border-primary rounded-lg" />
                <div className="h-10 w-10 bg-border-primary rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-border-primary rounded" />
                <div className="h-4 w-3/4 bg-border-primary rounded" />
              </div>
              <div className="h-3.5 w-1/2 bg-border-primary rounded" />
              <div className="pt-4 border-t border-border-primary">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-border-primary rounded" />
                  <div className="h-4 w-16 bg-border-primary rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredLicitaciones.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredLicitaciones.slice(0, 30).map(lic => (
              <LicitacionCard key={lic.id} licitacion={lic} onSave={handleSave} onDismiss={handleDismiss} isSaved={savedIds.has(lic.id)} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-primary/80 bg-white/40 dark:bg-slate-950/40">
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider w-16">Score</th>
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Licitación</th>
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Organismo Público</th>
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Región</th>
                    <th className="py-3 px-4 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider">Monto</th>
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Publicación</th>
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Cierre</th>
                    <th className="py-4 px-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary/50">
                  {filteredLicitaciones.slice(0, 50).map(lic => (
                     <LicitacionRow key={lic.id} licitacion={lic} onSave={handleSave} onDismiss={handleDismiss} isSaved={savedIds.has(lic.id)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty search state box */
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border border-border-primary bg-card-bg/60 backdrop-blur-xl shadow-glass">
          <Search className="h-12 w-12 text-text-muted mb-4 animate-bounce" />
          <h3 className="text-sm font-semibold text-text-secondary mb-2">No encontramos licitaciones</h3>
          <p className="text-xs text-text-muted max-w-sm mb-6 leading-relaxed font-normal">
            No encontramos registros vigentes para los filtros o fecha seleccionada en ChileCompra. Intenta modificando la palabra clave o ampliando el rango presupuestario.
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs font-semibold text-sidebar-active-border hover:underline cursor-pointer">
              Limpiar todos los filtros
            </button>
          )}
        </div>
      )}

      {/* Pagination trigger */}
      {!loading && filteredLicitaciones.length > (viewMode === 'grid' ? 30 : 50) && (
        <div className="flex justify-center pt-6">
          <button className="px-8 py-3 rounded-xl text-xs font-semibold text-sidebar-active-border bg-sidebar-active-bg hover:opacity-90 border border-sidebar-active-border/20 transition-all cursor-pointer shadow-sm">
            Cargar Más Licitaciones
          </button>
        </div>
      )}
    </div>
  );
}
