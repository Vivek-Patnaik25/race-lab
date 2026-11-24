import { describe, it, expect } from 'vitest';
import { SimulationEngine, createMutex, type ThreadState } from '../../src/engine';

describe('Mission 01 & 03: The Lost Update & Mutex Rescue Integration', () => {
  it('reproduces the classic Lost Update race condition (counter = 1 with race detected)', () => {
    const engine = new SimulationEngine({ schedulerMode: 'MANUAL' });

    const threadA: ThreadState = {
      id: 'thread-a',
      name: 'Thread A',
      instructions: [
        { op: 'READ', source: 'counter', target: 'a' },
        { op: 'ADD', target: 'a', value: 1 },
        { op: 'WRITE', target: 'counter', source: 'a' },
      ],
      programCounter: 0,
      localMemory: {},
      status: 'READY',
      clock: { values: {} },
    };

    const threadB: ThreadState = {
      id: 'thread-b',
      name: 'Thread B',
      instructions: [
        { op: 'READ', source: 'counter', target: 'b' },
        { op: 'ADD', target: 'b', value: 1 },
        { op: 'WRITE', target: 'counter', source: 'b' },
      ],
      programCounter: 0,
      localMemory: {},
      status: 'READY',
      clock: { values: {} },
    };

    engine.loadScenario([threadA, threadB], { counter: 0 }, []);

    // Interleaving Schedule:
    // 1. Thread A: READ counter (reads 0 into a)
    const step1 = engine.step('thread-a');
    expect(step1?.event.message).toContain('read counter (0) into a');
    expect(engine.getState().threads[0].localMemory.a).toBe(0);

    // 2. Thread B: READ counter (reads 0 into b concurrently)
    const step2 = engine.step('thread-b');
    expect(step2?.event.message).toContain('read counter (0) into b');
    expect(engine.getState().threads[1].localMemory.b).toBe(0);

    // 3. Thread A: ADD a BY 1 (a becomes 1)
    engine.step('thread-a');
    expect(engine.getState().threads[0].localMemory.a).toBe(1);

    // 4. Thread B: ADD b BY 1 (b becomes 1)
    engine.step('thread-b');
    expect(engine.getState().threads[1].localMemory.b).toBe(1);

    // 5. Thread A: WRITE a INTO counter (writes 1 into counter)
    const step5 = engine.step('thread-a');
    expect(engine.getState().sharedMemory.counter).toBe(1);
    // Write by A conflicts with previous concurrent read by B!
    expect(step5?.newRaces.length).toBeGreaterThan(0);

    // 6. Thread B: WRITE b INTO counter (overwrites 1 with 1, losing A's update!)
    const step6 = engine.step('thread-b');
    expect(step6?.newRaces.length).toBeGreaterThan(0);

    const finalState = engine.getState();

    // Final assertions:
    expect(finalState.status).toBe('COMPLETED');
    expect(finalState.sharedMemory.counter).toBe(1); // Lost update reproduced!
    expect(finalState.activeRaces.length).toBeGreaterThan(0); // Race successfully detected!
    expect(finalState.activeRaces[0].variable).toBe('counter');
  });

  it('guarantees mutual exclusion and prevents data races using a Mutex (counter = 2, 0 races)', () => {
    const engine = new SimulationEngine({ schedulerMode: 'MANUAL' });
    const mutex01 = createMutex('mutex-01');

    // Both threads protect their critical section with LOCK/UNLOCK
    const threadA: ThreadState = {
      id: 'thread-a',
      name: 'Thread A',
      instructions: [
        { op: 'LOCK', mutexId: 'mutex-01' },
        { op: 'READ', source: 'counter', target: 'a' },
        { op: 'ADD', target: 'a', value: 1 },
        { op: 'WRITE', target: 'counter', source: 'a' },
        { op: 'UNLOCK', mutexId: 'mutex-01' },
      ],
      programCounter: 0,
      localMemory: {},
      status: 'READY',
      clock: { values: {} },
    };

    const threadB: ThreadState = {
      id: 'thread-b',
      name: 'Thread B',
      instructions: [
        { op: 'LOCK', mutexId: 'mutex-01' },
        { op: 'READ', source: 'counter', target: 'b' },
        { op: 'ADD', target: 'b', value: 1 },
        { op: 'WRITE', target: 'counter', source: 'b' },
        { op: 'UNLOCK', mutexId: 'mutex-01' },
      ],
      programCounter: 0,
      localMemory: {},
      status: 'READY',
      clock: { values: {} },
    };

    engine.loadScenario([threadA, threadB], { counter: 0 }, [mutex01]);

    // Schedule:
    // A: LOCK
    engine.step('thread-a');
    expect(engine.getState().mutexes[0].owner).toBe('thread-a');

    // B: Attempts LOCK -> BLOCKED!
    engine.step('thread-b');
    expect(engine.getState().threads[1].status).toBe('BLOCKED');

    // A: READ, ADD, WRITE
    engine.step('thread-a');
    engine.step('thread-a');
    engine.step('thread-a');
    expect(engine.getState().sharedMemory.counter).toBe(1);

    // A: UNLOCK -> wakes up B
    const unlockStep = engine.step('thread-a');
    expect(unlockStep?.event.message).toContain('unlocked mutex');
    expect(engine.getState().threads[1].status).toBe('READY'); // B woken up!

    // B: LOCK (acquires lock, inherits A's vector clock!)
    engine.step('thread-b');
    expect(engine.getState().mutexes[0].owner).toBe('thread-b');

    // B: READ, ADD, WRITE, UNLOCK
    engine.step('thread-b');
    engine.step('thread-b');
    engine.step('thread-b');
    engine.step('thread-b');

    const finalState = engine.getState();

    // Final assertions:
    expect(finalState.status).toBe('COMPLETED');
    expect(finalState.sharedMemory.counter).toBe(2); // Perfectly preserved sum!
    expect(finalState.activeRaces.length).toBe(0); // Zero data races detected!
  });
});
