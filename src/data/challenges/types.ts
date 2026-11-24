import type { MutexState, SimulationEvent, SimulationState, ThreadState } from '../../engine';

export interface ChallengeHint {
  id: string;
  tier: 1 | 2 | 3;
  title: string;
  content: string;
  costPenalty: number;
}

export interface SuccessEvaluation {
  isSuccess: boolean;
  reason: string;
  metrics?: {
    targetAchieved: boolean;
    racesFound: number;
    deadlockFound: boolean;
    finalSharedMemory: Record<string, number>;
  };
}

export interface ScoreBreakdown {
  baseScore: number;
  stepEfficiencyBonus: number;
  hintPenalty: number;
  totalScore: number;
  stars: 1 | 2 | 3;
  optimalSteps: number;
  actualSteps: number;
  hintsUsed: number;
}

export interface ChallengeDefinition {
  id: string;
  missionNumber: string;
  title: string;
  tier: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  estimatedDuration: string;
  concept: string;
  shortDescription: string;
  objective: string;
  threadCount: number;
  optimalSteps: number;
  initialSharedMemory: Record<string, number>;
  initialThreads: ThreadState[];
  initialMutexes?: MutexState[];
  hints: ChallengeHint[];
  explanation: string;
  evaluateSuccess: (state: SimulationState, events: SimulationEvent[]) => SuccessEvaluation;
}
