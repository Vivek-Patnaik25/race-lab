import type { SimulationState } from './types';

/**
 * Creates an initial idle simulation state.
 * Real engine transitions are deferred to Phase 1.
 */
export function createInitialSimulationState(): SimulationState {
  return {
    sharedMemory: {},
    threads: [],
    mutexes: [],
    currentStep: 0,
    status: 'IDLE',
    activeRaces: [],
    activeDeadlock: null,
  };
}
