import { describe, it, expect } from 'vitest';
import {
  createVectorClock,
  cloneVectorClock,
  incrementClock,
  mergeClocks,
  isLessThanOrEqual,
  happensBefore,
  areClocksConcurrent,
} from '../../src/engine';

describe('Vector Clock & Causality Algebra', () => {
  it('initializes and clones vector clocks', () => {
    const vc1 = createVectorClock({ a: 1, b: 2 });
    expect(vc1.values).toEqual({ a: 1, b: 2 });

    const clone = cloneVectorClock(vc1);
    clone.values.a = 99;
    expect(vc1.values.a).toBe(1);
  });

  it('increments thread clock component', () => {
    let vc = createVectorClock();
    vc = incrementClock(vc, 'thread-1');
    vc = incrementClock(vc, 'thread-1');
    vc = incrementClock(vc, 'thread-2');

    expect(vc.values['thread-1']).toBe(2);
    expect(vc.values['thread-2']).toBe(1);
  });

  it('merges vector clocks by element-wise maximum', () => {
    const vcA = createVectorClock({ t1: 3, t2: 1 });
    const vcB = createVectorClock({ t1: 1, t2: 4, t3: 2 });

    const merged = mergeClocks(vcA, vcB);
    expect(merged.values).toEqual({
      t1: 3,
      t2: 4,
      t3: 2,
    });
  });

  it('evaluates isLessThanOrEqual (<=) correctly', () => {
    const c1 = createVectorClock({ a: 1, b: 1 });
    const c2 = createVectorClock({ a: 1, b: 2 });
    const c3 = createVectorClock({ a: 2, b: 1 });

    expect(isLessThanOrEqual(c1, c2)).toBe(true);
    expect(isLessThanOrEqual(c2, c1)).toBe(false);
    expect(isLessThanOrEqual(c1, c1)).toBe(true);

    // c2 vs c3 are concurrent
    expect(isLessThanOrEqual(c2, c3)).toBe(false);
    expect(isLessThanOrEqual(c3, c2)).toBe(false);
  });

  it('evaluates happensBefore (<) correctly', () => {
    const c1 = createVectorClock({ a: 1, b: 1 });
    const c2 = createVectorClock({ a: 1, b: 2 });

    expect(happensBefore(c1, c2)).toBe(true);
    expect(happensBefore(c2, c1)).toBe(false);
    // Identical clocks do not strictly happen-before
    expect(happensBefore(c1, c1)).toBe(false);
  });

  it('identifies concurrent clocks with no causal ordering', () => {
    const cA = createVectorClock({ t1: 2, t2: 0 });
    const cB = createVectorClock({ t1: 0, t2: 2 });

    expect(areClocksConcurrent(cA, cB)).toBe(true);
    expect(areClocksConcurrent(cB, cA)).toBe(true);

    // Ordered clocks are not concurrent
    const cC = createVectorClock({ t1: 2, t2: 3 });
    expect(areClocksConcurrent(cA, cC)).toBe(false);
  });
});
