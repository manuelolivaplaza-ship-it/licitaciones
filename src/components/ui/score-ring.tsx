'use client';

import { cn } from '@/lib/utils';

interface ScoreRingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Score value from 0 to 100 */
  score: number;
  /** Diameter of the ring in pixels */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Whether to show the label below the number */
  showLabel?: boolean;
}

function getScoreColor(score: number) {
  if (score >= 80) return { textClass: 'text-emerald-600 dark:text-emerald-400', trackClass: 'text-slate-200 dark:text-slate-800/80' };
  if (score >= 60) return { textClass: 'text-blue-600 dark:text-blue-400', trackClass: 'text-slate-200 dark:text-slate-800/80' };
  if (score >= 40) return { textClass: 'text-amber-600 dark:text-amber-400', trackClass: 'text-slate-200 dark:text-slate-800/80' };
  return { textClass: 'text-slate-500 dark:text-slate-400', trackClass: 'text-slate-200 dark:text-slate-800/80' };
}

export function ScoreRing({
  score,
  size = 64,
  strokeWidth = 4,
  showLabel = false,
  className,
  ...props
}: ScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;
  const colors = getScoreColor(clampedScore);

  return (
    <div
      className={cn('relative inline-flex flex-col items-center justify-center', className)}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={colors.trackClass}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', colors.textClass)}
        />
      </svg>

      {/* Center number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            'font-bold tabular-nums leading-none',
            colors.textClass,
            size >= 64 ? 'text-lg' : size >= 48 ? 'text-sm' : 'text-xs'
          )}
        >
          {clampedScore}
        </span>
      </div>

      {/* Optional label */}
      {showLabel && (
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Score
        </span>
      )}
    </div>
  );
}
