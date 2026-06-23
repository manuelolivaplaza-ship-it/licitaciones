'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, MapPin, BookmarkPlus, ArrowRight, Calendar, Clock, X } from 'lucide-react';
import { cn, formatCLP, formatDateRelative, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/ui/score-ring';
import type { Licitacion, LicitacionEstado } from '@/types';

interface LicitacionCardProps {
  licitacion: Licitacion;
  onSave?: (id: string) => void;
  onDismiss?: (id: string) => void;
  isSaved?: boolean;
}

export function LicitacionCard({ licitacion, onSave, onDismiss, isSaved = false }: LicitacionCardProps) {
  const score = licitacion.aiScore || 0;
  
  const [isNew, setIsNew] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const now = Date.now();
    setIsNew(now - new Date(licitacion.fechaPublicacion).getTime() < 24 * 60 * 60 * 1000);
    setIsUrgent(licitacion.estado === 'publicada' &&
      new Date(licitacion.fechaCierre).getTime() - now < 48 * 60 * 60 * 1000);
  }, [licitacion.fechaPublicacion, licitacion.fechaCierre, licitacion.estado]);

  const deadline = licitacion.estado === 'publicada' ? formatDateRelative(licitacion.fechaCierre) : null;

  const estadoBadge: Record<LicitacionEstado, { variant: 'success' | 'default' | 'warning' | 'danger' | 'info' | 'purple'; label: string }> = {
    publicada: { variant: 'success', label: 'Activa' },
    cerrada: { variant: 'default', label: 'Cerrada' },
    adjudicada: { variant: 'info', label: 'Adjudicada' },
    desierta: { variant: 'warning', label: 'Desierta' },
    revocada: { variant: 'danger', label: 'Revocada' },
    suspendida: { variant: 'warning', label: 'Suspendida' },
  };

  const { variant, label } = estadoBadge[licitacion.estado];

  return (
    <div className={cn(
      'group relative rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-5 transition-all duration-300',
      'hover:border-[#1890ff]/30 dark:hover:border-[#00f2fe]/20 hover:shadow-2xl hover:shadow-[#1890ff]/[0.02] hover:-translate-y-0.5',
      'flex flex-col h-full',
      score >= 80 && 'border-emerald-500/25 dark:border-emerald-500/10'
    )}>
      
      {/* Top Row: Score + Badges + Dismiss Button */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant={variant} className="font-semibold text-[9px]">{label}</Badge>
          {isNew && <Badge variant="success" className="text-[9px] font-semibold">🆕 Nuevo</Badge>}
          {isUrgent && <Badge variant="danger" className="text-[9px] font-semibold">⏰ Urgente</Badge>}
          {score >= 80 && <Badge variant="purple" className="text-[9px] font-semibold">🔥 Recomendada</Badge>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ScoreRing score={score} size={40} strokeWidth={3} />
          {onDismiss && (
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(licitacion.id); }}
              className="p-1 rounded-lg border border-border-primary/50 text-slate-450 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-550/15 transition-colors cursor-pointer"
              title="Ocultar de la lista"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-text-primary line-clamp-2 mb-3 group-hover:text-[#1890ff] dark:group-hover:text-[#00f2fe] transition-colors leading-relaxed">
        <Link href={`/licitacion/${licitacion.id}`} className="transition-colors">
          {licitacion.nombre}
        </Link>
      </h3>

      {/* Details list */}
      <div className="space-y-1.5 mb-4">
        {licitacion.organismo && (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-550 dark:text-slate-400">
            <Building2 className="h-3.5 w-3.5 text-slate-450 shrink-0" />
            <span className="truncate">{licitacion.organismo}</span>
          </div>
        )}
        {licitacion.region && (
          <div className="flex items-center gap-2 text-[11px] font-medium text-text-light">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{licitacion.region}</span>
          </div>
        )}
        {licitacion.fechaPublicacion && (
          <div className="flex items-center gap-2 text-[11px] font-medium text-text-light">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Publicada: {formatDateRelative(licitacion.fechaPublicacion)} ({new Date(licitacion.fechaPublicacion).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })})</span>
          </div>
        )}
        {licitacion.syncedAt && (
          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Encontrada: {new Date(licitacion.syncedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: Monto + Deadline + Actions */}
      <div className="pt-4 border-t border-border-primary/60 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[9px] text-text-light font-medium uppercase tracking-wide">Monto estimado</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">{licitacion.montoEstimado > 0 ? formatCLP(licitacion.montoEstimado) : 'Ver en bases'}</p>
          </div>
          {deadline && (
            <div className="text-right">
              <p className="text-[9px] text-text-light font-medium uppercase tracking-wide">Cierre</p>
              <p className={cn('text-xs font-medium mt-0.5', isUrgent ? 'text-red-500' : 'text-text-secondary')}>
                {deadline}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 z-10 relative">
          {onSave && (
            <button
              onClick={(e) => { e.stopPropagation(); onSave(licitacion.id); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer',
                isSaved
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-[#1890ff]/10 text-[#1890ff] dark:text-[#00f2fe] border-[#1890ff]/20 hover:bg-[#1890ff]/20'
              )}
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              {isSaved ? 'Guardada' : 'Guardar'}
            </button>
          )}
          <Link
            href={`/licitacion/${licitacion.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.04] text-text-primary hover:bg-[#1890ff]/10 hover:text-[#1890ff] dark:hover:text-[#00f2fe] border border-transparent hover:border-[#1890ff]/20 transition-all"
          >
            Ver Detalles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
