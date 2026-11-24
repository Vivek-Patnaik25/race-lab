/**
 * Deterministic Scoring Engine
 * Complies with Section 10 of Product Specification.
 */

export interface ScoringParams {
  optimalSteps: number;
  actualSteps: number;
  hintsUsed: number;
  baseScore?: number;
}

export interface ScoreResult {
  baseScore: number;
  stepEfficiencyBonus: number;
  hintPenalty: number;
  totalScore: number;
  stars: 1 | 2 | 3;
  optimalSteps: number;
  actualSteps: number;
  hintsUsed: number;
}

/**
 * Computes deterministic score and star ratings for a challenge run.
 *
 * Formula:
 * - Base completion: 1000 pts
 * - Step efficiency bonus: max(0, 500 - max(0, actualSteps - optimalSteps) * 50)
 * - Hint deduction: 150 pts per hint unlocked
 * - Total score clamped between 200 and 1500
 *
 * Stars:
 * - 3 Stars: totalScore >= 1350
 * - 2 Stars: totalScore >= 950
 * - 1 Star: totalScore < 950 (or minimum completion)
 */
export function calculateScore(params: ScoringParams): ScoreResult {
  const baseScore = params.baseScore ?? 1000;

  const excessSteps = Math.max(0, params.actualSteps - params.optimalSteps);
  const stepEfficiencyBonus = Math.max(0, 500 - excessSteps * 50);

  const hintPenalty = Math.max(0, params.hintsUsed) * 150;

  const rawScore = baseScore + stepEfficiencyBonus - hintPenalty;
  const totalScore = Math.max(200, Math.min(1500, rawScore));

  let stars: 1 | 2 | 3 = 1;
  if (totalScore >= 1350) {
    stars = 3;
  } else if (totalScore >= 950) {
    stars = 2;
  } else {
    stars = 1;
  }

  return {
    baseScore,
    stepEfficiencyBonus,
    hintPenalty,
    totalScore,
    stars,
    optimalSteps: params.optimalSteps,
    actualSteps: params.actualSteps,
    hintsUsed: params.hintsUsed,
  };
}
