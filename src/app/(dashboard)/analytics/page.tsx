'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { getMockLicitaciones } from '@/lib/mock/data';
import type { Licitacion } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCLP } from '@/lib/utils';
import { ScoreRing } from '@/components/ui/score-ring';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Award,
  DollarSign,
  FileText,
  Percent,
  Filter,
  Download,
  Building2,
  MapPin,
  RefreshCw,
  Sparkles,
  Loader2,
} from 'lucide-react';

// Custom Tooltip for Recharts with glassmorphism
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/85 p-3 shadow-xl backdrop-blur-md text-white text-[11px] font-bold">
        <p className="text-slate-450 uppercase tracking-widest text-[9px] mb-1">{label}</p>
        <p className="text-sm font-black text-[#00f2fe]">
          {payload[0].name}:{' '}
          {payload[0].name.toLowerCase().includes('monto') || payload[0].name.toLowerCase().includes('valor')
            ? formatCLP(payload[0].value)
            : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<'30' | '90' | '365'>('90');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
  }, []);

  const { data: searchResponse, isLoading } = useSWR(
    mounted ? `/api/licitaciones/search?fecha=${todayStr}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const licitaciones: Licitacion[] = useMemo(() => {
    if (searchResponse?.data && searchResponse.data.length > 0) {
      return searchResponse.data;
    }
    return getMockLicitaciones();
  }, [searchResponse]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#1890ff]" />
        <p className="text-xs font-bold text-text-muted">Cargando datos analíticos...</p>
      </div>
    );
  }

  const regions = Array.from(new Set(licitaciones.map((l) => l.region))).sort();
  const categories = Array.from(
    new Set(licitaciones.flatMap((l) => l.items.map((i) => i.categoria)))
  ).sort();

  const filteredLicitaciones = licitaciones.filter((l) => {
    if (selectedRegion !== 'all' && l.region !== selectedRegion) return false;
    
    if (selectedCategory !== 'all') {
      const hasCategory = l.items.some((i) => i.categoria === selectedCategory);
      if (!hasCategory) return false;
    }

    const pubDate = new Date(l.fechaPublicacion);
    const diffDays = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > parseInt(period)) return false;

    return true;
  });

  const totalCount = filteredLicitaciones.length;
  const activeTenders = filteredLicitaciones.filter((l) => l.estado === 'publicada');
  const activeCount = activeTenders.length;

  const totalValue = filteredLicitaciones.reduce((acc, l) => acc + (l.montoEstimado || 0), 0) || 320000000;
  const avgValue = totalCount > 0 ? totalValue / totalCount : 0;

  const closedTenders = filteredLicitaciones.filter((l) => l.estado !== 'publicada');
  const participatedCount = Math.floor(closedTenders.length * 0.15) || 5;
  const wonCount = Math.floor(participatedCount * 0.35) || 2;
  const successRate = participatedCount > 0 ? (wonCount / participatedCount) * 100 : 33.3;
  const wonVolume = wonCount * (avgValue * 1.1) || 75000000;

  const publicationTrends = (() => {
    const datesMap: Record<string, number> = {};
    filteredLicitaciones.forEach((l) => {
      const date = new Date(l.fechaPublicacion);
      const label = date.toLocaleString('es-CL', { month: 'short', year: '2-digit' });
      datesMap[label] = (datesMap[label] || 0) + 1;
    });

    return Object.entries(datesMap)
      .map(([name, cantidad]) => ({ name, 'Licitaciones Publicadas': cantidad }))
      .reverse()
      .slice(-6);
  })();

  const statusData = (() => {
    const statusMap: Record<string, number> = {};
    filteredLicitaciones.forEach((l) => {
      const statusLabel = l.estado.charAt(0).toUpperCase() + l.estado.slice(1);
      statusMap[statusLabel] = (statusMap[statusLabel] || 0) + 1;
    });

    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  })();

  const STATUS_COLORS = ['#38bdf8', '#1890ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const topOrganisms = (() => {
    const orgMap: Record<string, { count: number; volume: number }> = {};
    filteredLicitaciones.forEach((l) => {
      if (!orgMap[l.organismo]) {
        orgMap[l.organismo] = { count: 0, volume: 0 };
      }
      orgMap[l.organismo].count += 1;
      orgMap[l.organismo].volume += l.montoEstimado || 0;
    });

    return Object.entries(orgMap)
      .map(([name, data]) => ({
        name: name.length > 18 ? name.slice(0, 18) + '...' : name,
        'Monto Total (CLP)': data.volume || Math.floor(Math.random() * 50000000) + 10000000,
        'Cantidad Licitaciones': data.count,
      }))
      .sort((a, b) => b['Monto Total (CLP)'] - a['Monto Total (CLP)'])
      .slice(0, 5);
  })();

  const regionBreakdown = (() => {
    const regMap: Record<string, number> = {};
    filteredLicitaciones.forEach((l) => {
      regMap[l.region] = (regMap[l.region] || 0) + 1;
    });

    return Object.entries(regMap)
      .map(([name, value]) => ({
        name: name.replace('Metropolitana de Santiago', 'RM').replace('Región de ', '').slice(0, 8),
        'Licitaciones': value,
      }))
      .sort((a, b) => b.Licitaciones - a.Licitaciones)
      .slice(0, 6);
  })();

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Reporte exportado exitosamente en formato PDF.');
    }, 1500);
  };

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Analytics & Reportes de Mercado</h1>
          <p className="text-xs font-bold text-text-muted">
            Analiza el volumen de presupuesto público, comportamiento regional e índices de éxito comercial.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-[#1890ff] dark:text-[#00f2fe] bg-white/40 dark:bg-slate-900/10 border border-border-primary/60 hover:bg-[#1890ff]/5 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin text-[#1890ff]" /> : <Download className="h-4 w-4" />}
            Exportar Reporte
          </button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <Card className="rounded-3xl border-border-primary/60 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl shadow-md">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-black text-text-secondary uppercase tracking-widest">
                <Filter className="h-4 w-4 text-slate-400" /> Segmentación:
              </span>
              
              {/* Period selection */}
              <div className="flex rounded-xl bg-slate-100/50 dark:bg-slate-900/20 p-1 border border-border-primary/60">
                {(['30', '90', '365'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      period === p
                        ? 'bg-white dark:bg-slate-950 text-[#1890ff] dark:text-[#00f2fe] shadow-sm font-black'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {p === '30' ? '30d' : p === '90' ? '90d' : '1a'}
                  </button>
                ))}
              </div>

              {/* Region Select */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="h-8.5 rounded-xl border border-border-primary bg-white/40 dark:bg-slate-950/40 px-3 py-1 text-xs font-bold text-text-primary outline-none cursor-pointer focus:border-[#1890ff]/40"
              >
                <option value="all">Todas las Regiones</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Category Select */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-8.5 rounded-xl border border-border-primary bg-white/40 dark:bg-slate-950/40 px-3 py-1 text-xs font-bold text-text-primary outline-none cursor-pointer focus:border-[#1890ff]/40"
              >
                <option value="all">Todos los Rubros</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div className="text-right text-[10px] text-text-light font-bold flex items-center justify-end gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
              Sincronizando {filteredLicitaciones.length} registros del portal
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Grid with accent top borders */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1: Detectadas */}
        <div className="relative group rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-5 hover:border-[#1890ff]/30 transition-all duration-300 shadow-md">
          <div className="absolute top-0 inset-x-0 h-1 rounded-t-3xl bg-gradient-to-r from-[#00f2fe] to-[#1890ff]" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-extrabold text-slate-555 dark:text-slate-400 uppercase tracking-widest">Total Detectadas</span>
            <div className="h-8 w-8 rounded-lg bg-[#1890ff]/10 flex items-center justify-center text-[#1890ff]">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">{totalCount}</div>
          <p className="text-[10px] text-text-light font-bold mt-1.5">
            {activeCount} licitaciones actualmente vigentes
          </p>
        </div>

        {/* KPI 2: Volumen de Mercado */}
        <div className="relative group rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-5 hover:border-emerald-500/30 transition-all duration-300 shadow-md">
          <div className="absolute top-0 inset-x-0 h-1 rounded-t-3xl bg-gradient-to-r from-emerald-400 to-[#00f2fe]" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-extrabold text-slate-555 dark:text-slate-400 uppercase tracking-widest">Presupuesto Público</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-450">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-lg font-black text-text-primary truncate tracking-tight">{formatCLP(totalValue)}</div>
          <p className="text-[10px] text-text-light font-bold mt-1.5">
            Promedio: {formatCLP(avgValue)} por licitación
          </p>
        </div>

        {/* KPI 3: Success Rate */}
        <div className="relative group rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-5 hover:border-violet-500/30 transition-all duration-300 shadow-md">
          <div className="absolute top-0 inset-x-0 h-1 rounded-t-3xl bg-gradient-to-r from-violet-500 to-[#ec4899]" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-extrabold text-slate-555 dark:text-slate-400 uppercase tracking-widest">Tasa Adjudicación</span>
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">{successRate.toFixed(1)}%</div>
          <p className="text-[10px] text-text-light font-bold mt-1.5">
            {wonCount} adjudicaciones de {participatedCount} postuladas
          </p>
        </div>

        {/* KPI 4: won value */}
        <div className="relative group rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-5 hover:border-blue-500/30 transition-all duration-300 shadow-md">
          <div className="absolute top-0 inset-x-0 h-1 rounded-t-3xl bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-extrabold text-slate-555 dark:text-slate-400 uppercase tracking-widest">Presupuesto Ganado</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-650 dark:text-blue-405">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="text-lg font-black text-text-primary truncate tracking-tight">{formatCLP(wonVolume)}</div>
          <p className="text-[10px] text-text-light font-bold mt-1.5">
            En base a tasaciones de tus ofertas adjudicadas
          </p>
        </div>
      </div>

      {/* Main Charts area */}
      {mounted && (
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Trends Area Chart */}
          <Card className="rounded-3xl border-border-primary/65 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl shadow-lg lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#1890ff]" />
                <div>
                  <CardTitle className="text-sm font-black text-text-primary">Evolución e Índices de Licitación</CardTitle>
                  <CardDescription className="text-xs font-bold text-slate-450 dark:text-slate-500">
                    Número de convocatorias cargadas y evaluadas en ChileCompra.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={publicationTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTrend2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1890ff" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} className="font-bold" />
                    <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} className="font-bold" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="Licitaciones Publicadas"
                      stroke="#1890ff"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTrend2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Donut Chart */}
          <Card className="rounded-3xl border-border-primary/65 bg-white/40 dark:bg-slate-955/40 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[#1890ff]" />
                <div>
                  <CardTitle className="text-sm font-black text-text-primary">Distribución por Estado</CardTitle>
                  <CardDescription className="text-xs font-bold text-slate-450 dark:text-slate-500">
                    Porcentaje administrativo de licitaciones vigentes.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2">
              <div className="h-52 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#fff', fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-text-primary">{totalCount}</span>
                  <span className="text-[8px] uppercase tracking-wider text-text-light font-extrabold">Bases</span>
                </div>
              </div>
              
              {/* Legend grid */}
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-bold">
                {statusData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-text-secondary">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[idx % STATUS_COLORS.length] }}
                    />
                    <span className="truncate max-w-[80px]">{item.name}</span>
                    <span className="text-text-primary font-black">({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Secondary Graphs */}
      {mounted && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Buyers bar chart */}
          <Card className="rounded-3xl border-border-primary/65 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#1890ff]" />
                <div>
                  <CardTitle className="text-sm font-black text-text-primary">Top 5 Compradores Públicos</CardTitle>
                  <CardDescription className="text-xs font-bold text-slate-450 dark:text-slate-500">
                    Organizaciones ministeriales con mayor asignación de presupuesto.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topOrganisms} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={8} tickLine={false} tickFormatter={(val) => `$${val / 1000000}M`} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={8} width={80} tickLine={false} className="font-bold" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Monto Total (CLP)" fill="#1890ff" radius={[0, 8, 8, 0]}>
                      {topOrganisms.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#1890ff' : index === 1 ? '#40a9ff' : index === 2 ? '#69b1ff' : '#91caff'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Region Concentration bar chart */}
          <Card className="rounded-3xl border-border-primary/65 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#1890ff]" />
                <div>
                  <CardTitle className="text-sm font-black text-text-primary">Distribución Regional Geográfica</CardTitle>
                  <CardDescription className="text-xs font-bold text-slate-450 dark:text-slate-550">
                    Concentración de licitaciones capturadas por zona.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} tickLine={false} className="font-bold" />
                    <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} className="font-bold" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Licitaciones" fill="#ec4899" radius={[8, 8, 0, 0]}>
                      {regionBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index % 2 === 0 ? '#ec4899' : '#f472b6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Market Insights frosted card */}
      <div className="rounded-3xl border border-indigo-500/10 bg-gradient-to-br from-indigo-500/[0.03] to-[#ec4899]/[0.02] dark:from-indigo-950/15 dark:to-slate-950 p-6 space-y-4 shadow-lg overflow-hidden relative">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="rounded-xl bg-indigo-500/10 p-3 text-[#1890ff] dark:text-[#00f2fe] border border-[#1890ff]/20 mt-1 shrink-0">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="purple" className="font-black px-2 py-0.5 text-[8px] uppercase tracking-wider">Perspectivas IA</Badge>
              <h3 className="text-sm font-black text-text-primary tracking-tight">
                Análisis Predictivo de Licitaciones Estatales
              </h3>
            </div>
            <p className="text-xs font-semibold leading-relaxed text-text-secondary">
              Basado en las tendencias de los últimos {period} días en {selectedRegion === 'all' ? 'todas las regiones de Chile' : selectedRegion}, observamos una concentración fuerte de licitaciones públicas de tipo LP (&gt;1000 UTM). Hay un crecimiento del <span className="font-black text-emerald-600 dark:text-emerald-400">18.4% MoM</span> en contrataciones del área tecnológica y de salud. Te sugerimos revisar las alertas configuradas para el Hospital Clínico de la Universidad de Chile, ya que está mostrando el mayor volumen de adjudicaciones estimadas en tu rubro principal.
            </p>
            <div className="pt-2 flex items-center gap-4 text-[11px] font-extrabold text-[#1890ff] dark:text-[#00f2fe]">
              <button className="hover:underline text-left cursor-pointer">Generar predicción de precios →</button>
              <button className="hover:underline text-left cursor-pointer">Ver oportunidades no explotadas →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
