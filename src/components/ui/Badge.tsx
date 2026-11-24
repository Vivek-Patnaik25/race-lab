import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'thread-a' | 'thread-b';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-surface-raised text-text-secondary border-border',
    success: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
    danger: 'bg-rose-950/40 text-rose-400 border-rose-800/60',
    accent: 'bg-violet-950/40 text-violet-300 border-violet-800/60',
    'thread-a': 'bg-blue-950/50 text-blue-300 border-blue-700/60',
    'thread-b': 'bg-purple-950/50 text-purple-300 border-purple-700/60',
  }[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border capitalize tracking-normal',
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
