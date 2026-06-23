import { NextRequest, NextResponse } from 'next/server';
import { AIAnalysisService } from '@/lib/ai/analysis';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/analyze
 * 
 * Runs complete AI analysis on a licitación:
 * - Executive summary
 * - Requirements extraction
 * - Risk/opportunity analysis
 */
export async function POST(req: NextRequest) {
  try {
    const { nombre, descripcion } = await req.json();

    if (!nombre) {
      return NextResponse.json({ error: 'Nombre de licitación requerido' }, { status: 400 });
    }

    const ai = new AIAnalysisService();

    // Run all analyses in parallel for speed
    const [summary, requirements, risks] = await Promise.all([
      ai.generateSummary(nombre, descripcion || ''),
      ai.extractRequirements(nombre, descripcion || ''),
      ai.analyzeRiskOpportunity(nombre, descripcion || ''),
    ]);

    return NextResponse.json({
      summary,
      requirements,
      risks,
    });
  } catch (error: any) {
    console.error('API AI Analyze error:', error);
    return NextResponse.json(
      { error: error.message || 'Error en análisis de IA' },
      { status: 500 }
    );
  }
}
