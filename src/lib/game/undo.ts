import type { MissionSnapshot } from "./missions.ts";
import type { PowerupInventory } from "./powerups.ts";

/**
 * UNDO — documented rule (kept in one place so tests and UI can agree):
 *
 * The snapshot is captured right BEFORE every jersey drop. Undo therefore
 * reverts everything that happened since that drop:
 *   - the dropped jersey and every merge it caused
 *   - the score those merges earned (score returns to the pre-drop value)
 *   - mission progress made by those merges
 *   - combo/streak state
 *   - any OTHER power-up used after the drop (its charge comes back)
 *
 * Permanent things are intentionally NOT part of the snapshot and are never
 * reverted: badges, best score / records, daily streak, power-up "used" stats.
 */

export interface MatchSnapshot {
  score: number;
  powerups: PowerupInventory;
  comboCount: number;
  lastMergeAt: number | null;
  missions: MissionSnapshot;
}

export function createMatchSnapshot(s: MatchSnapshot): MatchSnapshot {
  return {
    score: s.score,
    powerups: { ...s.powerups },
    comboCount: s.comboCount,
    lastMergeAt: s.lastMergeAt,
    missions: s.missions,
  };
}

export interface RevertResult {
  /** Points removed by the revert (0 when the drop earned nothing). */
  scoreDelta: number;
}

/** Applies a snapshot back onto `current`. Returns how many points were removed. */
export function applyMatchSnapshot(current: MatchSnapshot, snap: MatchSnapshot): RevertResult {
  const scoreDelta = Math.max(0, current.score - snap.score);
  current.score = snap.score;
  current.powerups = { ...snap.powerups };
  current.comboCount = snap.comboCount;
  current.lastMergeAt = snap.lastMergeAt;
  current.missions = snap.missions;
  return { scoreDelta };
}
