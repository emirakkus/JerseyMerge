/**
 * Pure scoring / combo rules. No engine or DOM dependencies — unit-tested.
 *
 * Combo: merges within `windowMs` of the previous merge extend the streak.
 * The multiplier grows per step and is capped.
 */

export interface ComboRules {
  /** A merge must land within this window of the previous one (game ms). */
  windowMs: number;
  /** Multiplier added per extra combo step. */
  perStep: number;
  /** Hard cap for the multiplier. */
  cap: number;
}

export const COMBO_RULES: ComboRules = {
  windowMs: 1500,
  perStep: 0.25,
  cap: 2,
};

/** Multiplier for a streak of `combo` merges (combo 1 → x1.0). */
export function comboMultiplier(combo: number, rules: ComboRules = COMBO_RULES): number {
  if (combo < 2) return 1;
  return Math.min(1 + (combo - 1) * rules.perStep, rules.cap);
}

/** Points awarded by a merge: base jersey value × combo multiplier, rounded. */
export function mergeGain(baseValue: number, combo: number, rules: ComboRules = COMBO_RULES): number {
  return Math.max(0, Math.round(baseValue * comboMultiplier(combo, rules)));
}

/**
<<<<<<< HEAD
 * Flat streak bonus for long chains: every 5th link and beyond pays out
 * 10 × combo (chain 5 → +50, 10 → +100, 15 → +150 …). Stacks on top of the
 * multiplier — reward for long chains, not just the rate.
 */
export const STREAK_BONUS_EVERY = 5;

export function streakBonus(combo: number): number {
  if (combo < STREAK_BONUS_EVERY) return 0;
  return 10 * combo;
}

/**
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
 * Streak counter for a merge happening at `nowMs` (game time, so pauses are
 * safe). Extends the streak when inside the window, otherwise resets to 1.
 */
export function nextCombo(
  prevCombo: number,
  lastMergeAtMs: number | null,
  nowMs: number,
  rules: ComboRules = COMBO_RULES
): number {
  if (prevCombo < 1 || lastMergeAtMs === null) return 1;
  if (nowMs - lastMergeAtMs <= rules.windowMs) return prevCombo + 1;
  return 1;
}
