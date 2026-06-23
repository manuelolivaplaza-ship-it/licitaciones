import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Redirigir el inicio (Landing), login y register al dashboard directamente
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Refrescar sesión de Supabase si está configurado en producción
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || url === 'https://placeholder-project.supabase.co';

  if (!isPlaceholder) {
    return await updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
