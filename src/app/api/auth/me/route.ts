import { NextRequest, NextResponse } from 'next/server';
import { getSession, getCompanyById, getCompanies, createSession } from '@/lib/store';
import type { CompanyProfile } from '@/types/company';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Returns the current authenticated user/company from session cookie.
 * Seeds ProgramBi and log them in automatically in local mode.
 */
export async function GET(req: NextRequest) {
  try {
    let token = req.cookies.get('licitahub_session')?.value;
    let company: CompanyProfile | null = null;

    if (token) {
      const session = getSession(token);
      if (session) {
        company = getCompanyById(session.companyId);
      }
    }

    const isLocalMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder-project.supabase.co' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!company && isLocalMode) {
      const companies = getCompanies();
      const programbi = companies.find(c => c.id === 'programbi-id' || c.email === 'contacto@programbi.com');
      
      company = programbi || null;
      
      if (company) {
        const newSession = createSession(company);
        const { passwordHash, ...safeCompany } = company;
        
        const response = NextResponse.json({
          authenticated: true,
          company: safeCompany,
        });

        response.cookies.set('licitahub_session', newSession.token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        });

        return response;
      }
    }

    if (!company) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { passwordHash, ...safeCompany } = company;

    return NextResponse.json({
      authenticated: true,
      company: safeCompany,
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}
