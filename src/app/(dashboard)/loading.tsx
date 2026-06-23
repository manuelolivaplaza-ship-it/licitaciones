import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="w-full h-full min-h-[70vh] flex flex-col items-center justify-center animate-fade-in space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-[#1890ff] dark:border-[#00f2fe] animate-spin h-12 w-12" />
        {/* Inner static shape or slower ring */}
        <div className="rounded-full border-2 border-slate-200 dark:border-white/10 h-12 w-12" />
        <Loader2 className="absolute h-5 w-5 text-[#1890ff] dark:text-[#00f2fe] animate-pulse" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Cargando entorno...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Preparando tu espacio de trabajo inteligente
        </p>
      </div>
    </div>
  );
}
