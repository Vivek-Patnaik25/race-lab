import type {
  DeadlockReport,
  Instruction,
  MemoryAccessRecord,
  MutexState,
  RaceReport,
  SimulationEvent,
  SimulationState,
  ThreadState,
} from './types';
import { cloneVectorClock, incrementClock } from '../analysis/vector-clock';
import { attemptLock, releaseLock } from '../synchronization/mutex';
import { RaceDetector } from '../analysis/race-detector';
import { DeadlockDetector } from '../analysis/deadlock-detector';

export interface StepExecutionResult {
  nextState: SimulationState;
  event: SimulationEvent;
  newAccessRecord?: MemoryAccessRecord;
  newRaces: RaceReport[];
  deadlockReport: DeadlockReport | null;
}

/**
 * Sandboxed Instruction Executor
 *
 * Implements discrete, deterministic evaluation of the RaceLab instruction set.
 * Adheres strictly to Section 8 of the Product Specification:
 * - No eval(), new Function(), or arbitrary user code generation.
 * - Formal happens-before vector clock tracking on all instructions.
 * - Fair FIFO mutex acquisition and atomic release with waiter wake-ups.
 * - Validation of shared and local variable access.
 */
export class InstructionExecutor {
  private raceDetector: RaceDetector;
  private deadlockDetector: DeadlockDetector;

  constructor(raceDetector?: RaceDetector, deadlockDetector?: DeadlockDetector) {
    this.raceDetector = raceDetector || new RaceDetector();
    this.deadlockDetector = deadlockDetector || new DeadlockDetector();
  }

