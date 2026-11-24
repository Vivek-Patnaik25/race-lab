import React, { useEffect } from 'react';
import {
  X,
  Keyboard,
  Play,
  SkipForward,
  SkipBack,
  RotateCcw,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';
import { useUIStore } from '../../store/ui-store';

interface ShortcutItem {
  key: string;
  description: string;
  icon: React.ReactNode;
  context: string;
}

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, closeShortcuts } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeShortcuts();
      }
    };
    if (isShortcutsOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isShortcutsOpen, closeShortcuts]);

  if (!isShortcutsOpen) return null;

  const shortcuts: ShortcutItem[] = [
    {
      key: 'Space',
      description: 'Toggle auto-execution play/pause',
      icon: <Play className="w-3.5 h-3.5 text-emerald-400" />,
      context: 'Simulation Studio',
    },
    {
      key: '→',
      description: 'Step forward one instruction (selected or round-robin thread)',
      icon: <SkipForward className="w-3.5 h-3.5 text-blue-400" />,
      context: 'Simulation Studio',
    },
    {
      key: '←',
      description: 'Step backward (deterministic time-travel snapshot restore)',
      icon: <SkipBack className="w-3.5 h-3.5 text-purple-400" />,
      context: 'Simulation Studio',
    },
    {
      key: 'R',
      description: 'Reset simulation to initial state',
      icon: <RotateCcw className="w-3.5 h-3.5 text-rose-400" />,
      context: 'Simulation Studio',
    },
    {
      key: 'H',
      description: 'Toggle mission intel & hints drawer',
      icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />,
      context: 'Challenge Missions',
    },
    {
      key: '?',
      description: 'Open this keyboard shortcuts quick reference',
      icon: <HelpCircle className="w-3.5 h-3.5 text-accent" />,
      context: 'Global',
    },
    {
      key: 'Esc',
      description: 'Close active modal, dialog, or drawer',
      icon: <X className="w-3.5 h-3.5 text-text-muted" />,
      context: 'Global',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-raised/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-accent/20 border border-accent/30 text-accent">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 id="shortcuts-dialog-title" className="text-base font-bold text-text-primary">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-text-muted">High-velocity simulation navigation keys</p>
            </div>
          </div>
          <button
            onClick={closeShortcuts}
            aria-label="Close keyboard shortcuts dialog"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((item) => (
            <div
              key={item.key + item.description}
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised/40 border border-border/70 hover:border-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="p-1 rounded bg-background border border-border text-text-secondary">
                  {item.icon}
                </span>
                <div>
                  <div className="text-xs font-medium text-text-primary">{item.description}</div>
                  <div className="text-[10px] text-text-muted font-mono">{item.context}</div>
                </div>
              </div>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold text-text-primary bg-background border border-border rounded shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface-raised/30 flex items-center justify-between text-xs text-text-muted">
          <span>
            Press{' '}
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono text-[10px]">
              Esc
            </kbd>{' '}
            or click outside to dismiss
          </span>
          <button
            onClick={closeShortcuts}
            className="px-3 py-1 bg-surface-raised hover:bg-surface border border-border rounded text-xs text-text-primary transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
