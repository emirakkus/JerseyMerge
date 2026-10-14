/** Score persistence with named leaderboard entries. All storage is SSR-safe. */

export interface ScoreEntry {
  name: string;
  score: number;
  timeMs: number;
  at: number;
}

const BEST_KEY = "jersey-merge.best";
const TOP_KEY = "jersey-merge.top-scores";
const NAME_KEY = "jersey-merge.name";
const TOP_LIMIT = 10;
const DEFAULT_NAME = "Player";

function safeGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode etc.) — ignore */
  }
}

function cleanName(raw: string): string {
  const trimmed = raw.trim().slice(0, 14);
  return trimmed.length > 0 ? trimmed : DEFAULT_NAME;
}

export function loadBest(): number {
  const raw = safeGet(BEST_KEY);
  const n = raw === null ? 0 : Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function saveBest(value: number): void {
  safeSet(BEST_KEY, String(Math.max(0, Math.floor(value))));
}

export function loadPlayerName(): string {
  const raw = safeGet(NAME_KEY);
  return raw !== null && raw.trim() ? cleanName(raw) : DEFAULT_NAME;
}

export function savePlayerName(raw: string): string {
  const clean = cleanName(raw);
  safeSet(NAME_KEY, clean);
  return clean;
}

export function loadTopScores(): ScoreEntry[] {
  const raw = safeGet(TOP_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is { score: number; at: number; name?: unknown; timeMs?: unknown } =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as { score: unknown }).score === "number" &&
          typeof (entry as { at: unknown }).at === "number"
      )
      .map((e) => ({
        name: typeof e.name === "string" && e.name.trim() ? e.name : DEFAULT_NAME,
        score: e.score,
        timeMs: typeof e.timeMs === "number" ? e.timeMs : 0,
        at: e.at,
      }))
      .slice(0, TOP_LIMIT);
  } catch {
    return [];
  }
}

/**
 * Records a finished game and returns the new best, record flag, the top list
 * and the timestamp of the newly added entry (0 when nothing was recorded).
 */
export function recordScore(
  score: number,
  timeMs: number,
  name: string
): { best: number; isNewBest: boolean; top: ScoreEntry[]; newAt: number } {
  const clean = Math.max(0, Math.floor(score));
  const prevBest = loadBest();
  const isNewBest = clean > prevBest && clean > 0;
  const best = Math.max(prevBest, clean);
  if (best > prevBest) saveBest(best);

  let top = loadTopScores();
  let newAt = 0;
  if (clean > 0) {
    newAt = Date.now();
    const entry: ScoreEntry = {
      name: cleanName(name),
      score: clean,
      timeMs: Math.max(0, Math.floor(timeMs)),
      at: newAt,
    };
    top = [...top, entry]
      .sort((a, b) => b.score - a.score || a.timeMs - b.timeMs)
      .slice(0, TOP_LIMIT);
    safeSet(TOP_KEY, JSON.stringify(top));
  }
  return { best, isNewBest, top, newAt };
}

const STATS_KEY = "jersey-merge.stats";

/** Lifetime progress stats (guest mode keeps these locally). */
export interface LifetimeStats {
  powerupsUsed: number;
  bestCombo: number;
}

export function loadStats(): LifetimeStats {
  const raw = safeGet(STATS_KEY);
  if (!raw) return { powerupsUsed: 0, bestCombo: 0 };
  try {
    const parsed: unknown = JSON.parse(raw);
    const p = (parsed as { powerupsUsed?: unknown; bestCombo?: unknown });
    return {
      powerupsUsed: typeof p.powerupsUsed === "number" ? p.powerupsUsed : 0,
      bestCombo: typeof p.bestCombo === "number" ? p.bestCombo : 0,
    };
  } catch {
    return { powerupsUsed: 0, bestCombo: 0 };
  }
}

export function addLifetimeStats(powerupsUsed: number, bestCombo: number): LifetimeStats {
  const s = loadStats();
  const next: LifetimeStats = {
    powerupsUsed: s.powerupsUsed + Math.max(0, Math.floor(powerupsUsed)),
    bestCombo: Math.max(s.bestCombo, Math.max(0, Math.floor(bestCombo))),
  };
  safeSet(STATS_KEY, JSON.stringify(next));
  return next;
}

const BADGE_KEY = "jersey-merge.badges";

export function loadOwnedBadges(): string[] {
  const raw = safeGet(BADGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function saveOwnedBadges(ids: string[]): void {
  safeSet(BADGE_KEY, JSON.stringify(ids));
}

/** Renames a recorded entry (matched by its timestamp). Returns the updated list. */
export function renameTopEntry(at: number, name: string): ScoreEntry[] {
  const clean = cleanName(name);
  const top = loadTopScores().map((e) => (e.at === at ? { ...e, name: clean } : e));
  safeSet(TOP_KEY, JSON.stringify(top));
  return top;
}