  /**
   * Executes a single instruction for the specified thread.
   */
  public executeStep(
    state: SimulationState,
    executingThreadId: string,
    accessHistory: MemoryAccessRecord[] = []
  ): StepExecutionResult {
    if (state.status === 'COMPLETED') {
      throw new Error('Simulation has already completed; no further instructions can be executed.');
    }
    if (state.status === 'DEADLOCKED') {
      throw new Error('Simulation is deadlocked; all active threads are blocked.');
    }

    // Find the thread
    const threadIndex = state.threads.findIndex((t) => t.id === executingThreadId);
    if (threadIndex === -1) {
      throw new Error(`Thread with ID "${executingThreadId}" not found in active simulation.`);
    }

    const thread = state.threads[threadIndex];
    if (thread.status === 'COMPLETED') {
      throw new Error(`Thread "${thread.id}" has already completed execution.`);
    }
    if (thread.status === 'BLOCKED') {
      throw new Error(`Thread "${thread.id}" is currently BLOCKED and cannot be scheduled.`);
    }

    if (thread.programCounter >= thread.instructions.length) {
      throw new Error(`Thread "${thread.id}" has no more instructions to execute.`);
    }

    const instruction: Instruction = thread.instructions[thread.programCounter];
    const prevThreadState: ThreadState = {
      ...thread,
      localMemory: { ...thread.localMemory },
      clock: cloneVectorClock(thread.clock),
    };
    const prevMemory: Record<string, number> = { ...state.sharedMemory };

    // Working copies
    const nextSharedMemory: Record<string, number> = { ...state.sharedMemory };
    const nextThreads: ThreadState[] = state.threads.map((t) => ({
      ...t,
      localMemory: { ...t.localMemory },
      clock: cloneVectorClock(t.clock),
    }));
    const nextMutexes: MutexState[] = state.mutexes.map((m) => ({
      ...m,
      waitingQueue: [...m.waitingQueue],
      releaseClock: cloneVectorClock(m.releaseClock),
    }));

    let updatedThread: ThreadState = { ...nextThreads[threadIndex] };
    let newAccessRecord: MemoryAccessRecord | undefined;
    let newRaces: RaceReport[] = [];
    let eventMessage = '';

    const currentStepNum = state.currentStep + 1;

    switch (instruction.op) {
      case 'READ': {
        if (!Object.prototype.hasOwnProperty.call(nextSharedMemory, instruction.source)) {
          throw new Error(
            `Shared variable "${instruction.source}" does not exist in shared memory.`
          );
        }

        // Advance vector clock for the executing thread
        updatedThread.clock = incrementClock(updatedThread.clock, updatedThread.id);

        const val = nextSharedMemory[instruction.source];
        updatedThread.localMemory[instruction.target] = val;

        // Record access event
        newAccessRecord = {
          threadId: updatedThread.id,
          type: 'READ',
          variable: instruction.source,
          step: currentStepNum,
          clock: cloneVectorClock(updatedThread.clock),
          value: val,
        };

        // Check for race condition against access history
        newRaces = this.raceDetector.checkAccess(newAccessRecord, accessHistory);

        updatedThread.programCounter += 1;
        eventMessage = `Thread ${updatedThread.name} read ${instruction.source} (${val}) into ${instruction.target}`;
        break;
      }

      case 'ADD': {
        const currentVal = updatedThread.localMemory[instruction.target] ?? 0;
        updatedThread.clock = incrementClock(updatedThread.clock, updatedThread.id);
        const resultVal = currentVal + instruction.value;
        updatedThread.localMemory[instruction.target] = resultVal;

        updatedThread.programCounter += 1;
        eventMessage = `Thread ${updatedThread.name} added ${instruction.value} to ${instruction.target} (new value: ${resultVal})`;
        break;
      }

      case 'WRITE': {
        const val = updatedThread.localMemory[instruction.source] ?? 0;

        // Advance vector clock
        updatedThread.clock = incrementClock(updatedThread.clock, updatedThread.id);

        // Record access event
        newAccessRecord = {
          threadId: updatedThread.id,
          type: 'WRITE',
          variable: instruction.target,
          step: currentStepNum,
          clock: cloneVectorClock(updatedThread.clock),
          value: val,
        };

        // Check for race condition against access history
        newRaces = this.raceDetector.checkAccess(newAccessRecord, accessHistory);

        // Mutate shared memory
        nextSharedMemory[instruction.target] = val;
        updatedThread.programCounter += 1;
        eventMessage = `Thread ${updatedThread.name} wrote ${instruction.source} (${val}) into shared ${instruction.target}`;
        break;
      }

      case 'LOCK': {
        const mutexIndex = nextMutexes.findIndex((m) => m.id === instruction.mutexId);
        if (mutexIndex === -1) {
          throw new Error(`Mutex with ID "${instruction.mutexId}" does not exist.`);
        }

        const lockResult = attemptLock(nextMutexes[mutexIndex], updatedThread);
        nextMutexes[mutexIndex] = lockResult.updatedMutex;
        updatedThread = lockResult.updatedThread;

        if (lockResult.acquired) {
          eventMessage = `Thread ${updatedThread.name} acquired mutex "${instruction.mutexId}"`;
        } else {
          eventMessage = `Thread ${updatedThread.name} blocked waiting for mutex "${instruction.mutexId}" (held by ${nextMutexes[mutexIndex].owner})`;
        }
        break;
      }

      case 'UNLOCK': {
        const mutexIndex = nextMutexes.findIndex((m) => m.id === instruction.mutexId);
        if (mutexIndex === -1) {
          throw new Error(`Mutex with ID "${instruction.mutexId}" does not exist.`);
        }

        const unlockResult = releaseLock(nextMutexes[mutexIndex], updatedThread);
        nextMutexes[mutexIndex] = unlockResult.updatedMutex;
        updatedThread = unlockResult.updatedThread;

        // If a waiter was woken, mark it READY
        if (unlockResult.wokenThreadId) {
          const wokenIndex = nextThreads.findIndex((t) => t.id === unlockResult.wokenThreadId);
          if (wokenIndex !== -1 && nextThreads[wokenIndex].status === 'BLOCKED') {
            nextThreads[wokenIndex] = {
              ...nextThreads[wokenIndex],
              status: 'READY',
            };
          }
        }

        eventMessage = `Thread ${updatedThread.name} unlocked mutex "${instruction.mutexId}"`;
        break;
      }
    }

    // Check if thread finished execution
    if (updatedThread.programCounter >= updatedThread.instructions.length) {
      // Validate that thread is not holding any mutex upon termination (Section 4.5)
      const heldMutex = nextMutexes.find((m) => m.owner === updatedThread.id);
      if (heldMutex) {
        throw new Error(
          `Thread "${updatedThread.id}" finished all instructions while still holding mutex "${heldMutex.id}". ` +
            `A thread must not silently complete while holding a synchronization lock.`
        );
      }
      updatedThread.status = 'COMPLETED';
    }

    // Save updated thread back into array
    nextThreads[threadIndex] = updatedThread;

    // Check for deadlock among active threads
    const deadlockReport = this.deadlockDetector.detectDeadlock(nextThreads, nextMutexes);

    // Determine overall simulation status
    let nextStatus: SimulationState['status'] = state.status;
    if (deadlockReport) {
      nextStatus = 'DEADLOCKED';
    } else if (nextThreads.every((t) => t.status === 'COMPLETED')) {
      nextStatus = 'COMPLETED';
    } else if (nextStatus === 'IDLE') {
      nextStatus = 'RUNNING';
    }

    const nextState: SimulationState = {
      sharedMemory: nextSharedMemory,
      threads: nextThreads,
      mutexes: nextMutexes,
      currentStep: currentStepNum,
      status: nextStatus,
      activeRaces: [...state.activeRaces, ...newRaces],
      activeDeadlock: deadlockReport || state.activeDeadlock,
    };

    const event: SimulationEvent = {
      step: currentStepNum,
      threadId: updatedThread.id,
      instruction,
      previousMemory: prevMemory,
      resultingMemory: nextSharedMemory,
      previousThreadState: prevThreadState,
      resultingThreadState: {
        ...updatedThread,
        localMemory: { ...updatedThread.localMemory },
        clock: cloneVectorClock(updatedThread.clock),
      },
      racesDetected: newRaces,
      deadlockDetected: deadlockReport || undefined,
      message: eventMessage,
    };

    return {
      nextState,
      event,
      newAccessRecord,
      newRaces,
      deadlockReport,
    };
  }
}
