import React, { useState } from 'react';
import { Cpu, RefreshCw, ArrowRight, RotateCcw, Shuffle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { createMulberry32 } from '../../../engine';

export const SchedulerWidget: React.FC = () => {
  const [mode, setMode] = useState<'ROUND_ROBIN' | 'SEEDED_RANDOM'>('ROUND_ROBIN');
  const [seed, setSeed] = useState<number>(42);
  const [stepIndex, setStepIndex] = useState<number>(0);

  // Generate an 8-slice schedule based on mode and seed
  const generateSchedule = (m: 'ROUND_ROBIN' | 'SEEDED_RANDOM', s: number): string[] => {
    const threads = ['Thread A', 'Thread B'];
    const slices: string[] = [];

    if (m === 'ROUND_ROBIN') {
      for (let i = 0; i < 8; i++) {
        slices.push(threads[i % 2]);
      }
    } else {
      const prng = createMulberry32(s);
      for (let i = 0; i < 8; i++) {
        const idx = Math.floor(prng() * 2);
        slices.push(threads[idx]);
      }
    }
    return slices;
  };

  const schedule = generateSchedule(mode, seed);

  // Compute context switches in the generated schedule
  let contextSwitches = 0;
  for (let i = 1; i < schedule.length; i++) {
    if (schedule[i] !== schedule[i - 1]) {
      contextSwitches++;
    }
  }

  const nextStep = () => {
    setStepIndex((idx) => Math.min(schedule.length, idx + 1));
  };

  const reset = () => {
    setStepIndex(0);
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-surface space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            Interactive OS Scheduler & Interleaving Generator
          </h3>
          <p className="text-xs text-text-muted mt-0.5 font-sans">
            Observe how preemptive context switches alternate threads deterministically using
            Round-Robin or seeded Mulberry32 PRNG.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Button
            size="sm"
            variant={mode === 'ROUND_ROBIN' ? 'primary' : 'secondary'}
            onClick={() => {
              setMode('ROUND_ROBIN');
              setStepIndex(0);
            }}
            className="text-[11px] h-7"
          >
            Round-Robin
          </Button>

          <Button
            size="sm"
            variant={mode === 'SEEDED_RANDOM' ? 'primary' : 'secondary'}
            onClick={() => {
              setMode('SEEDED_RANDOM');
              setStepIndex(0);
            }}
            className="text-[11px] h-7"
          >
            Seeded Random
          </Button>

          <Button size="sm" variant="secondary" onClick={reset} className="text-[11px] h-7 gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
      </div>

      {/* Scheduler Controls */}
      <div className="p-3.5 rounded-lg border border-border/80 bg-background flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-text-muted text-[10px] uppercase font-bold block mb-0.5">
              Scheduling Mode:
            </span>
            <span className="font-bold text-accent">
              {mode === 'ROUND_ROBIN' ? 'Cyclic Alternation' : 'Mulberry32 PRNG'}
            </span>
          </div>

          {mode === 'SEEDED_RANDOM' && (
            <div className="flex items-center gap-2 border-l border-border/60 pl-4">
              <span className="text-text-muted text-[10px] uppercase font-bold">Seed:</span>
              <input
                type="number"
                value={seed}
                onChange={(e) => {
                  setSeed(parseInt(e.target.value, 10) || 0);
                  setStepIndex(0);
                }}
                className="w-16 px-2 py-0.5 rounded bg-surface border border-border text-text-primary text-xs font-mono"
              />
              <Button
                size="icon"
                variant="secondary"
                className="w-6 h-6 rounded"
                onClick={() => {
                  setSeed((s) => s + 7);
                  setStepIndex(0);
                }}
                title="Randomize Seed"
                aria-label="Randomize Seed"
              >
                <Shuffle className="w-3 h-3 text-text-muted" />
              </Button>
            </div>
          )}

          <div className="border-l border-border/60 pl-4">
            <span className="text-text-muted text-[10px] uppercase font-bold block mb-0.5">
              Total Context Switches:
            </span>
            <span className="font-bold text-amber-400">{contextSwitches} switches</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-text-muted text-[11px]">
            Slice {stepIndex} of {schedule.length}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={nextStep}
            disabled={stepIndex >= schedule.length}
            className="text-xs h-7 gap-1 bg-surface"
          >
            <span>Step Slice</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Schedule Timeline Visualization */}
      <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
          <span className="font-bold text-text-primary">8-Slice Interleaving Timeline</span>
          <span className="text-[10px] text-text-muted">
            100% Deterministic (Mulberry32 Algorithm)
          </span>
        </div>

        <div className="grid grid-cols-8 gap-1.5">
          {schedule.map((thread, idx) => {
            const isExecuted = idx < stepIndex;
            const isCurrent = idx === stepIndex - 1;
            const isSwitch = idx > 0 && thread !== schedule[idx - 1];

            return (
              <div
                key={idx}
                className={`p-2 rounded border text-center transition-all ${
                  isCurrent
                    ? 'border-accent bg-accent/20 ring-1 ring-accent'
                    : isExecuted
                      ? thread === 'Thread A'
                        ? 'border-blue-800/80 bg-blue-950/40 text-blue-200'
                        : 'border-purple-800/80 bg-purple-950/40 text-purple-200'
                      : 'border-border/40 bg-surface/30 text-text-muted opacity-50'
                }`}
              >
                <div className="text-[9px] text-text-muted mb-0.5">#{idx + 1}</div>
                <div className="font-bold text-[11px]">
                  {thread === 'Thread A' ? 'Th A' : 'Th B'}
                </div>
                {isSwitch && (
                  <div className="text-[8px] text-amber-400 font-semibold mt-0.5">SWITCH</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Takeaway Banner */}
      <div className="p-3 rounded-lg border border-border/60 bg-surface/60 text-xs flex items-start gap-2.5 leading-relaxed text-text-secondary">
        <RefreshCw className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-text-primary">Determinism in Concurrency Testing:</span>
          <p className="mt-0.5 font-sans text-[11px]">
            In real operating systems, thread preemption is non-deterministic because it is
            triggered by hardware clock interrupts. In RaceLab, the <strong>Mulberry32 PRNG</strong>{' '}
            produces pseudo-random scheduling that is bit-for-bit identical given the same seed,
            allowing exact reproduction of elusive race bugs.
          </p>
        </div>
      </div>
    </div>
  );
};
