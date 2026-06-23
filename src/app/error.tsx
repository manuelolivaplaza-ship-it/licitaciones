'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service like Sentry
    console.error('Licitahub Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0b] p-4 text-foreground selection:bg-[#1890ff]/30">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl rounded-3xl p-8 text-center overflow-hidden animate-fade-in">
        {/* Glow effect */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-6 shadow-sm border border-red-500/20">
            <AlertTriangle className="h-8 w-8" />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
            Algo no salió como esperábamos
          </h1>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Ha ocurrido un error inesperado al procesar tu solicitud. Nuestro equipo técnico ha sido notificado y estamos trabajando en ello.
            <br className="mb-2" />
            <span className="font-mono text-[10px] bg-slate-100 dark:bg-black/30 px-2 py-1 rounded text-slate-400 block mt-3 overflow-hidden text-ellipsis whitespace-nowrap">
              {error.message || 'Error desconocido del sistema'}
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <Button 
              onClick={() => reset()} 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1890ff] hover:bg-[#0958d9] text-white shadow-lg shadow-[#1890ff]/20"
            >
              <RefreshCw className="h-4 w-4" /> Intentar de nuevo
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5">
                <LayoutDashboard className="h-4 w-4 text-slate-500" /> Volver al Inicio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
