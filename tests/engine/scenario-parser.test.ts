import { describe, it, expect } from 'vitest';
import {
  parseInstruction,
  parseInstructionLines,
  formatInstruction,
} from '../../src/engine/scenarios/scenario-parser';

describe('Phase 4: Assembly Instruction Parser & Formatter', () => {
  it('parses READ instruction with source and target', () => {
    const res1 = parseInstruction('READ counter INTO a');
    expect(res1.instruction).toEqual({ op: 'READ', source: 'counter', target: 'a' });

    const res2 = parseInstruction('read balance dep');
    expect(res2.instruction).toEqual({ op: 'READ', source: 'balance', target: 'dep' });
  });

  it('parses ADD instruction with local register and numeric value', () => {
    const res1 = parseInstruction('ADD a BY 1');
    expect(res1.instruction).toEqual({ op: 'ADD', target: 'a', value: 1 });

    const res2 = parseInstruction('add wdl -30');
    expect(res2.instruction).toEqual({ op: 'ADD', target: 'wdl', value: -30 });
  });

  it('parses WRITE instruction with local register and shared variable', () => {
    const res1 = parseInstruction('WRITE a INTO counter');
    expect(res1.instruction).toEqual({ op: 'WRITE', source: 'a', target: 'counter' });

    const res2 = parseInstruction('write dep balance');
    expect(res2.instruction).toEqual({ op: 'WRITE', source: 'dep', target: 'balance' });
  });

  it('parses LOCK and UNLOCK instructions with mutex identifiers', () => {
    const lockRes = parseInstruction('LOCK vault_mutex');
    expect(lockRes.instruction).toEqual({ op: 'LOCK', mutexId: 'vault_mutex' });

    const unlockRes = parseInstruction('UNLOCK vault_mutex');
    expect(unlockRes.instruction).toEqual({ op: 'UNLOCK', mutexId: 'vault_mutex' });
  });

  it('rejects malformed instructions with descriptive error messages', () => {
    expect(parseInstruction('FOOBAR 1 2').error).toContain('Unknown opcode');
    expect(parseInstruction('ADD a BY notanumber').error).toContain('Invalid number');
    expect(parseInstruction('LOCK').error).toContain('Invalid LOCK syntax');
    expect(parseInstruction('READ singleToken').error).toContain('Invalid READ syntax');
  });

  it('parses multi-line assembly scripts ignoring comments and blank lines', () => {
    const script = `
      # Initial counter setup
      READ counter INTO a
      
      // Compute increment
      ADD a BY 5
      WRITE a INTO counter
    `;

    const res = parseInstructionLines(script);
    expect(res.errors).toHaveLength(0);
    expect(res.instructions).toHaveLength(3);
    expect(res.instructions[1]).toEqual({ op: 'ADD', target: 'a', value: 5 });
  });

  it('accurately identifies syntax error lines in multi-line programs', () => {
    const script = `
      READ counter INTO a
      INVALID_OP code
      ADD a BY 1
    `;

    const res = parseInstructionLines(script);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].line).toBe(3);
    expect(res.errors[0].error).toContain('Unknown opcode');
  });

  it('formats instruction objects back to human-readable text', () => {
    expect(formatInstruction({ op: 'READ', source: 'counter', target: 'a' })).toBe(
      'READ counter INTO a'
    );
    expect(formatInstruction({ op: 'ADD', target: 'a', value: 10 })).toBe('ADD a BY 10');
    expect(formatInstruction({ op: 'WRITE', source: 'a', target: 'counter' })).toBe(
      'WRITE a INTO counter'
    );
    expect(formatInstruction({ op: 'LOCK', mutexId: 'm1' })).toBe('LOCK m1');
    expect(formatInstruction({ op: 'UNLOCK', mutexId: 'm1' })).toBe('UNLOCK m1');
  });
});
