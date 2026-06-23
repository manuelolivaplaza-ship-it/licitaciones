import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Zap, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Políticas de Privacidad | LicitaHub',
  description: 'Políticas de privacidad y tratamiento de datos de LicitaHub.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Nav Header */}
      <header className="sticky top-0 z-50 border-b border-border-primary bg-background/80 backdrop-blur-xl transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                LicitaHub
              </span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="space-y-4 mb-12 border-b border-border-primary pb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Políticas de Privacidad
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Última actualización: 22 de Mayo de 2026
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-indigo-600 dark:prose-a:text-indigo-400 hover:prose-a:text-indigo-500">
          <h2>1. Introducción</h2>
          <p>
            En LicitaHub ("nosotros", "nuestro" o "la Plataforma"), valoramos y respetamos su privacidad. Esta Política de Privacidad describe cómo recopilamos, usamos, protegemos y compartimos su información personal cuando utiliza nuestro sitio web y los servicios de análisis y postulación a licitaciones de Mercado Público.
          </p>
          <p>
            Al utilizar LicitaHub, usted acepta las prácticas descritas en esta política. Cumplimos rigurosamente con la <strong>Ley N° 19.628 sobre Protección de la Vida Privada de Chile</strong>.
          </p>

          <h2>2. Información que Recopilamos</h2>
          <p>Podemos recopilar los siguientes tipos de información:</p>
          <ul>
            <li><strong>Información de la Cuenta:</strong> Nombre, correo electrónico, número de teléfono, cargo, nombre de la empresa y RUT comercial al momento de registrarse.</li>
            <li><strong>Datos de Licitaciones:</strong> Información técnica, antecedentes y ofertas económicas que usted sube a nuestra plataforma para que el sistema genere las propuestas automáticas.</li>
            <li><strong>Datos Analíticos y de Uso:</strong> Direcciones IP, tipo de navegador, páginas visitadas, interacciones dentro de la app y tiempos de sesión para mejorar la experiencia de usuario.</li>
          </ul>

          <h2>3. Uso de la Información</h2>
          <p>Utilizamos la información recopilada exclusivamente para:</p>
          <ul>
            <li>Proveer, mantener y mejorar nuestros servicios impulsados por Inteligencia Artificial.</li>
            <li>Generar borradores de propuestas técnicas, cartas de presentación y análisis competitivos personalizados para su empresa.</li>
            <li>Procesar pagos y transacciones de suscripción de forma segura.</li>
            <li>Enviar notificaciones y alertas en tiempo real sobre nuevas licitaciones relevantes a su perfil.</li>
          </ul>

          <h2>4. Privacidad e Inteligencia Artificial (IA)</h2>
          <p>
            Nuestras funcionalidades avanzadas de generación de propuestas utilizan modelos de lenguaje de terceros a través de APIs empresariales seguras (OpenRouter). <strong>Garantizamos que:</strong>
          </p>
          <ul>
            <li>Sus borradores técnicos, bases de datos de clientes, antecedentes de empresa y estrategias comerciales <strong>NUNCA se utilizan para entrenar modelos de IA públicos</strong>.</li>
            <li>Los datos procesados por la IA se transmiten de forma encriptada y son descartados por el proveedor del modelo de lenguaje inmediatamente después de procesar su solicitud (política estricta de Zero Data Retention).</li>
          </ul>

          <h2>5. Seguridad de los Datos y Aislamiento</h2>
          <p>
            Implementamos una arquitectura <em>Multi-Tenant</em> robusta utilizando bases de datos gestionadas (Supabase) con políticas estrictas de <strong>Row Level Security (RLS)</strong>. Esto asegura que sus datos estén completamente aislados a nivel físico y lógico, siendo accesibles únicamente por los usuarios autorizados de su propia organización. Adicionalmente, todas las transmisiones de datos están protegidas mediante encriptación TLS/SSL de grado bancario.
          </p>

          <h2>6. Compartir Información</h2>
          <p>
            <strong>No vendemos, alquilamos ni comercializamos su información comercial a terceros bajo ninguna circunstancia.</strong> Solo compartiremos información en los siguientes casos justificados:
          </p>
          <ul>
            <li>Con proveedores de infraestructura en la nube (ej. AWS, Supabase) que nos asisten en la operación técnica de la plataforma, siempre bajo estrictos Acuerdos de Confidencialidad (NDAs).</li>
            <li>Para cumplir con requerimientos legales ineludibles, órdenes judiciales o procesos legales válidos emanados por tribunales en la República de Chile.</li>
          </ul>

          <h2>7. Sus Derechos ARCO</h2>
          <p>
            De acuerdo con la legislación chilena vigente, usted es el dueño de sus datos y tiene el derecho a solicitar el Acceso, Rectificación, Cancelación u Oposición (derechos ARCO) respecto de sus datos personales y comerciales. Puede ejercer estos derechos en cualquier momento enviando un correo electrónico directamente a <strong>legal@licitahub.cl</strong>. Nuestro equipo de soporte responderá a su solicitud en un plazo máximo de 5 días hábiles.
          </p>

          <h2>8. Modificaciones a esta Política</h2>
          <p>
            Nos reservamos el derecho de actualizar o modificar esta Política de Privacidad para reflejar cambios en nuestras prácticas o exigencias legales. Notificaremos cualquier cambio sustancial a través de un aviso destacado en nuestra plataforma o mediante un correo electrónico dirigido a la dirección principal registrada en su cuenta.
          </p>
        </div>
      </main>
      
      {/* Footer minimalista */}
      <footer className="border-t border-border-primary bg-background dark:bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} LicitaHub. Todos los derechos reservados. Desarrollado en Chile.</p>
      </footer>
    </div>
  );
}
