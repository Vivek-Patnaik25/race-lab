import { create } from 'zustand';
import {
  ACHIEVEMENTS_REGISTRY,
  type AchievementDefinition,
  type AchievementEvaluationContext,
  evaluateAchievements,
} from '../engine/scenarios/achievements';
import {
  type GamePersistenceData,
  persistenceService,
  type StoredChallengeProgress,
} from '../services/persistence';

export interface GameAchievementItem extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GameState {
  xp: number;
  completedMissionsCount: number;
  challenges: Record<string, StoredChallengeProgress>;
  unlockedHintIds: string[];
  achievements: GameAchievementItem[];
  recentAchievement: AchievementDefinition | null;
  isLoaded: boolean;

  // Actions
  loadFromPersistence: () => Promise<void>;
  unlockHint: (hintId: string) => void;
  isHintUnlocked: (hintId: string) => boolean;
  recordChallengeResult: (
    challengeId: string,
    result: {
      score: number;
      stars: 1 | 2 | 3;
      actualSteps: number;
      optimalSteps: number;
      hintsUsed: number;
    }
  ) => void;
  checkAchievements: (context: AchievementEvaluationContext) => string[];
  clearRecentAchievement: () => void;
  resetAllProgress: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => {
  // Initial achievements list from registry
  const initialAchievements: GameAchievementItem[] = ACHIEVEMENTS_REGISTRY.map((a) => ({
    ...a,
    unlocked: false,
  }));

  const persistCurrentState = (state: GameState) => {
    const data: GamePersistenceData = {
      version: 1,
      xp: state.xp,
      unlockedHintIds: state.unlockedHintIds,
      challenges: state.challenges,
      unlockedAchievements: state.achievements
        .filter((a) => a.unlocked && a.unlockedAt)
        .map((a) => ({ id: a.id, unlockedAt: a.unlockedAt! })),
      lastUpdated: new Date().toISOString(),
    };
    persistenceService.saveGameData(data).catch(() => {});
  };

  return {
    xp: 0,
    completedMissionsCount: 0,
    challenges: {},
    unlockedHintIds: [],
    achievements: initialAchievements,
    recentAchievement: null,
    isLoaded: false,

    loadFromPersistence: async () => {
      const data = await persistenceService.loadGameData();
      const unlockedMap = new Map<string, string>();
      for (const a of data.unlockedAchievements) {
        unlockedMap.set(a.id, a.unlockedAt);
      }

      const mergedAchievements: GameAchievementItem[] = ACHIEVEMENTS_REGISTRY.map((a) => ({
        ...a,
        unlocked: unlockedMap.has(a.id),
        unlockedAt: unlockedMap.get(a.id),
      }));

      const completedCount = Object.values(data.challenges).filter((c) => c.completed).length;

      set({
        xp: data.xp,
        completedMissionsCount: completedCount,
        challenges: data.challenges,
        unlockedHintIds: data.unlockedHintIds,
        achievements: mergedAchievements,
        isLoaded: true,
      });
    },

    unlockHint: (hintId: string) => {
      const state = get();
      if (state.unlockedHintIds.includes(hintId)) return;

      const updatedHints = [...state.unlockedHintIds, hintId];
      const nextState = {
        ...state,
        unlockedHintIds: updatedHints,
      };
      set({ unlockedHintIds: updatedHints });
      persistCurrentState(nextState);
    },

    isHintUnlocked: (hintId: string) => {
      return get().unlockedHintIds.includes(hintId);
    },

    recordChallengeResult: (challengeId, result) => {
      const state = get();
      const existing = state.challenges[challengeId];

      const isNewCompletion = !existing?.completed;
      const isBetterScore = !existing || result.score > (existing.bestScore || 0);

      const updatedRecord: StoredChallengeProgress = {
        challengeId,
        completed: true,
        bestScore: isBetterScore ? result.score : existing?.bestScore || result.score,
        stars: existing && existing.stars > result.stars ? existing.stars : result.stars,
        actualSteps: result.actualSteps,
        optimalSteps: result.optimalSteps,
        hintsUsed: result.hintsUsed,
        completedAt: new Date().toISOString(),
      };

      const nextChallenges = {
        ...state.challenges,
        [challengeId]: updatedRecord,
      };

      const xpEarned = isNewCompletion ? Math.round(result.score / 5) : 10;
      const nextXp = state.xp + xpEarned;
      const completedCount = Object.values(nextChallenges).filter((c) => c.completed).length;

      const nextState: GameState = {
        ...state,
        xp: nextXp,
        completedMissionsCount: completedCount,
        challenges: nextChallenges,
      };

      set({
        xp: nextXp,
        completedMissionsCount: completedCount,
        challenges: nextChallenges,
      });

      persistCurrentState(nextState);

      // Trigger achievement check
      get().checkAchievements({
        activeRacesCount: 0,
        hasSteppedBack: false,
        manualStepsCount: 0,
        isDeadlocked: false,
        completedMissionIds: Object.keys(nextChallenges).filter((k) => nextChallenges[k].completed),
        lastCompletedMission: {
          id: challengeId,
          score: result.score,
          stars: result.stars,
          steps: result.actualSteps,
          optimalSteps: result.optimalSteps,
          hintsUsed: result.hintsUsed,
        },
      });
    },

    checkAchievements: (context) => {
      const state = get();
      const currentUnlockedIds = state.achievements.filter((a) => a.unlocked).map((a) => a.id);

      const newlyUnlockedIds = evaluateAchievements(context, currentUnlockedIds);

      if (newlyUnlockedIds.length === 0) return [];

      let bonusXp = 0;
      const now = new Date().toISOString();
      let lastUnlockedAchievement: AchievementDefinition | null = null;

      const updatedAchievements = state.achievements.map((ach) => {
        if (newlyUnlockedIds.includes(ach.id)) {
          bonusXp += ach.xpReward;
          lastUnlockedAchievement = ach;
          return {
            ...ach,
            unlocked: true,
            unlockedAt: now,
          };
        }
        return ach;
      });

      const nextState: GameState = {
        ...state,
        xp: state.xp + bonusXp,
        achievements: updatedAchievements,
        recentAchievement: lastUnlockedAchievement,
      };

      set({
        xp: state.xp + bonusXp,
        achievements: updatedAchievements,
        recentAchievement: lastUnlockedAchievement,
      });

      persistCurrentState(nextState);
      return newlyUnlockedIds;
    },

    clearRecentAchievement: () => {
      set({ recentAchievement: null });
    },

    resetAllProgress: async () => {
      await persistenceService.clearProgress();
      const freshAchievements = ACHIEVEMENTS_REGISTRY.map((a) => ({
        ...a,
        unlocked: false,
      }));
      set({
        xp: 0,
        completedMissionsCount: 0,
        challenges: {},
        unlockedHintIds: [],
        achievements: freshAchievements,
        recentAchievement: null,
      });
    },
  };
});
