import type { ProgressState } from "./types.ts";
import { emptyProgress } from "./types.ts";
import { FIELD_THEMES, resolveFieldTheme } from "../game/fieldThemes.ts";
import { levelForXp } from "./xp.ts";

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
    const xp = clean(p.xp);
    const level = levelForXp(xp).level;
    const unlocked = FIELD_THEMES.filter((theme) => theme.unlockLevel <= level).map((theme) => theme.id);
    const unlockedSet = new Set<string>(unlocked);
    const storedUnlocked = Array.isArray(p.unlockedFieldThemes) ? p.unlockedFieldThemes.filter((id): id is string => typeof id === "string" && unlockedSet.has(id)) : [];
    const storedSeen = Array.isArray(p.seenFieldThemes) ? p.seenFieldThemes.filter((id): id is string => typeof id === "string" && unlockedSet.has(id)) : ["classic"];
    return {
      xp,
      counters: { ...base.counters, ...(typeof p.counters === "object" && p.counters !== null ? (p.counters as object) : {}) },
      achievements: Array.isArray(p.achievements) ? p.achievements.filter((a): a is string => typeof a === "string") : [],
      skins: Array.isArray(p.skins) ? p.skins.filter((s): s is string => typeof s === "string") : [],
      fieldThemeId: resolveFieldTheme(p.fieldThemeId, level).id,
      unlockedFieldThemes: Array.from(new Set([...storedUnlocked, ...unlocked])),
      seenFieldThemes: Array.from(new Set([...storedSeen, "classic"])),
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
