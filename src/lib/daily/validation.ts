/** Pure submission validation shared by route handlers and tests. */

export const DAILY_MAX_SCORE = 1_000_000;
/** A single match should not take more than 4 hours. */
export const DAILY_MAX_TIME_MS = 4 * 60 * 60 * 1000;

export type DailySubmissionCheck =
  | { ok: true; score: number; timeMs: number }
  | { ok: false; error: string };

export function validateDailySubmission(input: unknown): DailySubmissionCheck {
  const obj = (input ?? {}) as { score?: unknown; timeMs?: unknown };
  const score = Math.floor(Number(obj.score));
  const timeMs = Math.floor(Number(obj.timeMs));
  if (!Number.isFinite(score) || score < 0 || score > DAILY_MAX_SCORE) {
    return { ok: false, error: "Score is out of range." };
  }
  if (!Number.isFinite(timeMs) || timeMs < 0 || timeMs > DAILY_MAX_TIME_MS) {
    return { ok: false, error: "Time is out of range." };
  }
  // A non-zero score cannot legitimately happen in under a second.
  if (score > 0 && timeMs < 1000) {
    return { ok: false, error: "Time is too short for that score." };
  }
  return { ok: true, score, timeMs };
}
