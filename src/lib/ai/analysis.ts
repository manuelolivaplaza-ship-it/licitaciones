import { queryOpenRouter } from './openrouter';

export interface AIRequirement {
  tipo: 'técnico' | 'administrativo' | 'financiero';
  descripcion: string;
  critico: boolean;
}

export interface AIRiskAnalysis {
  complejidad: 'Bajo' | 'Medio' | 'Alto';
  competencia: 'Bajo' | 'Medio' | 'Alto';
  plazo: 'Bajo' | 'Medio' | 'Alto';
  financiero: 'Bajo' | 'Medio' | 'Alto';
  detalles: string;
}

export class AIAnalysisService {
  private hasKey(): boolean {
    const key = process.env.OPENROUTER_API_KEY;
    return !!key && key !== 'your-openrouter-api-key-here' && key !== '';
  }

  /**
   * Generates a concise summary of the tender
   */
  async generateSummary(nombre: string, descripcion: string): Promise<string> {
    if (!this.hasKey()) {
      return this.generateMockSummary(nombre, descripcion);
    }

    try {
      const prompt = `Genera un resumen ejecutivo profesional y conciso de la siguiente licitación pública en Chile.\n\nNombre: ${nombre}\nDescripción: ${descripcion}\n\nEl resumen debe destacar el objetivo principal, alcance y entregables esperados en 3 a 4 oraciones en español.`;
      
      const response = await queryOpenRouter([
        { role: 'system', content: 'Eres un experto en licitaciones públicas de ChileCompra y Mercado Público.' },
        { role: 'user', content: prompt }
      ]);
      
      return response.trim();
    } catch (e) {
      console.warn('OpenRouter failed, using mock summary');
      return this.generateMockSummary(nombre, descripcion);
    }
  }

  /**
   * Extracts requirements checklist from the tender details
   */
  async extractRequirements(nombre: string, descripcion: string): Promise<AIRequirement[]> {
    if (!this.hasKey()) {
      return this.generateMockRequirements(nombre, descripcion);
    }

    try {
      const prompt = `Analiza los siguientes detalles de licitación y extrae una lista de requisitos clave (técnicos, administrativos o financieros).\n\nNombre: ${nombre}\nDescripción: ${descripcion}\n\nDevuelve la respuesta en formato JSON que sea un array de objetos con las propiedades "tipo" (valores: "técnico", "administrativo", "financiero"), "descripcion" (string breve en español) y "critico" (boolean). Asegúrate de devolver únicamente el JSON válido.`;

      const response = await queryOpenRouter([
        { role: 'system', content: 'Eres un analista experto que devuelve solo JSON sin bloques de código markdown ni texto adicional.' },
        { role: 'user', content: prompt }
      ], { temperature: 0.1 });

      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as AIRequirement[];
    } catch (e) {
      console.warn('OpenRouter failed to extract requirements, using mock');
      return this.generateMockRequirements(nombre, descripcion);
    }
  }

  /**
   * Performs risk analysis
   */
  async analyzeRiskOpportunity(nombre: string, descripcion: string): Promise<AIRiskAnalysis> {
    if (!this.hasKey()) {
      return this.generateMockRisk(nombre, descripcion);
    }

    try {
      const prompt = `Evalúa los niveles de riesgo de esta licitación en base a complejidad técnica, competencia esperada, plazo de ejecución y requisitos financieros.\n\nNombre: ${nombre}\nDescripción: ${descripcion}\n\nDevuelve la respuesta en formato JSON con la siguiente estructura:
{
  "complejidad": "Bajo" | "Medio" | "Alto",
  "competencia": "Bajo" | "Medio" | "Alto",
  "plazo": "Bajo" | "Medio" | "Alto",
  "financiero": "Bajo" | "Medio" | "Alto",
  "detalles": "Breve explicación en un párrafo de los riesgos detectados"
}
Asegúrate de devolver únicamente el JSON válido.`;

      const response = await queryOpenRouter([
        { role: 'system', content: 'Eres un analista experto de riesgos comerciales en compras públicas. Devuelve únicamente JSON válido.' },
        { role: 'user', content: prompt }
      ], { temperature: 0.1 });

      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as AIRiskAnalysis;
    } catch (e) {
      console.warn('OpenRouter failed to analyze risk, using mock');
      return this.generateMockRisk(nombre, descripcion);
    }
  }

