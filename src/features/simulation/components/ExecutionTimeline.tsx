import React from 'react';
import { Activity, AlertTriangle, ShieldCheck, History } from 'lucide-react';
import type { SimulationEvent, SimulationState, ThreadState } from '../../../engine';

export interface ExecutionTimelineProps {
  threads: ThreadState[];
  currentStep: number;
  events: SimulationEvent[];
  activeRaces: SimulationState['activeRaces'];
  onSeekStep: (step: number) => void;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  threads,
  currentStep,
  events,
  activeRaces,
  onSeekStep,
}) => {
  const isRaceStep = (stepNum: number) => {
    return activeRaces.some((race) => race.stepA === stepNum || race.stepB === stepNum);
  };

  const getThreadColor = (color?: string, idx: number = 0) => {
    if (color === 'thread-b' || idx === 1)
      return {
        text: 'text-purple-400',
        badge: 'bg-purple-950/40 border-purple-500/50 text-purple-300',
      };
    if (color === 'thread-c' || idx === 2)
      return {
        text: 'text-amber-400',
        badge: 'bg-amber-950/40 border-amber-500/50 text-amber-300',
      };
    return { text: 'text-blue-400', badge: 'bg-blue-950/40 border-blue-500/50 text-blue-300' };
  };

  const getOpBadge = (op: string) => {
    switch (op) {
      case 'READ':
        return { label: 'R', color: 'bg-blue-950/60 border-blue-500/60 text-blue-300' };
      case 'WRITE':
        return { label: 'W', color: 'bg-violet-950/60 border-violet-500/60 text-violet-300' };
      case 'ADD':
        return { label: '+', color: 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300' };
      case 'LOCK':
        return { label: 'L', color: 'bg-amber-950/60 border-amber-500/60 text-amber-300' };
      case 'UNLOCK':
        return { label: 'U', color: 'bg-teal-950/60 border-teal-500/60 text-teal-300' };
      default:
        return { label: '?', color: 'bg-surface-raised border-border text-text-muted' };
    }
  };

  const currentEvent =
    currentStep > 0 && events.length >= currentStep ? events[currentStep - 1] : null;

  return (
    <div className="flex flex-col h-full bg-background border-r border-border select-none overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border bg-surface/60 flex items-center justify-between shrink-0">
        <div className="text-xs font-mono uppercase tracking-wider font-semibold text-text-secondary flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span>Execution Timeline (Interleaving Lanes)</span>
        </div>
        <div className="flex items-center gap-2">
          {events.length > currentStep && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/60 flex items-center gap-1">
              <History className="w-3 h-3" /> Time Travel Replay
            </span>
          )}
          <span className="text-[11px] font-mono text-text-muted">
            Step {currentStep} of {events.length}
          </span>
        </div>
      </div>

      {/* Main Timeline Viewport */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between space-y-6">
        {/* Thread Lanes Area */}
        <div className="space-y-6 my-auto">
          {threads.map((thread, threadIdx) => {
            const threadStyle = getThreadColor(thread.color, threadIdx);
            const threadEvents = events.filter((e) => e.threadId === thread.id);

            return (
              <div key={thread.id} className="space-y-1.5">
                {/* Lane Header */}
                <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                  <span className={`font-semibold ${threadStyle.text}`}>{thread.name}</span>
                  <span className="text-[10px]">
                    Executed: {threadEvents.length} ops | PC: {thread.programCounter}
                  </span>
                </div>

                {/* Horizontal Lane Track */}
                <div className="min-h-12 bg-surface rounded-lg border border-border flex items-center px-4 relative overflow-x-auto">
                  {/* Central Horizontal Axis Line */}
                  <div className="absolute inset-x-0 h-0.5 bg-border top-1/2 -translate-y-1/2" />

                  {/* Step Nodes Along the Lane */}
                  <div className="flex items-center gap-3 relative z-10 py-2">
                    {/* Step 0 Initial Marker */}
                    <button
                      onClick={() => onSeekStep(0)}
                      className={`w-7 h-7 rounded-full text-[10px] font-mono border flex items-center justify-center transition-all ${
                        currentStep === 0
                          ? 'bg-accent text-white border-accent scale-110 shadow-md shadow-accent/30 font-bold'
                          : 'bg-surface-raised border-border text-text-muted hover:border-text-secondary'
                      }`}
                      aria-label="Seek to Step 0 (Initial State)"
                      title="Seek to Step 0 (Initial State)"
                    >
                      0
                    </button>

                    {/* All executed steps in timeline */}
                    {events.map((ev) => {
                      const isThisThread = ev.threadId === thread.id;
                      const hasRace = isRaceStep(ev.step);
                      const opBadge = getOpBadge(ev.instruction.op);
                      const isCurrentStep = ev.step === currentStep;

                      if (!isThisThread) {
                        // Spacer node to preserve interleaving alignment
                        return (
                          <div
                            key={ev.step}
                            className="w-7 h-7 flex items-center justify-center text-[10px] font-mono text-text-muted opacity-30 select-none"
                            title={`Step ${ev.step}: Thread ${ev.threadId} executed`}
                          >
                            ·
                          </div>
                        );
                      }

                      return (
                        <button
                          key={ev.step}
                          onClick={() => onSeekStep(ev.step)}
                          className={`w-7 h-7 rounded-full text-[10px] font-mono border flex items-center justify-center transition-all relative ${
                            hasRace
                              ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-md shadow-rose-900/40'
                              : isCurrentStep
                                ? 'bg-accent/40 border-accent text-white scale-110 shadow-md shadow-accent/40 font-bold'
                                : `${opBadge.color} hover:scale-105`
                          }`}
                          aria-label={`Step ${ev.step}: ${ev.message}${hasRace ? ' (DATA RACE CONFLICT)' : ''}`}
                          title={`Step ${ev.step}: ${ev.message}${hasRace ? ' (DATA RACE CONFLICT)' : ''}`}
                        >
                          {opBadge.label}
                          {hasRace && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 flex items-center justify-center text-[8px] text-white">
                              !
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Explanatory Banner */}
        <div className="p-3 bg-surface-raised/60 rounded-lg border border-border text-xs font-mono space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text-primary flex items-center gap-1.5">
              {currentEvent ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span>
                    Step {currentStep}: {currentEvent.instruction.op}
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>Step 0: Initial State</span>
                </>
              )}
            </span>

            {currentEvent && isRaceStep(currentStep) && (
              <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                <AlertTriangle className="w-3 h-3 text-rose-400" /> Conflicting Access
              </span>
            )}
          </div>

          <p className="text-text-secondary leading-relaxed">
            {currentEvent
              ? currentEvent.message
              : 'Click "Step" to advance one instruction, or click any step node above to time-travel.'}
          </p>
        </div>
      </div>
    </div>
  );
};
