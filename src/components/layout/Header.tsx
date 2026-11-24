import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cpu, Award, Settings, ExternalLink, Compass, Keyboard } from 'lucide-react';
import { useGameStore } from '../../store/game-store';
import { useUIStore } from '../../store/ui-store';

export const Header: React.FC = () => {
  const location = useLocation();
  const xp = useGameStore((s) => s.xp);
  const { openOnboarding, openShortcuts } = useUIStore();

  const getSectionTitle = () => {
    if (location.pathname.startsWith('/app/simulate')) return 'Simulation Studio';
    if (location.pathname.startsWith('/app/challenges')) return 'Challenges';
    if (location.pathname.startsWith('/app/lab')) return 'Lab Mode';
    if (location.pathname.startsWith('/app/learn')) return 'Learning Centre';
    if (location.pathname.startsWith('/app/achievements')) return 'Achievements';
    if (location.pathname.startsWith('/app/settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <header className="h-14 border-b border-border bg-surface px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-md bg-accent/15 border border-accent/40 flex items-center justify-center text-accent group-hover:bg-accent/25 transition-colors">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="font-semibold text-base tracking-tight text-text-primary">
            Race<span className="text-accent">Lab</span>
          </span>
        </Link>
        <span className="text-border">/</span>
        <span className="text-sm font-medium text-text-secondary">{getSectionTitle()}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={openOnboarding}
          aria-label="Open tour guide"
          title="Product Tour"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-raised border border-border/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Compass className="w-3.5 h-3.5 text-accent" />
          <span className="hidden md:inline">Tour</span>
        </button>

        <button
          onClick={openShortcuts}
          aria-label="View keyboard shortcuts"
          title="Keyboard shortcuts (?)"
          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-raised rounded-md border border-border/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-raised border border-border text-xs font-mono font-medium text-amber-400 tabular-nums">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>{xp} XP</span>
        </div>

        <Link
          to="/"
          className="text-xs text-text-muted hover:text-text-secondary transition-colors hidden sm:flex items-center gap-1"
        >
          Landing <ExternalLink className="w-3 h-3" />
        </Link>

        <Link
          to="/app/settings"
          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-raised rounded-md border border-border/60 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
};
