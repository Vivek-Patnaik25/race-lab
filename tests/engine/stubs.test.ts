import { describe, it, expect } from 'vitest';
import {
  createInitialSimulationState,
  ThreadScheduler,
  MemoryManager,
  createVectorClock,
  incrementClock,
  validateScenario,
} from '../../src/engine';

describe('RaceLab Engine Foundations (Phase 0)', () => {
  it('creates a valid initial simulation state', () => {
    const state = createInitialSimulationState();
    expect(state.status).toBe('IDLE');
    expect(state.currentStep).toBe(0);
    expect(state.threads).toEqual([]);
    expect(state.sharedMemory).toEqual({});
  });

  it('manages thread scheduler modes', () => {
    const scheduler = new ThreadScheduler('MANUAL');
    expect(scheduler.getMode()).toBe('MANUAL');

    scheduler.setMode('ROUND_ROBIN');
    expect(scheduler.getMode()).toBe('ROUND_ROBIN');
  });

  it('handles shared memory get/set', () => {
    const memory = new MemoryManager();
    expect(memory.getShared('counter')).toBeUndefined();

    memory.setShared('counter', 42);
    expect(memory.getShared('counter')).toBe(42);
  });

  it('initializes and increments vector clocks correctly', () => {
    const clock = createVectorClock();
    expect(clock.values).toEqual({});

    const updated = incrementClock(clock, 'thread-a');
    expect(updated.values['thread-a']).toBe(1);

    const stepTwo = incrementClock(updated, 'thread-a');
    expect(stepTwo.values['thread-a']).toBe(2);
  });

  it('validates scenarios with empty thread lists', () => {
    const validation = validateScenario([]);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});
