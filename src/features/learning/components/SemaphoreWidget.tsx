import React, { useState } from 'react';
import { Layers, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const SemaphoreWidget: React.FC = () => {
  const initialCapacity = 2;
  const [permits, setPermits] = useState<number>(initialCapacity);
  const [holders, setHolders] = useState<Record<string, number>>({
    'Thread A': 0,
    'Thread B': 0,
    'Thread C': 0,
  });
  const [waitingQueue, setWaitingQueue] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const acquire = (thread: string) => {
    if (holders[thread] > 0) {
      setLog((prev) => [...prev, `${thread} already holds a permit.`]);
      return;
    }

    if (permits > 0) {
      // Direct acquisition
      setPermits((p) => p - 1);
      setHolders((h) => ({ ...h, [thread]: h[thread] + 1 }));
      setLog((prev) => [
        ...prev,
        `${thread} executed P() (wait): permit acquired. (${permits - 1} remaining)`,
      ]);
    } else {
      // Must wait in queue
      if (!waitingQueue.includes(thread)) {
        setWaitingQueue((q) => [...q, thread]);
        setLog((prev) => [
          ...prev,
          `${thread} executed P() (wait) with 0 permits available: BLOCKED in queue.`,
        ]);
      }
    }
  };

  const release = (thread: string) => {
    if (holders[thread] <= 0) {
      setLog((prev) => [...prev, `${thread} does not hold a permit to release.`]);
      return;
    }

    setHolders((h) => ({ ...h, [thread]: h[thread] - 1 }));

    if (waitingQueue.length > 0) {
      // Handoff to waiting thread directly
      const [nextThread, ...remainingQueue] = waitingQueue;
      setWaitingQueue(remainingQueue);
      setHolders((h) => ({ ...h, [nextThread]: h[nextThread] + 1 }));
      setLog((prev) => [
        ...prev,
        `${thread} executed V() (signal): permit released.`,
        `Permit immediately assigned to waiting ${nextThread} (unblocked).`,
      ]);
    } else {
      setPermits((p) => p + 1);
      setLog((prev) => [
        ...prev,
        `${thread} executed V() (signal): permit restored. (${permits + 1} available)`,
      ]);
    }
  };

  const reset = () => {
    setPermits(initialCapacity);
    setHolders({ 'Thread A': 0, 'Thread B': 0, 'Thread C': 0 });
    setWaitingQueue([]);
    setLog([]);
  };

  const threads = ['Thread A', 'Thread B', 'Thread C'] as const;

  return (
    <div className="p-4 rounded-lg border border-border bg-surface space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            Interactive Counting Semaphore & Capacity Guards
          </h3>
          <p className="text-xs text-text-muted mt-0.5 font-sans">
            Manage bounded capacity with Dijkstra&apos;s P() (wait) and V() (signal) operations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Button size="sm" variant="secondary" onClick={reset} className="text-[11px] h-7 gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
      </div>

      {/* Semaphore Capacity Overview */}
      <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2 text-xs">
          <span className="font-bold text-text-primary">
            Semaphore Capacity (Total: {initialCapacity})
          </span>
          <span className="text-xs font-bold text-accent">
            Available Permits: {permits} / {initialCapacity}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: initialCapacity }).map((_, i) => {
            const isAvailable = i < permits;
            return (
              <div
                key={i}
                className={`flex-1 p-2 rounded border text-center text-xs font-medium transition-colors ${
                  isAvailable
                    ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300'
                    : 'border-border/60 bg-surface/40 text-text-muted'
                }`}
              >
                Permit #{i + 1}: {isAvailable ? 'Available' : 'In use'}
              </div>
            );
          })}
        </div>

        <div className="text-xs text-text-muted flex items-center justify-between pt-1">
          <span>Semaphore Waiting Queue:</span>
          <span className="font-bold text-text-secondary">
            {waitingQueue.length > 0 ? (
              <span className="text-amber-400">[{waitingQueue.join(', ')}]</span>
            ) : (
              'Empty (0)'
            )}
          </span>
        </div>
      </div>

      {/* Thread Workers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {threads.map((thread) => {
          const isHolding = holders[thread] > 0;
          const isBlocked = waitingQueue.includes(thread);
          return (
            <div
              key={thread}
              className="p-3 rounded-lg border border-border/80 bg-background space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                <span className="font-bold text-text-primary">{thread}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                    isBlocked
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : isHolding
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-surface border-border text-text-secondary'
                  }`}
                >
                  {isBlocked ? 'BLOCKED' : isHolding ? 'HAS PERMIT' : 'IDLE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => acquire(thread)}
                  disabled={isHolding || isBlocked}
                  className="text-xs h-7 gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-accent" />
                  P() wait
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => release(thread)}
                  disabled={!isHolding}
                  className="text-xs h-7 gap-1"
                >
                  V() signal
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Output */}
      {log.length > 0 && (
        <div className="p-3 rounded-lg border border-border/60 bg-background text-xs space-y-1">
          <div className="text-xs text-text-muted font-medium">Semaphore activity log</div>
          <div className="space-y-0.5 max-h-24 overflow-y-auto text-[11px] text-text-secondary font-mono">
            {log.map((item, i) => (
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
