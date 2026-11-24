import { describe, it, expect } from 'vitest';
import { exportScenarioToJson, importScenarioFromJson } from '../../src/services/export';
import type { CustomScenarioDefinition } from '../../src/engine/scenarios/scenario-validator';

describe('Phase 4: Scenario Export & Import Service', () => {
  const sampleScenario: CustomScenarioDefinition = {
    title: 'Exported Test Experiment',
    schedulerMode: 'MANUAL',
    sharedMemory: { counter: 100 },
    mutexes: [{ id: 'lock_a' }],
    threads: [
      {
        id: 't-1',
        name: 'Thread 1',
        color: 'thread-a',
        instructions: [
          { op: 'LOCK', mutexId: 'lock_a' },
          { op: 'READ', source: 'counter', target: 'r' },
          { op: 'UNLOCK', mutexId: 'lock_a' },
        ],
      },
    ],
  };

  it('serializes scenario to formatted JSON without executing code', () => {
    const jsonStr = exportScenarioToJson(sampleScenario);
    expect(typeof jsonStr).toBe('string');
    expect(jsonStr).toContain('"Exported Test Experiment"');
    expect(jsonStr).toContain('"LOCK"');
  });

  it('safely imports valid scenario JSON', () => {
    const jsonStr = exportScenarioToJson(sampleScenario);
    const result = importScenarioFromJson(jsonStr);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.scenario?.title).toBe('Exported Test Experiment');
    expect(result.scenario?.sharedMemory.counter).toBe(100);
  });

  it('rejects malformed JSON syntax with descriptive error', () => {
    const result = importScenarioFromJson('invalid json {[');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Failed to parse JSON');
  });

  it('rejects semantically invalid scenario on import', () => {
    const badScenario = {
      title: 'Bad Scenario',
      sharedMemory: {},
      mutexes: [],
      threads: [
        {
          id: 't1',
          name: 'Thread',
          instructions: [
            // Reading undefined variable
            { op: 'READ', source: 'non_existent_var', target: 'a' },
          ],
        },
      ],
    };

    const result = importScenarioFromJson(JSON.stringify(badScenario));
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('undefined shared variable'))).toBe(true);
  });
});
