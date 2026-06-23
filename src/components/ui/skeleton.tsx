'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use "pulse" (default) or "shimmer" animation */
  animation?: 'pulse' | 'shimmer';
}

function Skeleton({ className, animation = 'pulse', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-slate-200 dark:bg-slate-800/60',
        animation === 'pulse' && 'animate-pulse',
        animation === 'shimmer' &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-slate-200/20 dark:before:via-white/[0.04] before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Preset skeleton layouts                                            */
/* ------------------------------------------------------------------ */

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-card-border bg-card-bg p-5 space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === lines - 1 ? 'w-3/5' : 'w-full')}
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonText };
