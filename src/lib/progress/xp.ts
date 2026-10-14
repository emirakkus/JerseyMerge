/** Player level / XP curve. Thresholds are configurable in LEVEL_CONFIG. */

export const LEVEL_CONFIG = {
  /** XP needed for the first level-up. */
  base: 120,
  /** Each subsequent level costs `growth` times the previous one. */
  growth: 1.4,
  maxLevel: 40,
} as const;

/** Cumulative XP required to REACH a given level (level 1 = 0). */
export function xpToReachLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level && l <= LEVEL_CONFIG.maxLevel; l += 1) {
    total += Math.round(LEVEL_CONFIG.base * Math.pow(LEVEL_CONFIG.growth, l - 1));
  }
  return total;
}

export interface LevelInfo {
  level: number;
  /** XP earned within the current level. */
  intoLevel: number;
  /** XP still needed for the next level (0 at max). */
  needed: number;
  /** 0..1 progress through the current level. */
  pct: number;
}

export function levelForXp(xp: number): LevelInfo {
  const clean = Math.max(0, Math.floor(xp));
  let level = 1;
  while (level < LEVEL_CONFIG.maxLevel && clean >= xpToReachLevel(level + 1)) {
    level += 1;
  }
  const cur = xpToReachLevel(level);
  const next = level < LEVEL_CONFIG.maxLevel ? xpToReachLevel(level + 1) : null;
  const intoLevel = clean - cur;
  const span = next === null ? 0 : next - cur;
  return {
    level,
    intoLevel,
    needed: next === null ? 0 : next - clean,
    pct: next === null ? 1 : Math.min(1, span > 0 ? (clean - cur) / span : 0),
  };
}

/** XP granted for a finished match. */
export function computeMatchXp(input: { score: number; maxCombo: number; isDaily?: boolean }): number {
  const score = Math.max(0, Math.floor(input.score));
  const combo = Math.max(0, Math.floor(input.maxCombo));
  return score + combo * 10 + (input.isDaily ? 25 : 0);
}
