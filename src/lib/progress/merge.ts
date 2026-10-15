import type { LifetimeCounters, ProgressState } from "./types.ts";
import { emptyProgress } from "./types.ts";

/**
 * "Most advanced wins" merge rule (documented in PROGRESS.md):
 * - each counter: the higher value wins
 * - xp: the higher value wins
 * - achievements: union (unlocks are never lost)
 */
export function mergeCounters(a: LifetimeCounters, b: LifetimeCounters): LifetimeCounters {
  const zero = emptyProgress().counters;
  const out = { ...zero };
  (Object.keys(zero) as Array<keyof LifetimeCounters>).forEach((k) => {
    out[k] = Math.max(Math.floor(a[k] ?? 0), Math.floor(b[k] ?? 0));
  });
  return out;
}

export function mergeProgress(local: ProgressState, remote: ProgressState): ProgressState {
  return {
    xp: Math.max(Math.floor(local.xp ?? 0), Math.floor(remote.xp ?? 0)),
    counters: mergeCounters(local.counters, remote.counters),
    achievements: Array.from(new Set([...local.achievements, ...remote.achievements])),
<<<<<<< HEAD
    skins: Array.from(new Set([...local.skins, ...remote.skins])),
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
  };
}
