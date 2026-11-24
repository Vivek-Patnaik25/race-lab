import { describe, it, expect } from 'vitest';
import { calculateScore } from '../../src/engine/scenarios/scoring';

describe('Phase 3: Deterministic Scoring Engine', () => {
  it('awards max 1500 points and 3 stars for flawless optimal execution with zero hints', () => {
    const result = calculateScore({
      optimalSteps: 6,
      actualSteps: 6,
      hintsUsed: 0,
    });

    expect(result.baseScore).toBe(1000);
    expect(result.stepEfficiencyBonus).toBe(500);
    expect(result.hintPenalty).toBe(0);
    expect(result.totalScore).toBe(1500);
    expect(result.stars).toBe(3);
  });

  it('deducts 50 points per step over optimal count', () => {
    // 2 excess steps: 500 - 2 * 50 = 400 bonus
    const result = calculateScore({
      optimalSteps: 6,
      actualSteps: 8,
      hintsUsed: 0,
    });

    expect(result.stepEfficiencyBonus).toBe(400);
    expect(result.totalScore).toBe(1400);
    expect(result.stars).toBe(3);
  });

  it('deducts 150 points per unlocked hint', () => {
    // 1 hint used: -150
    const result = calculateScore({
      optimalSteps: 6,
      actualSteps: 6,
      hintsUsed: 1,
    });

    expect(result.hintPenalty).toBe(150);
    expect(result.totalScore).toBe(1350);
    expect(result.stars).toBe(3);
  });

  it('evaluates star ratings accurately (3 stars >= 1350, 2 stars >= 950, 1 star < 950)', () => {
    const threeStars = calculateScore({ optimalSteps: 6, actualSteps: 7, hintsUsed: 0 }); // 1450 pts
    expect(threeStars.stars).toBe(3);

    const twoStars = calculateScore({ optimalSteps: 6, actualSteps: 12, hintsUsed: 1 }); // 1000 + 200 - 150 = 1050 pts
    expect(twoStars.stars).toBe(2);

    const oneStar = calculateScore({ optimalSteps: 6, actualSteps: 20, hintsUsed: 3 }); // 1000 + 0 - 450 = 550 pts
    expect(oneStar.stars).toBe(1);
  });

  it('clamps total score to a floor of 200 points for any successful completion', () => {
    const terribleRun = calculateScore({
      optimalSteps: 4,
      actualSteps: 40,
      hintsUsed: 10,
    });

    expect(terribleRun.totalScore).toBe(200);
    expect(terribleRun.stars).toBe(1);
  });

  it('guarantees bit-for-bit deterministic results for identical parameters', () => {
    const run1 = calculateScore({ optimalSteps: 10, actualSteps: 14, hintsUsed: 2 });
    const run2 = calculateScore({ optimalSteps: 10, actualSteps: 14, hintsUsed: 2 });

    expect(run1).toEqual(run2);
  });
});
