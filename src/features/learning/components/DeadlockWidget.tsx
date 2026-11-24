import React, { useState } from 'react';
import { Skull, ShieldCheck, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const DeadlockWidget: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const [useOrderingProtocol, setUseOrderingProtocol] = useState<boolean>(false);

  // Steps in Deadlock scenario:
  // Step 0: Initial (both free)
  // Step 1: Thread A acquires Mutex 1
  // Step 2: Thread B acquires Mutex 2
  // Step 3: Thread A requests Mutex 2 (blocks on Thread B)
  // Step 4: Thread B requests Mutex 1 (blocks on Thread A -> DEADLOCK CYCLE!)

  // Steps in Ordered scenario:
  // Step 0: Initial
  // Step 1: Thread A acquires Mutex 1
  // Step 2: Thread B attempts to acquire Mutex 1 first (blocks on Thread A, holds nothing!)
  // Step 3: Thread A acquires Mutex 2, completes, releases both
  // Step 4: Thread B acquires Mutex 1, then Mutex 2, completes safely!

  const nextStep = () => {
    setStep((s) => Math.min(4, s + 1));
  };

  const reset = () => {
    setStep(0);
  };

  const isDeadlocked = !useOrderingProtocol && step === 4;

  return (
    <div className="p-4 rounded-lg border border-border bg-surface space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Skull className="w-4 h-4 text-rose-400" />
            Interactive Deadlock & Wait-For Graph Explorer
          </h3>
          <p className="text-xs text-text-muted mt-0.5 font-sans">
            Explore how circular wait conditions form deadlocks and how strict lock hierarchy
            prevents cycles.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Button
            size="sm"
            variant={useOrderingProtocol ? 'primary' : 'secondary'}
            onClick={() => {
              setUseOrderingProtocol(!useOrderingProtocol);
              setStep(0);
            }}
            className="text-[11px] h-7"
          >
            {useOrderingProtocol
              ? '✓ Protocol: Strict Lock Hierarchy'
              : 'Protocol: Arbitrary Order'}
          </Button>

          <Button size="sm" variant="secondary" onClick={reset} className="text-[11px] h-7 gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
      </div>

      {/* Scenario Stepper Bar */}
      <div className="p-3 rounded-lg border border-border/80 bg-background flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-[10px] uppercase font-bold">Execution Step:</span>
          <span className="px-2 py-0.5 rounded bg-surface border border-border font-bold text-accent">
            {step} / 4
          </span>
          <span className="text-text-secondary text-[11px]">
            {step === 0 && 'Ready to begin simulation.'}
            {step === 1 && 'Thread A acquired Mutex 1.'}
            {step === 2 &&
              (useOrderingProtocol
                ? 'Thread B requests Mutex 1 (blocks waiting for Thread A).'
                : 'Thread B acquired Mutex 2.')}
            {step === 3 &&
              (useOrderingProtocol
                ? 'Thread A acquires Mutex 2 without contention.'
                : 'Thread A requests Mutex 2 (waiting for Thread B).')}
            {step === 4 &&
              (useOrderingProtocol
                ? 'Thread A releases both mutexes; Thread B acquires and finishes safely.'
                : 'Thread B requests Mutex 1 (waiting for Thread A) → circular wait cycle.')}
          </span>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={nextStep}
          disabled={step >= 4}
          className="text-xs h-7 gap-1 bg-surface"
        >
          <span>Step next</span>
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Visual Wait-For Graph and Lock Ownership */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resource Allocation View */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-3 text-xs">
          <div className="text-xs font-bold text-text-primary border-b border-border/60 pb-1.5">
            Resource Allocation State
          </div>

          <div className="space-y-2">
            {/* Mutex 1 */}
            <div className="p-2 rounded bg-surface border border-border/50 flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-400">Mutex 1</span>
                <span className="text-[10px] text-text-muted ml-2">(Priority 1 in Hierarchy)</span>
              </div>
              <span className="text-[11px] font-semibold">
                {step >= 1 && step < 4
                  ? 'Held by Thread A'
                  : step === 4 && useOrderingProtocol
                    ? 'Transferred to Thread B'
                    : 'Free'}
              </span>
            </div>

            {/* Mutex 2 */}
            <div className="p-2 rounded bg-surface border border-border/50 flex items-center justify-between">
              <div>
                <span className="font-bold text-purple-400">Mutex 2</span>
                <span className="text-[10px] text-text-muted ml-2">(Priority 2 in Hierarchy)</span>
              </div>
              <span className="text-[11px] font-semibold">
                {!useOrderingProtocol && step >= 2
                  ? 'Held by Thread B'
                  : useOrderingProtocol && step === 3
                    ? 'Held by Thread A'
                    : step === 4 && useOrderingProtocol
                      ? 'Transferred to Thread B'
                      : 'Free'}
              </span>
            </div>
          </div>
        </div>

        {/* Directed Wait-For Dependency Graph */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-3 text-xs">
          <div className="text-xs font-bold text-text-primary border-b border-border/60 pb-1.5 flex items-center justify-between">
            <span>Directed Wait-For Graph</span>
            {isDeadlocked && (
              <span className="text-rose-400 font-bold text-[10px] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> CYCLE DETECTED
              </span>
            )}
          </div>

          <div className="space-y-2">
            {/* Edge 1: Thread A -> Thread B */}
            <div
              className={`p-2 rounded border flex items-center justify-between transition-colors ${
                !useOrderingProtocol && step >= 3
                  ? 'border-rose-800/80 bg-rose-950/40 text-rose-300 font-semibold'
                  : 'border-border/40 bg-surface/40 text-text-muted'
              }`}
            >
              <span>Thread A → Thread B</span>
              <span className="text-[10px]">
                {!useOrderingProtocol && step >= 3 ? 'ACTIVE (Waiting on M2)' : 'No Dependency'}
              </span>
            </div>

            {/* Edge 2: Thread B -> Thread A */}
            <div
              className={`p-2 rounded border flex items-center justify-between transition-colors ${
                (!useOrderingProtocol && step === 4) ||
                (useOrderingProtocol && (step === 2 || step === 3))
                  ? 'border-rose-800/80 bg-rose-950/40 text-rose-300 font-semibold'
                  : 'border-border/40 bg-surface/40 text-text-muted'
              }`}
            >
              <span>Thread B → Thread A</span>
              <span className="text-[10px]">
                {(!useOrderingProtocol && step === 4) ||
                (useOrderingProtocol && (step === 2 || step === 3))
                  ? 'ACTIVE (Waiting on M1)'
                  : 'No Dependency'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Coffman Conditions Checklist & Diagnosis */}
      {isDeadlocked ? (
        <div className="p-3.5 rounded-lg border border-rose-800 bg-rose-950/50 space-y-2 text-xs text-rose-300">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <Skull className="w-4 h-4 shrink-0" />
            <span>UNRESOLVABLE DEADLOCK CONFIRMED (Circular Wait Cycle)</span>
          </div>
          <div className="p-2 rounded bg-background/80 border border-rose-900/60 font-mono text-[11px]">
            Cycle Path: <strong>Thread A → Thread B → Thread A</strong>
          </div>
          <div className="text-[11px] text-text-secondary leading-relaxed font-sans">
            All 4 Coffman conditions are simultaneously satisfied: Mutual Exclusion, Hold & Wait, No
            Preemption, and Circular Wait. Neither thread can ever advance.
          </div>
        </div>
      ) : useOrderingProtocol && step === 4 ? (
        <div className="p-3.5 rounded-lg border border-emerald-800 bg-emerald-950/50 space-y-1.5 text-xs text-emerald-300">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>DEADLOCK PREVENTED (Hierarchical Lock Ordering)</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
            By forcing all threads to acquire Mutex 1 before Mutex 2, circular wait cycles are
            mathematically impossible. Thread A finished and released its locks, allowing Thread B
            to proceed without incident.
          </p>
        </div>
      ) : null}
    </div>
  );
};
