import type { VectorClock } from '../core/types';

/**
 * Creates a new VectorClock, optionally initialized with values.
 */
export function createVectorClock(initialValues: Record<string, number> = {}): VectorClock {
  return {
    values: { ...initialValues },
  };
}

/**
 * Creates a deep copy of a VectorClock.
 */
export function cloneVectorClock(clock: VectorClock): VectorClock {
  return {
    values: { ...clock.values },
  };
}

/**
 * Increments the vector clock component for the specified thread.
 */
export function incrementClock(clock: VectorClock, threadId: string): VectorClock {
  return {
    values: {
      ...clock.values,
      [threadId]: (clock.values[threadId] || 0) + 1,
    },
  };
}

/**
 * Computes the element-wise maximum of two vector clocks.
 * V_merged[k] = max(V_A[k], V_B[k])
 */
export function mergeClocks(clockA: VectorClock, clockB: VectorClock): VectorClock {
  const merged: Record<string, number> = { ...clockA.values };

  for (const [threadId, val] of Object.entries(clockB.values)) {
    merged[threadId] = Math.max(merged[threadId] || 0, val);
  }

  return { values: merged };
}

/**
 * Checks if clockA is less than or equal to clockB (A <= B):
 * For all k: (clockA[k] || 0) <= (clockB[k] || 0)
 */
export function isLessThanOrEqual(clockA: VectorClock, clockB: VectorClock): boolean {
  const allKeys = new Set([...Object.keys(clockA.values), ...Object.keys(clockB.values)]);

  for (const key of allKeys) {
    const valA = clockA.values[key] || 0;
    const valB = clockB.values[key] || 0;
    if (valA > valB) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if event A strictly happened-before event B (A < B):
 * A <= B and A != B
 */
export function happensBefore(clockA: VectorClock, clockB: VectorClock): boolean {
  if (!isLessThanOrEqual(clockA, clockB)) {
    return false;
  }

  // Check that at least one component in B is strictly greater than A
  const allKeys = new Set([...Object.keys(clockA.values), ...Object.keys(clockB.values)]);
  for (const key of allKeys) {
    const valA = clockA.values[key] || 0;
    const valB = clockB.values[key] || 0;
    if (valB > valA) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if two vector clocks are concurrent (neither A <= B nor B <= A).
 * Two events with concurrent vector clocks have no causal happens-before ordering.
 */
export function areClocksConcurrent(clockA: VectorClock, clockB: VectorClock): boolean {
  return !isLessThanOrEqual(clockA, clockB) && !isLessThanOrEqual(clockB, clockA);
}