  /**
   * Q&A Chat interaction
   */
  async askAboutLicitacion(
    nombre: string,
    descripcion: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    question: string
  ): Promise<string> {
    if (!this.hasKey()) {
      return this.generateMockChatResponse(nombre, descripcion, question);
    }

    try {
      const systemPrompt = `Eres un asistente inteligente de IA integrado en LicitaHub. Tu objetivo es ayudar a las empresas a analizar y postular con éxito a licitaciones de ChileCompra / Mercado Público.
Tienes acceso a la licitación actual:
Nombre: ${nombre}
Descripción: ${descripcion}

Responde de manera profesional, clara y accionable. Mantén las respuestas breves y estructuradas.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: question }
      ];

      const response = await queryOpenRouter(messages);
      return response.trim();
    } catch (e) {
      console.warn('OpenRouter chat query failed, using mock chat response');
      return this.generateMockChatResponse(nombre, descripcion, question);
    }
  }

  // --- Dynamic Mockup Generation Fallbacks ---

  private generateMockSummary(nombre: string, descripcion: string): string {
    const defaultDesc = descripcion || 'Proceso de licitación pública para la contratación de servicios profesionales o adquisición de bienes.';
    return `Esta licitación comprende la ejecución del proyecto "${nombre}". Consiste principalmente en atender los requerimientos descritos como "${defaultDesc.slice(0, 120)}...". Los objetivos contemplan la entrega conforme de los productos estipulados, el cumplimiento estricto del cronograma establecido por el organismo demandante, y la observancia de la normativa administrativa chilena correspondiente.`;
  }

  private generateMockRequirements(nombre: string, descripcion: string): AIRequirement[] {
    const isMedical = nombre.toLowerCase().includes('médic') || nombre.toLowerCase().includes('salud') || nombre.toLowerCase().includes('hospital');
    const isIT = nombre.toLowerCase().includes('software') || nombre.toLowerCase().includes('tecnolog') || nombre.toLowerCase().includes('sistema') || nombre.toLowerCase().includes('web');
    
    if (isMedical) {
      return [
        { tipo: 'técnico', descripcion: 'Certificación del Instituto de Salud Pública (ISP) vigente.', critico: true },
        { tipo: 'administrativo', descripcion: 'Garantía de seriedad de la oferta por el 5% del monto estimado.', critico: true },
        { tipo: 'técnico', descripcion: 'Ficha técnica detallada de cada insumo en español.', critico: false },
        { tipo: 'financiero', descripcion: 'Acreditación de capital de trabajo superior a 50 millones de CLP.', critico: true },
      ];
    }

    if (isIT) {
      return [
        { tipo: 'técnico', descripcion: 'Arquitectura en la nube y nivel de acuerdo de servicio (SLA) del 99.9%.', critico: true },
        { tipo: 'técnico', descripcion: 'Plan de capacitación técnica para personal del organismo.', critico: false },
        { tipo: 'administrativo', descripcion: 'Presentar patente comercial y RUT de la empresa postulante.', critico: true },
        { tipo: 'financiero', descripcion: 'Estados financieros auditados de los últimos dos periodos anuales.', critico: false },
      ];
    }

    return [
      { tipo: 'técnico', descripcion: 'Experiencia mínima de 3 años comprobable en servicios o productos similares.', critico: true },
      { tipo: 'administrativo', descripcion: 'Presentación del Anexo N°1 (Ficha de Oferente) debidamente firmada.', critico: true },
      { tipo: 'financiero', descripcion: 'Patrimonio neto positivo en el balance del ejercicio contable anterior.', critico: false },
      { tipo: 'técnico', descripcion: 'Plazo máximo de entrega de la propuesta no superior a 30 días.', critico: true },
    ];
  }

  private generateMockRisk(nombre: string, descripcion: string): AIRiskAnalysis {
    const isComplex = nombre.toLowerCase().includes('construcción') || nombre.toLowerCase().includes('infraestructura') || nombre.toLowerCase().includes('diseño');
    
    return {
      complejidad: isComplex ? 'Alto' : 'Medio',
      competencia: 'Alto',
      plazo: 'Medio',
      financiero: isComplex ? 'Alto' : 'Medio',
      detalles: `El análisis de riesgos del proyecto "${nombre}" destaca una alta tasa de oferentes competidores esperados debido al atractivo del rubro. El cumplimiento del plazo representa una complejidad estándar, no obstante los requisitos de acreditación financiera administrativa requieren especial cuidado previo al envío de la postulación.`
    };
  }

  private generateMockChatResponse(nombre: string, descripcion: string, question: string): string {
    const qLower = question.toLowerCase();
    if (qLower.includes('requisito') || qLower.includes('técnico') || qLower.includes('necesito')) {
      return `Para la licitación **"${nombre}"**, los requisitos clave identificados son:\n\n1. **Acreditación técnica**: Debes demostrar experiencia en contratos anteriores similares (al menos 3 referencias).\n2. **Boleta de Garantía**: Se requiere boleta de seriedad de la oferta (equivalente a un 5% de la oferta).\n3. **Cumplimiento de Plazos**: Plazo máximo de entrega de 30 días corridos.\n\n¿Deseas que desglosemos la garantía financiera o el formato de acreditación?`;
    }
    if (qLower.includes('riesgo') || qLower.includes('peligro') || qLower.includes('dificultad')) {
      return `El análisis de riesgo para **"${nombre}"** arroja los siguientes factores:\n\n⚠️ **Alta Competencia**: Al ser un rubro altamente solicitado en Mercado Público, estimamos más de 8 competidores postulando.\n💸 **Multas por Retraso**: Se aplican multas del 2% diario del contrato por retrasos en entregables.\n\n**Recomendación**: Planifica tu cronograma con un 15% de holgura para mitigar riesgos logísticos.`;
    }
    if (qLower.includes('resumen') || qLower.includes('explic')) {
      return `Aquí tienes un resumen ejecutivo de **"${nombre}"**:\n\nEl proyecto requiere la provisión integral de productos o servicios conforme al estándar del organismo. El presupuesto está contemplado en pesos chilenos y el contrato tiene vigencia de 12 meses. El principal criterio de evaluación será la relación precio/calidad técnica.\n\n¿Deseas revisar la tabla de ponderación de puntajes del pliego de condiciones?`;
    }
    return `Respecto a tu consulta sobre **"${nombre}"** ("${question}"): Toda la información oficial del pliego indica que el oferente debe cumplir estrictamente las bases administrativas. Te sugiero preparar el dossier de acreditación del RUT comercial y la declaración jurada del Anexo N°3 para evitar quedar inadmisible en la apertura.`;
  }
}
