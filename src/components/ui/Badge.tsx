import React from 'react';
import { cn } from '../../lib/utils';
import type { Severity } from '../../types';
import { getSeverityBadgeStyle, getWorkerStatusStyle } from '../../lib/severity';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'secondary' | Severity | 'safe' | 'warning' | 'high_risk';
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  showDot = false,
  children,
  ...props
}) => {
  let badgeStyle = 'bg-slate-800 text-slate-200 border-slate-700';
  let dotStyle = 'bg-slate-400';

  if (['low', 'medium', 'high', 'critical'].includes(variant)) {
    const sev = getSeverityBadgeStyle(variant);
    badgeStyle = `${sev.bg} ${sev.text} ${sev.border}`;
    dotStyle = sev.dot;
  } else if (['safe', 'warning', 'high_risk'].includes(variant)) {
    const stat = getWorkerStatusStyle(variant);
    badgeStyle = `${stat.bg} ${stat.text} ${stat.border}`;
  } else if (variant === 'outline') {
    badgeStyle = 'bg-transparent text-slate-300 border-slate-700';
  } else if (variant === 'secondary') {
    badgeStyle = 'bg-teal-500/10 text-teal-400 border-teal-500/30';
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-medium rounded-md border tracking-wider uppercase transition-colors',
        badgeStyle,
        className
      )}
      {...props}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotStyle)} />}
      {children}
    </div>
  );
};
