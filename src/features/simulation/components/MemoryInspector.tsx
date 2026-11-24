import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Skull, BookOpen } from 'lucide-react';
import { Panel } from '../../../components/ui/Panel';
import { Badge } from '../../../components/ui/Badge';
import { RaceReportPanel } from './RaceReportPanel';
import type { DeadlockReport, MutexState, RaceReport } from '../../../engine';

export interface MemoryInspectorProps {
  sharedMemory: Record<string, number>;
  mutexes: MutexState[];
  activeRaces: RaceReport[];
  activeDeadlock: DeadlockReport | null;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({
  sharedMemory,
  mutexes,
  activeRaces,
  activeDeadlock,
}) => {
  return (
    <div className="flex flex-col h-full bg-surface select-none overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border bg-surface-raised/40 flex items-center justify-between shrink-0">
        <div className="text-xs font-mono uppercase tracking-wider font-semibold text-text-secondary flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-accent" />
          <span>Memory & Synchronization</span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400">Live</span>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Deadlock Banner Alert */}
        {activeDeadlock && (
          <div className="p-3 rounded-lg border border-rose-800 bg-rose-950/50 space-y-2 shadow-lg shadow-rose-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 font-mono">
                <Skull className="w-4 h-4 text-rose-400 shrink-0" />
                <span>DEADLOCK DETECTED (Wait-For Cycle)</span>
              </div>
              <Link
                to="/app/learn/deadlocks"
                className="text-[10px] font-mono text-rose-300 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" />
                Deadlock Guide
              </Link>
            </div>

            <div className="p-2 rounded bg-background/80 border border-rose-900/60 font-mono text-xs text-rose-300">
              <span className="text-text-muted text-[10px] block uppercase mb-0.5">
                Circular Wait Cycle:
              </span>
              <span className="font-bold">{activeDeadlock.cycle.join(' → ')}</span>
            </div>
            <p className="text-[11px] font-mono text-text-secondary leading-relaxed">
              {activeDeadlock.explanation}
            </p>
          </div>
        )}

        {/* Shared Variables Table */}
        <Panel title="Shared Variables" className="bg-background">
          {Object.keys(sharedMemory).length === 0 ? (
            <div className="text-xs font-mono text-text-muted italic py-2">
              No shared variables defined.
            </div>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-text-muted text-[10px] text-left">
                  <th className="pb-1.5">Variable</th>
                  <th className="pb-1.5 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {Object.entries(sharedMemory).map(([name, val]) => (
                  <tr key={name} className="hover:bg-surface-raised/30 transition-colors">
                    <td className="py-2 text-text-secondary font-medium">{name}</td>
                    <td className="py-2 text-right font-bold text-accent">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        {/* Synchronization Locks / Mutexes Panel */}
        <Panel
          title="Synchronization Locks (Mutexes)"
          className="bg-background"
          headerAction={
            <Link
              to="/app/learn/mutexes"
              className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Mutex Guide
            </Link>
          }
        >
          {mutexes.length === 0 ? (
            <div className="text-xs font-mono text-text-muted italic py-2">
              No mutex locks configured in this scenario.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {mutexes.map((m) => (
                <div key={m.id} className="p-2.5 rounded bg-surface border border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-text-primary font-bold">{m.id}</span>
                    {m.owner ? (
                      <Badge variant="danger" className="text-[10px]">
                        OWNED BY {m.owner}
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px]">
                        FREE
                      </Badge>
                    )}
                  </div>

                  <div className="text-[11px] text-text-muted flex justify-between items-center border-t border-border/40 pt-1.5">
                    <span>FIFO Waiting Queue:</span>
                    <span className="text-text-secondary font-medium">
                      {m.waitingQueue.length > 0 ? m.waitingQueue.join(', ') : 'Empty (0)'}
                    </span>
                  </div>

                  <div className="text-[10px] text-text-muted flex justify-between items-center border-t border-border/40 pt-1">
                    <span>Release Clock:</span>
                    <span className="text-accent">
                      [
                      {Object.entries(m.releaseClock.values)
                        .map(([k, v]) => `${k}:${v}`)
                        .join(', ') || '0'}
                      ]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Race Reports Diagnostic Section */}
        <RaceReportPanel races={activeRaces} />
      </div>
    </div>
  );
};
