'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { cn, formatDateRelative, formatCLP, formatDate } from '@/lib/utils';
import {
  LayoutDashboard,
  Search,
  Star,
  Bell,
  BarChart3,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  LogOut,
  User,
  Zap,
  Clock,
  RefreshCw,
  Sparkles,
  Loader2,
  Building2,
  ChevronDown,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Notification, Licitacion } from '@/types';

/* ------------------------------------------------------------------ */
/*  Navigation                                                         */
/* ------------------------------------------------------------------ */

const navItems = [
  { label: 'Inicio', icon: LayoutDashboard, path: '/dashboard', description: 'Resumen general' },
  { label: 'Licitaciones', icon: Search, path: '/licitaciones', description: 'Explorar y buscar' },
  { label: 'Favoritas', icon: Star, path: '/favoritas', description: 'Guardadas' },
  { label: 'Alertas', icon: Bell, path: '/alertas', description: 'Notificaciones' },
  { label: 'Estadísticas', icon: BarChart3, path: '/analytics', description: 'Métricas' },
  { label: 'Competencia', icon: Users, path: '/competencia', description: 'Análisis de mercado' },
] as const;

const pageTitles: Record<string, string> = {
  dashboard: 'Inicio',
  licitaciones: 'Licitaciones',
  favoritas: 'Favoritas',
  alertas: 'Alertas',
  analytics: 'Estadísticas',
  competencia: 'Competencia',
  configuracion: 'Configuración',
  licitacion: 'Detalle',
};

/* ------------------------------------------------------------------ */
/*  Notification helpers                                               */
/* ------------------------------------------------------------------ */

