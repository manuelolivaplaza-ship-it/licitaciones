import { NextRequest, NextResponse } from 'next/server';
import { getCompanyByEmail, verifyPassword, createSession } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/login
 * Authenticates a user by email/password and creates a session.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Find company by email
    const company = getCompanyByEmail(email);
    if (!company) {
      return NextResponse.json(
        { error: 'No existe una cuenta con este email' },
        { status: 401 }
      );
    }

    // Verify password
    if (!verifyPassword(password, company.passwordHash)) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Create session
    const session = createSession(company);

    const response = NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        contactName: company.contactName,
        industry: company.industry,
      },
      token: session.token,
    });

    response.cookies.set('licitahub_session', session.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
