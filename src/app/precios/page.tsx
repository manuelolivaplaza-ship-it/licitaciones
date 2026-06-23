import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Zap, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Planes y Precios | LicitaHub',
  description: 'Conoce los planes de LicitaHub y elige el que mejor se adapte a tu empresa.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      
      {/* Background Gradient */}
      <div className="absolute top-0 inset-x-0 h-[500px] overflow-hidden -z-10 pointer-events-none origin-top-left -skew-y-3">
        <div className="absolute inset-0 bg-[#1890ff]/10 dark:bg-[#1890ff]/5"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-primary/50 bg-background/80 backdrop-blur-xl transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#1890ff] to-violet-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                licitahub
              </span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Pricing Header */}
      <section className="pt-24 pb-16 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
          Precios simples y transparentes
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Comienza gratis y escala a medida que ganas más licitaciones. Sin contratos forzosos.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-4">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Plan Starter */}
          <Card className="border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col">
            <CardContent className="p-8 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Starter</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Para empresas que recién comienzan en Mercado Público.</p>
              <div className="mb-6">
                <span className="text-5xl font-black text-slate-900 dark:text-white">$0</span>
                <span className="text-slate-500"> / mes</span>
              </div>
              <Button className="w-full h-12 rounded-full mb-8 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold">
                Comenzar gratis
              </Button>
              <ul className="space-y-4 flex-1">
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  Búsqueda básica de licitaciones
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  2 alertas por correo
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  Análisis manual de bases
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Plan Pro */}
          <Card className="border-2 border-[#1890ff] bg-white dark:bg-slate-900 shadow-2xl shadow-[#1890ff]/20 relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-[#1890ff]"></div>
            <div className="absolute -top-4 right-8 bg-[#1890ff] text-white text-xs font-bold px-3 py-1 rounded-full">
              Más Popular
            </div>
            <CardContent className="p-8 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pro IA</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Automatización total para empresas que licitan activamente.</p>
              <div className="mb-6">
                <span className="text-5xl font-black text-slate-900 dark:text-white">$99</span>
                <span className="text-slate-500"> / mes</span>
              </div>
              <Button className="w-full h-12 rounded-full mb-8 bg-[#1890ff] hover:bg-[#1890ff]/90 text-white font-bold shadow-lg shadow-[#1890ff]/25">
                Probar 14 días gratis
              </Button>
              <ul className="space-y-4 flex-1">
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-[#1890ff] shrink-0" />
                  <strong>Análisis Semántico con IA ilimitado</strong>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-[#1890ff] shrink-0" />
                  Generación automática de propuestas técnicas
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-[#1890ff] shrink-0" />
                  Alertas inteligentes en tiempo real
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-[#1890ff] shrink-0" />
                  Análisis competitivo y scoring de relevancia
                </li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </section>
      
      {/* Footer minimalista */}
      <footer className="border-t border-border-primary bg-background dark:bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} LicitaHub. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
