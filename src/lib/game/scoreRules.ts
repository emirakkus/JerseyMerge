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
