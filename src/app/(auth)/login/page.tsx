'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, LogIn, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<'password' | 'magic'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (method === 'magic') {
      if (email) {
        setMagicLinkSent(true);
      } else {
        setError('Por favor ingresa tu correo electrónico.');
      }
      setIsLoading(false);
      return;
    }

    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store company info in localStorage for client-side access
        localStorage.setItem('licitahub_company', JSON.stringify(data.company));
        localStorage.setItem('licitahub_token', data.token);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-display leading-tight">
          Ingresar a tu cuenta
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Accede al motor inteligente de licitaciones LicitaHub.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500 dark:text-red-400">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {magicLinkSent ? (
        <div className="space-y-4 py-4 text-center animate-in fade-in duration-300">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-inner">
            <Mail className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Enlace de acceso enviado</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 px-4 leading-relaxed font-medium">
              Hemos enviado un enlace mágico de acceso a <strong className="text-slate-900 dark:text-white font-semibold">{email}</strong>. Revisa tu bandeja.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMagicLinkSent(false)}
            className="text-[#1890ff] hover:text-[#007cdb] hover:bg-slate-100/50 dark:hover:bg-white/5 text-xs font-bold"
          >
            Volver a intentar
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3.5">
            {/* Email field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Correo Corporativo
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-[#1890ff] transition-colors duration-200" />
                <Input
                  type="email"
                  placeholder="nombre@empresa.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-11 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 text-sm focus-visible:ring-[#1890ff]/20 focus-visible:border-[#1890ff] transition-all"
                  required
                />
              </div>
            </div>

            {/* Password field (Only if method is password) */}
            {method === 'password' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Contraseña
                  </label>
                  <Link
                    href="#"
                    className="text-[10px] font-bold text-[#1890ff] hover:text-[#007cdb] transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-[#1890ff] transition-colors duration-200" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-11 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 text-sm focus-visible:ring-[#1890ff]/20 focus-visible:border-[#1890ff] transition-all"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Toggle login method */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => setMethod(method === 'password' ? 'magic' : 'password')}
              className="text-xs font-bold text-[#1890ff] hover:text-[#007cdb] transition-colors"
            >
              {method === 'password' ? 'Ingresar con Enlace Mágico' : 'Ingresar con Contraseña'}
            </button>
          </div>

          <Button
            type="submit"
            loading={isLoading}
            className="w-full h-11 bg-[#1890ff] hover:bg-[#007cdb] text-white font-bold shadow-lg shadow-[#1890ff]/25 rounded-xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="h-4.5 w-4.5" />
            {method === 'password' ? 'Iniciar Sesión' : 'Enviar Enlace Mágico'}
          </Button>

          {/* Demo credential badge */}
          <div className="pt-1 text-center">
            <Badge variant="outline" className="text-[10px] py-1 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-semibold">
              Demo Mode: Ingresa cualquier correo para explorar
            </Badge>
          </div>
        </form>
      )}

      {/* Divider */}
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-white/10" />
        </div>
        <span className="relative bg-background dark:bg-slate-900 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          ¿Nuevo en LicitaHub?
        </span>
      </div>

      {/* Register Link */}
      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-1 text-xs font-black text-[#1890ff] hover:text-[#007cdb] transition-colors"
        >
          Crear una cuenta nueva <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
