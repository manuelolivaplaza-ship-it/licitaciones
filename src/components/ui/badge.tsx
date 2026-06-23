'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
        success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        danger: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
        info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
        purple: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
        outline: 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
