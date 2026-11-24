import type { Instruction, MutexState, SchedulerMode, ThreadState } from '../core/types';

export interface ScenarioValidationResult {
  valid: boolean;
  errors: string[];
}

export interface CustomScenarioDefinition {
  id?: string;
  title: string;
  description?: string;
  schedulerMode?: SchedulerMode;
  sharedMemory: Record<string, number>;
  mutexes?: Array<{ id: string }>;
  threads: Array<{
    id: string;
    name: string;
    color?: 'thread-a' | 'thread-b' | 'thread-c';
    localMemory?: Record<string, number>;
    instructions: Instruction[];
  }>;
}

/**
 * Validates a concurrency simulation scenario definition before execution.
 * (Section 12: Security & Validation — safe validation with helpful diagnostics)
 */
export function validateScenario(
  threads: ThreadState[],
  mutexes: MutexState[] = [],
  sharedMemory: Record<string, number> = {}
): ScenarioValidationResult {
  const errors: string[] = [];

  if (!threads || threads.length === 0) {
    errors.push('A scenario must contain at least one thread.');
    return { valid: false, errors };
  }

  // Check unique thread IDs
  const threadIds = new Set<string>();
  for (const t of threads) {
    if (!t.id || t.id.trim() === '') {
      errors.push('Every thread must have a non-empty unique identifier.');
    } else if (threadIds.has(t.id)) {
      errors.push(`Duplicate thread ID "${t.id}" detected.`);
    } else {
      threadIds.add(t.id);
    }

    if (!t.instructions || t.instructions.length === 0) {
      errors.push(`Thread "${t.name || t.id}" must contain at least one instruction.`);
    }
  }

  // Check unique mutex IDs
  const mutexIds = new Set<string>();
  for (const m of mutexes) {
    if (!m.id || m.id.trim() === '') {
      errors.push('Every mutex must have a non-empty identifier.');
    } else if (mutexIds.has(m.id)) {
      errors.push(`Duplicate mutex ID "${m.id}" detected.`);
    } else {
      mutexIds.add(m.id);
    }
  }

  // Validate instructions
  for (const t of threads) {
    for (let i = 0; i < (t.instructions || []).length; i++) {
      const inst = t.instructions[i];
      if (!inst || !inst.op) {
        errors.push(`Thread "${t.id}" instruction ${i + 1} is invalid or has no operation.`);
        continue;
      }

      switch (inst.op) {
        case 'READ':
          if (!inst.source || !inst.target) {
            errors.push(
              `Thread "${t.id}" READ instruction at step ${i + 1} requires source and target.`
            );
          }
          if (inst.source && !Object.prototype.hasOwnProperty.call(sharedMemory, inst.source)) {
            errors.push(
              `Thread "${t.id}" READ instruction references undefined shared variable "${inst.source}".`
            );
          }
          break;

        case 'WRITE':
          if (!inst.source || !inst.target) {
            errors.push(
              `Thread "${t.id}" WRITE instruction at step ${i + 1} requires source and target.`
            );
          }
          break;

        case 'ADD':
          if (!inst.target || typeof inst.value !== 'number') {
            errors.push(
              `Thread "${t.id}" ADD instruction at step ${i + 1} requires target register and numeric value.`
            );
          }
          break;

        case 'LOCK':
        case 'UNLOCK':
          if (!inst.mutexId) {
            errors.push(
              `Thread "${t.id}" ${inst.op} instruction at step ${i + 1} requires mutexId.`
            );
          } else if (!mutexIds.has(inst.mutexId)) {
            errors.push(
              `Thread "${t.id}" ${inst.op} instruction references undeclared mutex "${inst.mutexId}".`
            );
          }
          break;

        default:
          errors.push(`Thread "${t.id}" instruction ${i + 1} has unsupported opcode.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a custom scenario configuration (e.g. from JSON import or user editing).
 */
export function validateCustomScenario(data: unknown): ScenarioValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Scenario data must be an object.'] };
  }

  const s = data as Partial<CustomScenarioDefinition>;

  if (!s.title || s.title.trim() === '') {
    errors.push('Scenario must have a title.');
  }

  if (!s.sharedMemory || typeof s.sharedMemory !== 'object') {
    errors.push('Scenario must define a sharedMemory object.');
  } else {
    for (const [varName, val] of Object.entries(s.sharedMemory)) {
      if (typeof val !== 'number') {
        errors.push(`Shared variable "${varName}" initial value must be a number.`);
      }
    }
  }

  if (!s.threads || !Array.isArray(s.threads) || s.threads.length === 0) {
    errors.push('Scenario must define at least one thread.');
  }

  // Convert to ThreadState and MutexState to run standard validator
  const dummyThreads: ThreadState[] = (s.threads || []).map((t) => ({
    id: t.id,
    name: t.name,
    instructions: t.instructions,
    programCounter: 0,
    localMemory: t.localMemory || {},
    status: 'READY',
    clock: { values: {} },
    color: t.color || 'thread-a',
  }));

  const dummyMutexes: MutexState[] = (s.mutexes || []).map((m) => ({
    id: m.id,
    owner: null,
    waitingQueue: [],
    releaseClock: { values: {} },
  }));

  const internalResult = validateScenario(dummyThreads, dummyMutexes, s.sharedMemory || {});
  errors.push(...internalResult.errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}
