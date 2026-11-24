import type {
  MutexState,
  SchedulerMode,
  SimulationEvent,
  SimulationState,
  ThreadState,
} from './types';
import { createInitialSimulationState } from './state';
import { InstructionExecutor, type StepExecutionResult } from './executor';
import { ThreadScheduler } from './scheduler';
import { RaceDetector } from '../analysis/race-detector';
import { DeadlockDetector } from '../analysis/deadlock-detector';
import { ExecutionHistoryManager } from '../history/history';
import { createVectorClock } from '../analysis/vector-clock';
import { validateScenario } from '../scenarios/scenario-validator';

export interface SimulationEngineOptions {
  schedulerMode?: SchedulerMode;
  seed?: number;
}

/**
 * Top-Level Deterministic Simulation Engine
 *
 * Coordinates execution, vector clocks, race detection, deadlock analysis,
 * scheduling, and time-travel history.
 */
export class SimulationEngine {
  private state: SimulationState;
  private executor: InstructionExecutor;
  private scheduler: ThreadScheduler;
  private raceDetector: RaceDetector;
  private deadlockDetector: DeadlockDetector;
  private history: ExecutionHistoryManager;

  constructor(options: SimulationEngineOptions = {}) {
    this.raceDetector = new RaceDetector();
    this.deadlockDetector = new DeadlockDetector();
    this.executor = new InstructionExecutor(this.raceDetector, this.deadlockDetector);
    this.scheduler = new ThreadScheduler(options.schedulerMode || 'MANUAL', options.seed || 1337);
    this.state = createInitialSimulationState();
    this.history = new ExecutionHistoryManager(this.state);
  }

  /**
   * Loads and validates a new scenario, initializing vector clocks, memory, and history.
   */
  public loadScenario(
    threads: ThreadState[],
    sharedMemory: Record<string, number> = {},
    mutexes: MutexState[] = []
  ): void {
    const validation = validateScenario(threads, mutexes, sharedMemory);
    if (!validation.valid) {
      throw new Error(`Scenario validation failed:\n- ${validation.errors.join('\n- ')}`);
    }

    // Initialize all thread vector clocks and statuses
    const initializedThreads: ThreadState[] = threads.map((t) => ({
      ...t,
      programCounter: 0,
      localMemory: { ...(t.localMemory || {}) },
      status: 'READY',
      clock: createVectorClock({ [t.id]: 0 }),
    }));

    const initializedMutexes: MutexState[] = mutexes.map((m) => ({
      ...m,
      owner: null,
      waitingQueue: [],
      releaseClock: createVectorClock(),
    }));

    this.state = {
      sharedMemory: { ...sharedMemory },
      threads: initializedThreads,
      mutexes: initializedMutexes,
      currentStep: 0,
      status: 'IDLE',
      activeRaces: [],
      activeDeadlock: null,
    };

    this.raceDetector.reset();
    this.scheduler.reset();
    this.history.reset(this.state);
  }

  /**
   * Executes a single instruction step.
   * In MANUAL mode, targetThreadId can be specified.
   * If replaying historical snapshots (cursor < totalSteps), steps forward in history.
   */
  public step(targetThreadId?: string): StepExecutionResult | null {
    // If the user rewound and then calls step forward without target thread, advance replay
    if (!targetThreadId && this.history.canStepForward()) {
      const replayedState = this.history.stepForward()!;
      this.state = replayedState;
      const events = this.history.getEvents();
      const event = events[replayedState.currentStep - 1];
      return {
        nextState: replayedState,
        event,
        newRaces: [],
        deadlockReport: replayedState.activeDeadlock,
      };
    }

    if (this.state.status === 'COMPLETED' || this.state.status === 'DEADLOCKED') {
      return null;
    }

    // Select thread
    const selectedThread = this.scheduler.selectNextThread(this.state.threads, targetThreadId);
    if (!selectedThread) {
      return null;
    }

    // Execute instruction
    const accessHistory = this.history.getAccessHistory();
    const result = this.executor.executeStep(this.state, selectedThread.id, accessHistory);

    this.state = result.nextState;
    this.history.recordStep(this.state, result.event, result.newAccessRecord);

    return result;
  }

  /**
   * Rewinds simulation execution by one step (time travel).
   */
  public stepBackward(): SimulationState | null {
    const prevState = this.history.stepBackward();
    if (prevState) {
      this.state = prevState;
      return prevState;
    }
    return null;
  }

  /**
   * Advances simulation forward along previously recorded replay history.
   */
  public stepForward(): SimulationState | null {
    const nextState = this.history.stepForward();
    if (nextState) {
      this.state = nextState;
      return nextState;
    }
    return null;
  }

  /**
   * Seeks to a specific step in execution history.
   */
  public seekToStep(step: number): SimulationState | null {
    const targetState = this.history.seekToStep(step);
    if (targetState) {
      this.state = targetState;
      return targetState;
    }
    return null;
  }

  /**
   * Resets simulation back to Step 0.
   */
  public reset(): void {
    const initial = this.history.seekToStep(0);
    if (initial) {
      this.state = initial;
      this.raceDetector.reset();
      this.scheduler.reset();
      this.history.reset(initial);
    }
  }

  public getState(): SimulationState {
    return { ...this.state };
  }

  public getEvents(): SimulationEvent[] {
    return this.history.getEvents();
  }

  public getHistory(): ExecutionHistoryManager {
    return this.history;
  }

  public getScheduler(): ThreadScheduler {
    return this.scheduler;
  }

  public setSchedulerMode(mode: SchedulerMode, seed?: number): void {
    this.scheduler.setMode(mode);
    if (seed !== undefined) {
      this.scheduler.setSeed(seed);
    }
  }

  public getRaceDetector(): RaceDetector {
    return this.raceDetector;
  }

  public getDeadlockDetector(): DeadlockDetector {
    return this.deadlockDetector;
  }
}
