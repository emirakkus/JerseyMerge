/** Player level / rank derived from the live match score (no extra state). */

export interface Level {
  name: string;
  min: number;
  color: string;
}

export const LEVELS: readonly Level[] = [
  { name: "Rookie", min: 0, color: "#38bdf8" },
  { name: "School Star", min: 100, color: "#34d399" },
  { name: "Academy", min: 250, color: "#a78bfa" },
  { name: "Pro", min: 500, color: "#f472b6" },
  { name: "National Star", min: 1000, color: "#fb923c" },
  { name: "Legend", min: 2000, color: "#facc15" },
  { name: "Champion", min: 4000, color: "#f59e0b" },
];

export function levelFor(score: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (score >= level.min) current = level;
  }
  return current;
}

export function levelProgress(score: number): {
  level: Level;
  index: number;
  next: Level | null;
  pct: number;
} {
  const level = levelFor(score);
  const index = LEVELS.indexOf(level);
  const next = index + 1 < LEVELS.length ? LEVELS[index + 1] : null;
  const pct = next === null ? 1 : Math.min(1, (score - level.min) / (next.min - level.min));
  return { level, index, next, pct };
}
