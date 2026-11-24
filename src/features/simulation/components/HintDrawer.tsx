import React from 'react';
import { Lightbulb, Lock, Unlock, X, AlertCircle } from 'lucide-react';
import type { ChallengeHint } from '../../../data/challenges';
import { useGameStore } from '../../../store/game-store';
import { Button } from '../../../components/ui/Button';

export interface HintDrawerProps {
  hints: ChallengeHint[];
  isOpen: boolean;
  onClose: () => void;
}

export const HintDrawer: React.FC<HintDrawerProps> = ({ hints, isOpen, onClose }) => {
  const { isHintUnlocked, unlockHint } = useGameStore();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hints-drawer-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-surface border-l border-border h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="h-14 px-5 border-b border-border flex items-center justify-between bg-surface-raised/40">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h2 id="hints-drawer-title" className="font-bold text-sm text-text-primary">
              Mission Hints & Intel
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close hints drawer"
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3.5 bg-amber-950/30 border-b border-amber-800/40 text-xs font-mono text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            Hints reveal conceptual clues and step sequences. Each unlocked hint reduces your final
            mission score by 150 points.
          </span>
        </div>

        {/* Hints List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {hints.map((hint, idx) => {
            const unlocked = isHintUnlocked(hint.id);
            const prevHintUnlocked = idx === 0 || isHintUnlocked(hints[idx - 1].id);

            return (
              <div
                key={hint.id}
                className={`p-4 rounded-lg border transition-all ${
                  unlocked
                    ? 'bg-surface-raised/70 border-accent/40 shadow-sm'
                    : 'bg-surface/60 border-border opacity-90'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface border border-border text-text-secondary">
                      TIER {hint.tier}
                    </span>
                    <h3 className="text-xs font-bold text-text-primary">{hint.title}</h3>
                  </div>

                  {unlocked ? (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                      <Unlock className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                      <Lock className="w-3 h-3" /> -150 pts
                    </span>
                  )}
                </div>

                {unlocked ? (
                  <p className="text-xs text-text-secondary leading-relaxed bg-background/50 p-3 rounded border border-border/60 font-mono">
                    {hint.content}
                  </p>
                ) : (
                  <div className="pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs"
                      disabled={!prevHintUnlocked}
                      onClick={() => unlockHint(hint.id)}
                    >
                      {!prevHintUnlocked ? (
                        <span>Unlock Tier {idx} Hint First</span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Unlock className="w-3 h-3 text-amber-400" /> Unlock Hint (-150 pts)
                        </span>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-raised/30 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
