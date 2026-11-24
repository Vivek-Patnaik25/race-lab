import { describe, it, expect } from 'vitest';
import {
  ExecutionHistoryManager,
  createInitialSimulationState,
  type SimulationEvent,
  type SimulationState,
} from '../../src/engine';

describe('Execution History & Time Travel Replay', () => {
  const makeDummyState = (step: number, counterVal: number): SimulationState => ({
    ...createInitialSimulationState(),
    currentStep: step,
    sharedMemory: { counter: counterVal },
  });

  const makeDummyEvent = (step: number): SimulationEvent => ({
    step,
    threadId: 'tA',
    instruction: { op: 'ADD', target: 'a', value: 1 },
    previousMemory: { counter: step - 1 },
    resultingMemory: { counter: step },
    previousThreadState: {
      id: 'tA',
      name: 'Thread A',
      instructions: [],
      programCounter: step - 1,
      localMemory: {},
      status: 'READY',
      clock: { values: { tA: step - 1 } },
    },
    resultingThreadState: {
      id: 'tA',
      name: 'Thread A',
      instructions: [],
      programCounter: step,
      localMemory: {},
      status: 'READY',
      clock: { values: { tA: step } },
    },
    racesDetected: [],
    message: `Step ${step}`,
  });

  it('records step snapshots and events sequentially', () => {
    const initial = makeDummyState(0, 0);
    const history = new ExecutionHistoryManager(initial);

    expect(history.getTotalSteps()).toBe(0);
    expect(history.getCurrentCursor()).toBe(0);

    const s1 = makeDummyState(1, 10);
    history.recordStep(s1, makeDummyEvent(1));

    const s2 = makeDummyState(2, 20);
    history.recordStep(s2, makeDummyEvent(2));

    expect(history.getTotalSteps()).toBe(2);
    expect(history.getCurrentCursor()).toBe(2);
    expect(history.getCurrentSnapshot().sharedMemory.counter).toBe(20);
  });

  it('steps backward and forward through history snapshots', () => {
    const history = new ExecutionHistoryManager(makeDummyState(0, 0));
    history.recordStep(makeDummyState(1, 10), makeDummyEvent(1));
    history.recordStep(makeDummyState(2, 20), makeDummyEvent(2));
    history.recordStep(makeDummyState(3, 30), makeDummyEvent(3));

    expect(history.canStepBackward()).toBe(true);

    // Step back to Step 2
    const back1 = history.stepBackward();
    expect(back1?.currentStep).toBe(2);
    expect(back1?.sharedMemory.counter).toBe(20);

    // Step back to Step 1
    const back2 = history.stepBackward();
    expect(back2?.currentStep).toBe(1);
    expect(back2?.sharedMemory.counter).toBe(10);

    // Step back to Step 0
    const back3 = history.stepBackward();
    expect(back3?.currentStep).toBe(0);
    expect(back3?.sharedMemory.counter).toBe(0);
    expect(history.canStepBackward()).toBe(false);

    // Step forward along replay
    const fwd1 = history.stepForward();
    expect(fwd1?.currentStep).toBe(1);
    expect(fwd1?.sharedMemory.counter).toBe(10);
  });

  it('seeks directly to arbitrary steps', () => {
    const history = new ExecutionHistoryManager(makeDummyState(0, 0));
    history.recordStep(makeDummyState(1, 100), makeDummyEvent(1));
    history.recordStep(makeDummyState(2, 200), makeDummyEvent(2));

    const snapshot = history.seekToStep(1);
    expect(snapshot?.sharedMemory.counter).toBe(100);
    expect(history.getCurrentCursor()).toBe(1);
  });
});
