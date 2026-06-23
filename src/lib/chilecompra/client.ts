import { ChileCompraApiResponse, ChileCompraLicitacion } from '@/types/licitacion';
import { getMockLicitaciones } from '@/lib/mock/data';

export class ChileCompraClient {
  private ticket: string;

  constructor(ticket?: string) {
    this.ticket = ticket || process.env.CHILECOMPRA_TICKET || '';
  }

  private hasTicket(): boolean {
    return !!this.ticket && this.ticket !== 'your-chilecompra-ticket-here' && this.ticket !== '';
  }

  /**
   * Helper to fetch data from Mercado Público API with timeout
   */
  private async fetchFromApi(params: Record<string, string>): Promise<ChileCompraApiResponse> {
    if (!this.hasTicket()) {
      throw new Error('No API Ticket configured');
    }

    const queryParams = new URLSearchParams({
      ...params,
      ticket: this.ticket,
    });

    const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?${queryParams.toString()}`;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        next: { revalidate: 900 }, // 15 mins cache
      });
      
      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`ChileCompra API returned status ${response.status}`);
      }

      const data = await response.json();
      return data as ChileCompraApiResponse;
    } catch (error) {
      clearTimeout(id);
      console.error('ChileCompra API Request failed:', error);
      throw error;
    }
  }

  /**
   * Get specific tender detail by code
   */
  async getLicitacion(codigo: string): Promise<ChileCompraLicitacion | null> {
    try {
      if (!this.hasTicket()) {
        throw new Error('No API Ticket configured');
      }

      const response = await this.fetchFromApi({ codigo });
      if (response && response.Cantidad > 0 && response.Listado && response.Listado.length > 0) {
        return response.Listado[0];
      }
      return null;
    } catch (e) {
      console.error('API error fetching details for:', codigo, e);
      return null;
    }
  }

  /**
   * Fetch daily tenders list by date (format ddmmyyyy)
   */
  async getLicitacionesPorFecha(fecha: string): Promise<ChileCompraLicitacion[]> {
    try {
      if (!this.hasTicket()) {
        throw new Error('No API Ticket configured');
      }

      const response = await this.fetchFromApi({ fecha });
      return response?.Listado || [];
    } catch (e) {
      console.error('API error fetching list by date:', e);
      return [];
    }
  }

  /**
   * Fetch tenders by status (e.g. "activas")
   */
  async getLicitacionesPorEstado(estado: string): Promise<ChileCompraLicitacion[]> {
    try {
      if (!this.hasTicket()) {
        throw new Error('No API Ticket configured');
      }

      const response = await this.fetchFromApi({ estado });
      return response?.Listado || [];
    } catch (e) {
      console.error('API error fetching list by state:', e);
      return [];
    }
  }

  /**
   * Map internal Licitacion type to ChileCompraLicitacion raw format for fallback compatibility
   */
  private mapToChileCompra(lic: any): ChileCompraLicitacion {
    return {
      CodigoExterno: lic.codigo,
      Nombre: lic.nombre,
      CodigoEstado: this.mapEstadoToCodigo(lic.estado),
      Descripcion: lic.descripcion,
      FechaCierre: lic.fechaCierre,
      FechaPublicacion: lic.fechaPublicacion,
      FechaInicio: lic.fechaPublicacion,
      FechaFinal: lic.fechaCierre,
      MontoEstimado: lic.montoEstimado,
      Moneda: lic.moneda || 'CLP',
      Etapas: 1,
      EstadoEtapas: 1,
      Tipo: 1,
      TipoConvocatoria: 1,
      Comprador: {
        CodigoOrganismo: lic.organismoCode || '9999',
        NombreOrganismo: lic.organismo,
        RutUnidad: '11111111-1',
        CodigoUnidad: '8888',
        NombreUnidad: 'Depto Adquisiciones',
        DireccionUnidad: 'Av Libertador 123',
        ComunaUnidad: 'Santiago',
        RegionUnidad: lic.region || 'Metropolitana de Santiago',
        NombreContacto: 'Juan Perez',
        CargoContacto: 'Jefe de Compras',
        FonoContacto: '+5622222222',
        MailContacto: 'contacto@organismo.cl',
      },
      Items: {
        Cantidad: lic.items?.length || 0,
        Listado: (lic.items || []).map((it: any) => ({
          Correlativo: it.correlativo,
          CodigoCategoria: it.codigoCategoria || '9999',
          Categoria: it.categoria || 'Varios',
          CodigoProducto: it.codigoProducto || '9999',
          NombreProducto: it.nombreProducto || 'Producto/Servicio',
          Descripcion: it.descripcion || 'Descripción',
          UnidadMedida: it.unidadMedida || 'UN',
          Cantidad: it.cantidad || 1,
        })),
      },
      Adjudicacion: lic.adjudicacion ? {
        Tipo: lic.adjudicacion.tipo || 1,
        Fecha: lic.adjudicacion.fecha || '',
        NumeroOferentes: lic.adjudicacion.numeroOferentes || 3,
        UrlActaAdjudicacion: lic.adjudicacion.urlActa || '',
      } : undefined,
    };
  }

  private mapEstadoToCodigo(estado: string): number {
    switch (estado) {
      case 'publicada': return 5;
      case 'cerrada': return 6;
      case 'desierta': return 7;
      case 'adjudicada': return 8;
      case 'revocada': return 18;
      case 'suspendida': return 19;
      default: return 5;
    }
  }
}
