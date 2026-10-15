/**
 * Standalone unit tests for the daily challenge systems.
 * Run with:  node --experimental-strip-types scripts/daily.test.ts
 */

import assert from "node:assert/strict";
import { dailySeed, hashSeed, mulberry32, utcDayKey } from "../src/lib/game/prng.ts";
import { randomSpawnValue } from "../src/lib/game/constants.ts";
import {
  getDailyQuests,
  isQuestDone,
  isValidQuestForDay,
  questProgress,
  type QuestMetric,
} from "../src/lib/daily/quests.ts";
import { prevUtcDayKey, touchStreak } from "../src/lib/daily/streak.ts";
import { DAILY_MAX_TIME_MS, DAILY_MAX_SCORE, validateDailySubmission } from "../src/lib/daily/validation.ts";
import { rateLimit } from "../src/lib/server/rateLimit.ts";

let passed = 0;

function test(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

test("day seed is deterministic per UTC day and unique across days", () => {
  assert.equal(dailySeed("2026-02-13"), dailySeed("2026-02-13"));
  assert.notEqual(dailySeed("2026-02-13"), dailySeed("2026-02-14"));
  assert.equal(typeof dailySeed(), "number");
  assert.equal(hashSeed("a"), hashSeed("a"));
  assert.notEqual(hashSeed("a"), hashSeed("b"));
});

test("two 'devices' get the identical spawn sequence on the same day", () => {
  const seed = dailySeed("2026-02-13");
  const deviceA = mulberry32(seed);
  const deviceB = mulberry32(seed);
  const seqA = Array.from({ length: 40 }, () => randomSpawnValue(deviceA));
  const seqB = Array.from({ length: 40 }, () => randomSpawnValue(deviceB));
  assert.deepEqual(seqA, seqB);
  // different day -> different sequence
  const deviceC = mulberry32(dailySeed("2026-02-14"));
  const seqC = Array.from({ length: 40 }, () => randomSpawnValue(deviceC));
  assert.notDeepEqual(seqA, seqC);
});

test("daily quests: 3 per day, deterministic, valid ids", () => {
  const day = "2026-02-13";
  const a = getDailyQuests(day);
  const b = getDailyQuests(day);
  assert.equal(a.length, 3);
  assert.deepEqual(a, b);
  const ids = new Set(a.map((q) => q.id));
  assert.equal(ids.size, 3);
  for (const q of a) {
    assert.ok(q.target > 0);
    assert.equal(isValidQuestForDay(day, q.id)?.id, q.id);
  }
});

test("quest progress + completion (all metrics)", () => {
  const base = { merges: 3, maxValue: 16, maxCombo: 2, score: 100, drops: 5, powerupsUsed: 1 };
  const mk = (metric: QuestMetric, target: number) => ({
    id: "t",
    title: "t",
    metric,
    target,
    reward: "joker" as const,
  });
  assert.equal(questProgress(mk("merges", 5), base), 3);
  assert.equal(questProgress(mk("reachValue", 32), base), 16);
  assert.equal(questProgress(mk("maxCombo", 4), base), 2);
  assert.equal(questProgress(mk("score", 100), base), 100);
  assert.equal(questProgress(mk("drops", 10), base), 5);
  assert.equal(questProgress(mk("powerupsUsed", 2), base), 1);
  assert.equal(isQuestDone(mk("merges", 3), base), true);
  assert.equal(isQuestDone(mk("merges", 4), base), false);
  assert.equal(isQuestDone(mk("reachValue", 16), base), true);
});

test("prevUtcDayKey handles month and leap-year boundaries", () => {
  assert.equal(prevUtcDayKey("2026-03-01"), "2026-02-28");
  assert.equal(prevUtcDayKey("2028-03-01"), "2028-02-29");
  assert.equal(prevUtcDayKey("2026-01-01"), "2025-12-31");
  assert.equal(prevUtcDayKey("2026-05-10"), "2026-05-09");
});

test("streak: first touch starts at 1", () => {
  assert.deepEqual(touchStreak({ streak: 0, lastActiveDay: null }, "2026-02-13"), {
    streak: 1,
    lastActiveDay: "2026-02-13",
  });
});

test("streak: same UTC day does not change", () => {
  const s = { streak: 5, lastActiveDay: "2026-02-13" };
  assert.deepEqual(touchStreak(s, "2026-02-13"), s);
});

test("streak: consecutive UTC day increments", () => {
  const s = { streak: 5, lastActiveDay: "2026-02-12" };
  assert.deepEqual(touchStreak(s, "2026-02-13"), { streak: 6, lastActiveDay: "2026-02-13" });
});

test("streak: skipped day resets to 1 (day rollover)", () => {
  const s = { streak: 9, lastActiveDay: "2026-02-11" };
  assert.deepEqual(touchStreak(s, "2026-02-13"), { streak: 1, lastActiveDay: "2026-02-13" });
});

test("streak: long absence resets; month boundary is consecutive", () => {
  const long = { streak: 3, lastActiveDay: "2026-01-15" };
  assert.equal(touchStreak(long, "2026-02-13").streak, 1);
  const month = { streak: 3, lastActiveDay: "2026-02-28" };
  assert.equal(touchStreak(month, "2026-03-01").streak, 4);
});

test("submission validation: caps and sanity", () => {
  assert.equal(validateDailySubmission({ score: 500, timeMs: 60000 }).ok, true);
  assert.equal(validateDailySubmission({ score: DAILY_MAX_SCORE + 1, timeMs: 60000 }).ok, false);
  assert.equal(validateDailySubmission({ score: -5, timeMs: 60000 }).ok, false);
  assert.equal(validateDailySubmission({ score: 100, timeMs: DAILY_MAX_TIME_MS + 1 }).ok, false);
  assert.equal(validateDailySubmission({ score: 100, timeMs: 100 }).ok, false); // too fast
  assert.equal(validateDailySubmission({ score: "abc", timeMs: 60000 }).ok, false);
  assert.equal(validateDailySubmission(null).ok, false);
});

test("rate limiter allows up to the limit then blocks", () => {
  const key = `test-${Date.now()}`;
  const results = [1, 2, 3, 4, 5].map(() => rateLimit(key, 3, 60000));
  assert.deepEqual(results, [true, true, true, false, false]);
});

test("utcDayKey returns YYYY-MM-DD", () => {
  assert.match(utcDayKey(new Date("2026-02-13T23:59:59Z")), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(utcDayKey(new Date("2026-02-13T23:59:59Z")), "2026-02-13");
});

console.log(`\nAll ${passed} daily tests passed.`);
