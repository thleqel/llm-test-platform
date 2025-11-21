import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

import { CheckCircle, XCircle, AlertCircle, MinusCircle, Loader2, Circle, Clock } from 'lucide-react';

export function getStatusColor(status: string) {
  const statusLower = status.toLowerCase();
  if (statusLower === 'passed' || statusLower === 'completed') return { variant: 'green' as const, icon: CheckCircle };
  if (statusLower === 'failed' || statusLower === 'error') return { variant: 'red' as const, icon: XCircle };
  if (statusLower === 'running' || statusLower === 'in_progress') return { variant: 'blue' as const, icon: Loader2 };
  if (statusLower === 'pending' || statusLower === 'skipped') return { variant: 'yellow' as const, icon: Clock };
  return { variant: 'gray' as const, icon: Circle };
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'passed':
      return '✓';
    case 'failed':
      return '✗';
    case 'error':
      return '⚠';
    case 'skipped':
      return '⊘';
    case 'running':
      return '⟳';
    default:
      return '•';
  }
}
