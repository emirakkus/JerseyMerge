import type { ProgressState } from "./types.ts";
import { emptyProgress } from "./types.ts";

/** Guest-mode persistence for player progress (SSR-safe). */

const KEY = "jersey-merge.progress";

export function loadProgress(): ProgressState {
  try {
    if (typeof window === "undefined") return emptyProgress();
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptyProgress();
    const p = parsed as Partial<ProgressState>;
    const base = emptyProgress();
    const clean = (n: unknown): number => {
      const v = Math.floor(Number(n));
      return Number.isFinite(v) && v >= 0 ? Math.min(v, 1_000_000_000) : 0;
    };
    return {
      xp: clean(p.xp),
      counters: { ...base.counters, ...(typeof p.counters === "object" && p.counters !== null ? (p.counters as object) : {}) },
      achievements: Array.isArray(p.achievements) ? p.achievements.filter((a): a is string => typeof a === "string") : [],
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state: ProgressState): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
