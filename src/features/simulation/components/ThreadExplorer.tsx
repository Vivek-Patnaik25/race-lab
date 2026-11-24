import React from 'react';
import { Layers, Play, Lock, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatInstructionText } from '../../../data/challenges';
import type { MutexState, SchedulerMode, ThreadState } from '../../../engine';

export interface ThreadExplorerProps {
  threads: ThreadState[];
  mutexes: MutexState[];
  selectedThreadId: string | null;
  schedulerMode: SchedulerMode;
  onSelectThread: (threadId: string) => void;
  onStepThread: (threadId: string) => void;
}

export const ThreadExplorer: React.FC<ThreadExplorerProps> = ({
  threads,
  mutexes,
  selectedThreadId,
  schedulerMode,
  onSelectThread,
  onStepThread,
}) => {
  const getThreadColor = (color?: string, idx: number = 0) => {
    if (color === 'thread-b' || idx === 1)
      return { dot: 'bg-purple-400', badge: 'thread-b' as const, border: 'border-purple-500/40' };
    if (color === 'thread-c' || idx === 2)
      return { dot: 'bg-amber-400', badge: 'warning' as const, border: 'border-amber-500/40' };
    return { dot: 'bg-blue-400', badge: 'thread-a' as const, border: 'border-blue-500/40' };
  };

  const getBlockedMutex = (thread: ThreadState) => {
    if (thread.status !== 'BLOCKED') return null;
    const inst = thread.instructions[thread.programCounter];
    if (inst && inst.op === 'LOCK') {
      const m = mutexes.find((item) => item.id === inst.mutexId);
      return {
        mutexId: inst.mutexId,
        owner: m?.owner || 'Unknown',
      };
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border select-none overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border bg-surface-raised/40 flex items-center justify-between shrink-0">
        <div className="text-xs font-mono uppercase tracking-wider font-semibold text-text-secondary flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-accent" />
          <span>Thread Explorer</span>
        </div>
        <span className="text-[11px] font-mono text-text-muted">
          {threads.length} {threads.length === 1 ? 'Thread' : 'Threads'}
        </span>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {threads.map((thread, idx) => {
          const isSelected = selectedThreadId === thread.id;
          const colorMeta = getThreadColor(thread.color, idx);
          const blockedInfo = getBlockedMutex(thread);
          const isEligible = thread.status === 'READY';

          return (
            <div
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              className={`rounded-lg border p-3 space-y-3 cursor-pointer transition-all duration-150 ${
                isSelected
                  ? 'border-accent/60 bg-surface-raised shadow-md shadow-accent/10'
                  : 'border-border bg-background hover:border-text-secondary/30'
              }`}
            >
              {/* Thread Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${colorMeta.dot}`} />
                  <span className="font-bold text-xs text-text-primary font-mono">
                    {thread.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={
                      thread.status === 'BLOCKED'
                        ? 'danger'
                        : thread.status === 'COMPLETED'
                          ? 'default'
                          : 'success'
                    }
                  >
                    {thread.status}
                  </Badge>
                  <span className="text-[10px] font-mono text-text-muted">
                    PC: {thread.programCounter}/{thread.instructions.length}
                  </span>
                </div>
              </div>

              {/* Vector Clock & Manual Step Action */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 pb-1 border-b border-border/40">
                <div className="flex items-center gap-1 text-text-muted text-[10px]">
                  <Clock className="w-3 h-3 text-text-secondary" />
                  <span>
                    Clock: [
                    {Object.entries(thread.clock.values)
                      .map(([k, v]) => `${k}:${v}`)
                      .join(', ') || '0'}
                    ]
                  </span>
                </div>

                {schedulerMode === 'MANUAL' && (
                  <Button
                    variant={isSelected ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    disabled={!isEligible}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStepThread(thread.id);
                    }}
                    title={
                      !isEligible
                        ? `Thread is ${thread.status}`
                        : `Execute next instruction for ${thread.name}`
                    }
                  >
                    <Play className="w-2.5 h-2.5 fill-current mr-1" />
                    Step
                  </Button>
                )}
              </div>

              {/* Blocked Status Diagnostic Banner */}
              {blockedInfo && (
                <div className="p-2 rounded bg-rose-950/40 border border-rose-800/60 text-[11px] font-mono text-rose-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>
                    Blocked on mutex <strong>{blockedInfo.mutexId}</strong> (held by{' '}
                    <strong>{blockedInfo.owner}</strong>)
                  </span>
                </div>
              )}

              {/* Instruction List */}
              <div className="space-y-1 font-mono text-xs">
                {thread.instructions.map((inst, i) => {
                  const isCurrent = thread.programCounter === i && thread.status !== 'COMPLETED';
                  const isExecuted = thread.programCounter > i;

                  return (
                    <div
                      key={i}
                      className={`px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-accent/20 border border-accent/40 text-white font-semibold'
                          : isExecuted
                            ? 'text-text-muted bg-surface/50 line-through opacity-70'
                            : 'text-text-secondary hover:bg-surface-raised'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-muted w-3">{i + 1}</span>
                        <span>{formatInstructionText(inst)}</span>
                      </div>
                      {isCurrent && (
                        <span
                          className={`text-[10px] font-bold px-1 rounded ${
                            thread.status === 'BLOCKED'
                              ? 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                              : 'text-accent bg-accent/10 border border-accent/30'
                          }`}
                        >
                          {thread.status === 'BLOCKED' ? 'WAIT' : 'NEXT'}
                        </span>
                      )}
                      {isExecuted && (
                        <CheckCircle2 className="w-3 h-3 text-text-muted opacity-60" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Local Memory / Registers Table */}
              <div className="pt-2 border-t border-border/60 text-[11px] font-mono">
                <div className="text-text-muted text-[10px] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Local Memory</span>
                  <span>{Object.keys(thread.localMemory).length} registers</span>
                </div>
                {Object.keys(thread.localMemory).length === 0 ? (
                  <span className="text-[10px] text-text-muted italic">
                    No registers initialized
                  </span>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(thread.localMemory).map(([reg, val]) => (
                      <div
                        key={reg}
                        className="flex justify-between items-center text-text-secondary bg-surface px-2 py-1 rounded border border-border/40"
                      >
                        <span className="text-text-muted">{reg}</span>
                        <span className="text-accent font-bold font-mono">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
