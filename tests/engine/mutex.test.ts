import { describe, it, expect } from 'vitest';
import {
  createMutex,
  isMutexFree,
  attemptLock,
  releaseLock,
  createVectorClock,
  type ThreadState,
} from '../../src/engine';

describe('Mutex Synchronization & FIFO Waiter Fairness', () => {
  const makeThread = (id: string, clockVal: number = 0): ThreadState => ({
    id,
    name: `Thread ${id}`,
    instructions: [
      { op: 'LOCK', mutexId: 'm1' },
      { op: 'UNLOCK', mutexId: 'm1' },
    ],
    programCounter: 0,
    localMemory: {},
    status: 'READY',
    clock: createVectorClock({ [id]: clockVal }),
  });

  it('allows a free mutex to be acquired by an eligible thread', () => {
    const m = createMutex('m1');
    expect(isMutexFree(m)).toBe(true);

    const tA = makeThread('tA');
    const result = attemptLock(m, tA);

    expect(result.acquired).toBe(true);
    expect(result.updatedMutex.owner).toBe('tA');
    expect(result.updatedMutex.waitingQueue).toEqual([]);
    expect(result.updatedThread.programCounter).toBe(1);
    expect(result.updatedThread.status).toBe('READY');
    expect(result.updatedThread.clock.values.tA).toBe(1);
  });

  it('blocks a second thread when mutex is occupied and enqueues in FIFO order', () => {
    let m = createMutex('m1');
    const tA = makeThread('tA');
    const tB = makeThread('tB');
    const tC = makeThread('tC');

    // tA acquires
    const rA = attemptLock(m, tA);
    m = rA.updatedMutex;

    // tB attempts
    const rB = attemptLock(m, tB);
    expect(rB.acquired).toBe(false);
    expect(rB.updatedThread.status).toBe('BLOCKED');
    expect(rB.updatedThread.programCounter).toBe(0); // PC does not advance
    m = rB.updatedMutex;
    expect(m.waitingQueue).toEqual(['tB']);

    // tC attempts
    const rC = attemptLock(m, tC);
    expect(rC.acquired).toBe(false);
    expect(rC.updatedThread.status).toBe('BLOCKED');
    m = rC.updatedMutex;
    expect(m.waitingQueue).toEqual(['tB', 'tC']);
  });

  it('enforces FIFO order and prevents thread barging when unlocked', () => {
    let m = createMutex('m1');
    const tA = makeThread('tA');
    const tB = makeThread('tB');
    const tC = makeThread('tC');

    m = attemptLock(m, tA).updatedMutex;
    m = attemptLock(m, tB).updatedMutex;
    m = attemptLock(m, tC).updatedMutex;
    expect(m.waitingQueue).toEqual(['tB', 'tC']);

    // tA unlocks
    const unResult = releaseLock(m, { ...tA, programCounter: 1 });
    m = unResult.updatedMutex;
    expect(unResult.wokenThreadId).toBe('tB');
    expect(m.owner).toBeNull();
    // Notice: waitingQueue still holds tB as the priority waiter
    expect(m.waitingQueue).toEqual(['tB', 'tC']);

    // If an unrelated thread tD attempts to barge while tB is at head of queue:
    const tD = makeThread('tD');
    const bargeAttempt = attemptLock(m, tD);
    expect(bargeAttempt.acquired).toBe(false); // Barging prevented!
    expect(bargeAttempt.updatedThread.status).toBe('BLOCKED');
    m = bargeAttempt.updatedMutex;

    // When tB acquires:
    const tBResult = attemptLock(m, { ...tB, status: 'READY' });
    expect(tBResult.acquired).toBe(true);
    expect(tBResult.updatedMutex.owner).toBe('tB');
    // Now tC is at head of waiting queue
    expect(tBResult.updatedMutex.waitingQueue).toEqual(['tC', 'tD']);
  });

  it('publishes vector clock upon unlock and merges it upon acquire', () => {
    let m = createMutex('m1');
    const tA = makeThread('tA', 5);
    const tB = makeThread('tB', 2);

    // tA acquires, does work, unlocks
    const rA = attemptLock(m, tA);
    m = rA.updatedMutex;
    const unA = releaseLock(m, rA.updatedThread);
    m = unA.updatedMutex;

    // Mutex release clock must reflect tA's clock at unlock
    expect(m.releaseClock.values.tA).toBe(7); // initial 5 + lock(1) + unlock(1)

    // tB acquires m1
    const rB = attemptLock(m, tB);
    // tB clock must have merged tA's release clock!
    expect(rB.updatedThread.clock.values.tA).toBe(7);
    expect(rB.updatedThread.clock.values.tB).toBe(3); // 2 + lock(1)
  });

  it('rejects unlock attempt from a thread that does not own the mutex', () => {
    let m = createMutex('m1');
    const tA = makeThread('tA');
    const tB = makeThread('tB');

    m = attemptLock(m, tA).updatedMutex;

    expect(() => {
      releaseLock(m, tB);
    }).toThrow(/cannot unlock mutex/i);
  });
});
