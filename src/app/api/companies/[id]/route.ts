import { NextRequest, NextResponse } from 'next/server';
import { getSession, getCompanyById, saveCompany } from '@/lib/store';
import type { CompanyProfile } from '@/types/company';

export const dynamic = 'force-dynamic';

/**
 * GET /api/companies/[id]
 * Returns the company profile (safely).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify session - allow default company access in single-user mode to prevent boot/loading locks
    const token = req.cookies.get('licitahub_session')?.value;
    let authorized = false;
    
    if (token) {
      const session = getSession(token);
      if (session && session.companyId === id) {
        authorized = true;
      }
    } else if (id === 'programbi-id' || id === 'contacto@programbi.com') {
      authorized = true;
    }

    if (!authorized) {
      return NextResponse.json({ error: 'No autorizado o acceso prohibido' }, { status: 403 });
    }

    const company = getCompanyById(id);
    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Return company profile WITHOUT passwordHash
    const { passwordHash, ...safeCompany } = company;

    return NextResponse.json({
      success: true,
      company: safeCompany,
    });
  } catch (error: any) {
    console.error('Company GET API error:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo perfil' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/companies/[id]
 * Updates the company profile.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify session - allow default company access in single-user mode to prevent boot/loading locks
    const token = req.cookies.get('licitahub_session')?.value;
    let authorized = false;
    
    if (token) {
      const session = getSession(token);
      if (session && session.companyId === id) {
        authorized = true;
      }
    } else if (id === 'programbi-id' || id === 'contacto@programbi.com') {
      authorized = true;
    }

    if (!authorized) {
      return NextResponse.json({ error: 'No autorizado o acceso prohibido' }, { status: 403 });
    }

    const existingCompany = getCompanyById(id);
    if (!existingCompany) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const body = await req.json();

    // Merge allowed fields to update
    const updatedCompany: CompanyProfile = {
      ...existingCompany,
      name: body.name || existingCompany.name,
      rut: body.rut || existingCompany.rut,
      contactName: body.contactName || existingCompany.contactName,
      phone: body.phone || existingCompany.phone,
      
      // Business profile
      industry: body.industry || existingCompany.industry,
      industryCode: body.industryCode || existingCompany.industryCode,
      subCategories: body.subCategories || existingCompany.subCategories,
      description: body.description || existingCompany.description,
      specializations: body.specializations || existingCompany.specializations,
      productsServices: body.productsServices || existingCompany.productsServices,
      
      // Capabilities
      certifications: body.certifications || existingCompany.certifications,
      yearsExperience: typeof body.yearsExperience === 'number' ? body.yearsExperience : existingCompany.yearsExperience,
      employeeCount: body.employeeCount || existingCompany.employeeCount,
      annualRevenue: body.annualRevenue || existingCompany.annualRevenue,
      previousPublicContracts: typeof body.previousPublicContracts === 'number' ? body.previousPublicContracts : existingCompany.previousPublicContracts,
      experienceLevel: body.experienceLevel || existingCompany.experienceLevel,
      maxContractCapacity: typeof body.maxContractCapacity === 'number' ? body.maxContractCapacity : existingCompany.maxContractCapacity,
      
      // Search preferences
      keywords: body.keywords || existingCompany.keywords,
      excludeKeywords: body.excludeKeywords || existingCompany.excludeKeywords,
      regions: body.regions || existingCompany.regions,
      montoMin: typeof body.montoMin === 'number' ? body.montoMin : existingCompany.montoMin,
      montoMax: typeof body.montoMax === 'number' ? body.montoMax : existingCompany.montoMax,
      tiposLicitacion: body.tiposLicitacion || existingCompany.tiposLicitacion,
      
      // Alert config
      alertFrequency: body.alertFrequency || existingCompany.alertFrequency,
      alertMinScore: typeof body.alertMinScore === 'number' ? body.alertMinScore : existingCompany.alertMinScore,
      
      updatedAt: new Date().toISOString(),
    };

    // Save company
    const saved = saveCompany(updatedCompany);

    // Return safely without passwordHash
    const { passwordHash, ...safeSaved } = saved;

    return NextResponse.json({
      success: true,
      company: safeSaved,
    });
  } catch (error: any) {
    console.error('Company PUT API error:', error);
    return NextResponse.json(
      { error: error.message || 'Error actualizando perfil' },
      { status: 500 }
    );
  }
}
