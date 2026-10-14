/**
 * Standalone unit tests for the mission system.
 * Run with:  node --experimental-strip-types scripts/missions.test.ts
 */

import assert from "node:assert/strict";
import { MissionTracker, initialMissionViews, MISSIONS } from "../src/lib/game/missions.ts";

let passed = 0;

function test(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

test("merge-count mission completes exactly on the 5th merge", () => {
  const t = new MissionTracker();
  const emissions: number[] = [];
  t.push(() => emissions.push(1));
  for (let i = 0; i < 4; i += 1) t.onMerge(4, 1);
  assert.equal(t.completed.length, 0);
  assert.equal(t.view().find((m) => m.id === "warmup")!.done, false);
  t.onMerge(4, 1);
  assert.equal(t.completed.length, 1);
  assert.equal(t.completed[0].id, "warmup");
  assert.equal(t.completed[0].reward, 30);
  assert.equal(t.view().find((m) => m.id === "warmup")!.done, true);
  assert.ok(emissions.length >= 1);
});

test("value mission completes when the merged value reaches 32", () => {
  const t = new MissionTracker();
  t.onMerge(4, 1);
  t.onMerge(8, 1);
  t.onMerge(16, 1);
  assert.equal(t.view().find((m) => m.id === "bigkit")!.done, false);
  assert.equal(t.view().find((m) => m.id === "bigkit")!.progress, 16);
  t.onMerge(32, 1);
  assert.equal(t.view().find((m) => m.id === "bigkit")!.done, true);
  assert.equal(t.completed.find((m) => m.id === "bigkit")!.reward, 80);
});

test("chain mission requires a 3-chain, not three separate merges", () => {
  const t = new MissionTracker();
  t.onMerge(4, 1);
  t.onMerge(4, 2);
  assert.equal(t.view().find((m) => m.id === "showtime")!.done, false);
  t.onMerge(4, 3);
  assert.equal(t.view().find((m) => m.id === "showtime")!.done, true);
});

test("missions complete only once and never re-emit after done", () => {
  const t = new MissionTracker();
  let emissions = 0;
  t.push(() => emissions += 1);
  for (let i = 0; i < 6; i += 1) t.onMerge(4, 1);
  for (const v of [8, 16, 32]) t.onMerge(v, 1);
  assert.equal(t.view().find((m) => m.id === "warmup")!.done, true);
  assert.equal(t.completed.filter((m) => m.id === "warmup").length, 1);
  assert.equal(t.completed.filter((m) => m.id === "bigkit").length, 1);
  const before = emissions;
  t.onMerge(4, 1); // all remaining work done — no new emissions
  assert.equal(emissions, before);
});

test("progress is capped at the target in views", () => {
  const t = new MissionTracker();
  for (let i = 0; i < 10; i += 1) t.onMerge(4, 1);
  const warmup = t.view().find((m) => m.id === "warmup")!;
  assert.equal(warmup.progress, warmup.target);
  assert.equal(warmup.done, true);
});

test("initial views are zeroed for every mission", () => {
  const views = initialMissionViews();
  assert.equal(views.length, MISSIONS.length);
  for (const v of views) {
    assert.equal(v.progress, 0);
    assert.equal(v.done, false);
  }
});

console.log(`\nAll ${passed} mission tests passed.`);
