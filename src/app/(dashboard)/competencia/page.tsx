'use client';

import { useState, useEffect } from 'react';
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
  Cell,
} from 'recharts';
import {
  Users,
  Search,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  DollarSign,
  AlertTriangle,
  Building,
  Target,
  ExternalLink,
  Building2,
  X,
  Loader2,
} from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  rut: string;
  tendersWon: number;
  totalWonAmount: number;
  mainCategory: string;
  winRate: number; // percentage
  status: 'active' | 'inactive';
}

interface RivalAdjudication {
  id: string;
  competitorName: string;
  title: string;
  organism: string;
  amount: number;
  date: string;
  code: string;
}

const INITIAL_COMPETITORS: Competitor[] = [
  {
    id: 'comp-1',
    name: 'Sonda S.A.',
    rut: '96.536.000-5',
    tendersWon: 45,
    totalWonAmount: 1850000000,
    mainCategory: 'Tecnología de la información',
    winRate: 42,
    status: 'active',
  },
  {
    id: 'comp-2',
    name: 'Entel PCS Telecomunicaciones S.A.',
    rut: '96.806.000-2',
    tendersWon: 32,
    totalWonAmount: 2450000000,
    mainCategory: 'Telecomunicaciones y Datos',
    winRate: 38,
    status: 'active',
  },
  {
    id: 'comp-3',
    name: 'Gtd Teleductos S.A.',
    rut: '92.580.000-7',
    tendersWon: 18,
    totalWonAmount: 980000000,
    mainCategory: 'Conectividad y Redes',
    winRate: 29,
    status: 'active',
  },
  {
    id: 'comp-4',
    name: 'Claro Chile S.A.',
    rut: '96.790.000-k',
    tendersWon: 24,
    totalWonAmount: 1120000000,
    mainCategory: 'Equipos Computacionales',
    winRate: 31,
    status: 'active',
  },
];

const INITIAL_ADJUDICATIONS: RivalAdjudication[] = [
  {
    id: 'adj-1',
    competitorName: 'Sonda S.A.',
    title: 'Modernización del Datacenter Institucional',
    organism: 'Servicio de Registro Civil',
    amount: 450000000,
    date: '2026-05-18',
    code: '1548-12-LR26',
  },
  {
    id: 'adj-2',
    competitorName: 'Entel PCS Telecomunicaciones S.A.',
    title: 'Suministro de Enlaces de Internet Nacional para Colegios Públicos',
    organism: 'Ministerio de Educación',
    amount: 1200000000,
    date: '2026-05-12',
    code: '920-55-LP26',
  },
  {
    id: 'adj-3',
    competitorName: 'Gtd Teleductos S.A.',
    title: 'Servicio de Telefonía IP y Red WAN Corporativa',
    organism: 'Municipalidad de Las Condes',
    amount: 180000000,
    date: '2026-05-09',
    code: '458-9-LE26',
  },
  {
    id: 'adj-4',
    competitorName: 'Sonda S.A.',
    title: 'Mantenimiento del Sistema Integrado de Finanzas',
    organism: 'JUNAEB',
    amount: 120000000,
    date: '2026-05-02',
    code: '6890-4-L126',
  },
  {
    id: 'adj-5',
    competitorName: 'Claro Chile S.A.',
    title: 'Habilitación de Infraestructura Móvil 5G',
    organism: 'Subsecretaría de Telecomunicaciones',
    amount: 320000000,
    date: '2026-04-28',
    code: '820-22-LP26',
  },
];

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

