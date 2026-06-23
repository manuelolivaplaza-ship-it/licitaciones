import { NextRequest, NextResponse } from 'next/server';
import {
  saveCompany,
  getCompanyByEmail,
  hashPassword,
  createSession,
} from '@/lib/store';
import type { CompanyProfile } from '@/types/company';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * Registers a new company and creates a session.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.email || !body.password || !body.companyName) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre de empresa son requeridos' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = getCompanyByEmail(body.email);
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email' },
        { status: 409 }
      );
    }

    // Build the full company profile
    const company: CompanyProfile = {
      id: crypto.randomUUID(),

      // Basic data (Step 1 + 2)
      name: body.companyName,
      rut: body.rut || '',
      email: body.email,
      contactName: body.contactName || '',
      phone: body.phone || '',
      passwordHash: hashPassword(body.password),

      // Business profile (Step 3)
      industry: body.industry || '',
      industryCode: body.industryCode || '',
      subCategories: body.subCategories || [],
      description: body.description || '',
      specializations: body.specializations || [],
      productsServices: body.productsServices || [],

      // Capabilities (Step 4)
      certifications: body.certifications || [],
      yearsExperience: body.yearsExperience || 0,
      employeeCount: body.employeeCount || '1-10',
      annualRevenue: body.annualRevenue || 'bajo_100m',
      previousPublicContracts: body.previousPublicContracts || 0,
      experienceLevel: body.experienceLevel || 'sin_experiencia',
      maxContractCapacity: body.maxContractCapacity || 0,

      // Search preferences (Step 5)
      keywords: body.keywords || [],
      excludeKeywords: body.excludeKeywords || [],
      regions: body.regions || [],
      montoMin: body.montoMin || 0,
      montoMax: body.montoMax || 0,
      tiposLicitacion: body.tiposLicitacion || [],

      // Alert config
      alertFrequency: body.alertFrequency || 'daily',
      alertMinScore: body.alertMinScore || 60,

      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Save company
    const saved = saveCompany(company);

    // Create session
    const session = createSession(saved);

    // Build response with session cookie
    const response = NextResponse.json({
      success: true,
      company: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        contactName: saved.contactName,
        industry: saved.industry,
      },
      token: session.token,
    });

    // Set session cookie
    response.cookies.set('licitahub_session', session.token, {
      httpOnly: true,
      secure: false, // dev mode
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al registrar' },
      { status: 500 }
    );
  }
}
