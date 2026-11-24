import React, { useState } from 'react';
import { Lock, Unlock, ShieldCheck, Users, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const MutexWidget: React.FC = () => {
  const [owner, setOwner] = useState<string | null>(null);
  const [waitingQueue, setWaitingQueue] = useState<string[]>([]);
  const [threadAState, setThreadAState] = useState<'READY' | 'RUNNING' | 'BLOCKED'>('READY');
  const [threadBState, setThreadBState] = useState<'READY' | 'RUNNING' | 'BLOCKED'>('READY');
  const [releaseClock, setReleaseClock] = useState<string>('0');
  const [log, setLog] = useState<string[]>([]);

  const acquire = (thread: 'Thread A' | 'Thread B') => {
    if (owner === null) {
      // Direct acquisition
      setOwner(thread);
      if (thread === 'Thread A') setThreadAState('RUNNING');
      else setThreadBState('RUNNING');
      setLog((prev) => [...prev, `${thread} acquired Mutex M1 directly.`]);
    } else if (owner === thread) {
      setLog((prev) => [...prev, `${thread} already owns Mutex M1.`]);
    } else {
      // Mutex occupied -> enqueue and block
      if (!waitingQueue.includes(thread)) {
        setWaitingQueue((q) => [...q, thread]);
        if (thread === 'Thread A') setThreadAState('BLOCKED');
        else setThreadBState('BLOCKED');
        setLog((prev) => [
          ...prev,
          `${thread} attempted LOCK(M1) while held by ${owner} -> BLOCKED, added to FIFO queue.`,
        ]);
      }
    }
  };

  const release = (thread: 'Thread A' | 'Thread B') => {
    if (owner !== thread) {
      setLog((prev) => [...prev, `ERROR: ${thread} cannot unlock Mutex M1 (not the owner).`]);
      return;
    }

    const pubClock = `[${thread}: 2, Release: True]`;
    setReleaseClock(pubClock);

    if (waitingQueue.length > 0) {
      // FIFO handoff to next waiting thread
      const [nextThread, ...remainingQueue] = waitingQueue;
      setOwner(nextThread);
      setWaitingQueue(remainingQueue);
      if (nextThread === 'Thread A') setThreadAState('RUNNING');
      else setThreadBState('RUNNING');
      if (thread === 'Thread A') setThreadAState('READY');
      else setThreadBState('READY');

      setLog((prev) => [
        ...prev,
        `${thread} released Mutex M1 -> published clock ${pubClock}.`,
        `FIFO Handoff: Mutex M1 granted to ${nextThread} (unblocked).`,
      ]);
    } else {
      setOwner(null);
      if (thread === 'Thread A') setThreadAState('READY');
      else setThreadBState('READY');
      setLog((prev) => [
        ...prev,
        `${thread} released Mutex M1 -> Mutex is now FREE. Published clock ${pubClock}.`,
      ]);
    }
  };

  const reset = () => {
    setOwner(null);
    setWaitingQueue([]);
    setThreadAState('READY');
    setThreadBState('READY');
    setReleaseClock('0');
    setLog([]);
  };

  const runContentionScenario = () => {
    setOwner('Thread B');
    setWaitingQueue(['Thread A']);
    setThreadAState('BLOCKED');
    setThreadBState('RUNNING');
    setReleaseClock('[Thread A: 1, Thread B: 1]');
    setLog([
      'Thread B acquired Mutex M1.',
      'Thread A attempted LOCK(M1) -> Mutex occupied by Thread B.',
      'Thread A was enqueued into FIFO waiting queue and entered BLOCKED state.',
    ]);
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-surface space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            Interactive Mutex & FIFO Waiting Queue
          </h3>
          <p className="text-xs text-text-muted mt-0.5 font-sans">
            Observe mutual exclusion guarantees, FIFO queue ordering, and vector-clock release
            publishing.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Button
            size="sm"
            variant="ghost"
            onClick={runContentionScenario}
            className="text-[11px] h-7 text-accent hover:text-accent-hover"
          >
            Contention Scenario
          </Button>
          <Button size="sm" variant="secondary" onClick={reset} className="text-[11px] h-7 gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
      </div>

      {/* Mutex State Card */}
      <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2 text-xs">
          <div className="flex items-center gap-2">
            {owner ? (
              <Lock className="w-4 h-4 text-rose-400" />
            ) : (
              <Unlock className="w-4 h-4 text-emerald-400" />
            )}
            <span className="font-bold text-text-primary">Mutex M1</span>
          </div>

          <div>
            {owner ? (
              <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 font-bold text-xs">
                LOCKED (Owner: {owner})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold text-xs">
                FREE / UNLOCKED
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded bg-surface border border-border/60 flex items-center justify-between">
            <span className="text-text-muted flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-text-secondary" /> FIFO Waiting Queue:
            </span>
            <span className="font-bold text-text-primary">
              {waitingQueue.length > 0 ? (
                <span className="text-amber-400">[{waitingQueue.join(', ')}]</span>
              ) : (
                <span className="text-text-muted italic">Empty (0)</span>
              )}
            </span>
          </div>

          <div className="p-2.5 rounded bg-surface border border-border/60 flex items-center justify-between">
            <span className="text-text-muted flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Release Clock:
            </span>
            <span className="font-bold text-accent">{releaseClock}</span>
          </div>
        </div>
      </div>

      {/* Thread Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thread A */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
            <span className="font-bold text-blue-400">Thread A</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                threadAState === 'BLOCKED'
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : threadAState === 'RUNNING'
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-surface border-border text-text-secondary'
              }`}
            >
              STATE: {threadAState}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => acquire('Thread A')}
              disabled={threadAState === 'BLOCKED' || owner === 'Thread A'}
              className="text-xs h-8 gap-1.5"
            >
              <Lock className="w-3 h-3 text-blue-400" />
              LOCK(M1)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => release('Thread A')}
              disabled={owner !== 'Thread A'}
              className="text-xs h-8 gap-1.5"
            >
              <Unlock className="w-3 h-3 text-emerald-400" />
              UNLOCK(M1)
            </Button>
          </div>
        </div>

        {/* Thread B */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
            <span className="font-bold text-purple-400">Thread B</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                threadBState === 'BLOCKED'
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : threadBState === 'RUNNING'
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-surface border-border text-text-secondary'
              }`}
            >
              STATE: {threadBState}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => acquire('Thread B')}
              disabled={threadBState === 'BLOCKED' || owner === 'Thread B'}
              className="text-xs h-8 gap-1.5"
            >
              <Lock className="w-3 h-3 text-purple-400" />
              LOCK(M1)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => release('Thread B')}
              disabled={owner !== 'Thread B'}
              className="text-xs h-8 gap-1.5"
            >
              <Unlock className="w-3 h-3 text-emerald-400" />
              UNLOCK(M1)
            </Button>
          </div>
        </div>
      </div>

      {/* Log Output */}
      {log.length > 0 && (
        <div className="p-3 rounded-lg border border-border/60 bg-background text-xs space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
            Mutex Event Log:
          </div>
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
