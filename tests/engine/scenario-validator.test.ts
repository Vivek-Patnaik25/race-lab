import { describe, it, expect } from 'vitest';
import {
  validateScenario,
  validateCustomScenario,
  type CustomScenarioDefinition,
} from '../../src/engine/scenarios/scenario-validator';
import type { ThreadState } from '../../src/engine/core/types';

describe('Phase 4: Scenario Validator', () => {
  const validThreads: ThreadState[] = [
    {
      id: 'thread-a',
      name: 'Thread A',
      instructions: [
        { op: 'READ', source: 'counter', target: 'a' },
        { op: 'ADD', target: 'a', value: 1 },
        { op: 'WRITE', source: 'a', target: 'counter' },
      ],
      programCounter: 0,
      localMemory: {},
      status: 'READY',
      clock: { values: {} },
      color: 'thread-a',
    },
  ];

  it('approves a completely valid scenario', () => {
    const res = validateScenario(validThreads, [], { counter: 0 });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rejects scenario with zero threads', () => {
    const res = validateScenario([], [], { counter: 0 });
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('A scenario must contain at least one thread.');
  });

  it('rejects duplicate thread IDs', () => {
    const dupeThreads = [validThreads[0], { ...validThreads[0] }];
    const res = validateScenario(dupeThreads, [], { counter: 0 });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('Duplicate thread ID'))).toBe(true);
  });

  it('rejects threads with zero instructions', () => {
    const emptyInstThreads: ThreadState[] = [
      {
        ...validThreads[0],
        instructions: [],
      },
    ];
    const res = validateScenario(emptyInstThreads, [], { counter: 0 });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('must contain at least one instruction'))).toBe(true);
  });

  it('rejects undeclared mutex references in LOCK/UNLOCK', () => {
    const badLockThreads: ThreadState[] = [
      {
        ...validThreads[0],
        instructions: [{ op: 'LOCK', mutexId: 'non_existent_mutex' }],
      },
    ];
    const res = validateScenario(badLockThreads, [], { counter: 0 });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('undeclared mutex "non_existent_mutex"'))).toBe(true);
  });

  it('rejects READ from undefined shared variable', () => {
    const res = validateScenario(validThreads, [], {}); // missing 'counter' in sharedMemory
    expect(res.valid).toBe(false);
    expect(
      res.errors.some((e) => e.includes('references undefined shared variable "counter"'))
    ).toBe(true);
  });

  it('validates custom scenario JSON definitions', () => {
    const custom: CustomScenarioDefinition = {
      title: 'Valid Custom Scenario',
      sharedMemory: { x: 10 },
      mutexes: [{ id: 'm1' }],
      threads: [
        {
          id: 't1',
          name: 'Worker',
          instructions: [
            { op: 'LOCK', mutexId: 'm1' },
            { op: 'READ', source: 'x', target: 'reg' },
            { op: 'UNLOCK', mutexId: 'm1' },
          ],
        },
      ],
    };

    const res = validateCustomScenario(custom);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rejects custom scenario with missing title or non-numeric memory', () => {
    const invalidTitle = validateCustomScenario({
      title: '',
      sharedMemory: { x: 10 },
      threads: [],
    });
    expect(invalidTitle.valid).toBe(false);
    expect(invalidTitle.errors.some((e) => e.includes('must have a title'))).toBe(true);

    const invalidMem = validateCustomScenario({
      title: 'Test',
      sharedMemory: { x: 'string' as unknown as number },
      threads: [],
    });
    expect(invalidMem.valid).toBe(false);
    expect(invalidMem.errors.some((e) => e.includes('must be a number'))).toBe(true);
  });
});
