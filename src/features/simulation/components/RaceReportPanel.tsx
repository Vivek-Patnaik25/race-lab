import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ShieldAlert, Wrench, BookOpen } from 'lucide-react';
import type { RaceReport } from '../../../engine';

export interface RaceReportPanelProps {
  races: RaceReport[];
}

export const RaceReportPanel: React.FC<RaceReportPanelProps> = ({ races }) => {
  if (races.length === 0) {
    return (
      <div className="p-3.5 rounded-lg border border-emerald-900/50 bg-emerald-950/20 text-xs font-mono text-emerald-400 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Zero Data Races Detected</span>
        </div>
        <p className="text-[11px] text-emerald-400/80 leading-relaxed">
          All shared memory accesses are either read-only or causally ordered by vector-clock
          happens-before synchronization.
        </p>
        <div className="pt-1">
          <Link
            to="/app/learn/happens-before"
            className="text-[10px] text-accent hover:underline flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3" />
            Learn how Vector Clocks prove race-freedom →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono">
      <div className="text-xs font-mono font-medium text-rose-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Race diagnostic reports ({races.length})</span>
        </div>
        <Link
          to="/app/learn/race-conditions"
          className="text-xs font-normal text-rose-300/80 hover:text-rose-200 hover:underline flex items-center gap-1"
        >
          <BookOpen className="w-3 h-3" />
          guide: race conditions
        </Link>
      </div>

      <div className="space-y-3">
        {races.map((race, index) => (
          <div
            key={race.id || index}
            className="p-3 rounded-lg border border-rose-800/80 bg-rose-950/30 text-xs space-y-2.5 shadow-lg shadow-black/40"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-rose-900/60 pb-1.5">
              <span className="font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>DATA RACE #{index + 1}</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-700/60 font-semibold">
                variable: {race.variable}
              </span>
            </div>

            {/* Access Interleaving Details */}
            <div className="grid grid-cols-2 gap-2 bg-background/80 p-2 rounded border border-border/60 text-[11px]">
              <div className="space-y-0.5">
                <div className="text-text-muted text-[10px] uppercase">Access 1</div>
                <div className="text-text-primary font-semibold">{race.threadA}</div>
                <div className="text-blue-400">
                  {race.accessTypeA} (Step {race.stepA})
                </div>
              </div>

              <div className="space-y-0.5 border-l border-border/60 pl-2">
                <div className="text-text-muted text-[10px] uppercase">Access 2</div>
                <div className="text-text-primary font-semibold">{race.threadB}</div>
                <div className="text-rose-400">
                  {race.accessTypeB} (Step {race.stepB})
                </div>
              </div>
            </div>

            {/* Causality Explanation */}
            <div className="text-[11px] text-text-secondary leading-relaxed bg-surface-raised/40 p-2 rounded space-y-1">
              <div className="text-rose-400/90 font-medium text-xs">Causality analysis</div>
              <p>{race.explanation}</p>
              <div className="pt-1 flex items-center gap-3 text-xs">
                <Link
                  to="/app/learn/race-conditions"
                  className="text-accent hover:underline flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" />
                  Race theory
                </Link>
                <Link
                  to="/app/learn/happens-before"
                  className="text-accent hover:underline flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" />
                  Vector clocks
                </Link>
              </div>
            </div>

            {/* Suggested Remediation */}
            {race.suggestedFix && (
              <div className="text-[10px] text-amber-300/90 bg-amber-950/30 border border-amber-900/40 p-2 rounded flex items-start gap-1.5 leading-relaxed">
                <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Remediation:</strong> {race.suggestedFix}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
