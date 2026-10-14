/**
 * Daily streak logic. All day boundaries are UTC ("YYYY-MM-DD" keys), never
 * local time — documented in DAILY.md. A streak survives when the previous
 * active day is the immediate previous UTC day; anything else resets to 1.
 */

/** The UTC day key immediately before `dayKey`. */
export function prevUtcDayKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface StreakState {
  streak: number;
  lastActiveDay: string | null;
}

/** Pure transition: given current state and today's UTC key, return new state. */
export function touchStreak(state: StreakState, todayKey: string): StreakState {
  if (state.lastActiveDay === todayKey) {
    return state; // already active today — unchanged
  }
  if (state.lastActiveDay === null || state.streak <= 0) {
    return { streak: 1, lastActiveDay: todayKey };
  }
  if (state.lastActiveDay === prevUtcDayKey(todayKey)) {
    return { streak: state.streak + 1, lastActiveDay: todayKey };
  }
  // Missed at least one UTC day — streak resets.
  return { streak: 1, lastActiveDay: todayKey };
}
