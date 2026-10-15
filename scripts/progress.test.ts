/**
 * Standalone unit tests for XP/levels, achievement tracking and
 * cloud-sync conflict merging.
 * Run with:  node --experimental-strip-types scripts/progress.test.ts
 */

import assert from "node:assert/strict";
import { ACHIEVEMENTS, ACHIEVEMENT_IDS } from "../src/lib/data/achievements.ts";
import { mergeCounters, mergeProgress } from "../src/lib/progress/merge.ts";
import { LEVEL_CONFIG, computeMatchXp, levelForXp, xpToReachLevel } from "../src/lib/progress/xp.ts";
import { ProgressTracker } from "../src/lib/progress/tracker.ts";
import { emptyProgress } from "../src/lib/progress/types.ts";

let passed = 0;

function test(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

// ---------- data file integrity ----------

test("achievement data: unique ids, valid metrics, positive targets", () => {
  assert.equal(ACHIEVEMENTS.length, ACHIEVEMENT_IDS.size);
  for (const a of ACHIEVEMENTS) {
    assert.ok(a.id.length > 0 && a.name.length > 0 && a.description.length > 0);
    assert.equal(typeof a.target, "number");
    assert.ok(a.target > 0);
    assert.ok(a.rewardXp >= 0);
    const counters = emptyProgress().counters;
    assert.ok(a.metric in counters, `metric ${a.metric} must exist on counters`);
  }
});

// ---------- XP / levels ----------

test("level thresholds are configurable and monotonically increasing", () => {
  assert.equal(xpToReachLevel(1), 0);
  assert.equal(xpToReachLevel(2), LEVEL_CONFIG.base);
  assert.ok(xpToReachLevel(3) > xpToReachLevel(2));
  assert.ok(xpToReachLevel(10) > xpToReachLevel(9));
});

test("levelForXp: boundaries, progress and max level", () => {
  assert.equal(levelForXp(0).level, 1);
  assert.equal(levelForXp(LEVEL_CONFIG.base - 1).level, 1);
  assert.equal(levelForXp(LEVEL_CONFIG.base).level, 2);
  const atMax = levelForXp(xpToReachLevel(LEVEL_CONFIG.maxLevel) + 999999);
  assert.equal(atMax.level, LEVEL_CONFIG.maxLevel);
  assert.equal(atMax.pct, 1);
  assert.equal(atMax.needed, 0);
  const mid = levelForXp(LEVEL_CONFIG.base + 10);
  assert.equal(mid.level, 2);
  assert.ok(mid.pct > 0 && mid.pct < 1);
});

test("computeMatchXp: score + combo bonus + daily bonus", () => {
  assert.equal(computeMatchXp({ score: 100, maxCombo: 0 }), 100);
  assert.equal(computeMatchXp({ score: 100, maxCombo: 3 }), 130);
  assert.equal(computeMatchXp({ score: 100, maxCombo: 3, isDaily: true }), 155);
  assert.equal(computeMatchXp({ score: -50, maxCombo: -2 }), 0);
});

// ---------- conflict merge ("most advanced wins") ----------

test("merge: higher counter wins per field", () => {
  const a = emptyProgress();
  const b = emptyProgress();
  a.counters.merges = 50;
  b.counters.merges = 30;
  a.counters.maxValue = 8;
  b.counters.maxValue = 16;
  const merged = mergeCounters(a.counters, b.counters);
  assert.equal(merged.merges, 50);
  assert.equal(merged.maxValue, 16);
});

test("merge: xp takes the maximum", () => {
  const a = emptyProgress();
  const b = emptyProgress();
  a.xp = 100;
  b.xp = 400;
  assert.equal(mergeProgress(a, b).xp, 400);
});

test("merge: achievements union (never lost), idempotent", () => {
  const a = emptyProgress();
  const b = emptyProgress();
  a.achievements = ["first_merge", "combo_3"];
  b.achievements = ["combo_3", "kit_16"];
  const merged = mergeProgress(a, b);
  assert.deepEqual(merged.achievements.sort(), ["combo_3", "first_merge", "kit_16"]);
  const again = mergeProgress(merged, merged);
  assert.deepEqual(again.achievements, merged.achievements);
});

test("merge: simulated cloud conflict (device A ahead in one field, device B in another)", () => {
  const deviceA = emptyProgress();
  deviceA.xp = 300;
  deviceA.counters.merges = 120;
  deviceA.counters.maxCombo = 4;
  deviceA.achievements = ["merge_50"];

  const deviceB = emptyProgress();
  deviceB.xp = 250;
  deviceB.counters.merges = 80;
  deviceB.counters.maxCombo = 7;
  deviceB.achievements = ["combo_3"];

  const merged = mergeProgress(deviceA, deviceB);
  assert.equal(merged.xp, 300); // A ahead
  assert.equal(merged.counters.merges, 120); // A ahead
  assert.equal(merged.counters.maxCombo, 7); // B ahead
  assert.deepEqual(merged.achievements.sort(), ["combo_3", "merge_50"]);

  // merge is commutative — order of arrival does not matter
  const mergedRev = mergeProgress(deviceB, deviceA);
  assert.deepEqual(mergedRev, merged);
});

// ---------- achievement tracking ----------

test("achievement unlocks exactly at the threshold, not before", () => {
  const t = new ProgressTracker();
  t.handleEvent({ type: "merge", value: 4, combo: 1 });
  assert.deepEqual(t.drainUnlocked().map((a) => a.id), ["first_merge"]);
  // 48 more merges -> total 49, merge_50 not yet
  for (let i = 0; i < 48; i += 1) t.handleEvent({ type: "merge", value: 4, combo: 1 });
  assert.equal(t.drainUnlocked().length, 0);
  // the 50th merge unlocks merge_50 exactly at the threshold
  t.handleEvent({ type: "merge", value: 4, combo: 1 });
  assert.equal(t.drainUnlocked().some((a) => a.id === "merge_50"), true);
});

test("achievement reward is granted once (never re-rewarded)", () => {
  const t = new ProgressTracker();
  t.handleEvent({ type: "merge", value: 4, combo: 1 });
  t.drainUnlocked();
  const xpAfterFirst = t.state.xp;
  assert.equal(t.state.xp, 20); // first_merge reward
  for (let i = 0; i < 500; i += 1) t.handleEvent({ type: "merge", value: 4, combo: 1 });
  const fresh = t.drainUnlocked().filter((a) => a.id === "first_merge");
  assert.equal(fresh.length, 0); // never fires again
  assert.ok(!t.state.achievements.slice(1).includes("first_merge")); // single entry
  assert.equal(t.state.xp, xpAfterFirst + 150); // only merge_50 + merge_200 fired (50+100)
});

test("value/combo/score/match achievements trigger from their events", () => {
  const t = new ProgressTracker();
  t.handleEvent({ type: "merge", value: 16, combo: 3 });
  let ids = t.drainUnlocked().map((a) => a.id);
  assert.ok(ids.includes("kit_16"));
  assert.ok(ids.includes("combo_3"));
  t.handleEvent({ type: "score", total: 500 });
  ids = t.drainUnlocked().map((a) => a.id);
  assert.ok(ids.includes("score_500"));
  for (let i = 0; i < 5; i += 1) t.handleEvent({ type: "gameover", score: 10 });
  ids = t.drainUnlocked().map((a) => a.id);
  assert.ok(ids.includes("matches_5"));
});

test("power-up counters feed per-kind achievements", () => {
  const t = new ProgressTracker();
  for (let i = 0; i < 3; i += 1) t.handleEvent({ type: "powerup", id: "bomb" });
  let ids = t.drainUnlocked().map((a) => a.id);
  assert.ok(ids.includes("bomb_3"));
  t.handleEvent({ type: "powerup", id: "undo" });
  ids = t.drainUnlocked().map((a) => a.id);
  assert.ok(ids.includes("undo_1"));
  assert.equal(t.state.counters.powerups, 4);
});

test("previously unlocked achievements are skipped (restore from storage)", () => {
  const stored = emptyProgress();
  stored.achievements = ["first_merge"];
  stored.xp = 20;
  const t = new ProgressTracker(stored);
  t.handleEvent({ type: "merge", value: 4, combo: 1 });
  const fresh = t.drainUnlocked();
  assert.ok(!fresh.some((a) => a.id === "first_merge"));
  assert.equal(t.state.xp, 20); // no double reward
});

console.log(`\nAll ${passed} progress tests passed.`);
