import type { Instruction } from '../core/types';

export interface ParseInstructionResult {
  instruction: Instruction | null;
  error?: string;
}

export interface ParseInstructionLinesResult {
  instructions: Instruction[];
  errors: Array<{ line: number; raw: string; error: string }>;
}

/**
 * Parses a single human-readable assembly instruction line into an immutable Instruction object.
 *
 * Supported syntax:
 * - READ <shared_var> INTO <local_reg>
 * - ADD <local_reg> BY <number>
 * - WRITE <local_reg> INTO <shared_var>
 * - LOCK <mutex_id>
 * - UNLOCK <mutex_id>
 */
export function parseInstruction(rawText: string): ParseInstructionResult {
  const line = rawText.trim();
  if (!line) {
    return { instruction: null, error: 'Empty instruction line.' };
  }

  // Tokenize by whitespace
  const tokens = line.split(/\s+/);
  const op = tokens[0].toUpperCase();

  switch (op) {
    case 'READ': {
      // Syntax: READ <source> INTO <target> or READ <source> <target>
      if (tokens.length === 4 && tokens[2].toUpperCase() === 'INTO') {
        const source = tokens[1];
        const target = tokens[3];
        return { instruction: { op: 'READ', source, target } };
      }
      if (tokens.length === 3 && tokens[1].toUpperCase() !== 'INTO') {
        return { instruction: { op: 'READ', source: tokens[1], target: tokens[2] } };
      }
      return {
        instruction: null,
        error: 'Invalid READ syntax. Expected: READ <shared_var> INTO <local_reg>',
      };
    }

    case 'ADD': {
      // Syntax: ADD <target> BY <number> or ADD <target> <number>
      if (tokens.length === 4 && tokens[2].toUpperCase() === 'BY') {
        const target = tokens[1];
        const val = Number(tokens[3]);
        if (Number.isNaN(val)) {
          return { instruction: null, error: `Invalid number "${tokens[3]}" for ADD.` };
        }
        return { instruction: { op: 'ADD', target, value: val } };
      }
      if (tokens.length === 3 && tokens[1].toUpperCase() !== 'BY') {
        const val = Number(tokens[2]);
        if (Number.isNaN(val)) {
          return { instruction: null, error: `Invalid number "${tokens[2]}" for ADD.` };
        }
        return { instruction: { op: 'ADD', target: tokens[1], value: val } };
      }
      return {
        instruction: null,
        error: 'Invalid ADD syntax. Expected: ADD <local_reg> BY <number>',
      };
    }

    case 'WRITE': {
      // Syntax: WRITE <source_reg> INTO <target_var> or WRITE <source_reg> <target_var>
      if (tokens.length === 4 && tokens[2].toUpperCase() === 'INTO') {
        const source = tokens[1];
        const target = tokens[3];
        return { instruction: { op: 'WRITE', source, target } };
      }
      if (tokens.length === 3 && tokens[1].toUpperCase() !== 'INTO') {
        return { instruction: { op: 'WRITE', source: tokens[1], target: tokens[2] } };
      }
      return {
        instruction: null,
        error: 'Invalid WRITE syntax. Expected: WRITE <local_reg> INTO <shared_var>',
      };
    }

    case 'LOCK': {
      // Syntax: LOCK <mutex_id>
      if (tokens.length === 2) {
        return { instruction: { op: 'LOCK', mutexId: tokens[1] } };
      }
      return {
        instruction: null,
        error: 'Invalid LOCK syntax. Expected: LOCK <mutex_id>',
      };
    }

    case 'UNLOCK': {
      // Syntax: UNLOCK <mutex_id>
      if (tokens.length === 2) {
        return { instruction: { op: 'UNLOCK', mutexId: tokens[1] } };
      }
      return {
        instruction: null,
        error: 'Invalid UNLOCK syntax. Expected: UNLOCK <mutex_id>',
      };
    }

    default:
      return {
        instruction: null,
        error: `Unknown opcode "${op}". Supported operations: READ, ADD, WRITE, LOCK, UNLOCK.`,
      };
  }
}

/**
 * Parses multi-line instruction text into instructions and errors.
 * Ignores empty lines and comments (starting with # or //).
 */
export function parseInstructionLines(textOrLines: string | string[]): ParseInstructionLinesResult {
  const lines = Array.isArray(textOrLines) ? textOrLines : textOrLines.split('\n');

  const instructions: Instruction[] = [];
  const errors: Array<{ line: number; raw: string; error: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('//')) {
      continue; // Skip comments and empty lines
    }

    const res = parseInstruction(raw);
    if (res.instruction) {
      instructions.push(res.instruction);
    } else if (res.error) {
      errors.push({
        line: i + 1,
        raw,
        error: res.error,
      });
    }
  }

  return { instructions, errors };
}

/**
 * Serializes an Instruction object into standard human-readable assembly format.
 */
export function formatInstruction(inst: Instruction): string {
  switch (inst.op) {
    case 'READ':
      return `READ ${inst.source} INTO ${inst.target}`;
    case 'ADD':
      return `ADD ${inst.target} BY ${inst.value}`;
    case 'WRITE':
      return `WRITE ${inst.source} INTO ${inst.target}`;
    case 'LOCK':
      return `LOCK ${inst.mutexId}`;
    case 'UNLOCK':
      return `UNLOCK ${inst.mutexId}`;
  }
}
