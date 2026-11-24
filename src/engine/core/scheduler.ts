import type { SchedulerMode, ThreadState } from './types';

/**
 * Deterministic 32-bit pseudo-random number generator (Mulberry32).
 */
export function createMulberry32(seed: number): () => number {
  let s = Math.floor(seed) >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Thread Scheduler
 *
 * Supports:
 * - MANUAL: Explicit thread execution selected by the user.
 * - ROUND_ROBIN: Deterministic cyclic rotation among eligible threads.
 * - SEEDED_RANDOM: Deterministic pseudo-random selection using a reproducible seed.
 *
 * In all modes, BLOCKED and COMPLETED threads are skipped.
 */
export class ThreadScheduler {
  private mode: SchedulerMode;
  private seed: number;
  private prng: () => number;
  private roundRobinIndex: number = 0;

  constructor(mode: SchedulerMode = 'MANUAL', seed: number = 1337) {
    this.mode = mode;
    this.seed = seed;
    this.prng = createMulberry32(seed);
  }

  public getMode(): SchedulerMode {
    return this.mode;
  }

  public setMode(mode: SchedulerMode): void {
    this.mode = mode;
  }

  public getSeed(): number {
    return this.seed;
  }

  public setSeed(seed: number): void {
    this.seed = seed;
    this.prng = createMulberry32(seed);
  }

  public reset(): void {
    this.roundRobinIndex = 0;
    this.prng = createMulberry32(this.seed);
  }

  /**
   * Filters threads to only those eligible to execute (status === 'READY').
   */
  public getEligibleThreads(threads: ThreadState[]): ThreadState[] {
    return threads.filter((t) => t.status === 'READY');
  }

  /**
   * Selects the next thread to execute based on the active scheduling mode.
   * If targetThreadId is specified (in MANUAL mode), that thread is selected if eligible.
   */
  public selectNextThread(threads: ThreadState[], targetThreadId?: string): ThreadState | null {
    const eligible = this.getEligibleThreads(threads);
    if (eligible.length === 0) {
      return null;
    }

    if (this.mode === 'MANUAL') {
      if (targetThreadId) {
        const found = eligible.find((t) => t.id === targetThreadId);
        return found || null;
      }
      return eligible[0];
    }

    if (this.mode === 'ROUND_ROBIN') {
      const selected = eligible[this.roundRobinIndex % eligible.length];
      this.roundRobinIndex++;
      return selected;
    }

    if (this.mode === 'SEEDED_RANDOM') {
      const randomIndex = Math.floor(this.prng() * eligible.length);
      return eligible[randomIndex];
    }

    return eligible[0];
  }
}
