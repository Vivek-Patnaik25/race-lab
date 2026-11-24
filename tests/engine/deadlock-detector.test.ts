import { describe, it, expect } from 'vitest';
import {
  DeadlockDetector,
  createMutex,
  createVectorClock,
  type MutexState,
  type ThreadState,
} from '../../src/engine';

describe('Wait-For Graph & Deadlock Detector', () => {
  const detector = new DeadlockDetector();

  const makeThread = (
    id: string,
    status: 'READY' | 'BLOCKED' | 'COMPLETED',
    mutexToLock: string
  ): ThreadState => ({
    id,
    name: `Thread ${id}`,
    instructions: [{ op: 'LOCK', mutexId: mutexToLock }],
    programCounter: 0,
    localMemory: {},
    status,
    clock: createVectorClock({ [id]: 0 }),
  });

  it('reports no deadlock when there are no circular wait conditions', () => {
    const m1: MutexState = { ...createMutex('m1'), owner: 'tA' };
    const m2: MutexState = { ...createMutex('m2'), owner: null };

    // tB is blocked on m1 (held by tA). But tA is READY, not waiting on anything.
    const tA: ThreadState = { ...makeThread('tA', 'READY', 'm2') };
    const tB: ThreadState = { ...makeThread('tB', 'BLOCKED', 'm1') };

    const report = detector.detectDeadlock([tA, tB], [m1, m2]);
    expect(report).toBeNull();
  });

  it('detects a 2-thread circular deadlock (A -> B -> A)', () => {
    // tA owns m1, is blocked on m2 (owned by tB)
    // tB owns m2, is blocked on m1 (owned by tA)
    const m1: MutexState = { ...createMutex('m1'), owner: 'tA' };
    const m2: MutexState = { ...createMutex('m2'), owner: 'tB' };

    const tA = makeThread('tA', 'BLOCKED', 'm2');
    const tB = makeThread('tB', 'BLOCKED', 'm1');

    const report = detector.detectDeadlock([tA, tB], [m1, m2]);
    expect(report).not.toBeNull();
    expect(report!.cycle).toContain('tA');
    expect(report!.cycle).toContain('tB');
    expect(report!.waitingRelationships.length).toBe(2);
    expect(report!.explanation).toContain('Circular wait condition identified');
  });

  it('detects a multi-thread circular deadlock (A -> B -> C -> A)', () => {
    const m1: MutexState = { ...createMutex('m1'), owner: 'tA' };
    const m2: MutexState = { ...createMutex('m2'), owner: 'tB' };
    const m3: MutexState = { ...createMutex('m3'), owner: 'tC' };

    const tA = makeThread('tA', 'BLOCKED', 'm2');
    const tB = makeThread('tB', 'BLOCKED', 'm3');
    const tC = makeThread('tC', 'BLOCKED', 'm1');

    const report = detector.detectDeadlock([tA, tB, tC], [m1, m2, m3]);
    expect(report).not.toBeNull();
    expect(report!.cycle).toContain('tA');
    expect(report!.cycle).toContain('tB');
    expect(report!.cycle).toContain('tC');
  });

  it('ignores unrelated ready and completed threads', () => {
    const m1: MutexState = { ...createMutex('m1'), owner: 'tA' };
    const m2: MutexState = { ...createMutex('m2'), owner: 'tB' };

    const tA = makeThread('tA', 'BLOCKED', 'm2');
    const tB = makeThread('tB', 'BLOCKED', 'm1');
    const tC: ThreadState = { ...makeThread('tC', 'COMPLETED', 'm1') };
    const tD: ThreadState = { ...makeThread('tD', 'READY', 'm1') };

    const report = detector.detectDeadlock([tA, tB, tC, tD], [m1, m2]);
    expect(report).not.toBeNull();
    expect(report!.cycle).toEqual(expect.arrayContaining(['tA', 'tB']));
    expect(report!.cycle).not.toContain('tC');
    expect(report!.cycle).not.toContain('tD');
  });
});
