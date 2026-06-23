import { queryOpenRouter } from './openrouter';
import { Licitacion, Organization } from '@/types/licitacion';

export class AIScoringEngine {
  private hasKey(): boolean {
    const key = process.env.OPENROUTER_API_KEY;
    return !!key && key !== 'your-openrouter-api-key-here' && key !== '';
  }

  /**
   * Calculate a deterministic match score based on rules
   */
  calculateRuleScore(licitacion: Partial<Licitacion>, org: Partial<Organization>): number {
    let score = 0;

    // Resolve properties from Organization or CompanyProfile (which might use different field names)
    const keywords = org.keywords ?? [];
    const regions = org.regions ?? [];
    const minAmount = org.minAmount ?? (org as any).min_amount ?? (org as any).montoMin ?? 0;
    const maxAmount = org.maxAmount ?? (org as any).max_amount ?? (org as any).montoMax ?? Infinity;
    const categories = org.categories ?? (org as any).subCategories ?? [];

    // 1. Keywords Match (Max 40 points)
    if (keywords.length > 0) {
      const name = (licitacion.nombre || '').toLowerCase();
      const desc = (licitacion.descripcion || '').toLowerCase();
      let matchCount = 0;

      keywords.forEach(keyword => {
        const kw = keyword.toLowerCase().trim();
        if (kw && (name.includes(kw) || desc.includes(kw))) {
          matchCount++;
        }
      });

      const kwScore = keywords.length > 0 
        ? Math.min(40, (matchCount / Math.min(5, keywords.length)) * 40)
        : 0;
      score += kwScore;
    } else {
      // Default average keywords compatibility
      score += 20;
    }

    // 2. Region Match (Max 20 points)
    if (regions.length > 0) {
      const region = licitacion.region || '';
      // Check if organization covers all regions or matches this specific one
      const matchesRegion = regions.some(r => 
        region.toLowerCase().includes(r.toLowerCase()) || 
        r.toLowerCase().includes('todas') ||
        r.toLowerCase() === 'all'
      );
      if (matchesRegion) {
        score += 20;
      }
    } else {
      // Default to matching if regions are not limited
      score += 20;
    }

    // 3. Amount/Budget Match (Max 25 points)
    if (licitacion.montoEstimado !== undefined && licitacion.montoEstimado > 0) {
      const amount = licitacion.montoEstimado;
      const min = minAmount;
      const max = maxAmount;

      if (amount >= min && amount <= max) {
        score += 25;
      } else if (amount < min) {
        // Penalty for too small
        const ratio = amount / Math.max(1, min);
        score += Math.round(ratio * 15);
      } else {
        // Penalty for too big
        const ratio = max / amount;
        score += Math.round(ratio * 20);
      }
    } else {
      // Default score for unknown amount
      score += 15;
    }

    // 4. Category Match (Max 15 points)
    if (categories.length > 0) {
      // Check items categories
      const categoriesList = (licitacion.items || []).map(it => (it.categoria || '').toLowerCase());
      const matchesCategory = categories.some((c: string) => 
        categoriesList.some((cl: string) => cl.includes(c.toLowerCase()) || c.toLowerCase().includes(cl))
      );
      if (matchesCategory) {
        score += 15;
      }
    } else {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Refines relevance score using AI semantic assessment via OpenRouter
   */
  async computeHybridScore(licitacion: Partial<Licitacion>, org: Partial<Organization>): Promise<number> {
    const baseScore = this.calculateRuleScore(licitacion, org);

    if (!this.hasKey()) {
      return baseScore;
    }

    try {
      const prompt = `Calcula el nivel de relevancia semántica (de 0 a 100) para acoplar la siguiente licitación a la empresa postulante.
Empresa:
- Rubro: ${org.industry || 'No especificado'}
- Palabras Clave: ${org.keywords?.join(', ') || 'Ninguna'}
- Categorías: ${org.categories?.join(', ') || 'Ninguna'}

Licitación:
- Nombre: ${licitacion.nombre}
- Descripción: ${licitacion.descripcion}

Devuelve únicamente un número entero entre 0 y 100 que represente la relevancia técnica y comercial de postular a esta licitación. No devuelvas ningún texto extra ni explicaciones.`;

      const response = await queryOpenRouter([
        { role: 'system', content: 'Eres una calculadora matemática que solo devuelve un número entero único.' },
        { role: 'user', content: prompt }
      ], { temperature: 0.1, max_tokens: 5 });

      const aiScore = parseInt(response.trim().replace(/[^0-9]/g, ''));
      
      if (isNaN(aiScore)) {
        return baseScore;
      }

      // Hybrid calculation: 60% rules + 40% AI
      const hybrid = Math.round((baseScore * 0.6) + (aiScore * 0.4));
      return Math.min(100, Math.max(0, hybrid));
    } catch (e) {
      console.warn('AI scoring refinement failed, using base rules score:', e);
      return baseScore;
    }
  }
}
