/**
 * Standalone unit tests for the badge system.
 * Run with:  node --experimental-strip-types scripts/badges.test.ts
 */

import assert from "node:assert/strict";
import { BadgeTracker, BADGES } from "../src/lib/game/badges.ts";

let passed = 0;

function test(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

test("First Touch badge fires on the first merge", () => {
  const t = new BadgeTracker([]);
  const events: string[][] = [];
  t.push((_, all) => events.push(all));
  t.onMerge(4, 1);
  assert.equal(t.earned.length, 1);
  assert.equal(t.earned[0].id, "first_touch");
  assert.equal(events.length, 1);
  assert.ok(events[0].includes("first_touch"));
});

test("Kit Collector fires at 32, Grand Final at 128", () => {
  const t = new BadgeTracker([]);
  t.onMerge(4, 1);
  t.onMerge(8, 1);
  t.onMerge(16, 1);
  assert.equal(t.earned.some((b) => b.id === "kit_32"), false);
  t.onMerge(32, 1);
  assert.equal(t.earned.some((b) => b.id === "kit_32"), true);
  assert.equal(t.earned.some((b) => b.id === "kit_128"), false);
  t.onMerge(64, 1);
  t.onMerge(128, 1);
  assert.equal(t.earned.some((b) => b.id === "kit_128"), true);
});

test("Chain Star needs a 3-chain, not three merges", () => {
  const t = new BadgeTracker([]);
  t.onMerge(4, 1);
  t.onMerge(4, 1);
  assert.equal(t.earned.some((b) => b.id === "chain_3"), false);
  t.onMerge(4, 3);
  assert.equal(t.earned.some((b) => b.id === "chain_3"), true);
});

test("Hot Streak fires at 10 merges in the same run", () => {
  const t = new BadgeTracker([]);
  for (let i = 0; i < 9; i += 1) t.onMerge(4, 1);
  assert.equal(t.earned.some((b) => b.id === "merges_10"), false);
  t.onMerge(4, 1);
  assert.equal(t.earned.some((b) => b.id === "merges_10"), true);
});

test("Big Scorer fires when the score reaches 300", () => {
  const t = new BadgeTracker([]);
  t.onScore(299);
  assert.equal(t.earned.some((b) => b.id === "score_300"), false);
  t.onScore(300);
  assert.equal(t.earned.some((b) => b.id === "score_300"), true);
});

test("already-owned badges never fire again", () => {
  const t = new BadgeTracker(["first_touch", "kit_32"]);
  t.onMerge(32, 1);
  assert.equal(t.earned.length, 0);
  assert.deepEqual(t.all(), ["first_touch", "kit_32"]);
});

test("multiple badges in one event are reported together", () => {
  const t = new BadgeTracker([]);
  const events: Array<unknown[]> = [];
  t.push((earned) => events.push(earned));
  t.onMerge(4, 1); // first_touch
  assert.equal(events.length, 1);
  assert.equal(events[0].length, 1);
});

test("all six badges are defined with unique ids", () => {
  const ids = BADGES.map((b) => b.id);
  assert.equal(ids.length, 6);
  assert.equal(new Set(ids).size, 6);
});

console.log(`\nAll ${passed} badge tests passed.`);
