import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RotateCcw, Play, Zap } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ThreadExecutionState {
  pc: number; // 0, 1, 2, 3
  reg: number | null;
}

export const RaceConditionWidget: React.FC = () => {
  const [counter, setCounter] = useState<number>(0);
  const [threadA, setThreadA] = useState<ThreadExecutionState>({ pc: 0, reg: null });
  const [threadB, setThreadB] = useState<ThreadExecutionState>({ pc: 0, reg: null });
  const [history, setHistory] = useState<string[]>([]);

  const threadAInstructions = ['READ counter -> regA', 'regA = regA + 1', 'WRITE regA -> counter'];

  const threadBInstructions = ['READ counter -> regB', 'regB = regB + 1', 'WRITE regB -> counter'];

  const stepA = () => {
    if (threadA.pc >= 3) return;
    const currentPc = threadA.pc;
    if (currentPc === 0) {
      setThreadA({ pc: 1, reg: counter });
      setHistory((h) => [...h, `Thread A read counter (${counter}) into regA`]);
    } else if (currentPc === 1) {
      const nextReg = (threadA.reg ?? 0) + 1;
      setThreadA({ pc: 2, reg: nextReg });
      setHistory((h) => [...h, `Thread A incremented regA to ${nextReg}`]);
    } else if (currentPc === 2) {
      const writeVal = threadA.reg ?? 0;
      setCounter(writeVal);
      setThreadA({ pc: 3, reg: writeVal });
      setHistory((h) => [...h, `Thread A wrote regA (${writeVal}) into counter`]);
    }
  };

  const stepB = () => {
    if (threadB.pc >= 3) return;
    const currentPc = threadB.pc;
    if (currentPc === 0) {
      setThreadB({ pc: 1, reg: counter });
      setHistory((h) => [...h, `Thread B read counter (${counter}) into regB`]);
    } else if (currentPc === 1) {
      const nextReg = (threadB.reg ?? 0) + 1;
      setThreadB({ pc: 2, reg: nextReg });
      setHistory((h) => [...h, `Thread B incremented regB to ${nextReg}`]);
    } else if (currentPc === 2) {
      const writeVal = threadB.reg ?? 0;
      setCounter(writeVal);
      setThreadB({ pc: 3, reg: writeVal });
      setHistory((h) => [...h, `Thread B wrote regB (${writeVal}) into counter`]);
    }
  };

  const reset = () => {
    setCounter(0);
    setThreadA({ pc: 0, reg: null });
    setThreadB({ pc: 0, reg: null });
    setHistory([]);
  };

  const simulateRaceInterleaving = () => {
    setCounter(1);
    setThreadA({ pc: 3, reg: 1 });
    setThreadB({ pc: 3, reg: 1 });
    setHistory([
      'Thread A read counter (0) into regA',
      'Thread B read counter (0) into regB [CONCURRENT READ]',
      'Thread A incremented regA to 1',
      'Thread B incremented regB to 1',
      'Thread A wrote regA (1) into counter',
      'Thread B wrote regB (1) into counter [LOST UPDATE]',
    ]);
  };

  const simulateSafeExecution = () => {
    setCounter(2);
    setThreadA({ pc: 3, reg: 1 });
    setThreadB({ pc: 3, reg: 2 });
    setHistory([
      'Thread A read counter (0) into regA',
      'Thread A incremented regA to 1',
      'Thread A wrote regA (1) into counter',
      'Thread B read counter (1) into regB [SYNCHRONIZED]',
      'Thread B incremented regB to 2',
      'Thread B wrote regB (2) into counter',
    ]);
  };

  const isComplete = threadA.pc === 3 && threadB.pc === 3;
  const isLostUpdate = isComplete && counter === 1;

  return (
    <div className="p-4 rounded-lg border border-border bg-surface space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-400" />
            Interactive Race Condition Stepper (The Lost Update)
          </h3>
          <p className="text-xs text-text-muted mt-0.5 font-sans">
            Step individual threads or run preset interleavings to observe how unsynchronized
            concurrent writes corrupt memory.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Button
            size="sm"
            variant="ghost"
            onClick={simulateRaceInterleaving}
            className="text-[11px] h-7 text-rose-400 hover:text-rose-300"
          >
            Race Interleaving
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={simulateSafeExecution}
            className="text-[11px] h-7 text-emerald-400 hover:text-emerald-300"
          >
            Safe Execution
          </Button>
          <Button size="sm" variant="secondary" onClick={reset} className="text-[11px] h-7 gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
      </div>

      {/* Shared Variable Display */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-background text-xs">
        <div className="flex items-center gap-3">
          <span className="text-text-muted uppercase text-[10px] tracking-wider font-semibold">
            Shared Memory:
          </span>
          <span className="px-2 py-0.5 rounded bg-surface border border-border font-bold text-text-primary">
            counter = <span className="text-accent text-sm">{counter}</span>
          </span>
        </div>
        <div className="text-[11px] text-text-muted">
          Expected final value after both threads increment:{' '}
          <strong className="text-emerald-400">2</strong>
        </div>
      </div>

      {/* Threads Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thread A */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
            <span className="font-bold text-blue-400">Thread A</span>
            <span className="text-text-muted text-[11px]">
              regA:{' '}
              {threadA.reg !== null ? (
                <strong className="text-blue-300">{threadA.reg}</strong>
              ) : (
                'uninitialized'
              )}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {threadAInstructions.map((inst, idx) => {
              const isCurrent = threadA.pc === idx;
              const isDone = threadA.pc > idx;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded border text-xs flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'border-blue-500/80 bg-blue-950/40 text-blue-200 font-semibold'
                      : isDone
                        ? 'border-border/30 bg-surface/40 text-text-muted line-through'
                        : 'border-border/50 bg-surface/20 text-text-secondary'
                  }`}
                >
                  <span>{inst}</span>
                  {isCurrent && <span className="text-[10px] text-blue-400">▶ NEXT</span>}
                  {isDone && <span className="text-[10px] text-emerald-400">✓</span>}
                </div>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={stepA}
            disabled={threadA.pc >= 3}
            className="w-full text-xs h-7 gap-1 border-blue-900/60 hover:border-blue-700"
          >
            <Play className="w-3 h-3 text-blue-400" />
            Step Thread A
          </Button>
        </div>

        {/* Thread B */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
            <span className="font-bold text-purple-400">Thread B</span>
            <span className="text-text-muted text-[11px]">
              regB:{' '}
              {threadB.reg !== null ? (
                <strong className="text-purple-300">{threadB.reg}</strong>
              ) : (
                'uninitialized'
              )}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {threadBInstructions.map((inst, idx) => {
              const isCurrent = threadB.pc === idx;
              const isDone = threadB.pc > idx;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded border text-xs flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'border-purple-500/80 bg-purple-950/40 text-purple-200 font-semibold'
                      : isDone
                        ? 'border-border/30 bg-surface/40 text-text-muted line-through'
                        : 'border-border/50 bg-surface/20 text-text-secondary'
                  }`}
                >
                  <span>{inst}</span>
                  {isCurrent && <span className="text-[10px] text-purple-400">▶ NEXT</span>}
                  {isDone && <span className="text-[10px] text-emerald-400">✓</span>}
                </div>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={stepB}
            disabled={threadB.pc >= 3}
            className="w-full text-xs h-7 gap-1 border-purple-900/60 hover:border-purple-700"
          >
            <Play className="w-3 h-3 text-purple-400" />
            Step Thread B
          </Button>
        </div>
      </div>

      {/* Execution Analysis / Alert Banner */}
      {isComplete ? (
        isLostUpdate ? (
          <div className="p-3.5 rounded-lg border border-rose-800/80 bg-rose-950/40 text-xs space-y-1.5 text-rose-300">
            <div className="flex items-center gap-2 font-semibold text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Lost update detected (data race anomaly)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-text-secondary font-sans">
              Both threads performed concurrent increments starting from 0, but because both read
              the value before either wrote back, the final counter is <strong>1</strong> instead of{' '}
              <strong>2</strong>. One entire increment was silently overwritten.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg border border-emerald-800/80 bg-emerald-950/40 text-xs space-y-1.5 text-emerald-300">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Safe execution (no lost update)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-text-secondary font-sans">
              One thread completed its write before the other thread read the updated counter. The
              final value is correctly <strong>2</strong>.
            </p>
          </div>
        )
      ) : history.length > 0 ? (
        <div className="p-3 rounded-lg border border-border/60 bg-background text-xs space-y-1">
          <div className="text-xs text-text-muted font-medium">Execution interleaving log</div>
          <div className="space-y-0.5 max-h-24 overflow-y-auto text-[11px] text-text-secondary font-mono">
            {history.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-text-muted text-[10px] w-4">{i + 1}.</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
