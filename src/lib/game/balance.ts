/**
 * Balance helpers — pure functions so the "fairness" rules are testable:
 * power-ups are capped (no spam-abuse) and the core game is fully winnable
 * without them (no forced usage).
 */

import { POWERUPS, type PowerupId } from "./powerups.ts";
import { mergeGain, streakBonus } from "./scoreRules.ts";

export interface MergeEvent {
  /** The value of the jersey created by the merge. */
  value: number;
  /** Chain length at the moment of the merge (1 = no streak). */
  combo: number;
}

/** Charges available at the start of every match. */
export function initialCharges(): number {
  return POWERUPS.reduce((acc, p) => acc + p.start, 0);
}

/** Extra charges earnable during a match — only power-ups with an `earnAt` rule. */
export function earnableCharges(): number {
  return POWERUPS.reduce((acc, p) => acc + (p.earnAt !== undefined ? Math.max(0, p.max - p.start) : 0), 0);
}

/** Hard cap on total power-up uses in a single match. */
export function maxChargesPerMatch(): number {
  return initialCharges() + earnableCharges();
}

/** The per-match charge cap for one power-up. */
export function maxChargesFor(id: PowerupId): number {
  return POWERUPS.find((p) => p.id === id)?.max ?? 0;
}

/** Total score of a match from its merge events (multiplier + streak bonus). */
export function simulateMatchScore(events: MergeEvent[]): number {
  return events.reduce((acc, e) => acc + mergeGain(e.value, e.combo) + streakBonus(e.combo), 0);
}

/**
 * Are all per-match missions achievable with the given merge events alone
 * (no power-ups)? Mirrors the mission targets in missions.ts:
 * 5 merges, a 32+ kit, and a 3-chain.
 */
export function missionsAchievableWithoutPowerups(events: MergeEvent[]): boolean {
  if (events.length < 5) return false;
  if (!events.some((e) => e.value >= 32)) return false;
  if (!events.some((e) => e.combo >= 3)) return false;
  return true;
}