export default function CompetenciaPage() {
  const [mounted, setMounted] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [adjudications, setAdjudications] = useState<RivalAdjudication[]>(INITIAL_ADJUDICATIONS);
  
  // Form states
  const [newName, setNewName] = useState('');
  const [newRut, setNewRut] = useState('');
  const [newCategory, setNewCategory] = useState('Tecnología de la información');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRut) return;

    const newComp: Competitor = {
      id: `comp-${Date.now()}`,
      name: newName,
      rut: newRut,
      tendersWon: Math.floor(Math.random() * 15) + 2,
      totalWonAmount: Math.floor(Math.random() * 800000000) + 100000000,
      mainCategory: newCategory,
      winRate: Math.floor(Math.random() * 30) + 15,
      status: 'active',
    };

    setCompetitors([...competitors, newComp]);
    
    // Add a simulated recent win for this competitor
    const newAdj: RivalAdjudication = {
      id: `adj-${Date.now()}`,
      competitorName: newName,
      title: `Servicios de Consultoría y Soporte ${newCategory}`,
      organism: 'Hospital Clínico Universidad de Chile',
      amount: Math.floor(newComp.totalWonAmount * 0.1),
      date: new Date().toISOString().split('T')[0],
      code: `${Math.floor(Math.random() * 9000) + 1000}-44-LE26`,
    };
    
    setAdjudications([newAdj, ...adjudications]);

    // Reset fields
    setNewName('');
    setNewRut('');
    setShowAddForm(false);
  };

  const handleDeleteCompetitor = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas dejar de monitorear a ${name}?`)) {
      setCompetitors(competitors.filter((c) => c.id !== id));
      setAdjudications(adjudications.filter((a) => a.competitorName !== name));
    }
  };

  const comparisonData = competitors.map((c) => ({
    name: c.name.split(' ')[0], // short name
    'Monto Adjudicado (CLP)': c.totalWonAmount,
    'Licitaciones Ganadas': c.tendersWon,
  }));

  const winRatesData = competitors.map((c) => ({
    name: c.name.length > 15 ? c.name.slice(0, 15) + '...' : c.name,
    'Tasa de Éxito (%)': c.winRate,
  }));

  const totalMarketVolume = competitors.reduce((acc, c) => acc + c.totalWonAmount, 0);

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-[#1890ff] animate-pulse" />
            Análisis de Competencia
          </h1>
          <p className="text-xs font-bold text-text-muted">
            Monitorea el RUT de tus rivales directos en Mercado Público, tasas de éxito y su volumen de adjudicaciones.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#1890ff] to-[#ec4899] hover:from-[#1890ff]/90 hover:to-[#ec4899]/90 transition-all duration-300 shadow-lg shadow-[#1890ff]/20 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" /> Agregar Competidor
        </button>
      </div>

      {/* Add Competitor Panel */}
      {showAddForm && (
        <Card className="rounded-3xl border-border-primary/65 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl shadow-md animate-fade-in">
          <CardHeader className="pb-3 border-b border-border-primary/45">
            <CardTitle className="text-sm font-black text-text-primary uppercase tracking-wider">Monitorear Empresa Rival</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-450 dark:text-slate-550">
              Ingresa el RUT comercial del competidor público para activar el escaneo automático de sus propuestas adjudicadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleAddCompetitor} className="grid gap-4 sm:grid-cols-3 sm:items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">Razón Social</label>
                <input
                  placeholder="Ej: Sonda S.A. o MedCorp"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-border-primary text-xs font-semibold text-text-primary placeholder:text-slate-400 focus:outline-none focus:border-[#1890ff]/40 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">RUT Empresa</label>
                <input
                  placeholder="Ej: 96.536.000-5"
                  value={newRut}
                  onChange={(e) => setNewRut(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-border-primary text-xs font-semibold text-text-primary placeholder:text-slate-400 focus:outline-none focus:border-[#1890ff]/40 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <div className="space-y-1.5 flex-1">
                  <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">Rubro de la Competencia</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="h-9.5 w-full rounded-xl border border-border-primary bg-white/40 dark:bg-slate-950/40 px-3 text-xs font-bold text-text-primary outline-none transition-colors focus:border-[#1890ff]/40 cursor-pointer"
                  >
                    <option value="Tecnología de la información">Tecnología de la información</option>
                    <option value="Servicios de construcción">Servicios de construcción</option>
                    <option value="Telecomunicaciones y Datos">Telecomunicaciones y Datos</option>
                    <option value="Equipos Médicos">Equipos Médicos</option>
                  </select>
                </div>
                <button type="submit" className="px-5 py-3 rounded-xl text-xs font-black uppercase text-white bg-[#1890ff] hover:bg-[#0958d9] transition-all cursor-pointer shadow-md">
                  Monitorear
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* KPIs Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        
        {/* KPI 1: Monitoreados */}
        <div className="relative group rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-5 hover:border-[#1890ff]/30 transition-all duration-300 shadow-md">
          <div className="absolute top-0 inset-x-0 h-1 rounded-t-3xl bg-gradient-to-r from-[#00f2fe] to-[#1890ff]" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-extrabold text-slate-555 dark:text-slate-400 uppercase tracking-widest">Rivalidades Monitoreadas</span>
            <Users className="h-4 w-4 text-[#1890ff]" />
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">{competitors.length}</div>
          <p className="text-[10px] text-text-light font-bold mt-1.5">Monitoreo automático activo en Mercado Público</p>
        </div>

        {/* KPI 2: Total Adjudicado */}
        <div className="relative group rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-5 hover:border-emerald-500/30 transition-all duration-300 shadow-md">
          <div className="absolute top-0 inset-x-0 h-1 rounded-t-3xl bg-gradient-to-r from-emerald-400 to-[#00f2fe]" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-extrabold text-slate-555 dark:text-slate-400 uppercase tracking-widest">Volumen Adjudicado Rivales</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-text-primary truncate tracking-tight">{formatCLP(totalMarketVolume)}</div>
          <p className="text-[10px] text-text-light font-bold mt-1.5">Presupuesto total capturado por competidores</p>
        </div>

        {/* KPI 3: Success Rate */}
        <div className="relative group rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-5 hover:border-violet-500/30 transition-all duration-300 shadow-md">
          <div className="absolute top-0 inset-x-0 h-1 rounded-t-3xl bg-gradient-to-r from-violet-500 to-[#ec4899]" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-extrabold text-slate-555 dark:text-slate-400 uppercase tracking-widest">Tasa Éxito Rival</span>
            <Target className="h-4 w-4 text-violet-550" />
          </div>
          <div className="text-2xl font-black text-text-primary tracking-tight">
            {(competitors.reduce((acc, c) => acc + c.winRate, 0) / competitors.length).toFixed(1)}%
          </div>
          <p className="text-[10px] text-text-light font-bold mt-1.5">Promedio de licitaciones ganadas frente al total</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      {mounted && (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Chart 1: Money volume */}
          <Card className="rounded-3xl border-border-primary/65 bg-white/40 dark:bg-slate-955/40 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-black text-text-primary">Volumen Capturado por Rival</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-450 dark:text-slate-500">
                Comparativa global del presupuesto público total adjudicado.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} className="font-bold" />
                    <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} tickFormatter={(val) => `$${val / 1000000}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Monto Adjudicado (CLP)" fill="#1890ff" radius={[8, 8, 0, 0]}>
                      {comparisonData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#1890ff' : index === 1 ? '#9b51e0' : index === 2 ? '#00f2fe' : '#ec4899'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: Success Rates */}
          <Card className="rounded-3xl border-border-primary/65 bg-white/40 dark:bg-slate-955/40 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-black text-text-primary">Efectividad de Adjudicación (%)</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-450 dark:text-slate-500">
                Porcentaje promedio de postulaciones con adjudicación firme.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={winRatesData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={9} tickLine={false} tickFormatter={(val) => `${val}%`} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={9} width={90} tickLine={false} className="font-bold" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Tasa de Éxito (%)" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Competitors List */}
      <Card className="rounded-3xl border-border-primary/65 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl overflow-hidden shadow-lg">
        <CardHeader className="pb-3 border-b border-border-primary/45">
          <CardTitle className="text-sm font-black text-text-primary">Empresas Rival Monitoreadas</CardTitle>
          <CardDescription className="text-xs font-bold text-slate-450 dark:text-slate-550">
            Métricas de adjudicación y éxito de competidores activos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-primary bg-white/40 dark:bg-slate-950/40 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  <th className="py-4 px-4">Empresa</th>
                  <th className="py-4 px-4">RUT</th>
                  <th className="py-4 px-4">Rubro Frecuente</th>
                  <th className="py-4 px-4 text-center">Won</th>
                  <th className="py-4 px-4 text-right">Total Adjudicado</th>
                  <th className="py-4 px-4 text-center">Tasa Éxito</th>
                  <th className="py-4 px-4 text-right w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/50 text-xs font-bold text-text-secondary">
                {competitors.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-100/50 dark:hover:bg-white/[0.015] transition-colors">
                    <td className="py-4 px-4 font-black text-text-primary flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-[#1890ff]/20 flex items-center justify-center text-xs shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      {comp.name}
                    </td>
                    <td className="py-4 px-4 text-slate-450 dark:text-slate-500 font-mono text-xs">{comp.rut}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase border-border-primary bg-slate-50/50 dark:bg-slate-900/20 text-text-secondary">
                        {comp.mainCategory}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center font-black text-text-secondary">{comp.tendersWon}</td>
                    <td className="py-4 px-4 text-right font-black text-text-primary">{formatCLP(comp.totalWonAmount)}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`font-black ${comp.winRate >= 35 ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-secondary'}`}>
                        {comp.winRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDeleteCompetitor(comp.id, comp.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Adjudications won by competitors */}
      <Card className="rounded-3xl border-border-primary/65 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-3 border-b border-border-primary/45 flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-sm font-black text-text-primary">Últimas Adjudicaciones Competidoras</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-450 dark:text-slate-500">
              Licitaciones públicas ganadas recientemente por los rivales registrados.
            </CardDescription>
          </div>
          <div className="rounded-xl bg-amber-500/10 px-3 py-2 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 z-10">
            <AlertTriangle className="h-4 w-4 animate-pulse" /> Alerta Activa de Adjudicaciones
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border-primary/50">
          {adjudications.map((adj) => (
            <div key={adj.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-105/20 transition-colors">
              <div className="space-y-2 max-w-2xl text-xs font-bold">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[8px] font-black uppercase text-[#1890ff] dark:text-[#00f2fe] bg-[#1890ff]/10 border border-[#1890ff]/20 px-2 py-0.5 rounded">
                    {adj.competitorName}
                  </span>
                  <span className="text-[9px] text-slate-450 dark:text-slate-500 font-mono tracking-wider">{adj.code}</span>
                </div>
                <h4 className="text-xs font-black text-text-primary leading-normal">{adj.title}</h4>
                <p className="text-[10px] text-text-light font-bold flex items-center gap-1">
                  Comprador: <span className="text-text-secondary font-black">{adj.organism}</span>
                </p>
              </div>
              
              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 text-xs font-bold">
                <span className="text-xs font-black text-text-primary">{formatCLP(adj.amount)}</span>
                <span className="text-[10px] text-text-light font-bold">
                  {new Intl.DateTimeFormat('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date(adj.date))}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
