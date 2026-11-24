import { describe, it, expect } from 'vitest';
import { RaceDetector, createVectorClock, type MemoryAccessRecord } from '../../src/engine';

describe('Happens-Before Data Race Detector', () => {
  it('does NOT trigger a data race for concurrent READ/READ accesses', () => {
    const detector = new RaceDetector();

    const readA: MemoryAccessRecord = {
      threadId: 'tA',
      type: 'READ',
      variable: 'balance',
      step: 1,
      clock: createVectorClock({ tA: 1, tB: 0 }),
      value: 100,
    };

    const readB: MemoryAccessRecord = {
      threadId: 'tB',
      type: 'READ',
      variable: 'balance',
      step: 2,
      clock: createVectorClock({ tA: 0, tB: 1 }), // concurrent with readA
      value: 100,
    };

    const races = detector.checkAccess(readB, [readA]);
    expect(races.length).toBe(0);
    expect(detector.getAllRaces().length).toBe(0);
  });

  it('triggers a data race for unordered concurrent READ and WRITE accesses', () => {
    const detector = new RaceDetector();

    const readA: MemoryAccessRecord = {
      threadId: 'tA',
      type: 'READ',
      variable: 'counter',
      step: 1,
      clock: createVectorClock({ tA: 1, tB: 0 }),
      value: 0,
    };

    const writeB: MemoryAccessRecord = {
      threadId: 'tB',
      type: 'WRITE',
      variable: 'counter',
      step: 2,
      clock: createVectorClock({ tA: 0, tB: 1 }), // concurrent: readA <= writeB is false!
      value: 1,
    };

    const races = detector.checkAccess(writeB, [readA]);
    expect(races.length).toBe(1);
    expect(races[0].variable).toBe('counter');
    expect(races[0].threadA).toBe('tA');
    expect(races[0].threadB).toBe('tB');
    expect(races[0].accessTypeA).toBe('READ');
    expect(races[0].accessTypeB).toBe('WRITE');
    expect(races[0].explanation).toContain('Data race detected');
  });

  it('triggers a data race for unordered concurrent WRITE and WRITE accesses', () => {
    const detector = new RaceDetector();

    const writeA: MemoryAccessRecord = {
      threadId: 'tA',
      type: 'WRITE',
      variable: 'counter',
      step: 3,
      clock: createVectorClock({ tA: 2, tB: 0 }),
      value: 1,
    };

    const writeB: MemoryAccessRecord = {
      threadId: 'tB',
      type: 'WRITE',
      variable: 'counter',
      step: 4,
      clock: createVectorClock({ tA: 0, tB: 2 }), // concurrent
      value: 1,
    };

    const races = detector.checkAccess(writeB, [writeA]);
    expect(races.length).toBe(1);
    expect(races[0].explanation).toContain('Write-Write Conflict');
  });

  it('does NOT trigger a race report when accesses have a happens-before order', () => {
    const detector = new RaceDetector();

    const writeA: MemoryAccessRecord = {
      threadId: 'tA',
      type: 'WRITE',
      variable: 'counter',
      step: 2,
      clock: createVectorClock({ tA: 2, tB: 0 }),
      value: 1,
    };

    // tB synchronized with tA via mutex, so tA's clock (2) was merged into tB's clock!
    const writeB: MemoryAccessRecord = {
      threadId: 'tB',
      type: 'WRITE',
      variable: 'counter',
      step: 5,
      clock: createVectorClock({ tA: 2, tB: 3 }), // writeA.clock <= writeB.clock holds!
      value: 2,
    };

    const races = detector.checkAccess(writeB, [writeA]);
    expect(races.length).toBe(0);
    expect(detector.getAllRaces().length).toBe(0);
  });
});
