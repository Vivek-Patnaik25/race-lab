import { create } from 'zustand';
import type {
  SimulationState,
  SchedulerMode,
  ThreadState,
  MutexState,
  SimulationEvent,
} from '../engine';
import { SimulationEngine } from '../engine';
import { useGameStore } from './game-store';

// Singleton pure engine instance
const engine = new SimulationEngine({ schedulerMode: 'MANUAL' });

export interface SimulationStoreState {
  state: SimulationState;
  events: SimulationEvent[];
  isPlaying: boolean;
  speed: number;
  schedulerMode: SchedulerMode;
  selectedThreadId: string | null;
  activeChallengeId: string | null;
  manualStepsCount: number;
  hasSteppedBack: boolean;

  // Actions
  setSchedulerMode: (mode: SchedulerMode) => void;
  setSelectedThreadId: (id: string | null) => void;
  setActiveChallengeId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  loadScenario: (
    threads: ThreadState[],
    sharedMemory?: Record<string, number>,
    mutexes?: MutexState[]
  ) => void;
  step: (targetThreadId?: string) => boolean;
  stepThread: (threadId: string) => boolean;
  stepBackward: () => boolean;
  stepForward: () => boolean;
  seekToStep: (step: number) => boolean;
  resetSimulation: () => void;
}

export const useSimulationStore = create<SimulationStoreState>((set, get) => {
  const triggerLiveAchievementCheck = (
    nextState: SimulationState,
    manualSteps: number,
    steppedBack: boolean
  ) => {
    try {
      const gameStore = useGameStore.getState();
      const completedIds = Object.keys(gameStore.challenges).filter(
        (id) => gameStore.challenges[id].completed
      );

      gameStore.checkAchievements({
        activeRacesCount: nextState.activeRaces.length,
        hasSteppedBack: steppedBack,
        manualStepsCount: manualSteps,
        isDeadlocked: nextState.status === 'DEADLOCKED',
        completedMissionIds: completedIds,
      });
    } catch {
      // In isolated environments
    }
  };

  return {
    state: engine.getState(),
    events: engine.getEvents(),
    isPlaying: false,
    speed: 1,
    schedulerMode: 'MANUAL',
    selectedThreadId: null,
    activeChallengeId: null,
    manualStepsCount: 0,
    hasSteppedBack: false,

    setSchedulerMode: (schedulerMode) => {
      engine.setSchedulerMode(schedulerMode);
      set({ schedulerMode });
    },

    setSelectedThreadId: (selectedThreadId) => set({ selectedThreadId }),
    setActiveChallengeId: (activeChallengeId) => set({ activeChallengeId }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setSpeed: (speed) => set({ speed }),

    loadScenario: (threads, sharedMemory = {}, mutexes = []) => {
      engine.loadScenario(threads, sharedMemory, mutexes);
      const state = engine.getState();
      set({
        state,
        events: engine.getEvents(),
        selectedThreadId: threads.length > 0 ? threads[0].id : null,
        isPlaying: false,
        manualStepsCount: 0,
        hasSteppedBack: false,
      });
    },

    step: (targetThreadId?: string) => {
      const threadToStep = targetThreadId || get().selectedThreadId || undefined;
      const isManual = get().schedulerMode === 'MANUAL';
      const result = engine.step(threadToStep);
      if (result) {
        const nextState = engine.getState();
        const nextManualCount = isManual ? get().manualStepsCount + 1 : get().manualStepsCount;

        set({
          state: nextState,
          events: engine.getEvents(),
          manualStepsCount: nextManualCount,
        });

        triggerLiveAchievementCheck(nextState, nextManualCount, get().hasSteppedBack);
        return true;
      }
      return false;
    },

    stepThread: (threadId: string) => {
      const result = engine.step(threadId);
      if (result) {
        const nextState = engine.getState();
        const nextManualCount = get().manualStepsCount + 1;
        set({
          state: nextState,
          events: engine.getEvents(),
          selectedThreadId: threadId,
          manualStepsCount: nextManualCount,
        });

        triggerLiveAchievementCheck(nextState, nextManualCount, get().hasSteppedBack);
        return true;
      }
      return false;
    },

    stepBackward: () => {
      const prev = engine.stepBackward();
      if (prev) {
        set({
          state: prev,
          events: engine.getEvents(),
          hasSteppedBack: true,
        });

        triggerLiveAchievementCheck(prev, get().manualStepsCount, true);
        return true;
      }
      return false;
    },

    stepForward: () => {
      const next = engine.stepForward();
      if (next) {
        set({
          state: next,
          events: engine.getEvents(),
        });
        return true;
      }
      return false;
    },

    seekToStep: (step: number) => {
      const current = get().state.currentStep;
      const target = engine.seekToStep(step);
      if (target) {
        const steppedBack = step < current || get().hasSteppedBack;
        set({
          state: target,
          events: engine.getEvents(),
          hasSteppedBack: steppedBack,
        });

        triggerLiveAchievementCheck(target, get().manualStepsCount, steppedBack);
        return true;
      }
      return false;
    },

    resetSimulation: () => {
      engine.reset();
      set({
        state: engine.getState(),
        events: engine.getEvents(),
        isPlaying: false,
        manualStepsCount: 0,
        hasSteppedBack: false,
      });
    },
  };
});
