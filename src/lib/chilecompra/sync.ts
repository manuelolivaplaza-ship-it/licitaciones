import { createClient } from '../supabase/server';
import { ChileCompraClient } from './client';
import { LicitacionEstado, ESTADO_MAP } from '@/types/licitacion';

export class SyncEngine {
  private api: ChileCompraClient;

  constructor(ticket?: string) {
    this.api = new ChileCompraClient(ticket);
  }

  /**
   * Run synchronization process for a specific date (ddmmyyyy)
   */
  async syncDate(dateStr: string): Promise<{ added: number; updated: number; failed: number }> {
    console.log(`[SyncEngine] Starting sync for date: ${dateStr}`);
    
    let added = 0;
    let updated = 0;
    let failed = 0;

    try {
      const rawList = await this.api.getLicitacionesPorFecha(dateStr);
      console.log(`[SyncEngine] Retrieved ${rawList.length} tenders from API`);

      const supabase = await createClient();
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder-project.supabase.co' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

      for (const rawLic of rawList) {
        try {
          // Normalize state
          const estado: LicitacionEstado = ESTADO_MAP[rawLic.CodigoEstado] || 'publicada';
          
          // Map to internal database format
          const mappedDbLic = {
            codigo: rawLic.CodigoExterno,
            nombre: rawLic.Nombre,
            descripcion: rawLic.Descripcion || '',
            estado: estado,
            tipo: this.getTipoLabel(rawLic.Tipo),
            organismo: rawLic.Comprador.NombreOrganismo,
            organismo_codigo: rawLic.Comprador.CodigoOrganismo,
            region: rawLic.Comprador.RegionUnidad,
            fecha_publicacion: rawLic.FechaPublicacion ? new Date(rawLic.FechaPublicacion).toISOString() : null,
            fecha_cierre: rawLic.FechaCierre ? new Date(rawLic.FechaCierre).toISOString() : null,
            fecha_adjudicacion: rawLic.FechaAdjudicacion ? new Date(rawLic.FechaAdjudicacion).toISOString() : null,
            monto_estimado: rawLic.MontoEstimado || 0,
            moneda: rawLic.Moneda || 'CLP',
            items: JSON.stringify(rawLic.Items?.Listado?.map(it => ({
              correlativo: it.Correlativo,
              codigoCategoria: it.CodigoCategoria,
              categoria: it.Categoria,
              codigoProducto: it.CodigoProducto,
              nombreProducto: it.NombreProducto,
              descripcion: it.Descripcion,
              unidadMedida: it.UnidadMedida,
              cantidad: it.Cantidad
            })) || []),
            adjudicacion: rawLic.Adjudicacion ? JSON.stringify({
              tipo: rawLic.Adjudicacion.Tipo,
              fecha: rawLic.Adjudicacion.Fecha,
              numeroOferentes: rawLic.Adjudicacion.NumeroOferentes,
              urlActa: rawLic.Adjudicacion.UrlActaAdjudicacion
            }) : null,
            raw_data: JSON.stringify(rawLic),
            synced_at: new Date().toISOString()
          };

          if (isPlaceholder) {
            // Mock DB mode: just simulate syncing
            added++;
            continue;
          }

          // Insert or update in Supabase
          const { error } = await supabase
            .from('licitaciones')
            .upsert(mappedDbLic, { onConflict: 'codigo' });

          if (error) {
            throw error;
          }

          added++;
        } catch (e) {
          console.error(`[SyncEngine] Error processing tender ${rawLic.CodigoExterno}:`, e);
          failed++;
        }
      }
    } catch (error) {
      console.error('[SyncEngine] Sync cycle failed:', error);
      throw error;
    }

    return { added, updated, failed };
  }

  private getTipoLabel(tipo: number): string {
    // Map numerical types to standard labels
    const types: Record<number, string> = {
      1: 'L1', 2: 'LE', 3: 'LP', 4: 'LQ', 5: 'LR',
      6: 'LS', 7: 'CO', 8: 'B2', 9: 'H2', 10: 'E2', 11: 'CA'
    };
    return types[tipo] || 'LP';
  }
}
