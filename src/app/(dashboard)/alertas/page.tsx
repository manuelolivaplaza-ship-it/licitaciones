'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());
import {
  Bell,
  Plus,
  Trash2,
  Mail,
  X,
  Clock,
  Sparkles,
  SlidersHorizontal,
  Building2,
  MapPin,
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle,
  AlertTriangle,
  FolderMinus,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/ui/score-ring';
import { getMockLicitaciones, generateMockAlerts } from '@/lib/mock/data';
import type { Alert, Licitacion } from '@/types';
import { REGIONES_CHILE } from '@/types';
import { formatCLP, formatDate, formatDateRelative } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AlertasPage() {
  // Tabs: 'matches' (Matches notificados) or 'configs' (Configurar Alertas)
  const [activeTab, setActiveTab] = useState<'matches' | 'configs'>('matches');
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlertName, setNewAlertName] = useState('');
  const [newAlertQuery, setNewAlertQuery] = useState('');
  const [newAlertRegion, setNewAlertRegion] = useState<string>('all');
  const [newAlertMontoMin, setNewAlertMontoMin] = useState('');
  const [newAlertFrequency, setNewAlertFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant');
  const [newAlertEmail, setNewAlertEmail] = useState(true);
  const [newAlertInApp, setNewAlertInApp] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Archive / Dismissed matches state
  const [dismissedMatchIds, setDismissedMatchIds] = useState<string[]>([]);

  // Load alerts from localStorage or seed defaults
  useEffect(() => {
    try {
      const stored = localStorage.getItem('licitahub_alerts');
      if (stored) {
        setAlerts(JSON.parse(stored));
      } else {
        const defaultAlerts: Alert[] = [
          {
            id: 'alert-programbi-1',
            organizationId: 'programbi-id',
            name: 'Capacitaciones TI',
            filters: {
              query: 'Power BI SQL Python Excel Programación Desarrollo IA',
              regiones: ['Metropolitana de Santiago'],
              montoMin: 1000000,
            },
            frequency: 'instant',
            channels: ['in_app', 'email'],
            isActive: true,
            matchCount: 0,
            createdAt: new Date().toISOString(),
          }
        ];
        setAlerts(defaultAlerts);
        localStorage.setItem('licitahub_alerts', JSON.stringify(defaultAlerts));
      }
    } catch {}
    setMounted(true);
  }, []);

  const saveAlerts = (updated: Alert[]) => {
    setAlerts(updated);
    try {
      localStorage.setItem('licitahub_alerts', JSON.stringify(updated));
    } catch {}
  };

  // Fetch company profile on mount via SWR
  const [company, setCompany] = useState<any | null>(null);
  const { data: companyData } = useSWR('/api/auth/me', fetcher, { revalidateOnFocus: false });
  useEffect(() => {
    if (companyData?.authenticated && companyData?.company) {
      setCompany(companyData.company);
    }
  }, [companyData]);

  // Fetch real matches for this company
  const { data: matchesResponse } = useSWR(
    company?.id ? `/api/companies/${company.id}/matches?limit=20` : null,
    fetcher
  );

  const realMatches = useMemo(() => matchesResponse?.data || [], [matchesResponse]);

  // Map real matches to UI structure
  const matches = useMemo(() => {
    const activeAlerts = alerts.filter(a => a.isActive);
    if (activeAlerts.length === 0 || realMatches.length === 0) return [];

    const matchedItems: any[] = [];

    realMatches.forEach((m: any) => {
      // Find which alert matched this tender
      const text = `${m.licitacionNombre} ${m.aiInsights || ''}`.toLowerCase();
      let alertName = 'Match General';

      for (const alert of activeAlerts) {
        const queryWords = alert.filters.query?.toLowerCase().split(' ') || [];
        const hasKeywordMatch = queryWords.some(word => word && text.includes(word));
        if (hasKeywordMatch) {
          alertName = alert.name;
          break;
        }
      }

      // Map to the structure expected by the page layout
      matchedItems.push({
        id: m.id,
        alertName,
        licitacion: {
          id: m.licitacionCodigo,
          codigo: m.licitacionCodigo,
          nombre: m.licitacionNombre,
          descripcion: m.aiInsights || 'Sin descripción detallada.',
          estado: m.licitacionEstado || 'publicada',
          region: m.licitacionRegion || 'Metropolitana de Santiago',
          organismo: m.licitacionOrganismo || 'Comprador Público',
          montoEstimado: m.licitacionMontoEstimado || 0,
          fechaCierre: m.licitacionFechaCierre || new Date().toISOString(),
          aiScore: m.aiScore || 0,
        },
        matchedAt: m.matchedAt || new Date().toISOString(),
        aiRecommendation: m.aiRecommendation === 'alta' ? 'Alta Relevancia' : m.aiRecommendation === 'media' ? 'Recomendado' : 'Evaluación Sugerida',
        aiInsights: m.aiInsights || '',
      });
    });

    // Filter out dismissed matches and sort by match recency
    return matchedItems
      .filter(m => !dismissedMatchIds.includes(m.id))
      .sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime());
  }, [alerts, realMatches, dismissedMatchIds]);

  if (!mounted) return null;

  // Toggle active status
  const toggleAlertActive = (id: string) => {
    saveAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, isActive: !alert.isActive } : alert)));
  };

  // Delete alert
  const deleteAlert = (id: string) => {
    saveAlerts(alerts.filter((alert) => alert.id !== id));
  };

  // Dismiss match card
  const dismissMatch = (id: string) => {
    setDismissedMatchIds((prev) => [...prev, id]);
  };

  // Create alert
  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertName || !newAlertQuery) return;

    const channels: ('email' | 'push' | 'in_app')[] = [];
    if (newAlertEmail) channels.push('email');
    if (newAlertInApp) channels.push('in_app');

    const newAlert: Alert = {
      id: `alert-${Date.now()}`,
      organizationId: company?.id || 'programbi-id',
      name: newAlertName,
      filters: {
        query: newAlertQuery,
        regiones: newAlertRegion !== 'all' ? [newAlertRegion] : undefined,
        montoMin: newAlertMontoMin ? parseInt(newAlertMontoMin) : undefined,
      },
      frequency: newAlertFrequency,
      channels,
      isActive: true,
      matchCount: 0,
      createdAt: new Date().toISOString(),
    };

    saveAlerts([...alerts, newAlert]);
    setShowCreateModal(false);
    // Reset form
    setNewAlertName('');
    setNewAlertQuery('');
    setNewAlertRegion('all');
    setNewAlertMontoMin('');
    setNewAlertFrequency('instant');
    
    // Switch to matches
    setActiveTab('matches');
  };

  return (
    <div className="space-y-8 relative z-10 animate-fade-in pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-border-primary/40 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-[#1890ff]/10 to-[#ec4899]/10 border border-[#1890ff]/15">
              <Bell className="h-5 w-5 text-[#1890ff]" />
            </div>
            Alertas e Inteligencia
          </h1>
          <p className="text-[13px] text-text-secondary leading-relaxed max-w-2xl font-normal">
            Monitoreo en vivo de convocatorias públicas mediante nuestro motor de IA. Cruce automatizado basado en tu perfil corporativo.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-[12px] font-semibold text-white bg-gradient-to-r from-[#1890ff] to-[#ec4899] hover:from-[#1890ff]/95 hover:to-[#ec4899]/95 transition-all duration-300 shadow-md shadow-[#1890ff]/10 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" /> Configurar Alerta
          </button>
        </div>
      </div>

      {/* Tabs Selector (Apple style glass tabs) */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="inline-flex p-0.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.03] border border-border-primary/50 backdrop-blur-sm shadow-inner">
          <button
            onClick={() => setActiveTab('matches')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-2',
              activeTab === 'matches'
                ? 'bg-white dark:bg-slate-900 text-[#1890ff] dark:text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Matches de IA Notificados
            <Badge variant="purple" className="ml-1 text-[9px] px-1.5 font-bold">
              {matches.length}
            </Badge>
          </button>
          
          <button
            onClick={() => setActiveTab('configs')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-2',
              activeTab === 'configs'
                ? 'bg-white dark:bg-slate-900 text-[#1890ff] dark:text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Sliders className="h-3.5 w-3.5" />
            Configurar Búsquedas
            <Badge variant="default" className="ml-1 text-[9px] px-1.5 font-semibold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
              {alerts.length}
            </Badge>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        
        {/* Tab 1: IA MATCHES (Large Notification Cards) */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            {matches.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {matches.map((match) => {
                  const score = match.licitacion.aiScore || 0;
                  const isHigh = score >= 85;
                  const isMedium = score >= 70 && score < 85;
                  const deadline = match.licitacion.fechaCierre;
                  const urgent = new Date(deadline).getTime() - Date.now() < 72 * 60 * 60 * 1000;

                  return (
                    <div 
                      key={match.id} 
                      className={cn(
                        'group relative rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 md:p-8 transition-all duration-300 flex flex-col',
                        'hover:border-[#1890ff]/30 dark:hover:border-[#00f2fe]/20 hover:shadow-xl hover:shadow-[#1890ff]/[0.01]',
                        isHigh && 'border-emerald-500/20 dark:border-emerald-500/10 hover:border-emerald-500/40',
                        isMedium && 'border-blue-500/20 dark:border-blue-500/10 hover:border-blue-500/40'
                      )}
                    >
                      {/* Top Row: Sparkles + Score + Notification Time */}
                      <div className="flex items-center justify-between mb-5 flex-wrap gap-3 pb-4 border-b border-border-primary/45">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-[#1890ff] dark:text-[#00f2fe] bg-[#1890ff]/10 dark:bg-[#1890ff]/5 border border-[#1890ff]/15 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                            <Sliders className="h-3 w-3" />
                            {match.alertName}
                          </span>
                          <span className="text-[10px] font-medium text-text-light flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateRelative(match.matchedAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={isHigh ? 'success' : isMedium ? 'info' : 'warning'} 
                            className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5"
                          >
                            {match.aiRecommendation}
                          </Badge>
                          <ScoreRing score={score} size={42} strokeWidth={3.5} />
                        </div>
                      </div>

                      {/* Tender Core Info */}
                      <div className="space-y-3 mb-5 flex-1">
                        <div className="flex items-center justify-between text-[11px] font-medium text-text-light">
                          <span className="font-mono tracking-tight text-slate-500 dark:text-slate-400">ID: {match.licitacion.codigo}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-text-secondary">{match.licitacion.estado.toUpperCase()}</span>
                        </div>

                        <h3 className="text-base font-semibold text-text-primary group-hover:text-[#1890ff] dark:group-hover:text-[#00f2fe] transition-colors leading-snug">
                          <Link href={`/licitacion/${match.licitacion.id}`}>
                            {match.licitacion.nombre}
                          </Link>
                        </h3>

                        {/* Institution and Region */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary font-medium">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Building2 className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                            {match.licitacion.organismo}
                          </span>
                          <span className="flex items-center gap-1.5 text-text-light">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {match.licitacion.region}
                          </span>
                        </div>

                        <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-3 font-normal pt-1">
                          {match.licitacion.descripcion}
                        </p>
                      </div>

                      {/* AI Intelligence Insights Box */}
                      <div className={cn(
                        'rounded-2xl p-4.5 mb-6 border font-normal text-[12.5px] leading-relaxed relative overflow-hidden',
                        isHigh && 'bg-emerald-500/[0.02] border-emerald-500/10 text-emerald-950 dark:text-emerald-300',
                        isMedium && 'bg-blue-500/[0.02] border-blue-500/10 text-blue-950 dark:text-blue-300',
                        !isHigh && !isMedium && 'bg-amber-500/[0.02] border-amber-500/10 text-amber-950 dark:text-amber-300'
                      )}>
                        <div className="flex items-center gap-2 mb-2 font-semibold text-[11px] uppercase tracking-wider text-text-primary">
                          <Sparkles className={cn(
                            'h-3.5 w-3.5',
                            isHigh && 'text-emerald-500',
                            isMedium && 'text-blue-500',
                            !isHigh && !isMedium && 'text-amber-500'
                          )} />
                          Evaluación Inteligente de IA
                        </div>
                        <p>{match.aiInsights}</p>
                      </div>

                      {/* Footer: Bid amount, deadline, actions */}
                      <div className="pt-5 border-t border-border-primary/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-auto">
                        <div className="flex items-center gap-6">
                          <div>
                            <span className="text-[10px] text-text-light font-medium uppercase tracking-wider">Presupuesto</span>
                            <p className="text-sm font-semibold text-text-primary mt-0.5">
                              {match.licitacion.montoEstimado > 0 ? formatCLP(match.licitacion.montoEstimado) : 'Ver en bases'}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-[10px] text-text-light font-medium uppercase tracking-wider">Plazo de Cierre</span>
                            <p className={cn(
                              'text-xs font-semibold mt-0.5 flex items-center gap-1',
                              urgent ? 'text-red-500' : 'text-text-secondary'
                            )}>
                              {formatDateRelative(deadline)}
                              {urgent && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping inline-block" />}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 z-10 relative">
                          <button
                            onClick={() => dismissMatch(match.id)}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-light hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            title="Archivar o Descartar Match"
                          >
                            <FolderMinus className="h-4 w-4" /> Descartar
                          </button>
                          
                          <Link
                            href={`/licitacion/${match.licitacion.id}`}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#1890ff] to-[#ec4899] hover:from-[#1890ff]/90 hover:to-[#ec4899]/90 transition-all duration-300 shadow-sm flex items-center justify-center gap-1.5 shadow-[#1890ff]/10"
                          >
                            Ver Detalles <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/30 dark:bg-slate-950/20 rounded-3xl border border-border-primary/50 backdrop-blur-md max-w-xl mx-auto flex flex-col items-center p-8 animate-fade-in shadow-lg">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-border-primary mb-4">
                  <Sparkles className="h-8 w-8 text-slate-400 animate-pulse" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1 uppercase tracking-wider">Sin Matches Recientes</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-6 max-w-xs text-center font-normal">
                  No hemos encontrado convocatorias que coincidan con tus alertas activas. Asegúrate de configurar más términos o de ampliar tu Perfil de Empresa.
                </p>
                <button 
                  onClick={() => setShowCreateModal(true)} 
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#1890ff] bg-[#1890ff]/10 border border-[#1890ff]/20 hover:bg-[#1890ff]/20 transition-all cursor-pointer"
                >
                  Agregar Palabras Clave
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: ALERT CONFIGURATION (Alert search rules) */}
        {activeTab === 'configs' && (
          <div className="space-y-6">
            <Card className="rounded-3xl glass shadow-lg border border-border-primary/50">
              <CardHeader className="border-b border-border-primary/40 pb-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-[15px] font-semibold text-text-primary flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-[#1890ff]" />
                      Configuraciones de Búsqueda Activas
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-text-light mt-1">
                      Controla las alertas automáticas que el motor de IA utiliza para rastrear y evaluar licitaciones públicas.
                    </CardDescription>
                  </div>
                  <button 
                    onClick={() => setShowCreateModal(true)} 
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-semibold text-[#1890ff] bg-[#1890ff]/10 hover:bg-[#1890ff]/15 border border-[#1890ff]/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Nueva Alerta
                  </button>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-border-primary/45 p-0">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 transition-colors hover:bg-slate-50/[0.1] dark:hover:bg-white/[0.005] first:rounded-t-3xl last:rounded-b-3xl">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className={cn(
                            'text-sm font-semibold transition-colors',
                            alert.isActive ? 'text-text-primary' : 'text-text-light line-through font-normal'
                          )}>
                            {alert.name}
                          </h3>
                          <Badge variant={alert.isActive ? 'success' : 'outline'} className="text-[8.5px] font-semibold uppercase tracking-wider px-2 py-0.5">
                            {alert.isActive ? 'Escaneando' : 'Inactiva'}
                          </Badge>
                        </div>
   
                        {/* Search criteria capsules */}
                        <div className="flex flex-wrap gap-2 text-xs text-text-secondary font-medium">
                          <span className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.015] border border-border-primary text-text-secondary flex items-center gap-1.5">
                            Buscar: <strong className="text-text-primary">"{alert.filters.query}"</strong>
                          </span>
                          {alert.filters.regiones && (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.015] border border-border-primary text-text-secondary flex items-center gap-1.5">
                              Región: <strong className="text-text-primary">{alert.filters.regiones.join(', ')}</strong>
                            </span>
                          )}
                          {alert.filters.montoMin && (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.015] border border-border-primary text-text-secondary flex items-center gap-1.5">
                              Monto &ge; <strong className="text-text-primary">{formatCLP(alert.filters.montoMin)}</strong>
                            </span>
                          )}
                        </div>
   
                        {/* Status bar */}
                        <div className="flex items-center gap-5 text-[11px] text-text-light font-medium pt-1">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" /> Frecuencia:{' '}
                            <strong className="text-text-secondary">
                              {alert.frequency === 'instant'
                                ? 'Inmediata'
                                : alert.frequency === 'daily'
                                ? 'Resumen Diario'
                                : 'Resumen Semanal'}
                            </strong>
                          </span>
                          
                          <span className="flex items-center gap-2">
                            Canales:
                            {alert.channels.includes('email') && (
                              <span title="Email corporativo" className="p-1 rounded-lg bg-[#1890ff]/10 text-[#1890ff] flex items-center justify-center">
                                <Mail className="h-3 w-3" />
                              </span>
                            )}
                            {alert.channels.includes('in_app') && (
                              <span title="Bandeja de plataforma" className="p-1 rounded-lg bg-[#ec4899]/10 text-[#ec4899] flex items-center justify-center">
                                <Bell className="h-3 w-3" />
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
    
                      {/* Active toggler switch & delete */}
                      <div className="flex items-center gap-4 self-end md:self-start shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-text-light font-semibold uppercase tracking-wider">{alert.isActive ? 'Activo' : 'Pausado'}</span>
                          <button
                            onClick={() => toggleAlertActive(alert.id)}
                            className={cn(
                              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner',
                              alert.isActive ? 'bg-[#1890ff]' : 'bg-slate-200 dark:bg-slate-800'
                            )}
                          >
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                                alert.isActive ? 'translate-x-5' : 'translate-x-0'
                              )}
                            />
                          </button>
                        </div>
    
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                          title="Eliminar Alerta de Búsqueda"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 flex flex-col items-center">
                    <Bell className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3 animate-bounce" />
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">No tienes reglas configuradas.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Wizard Create Dialog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          
          <Card className="relative z-10 w-full max-w-lg border border-border-primary bg-white dark:bg-slate-955 shadow-2xl animate-fade-in glass overflow-hidden rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border-primary/50">
              <div>
                <CardTitle className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Plus className="h-4 w-4 text-[#1890ff]" />
                  Nueva Alerta de Búsqueda
                </CardTitle>
                <CardDescription className="text-[11px] font-medium text-text-light mt-0.5">
                  Rastrea bases públicas en vivo en base a términos específicos.
                </CardDescription>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-text-primary p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <form onSubmit={handleCreateAlert}>
              <CardContent className="p-6 space-y-5">
                {/* Alert Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-text-light uppercase tracking-wider">
                    Nombre Descriptivo de Alerta
                  </label>
                  <input
                    type="text"
                    required
                    value={newAlertName}
                    onChange={(e) => setNewAlertName(e.target.value)}
                    placeholder="Ej: Insumos de Salud o Consultoría TI"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-border-primary text-xs font-semibold text-text-primary focus:outline-none focus:border-[#1890ff]/40 transition-all shadow-inner focus:ring-2 focus:ring-[#1890ff]/10"
                  />
                </div>

                {/* Keywords Query */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-text-light uppercase tracking-wider">
                    Palabras Clave (Búsqueda Semántica)
                  </label>
                  <input
                    type="text"
                    required
                    value={newAlertQuery}
                    onChange={(e) => setNewAlertQuery(e.target.value)}
                    placeholder="Ej: software tecnología plataforma o equipamiento"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-border-primary text-xs font-semibold text-text-primary focus:outline-none focus:border-[#1890ff]/40 transition-all shadow-inner focus:ring-2 focus:ring-[#1890ff]/10"
                  />
                  <p className="text-[10px] text-text-muted font-normal leading-normal">
                    La plataforma expandirá semánticamente estos conceptos buscando sinónimos en las bases públicas.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Region Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-text-light uppercase tracking-wider">
                      Región Operativa
                    </label>
                    <select
                      value={newAlertRegion}
                      onChange={(e) => setNewAlertRegion(e.target.value)}
                      className="w-full bg-white/40 dark:bg-slate-950/40 border border-border-primary rounded-xl px-3 py-2.5 text-xs font-semibold text-text-primary focus:outline-none focus:border-[#1890ff]/40 cursor-pointer"
                    >
                      <option value="all">Todas las Regiones</option>
                      {REGIONES_CHILE.map(r => (
                        <option key={r.code} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Budget threshold */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-text-light uppercase tracking-wider">
                      Presupuesto Mínimo ($)
                    </label>
                    <input
                      type="number"
                      value={newAlertMontoMin}
                      onChange={(e) => setNewAlertMontoMin(e.target.value)}
                      placeholder="Sin tope mínimo"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-border-primary text-xs font-semibold text-text-primary placeholder:text-slate-450 focus:outline-none focus:border-[#1890ff]/40 transition-all shadow-inner focus:ring-2 focus:ring-[#1890ff]/10"
                    />
                  </div>
                </div>

                {/* Notification Frequencies */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-text-light uppercase tracking-wider">
                    Frecuencia de Notificaciones
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'instant', label: 'Al Instante' },
                      { value: 'daily', label: 'Diario' },
                      { value: 'weekly', label: 'Semanal' },
                    ].map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setNewAlertFrequency(f.value as any)}
                        className={cn(
                          'py-2 rounded-xl text-xs font-semibold transition-all duration-300 border cursor-pointer',
                          newAlertFrequency === f.value
                            ? 'bg-[#1890ff]/10 text-[#1890ff] dark:text-[#00f2fe] border-[#1890ff]/25 shadow-sm'
                            : 'bg-white/40 dark:bg-slate-900/10 text-text-secondary border-border-primary/65 hover:text-text-primary hover:border-[#1890ff]/10'
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Output Channels */}
                <div className="space-y-2 pt-2 border-t border-border-primary/50">
                  <label className="text-[10px] font-semibold text-text-light uppercase tracking-wider block">
                    Canales de Enlace
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-secondary select-none">
                      <input
                        type="checkbox"
                        checked={newAlertEmail}
                        onChange={(e) => setNewAlertEmail(e.target.checked)}
                        className="rounded border-border-primary bg-white/45 text-[#1890ff] focus:ring-0 focus:ring-offset-0 h-4 w-4"
                      />
                      <span>Correo Electrónico</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-secondary select-none">
                      <input
                        type="checkbox"
                        checked={newAlertInApp}
                        onChange={(e) => setNewAlertInApp(e.target.checked)}
                        className="rounded border-border-primary bg-white/45 text-[#1890ff] focus:ring-0 focus:ring-offset-0 h-4 w-4"
                      />
                      <span>Bandeja Plataforma (In-app)</span>
                    </label>
                  </div>
                </div>
              </CardContent>

              {/* Action buttons */}
              <div className="p-4 border-t border-border-primary/50 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/80">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-light hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.02] cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#1890ff] to-[#ec4899] hover:from-[#1890ff]/95 hover:to-[#ec4899]/95 transition-all duration-300 shadow-md cursor-pointer"
                >
                  Crear Alerta
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
