import type { Severity } from '../types';

export function getSeverityFromScore(score: number): Severity {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'critical';
}

export function getSeverityColor(severity: Severity | string): string {
  switch (severity) {
    case 'low':
      return '#22C55E';
    case 'medium':
      return '#F59E0B';
    case 'high':
      return '#F97316';
    case 'critical':
      return '#EF4444';
    default:
      return '#22C55E';
  }
}

export function getSeverityBadgeStyle(severity: Severity | string) {
  switch (severity) {
    case 'low':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500',
        label: 'Safe / Low',
      };
    case 'medium':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-500',
        label: 'Warning',
      };
    case 'high':
      return {
        bg: 'bg-orange-500/10 dark:bg-orange-500/20',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        dot: 'bg-orange-500',
        label: 'High Risk',
      };
    case 'critical':
      return {
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/30',
        dot: 'bg-red-500',
        label: 'CRITICAL',
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
        dot: 'bg-gray-500',
        label: 'Unknown',
      };
  }
}

export function getWorkerStatusStyle(status: string) {
  switch (status) {
    case 'safe':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        label: 'SAFE',
      };
    case 'warning':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        label: 'WARNING',
      };
    case 'high_risk':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
        label: 'HIGH RISK',
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
        label: 'UNKNOWN',
      };
  }
}
