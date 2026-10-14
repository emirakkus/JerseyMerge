/**
 * Deterministic PRNG + day helpers for the daily challenge.
 * Pure and environment-free so the same seed always yields the same sequence
 * on every device.
 */

export interface Rng {
  (): number;
}

/** mulberry32 — small, fast, deterministic 32-bit PRNG. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** UTC day key "YYYY-MM-DD". All daily boundaries use UTC, not local time. */
export function utcDayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** FNV-1a 32-bit hash of a string. */
export function hashSeed(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic seed for the daily challenge of a given UTC day. */
export function dailySeed(dayKey: string = utcDayKey()): number {
  return hashSeed(`jersey-merge-daily-${dayKey}`);
}
