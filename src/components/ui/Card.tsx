import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hoverable = false, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-lg p-5 transition-colors duration-150',
        hoverable &&
          'hover:border-text-secondary/40 hover:bg-surface-raised cursor-pointer shadow-lg shadow-black/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
