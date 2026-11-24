import React, { useState } from 'react';
import { AlertCircle, ShieldCheck, Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const StarvationWidget: React.FC = () => {
  const [fairMode, setFairMode] = useState<boolean>(true);
  const [owner, setOwner] = useState<string>('Thread A');
  const [threadCWaitCycles, setThreadCWaitCycles] = useState<number>(0);
  const [history, setHistory] = useState<string[]>([]);

  const runCycle = () => {
    if (fairMode) {
      // FIFO mode: Next owner must be Thread C because C has been waiting!
      if (owner !== 'Thread C') {
        setOwner('Thread C');
        setHistory((h) => [
          ...h,
          `FIFO handoff: Mutex passed to Thread C (waited ${threadCWaitCycles} cycles). Thread C runs.`,
        ]);
        setThreadCWaitCycles(0);
      } else {
        setOwner('Thread A');
        setHistory((h) => [
          ...h,
          'Thread C completed its critical section and released Mutex. Thread A acquires.',
        ]);
      }
    } else {
      // Unfair barging mode: Thread A and Thread B alternate directly, barging ahead of Thread C
      const nextOwner = owner === 'Thread A' ? 'Thread B' : 'Thread A';
      setOwner(nextOwner);
      const newWait = threadCWaitCycles + 1;
      setThreadCWaitCycles(newWait);
      setHistory((h) => [
        ...h,
        `Unfair barging: ${nextOwner} barged in ahead of waiting Thread C (waited ${newWait} cycles).`,
      ]);
    }
  };

  const reset = () => {
    setOwner('Thread A');
    setThreadCWaitCycles(0);
    setHistory([]);
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-surface space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Lock fairness and starvation explorer
          </h3>
          <p className="text-xs text-text-muted mt-0.5 font-sans">
            Compare FIFO fair queuing against unfair lock barging where a waiting thread is starved
            indefinitely.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Button
            size="sm"
            variant={fairMode ? 'primary' : 'secondary'}
            onClick={() => {
              setFairMode(!fairMode);
              reset();
            }}
            className="text-[11px] h-7"
          >
            {fairMode ? '✓ FIFO Fair Queue' : 'Unfair Barging Lock'}
          </Button>

          <Button size="sm" variant="secondary" onClick={reset} className="text-[11px] h-7 gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
      </div>

      {/* Lock State Overview */}
      <div className="p-3.5 rounded-lg border border-border/80 bg-background grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-2.5 rounded bg-surface border border-border/60">
          <span className="text-[10px] text-text-muted block mb-1">Current lock owner:</span>
          <span className="font-semibold text-accent text-sm">{owner}</span>
        </div>

        <div className="p-2.5 rounded bg-surface border border-border/60">
          <span className="text-[10px] text-text-muted block mb-1">Queue discipline:</span>
          <span className="font-semibold text-text-primary">
            {fairMode ? 'Strict FIFO fairness' : 'Unfair barging (greedy)'}
          </span>
        </div>

        <div className="p-2.5 rounded bg-surface border border-border/60">
          <span className="text-[10px] text-text-muted block mb-1">Thread C wait cycles:</span>
          <span
            className={`font-semibold text-sm tabular-nums ${
              threadCWaitCycles >= 3 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {threadCWaitCycles} cycles
          </span>
        </div>
      </div>

      {/* Thread Statuses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Thread A */}
        <div className="p-3 rounded-lg border border-border/80 bg-background space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-border/50 pb-1">
            <span className="font-semibold text-blue-400">Thread A (Fast)</span>
            <span className="text-[10px] text-text-muted">High Frequency</span>
          </div>
          <div className="text-[11px] text-text-secondary">
            Status:{' '}
            {owner === 'Thread A' ? <strong className="text-emerald-400">Running</strong> : 'Idle'}
          </div>
        </div>

        {/* Thread B */}
        <div className="p-3 rounded-lg border border-border/80 bg-background space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-border/50 pb-1">
            <span className="font-semibold text-purple-400">Thread B (Fast)</span>
            <span className="text-[10px] text-text-muted">High Frequency</span>
          </div>
          <div className="text-[11px] text-text-secondary">
            Status:{' '}
            {owner === 'Thread B' ? <strong className="text-emerald-400">Running</strong> : 'Idle'}
          </div>
        </div>

        {/* Thread C */}
        <div className="p-3 rounded-lg border border-border/80 bg-background space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-border/50 pb-1">
            <span className="font-semibold text-amber-400">Thread C (Waiting)</span>
            <span className="text-[10px] text-text-muted">Patient Worker</span>
          </div>
          <div className="text-[11px] text-text-secondary">
            Status:{' '}
            {owner === 'Thread C' ? (
              <strong className="text-emerald-400">Running (acquired lock)</strong>
            ) : (
              <span className="text-rose-400 font-semibold">
                Waiting ({threadCWaitCycles} cycles)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          onClick={runCycle}
          className="text-xs h-8 gap-1.5 bg-background border-border"
        >
          <Play className="w-3.5 h-3.5 text-accent" />
          Run lock contention cycle
        </Button>
      </div>

      {/* Starvation Warning Banner */}
      {!fairMode && threadCWaitCycles >= 3 && (
        <div className="p-3.5 rounded-lg border border-rose-800 bg-rose-950/40 text-xs space-y-1 text-rose-300">
          <div className="flex items-center gap-2 font-semibold text-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Thread starvation detected</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
            Because the lock allows barging, Threads A and B repeatedly hand off or steal the lock
            directly, leaving Thread C trapped in the queue indefinitely. RaceLab prevents this by
            strictly enforcing FIFO queue order.
          </p>
        </div>
      )}

      {fairMode && owner === 'Thread C' && (
        <div className="p-3.5 rounded-lg border border-emerald-800 bg-emerald-950/40 text-xs space-y-1 text-emerald-300">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>STARVATION PREVENTED BY FIFO QUEUING</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
            Under RaceLab&apos;s FIFO queue semantics, Thread C cannot be bypassed by newer
            requests. The maximum wait time is strictly bounded.
          </p>
        </div>
      )}

      {/* History Log */}
      {history.length > 0 && (
        <div className="p-3 rounded-lg border border-border/60 bg-background text-xs space-y-1">
          <div className="text-xs text-text-muted font-medium">Contention history</div>
          <div className="space-y-0.5 max-h-24 overflow-y-auto text-[11px] text-text-secondary font-mono">
            {history.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-text-muted text-[10px] w-4">{i + 1}.</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
