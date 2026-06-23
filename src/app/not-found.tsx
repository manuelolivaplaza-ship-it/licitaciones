import Link from 'next/link';
import { Search, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0b] p-4 text-foreground">
      <div className="relative w-full max-w-lg text-center flex flex-col items-center animate-fade-in">
        
        {/* Abstract 404 Visual */}
        <div className="relative flex justify-center items-center mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1890ff]/20 to-violet-500/20 blur-[100px] rounded-full" />
          <h1 className="text-[150px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-400 dark:from-slate-800 dark:to-slate-900 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-3xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl flex items-center justify-center rotate-12 transition-transform hover:rotate-0 duration-500">
              <Search className="h-10 w-10 text-[#1890ff] dark:text-[#00f2fe]" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
          Página no encontrada
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 text-sm sm:text-base leading-relaxed">
          La licitación, documento o sección que estás buscando no existe, ha sido movida, o no tienes los permisos para accederla.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-8">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full h-11 px-8 rounded-xl bg-[#1890ff] hover:bg-[#0958d9] text-white shadow-lg shadow-[#1890ff]/20 transition-all font-semibold flex items-center justify-center gap-2">
              <LayoutDashboard className="h-4 w-4" /> Ir al Dashboard
            </Button>
          </Link>
          <Link href="/licitaciones" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full h-11 px-8 rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 transition-all font-medium flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Buscar Licitaciones
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
