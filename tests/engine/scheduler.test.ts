import { describe, it, expect } from 'vitest';
import { ThreadScheduler, SimulationEngine, type ThreadState } from '../../src/engine';

describe('Thread Scheduler Modes & Determinism', () => {
  const makeThread = (id: string, count: number = 3): ThreadState => ({
    id,
    name: `Thread ${id}`,
    instructions: Array.from({ length: count }, (_, i) => ({
      op: 'ADD',
      target: 'val',
      value: i + 1,
    })),
    programCounter: 0,
    localMemory: { val: 0 },
    status: 'READY',
    clock: { values: {} },
  });

  it('rotates threads deterministically in ROUND_ROBIN mode', () => {
    const scheduler = new ThreadScheduler('ROUND_ROBIN');
    const threads = [makeThread('t1'), makeThread('t2'), makeThread('t3')];

    expect(scheduler.selectNextThread(threads)?.id).toBe('t1');
    expect(scheduler.selectNextThread(threads)?.id).toBe('t2');
    expect(scheduler.selectNextThread(threads)?.id).toBe('t3');
    expect(scheduler.selectNextThread(threads)?.id).toBe('t1');
  });

  it('skips blocked and completed threads in ROUND_ROBIN mode', () => {
    const scheduler = new ThreadScheduler('ROUND_ROBIN');
    const t1 = makeThread('t1');
    const t2: ThreadState = { ...makeThread('t2'), status: 'BLOCKED' };
    const t3: ThreadState = { ...makeThread('t3'), status: 'COMPLETED' };
    const t4 = makeThread('t4');

    const threads = [t1, t2, t3, t4];
    expect(scheduler.selectNextThread(threads)?.id).toBe('t1');
    expect(scheduler.selectNextThread(threads)?.id).toBe('t4');
    expect(scheduler.selectNextThread(threads)?.id).toBe('t1');
  });

  it('guarantees bit-for-bit identical execution in SEEDED_RANDOM mode given identical seeds', () => {
    const runSimulationWithSeed = (seed: number) => {
      const engine = new SimulationEngine({ schedulerMode: 'SEEDED_RANDOM', seed });
      const t1 = makeThread('t1', 5);
      const t2 = makeThread('t2', 5);
      const t3 = makeThread('t3', 5);

      engine.loadScenario([t1, t2, t3], {}, []);

      const executionOrder: string[] = [];
      let stepResult = engine.step();
      while (stepResult !== null && engine.getState().status !== 'COMPLETED') {
        executionOrder.push(stepResult.event.threadId);
        stepResult = engine.step();
      }
      return executionOrder;
    };

    const run1 = runSimulationWithSeed(4242);
    const run2 = runSimulationWithSeed(4242);
    const runDifferentSeed = runSimulationWithSeed(9999);

    // Bit-for-bit identical schedules with same seed
    expect(run1).toEqual(run2);
    expect(run1.length).toBeGreaterThan(0);
    // Different seed produces different schedule
    expect(run1).not.toEqual(runDifferentSeed);
  });
});