function getNotificationIcon(type: string) {
  switch (type) {
    case 'new_match': return Zap;
    case 'deadline': return Clock;
    case 'status_change': return RefreshCw;
    case 'ai_insight': return Sparkles;
    default: return Bell;
  }
}

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('licitahub_company');
      if (stored) setCompany(JSON.parse(stored));
    } catch {}
  }, []);

  const { data: companyData } = useSWR('/api/auth/me', (url) => fetch(url).then(res => res.json()), { revalidateOnFocus: false });

  useEffect(() => {
    if (companyData?.authenticated && companyData?.company) {
      setCompany(companyData.company);
      try {
        localStorage.setItem('licitahub_company', JSON.stringify(companyData.company));
      } catch {}
    }
  }, [companyData]);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Licitacion[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Live background poll alert
  const [activeAlert, setActiveAlert] = useState<any>(null);

  // Poll controls
  const [isPollPaused, setIsPollPaused] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('licitahub_poll_paused') === 'true';
    }
    return false;
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('licitahub_poll_paused', String(isPollPaused));
    }
  }, [isPollPaused]);

  // Keep last sync text updated relative to current time
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const formatLastSync = () => {
    if (!lastSyncTime) return '';
    const diffMs = Date.now() - lastSyncTime.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    
    if (diffSecs < 10) return 'justo ahora';
    if (diffSecs < 60) return `hace ${diffSecs}s`;
    return `hace ${diffMins}m`;
  };

  // Play sound synth
  const playAlertChime = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain1.gain.setValueAtTime(0.04, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);
      
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        gain2.gain.setValueAtTime(0.04, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.4);
      }, 120);
    } catch {}
  }, []);

  useEffect(() => {
    // Request permission on mount
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const pollBackgroundWorker = async () => {
      if (isPollPaused) return;
      try {
        const res = await fetch('/api/sync/smart?poll=true', { method: 'POST' });
        const data = await res.json();
        
        setLastSyncTime(new Date());
        
        if (data.success && data.newMatch) {
          const match = data.newMatch;
          
          // Visual/audio notifications disabled per user request to keep UI silent.
          // Tenders will still be updated on the pages and stored in the notification bell list.
          
          // Insert into notifications list
          const newNotif = {
            id: `notif-${Date.now()}`,
            organizationId: match.companyId,
            type: 'new_match' as any,
            title: match.licitacionNombre,
            message: `Monto: ${match.licitacionMontoEstimado > 0 ? formatCLP(match.licitacionMontoEstimado) : 'Ver bases'} | Publicada: ${formatDate(match.matchedAt)}`,
            read: false,
            licitacionId: match.licitacionCodigo,
            createdAt: new Date().toISOString(),
            priority: 'high' as any,
          };
          
          setNotifications(prev => {
            const updated = [newNotif, ...prev];
            localStorage.setItem('licitahub_notifications', JSON.stringify(updated));
            return updated;
          });
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('licitahub-new-match', { detail: match }));
          }
          
          // Automatically clear active alert after 15 seconds
          setTimeout(() => {
            setActiveAlert(null);
          }, 15000);
        }
      } catch (err) {
        console.warn('Background sync polling failed:', err);
      }
    };

    // Run first sync check after 5 seconds if not paused, then poll every 60 seconds
    let initialTimer: any;
    let intervalId: any;
    
    if (false) { // background polling disabled per user request - manual sync only
      initialTimer = setTimeout(pollBackgroundWorker, 5000);
      intervalId = setInterval(pollBackgroundWorker, 60000);
    }
    
    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [playAlertChime, isPollPaused]);

  useEffect(() => {
    const stored = localStorage.getItem('licitahub_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const hasOldFormat = parsed.some((n: any) =>
          n.title?.includes('Oportunidad') ||
          n.title?.includes('Licitación relevante') ||
          n.message?.includes('altamente relevante') ||
          n.message?.includes('Match') ||
          n.id?.startsWith('notif-0')
        );
        if (!hasOldFormat && parsed.length > 0) {
          setNotifications(parsed);
          return;
        }
      } catch {}
    }
    // Seed empty notifications for clean production startup
    const initialNotifs: any[] = [];
    setNotifications(initialNotifs);
    localStorage.setItem('licitahub_notifications', JSON.stringify(initialNotifs));
  }, []);

  const saveNotifications = (n: Notification[]) => {
    setNotifications(n);
    localStorage.setItem('licitahub_notifications', JSON.stringify(n));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('licitahub_notifications', JSON.stringify(updated));
  };

  useEffect(() => {
    if (notificationsOpen && notifications.some(n => !n.read)) {
      markAllAsRead();
    }
  }, [notificationsOpen, notifications]);

  const handleNotificationClick = (notif: Notification) => {
    saveNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setNotificationsOpen(false);
    router.push(notif.licitacionId ? `/licitacion/${notif.licitacionId}` : '/alertas');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(p => !p); }
      if (e.key === 'Escape') { setSearchOpen(false); setMobileOpen(false); setUserMenuOpen(false); setNotificationsOpen(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/licitaciones/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (res.ok && data.data?.length > 0) { setSearchResults(data.data.slice(0, 5)); }
        else { setSearchResults([]); }
      } catch {
        setSearchResults([]);
      } finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
    else setSearchQuery('');
  }, [searchOpen]);

  const isActive = useCallback((path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  }, [pathname]);

  // Current page title
  const currentPage = pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const pageTitle = pageTitles[currentPage] || currentPage;

  /* ================================================================ */
  /*  SIDEBAR                                                          */
  /* ================================================================ */
  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border h-14',
        collapsed ? 'justify-center px-3' : 'gap-3 px-5',
      )}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-active-border shadow-sm">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-[15px] font-semibold tracking-tight text-text-primary">
            LicitaHub
          </span>
        )}
      </div>

      {/* Search Input Box in Sidebar */}
      <div className="px-2.5 pt-3 pb-1 shrink-0">
        {collapsed ? (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 mx-auto items-center justify-center rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-border-primary/60 text-text-light hover:text-sidebar-active-border hover:bg-sidebar-active-bg hover:border-sidebar-active-border/20 transition-all cursor-pointer shadow-sm"
            title="Buscar licitaciones (⌘K)"
          >
            <Search className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-border-primary/60 hover:border-sidebar-active-border/20 hover:bg-sidebar-active-bg px-3 py-2 text-xs font-normal text-text-light hover:text-text-primary transition-all duration-200 cursor-pointer shadow-sm"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left text-text-light/80 hover:text-text-primary/80 transition-colors">Buscar licitación...</span>
            <kbd className="rounded bg-slate-200/50 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-text-light shrink-0">⌘K</kbd>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-200',
                collapsed && 'justify-center px-2',
                active
                  ? 'font-medium bg-sidebar-active-bg text-sidebar-active-border'
                  : 'font-normal text-text-muted hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-text-primary',
              )}
            >
              <item.icon className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                active ? 'text-sidebar-active-border' : 'text-text-light group-hover:text-text-secondary',
              )} />
              {!collapsed && <span>{item.label}</span>}

              {/* Notification count */}
              {item.path === '/alertas' && unreadCount > 0 && (
                collapsed ? (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                ) : (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-md bg-red-500/10 px-1.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                    {unreadCount}
                  </span>
                )
              )}
            </Link>
          );
        })}
      </nav>
      {/* Bottom section — user + settings + utilities */}
      <div className="border-t border-border-primary/50 px-2.5 py-3.5 space-y-3 relative shrink-0">
        
        {/* Notifications dropup inside sidebar */}
        {notificationsOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
            <div className={cn(
              "absolute z-50 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-border-primary bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-2xl animate-scale-in p-1",
              collapsed ? "left-14 bottom-6" : "left-0 bottom-full mb-2"
            )}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-primary/50 px-4 py-3">
                <span className="text-xs font-semibold text-text-primary">Notificaciones</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-sidebar-active-border hover:opacity-80 font-medium transition-colors cursor-pointer"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[280px] overflow-y-auto divide-y divide-border-primary/45 scrollbar-thin">
                {notifications.length > 0 ? notifications.slice(0, 6).map((notif) => {
                  const Icon = getNotificationIcon(notif.type);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        'flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors',
                        !notif.read && 'bg-sidebar-active-bg/30',
                      )}
                    >
                      <div className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                        notif.read ? 'text-text-light bg-slate-50 dark:bg-slate-900 border-border-primary/60' : 'text-sidebar-active-border bg-sidebar-active-bg border-sidebar-active-border/15',
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className={cn('text-xs truncate', notif.read ? 'text-text-muted font-normal' : 'font-semibold text-text-primary')}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-text-light leading-relaxed line-clamp-1 font-normal">{notif.message}</p>
                        <span className="text-[10px] text-text-light font-medium">{formatDateRelative(notif.createdAt)}</span>
                      </div>
                      {!notif.read && <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sidebar-active-border" />}
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Bell className="h-6 w-6 text-text-light mb-2 animate-bounce" />
                    <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Sin notificaciones</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border-primary/50 p-1.5">
                <Link
                  href="/alertas"
                  onClick={() => setNotificationsOpen(false)}
                  className="flex w-full items-center justify-center py-2 rounded-xl text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all"
                >
                  Ver todas las alertas
                </Link>
              </div>
            </div>
          </>
        )}

        {/* User dropdown list */}
        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
            <div className={cn(
              "absolute z-50 overflow-hidden rounded-2xl border border-border-primary/80 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-2xl animate-scale-in p-1",
              collapsed 
                ? "left-14 bottom-16 w-52" 
                : "left-0 right-0 bottom-full mb-2.5 w-full"
            )}>
              <div className="px-3 py-2.5 border-b border-border-primary/40 shrink-0">
                <p className="text-xs font-semibold text-text-primary truncate">{company?.name || 'ProgramBi'}</p>
                <p className="text-[10px] text-text-light truncate">{company?.email || 'contacto@programbi.com'}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/configuracion"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-slate-50 dark:hover:bg-white/[0.03] hover:text-text-primary transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-text-light" /> Mi perfil
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Collapsed / Expanded widgets */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-2.5 py-2.5 bg-slate-50/40 dark:bg-white/[0.015] border border-border-primary/40 rounded-2xl p-1.5 relative">
            {/* Profile Avatar trigger */}
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0",
                userMenuOpen 
                  ? "bg-sidebar-active-border text-white" 
                  : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
              )}
              title="Mi Cuenta"
            >
              {company?.name ? company.name.substring(0, 2).toUpperCase() : 'PB'}
            </button>

            <div className="w-5 h-[1px] bg-border-primary/30 my-0.5 shrink-0" />

            {/* Notifications Bell */}
            <button
              onClick={() => {
                const nextState = !notificationsOpen;
                setNotificationsOpen(nextState);
                if (nextState) {
                  markAllAsRead();
                }
              }}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl border transition-all cursor-pointer relative shrink-0",
                notificationsOpen
                  ? "bg-sidebar-active-bg border-sidebar-active-border/30 text-sidebar-active-border"
                  : "bg-transparent border-transparent text-text-light hover:text-text-primary hover:bg-slate-100/50 dark:hover:bg-white/[0.03]"
              )}
              title="Notificaciones"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-background" />
              )}
            </button>

            {/* Monitoring Status dot toggle when collapsed */}
            <button
              onClick={() => setIsPollPaused(!isPollPaused)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl border transition-all cursor-pointer relative shrink-0",
                isPollPaused 
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-500 hover:bg-amber-500/20" 
                  : "bg-emerald-500/10 border-emerald-500/25 text-emerald-500 hover:bg-emerald-500/20"
              )}
              title={isPollPaused 
                ? `Actualización Pausada. Haz clic para reanudar. (Última: ${lastSyncTime ? formatLastSync() : 'ninguna'})` 
                : `Actualización Activa. Haz clic para pausar. (Última: ${lastSyncTime ? formatLastSync() : 'justo ahora'})`
              }
            >
              {isPollPaused ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              <span className={cn(
                "absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full",
                isPollPaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
              )} />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle className="h-8 w-8 rounded-xl border-0 bg-transparent hover:bg-slate-100/50 dark:hover:bg-white/[0.03]" />

            {/* Settings */}
            <Link
              href="/configuracion"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200 shrink-0",
                isActive('/configuracion')
                  ? "bg-sidebar-active-bg border-sidebar-active-border/30 text-sidebar-active-border"
                  : "bg-transparent border-transparent text-text-light hover:text-text-primary hover:bg-slate-100/50 dark:hover:bg-white/[0.03]"
              )}
              title="Configuración"
            >
              <Settings className="h-4 w-4" />
            </Link>

            {/* Expand Menu Toggle */}
            <div className="w-5 h-[1px] bg-border-primary/30 my-0.5 shrink-0" />
            <button
              onClick={() => setCollapsed(c => !c)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-text-light hover:text-text-primary hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-all cursor-pointer shrink-0"
              title="Expandir menú"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="bg-slate-50/40 dark:bg-white/[0.015] border border-border-primary/40 rounded-2xl p-2.5 space-y-2.5 animate-fade-in relative">
            {/* User Profile Card */}
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl p-1.5 transition-all duration-200 text-left cursor-pointer",
                userMenuOpen
                  ? "bg-slate-100 dark:bg-white/[0.04]"
                  : "hover:bg-slate-100/50 dark:hover:bg-white/[0.03]"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 text-xs font-semibold text-white dark:text-slate-900 shadow-sm shrink-0">
                {company?.name ? company.name.substring(0, 2).toUpperCase() : 'PB'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">{company?.name || 'ProgramBi'}</p>
                <p className="text-[10px] text-text-light truncate">{company?.email || 'contacto@programbi.com'}</p>
              </div>
              <ChevronDown className={cn('h-3.5 w-3.5 text-text-light transition-transform shrink-0', userMenuOpen && 'rotate-180')} />
            </button>

            {/* Divider */}
            <div className="h-[1px] bg-border-primary/30 shrink-0" />

            {/* Quick action bar */}
            <div className="flex items-center justify-between gap-1 shrink-0">
              {/* Notifications Button */}
              <button
                onClick={() => {
                  const nextState = !notificationsOpen;
                  setNotificationsOpen(nextState);
                  if (nextState) {
                    markAllAsRead();
                  }
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 h-8.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer relative shrink-0",
                  notificationsOpen
                    ? "bg-sidebar-active-bg border-sidebar-active-border/30 text-sidebar-active-border"
                    : "bg-transparent border-transparent text-text-light hover:text-text-primary hover:bg-slate-100/50 dark:hover:bg-white/[0.03]"
                )}
              >
                <Bell className="h-3.5 w-3.5 shrink-0" />
                <span>Alertas</span>
                {unreadCount > 0 ? (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shrink-0">
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              {/* Theme Toggle */}
              <ThemeToggle className="h-8.5 w-8.5 rounded-xl border-0 bg-transparent hover:bg-slate-100/50 dark:hover:bg-white/[0.03] shrink-0" />

              {/* Settings */}
              <Link
                href="/configuracion"
                className={cn(
                  "flex h-8.5 w-8.5 items-center justify-center rounded-xl border transition-all duration-200 shrink-0",
                  isActive('/configuracion')
                    ? "bg-sidebar-active-bg border-sidebar-active-border/30 text-sidebar-active-border"
                    : "bg-transparent border-transparent text-text-light hover:text-text-primary hover:bg-slate-100/50 dark:hover:bg-white/[0.03]"
                )}
                title="Configuración"
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Estado de Monitoreo */}
            <div className="border border-border-primary/50 bg-sidebar-active-bg/30 dark:bg-white/[0.01] rounded-xl p-2.5 space-y-1.5 shrink-0 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-text-light uppercase tracking-wider">Monitoreo ChileCompra</span>
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  isPollPaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                )} />
              </div>
              
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-semibold text-text-primary leading-tight truncate">
                    {isPollPaused ? "Actualización Pausada" : "Escaneo Activo"}
                  </p>
                  <p className="text-[9px] text-text-light mt-0.5 leading-none">
                    {lastSyncTime ? `Sincronizado: ${formatLastSync()}` : "Sincronizando..."}
                  </p>
                </div>
                
                <button
                  onClick={() => setIsPollPaused(!isPollPaused)}
                  className={cn(
                    "p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm",
                    isPollPaused 
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500 hover:bg-emerald-500/20" 
                      : "bg-amber-500/10 border-amber-500/25 text-amber-500 hover:bg-amber-500/20"
                  )}
                  title={isPollPaused ? "Reanudar escaneo en tiempo real" : "Pausar escaneo en tiempo real"}
                >
                  {isPollPaused ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Collapse toggle button */}
            <div className="h-[1px] bg-border-primary/20 shrink-0" />
            <button
              onClick={() => setCollapsed(c => !c)}
              className="w-full flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-[11px] font-normal text-text-light hover:text-text-primary hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-all duration-200 cursor-pointer shrink-0"
            >
              <PanelLeftClose className="h-3.5 w-3.5 shrink-0 text-text-light" />
              <span>Colapsar menú</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-[260px] border-r border-sidebar-border bg-sidebar-bg/95 backdrop-blur-2xl transition-transform duration-300 ease-out lg:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3.5 rounded-md p-1.5 text-text-muted hover:bg-slate-100 dark:hover:bg-white/5 hover:text-text-primary cursor-pointer transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebar}
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden shrink-0 border-r border-sidebar-border bg-sidebar-bg/85 backdrop-blur-2xl transition-all duration-300 ease-out lg:block relative z-30',
        collapsed ? 'w-[60px]' : 'w-[240px]',
      )}>
        {sidebar}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile-only slim header bar */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-primary bg-background/80 px-4 backdrop-blur-xl lg:hidden">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-1.5 text-text-muted hover:bg-slate-100 dark:hover:bg-white/5 hover:text-text-primary lg:hidden cursor-pointer transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile-only page title */}
          <h1 className="text-[13px] font-semibold text-text-primary tracking-tight">
            {pageTitle}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>

      {/* ---- Command palette ---- */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border-primary bg-white dark:bg-slate-950 shadow-elevated overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border-primary px-4 py-3">
              <Search className="h-4 w-4 text-text-light shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar licitaciones..."
                className="w-full bg-transparent border-0 outline-none text-sm text-text-primary placeholder:text-text-light"
              />
              <kbd className="rounded border border-border-primary bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-text-light shrink-0">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[320px] overflow-y-auto">
              {searching ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-sidebar-active-border" />
                  <p className="text-xs text-text-muted">Buscando...</p>
                </div>
              ) : searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  <div className="py-1">
                    <p className="px-4 py-2 text-[10px] font-medium text-text-light uppercase tracking-wide">
                      {searchResults.length} resultados
                    </p>
                    {searchResults.map(lic => (
                      <div
                        key={lic.id}
                        onClick={() => { setSearchOpen(false); router.push(`/licitacion/${lic.id}`); }}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-text-primary truncate">{lic.nombre}</p>
                          <div className="flex items-center gap-2 text-[10px] text-text-light mt-0.5">
                            <span className="font-mono">{lic.codigo}</span>
                            <span>·</span>
                            <span className="truncate">{lic.organismo || 'Comprador público'}</span>
                          </div>
                        </div>
                        <div className="shrink-0 pl-3 text-right">
                          <span className="text-xs font-medium text-sidebar-active-border">{lic.aiScore}%</span>
                          <p className="text-[10px] text-text-light mt-0.5">{lic.montoEstimado > 0 ? formatCLP(lic.montoEstimado) : '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-8 w-8 text-text-light mb-2" />
                    <p className="text-xs text-text-muted">Sin resultados para "{searchQuery}"</p>
                    <p className="text-[10px] text-text-light mt-1">Intenta con otro término</p>
                  </div>
                )
              ) : (
                <div className="px-4 py-4">
                  <p className="text-[10px] font-medium text-text-light uppercase tracking-wide mb-2">Sugerencias</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Soporte TI', 'Suministros Médicos', 'Obras Civiles', 'Consultoría'].map(s => (
                      <button
                        key={s}
                        onClick={() => setSearchQuery(s)}
                        className="px-2.5 py-1 rounded-md text-xs text-text-secondary bg-slate-50 dark:bg-white/[0.03] border border-border-primary hover:border-text-light transition-all cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Island Style Notification Toast Alert */}
      {activeAlert && (
        <div className="fixed top-6 right-6 z-[9999] w-[420px] rounded-3xl border border-emerald-500/25 bg-slate-900/95 dark:bg-slate-950/98 backdrop-blur-2xl p-5 shadow-2xl shadow-emerald-500/10 animate-fade-in-up flex flex-col gap-4 ring-1 ring-emerald-500/30 transition-all duration-300 text-left">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Oportunidad Detectada</span>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/15 px-2 py-0.5 rounded-lg text-emerald-400 border border-emerald-500/20 shrink-0">
                  {activeAlert.aiScore}% Match
                </span>
              </div>
              <p className="text-xs font-semibold text-white leading-normal line-clamp-2">
                {activeAlert.licitacionNombre}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                <span>Para: {activeAlert.companyName}</span>
                <span>•</span>
                <span className="font-mono">{activeAlert.licitacionCodigo}</span>
              </div>
            </div>
          </div>

          {/* Rich Metadata Section */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/5 text-[11px]">
            {activeAlert.licitacionOrganismo && (
              <div className="col-span-2 flex items-start gap-1.5 text-slate-350">
                <Building2 className="h-3.5 w-3.5 text-sidebar-active-border shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-450 uppercase block font-semibold">Organismo Comprador</span>
                  <span className="font-bold truncate block text-white">{activeAlert.licitacionOrganismo}</span>
                </div>
              </div>
            )}

            {activeAlert.licitacionMontoEstimado > 0 && (
              <div className="flex items-start gap-1.5 text-slate-350">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] text-slate-450 uppercase block font-semibold">Monto Estimado</span>
                  <span className="font-bold block text-white">{formatCLP(activeAlert.licitacionMontoEstimado)}</span>
                </div>
              </div>
            )}

            {activeAlert.licitacionRegion && (
              <div className="flex items-start gap-1.5 text-slate-350">
                <MapPin className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-450 uppercase block font-semibold">Región / Lugar</span>
                  <span className="font-bold block truncate text-white">{activeAlert.licitacionRegion}</span>
                </div>
              </div>
            )}

            {(activeAlert.compradorContacto || activeAlert.compradorEmail || activeAlert.compradorFono) && (
              <div className="col-span-2 pt-2 border-t border-white/[0.03] space-y-1.5">
                <span className="text-[9px] text-slate-450 uppercase block font-semibold">Contacto de Compras</span>
                <div className="flex flex-col gap-1 text-[10px]">
                  {activeAlert.compradorContacto && (
                    <div className="text-slate-200 font-bold">
                      {activeAlert.compradorContacto}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 font-medium">
                    {activeAlert.compradorEmail && (
                      <a
                        href={`mailto:${activeAlert.compradorEmail}`}
                        className="flex items-center gap-1 hover:text-sidebar-active-border hover:underline cursor-pointer"
                        title="Enviar correo"
                      >
                        <Mail className="h-3 w-3 text-sidebar-active-border" />
                        {activeAlert.compradorEmail}
                      </a>
                    )}
                    {activeAlert.compradorFono && (
                      <a
                        href={`tel:${activeAlert.compradorFono}`}
                        className="flex items-center gap-1 hover:text-sidebar-active-border hover:underline cursor-pointer"
                        title="Llamar"
                      >
                        <Phone className="h-3 w-3 text-emerald-400" />
                        {activeAlert.compradorFono}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/licitacion/${activeAlert.licitacionCodigo}`}
              onClick={() => setActiveAlert(null)}
              className="text-[10px] font-bold text-sidebar-active-border hover:opacity-85 uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
            >
              Ver Ficha Licitación <ArrowRight className="h-3 w-3" />
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveAlert(null)}
                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer"
              >
                Ignorar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
