import { ACHIEVEMENT_IDS } from "../data/achievements.ts";
import type { LifetimeCounters, ProgressState } from "./types.ts";
import { emptyProgress } from "./types.ts";

/** Shared API types for /api/progress (route handlers + client). */

export type ProgressDto = ProgressState;

export interface ProgressSyncResult {
  merged: ProgressDto;
}

export const COUNTER_KEYS = Object.keys(emptyProgress().counters) as Array<keyof LifetimeCounters>;

const clamp = (n: unknown): number => {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v >= 0 ? Math.min(v, 1_000_000_000) : 0;
};

/** Defensive sanitization of a client-submitted progress state. */
export function sanitizeProgress(input: unknown): ProgressState {
  const base = emptyProgress();
<<<<<<< HEAD
  const obj = (input ?? {}) as { xp?: unknown; counters?: unknown; achievements?: unknown; skins?: unknown };
=======
  const obj = (input ?? {}) as { xp?: unknown; counters?: unknown; achievements?: unknown };
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
  const counters = { ...base.counters };
  if (typeof obj.counters === "object" && obj.counters !== null) {
    for (const k of COUNTER_KEYS) {
      counters[k] = clamp((obj.counters as Record<string, unknown>)[k]);
    }
  }
  const achievements = Array.isArray(obj.achievements)
    ? Array.from(new Set(obj.achievements.filter((a): a is string => typeof a === "string" && ACHIEVEMENT_IDS.has(a)))).slice(0, 100)
    : [];
<<<<<<< HEAD
  return { xp: clamp(obj.xp), counters, achievements, skins: Array.isArray(obj.skins) ? obj.skins.filter((s): s is string => typeof s === "string") : [] };
=======
  return { xp: clamp(obj.xp), counters, achievements };
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
}
