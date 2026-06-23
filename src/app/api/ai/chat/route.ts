import { NextRequest, NextResponse } from 'next/server';
import { AIAnalysisService } from '@/lib/ai/analysis';

export async function POST(req: NextRequest) {
  try {
    const { nombre, descripcion, history, question } = await req.json();

    if (!nombre || !question) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    const ai = new AIAnalysisService();
    const response = await ai.askAboutLicitacion(nombre, descripcion || '', history || [], question);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('API AI Chat error:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
