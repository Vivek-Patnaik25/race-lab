/**
 * Achievements Specification and Evaluation Engine
 * Complies with Section 10 of Product Specification.
 */

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface AchievementEvaluationContext {
  activeRacesCount: number;
  hasSteppedBack: boolean;
  manualStepsCount: number;
  isDeadlocked: boolean;
  completedMissionIds: string[];
  lastCompletedMission?: {
    id: string;
    score: number;
    stars: 1 | 2 | 3;
    steps: number;
    optimalSteps: number;
    hintsUsed: number;
  };
}

export const ACHIEVEMENTS_REGISTRY: AchievementDefinition[] = [
  {
    id: 'first-race',
    title: 'First Race',
    description: 'Detect your first data race condition.',
    icon: 'zap',
    xpReward: 50,
  },
  {
    id: 'time-traveler',
    title: 'Time Traveler',
    description: 'Rewind an execution step in the timeline.',
    icon: 'rotate-ccw',
    xpReward: 50,
  },
  {
    id: 'lock-it-down',
    title: 'Lock It Down',
    description: 'Complete a challenge using mutex synchronization.',
    icon: 'shield',
    xpReward: 100,
  },
  {
    id: 'chaos-controller',
    title: 'Chaos Controller',
    description: 'Use manual scheduling to trigger a specific interleaving.',
    icon: 'sliders',
    xpReward: 75,
  },
  {
    id: 'no-more-deadlocks',
    title: 'Deadlock Hunter',
    description: 'Trigger and detect a circular wait-for deadlock cycle.',
    icon: 'lock',
    xpReward: 100,
  },
  {
    id: 'bug-hunter',
    title: 'Bug Hunter',
    description: 'Complete all five concurrency missions.',
    icon: 'trophy',
    xpReward: 250,
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Earn a flawless 3-star rating on any mission.',
    icon: 'award',
    xpReward: 150,
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete a mission in optimal steps with zero hints used.',
    icon: 'flame',
    xpReward: 125,
  },
];

/**
 * Checks all achievements against the current evaluation context.
 * Returns array of achievement IDs eligible to be unlocked.
 */
export function evaluateAchievements(
  context: AchievementEvaluationContext,
  currentlyUnlockedIds: string[]
): string[] {
  const newlyUnlocked: string[] = [];

  const checkUnlocked = (id: string, condition: boolean) => {
    if (condition && !currentlyUnlockedIds.includes(id) && !newlyUnlocked.includes(id)) {
      newlyUnlocked.push(id);
    }
  };

  checkUnlocked('first-race', context.activeRacesCount > 0);
  checkUnlocked('time-traveler', context.hasSteppedBack);
  checkUnlocked('chaos-controller', context.manualStepsCount > 0);
  checkUnlocked(
    'lock-it-down',
    context.completedMissionIds.includes('mission-03') ||
      context.lastCompletedMission?.id === 'mission-03'
  );
  checkUnlocked(
    'no-more-deadlocks',
    context.isDeadlocked ||
      context.completedMissionIds.includes('mission-04') ||
      context.lastCompletedMission?.id === 'mission-04'
  );

  const allFiveMissions = ['mission-01', 'mission-02', 'mission-03', 'mission-04', 'mission-05'];
  const allCompleted = allFiveMissions.every((mId) => context.completedMissionIds.includes(mId));
  checkUnlocked('bug-hunter', allCompleted);

  if (context.lastCompletedMission) {
    checkUnlocked('perfectionist', context.lastCompletedMission.stars === 3);
    checkUnlocked(
      'speed-demon',
      context.lastCompletedMission.steps <= context.lastCompletedMission.optimalSteps &&
        context.lastCompletedMission.hintsUsed === 0
    );
  }

  return newlyUnlocked;
}
