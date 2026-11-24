/**
 * RaceLab Engine Core Domain Contracts
 * Defined in Product Specification Section 7 & Section 4
 */

export type ThreadStatus = 'READY' | 'BLOCKED' | 'COMPLETED';

export type Instruction =
  | {
      op: 'READ';
      source: string;
      target: string;
    }
  | {
      op: 'ADD';
      target: string;
      value: number;
    }
  | {
      op: 'WRITE';
      target: string;
      source: string;
    }
  | {
      op: 'LOCK';
      mutexId: string;
    }
  | {
      op: 'UNLOCK';
      mutexId: string;
    };

export interface VectorClock {
  values: Record<string, number>;
}

export interface ThreadState {
  id: string;
  name: string;
  instructions: Instruction[];
  programCounter: number;
  localMemory: Record<string, number>;
  status: ThreadStatus;
  clock: VectorClock;
  color?: string;
}

export interface MutexState {
  id: string;
  owner: string | null;
  waitingQueue: string[];
  releaseClock: VectorClock;
}

export type SimulationStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'DEADLOCKED';

export type SchedulerMode = 'MANUAL' | 'ROUND_ROBIN' | 'SEEDED_RANDOM';

export interface MemoryAccessRecord {
  threadId: string;
  type: 'READ' | 'WRITE';
  variable: string;
  step: number;
  clock: VectorClock;
  value: number;
}

export interface RaceReport {
  id: string;
  variable: string;
  threadA: string;
  threadB: string;
  accessTypeA: 'READ' | 'WRITE';
  accessTypeB: 'READ' | 'WRITE';
  stepA: number;
  stepB: number;
  explanation: string;
  suggestedFix?: string;
}

export interface DeadlockReport {
  id: string;
  cycle: string[]; // Thread IDs involved in cycle
  waitingRelationships: Array<{ waitingThread: string; holdingThread: string; mutexId: string }>;
  explanation: string;
}

export interface SimulationEvent {
  step: number;
  threadId: string;
  instruction: Instruction;
  previousMemory: Record<string, number>;
  resultingMemory: Record<string, number>;
  previousThreadState: ThreadState;
  resultingThreadState: ThreadState;
  racesDetected: RaceReport[];
  deadlockDetected?: DeadlockReport;
  message: string;
}

export interface SimulationState {
  sharedMemory: Record<string, number>;
  threads: ThreadState[];
  mutexes: MutexState[];
  currentStep: number;
  status: SimulationStatus;
  activeRaces: RaceReport[];
  activeDeadlock: DeadlockReport | null;
}
