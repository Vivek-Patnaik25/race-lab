import type { MutexState, ThreadState } from '../core/types';
import {
  cloneVectorClock,
  createVectorClock,
  incrementClock,
  mergeClocks,
} from '../analysis/vector-clock';

/**
 * Creates a new Mutex with an empty FIFO waiting queue and zeroed release clock.
 */
export function createMutex(id: string): MutexState {
  return {
    id,
    owner: null,
    waitingQueue: [],
    releaseClock: createVectorClock(),
  };
}

/**
 * Checks whether a mutex is currently free.
 */
export function isMutexFree(mutex: MutexState): boolean {
  return mutex.owner === null;
}

export interface LockAttemptResult {
  acquired: boolean;
  updatedMutex: MutexState;
  updatedThread: ThreadState;
}

/**
 * Attempts to acquire a mutex for a given thread under FIFO queue fairness.
 *
 * Rules (Section 4.5 & 8):
 * 1. If mutex is free and (waiting queue is empty OR current thread is at the head of queue):
 *    - Dequeue thread if at the head.
 *    - Merge published mutex release clock into thread clock.
 *    - Increment executing thread's vector clock.
 *    - Set owner = thread.id.
 *    - Advance thread program counter.
 * 2. If occupied or thread is not head of FIFO queue:
 *    - Mark thread BLOCKED.
 *    - Enqueue thread in waitingQueue (if not already enqueued).
 *    - Do NOT advance program counter.
 */
export function attemptLock(mutex: MutexState, thread: ThreadState): LockAttemptResult {
  if (mutex.owner === thread.id) {
    throw new Error(
      `Thread "${thread.id}" already owns mutex "${mutex.id}" (re-entrant locking is not permitted).`
    );
  }

  const isAtHeadOfQueue = mutex.waitingQueue.length > 0 && mutex.waitingQueue[0] === thread.id;
  const isQueueEmpty = mutex.waitingQueue.length === 0;

  if (mutex.owner === null && (isQueueEmpty || isAtHeadOfQueue)) {
    // Acquire mutex
    const nextQueue = isAtHeadOfQueue ? mutex.waitingQueue.slice(1) : [...mutex.waitingQueue];

    // Merge release clock: V_t = max(V_t, V_mutex)
    const mergedClock = mergeClocks(thread.clock, mutex.releaseClock);
    // Increment executing thread's clock
    const finalClock = incrementClock(mergedClock, thread.id);

    const updatedMutex: MutexState = {
      ...mutex,
      owner: thread.id,
      waitingQueue: nextQueue,
    };

    const updatedThread: ThreadState = {
      ...thread,
      status: 'READY',
      clock: finalClock,
      programCounter: thread.programCounter + 1,
    };

    return {
      acquired: true,
      updatedMutex,
      updatedThread,
    };
  }

  // Mutex is busy or other threads have FIFO priority
  const nextQueue = mutex.waitingQueue.includes(thread.id)
    ? [...mutex.waitingQueue]
    : [...mutex.waitingQueue, thread.id];

  const updatedMutex: MutexState = {
    ...mutex,
    waitingQueue: nextQueue,
  };

  const updatedThread: ThreadState = {
    ...thread,
    status: 'BLOCKED',
    // Program counter remains at the LOCK instruction
  };

  return {
    acquired: false,
    updatedMutex,
    updatedThread,
  };
}

export interface UnlockResult {
  updatedMutex: MutexState;
  updatedThread: ThreadState;
  wokenThreadId: string | null;
}

/**
 * Releases a mutex held by a thread.
 *
 * Rules (Section 4.5 & 8):
 * 1. Validate ownership: only the owner may unlock.
 * 2. Advance releasing thread's vector clock.
 * 3. Publish thread's vector clock to mutex release clock.
 * 4. Clear owner = null.
 * 5. Wake up oldest waiting thread if queue is non-empty.
 * 6. Advance thread program counter.
 */
export function releaseLock(mutex: MutexState, thread: ThreadState): UnlockResult {
  if (mutex.owner !== thread.id) {
    throw new Error(
      `Thread "${thread.id}" cannot unlock mutex "${mutex.id}" because it is currently owned by "${mutex.owner}".`
    );
  }

  // Advance releasing thread's clock
  const updatedThreadClock = incrementClock(thread.clock, thread.id);

  // Publish mutex release clock
  const updatedReleaseClock = cloneVectorClock(updatedThreadClock);

  // Oldest waiter is the head of waitingQueue
  const wokenThreadId = mutex.waitingQueue.length > 0 ? mutex.waitingQueue[0] : null;

  const updatedMutex: MutexState = {
    ...mutex,
    owner: null,
    releaseClock: updatedReleaseClock,
  };

  const updatedThread: ThreadState = {
    ...thread,
    clock: updatedThreadClock,
    programCounter: thread.programCounter + 1,
  };

  return {
    updatedMutex,
    updatedThread,
    wokenThreadId,
  };
}
