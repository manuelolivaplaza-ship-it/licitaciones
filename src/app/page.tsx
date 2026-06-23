'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Zap,
  Search,
  Bell,
  Sparkles,
  FileText,
  ArrowRight,
  Check,
  Shield,
  Globe,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Menu,
  X,
  Copy,
  Calendar,
  Building2,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck,
  Mail,
  Star,
  Cpu,
  Activity,
  ArrowUpRight,
  BarChart3,
  Target,
  Clock,
  Users,
  CircleDot,
  Crosshair,
  Radar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/ui/score-ring';
import { ThemeToggle } from '@/components/ThemeToggle';

// ------------------------------------------------------------------
// Perpetual Micro-Animation Components (memoized, isolated)
// ------------------------------------------------------------------

// 1. Typewriter Search — cycles through search queries
const TypewriterSearch = memo(function TypewriterSearch() {
  const [text, setText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'deleting'>('typing');

  const queries = [
    'plataformas e-learning para capacitación municipal',
    'desarrollo web portal institucional región metropolitana',
    'cursos virtuales de programación para funcionarios',
    'sistemas de gestión académica para universidades',
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentQuery = queries[currentIndex];

    if (phase === 'typing') {
      if (text.length < currentQuery.length) {
        timer = setTimeout(() => setText(currentQuery.slice(0, text.length + 1)), 40);
      } else {
        timer = setTimeout(() => setPhase('waiting'), 2800);
      }
    } else if (phase === 'waiting') {
      timer = setTimeout(() => setPhase('deleting'), 0);
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, -1)), 18);
      } else {
        setCurrentIndex((prev) => (prev + 1) % queries.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timer);
  }, [text, phase, currentIndex]);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/40 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] px-4 py-3.5 transition-all duration-300">
      <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
      <div className="text-[13px] font-mono text-slate-600 dark:text-slate-300 flex-1 truncate select-none leading-none">
        {text}
        <span className="inline-block w-[2px] h-4 bg-accent-500 ml-0.5 align-middle animate-cursor" />
      </div>
    </div>
  );
});

