'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/browser';

import {
  Star,
  LayoutGrid,
  List,
  Search,
  Trash2,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  CheckCircle2,
  FolderGit2,
  TrendingUp,
  X,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  ClipboardList,
  FolderCheck,
  Loader2,
  BookOpen,
  Calendar,
  Video,
  Columns
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/ui/score-ring';
import { formatCLP, formatDate, timeUntilDeadline } from '@/lib/utils';
import { getMockLicitaciones, generateMockSavedLicitaciones } from '@/lib/mock/data';
import type { SavedLicitacion, PipelineStatus, Priority } from '@/types';
import { PIPELINE_LABELS, PRIORITY_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface SavedCapacitacion {
  id: string;
  title: string;
  organizer: string;
  date: string;
  duration: string;
  modality: string;
  status: 'inscrito' | 'interesado' | 'completado';
  description: string;
  url: string;
  notes: string;
}

const INITIAL_CAPACITACIONES: SavedCapacitacion[] = [
  {
    id: 'cap-01',
    title: 'Convenio Marco: Operación y Nuevas Directrices 2026',
    organizer: 'Dirección de ChileCompra',
    date: '2026-06-12T10:00:00Z',
    duration: '2 horas',
    modality: 'Online (Webinar Zoom)',
    status: 'inscrito',
    description: 'Curso avanzado sobre el uso y las nuevas normativas aplicadas a las adquisiciones mediante Convenio Marco.',
    url: 'https://capacitacion.chilecompra.cl/curso/convenio-marco-2026',
    notes: 'Revisar anexo de competencias antes de asistir.'
  },
  {
    id: 'cap-02',
    title: 'Cómo Ofertar de Manera Correcta y Evitar Errores de Base',
    organizer: 'ChileCompra Capacita',
    date: '2026-06-18T14:30:00Z',
    duration: '1.5 horas',
    modality: 'Online (Moodle)',
    status: 'interesado',
    description: 'Taller práctico enfocado en proveedores para revisar los anexos indispensables y evitar descalificaciones administrativas.',
    url: 'https://capacitacion.chilecompra.cl/curso/como-ofertar-sin-errores',
    notes: 'Compartir enlace con el equipo técnico.'
  },
  {
    id: 'cap-03',
    title: 'Búsqueda Semántica e Inteligencia Artificial en Compras Públicas',
    organizer: 'LicitaHub Academia',
    date: '2026-05-20T09:00:00Z',
    duration: '1 hora',
    modality: 'Grabación de video',
    status: 'completado',
    description: 'Masterclass exclusiva sobre cómo configurar búsquedas semánticas avanzadas en LicitaHub para acelerar la detección de pliegos.',
    url: 'https://academia.licitahub.cl/ia-compras-publicas',
    notes: 'Completado con éxito por el área comercial.'
  }
];

const KANBAN_COLUMNS: { id: PipelineStatus | 'adjudicadas'; label: string; statuses: PipelineStatus[] }[] = [
  { id: 'guardada', label: 'Guardadas', statuses: ['guardada'] },
  { id: 'en_revision', label: 'En Revisión', statuses: ['en_revision'] },
  { id: 'preparando', label: 'Preparación', statuses: ['preparando'] },
  { id: 'enviada', label: 'Enviadas', statuses: ['enviada'] },
  { id: 'adjudicadas', label: 'Adjudicadas', statuses: ['ganada', 'perdida'] },
];

export default function FavoritasPage() {
  const licitaciones = useMemo(() => getMockLicitaciones(), []);
  const initialSaved = useMemo(() => generateMockSavedLicitaciones(licitaciones), [licitaciones]);
  
  // Section toggle: 'licitaciones' | 'capacitaciones'
  const [favoriteType, setFavoriteType] = useState<'licitaciones' | 'capacitaciones'>('licitaciones');

  const [savedLicitaciones, setSavedLicitaciones] = useState<SavedLicitacion[]>([]);
  const [savedCapacitaciones, setSavedCapacitaciones] = useState<SavedCapacitacion[]>(INITIAL_CAPACITACIONES);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'kanban'>('kanban');
  
  // Tab filter for Tenders: 'all' | 'evaluacion' | 'preparacion' | 'enviadas' | 'adjudicadas'
  const [activeTab, setActiveTab] = useState<'all' | 'evaluacion' | 'preparacion' | 'enviadas' | 'adjudicadas'>('all');
  
  // Tab filter for Trainings: 'all' | 'inscrito' | 'interesado' | 'completado'
  const [activeCapacitacionTab, setActiveCapacitacionTab] = useState<'all' | 'inscrito' | 'interesado' | 'completado'>('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  
  // Custom interactive notes editing for licitaciones
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  // Custom interactive notes editing for capacitaciones
  const [editingCapacitacionNoteId, setEditingCapacitacionNoteId] = useState<string | null>(null);
  const [tempCapacitacionNoteText, setTempCapacitacionNoteText] = useState('');

  // Dropdown states for changing status of licitaciones
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Load favorites from Supabase if configured, otherwise load mock data
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      try {
        const stored = localStorage.getItem('licitahub_saved_licitaciones');
        if (stored) {
          setSavedLicitaciones(JSON.parse(stored));
        } else {
          localStorage.setItem('licitahub_saved_licitaciones', JSON.stringify(initialSaved));
          setSavedLicitaciones(initialSaved);
        }
      } catch {
        setSavedLicitaciones(initialSaved);
      }
      return;
    }

    async function loadSaved() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('saved_licitaciones')
          .select(`
            id,
            status,
            notes,
            priority,
            assigned_to,
            licitaciones (
              id,
              codigo,
              nombre,
              descripcion,
              estado,
              tipo,
              organismo,
              organismo_codigo,
              region,
              fecha_publicacion,
              fecha_cierre,
              fecha_adjudicacion,
              monto_estimado,
              moneda,
              items,
              adjudicacion,
              ai_summary,
              ai_score,
              ai_score_keywords
            )
          `);

        if (error) throw error;

        if (data) {
          const mapped: SavedLicitacion[] = data.map((item: any) => {
            const lic = item.licitaciones;
            return {
              id: item.id,
              organizationId: item.organization_id || '',
              licitacionId: lic.id,
              status: item.status,
              notes: item.notes || '',
              priority: item.priority || 'media',
              assignedTo: item.assigned_to,
              tags: item.tags || [],
              createdAt: item.created_at || new Date().toISOString(),
              licitacion: {
                id: lic.id,
                codigo: lic.codigo,
                nombre: lic.nombre,
                descripcion: lic.descripcion,
                estado: lic.estado,
                tipo: lic.tipo,
                organismo: lic.organismo,
                organismoCode: lic.organismo_codigo || '',
                region: lic.region,
                fechaPublicacion: lic.fecha_publicacion,
                fechaCierre: lic.fecha_cierre,
                fechaAdjudicacion: lic.fecha_adjudicacion,
                montoEstimado: Number(lic.monto_estimado),
                moneda: lic.moneda,
                items: lic.items || [],
                adjudicacion: lic.adjudicacion,
                aiSummary: lic.ai_summary,
                aiScore: lic.ai_score || 70,
                aiKeywords: lic.ai_score_keywords || [],
                syncedAt: lic.synced_at || new Date().toISOString(),
                createdAt: lic.created_at || new Date().toISOString(),
              }
            };
          });
          setSavedLicitaciones(mapped);
        }
      } catch (err) {
        console.error('Error loading saved licitaciones from Supabase, using mock data:', err);
        setSavedLicitaciones(initialSaved);
      } finally {
        setLoading(false);
      }
    }

    loadSaved();
  }, [initialSaved]);

  // Reset page state on toggle type
  useEffect(() => {
    setSearchQuery('');
    setSelectedPriority('all');
    setViewMode('kanban');
    setEditingNoteId(null);
    setEditingCapacitacionNoteId(null);
  }, [favoriteType]);

  // Update pipeline status
  const moveStatus = async (id: string, newStatus: PipelineStatus) => {
    setSavedLicitaciones((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
      if (!isSupabaseConfigured()) {
        localStorage.setItem('licitahub_saved_licitaciones', JSON.stringify(next));
      }
      return next;
    });
    setActiveDropdownId(null);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase
          .from('saved_licitaciones')
          .update({ status: newStatus })
          .eq('id', id);
      } catch (err) {
        console.error('Error updating status in Supabase:', err);
      }
    }
  };

  // Move status in a specific direction (prev/next) for Kanban columns
  const moveStatusDirection = (id: string, currentStatus: PipelineStatus, direction: 'prev' | 'next') => {
    const statuses: PipelineStatus[] = ['guardada', 'en_revision', 'preparando', 'enviada', 'ganada'];
    const currentIndex = statuses.indexOf(currentStatus === 'perdida' ? 'ganada' : currentStatus);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < statuses.length - 1) {
      newIndex = currentIndex + 1;
    }

    if (newIndex !== currentIndex) {
      moveStatus(id, statuses[newIndex]);
    }
  };

  // Remove favorite licitacion
  const removeFavorite = async (id: string) => {
    setSavedLicitaciones((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (!isSupabaseConfigured()) {
        localStorage.setItem('licitahub_saved_licitaciones', JSON.stringify(next));
        const match = prev.find(item => item.id === id);
        if (match) {
          const savedIds = JSON.parse(localStorage.getItem('licitahub_saved') || '[]');
          const cleanIds = savedIds.filter((sid: string) => sid !== match.licitacionId);
          localStorage.setItem('licitahub_saved', JSON.stringify(cleanIds));
        }
      }
      return next;
    });
    
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase
          .from('saved_licitaciones')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.error('Error deleting favorite from Supabase:', err);
      }
    }
  };

  // Remove favorite capacitacion
  const removeCapacitacion = (id: string) => {
    setSavedCapacitaciones((prev) => prev.filter((item) => item.id !== id));
  };

  // Update custom notes for licitacion
  const saveNoteText = async (id: string) => {
    setSavedLicitaciones((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, notes: tempNoteText } : item));
      if (!isSupabaseConfigured()) {
        localStorage.setItem('licitahub_saved_licitaciones', JSON.stringify(next));
      }
      return next;
    });
    setEditingNoteId(null);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase
          .from('saved_licitaciones')
          .update({ notes: tempNoteText })
          .eq('id', id);
      } catch (err) {
        console.error('Error updating notes in Supabase:', err);
      }
    }
  };

  // Update custom notes for capacitacion
  const saveCapacitacionNoteText = (id: string) => {
    setSavedCapacitaciones((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes: tempCapacitacionNoteText } : item))
    );
    setEditingCapacitacionNoteId(null);
  };

  // Filter licitaciones by search and priority (for general use)
  const baseFilteredItems = useMemo(() => {
    return savedLicitaciones.filter((item) => {
      const matchesSearch =
        item.licitacion.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.licitacion.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.licitacion.organismo.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
      
      return matchesSearch && matchesPriority;
    });
  }, [savedLicitaciones, searchQuery, selectedPriority]);

  // Filter licitaciones by search, priority, and tab (for grid/table tabs)
  const filteredItems = useMemo(() => {
    return baseFilteredItems.filter((item) => {
      let matchesTab = true;
      if (activeTab === 'evaluacion') {
        matchesTab = item.status === 'guardada' || item.status === 'en_revision';
      } else if (activeTab === 'preparacion') {
        matchesTab = item.status === 'preparando';
      } else if (activeTab === 'enviadas') {
        matchesTab = item.status === 'enviada';
      } else if (activeTab === 'adjudicadas') {
        matchesTab = item.status === 'ganada' || item.status === 'perdida';
      }

      return matchesTab;
    });
  }, [baseFilteredItems, activeTab]);

  // Filter training courses by search and status tab
  const filteredCapacitaciones = useMemo(() => {
    return savedCapacitaciones.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.organizer.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTab = true;
      if (activeCapacitacionTab !== 'all') {
        matchesTab = item.status === activeCapacitacionTab;
      }

      return matchesSearch && matchesTab;
    });
  }, [savedCapacitaciones, searchQuery, activeCapacitacionTab]);

  const priorityColors: Record<Priority, { label: string; bg: string }> = {
    baja: { label: 'Baja', bg: 'bg-slate-500/10 text-slate-500 border-slate-500/15 dark:text-slate-400' },
    media: { label: 'Media', bg: 'bg-accent-500/10 text-accent-600 border-accent-500/15 dark:text-accent-400' },
    alta: { label: 'Alta', bg: 'bg-amber-500/10 text-amber-600 border-amber-500/15 dark:text-amber-400' },
    critica: { label: 'Crítica', bg: 'bg-red-500/10 text-red-600 border-red-500/15 dark:text-red-400' },
  };

  const pipelineStyles: Record<PipelineStatus, { label: string; text: string; bg: string; border: string }> = {
    guardada: { label: 'Guardada', text: 'text-text-muted dark:text-text-secondary', bg: 'bg-slate-500/10', border: 'border-slate-500/25' },
    en_revision: { label: 'En Revisión', text: 'text-accent-650 dark:text-accent-400', bg: 'bg-accent-500/10', border: 'border-accent-500/25' },
    preparando: { label: 'Preparando Propuesta', text: 'text-amber-650 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25' },
    enviada: { label: 'Enviada', text: 'text-indigo-650 dark:text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/25' },
    ganada: { label: 'Ganada', text: 'text-emerald-600 dark:text-emerald-450', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
    perdida: { label: 'Perdida', text: 'text-red-650 dark:text-red-450', bg: 'bg-red-500/10', border: 'border-red-500/25' },
  };

  const trainingStatusStyles = {
    inscrito: { label: 'Inscrito', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' },
    interesado: { label: 'Interesado', bg: 'bg-accent-500/10 text-accent-600 border-accent-500/20 dark:text-accent-400' },
    completado: { label: 'Completado', bg: 'bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-400' },
  };

  return (
    <div className="space-y-8 relative z-10 animate-fade-in pb-10">
      
      {/* Page Header with Tab Toggle */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-border-primary pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-accent-500/10 border border-accent-500/15">
              <Star className="h-5 w-5 text-accent-600 dark:text-accent-400 fill-accent-500/5" />
            </div>
            Favoritos
          </h1>
          <p className="text-[13px] text-text-secondary leading-relaxed font-normal">
            Gestiona tus licitaciones en pipeline y las capacitaciones del Estado guardadas.
          </p>
        </div>

        {/* Segmented Control Selector */}
        <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-border-primary/50 shadow-inner shrink-0 self-start md:self-auto">
          <button
            onClick={() => setFavoriteType('licitaciones')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer',
              favoriteType === 'licitaciones'
                ? 'bg-white dark:bg-slate-900 text-accent-600 dark:text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Licitaciones
          </button>
          <button
            onClick={() => setFavoriteType('capacitaciones')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer',
              favoriteType === 'capacitaciones'
                ? 'bg-white dark:bg-slate-900 text-accent-600 dark:text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Capacitaciones
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------
          1. LICITACIONES SECTION
         ----------------------------------------------------------- */}
      {favoriteType === 'licitaciones' && (
        <>
          {/* Controls: Search, Priorities and View toggles */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Tab Filters or Kanban Label */}
            {viewMode === 'kanban' ? (
              <div className="text-[13px] text-text-secondary font-semibold py-2 px-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-600 dark:bg-accent-400 animate-pulse" />
                Panel de Pipeline de Licitaciones
              </div>
            ) : (
              /* Tab Filters */
              <div className="inline-flex p-0.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.03] border border-border-primary/50 backdrop-blur-sm shadow-inner w-full lg:w-auto overflow-x-auto scrollbar-none shrink-0">
                {[
                  { id: 'all', label: 'Todas', icon: Star, count: savedLicitaciones.length },
                  { id: 'evaluacion', label: 'Evaluación', icon: AlertCircle, count: savedLicitaciones.filter(i => i.status === 'guardada' || i.status === 'en_revision').length },
                  { id: 'preparacion', label: 'Preparación', icon: Edit3, count: savedLicitaciones.filter(i => i.status === 'preparando').length },
                  { id: 'enviadas', label: 'Enviadas', icon: FolderGit2, count: savedLicitaciones.filter(i => i.status === 'enviada').length },
                  { id: 'adjudicadas', label: 'Adjudicadas', icon: FolderCheck, count: savedLicitaciones.filter(i => i.status === 'ganada' || i.status === 'perdida').length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'px-3.5 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-white dark:bg-slate-900 text-accent-600 dark:text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5 text-slate-450" />
                    {tab.label}
                    <span className="text-[9px] px-1 py-0.2 rounded-full bg-slate-200/50 dark:bg-white/10 text-slate-650 dark:text-slate-350">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Filters panel */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {/* Inner Search bar */}
              <div className="relative group flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-accent-600 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en favoritas..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-border-primary text-xs font-semibold text-text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent-500/40 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Priority select */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full sm:w-36 bg-white/40 dark:bg-slate-950/40 border border-border-primary rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-accent-500/40 cursor-pointer"
              >
                <option value="all">Prioridades</option>
                {Object.entries(PRIORITY_LABELS).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>

              {/* Kanban/Grid/Table toggles */}
              <div className="flex rounded-xl border border-border-primary bg-white/40 dark:bg-slate-950/40 overflow-hidden shrink-0 self-stretch sm:self-auto justify-center">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    'p-2.5 transition-colors cursor-pointer border-r border-border-primary/50',
                    viewMode === 'kanban' ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400' : 'text-slate-400 hover:text-text-primary'
                  )}
                  title="Vista Kanban"
                >
                  <Columns className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2.5 transition-colors cursor-pointer border-r border-border-primary/50',
                    viewMode === 'grid' ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400' : 'text-slate-400 hover:text-text-primary'
                  )}
                  title="Vista en cuadricula"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'p-2.5 transition-colors cursor-pointer',
                    viewMode === 'table' ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400' : 'text-slate-400 hover:text-text-primary'
                  )}
                  title="Vista en tabla"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-7 w-7 animate-spin text-accent-600" />
              <p className="text-xs font-semibold text-text-muted">Cargando...</p>
            </div>
          ) : baseFilteredItems.length > 0 ? (
            viewMode === 'kanban' ? (
              /* Kanban view of licitaciones */
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4 scrollbar-thin">
                {KANBAN_COLUMNS.map((column) => {
                  const columnItems = baseFilteredItems.filter((item) =>
                    column.statuses.includes(item.status)
                  );
                  
                  return (
                    <div
                      key={column.id}
                      className="flex flex-col min-w-[240px] bg-slate-100/30 dark:bg-white/[0.015] border border-border-primary rounded-2xl p-3 h-[600px] overflow-hidden"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-3 px-1 flex-shrink-0">
                        <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">
                          {column.label}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-white/5 text-text-secondary">
                          {columnItems.length}
                        </span>
                      </div>
                      
                      {/* Column Cards Container */}
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                        {columnItems.length > 0 ? (
                          columnItems.map((item) => {
                            const priority = priorityColors[item.priority];
                            const score = item.licitacion.aiScore || 70;
                            const style = pipelineStyles[item.status];
                            const isUrgent = item.licitacion.estado === 'publicada' && 
                              new Date(item.licitacion.fechaCierre).getTime() - Date.now() < 72 * 60 * 60 * 1000;
                            
                            return (
                              <div
                                key={item.id}
                                className="group relative rounded-xl border border-border-primary bg-white/70 dark:bg-zinc-950/40 p-4 shadow-sm hover:shadow-md hover:border-accent-500/30 transition-all flex flex-col gap-2 text-left"
                              >
                                {/* Card header: ID, Score and Status */}
                                <div className="flex items-center justify-between gap-1 flex-wrap pb-1.5 border-b border-border-primary/40">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-mono text-text-light font-bold truncate max-w-[80px]" title={item.licitacion.codigo}>
                                      {item.licitacion.codigo}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-accent-600 dark:text-accent-400">
                                      {score}%
                                    </span>
                                    {isUrgent && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" title="Urgente" />
                                    )}
                                  </div>
                                  
                                  {/* Dropdown status update */}
                                  <div className="relative">
                                    <button
                                      onClick={() => setActiveDropdownId(activeDropdownId === item.id ? null : item.id)}
                                      className={cn(
                                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer',
                                        style.bg, style.text, style.border
                                      )}
                                    >
                                      {style.label}
                                      <ChevronDown className="h-2.5 w-2.5 shrink-0" />
                                    </button>
                                    
                                    {activeDropdownId === item.id && (
                                      <>
                                        <div className="fixed inset-0 z-20" onClick={() => setActiveDropdownId(null)} />
                                        <div className="absolute right-0 mt-1 w-36 rounded-xl border border-border-primary bg-white dark:bg-slate-950 shadow-2xl backdrop-blur-xl py-0.5 z-30 animate-scale-in">
                                          {(Object.entries(PIPELINE_LABELS) as [PipelineStatus, string][]).map(([statusKey, statusVal]) => (
                                            <button
                                              key={statusKey}
                                              onClick={() => moveStatus(item.id, statusKey)}
                                              className={cn(
                                                'w-full text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center justify-between',
                                                item.status === statusKey ? 'text-accent-600' : 'text-text-secondary'
                                              )}
                                            >
                                              {statusVal}
                                              {item.status === statusKey && <CheckCircle2 className="h-3 w-3 text-accent-600" />}
                                            </button>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Card Title */}
                                <h4 className="text-xs font-semibold text-text-primary group-hover:text-accent-600 transition-colors line-clamp-2 leading-relaxed">
                                  <Link href={`/licitacion/${item.licitacion.id}`}>
                                    {item.licitacion.nombre}
                                  </Link>
                                </h4>
                                
                                {/* Card metadata */}
                                <p className="text-[10px] text-text-secondary truncate">
                                  {item.licitacion.organismo}
                                </p>
                                
                                {/* Card Footer: Budget and Priority */}
                                <div className="flex items-center justify-between pt-2 border-t border-border-primary/40 mt-1 flex-wrap gap-1">
                                  <span className="text-[10px] font-mono font-bold text-text-muted">
                                    {item.licitacion.montoEstimado > 0 ? formatCLP(item.licitacion.montoEstimado) : 'bases'}
                                  </span>
                                  
                                  <span className={cn('text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase', priority.bg)}>
                                    {priority.label}
                                  </span>
                                </div>
                                
                                {/* Kanban Card Actions */}
                                <div className="flex items-center justify-between pt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                  {/* Delete button */}
                                  <button
                                    onClick={() => removeFavorite(item.id)}
                                    className="p-1 rounded text-text-light hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                    title="Quitar"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                  
                                  {/* Movement chevrons */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      disabled={column.id === 'guardada'}
                                      onClick={() => moveStatusDirection(item.id, item.status, 'prev')}
                                      className="p-1 rounded border border-border-primary bg-white/50 dark:bg-white/5 text-text-secondary hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      title="Mover a etapa anterior"
                                    >
                                      <ChevronLeft className="h-3 w-3" />
                                    </button>
                                    
                                    {column.id === 'adjudicadas' ? (
                                      // Specific Won/Lost toggle inside Adjudicadas
                                      <button
                                        onClick={() => moveStatus(item.id, item.status === 'ganada' ? 'perdida' : 'ganada')}
                                        className={cn(
                                          'px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase cursor-pointer',
                                          item.status === 'ganada'
                                            ? 'bg-emerald-550/10 text-emerald-600 border-emerald-500/15'
                                            : 'bg-red-550/10 text-red-600 border-red-500/15'
                                        )}
                                        title="Cambiar resultado"
                                      >
                                        {item.status === 'ganada' ? 'Ganada' : 'Perdida'}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => moveStatusDirection(item.id, item.status, 'next')}
                                        className="p-1 rounded border border-border-primary bg-white/50 dark:bg-white/5 text-text-secondary hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                        title="Mover a etapa siguiente"
                                      >
                                        <ChevronRight className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border-primary/50 rounded-xl text-center p-4">
                            <span className="text-[10px] text-text-muted">Sin licitaciones</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid view of licitaciones */
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {filteredItems.map((item) => {
                  const style = pipelineStyles[item.status];
                  const priority = priorityColors[item.priority];
                  const score = item.licitacion.aiScore || 70;
                  const isUrgent = item.licitacion.estado === 'publicada' && 
                    new Date(item.licitacion.fechaCierre).getTime() - Date.now() < 72 * 60 * 60 * 1000;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'group relative rounded-2xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 transition-all duration-300 flex flex-col',
                        'hover:border-accent-500/30 dark:hover:border-accent-500/20 hover:shadow-glass'
                      )}
                    >
                      {/* Top metadata */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-primary flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[9px] font-semibold px-2 py-0.5 rounded-lg border uppercase', priority.bg)}>
                            {priority.label}
                          </span>
                          
                          {/* Dropdown status update */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveDropdownId(activeDropdownId === item.id ? null : item.id)}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[10px] font-semibold border transition-all cursor-pointer',
                                style.bg, style.text, style.border
                              )}
                            >
                              {style.label}
                              <ChevronDown className="h-3 w-3 shrink-0" />
                            </button>
                            
                            {activeDropdownId === item.id && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setActiveDropdownId(null)} />
                                <div className="absolute left-0 mt-1 w-40 rounded-xl border border-border-primary bg-white dark:bg-slate-950 shadow-2xl backdrop-blur-xl py-1 z-30 animate-scale-in">
                                  {(Object.entries(PIPELINE_LABELS) as [PipelineStatus, string][]).map(([statusKey, statusVal]) => (
                                    <button
                                      key={statusKey}
                                      onClick={() => moveStatus(item.id, statusKey)}
                                      className={cn(
                                        'w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center justify-between',
                                        item.status === statusKey ? 'text-accent-600' : 'text-text-secondary'
                                      )}
                                    >
                                      {statusVal}
                                      {item.status === statusKey && <CheckCircle2 className="h-3.5 w-3.5 text-accent-600" />}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isUrgent && (
                            <Badge variant="danger" className="text-[9px] font-semibold uppercase flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" /> Urgente
                            </Badge>
                          )}
                          <ScoreRing score={score} size={36} strokeWidth={3} />
                        </div>
                      </div>

                      {/* Main details */}
                      <div className="space-y-2 mb-4 flex-1">
                        <div className="flex items-center justify-between text-[10.5px] font-medium text-text-light">
                          <span className="font-mono">ID: {item.licitacion.codigo}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-text-secondary uppercase text-[9px]">{item.licitacion.estado}</span>
                        </div>

                        <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent-600 transition-colors leading-relaxed line-clamp-2">
                          <Link href={`/licitacion/${item.licitacion.id}`}>
                            {item.licitacion.nombre}
                          </Link>
                        </h3>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary font-medium">
                          <span className="flex items-center gap-1 text-slate-605 dark:text-slate-350">
                            <Building2 className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                            {item.licitacion.organismo}
                          </span>
                          <span className="flex items-center gap-1 text-text-light">
                            <MapPin className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                            {item.licitacion.region}
                          </span>
                        </div>
                      </div>

                      {/* Custom note container */}
                      <div className="rounded-xl border border-border-primary bg-slate-50/50 dark:bg-slate-900/10 p-3.5 mb-5 relative">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-text-light uppercase tracking-wider flex items-center gap-1">
                            <Edit3 className="h-3 w-3 text-slate-400" />
                            Notas de Trabajo
                          </span>
                          {editingNoteId !== item.id && (
                            <button
                              onClick={() => {
                                setEditingNoteId(item.id);
                                setTempNoteText(item.notes);
                              }}
                              className="text-[10px] text-accent-600 hover:underline font-semibold cursor-pointer"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                        {editingNoteId === item.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={tempNoteText}
                              onChange={(e) => setTempNoteText(e.target.value)}
                              placeholder="Escribe recordatorios, tareas o comentarios..."
                              className="w-full h-16 p-2 rounded-lg border border-border-primary bg-white dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-accent-500/45 resize-none leading-relaxed shadow-inner"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-text-light hover:text-text-primary cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => saveNoteText(item.id)}
                                className="px-3 py-1 rounded-lg text-[10px] font-semibold text-white bg-accent-600 hover:bg-accent-700 transition-colors cursor-pointer"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-text-secondary leading-relaxed font-normal whitespace-pre-wrap">
                            {item.notes || 'Sin notas. Presiona editar para agregar recordatorios o pliegos críticos.'}
                          </p>
                        )}
                      </div>

                      {/* Footer values and action buttons */}
                      <div className="pt-4 border-t border-border-primary flex items-center justify-between gap-4 mt-auto">
                        <div>
                          <span className="text-[10px] text-text-light font-medium uppercase tracking-wider">Monto Est.</span>
                          <p className="text-xs font-semibold text-text-primary mt-0.5 font-mono">
                            {item.licitacion.montoEstimado > 0 ? formatCLP(item.licitacion.montoEstimado) : 'Ver en bases'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFavorite(item.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Quitar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <Link
                            href={`/licitacion/${item.licitacion.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/[0.04] text-accent-600 hover:bg-accent-500/10 hover:text-accent-600 transition-all flex items-center gap-1"
                          >
                            Propuesta IA <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table view of licitaciones */
              <div className="rounded-2xl border border-border-primary bg-white/40 dark:bg-slate-950/20 backdrop-blur-xl overflow-hidden shadow-glass">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-primary bg-slate-50/20 dark:bg-slate-950/40">
                        <th className="py-3.5 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider w-16">Score</th>
                        <th className="py-3.5 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Licitación</th>
                        <th className="py-3.5 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Organismo</th>
                        <th className="py-3.5 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Prioridad</th>
                        <th className="py-3.5 px-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Fase</th>
                        <th className="py-3.5 px-4 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider">Monto Est.</th>
                        <th className="py-3.5 px-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary/50 text-xs">
                      {filteredItems.map((item) => {
                        const style = pipelineStyles[item.status];
                        const priority = priorityColors[item.priority];
                        const score = item.licitacion.aiScore || 70;

                        return (
                           <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="py-3 px-4">
                              <ScoreRing score={score} size={30} strokeWidth={2} />
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <p className="font-semibold text-text-primary truncate hover:text-accent-600 transition-colors">
                                <Link href={`/licitacion/${item.licitacion.id}`}>{item.licitacion.nombre}</Link>
                              </p>
                              <p className="text-[9px] text-text-light font-mono mt-0.5">{item.licitacion.codigo}</p>
                            </td>
                            <td className="py-3 px-4 text-text-secondary truncate max-w-[180px]">
                              {item.licitacion.organismo}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className={cn('text-[9px] px-2 py-0.5 border font-semibold uppercase', priority.bg)}>
                                {priority.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="relative">
                                <button
                                  onClick={() => setActiveDropdownId(activeDropdownId === item.id ? null : item.id)}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-bold border transition-all cursor-pointer',
                                    style.bg, style.text, style.border
                                  )}
                                >
                                  {style.label}
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                                {activeDropdownId === item.id && (
                                  <>
                                    <div className="fixed inset-0 z-20" onClick={() => setActiveDropdownId(null)} />
                                    <div className="absolute left-0 mt-1 rounded-xl border border-border-primary bg-white dark:bg-slate-950 shadow-2xl backdrop-blur-xl py-1 z-30 animate-scale-in w-36">
                                      {(Object.entries(PIPELINE_LABELS) as [PipelineStatus, string][]).map(([statusKey, statusVal]) => (
                                        <button
                                          key={statusKey}
                                          onClick={() => moveStatus(item.id, statusKey)}
                                          className={cn(
                                            'w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.04] cursor-pointer flex items-center justify-between',
                                            item.status === statusKey ? 'text-accent-600' : 'text-text-secondary'
                                          )}
                                        >
                                          {statusVal}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-text-primary text-right font-mono font-medium">
                              {item.licitacion.montoEstimado > 0 ? formatCLP(item.licitacion.montoEstimado) : '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => removeFavorite(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Quitar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* Empty state for licitaciones */
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-border-primary bg-white/40 dark:bg-slate-950/20 backdrop-blur-xl max-w-md mx-auto p-8 shadow-sm">
              <div className="p-3.5 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-border-primary mb-4">
                <Star className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-xs font-bold text-text-primary mb-1 uppercase tracking-wider">Sin Licitaciones Favoritas</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-6 font-normal">
                No tienes licitaciones guardadas en esta categoría. Explora convocatorias vigentes y presiona guardar para gestionarlas aquí.
              </p>
              <Link href="/licitaciones">
                <Button className="bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold px-4 shadow-none">
                  Buscar Licitaciones
                </Button>
              </Link>
            </div>
          )}
        </>
      )}

      {/* -----------------------------------------------------------
          2. CAPACITACIONES SECTION
         ----------------------------------------------------------- */}
      {favoriteType === 'capacitaciones' && (
        <>
          {/* Controls: Search and Status tabs */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Status tabs */}
            <div className="inline-flex p-0.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.03] border border-border-primary backdrop-blur-sm shadow-inner w-full lg:w-auto overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: 'all', label: 'Todas', count: savedCapacitaciones.length },
                { id: 'inscrito', label: 'Inscritas', count: savedCapacitaciones.filter(c => c.status === 'inscrito').length },
                { id: 'interesado', label: 'Interesado', count: savedCapacitaciones.filter(c => c.status === 'interesado').length },
                { id: 'completado', label: 'Completadas', count: savedCapacitaciones.filter(c => c.status === 'completado').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCapacitacionTab(tab.id as any)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
                    activeCapacitacionTab === tab.id
                      ? 'bg-white dark:bg-slate-900 text-accent-600 dark:text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {tab.label}
                  <span className="text-[9px] px-1 py-0.2 rounded-full bg-slate-200/50 dark:bg-white/10 text-slate-650 dark:text-slate-350">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="relative group w-full lg:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-accent-600 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar capacitaciones..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-border-primary text-xs font-semibold text-text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent-500/40 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {filteredCapacitaciones.length > 0 ? (
            /* Grid layout of Training courses */
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 animate-fade-in">
              {filteredCapacitaciones.map((item) => {
                const statusStyle = trainingStatusStyles[item.status];
                
                return (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 transition-all duration-300 flex flex-col hover:border-accent-500/30 dark:hover:border-accent-500/20 hover:shadow-glass hover:bg-white dark:hover:bg-zinc-950/40"
                  >
                    {/* Top line with organizer, status and date */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-primary flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-350">
                          <Building2 className="h-3.5 w-3.5 text-accent-600 shrink-0" />
                          {item.organizer}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[9px] font-semibold px-2 py-0.5 rounded-lg border uppercase tracking-wider', statusStyle.bg)}>
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2 mb-4 flex-1 text-left">
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent-600 transition-colors leading-relaxed">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                          {item.title}
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed font-normal">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-light font-medium pt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {formatDate(item.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {item.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {item.modality}
                        </span>
                      </div>
                    </div>

                    {/* Custom notes section */}
                    <div className="rounded-xl border border-border-primary bg-slate-50/50 dark:bg-slate-900/10 p-3.5 mb-5 relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-text-light uppercase tracking-wider flex items-center gap-1">
                          <Edit3 className="h-3 w-3 text-slate-400" />
                          Notas de la Capacitación
                        </span>
                        {editingCapacitacionNoteId !== item.id && (
                          <button
                            onClick={() => {
                              setEditingCapacitacionNoteId(item.id);
                              setTempCapacitacionNoteText(item.notes);
                            }}
                            className="text-[10px] text-accent-600 hover:underline font-semibold cursor-pointer"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                      {editingCapacitacionNoteId === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={tempCapacitacionNoteText}
                            onChange={(e) => setTempCapacitacionNoteText(e.target.value)}
                            placeholder="Agrega notas de preparación del curso o recordatorios..."
                            className="w-full h-16 p-2 rounded-lg border border-border-primary bg-white dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-accent-500/40 resize-none leading-relaxed shadow-inner"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingCapacitacionNoteId(null)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-text-light hover:text-text-primary cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => saveCapacitacionNoteText(item.id)}
                              className="px-3 py-1 rounded-lg text-[10px] font-semibold text-white bg-accent-600 hover:bg-accent-700 transition-colors cursor-pointer"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-text-secondary leading-relaxed font-normal whitespace-pre-wrap text-left">
                          {item.notes || 'Sin notas asociadas. Edita para programar recordatorios de asistencia.'}
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-border-primary flex items-center justify-between gap-4 mt-auto">
                      <button
                        onClick={() => removeCapacitacion(item.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Quitar de Favoritas"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-500/10 text-accent-600 hover:bg-accent-500/15 transition-all flex items-center gap-1"
                      >
                        Ir al Portal de Inscripción
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state for training courses */
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-border-primary bg-white/40 dark:bg-slate-950/20 backdrop-blur-xl max-w-md mx-auto p-8 shadow-sm">
              <div className="p-3.5 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-border-primary mb-4">
                <BookOpen className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-xs font-bold text-text-primary mb-1 uppercase tracking-wider">Sin Capacitaciones Guardadas</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-6 font-normal">
                No tienes capacitaciones guardadas en esta fase. Puedes agregarlas desde la sección de recursos o academia para verlas reflejadas aquí.
              </p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
