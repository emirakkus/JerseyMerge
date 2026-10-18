/** Central game configuration: board geometry, physics tuning, radius tables.
 * Jersey visuals (colors/patterns) live in a single config: ./jerseyConfig. */

export { themeFor, styleFor, levelForValue } from "./jerseyConfig.ts";
export type { JerseyStyle, JerseyTier } from "./jerseyConfig.ts";

/** Logical play-field size (canvas is scaled to fit, DPR handled separately).
 * Taller field = more vertical room for the pile (walls/floor derive from this). */
export const BOARD_W = 420;
export const BOARD_H = 720;

/** Shared curved floor profile so the canvas edge and Matter colliders align. */
export function bowlFloorY(x: number): number {
  const centered = (x - BOARD_W / 2) / (BOARD_W / 2);
  return 610 + 110 * (1 - centered * centered);
}

/** Jerseys resting above this line (for too long) end the game. */
export const DANGER_Y = 104;

/** Y coordinate where dropped jerseys appear. */
export const DROP_Y = 52;

/** Fixed physics timestep (ms) — keeps the simulation deterministic at any display rate. */
export const STEP_MS = 1000 / 60;

/** Minimum time between two drops (ms). */
export const DROP_COOLDOWN_MS = 330;

/** How long (ms) a resting jersey may stay above the danger line before game over. */
export const BREACH_GRACE_MS = 1400;

const RADII: Readonly<Record<number, number>> = {
  2: 28,
  4: 33,
  8: 39,
  16: 46,
  32: 53,
  64: 61,
  128: 69,
  256: 78,
  512: 87,
  1024: 97,
  2048: 107,
};

/** Ordered playable jersey values used by the in-game evolution HUD. */
export const JERSEY_VALUES = Object.keys(RADII).map(Number);

export const MAX_RADIUS = 124;

/** Optional high-score spawn tuning; disabled to keep the current game balance. */
export const HIGH_SCORE_DIFFICULTY = {
  enabled: false,
  scoreThreshold: 5000,
  firstLevelChance: 0.25,
} as const;

/** Wild form identities (negative values never merge via the queue). */
export const JOKER_VALUE = -1;
export const JOKER_RADIUS = 39;
export const BOMB_VALUE = -2;
export const BOMB_RADIUS = 30;

/** Radius for any value; unknown (beyond 2048) values grow gradually but are capped. */
export function radiusFor(value: number): number {
  const known = RADII[value];
  if (known !== undefined) return known;
  if (value <= 0) return JOKER_RADIUS; // joker / wild forms
  const step = Math.max(0, Math.floor(Math.log2(value)) - 1);
  return Math.min(MAX_RADIUS, Math.round(24 * Math.pow(1.13, step)));
}

/** Weighted random spawn: early values dominate so the first merges come fast. */
export function randomSpawnValue(rng: () => number = Math.random, score = 0): number {
  const r = rng();
  const firstLevelChance = HIGH_SCORE_DIFFICULTY.enabled && score >= HIGH_SCORE_DIFFICULTY.scoreThreshold
    ? HIGH_SCORE_DIFFICULTY.firstLevelChance
    : 0.44;
  if (r < firstLevelChance) return 2;
  if (r < 0.78) return 4;
  if (r < 0.94) return 8;
  return 16;
}