// 2. Score Ring Cycler — pulses through scores
const ScoreRingCycler = memo(function ScoreRingCycler() {
  const [score, setScore] = useState(87);
  const [label, setLabel] = useState('Programbi.com');

  useEffect(() => {
    const data = [
      { score: 87, label: 'Programbi.com' },
      { score: 96, label: 'Consultoría IT' },
      { score: 42, label: 'Obra Civil' },
      { score: 94, label: 'E-Learning B2G' },
      { score: 71, label: 'Suministros' },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % data.length;
      setScore(data[idx].score);
      setLabel(data[idx].label);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return '#3498db';
    if (s >= 40) return '#f59e0b';
    return '#94a3b8';
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <ScoreRing score={score} size={96} strokeWidth={8} />
      </div>
      <div className="text-center space-y-1">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Relevancia para
        </div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all duration-500">
          {label}
        </div>
      </div>

      {/* Sub-scores */}
      <div className="w-full space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
        {[
          { name: 'Experiencia', value: 92, color: '#22c55e' },
          { name: 'Financiero', value: 85, color: '#3498db' },
          { name: 'Geográfico', value: 78, color: '#f59e0b' },
        ].map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              <span>{item.name}</span>
              <span className="font-mono">{item.value}%</span>
            </div>
            <div className="h-1 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${item.value}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// 3. Terminal Copilot — types out proposal text
const TerminalCopilot = memo(function TerminalCopilot() {
  const [text, setText] = useState('');
  const [lineIdx, setLineIdx] = useState(0);

  const lines = [
    '> Analizando bases licitación ID: 2891-45-LP26...',
    '> Extrayendo requisitos técnicos del pliego...',
    '',
    '## Propuesta Técnica Generada',
    '',
    'Para la "Plataforma E-Learning Municipal"',
    'ProgramBi propone un modelo pedagógico',
    'basado en microlearning y evaluación',
    'continua, con despliegue en AWS/GCP.',
    '',
    'Fase 1: Diagnóstico de competencias',
    'Fase 2: Diseño instruccional adaptativo',
    'Fase 3: Deploy y soporte post-venta',
  ];

  useEffect(() => {
    let charIdx = 0;
    let currentLine = 0;
    let fullText = '';
    let timer: NodeJS.Timeout;

    const type = () => {
      if (currentLine >= lines.length) {
        timer = setTimeout(() => {
          fullText = '';
          currentLine = 0;
          charIdx = 0;
          setText('');
          type();
        }, 4000);
        return;
      }

      const line = lines[currentLine];
      if (charIdx <= line.length) {
        setText(fullText + line.slice(0, charIdx));
        charIdx++;
        timer = setTimeout(type, 25);
      } else {
        fullText += line + '\n';
        currentLine++;
        charIdx = 0;
        timer = setTimeout(type, 80);
      }
    };

    timer = setTimeout(type, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-white/5 overflow-hidden h-full flex flex-col">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 dark:border-white/5 bg-slate-950/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-red-500/80 transition-colors" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-amber-500/80 transition-colors" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-emerald-500/80 transition-colors" />
        </div>
        <span className="text-[10px] font-mono text-slate-500">copiloto_propuesta.sh</span>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-slate-400 overflow-hidden whitespace-pre-wrap select-none">
        {text}
        <span className="inline-block w-[2px] h-3.5 bg-accent-400 ml-0.5 animate-cursor" />
      </div>

      {/* Terminal Footer */}
      <div className="border-t border-slate-800 dark:border-white/5 px-4 py-2 flex justify-between items-center text-[9px] font-mono text-slate-600">
        <span>Claude 3.5 Sonnet</span>
        <span className="flex items-center gap-1.5 text-emerald-500">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-status-breathe" />
          Activo
        </span>
      </div>
    </div>
  );
});

// 4. Alert Pill — Dynamic Island style morphing
const AlertPill = memo(function AlertPill() {
  const [expanded, setExpanded] = useState(false);
  const [idx, setIdx] = useState(0);

  const alerts = [
    { title: 'MOP - Plataforma Digital', match: 96, budget: '$45M CLP', sector: 'Tecnología' },
    { title: 'Mineduc - Capacitación TIC', match: 94, budget: '$28M CLP', sector: 'Educación' },
    { title: 'Serviu - Portal de Denuncias', match: 91, budget: '$62M CLP', sector: 'Software' },
  ];

  useEffect(() => {
    const run = () => {
      setExpanded(true);
      const shrink = setTimeout(() => setExpanded(false), 3800);
      const next = setTimeout(() => setIdx((p) => (p + 1) % alerts.length), 5200);
      return () => { clearTimeout(shrink); clearTimeout(next); };
    };

    const interval = setInterval(run, 6000);
    const first = setTimeout(run, 1200);
    return () => { clearInterval(interval); clearTimeout(first); };
  }, []);

  const alert = alerts[idx];

  return (
    <div className="flex items-center justify-center w-full py-8">
      <div
        className={`bg-slate-900 dark:bg-slate-950 border border-white/10 text-white transition-all duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] flex flex-col items-center justify-between shadow-elevated ${
          expanded
            ? 'w-[85%] h-40 rounded-[2rem] p-5'
            : 'w-44 h-10 rounded-full px-4 py-2 flex-row'
        }`}
      >
        {!expanded ? (
          <div className="flex items-center justify-between w-full text-[10px] font-semibold tracking-tight">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-status-breathe" />
              Nueva Alerta
            </span>
            <span className="text-slate-500 font-mono text-[9px] bg-white/5 px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          </div>
        ) : (
          <div className="flex flex-col justify-between h-full w-full animate-fade-in space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-accent-500/15 flex items-center justify-center text-accent-400">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">Alerta IA</span>
                  <p className="text-[11px] font-semibold truncate max-w-[160px] leading-none mt-0.5">{alert.title}</p>
                </div>
              </div>
              <Badge variant="success" className="text-[8px] py-0.5 px-1.5 font-bold">
                {alert.match}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-500 font-mono">
              <div>
                <span className="block">Presupuesto</span>
                <span className="text-white font-semibold">{alert.budget}</span>
              </div>
              <div>
                <span className="block">Sector</span>
                <span className="text-white font-semibold">{alert.sector}</span>
              </div>
            </div>

            <button className="w-full bg-white/5 border border-white/10 rounded-xl py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10 transition-colors">
              Ver detalles completos
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// 5. Price Analyzer — horizontal bars
const PriceAnalyzer = memo(function PriceAnalyzer() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Optimizador de Ofertas</span>
        <Badge className="bg-accent-500/10 text-accent-500 border-accent-500/20 text-[8px] font-bold">Predictivo</Badge>
      </div>

      <div className="space-y-4">
        {[
          { label: 'Techo en Bases', value: '$42,000,000', pct: 100, color: '#ef4444' },
          { label: 'Promedio Competidores', value: '$33,600,000', pct: 80, color: '#94a3b8' },
          { label: 'Sugerencia IA ProgramBi', value: '$31,500,000', pct: 75, color: '#3498db', highlight: true },
        ].map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className={`font-semibold ${item.highlight ? 'text-accent-500 flex items-center gap-1' : 'text-slate-500'}`}>
                {item.label}
                {item.highlight && <Sparkles className="h-3 w-3" />}
              </span>
              <span className={item.highlight ? 'text-accent-500 font-bold' : 'text-slate-500'}>
                {item.value}
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${item.pct}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5 text-[10px]">
        <span className="text-slate-400">Prob. de Adjudicación</span>
        <span className="font-bold text-emerald-500 font-mono">91.4%</span>
      </div>
    </div>
  );
});

// 6. Interactive Q&A Chat
const AIChatDemo = memo(function AIChatDemo() {
  const [chatQuestion, setChatQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ q: string; a: string }>>([
    {
      q: 'Que boleta de garantia necesita esta licitacion?',
      a: 'Requiere una boleta de seriedad de la oferta equivalente al 5% del valor estimado del contrato (aprox. $1.575.000 CLP), vigencia minima 60 dias desde la apertura tecnica.',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    {
      q: 'Cuales son las multas por retraso?',
      a: 'Segun clausula 14.2, las multas son de 0.5 UTM por cada dia corrido de atraso en la entrega de informes de avance, con tope maximo del 10% del monto total adjudicado.',
    },
    {
      q: 'Se permite subcontratar?',
      a: 'Si, la clausula 8.4 autoriza subcontratacion parcial unicamente para el modulo de desarrollo frontend, previo aviso y aprobacion escrita de la contraparte tecnica.',
    },
    {
      q: 'Requisitos de experiencia previa?',
      a: 'Se requiere acreditar al menos 3 proyectos similares en los ultimos 5 anos, con un monto minimo de $15M CLP cada uno, en el rubro de tecnologia educativa o plataformas digitales.',
    },
  ];

  const handleSubmit = (e?: React.FormEvent, overrideQ?: string) => {
    if (e) e.preventDefault();
    const q = overrideQ || chatQuestion;
    if (!q.trim() || isTyping) return;

    setChatQuestion('');
    const msgIdx = messages.length;
    setMessages((prev) => [...prev, { q, a: '' }]);
    setIsTyping(true);

    const match = suggestions.find((s) => s.q === q);
    const response = match
      ? match.a
      : `Basado en el analisis semantico de las bases para "${q.slice(0, 25)}...", el proponente debe cumplir con los perfiles del Anexo N3 y estar registrado en ChileProveedores.`;

    setTimeout(() => {
      setIsTyping(false);
      let len = 0;
      const interval = setInterval(() => {
        len += 3;
        if (len >= response.length) {
          clearInterval(interval);
          setMessages((prev) => {
            const next = [...prev];
            if (next[msgIdx]) next[msgIdx].a = response;
            return next;
          });
        } else {
          setMessages((prev) => {
            const next = [...prev];
            if (next[msgIdx]) next[msgIdx].a = response.slice(0, len);
            return next;
          });
        }
      }, 12);
    }, 900);
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="rounded-[2rem] bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/[0.06] p-6 flex flex-col h-[420px] justify-between shadow-diffusion">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
        <div className="h-9 w-9 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-500">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Asistente IA LicitaHub</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Licitacion ID: 2891-45-LP26</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto py-4 space-y-4 text-[12px] font-medium pr-1 scrollbar-none">
        {messages.map((item, idx) => (
          <div key={idx} className="space-y-2.5">
            <div className="flex justify-end">
              <span className="bg-accent-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] block">
                {item.q}
              </span>
            </div>
            {item.a && (
              <div className="flex justify-start">
                <span className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-300 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%] block leading-relaxed">
                  {item.a}
                </span>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <span className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5 text-slate-400 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-bounce [animation-delay:0.3s]" />
            </span>
          </div>
        )}
      </div>

      {/* Suggestions & Input */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSubmit(undefined, s.q)}
              disabled={isTyping}
              className="bg-slate-50 dark:bg-slate-800/40 hover:bg-accent-500/10 hover:text-accent-500 dark:hover:bg-accent-500/10 border border-slate-200/50 dark:border-white/5 rounded-full px-3 py-1.5 text-[10px] font-semibold text-slate-500 transition-colors cursor-pointer disabled:opacity-40"
            >
              {s.q}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => handleSubmit(e)} className="flex gap-2">
          <input
            type="text"
            placeholder="Pregunta sobre plazos, multas, anexos..."
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            disabled={isTyping}
            className="flex-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none transition-all"
          />
          <Button type="submit" disabled={isTyping} size="sm" className="rounded-xl font-semibold shrink-0 bg-accent-500 hover:bg-accent-600 shadow-none text-white">
            Enviar
          </Button>
        </form>
      </div>
    </div>
  );
});

// 7. Spotlight card wrapper with mouse tracking
function SpotlightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card rounded-[2rem] bg-white dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/[0.06] p-8 shadow-diffusion transition-all duration-300 hover:shadow-elevated hover:border-slate-300/50 dark:hover:border-white/10 ${className}`}
    >
      {children}
    </div>
  );
}

// ------------------------------------------------------------------
// Hero Mockup — Layered 3D Dashboard
// ------------------------------------------------------------------
const HeroMockup = memo(function HeroMockup() {
  return (
    <div className="relative perspective-2000 w-full">
      {/* Ambient glow behind */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-accent-500/8 dark:bg-accent-500/[0.03] rounded-full blur-[80px] pointer-events-none" />

      {/* Main Dashboard Card */}
      <div className="relative transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:[transform:rotateX(4deg)_rotateY(-6deg)] [transform-style:preserve-3d]">
        <div className="w-full bg-white dark:bg-slate-900/80 rounded-[2rem] shadow-elevated border border-slate-200/50 dark:border-white/[0.06] overflow-hidden [transform-style:preserve-3d]">
          {/* Window Chrome */}
          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="ml-4 h-5 flex-1 max-w-[200px] rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>

          {/* Dashboard Content */}
          <div className="p-6 space-y-5">
            {/* Top KPIs */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Licitaciones Activas', value: '47', change: '+12 esta semana', positive: true },
                { label: 'Score Promedio', value: '84.2', change: '+6.1 vs mes anterior', positive: true },
                { label: 'Tasa de Exito', value: '34.7%', change: '+8.3% vs trimestre', positive: true },
              ].map((kpi) => (
                <div key={kpi.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                  <div className="text-lg font-semibold text-slate-800 dark:text-white font-mono">{kpi.value}</div>
                  <span className="text-[9px] text-emerald-500 font-medium">{kpi.change}</span>
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div className="h-28 w-full relative rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-white/5 p-3">
              <svg viewBox="0 0 400 80" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3498db" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3498db" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,65 L30,55 L60,60 L90,35 L120,45 L150,20 L180,30 L210,15 L240,25 L270,8 L300,18 L330,5 L360,12 L400,2 L400,80 L0,80 Z" fill="url(#chartFill)" />
                <path d="M0,65 L30,55 L60,60 L90,35 L120,45 L150,20 L180,30 L210,15 L240,25 L270,8 L300,18 L330,5 L360,12 L400,2" fill="none" stroke="#3498db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="330" cy="5" r="4" fill="white" stroke="#3498db" strokeWidth="2" />
              </svg>
            </div>

            {/* Mini Table */}
            <div className="rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden">
              <div className="grid grid-cols-4 gap-0 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/30 px-3 py-2 border-b border-slate-100 dark:border-white/5">
                <span>Licitacion</span>
                <span>Sector</span>
                <span className="text-right">Monto</span>
                <span className="text-right">Score</span>
              </div>
              {[
                { name: 'Portal E-Learning', sector: 'Educacion', amount: '$45M', score: 96 },
                { name: 'Sistema Gestion', sector: 'TI', amount: '$28M', score: 89 },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-4 gap-0 text-[10px] text-slate-600 dark:text-slate-300 px-3 py-2.5 border-b border-slate-50 dark:border-white/[0.03] last:border-0 font-medium">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{row.name}</span>
                  <span>{row.sector}</span>
                  <span className="text-right font-mono">{row.amount}</span>
                  <span className="text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{row.score}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating notification card */}
        <div className="absolute -right-4 top-1/3 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200/50 dark:border-white/[0.06] p-3.5 z-20 [transform:translateZ(60px)] animate-float">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Nueva Coincidencia</p>
              <p className="text-[9px] text-slate-400">Score: 96% - E-Learning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});


// ------------------------------------------------------------------
// Main Landing Page Component
// ------------------------------------------------------------------

export default function LandingPage() {
  redirect('/dashboard');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Stats counter animation
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const faqs = [
    {
      q: 'Es necesario estar inscrito en ChileProveedores para usar la plataforma?',
      a: 'Para usar el buscador y las herramientas de IA de LicitaHub no es obligatorio. Pero para postular legalmente en Mercado Publico si deberas estar inscrito. LicitaHub te ayuda a preparar toda la documentacion y cumplir con los requisitos.',
    },
    {
      q: 'Con que frecuencia se sincronizan los datos de ChileCompra?',
      a: 'Nuestra plataforma se sincroniza automaticamente cada hora con la API de Mercado Publico. El motor descarga nuevas ofertas, actualiza estados y ejecuta inmediatamente el analisis semantico y scoring de IA.',
    },
    {
      q: 'Como calcula la IA el Score de Relevancia?',
      a: 'El Score (0-100) es un indicador hibrido. Un 60% se calcula con reglas duras de tu perfil corporativo (montos, regiones, categorias). El 40% restante usa analisis vectorial semantico, comparando la descripcion tecnica contra tu historial de ofertas.',
    },
    {
      q: 'Que tan seguras estan nuestras propuestas tecnicas?',
      a: 'Implementamos Row Level Security (RLS) en Supabase para aislar tus datos. La conexion con modelos de lenguaje cumple con politicas empresariales: tus propuestas nunca se usan para entrenar modelos publicos.',
    },
    {
      q: 'Se requiere instalar algun software adicional?',
      a: 'No. LicitaHub es una plataforma SaaS completamente basada en la nube. Accedes desde cualquier dispositivo con conexion a internet usando tu navegador.',
    },
  ];

  // Trusted logos marquee
  const logos = [
    'Andes Obras Civiles', 'TecnoChile', 'San Lucas Medica', 'Delta Ingenieria',
    'Surtek Digital', 'Arcadia Consultores', 'NovaTech Solutions', 'Zentral Group',
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0a0f1e] text-slate-100 overflow-hidden font-sans relative">

      {/* ================================================================ */}
      {/* AURORA BACKGROUND                                                 */}
      {/* ================================================================ */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0f1e]" />
        <div className="absolute top-[-15%] right-[-10%] w-[650px] h-[650px] rounded-full bg-blue-600/[0.06] blur-[140px] animate-aurora-1" />
        <div className="absolute top-[25%] left-[-12%] w-[550px] h-[550px] rounded-full bg-cyan-600/[0.04] blur-[130px] animate-aurora-2" />
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-600/[0.04] blur-[150px] animate-aurora-3" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* ================================================================ */}
      {/* NAVIGATION                                                        */}
      {/* ================================================================ */}
      <header className="fixed top-0 w-full z-50 border-b border-white/[0.04] backdrop-blur-xl bg-[#0a0f1e]/70">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400 transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <span className="text-[15px] font-semibold text-white tracking-tight">
                LicitaHub
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-slate-400">
              <a href="#features" className="hover:text-white transition-colors duration-200">Producto</a>
              <Link href="/soluciones" className="hover:text-white transition-colors duration-200">Soluciones</Link>
              <a href="#demo" className="hover:text-white transition-colors duration-200">Demostración</a>
              <a href="#pricing" className="hover:text-white transition-colors duration-200">Precios</a>
              <a href="#faqs" className="hover:text-white transition-colors duration-200">FAQ</a>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard">
              <span className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 group">
                Iniciar sesión
                <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </span>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-xl text-xs px-5 shadow-none transition-all active:scale-[0.97]">
                Comenzar Gratis
              </Button>
            </Link>
            <ThemeToggle />
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-400 hover:bg-white/5 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/5 bg-[#0a0f1e] px-4 pt-2 pb-6 space-y-3 animate-fade-in">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-300 py-2">Producto</a>
            <Link href="/soluciones" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-300 py-2">Soluciones</Link>
            <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-300 py-2">Demostración</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-300 py-2">Precios</a>
            <a href="#faqs" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-300 py-2">FAQ</a>
            <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-slate-300">Iniciar sesión</Button>
              </Link>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-accent-500 hover:bg-accent-600">Comenzar Gratis</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ================================================================ */}
      {/* HERO — Asymmetric Split (60/40)                                  */}
      {/* ================================================================ */}
      <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 z-10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left content — 7 cols */}
            <div className="lg:col-span-7 space-y-7 pr-0 lg:pr-12 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-accent-500/8 border border-accent-500/15 rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-accent-400">
                <Sparkles className="h-3 w-3" />
                Pensado para ProgramBi.com
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[58px] font-semibold tracking-tighter leading-[1.08] text-white">
                La infraestructura que necesitas para ganar licitaciones publicas
              </h1>

              <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-[58ch] font-normal">
                Encuentra licitaciones del Estado relevantes para tu empresa de cursos de programacion. Automatiza propuestas tecnicas con IA y multiplica tu tasa de adjudicacion.
              </p>

              {/* CTA Input */}
              <form onSubmit={(e) => { e.preventDefault(); window.location.href = '/dashboard'; }} className="w-full max-w-md pt-1">
                <div className="relative flex items-center p-1 rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl shadow-glass focus-within:border-accent-500/30 transition-all duration-300">
                  <div className="absolute left-4 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="Tu email corporativo"
                    className="w-full h-11 pl-10 pr-[130px] bg-transparent text-slate-200 text-[13px] font-medium focus:outline-none placeholder:text-slate-600"
                    required
                  />
                  <button
                    type="submit"
                    className="absolute right-1 h-9 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-[11px] font-semibold px-5 flex items-center gap-1.5 transition-all active:scale-[0.97]"
                  >
                    Comenzar <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-2.5 text-[10.5px] text-slate-600 pl-2">
                  Sin tarjeta. Configuracion en 1 minuto. Cancela cuando quieras.
                </p>
              </form>

              {/* Trust Stats */}
              <div className="flex items-center gap-8 pt-4">
                {[
                  { value: '+204k', label: 'Licitaciones indexadas' },
                  { value: '97.4%', label: 'Ahorro en tiempo' },
                  { value: '3.4x', label: 'Tasa adjudicacion' },
                ].map((stat) => (
                  <div key={stat.label} className="space-y-0.5">
                    <div className="text-lg font-semibold text-white font-mono">{stat.value}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right mockup — 5 cols */}
            <div className="lg:col-span-5 relative animate-scale-in delay-200">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* MARQUEE LOGO BAR                                                 */}
      {/* ================================================================ */}
      <section className="relative z-10 border-y border-white/[0.04] py-6 overflow-hidden bg-white/[0.01]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4 text-center">
            Con la confianza de empresas y proveedores
          </p>
        </div>
        <div className="relative w-full overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...logos, ...logos].map((logo, idx) => (
              <span key={idx} className="mx-8 text-[13px] font-semibold text-slate-600 tracking-tight shrink-0">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FEATURES — Bento Grid (Asymmetric, Gallery Style)                */}
      {/* ================================================================ */}
      <section id="features" className="py-28 relative z-10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 space-y-20">

          {/* Section Header — Left aligned */}
          <div className="space-y-4 max-w-2xl">
            <Badge className="bg-accent-500/10 text-accent-400 border-accent-500/15 hover:bg-accent-500/15 text-[10px] font-bold uppercase tracking-wider">
              Producto
            </Badge>
            <h2 className="text-3xl md:text-[42px] font-semibold tracking-tighter text-white leading-tight">
              Todo lo que necesitas para competir en Mercado Publico
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[55ch]">
              Herramientas avanzadas de Inteligencia Artificial que entregan una ventaja competitiva cuantificable en licitaciones del Estado de Chile.
            </p>
          </div>

          {/* Bento Row 1: 2fr 1fr (Asymmetric) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Card 1: Vector Search — Wide (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <SpotlightCard>
                <TypewriterSearch />
                <div className="mt-5 relative h-52 w-full bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden p-4">
                  {/* Coordinate Grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-200/30 dark:bg-white/5" />
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-200/30 dark:bg-white/5" />

                  {/* Cluster Labels */}
                  <div className="absolute top-4 left-4 text-[9px] font-bold text-accent-500 bg-accent-500/8 px-2 py-0.5 rounded-lg border border-accent-500/15">
                    Educacion
                  </div>
                  <div className="absolute top-4 right-4 text-[9px] font-bold text-emerald-500 bg-emerald-500/8 px-2 py-0.5 rounded-lg border border-emerald-500/15">
                    Tecnologia
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-500 bg-amber-500/8 px-2 py-0.5 rounded-lg border border-amber-500/15">
                    Construccion
                  </div>

                  {/* Animated dots */}
                  {[
                    { x: '22%', y: '28%', color: '#3498db', delay: '0s' },
                    { x: '30%', y: '35%', color: '#3498db', delay: '0.5s' },
                    { x: '75%', y: '25%', color: '#22c55e', delay: '1s' },
                    { x: '70%', y: '32%', color: '#22c55e', delay: '1.5s' },
                    { x: '48%', y: '72%', color: '#f59e0b', delay: '2s' },
                    { x: '55%', y: '68%', color: '#f59e0b', delay: '0.8s' },
                  ].map((dot, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full animate-float"
                      style={{
                        left: dot.x,
                        top: dot.y,
                        backgroundColor: dot.color,
                        opacity: 0.7,
                        animationDelay: dot.delay,
                      }}
                    />
                  ))}

                  {/* Main search node */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-accent-500 rounded-full animate-status-breathe">
                    <span className="absolute inset-0 rounded-full bg-accent-500/40 animate-ping" />
                  </div>
                </div>
              </SpotlightCard>
              <div className="px-2 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Busqueda Vectorial Semantica</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  Comprende la intencion de los pliegos de bases. Escribe busquedas en lenguaje natural y encuentra oportunidades por significado y contexto.
                </p>
              </div>
            </div>

            {/* Card 2: Score — Narrow (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <SpotlightCard className="h-full flex flex-col justify-center">
                <ScoreRingCycler />
              </SpotlightCard>
              <div className="px-2 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scoring Hibrido IA</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Prioriza oportunidades al instante. Combina reglas de negocio con analisis semantico vectorial adaptado a tu empresa.
                </p>
              </div>
            </div>
          </div>

          {/* Bento Row 2: 1fr 2fr (Inverted) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Card 3: Terminal Copilot — Narrow (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <SpotlightCard className="p-0 overflow-hidden h-[360px]">
                <TerminalCopilot />
              </SpotlightCard>
              <div className="px-2 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Copiloto de Propuestas</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Genera borradores tecnicos adaptados a cada licitacion en minutos. Checklists automaticos de pliegos de bases.
                </p>
              </div>
            </div>

            {/* Card 4+5: Split (7 cols with internal grid) */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Card 4: Dynamic Island Alerts */}
              <div className="flex flex-col gap-5">
                <SpotlightCard className="h-[360px] flex flex-col justify-center p-0">
                  <AlertPill />
                </SpotlightCard>
                <div className="px-2 space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alertas Inteligentes</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Notificaciones instantaneas de licitaciones de alto match directamente en tu panel.
                  </p>
                </div>
              </div>

              {/* Card 5: Price Optimizer */}
              <div className="flex flex-col gap-5">
                <SpotlightCard className="h-[360px] flex flex-col justify-center">
                  <PriceAnalyzer />
                </SpotlightCard>
                <div className="px-2 space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Optimizacion de Bidding</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Analiza precios historicos y sugiere el margen con mayor probabilidad de adjudicacion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* HOW IT WORKS — Horizontal Steps                                  */}
      {/* ================================================================ */}
      <section className="py-28 relative z-10 border-y border-white/[0.04]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="space-y-4 max-w-2xl">
            <Badge className="bg-accent-500/10 text-accent-400 border-accent-500/15 text-[10px] font-bold uppercase tracking-wider">
              Como funciona
            </Badge>
            <h2 className="text-3xl md:text-[42px] font-semibold tracking-tighter text-white leading-tight">
              De la busqueda a la adjudicacion en 3 pasos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              {
                step: '01',
                icon: <Target className="h-5 w-5" />,
                title: 'Configura tu perfil',
                desc: 'Define tu rubro, regiones de interes, montos y palabras clave. La IA aprende de tu empresa y calibra el scoring automaticamente.',
              },
              {
                step: '02',
                icon: <Radar className="h-5 w-5" />,
                title: 'Monitoreo continuo',
                desc: 'El motor se sincroniza cada hora con Mercado Publico. Recibe alertas inmediatas cuando aparecen licitaciones de alto match para ProgramBi.',
              },
              {
                step: '03',
                icon: <FileText className="h-5 w-5" />,
                title: 'Propuesta con IA',
                desc: 'El copiloto genera borradores tecnicos adaptados, checklists y estimaciones de precio. Solo revisas, ajustas y postulas.',
              },
            ].map((item, idx) => (
              <div key={idx} className="relative p-8 md:p-10 border-l border-white/[0.06] first:border-l-0 group">
                {/* Step Number */}
                <span className="text-[64px] font-bold text-white/[0.03] absolute top-4 right-6 font-mono leading-none select-none">
                  {item.step}
                </span>

                <div className="relative space-y-4">
                  <div className="h-11 w-11 rounded-2xl bg-accent-500/8 border border-accent-500/10 flex items-center justify-center text-accent-400 transition-transform duration-300 group-hover:scale-105">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[35ch]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* AI DEMO — Interactive Chat                                        */}
      {/* ================================================================ */}
      <section id="demo" className="py-28 relative z-10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left Text — 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            <Badge className="bg-accent-500/10 text-accent-400 border-accent-500/15 text-[10px] font-bold uppercase tracking-wider">
              Asistente Inteligente
            </Badge>
            <h2 className="text-3xl md:text-[42px] font-semibold tracking-tighter text-white leading-tight">
              Preguntale a la IA sobre cualquier pliego de bases
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[50ch]">
              Las bases tecnicas tienen cientos de paginas? No pierdas horas de lectura. El asistente analiza el documento completo y entrega respuestas precisas al instante.
            </p>

            <div className="flex flex-col gap-3 pt-2 text-[13px] text-slate-400">
              {[
                'Extraccion inmediata de multas y plazos contractuales',
                'Formatos y montos de garantias financieras',
                'Deteccion automatica de criterios de evaluacion',
                'Resumen ejecutivo de pliegos en 30 segundos',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-accent-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Chat — 7 cols */}
          <div className="lg:col-span-7">
            <AIChatDemo />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* PRICING                                                           */}
      {/* ================================================================ */}
      <section id="pricing" className="py-28 relative z-10 border-y border-white/[0.04]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="space-y-4 max-w-2xl">
            <Badge className="bg-accent-500/10 text-accent-400 border-accent-500/15 text-[10px] font-bold uppercase tracking-wider">
              Precios
            </Badge>
            <h2 className="text-3xl md:text-[42px] font-semibold tracking-tighter text-white leading-tight">
              Planes adaptados a cada etapa de tu empresa
            </h2>

            {/* Toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-2xl border border-white/5 bg-white/[0.03] mt-2">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={`text-xs font-semibold px-5 py-2 rounded-xl transition-all active:scale-[0.97] ${billingPeriod === 'monthly' ? 'bg-accent-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('yearly')}
                className={`text-xs font-semibold px-5 py-2 rounded-xl transition-all active:scale-[0.97] ${billingPeriod === 'yearly' ? 'bg-accent-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Anual (Ahorra 20%)
              </button>
            </div>
          </div>

          {/* Pricing Grid: 5-7 cols split */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">

            {/* Free */}
            <div className="md:col-span-4 rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-8 flex flex-col justify-between transition-all hover:border-white/10">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Plan Inicial</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Para explorar oportunidades basicas.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-semibold text-white font-mono">$0</span>
                  <span className="text-[11px] text-slate-500 ml-1">/ mes</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-400 border-t border-white/5 pt-6">
                  {['Buscador con filtros estandar', 'Guardar hasta 5 licitaciones', 'Score basico de relevancia'].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="h-3.5 w-3.5 text-accent-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {['Analisis de bases con IA', 'Alertas por email'].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-slate-600 line-through">
                      <X className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/dashboard" className="mt-8">
                <Button variant="outline" className="w-full text-xs font-semibold py-5 rounded-xl border-white/10 text-slate-300 hover:bg-white/5 active:scale-[0.98]">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>

            {/* Pro — Highlighted */}
            <div className="md:col-span-4 rounded-[2rem] border-2 border-accent-500/40 bg-accent-500/[0.04] p-8 flex flex-col justify-between relative">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-accent-500/10 border border-accent-500/20 text-accent-400 text-[9px] font-bold uppercase px-3.5 py-1 rounded-full tracking-wider">
                Recomendado
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Plan Profesional</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Para empresas que buscan automatizar su flujo.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-semibold text-white font-mono">
                    {billingPeriod === 'monthly' ? '$79.990' : '$63.990'}
                  </span>
                  <span className="text-[11px] text-slate-500 ml-1">CLP / mes</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-400 border-t border-white/5 pt-6">
                  {[
                    'Busqueda semantica ilimitada',
                    'Scoring Hibrido (reglas + embeddings)',
                    'Copiloto de Propuestas con IA',
                    'Alertas instantaneas (Email + In-app)',
                    'Monitoreo de competidores',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="h-3.5 w-3.5 text-accent-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/dashboard" className="mt-8">
                <Button className="w-full bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold py-5 rounded-xl active:scale-[0.98]">
                  Prueba 14 Dias Gratis
                </Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="md:col-span-4 rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-8 flex flex-col justify-between transition-all hover:border-white/10">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Plan Corporativo</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Para empresas con necesidades avanzadas.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-semibold text-white font-mono">Custom</span>
                  <span className="text-[11px] text-slate-500 ml-1">/ mes</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-400 border-t border-white/5 pt-6">
                  {[
                    'Todo lo del Plan Profesional',
                    'Fine-Tuning de modelos IA',
                    'Integraciones API directas',
                    'Account Manager dedicado',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="h-3.5 w-3.5 text-accent-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a href="mailto:contacto@licitahub.cl" className="mt-8">
                <Button variant="outline" className="w-full text-xs font-semibold py-5 rounded-xl border-white/10 text-slate-300 hover:bg-white/5 active:scale-[0.98]">
                  Contactar Ventas
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TESTIMONIALS                                                      */}
      {/* ================================================================ */}
      <section className="py-28 relative z-10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="space-y-4 max-w-2xl">
            <Badge className="bg-accent-500/10 text-accent-400 border-accent-500/15 text-[10px] font-bold uppercase tracking-wider">
              Testimonios
            </Badge>
            <h2 className="text-3xl md:text-[42px] font-semibold tracking-tighter text-white leading-tight">
              Empresas que confian en LicitaHub
            </h2>
          </div>

          {/* Testimonials — Asymmetric 2-col zigzag */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {[
              {
                quote: 'LicitaHub transformo nuestro departamento de licitaciones. Pasamos de postular a 3 licitaciones mensuales a mas de 12 con el mismo equipo. El retorno fue inmediato.',
                name: 'Valentina Rojas',
                company: 'Andes Obras Publicas',
                initials: 'VR',
                span: 7,
              },
              {
                quote: 'El buscador semantico encuentra oportunidades que antes pasabamos de largo porque el titulo era generico o poco claro en el portal del Estado.',
                name: 'Sebastian Krauss',
                company: 'K-Tech Chile',
                initials: 'SK',
                span: 5,
              },
              {
                quote: 'La seguridad y el aislamiento logico de los datos nos dieron la confianza necesaria. Es nuestra herramienta clave para el equipo de ventas al Estado.',
                name: 'Monica Silva',
                company: 'San Lucas Medica',
                initials: 'MS',
                span: 5,
              },
              {
                quote: 'El copiloto de propuestas nos ahorro semanas de redaccion tecnica. La calidad del primer borrador es impresionante y ya esta alineado con los criterios del pliego.',
                name: 'Diego Fernandez',
                company: 'Surtek Digital',
                initials: 'DF',
                span: 7,
              },
            ].map((t, idx) => (
              <div key={idx} className={`md:col-span-${t.span} rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-8 flex flex-col justify-between transition-all hover:border-white/10`}>
                <div className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[13px] text-slate-400 leading-relaxed font-medium">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3.5 pt-6 border-t border-white/5 mt-6">
                  <div className="h-9 w-9 rounded-full bg-accent-500/8 flex items-center justify-center font-semibold text-accent-400 text-[11px]">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{t.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FAQ                                                               */}
      {/* ================================================================ */}
      <section id="faqs" className="py-28 relative z-10 border-t border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-4">
            <Badge className="bg-accent-500/10 text-accent-400 border-accent-500/15 text-[10px] font-bold uppercase tracking-wider">
              FAQ
            </Badge>
            <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
              Preguntas comunes sobre la plataforma
            </h2>
            <p className="max-w-xl text-sm text-slate-400">
              Resolvemos tus dudas sobre conexion a la API, seguridad de propuestas y la IA.
            </p>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all hover:border-white/10"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left font-medium text-slate-200 hover:text-accent-400 transition-colors cursor-pointer"
                  >
                    <span className="text-[13px] font-semibold pr-4">{faq.q}</span>
                    <span className={`text-accent-400 text-sm shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                      +
                    </span>
                  </button>
                  <div
                    className={`px-6 transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-60 pb-5 opacity-100 border-t border-white/5 pt-4' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                  >
                    <p className="text-[12px] text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FINAL CTA                                                         */}
      {/* ================================================================ */}
      <section className="py-28 relative z-10 border-t border-white/[0.04]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-3xl md:text-[42px] font-semibold tracking-tighter text-white leading-tight">
                Listo para optimizar tu tasa de adjudicacion?
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[50ch]">
                Registrate ahora y comienza a monitorear licitaciones de ChileCompra con inteligencia artificial. Configuracion en 1 minuto.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-12 px-8 text-xs font-semibold bg-accent-500 hover:bg-accent-600 rounded-xl active:scale-[0.97]">
                  Iniciar Prueba Gratuita
                </Button>
              </Link>
              <a href="mailto:soporte@licitahub.cl" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-12 px-8 text-xs font-semibold border-white/10 text-slate-300 hover:bg-white/5 rounded-xl active:scale-[0.97]">
                  Hablar con un Experto
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER                                                            */}
      {/* ================================================================ */}
      <footer className="border-t border-white/[0.04] bg-[#070b18] pt-16 pb-8 relative z-10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12 border-b border-white/5 pb-12">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-base font-semibold text-white tracking-tight">LicitaHub</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[30ch]">
                Plataforma con Inteligencia Artificial para busqueda, analisis y postulacion automatizada a licitaciones de Mercado Publico en Chile.
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest">Producto</h4>
              <ul className="space-y-2.5 text-[11px] text-slate-500">
                <li><a href="#features" className="hover:text-accent-400 transition-colors">Buscador IA</a></li>
                <li><a href="#demo" className="hover:text-accent-400 transition-colors">Asistente de Propuestas</a></li>
                <li><a href="#pricing" className="hover:text-accent-400 transition-colors">Precios y Planes</a></li>
                <li><a href="#" className="hover:text-accent-400 transition-colors">Integraciones</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest">Recursos</h4>
              <ul className="space-y-2.5 text-[11px] text-slate-500">
                <li><a href="#" className="hover:text-accent-400 transition-colors">Blog</a></li>
                <li><a href="#faqs" className="hover:text-accent-400 transition-colors">Preguntas Frecuentes</a></li>
                <li><a href="#" className="hover:text-accent-400 transition-colors">Guia de Mercado Publico</a></li>
                <li><a href="#" className="hover:text-accent-400 transition-colors">Centro de Ayuda</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest">Legal</h4>
              <ul className="space-y-2.5 text-[11px] text-slate-500">
                <li><a href="#" className="hover:text-accent-400 transition-colors">Sobre Nosotros</a></li>
                <li><Link href="/privacidad" className="hover:text-accent-400 transition-colors">Politicas de Privacidad</Link></li>
                <li><a href="#" className="hover:text-accent-400 transition-colors">Terminos y Condiciones</a></li>
                <li><a href="mailto:contacto@licitahub.cl" className="hover:text-accent-400 transition-colors">Contacto</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <p>{new Date().getFullYear()} LicitaHub. Todos los derechos reservados. Desarrollado en Chile.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors"><Globe className="h-4 w-4" /></a>
              <a href="#" className="hover:text-white transition-colors"><MessageSquare className="h-4 w-4" /></a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
