import type { QuestCounters } from "./quests";
import { emptyCounters } from "./quests";
import type { StreakState } from "./streak";

/**
 * Device-local persistence for daily features. Works for guests; accounts
 * get the same local view while the server keeps authoritative streak /
 * claim records. All access is SSR-safe.
 */

const COUNTERS_KEY = "jersey-merge.daily-counters";
const CLAIMED_KEY = "jersey-merge.daily-claimed";
const BANK_KEY = "jersey-merge.bank";
const GUEST_STREAK_KEY = "jersey-merge.guest-streak";
const TOUCH_KEY = "jersey-merge.last-touch";

export interface PowerupBank {
  joker: number;
  bomb: number;
  scramble: number;
}

function read<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/** Counters for the given UTC day (fresh when the stored day differs). */
export function loadCounters(dayKey: string): QuestCounters {
  const stored = read<{ dayKey: string; counters: QuestCounters }>(COUNTERS_KEY);
  if (stored && stored.dayKey === dayKey && stored.counters) {
    const c = stored.counters;
    return {
      merges: c.merges ?? 0,
      maxValue: c.maxValue ?? 0,
      maxCombo: c.maxCombo ?? 0,
      score: c.score ?? 0,
      drops: c.drops ?? 0,
      powerupsUsed: c.powerupsUsed ?? 0,
      matches: c.matches ?? 0,
      collectionPoints: c.collectionPoints ?? 0,
    };
  }
  return emptyCounters();
}

export function saveCounters(dayKey: string, counters: QuestCounters): void {
  write(COUNTERS_KEY, { dayKey, counters });
}

export function loadClaimed(dayKey: string): string[] {
  const stored = read<{ dayKey: string; ids: string[] }>(CLAIMED_KEY);
  if (stored && stored.dayKey === dayKey && Array.isArray(stored.ids)) return stored.ids;
  return [];
}

export function saveClaimed(dayKey: string, ids: string[]): void {
  write(CLAIMED_KEY, { dayKey, ids });
}

export function loadBank(): PowerupBank {
  const b = read<PowerupBank>(BANK_KEY);
  if (!b) return { joker: 1, bomb: 1, scramble: 1 };
  return {
    joker: Math.min(3, Math.max(0, Math.floor(Number(b.joker) || 0))),
    bomb: Math.min(3, Math.max(0, Math.floor(Number(b.bomb) || 0))),
    scramble: Math.min(3, Math.max(0, Math.floor(Number(b.scramble) || 0))),
  };
}

export function addBank(add: Partial<PowerupBank>): PowerupBank {
  const cur = loadBank();
  const next: PowerupBank = {
    joker: Math.min(3, cur.joker + Math.max(0, Math.floor(Number(add.joker) || 0))),
    bomb: Math.min(3, cur.bomb + Math.max(0, Math.floor(Number(add.bomb) || 0))),
    scramble: Math.min(3, cur.scramble + Math.max(0, Math.floor(Number(add.scramble) || 0))),
  };
  write(BANK_KEY, next);
  return next;
}

/** Replaces the persisted stock after a match power-up change. */
export function saveBank(bank: PowerupBank): PowerupBank {
  const next = {
    joker: Math.min(3, Math.max(0, Math.floor(bank.joker || 0))),
    bomb: Math.min(3, Math.max(0, Math.floor(bank.bomb || 0))),
    scramble: Math.min(3, Math.max(0, Math.floor(bank.scramble || 0))),
  };
  write(BANK_KEY, next);
  return next;
}

/** Reads the whole bank and empties it (applied as a bonus to the next match). */
export function takeBank(): PowerupBank {
  const cur = loadBank();
  write(BANK_KEY, { joker: 0, bomb: 0, scramble: 0 });
  return cur;
}

export function loadGuestStreak(): StreakState {
  const s = read<StreakState>(GUEST_STREAK_KEY);
  if (!s || typeof s.streak !== "number") return { streak: 0, lastActiveDay: null };
  return { streak: s.streak, lastActiveDay: typeof s.lastActiveDay === "string" ? s.lastActiveDay : null };
}

export function saveGuestStreak(s: StreakState): void {
  write(GUEST_STREAK_KEY, s);
}

export function getTouchDayKey(): string | null {
  return read<string>(TOUCH_KEY);
}

export function setTouchDayKey(dayKey: string): void {
  write(TOUCH_KEY, dayKey);
}
