import React from 'react';
import { Trophy, Star, ArrowRight, RotateCcw, X, BookOpen, AlertCircle } from 'lucide-react';
import type { ChallengeDefinition } from '../../../data/challenges';
import type { ScoreResult } from '../../../engine';
import { Button } from '../../../components/ui/Button';

export interface MissionCompletionModalProps {
  isOpen: boolean;
  isSuccess: boolean;
  reason: string;
  scoreResult: ScoreResult | null;
  challenge: ChallengeDefinition;
  onNextMission?: () => void;
  onRetry: () => void;
  onClose: () => void;
}

export const MissionCompletionModal: React.FC<MissionCompletionModalProps> = ({
  isOpen,
  isSuccess,
  reason,
  scoreResult,
  challenge,
  onNextMission,
  onRetry,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-border bg-surface-raised flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                isSuccess
                  ? 'bg-surface border-border text-emerald-400'
                  : 'bg-surface border-border text-amber-400'
              }`}
            >
              {isSuccess ? <Trophy className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                    isSuccess
                      ? 'bg-surface text-emerald-400 border-border'
                      : 'bg-surface text-amber-400 border-border'
                  }`}
                >
                  {isSuccess ? 'Mission complete' : 'Objective unmet'}
                </span>
                <span className="text-xs font-mono text-text-muted">
                  Mission {challenge.missionNumber}
                </span>
              </div>
              <h2 id="mission-modal-title" className="text-lg font-semibold text-text-primary">
                {challenge.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close completion modal"
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Diagnostic message */}
          <div
            className={`p-3.5 rounded-lg border text-xs font-mono leading-relaxed ${
              isSuccess
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
            }`}
          >
            {reason}
          </div>

          {isSuccess && scoreResult && (
            <div className="space-y-4">
              {/* Star Rating Banner */}
              <div className="flex items-center justify-center gap-3 py-2 bg-surface-raised/40 rounded-lg border border-border">
                {[1, 2, 3].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-7 h-7 transition-colors ${
                      starIdx <= scoreResult.stars
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-text-muted/30'
                    }`}
                  />
                ))}
              </div>

              {/* Score Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 bg-surface-raised rounded-lg border border-border">
                  <div className="text-xs font-mono text-text-muted">Base</div>
                  <div className="text-sm font-mono font-semibold text-text-primary tabular-nums">
                    {scoreResult.baseScore}
                  </div>
                </div>

                <div className="p-3 bg-surface-raised rounded-lg border border-border">
                  <div className="text-xs font-mono text-text-muted">Step bonus</div>
                  <div className="text-sm font-mono font-semibold text-emerald-400 tabular-nums">
                    +{scoreResult.stepEfficiencyBonus}
                  </div>
                  <div className="text-[10px] font-mono text-text-muted tabular-nums">
                    {scoreResult.actualSteps}/{scoreResult.optimalSteps} steps
                  </div>
                </div>

                <div className="p-3 bg-surface-raised rounded-lg border border-border">
                  <div className="text-xs font-mono text-text-muted">Hints</div>
                  <div
                    className={`text-sm font-mono font-semibold tabular-nums ${
                      scoreResult.hintPenalty > 0 ? 'text-rose-400' : 'text-text-muted'
                    }`}
                  >
                    -{scoreResult.hintPenalty}
                  </div>
                  <div className="text-[10px] font-mono text-text-muted">
                    {scoreResult.hintsUsed} used
                  </div>
                </div>

                <div className="p-3 bg-surface-raised rounded-lg border border-border">
                  <div className="text-xs font-mono text-text-muted">Total</div>
                  <div className="text-base font-mono font-semibold text-accent tabular-nums">
                    {scoreResult.totalScore}
                  </div>
                </div>
              </div>

              {/* Educational Explanation Box */}
              <div className="p-4 rounded-lg bg-surface-raised/60 border border-border space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-accent">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Engineering takeaway</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  {challenge.explanation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-border bg-surface-raised/40 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RotateCcw className="w-3.5 h-3.5" /> Retry scenario
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Inspect result
            </Button>

            {isSuccess && onNextMission && (
              <Button variant="primary" size="sm" onClick={onNextMission}>
                Next mission <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
