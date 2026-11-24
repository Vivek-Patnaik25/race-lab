import { describe, it, expect } from 'vitest';
import {
  evaluateAchievements,
  type AchievementEvaluationContext,
} from '../../src/engine/scenarios/achievements';

describe('Phase 3: Achievement Evaluation Engine', () => {
  it('unlocks First Race when a data race is detected', () => {
    const ctx: AchievementEvaluationContext = {
      activeRacesCount: 1,
      hasSteppedBack: false,
      manualStepsCount: 0,
      isDeadlocked: false,
      completedMissionIds: [],
    };

    const unlocked = evaluateAchievements(ctx, []);
    expect(unlocked).toContain('first-race');
  });

  it('unlocks Time Traveler when stepping backward in history', () => {
    const ctx: AchievementEvaluationContext = {
      activeRacesCount: 0,
      hasSteppedBack: true,
      manualStepsCount: 0,
      isDeadlocked: false,
      completedMissionIds: [],
    };

    const unlocked = evaluateAchievements(ctx, []);
    expect(unlocked).toContain('time-traveler');
  });

  it('unlocks Chaos Controller when manual thread stepping is used', () => {
    const ctx: AchievementEvaluationContext = {
      activeRacesCount: 0,
      hasSteppedBack: false,
      manualStepsCount: 3,
      isDeadlocked: false,
      completedMissionIds: [],
    };

    const unlocked = evaluateAchievements(ctx, []);
    expect(unlocked).toContain('chaos-controller');
  });

  it('unlocks Lock It Down on Mission 03 completion', () => {
    const ctx: AchievementEvaluationContext = {
      activeRacesCount: 0,
      hasSteppedBack: false,
      manualStepsCount: 0,
      isDeadlocked: false,
      completedMissionIds: ['mission-03'],
    };

    const unlocked = evaluateAchievements(ctx, []);
    expect(unlocked).toContain('lock-it-down');
  });

  it('unlocks Deadlock Hunter when deadlock cycle is detected', () => {
    const ctx: AchievementEvaluationContext = {
      activeRacesCount: 0,
      hasSteppedBack: false,
      manualStepsCount: 0,
      isDeadlocked: true,
      completedMissionIds: [],
    };

    const unlocked = evaluateAchievements(ctx, []);
    expect(unlocked).toContain('no-more-deadlocks');
  });

  it('unlocks Bug Hunter only when all five missions are completed', () => {
    const partialCtx: AchievementEvaluationContext = {
      activeRacesCount: 0,
      hasSteppedBack: false,
      manualStepsCount: 0,
      isDeadlocked: false,
      completedMissionIds: ['mission-01', 'mission-02', 'mission-03', 'mission-04'],
    };
    expect(evaluateAchievements(partialCtx, [])).not.toContain('bug-hunter');

    const fullCtx: AchievementEvaluationContext = {
      ...partialCtx,
      completedMissionIds: ['mission-01', 'mission-02', 'mission-03', 'mission-04', 'mission-05'],
    };
    expect(evaluateAchievements(fullCtx, [])).toContain('bug-hunter');
  });

  it('unlocks Perfectionist and Speed Demon on optimal, hint-free run', () => {
    const ctx: AchievementEvaluationContext = {
      activeRacesCount: 0,
      hasSteppedBack: false,
      manualStepsCount: 0,
      isDeadlocked: false,
      completedMissionIds: ['mission-01'],
      lastCompletedMission: {
        id: 'mission-01',
        score: 1500,
        stars: 3,
        steps: 6,
        optimalSteps: 6,
        hintsUsed: 0,
      },
    };

    const unlocked = evaluateAchievements(ctx, []);
    expect(unlocked).toContain('perfectionist');
    expect(unlocked).toContain('speed-demon');
  });

  it('does not re-unlock achievements that are already earned', () => {
    const ctx: AchievementEvaluationContext = {
      activeRacesCount: 2,
      hasSteppedBack: true,
      manualStepsCount: 1,
      isDeadlocked: false,
      completedMissionIds: [],
    };

    const unlocked = evaluateAchievements(ctx, ['first-race', 'time-traveler']);
    expect(unlocked).not.toContain('first-race');
    expect(unlocked).not.toContain('time-traveler');
    expect(unlocked).toContain('chaos-controller');
  });
});
