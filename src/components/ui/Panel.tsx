import React from 'react';
import { cn } from '../../lib/utils';

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  className,
  title,
  headerAction,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-lg flex flex-col overflow-hidden',
        className
      )}
      {...props}
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-raised/60 border-b border-border">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            {title}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}
      <div className="p-4 flex-1 overflow-auto">{children}</div>
    </div>
  );
};
