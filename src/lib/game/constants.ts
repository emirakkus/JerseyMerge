/** Central game configuration: board geometry, physics tuning, radius tables.
 * Jersey visuals (colors/patterns) live in a single config: ./jerseyConfig. */

export { themeFor, styleFor, levelForValue } from "./jerseyConfig.ts";
export type { JerseyStyle, JerseyTier } from "./jerseyConfig.ts";

/** Logical play-field size (canvas is scaled to fit, DPR handled separately).
 * Taller field = more vertical room for the pile (walls/floor derive from this). */
export const BOARD_W = 420;
export const BOARD_H = 720;

/** Jerseys resting above this line (for too long) end the game. */
export const DANGER_Y = 96;

/** Y coordinate where dropped jerseys appear. */
export const DROP_Y = 58;

/** Fixed physics timestep (ms) — keeps the simulation deterministic at any display rate. */
export const STEP_MS = 1000 / 60;

/** Minimum time between two drops (ms). */
export const DROP_COOLDOWN_MS = 330;

/** How long (ms) a resting jersey may stay above the danger line before game over. */
export const BREACH_GRACE_MS = 1400;

const RADII: Readonly<Record<number, number>> = {
  2: 24,
  4: 29,
  8: 34,
  16: 40,
  32: 46,
  64: 53,
  128: 60,
  256: 68,
  512: 76,
  1024: 84,
  2048: 93,
};

export const MAX_RADIUS = 102;

/** Wild form identities (negative values never merge via the queue). */
export const JOKER_VALUE = -1;
export const JOKER_RADIUS = 34;
export const BOMB_VALUE = -2;
export const BOMB_RADIUS = 26;

/** Radius for any value; unknown (beyond 2048) values grow gradually but are capped. */
export function radiusFor(value: number): number {
  const known = RADII[value];
  if (known !== undefined) return known;
  if (value <= 0) return JOKER_RADIUS; // joker / wild forms
  const step = Math.max(0, Math.floor(Math.log2(value)) - 1);
  return Math.min(MAX_RADIUS, Math.round(24 * Math.pow(1.13, step)));
}

/** Weighted random spawn: early values dominate so the first merges come fast. */
export function randomSpawnValue(rng: () => number = Math.random): number {
  const r = rng();
  if (r < 0.44) return 2;
  if (r < 0.78) return 4;
  if (r < 0.94) return 8;
  return 16;
}
