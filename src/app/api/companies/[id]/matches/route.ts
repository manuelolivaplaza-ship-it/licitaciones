import { NextRequest, NextResponse } from 'next/server';
import { getSession, getCompanyById, getMatchesForCompany } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/companies/[id]/matches
 * Returns all licitacion matches for a specific company, sorted by hybrid score.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify session
    const token = req.cookies.get('licitahub_session')?.value;
    if (token) {
      const session = getSession(token);
      if (session && session.companyId !== id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    const company = getCompanyById(id);
    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const matches = getMatchesForCompany(id);

    // Sort by hybrid score (highest first)
    matches.sort((a, b) => b.hybridScore - a.hybridScore);

    // Parse optional filters
    const { searchParams } = new URL(req.url);
    const minScore = parseInt(searchParams.get('minScore') || '0');
    const recommendation = searchParams.get('recommendation');
    const limit = parseInt(searchParams.get('limit') || '100');

    let filtered = matches;

    if (minScore > 0) {
      filtered = filtered.filter(m => m.hybridScore >= minScore);
    }

    if (recommendation) {
      filtered = filtered.filter(m => m.aiRecommendation === recommendation);
    }

    return NextResponse.json({
      data: filtered.slice(0, limit),
      total: filtered.length,
      companyName: company.name,
    });
  } catch (error: any) {
    console.error('Matches API error:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo matches' },
      { status: 500 }
    );
  }
}
