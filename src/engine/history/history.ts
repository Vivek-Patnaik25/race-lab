import type { MemoryAccessRecord, SimulationEvent, SimulationState } from '../core/types';
import { cloneVectorClock } from '../analysis/vector-clock';

/**
 * Deep clones an immutable SimulationState snapshot.
 */
export function cloneSimulationState(state: SimulationState): SimulationState {
  return {
    sharedMemory: { ...state.sharedMemory },
    threads: state.threads.map((t) => ({
      ...t,
      localMemory: { ...t.localMemory },
      clock: cloneVectorClock(t.clock),
    })),
    mutexes: state.mutexes.map((m) => ({
      ...m,
      waitingQueue: [...m.waitingQueue],
      releaseClock: cloneVectorClock(m.releaseClock),
    })),
    currentStep: state.currentStep,
    status: state.status,
    activeRaces: [...state.activeRaces],
    activeDeadlock: state.activeDeadlock ? { ...state.activeDeadlock } : null,
  };
}

/**
 * Execution History & Time Travel Manager
 *
 * Implements deterministic time travel through immutable state snapshots (Section 4.8):
 * - Step backward to past states.
 * - Replay past execution paths.
 * - Inspect exact vector clocks, memory states, and thread program counters at any step.
 */
export class ExecutionHistoryManager {
  private snapshots: SimulationState[] = [];
  private events: SimulationEvent[] = [];
  private accessHistory: MemoryAccessRecord[] = [];
  private currentCursor: number = 0;

  constructor(initialState?: SimulationState) {
    if (initialState) {
      this.reset(initialState);
    }
  }

  /**
   * Resets history to the given initial state at Step 0.
   */
  public reset(initialState: SimulationState): void {
    this.snapshots = [cloneSimulationState(initialState)];
    this.events = [];
    this.accessHistory = [];
    this.currentCursor = 0;
  }

  /**
   * Records a completed execution step and its state snapshot.
   */
  public recordStep(
    state: SimulationState,
    event: SimulationEvent,
    accessRecord?: MemoryAccessRecord
  ): void {
    // If we branched or executed after rewinding, truncate future replay snapshots
    if (this.currentCursor < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentCursor + 1);
      this.events = this.events.slice(0, this.currentCursor);
    }

    this.snapshots.push(cloneSimulationState(state));
    this.events.push({ ...event });

    if (accessRecord) {
      this.accessHistory.push({
        ...accessRecord,
        clock: cloneVectorClock(accessRecord.clock),
      });
    }

    this.currentCursor = this.snapshots.length - 1;
  }

  public getCurrentCursor(): number {
    return this.currentCursor;
  }

  public getTotalSteps(): number {
    return Math.max(0, this.snapshots.length - 1);
  }

  public canStepBackward(): boolean {
    return this.currentCursor > 0;
  }

  public canStepForward(): boolean {
    return this.currentCursor < this.snapshots.length - 1;
  }

  /**
   * Navigates backward one step, returning the previous state snapshot.
   */
  public stepBackward(): SimulationState | null {
    if (!this.canStepBackward()) {
      return null;
    }
    this.currentCursor--;
    return cloneSimulationState(this.snapshots[this.currentCursor]);
  }

  /**
   * Navigates forward one step through recorded replay history.
   */
  public stepForward(): SimulationState | null {
    if (!this.canStepForward()) {
      return null;
    }
    this.currentCursor++;
    return cloneSimulationState(this.snapshots[this.currentCursor]);
  }

  /**
   * Seeks directly to a specific historical step snapshot.
   */
  public seekToStep(step: number): SimulationState | null {
    if (step < 0 || step >= this.snapshots.length) {
      return null;
    }
    this.currentCursor = step;
    return cloneSimulationState(this.snapshots[step]);
  }

  public getCurrentSnapshot(): SimulationState {
    return cloneSimulationState(this.snapshots[this.currentCursor]);
  }

  public getEvents(): SimulationEvent[] {
    return [...this.events];
  }

  public getSnapshots(): SimulationState[] {
    return this.snapshots.map(cloneSimulationState);
  }

  public getAccessHistory(): MemoryAccessRecord[] {
    return [...this.accessHistory];
  }
}
