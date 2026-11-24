import React from 'react';
import { Cpu } from 'lucide-react';

export const LoadingFallback: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-4"
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent animate-pulse">
          <Cpu className="w-6 h-6 animate-spin text-accent" />
        </div>
      </div>
      <div className="text-xs font-mono text-text-muted animate-pulse">
        Initializing thread state...
      </div>
    </div>
  );
};
