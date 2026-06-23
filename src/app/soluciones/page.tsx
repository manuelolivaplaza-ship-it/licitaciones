import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Zap, ArrowLeft, Building, Users, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Soluciones | LicitaHub',
  description: 'Descubre cómo LicitaHub ayuda a las empresas a multiplicar sus ventas en Mercado Público.',
};

export default function SolutionsPage() {
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

      {/* Header Content */}
      <section className="pt-24 pb-16 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
          Soluciones a tu medida
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          No importa tu industria o tamaño, la inteligencia artificial de LicitaHub se adapta a los requerimientos de tu negocio B2B.
        </p>
      </section>

      {/* Solutions Cards */}
      <section className="pb-24 px-4">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <Card className="border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#1890ff]">
                <Building className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Para PYMEs</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Nivela el campo de juego. Compite contra empresas grandes encontrando oportunidades ocultas que se ajustan exactamente a tu capacidad técnica y financiera gracias al buscador semántico.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Para Equipos Comerciales</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Acelera el proceso de formulación de propuestas. Genera anexos, declaraciones y propuestas técnicas en minutos utilizando modelos de lenguaje adaptados a tus casos de éxito anteriores.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Para Corporativos</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Mantén una vigilancia competitiva total sobre el Mercado Público. Recibe alertas instantáneas de renovaciones de contratos y monitorea las adjudicaciones de tus competidores en tiempo real.
              </p>
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
