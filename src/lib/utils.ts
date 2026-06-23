import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return 'Sin fecha';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateRelative(dateStr: string): string {
  if (!dateStr) return 'Sin fecha';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffHours) < 1) return 'Ahora';
  if (diffHours > 0 && diffHours < 24) return `En ${diffHours}h`;
  if (diffHours < 0 && diffHours > -24) return `Hace ${Math.abs(diffHours)}h`;
  if (diffDays > 0) return `En ${diffDays} días`;
  return `Hace ${Math.abs(diffDays)} días`;
}

export function timeUntilDeadline(dateStr: string): {
  text: string;
  urgent: boolean;
  expired: boolean;
} {
  if (!dateStr) return { text: 'Sin fecha', urgent: false, expired: false };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { text: dateStr, urgent: false, expired: false };
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs < 0) return { text: 'Expirada', urgent: false, expired: true };

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 24)
    return { text: `${hours}h restantes`, urgent: true, expired: false };
  if (days < 3)
    return { text: `${days} días restantes`, urgent: true, expired: false };
  if (days < 7)
    return { text: `${days} días restantes`, urgent: false, expired: false };
  return { text: `${days} días restantes`, urgent: false, expired: false };
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-slate-400';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 60) return 'bg-blue-500/10 border-blue-500/20';
  if (score >= 40) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-slate-500/10 border-slate-500/20';
}
