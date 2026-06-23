import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || url === 'https://placeholder-project.supabase.co';

  // If in mock/demo mode (placeholder), allow all requests
  if (isPlaceholder) {
    return NextResponse.next();
  }

  // Update session first
  const response = await updateSession(request);

  // Check auth user
  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isDashboardPage = 
      pathname.startsWith('/dashboard') || 
      pathname.startsWith('/licitaciones') || 
      pathname.startsWith('/licitacion/') || 
      pathname.startsWith('/favoritas') || 
      pathname.startsWith('/alertas') || 
      pathname.startsWith('/analytics') || 
      pathname.startsWith('/competencia') || 
      pathname.startsWith('/configuracion');

    if (isDashboardPage && !user) {
      // Redirect to login
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }

    if (isAuthPage && user) {
      // Redirect to dashboard home
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
  } catch (e) {
    console.error('Proxy auth check error:', e);
  }

  return response;
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
