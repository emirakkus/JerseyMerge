/**
 * Balance + undo-semantics unit tests.
 * Run with:  node --experimental-strip-types scripts/balance.test.ts
 */

import assert from "node:assert/strict";
import {
  initialCharges,
  earnableCharges,
  maxChargesPerMatch,
  maxChargesFor,
  simulateMatchScore,
  missionsAchievableWithoutPowerups,
  type MergeEvent,
} from "../src/lib/game/balance.ts";
import {
  applyMatchSnapshot,
  createMatchSnapshot,
  type MatchSnapshot,
} from "../src/lib/game/undo.ts";

let passed = 0;

function test(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

// ---------- anti-spam: power-up usage is capped ----------

test("every match starts with exactly the configured 4 charges", () => {
  assert.equal(initialCharges(), 4);
});

test("at most 2 extra charges can be earned in a match (caps)", () => {
  assert.equal(earnableCharges(), 2);
});

test("hard cap: a player can never use more than 6 power-ups per match", () => {
  assert.equal(maxChargesPerMatch(), 6);
});

test("per-power-up caps match the config (joker 2, bomb 2, scramble 2, undo 1)", () => {
  assert.equal(maxChargesFor("joker"), 2);
  assert.equal(maxChargesFor("bomb"), 2);
  assert.equal(maxChargesFor("scramble"), 2);
  assert.equal(maxChargesFor("undo"), 1);
});

// ---------- fairness: the game is winnable WITHOUT power-ups ----------

/** A realistic mid-length match: 8 merges, one 3-chain, a 32 kit, no power-ups. */
const powerupFreeMatch: MergeEvent[] = [
  { value: 4, combo: 1 },
  { value: 8, combo: 1 },
  { value: 16, combo: 1 },
  { value: 32, combo: 1 },
  { value: 8, combo: 1 },
  { value: 16, combo: 1 },
  { value: 32, combo: 2 },
  { value: 32, combo: 3 },
];

test("all per-match missions are achievable with zero power-ups", () => {
  assert.equal(missionsAchievableWithoutPowerups(powerupFreeMatch), true);
});

test("a short match cannot fake mission completion (5 merges / 32 kit / 3-chain required)", () => {
  assert.equal(missionsAchievableWithoutPowerups([{ value: 32, combo: 3 }]), false); // too few merges
  assert.equal(missionsAchievableWithoutPowerups(powerupFreeMatch.map((e) => ({ ...e, value: 8, combo: 1 }))), false); // no 32 kit
});

test("a power-up-free match scores real points (scoring does not depend on power-ups)", () => {
  const score = simulateMatchScore(powerupFreeMatch);
  assert.ok(score >= 100, `expected >= 100, got ${score}`);
});

test("streak bonus is included in the simulation (chain of 6 pays the milestone)", () => {
  const chain: MergeEvent[] = [
    { value: 4, combo: 1 },
    { value: 8, combo: 2 },
    { value: 16, combo: 3 },
    { value: 32, combo: 4 },
    { value: 64, combo: 5 },
    { value: 128, combo: 6 },
  ];
  // 4 + 10 + 24 + 56 + (128 + 50) + (256 + 60) = 588
  assert.equal(simulateMatchScore(chain), 588);
});

// ---------- the joker's score contribution is bounded by its cap ----------

test("even a perfect joker player is bounded: 2 jokers on 64-kits pay exactly 256", () => {
  assert.equal(maxChargesFor("joker"), 2);
  const jokerSpam: MergeEvent[] = [
    { value: 128, combo: 1 },
    { value: 128, combo: 1 },
  ];
  assert.equal(simulateMatchScore(jokerSpam), 256);
});

// ---------- UNDO semantics: exactly what gets reverted ----------

function baseSnapshot(): MatchSnapshot {
  return {
    score: 100,
    powerups: { joker: 1, bomb: 1, scramble: 1, undo: 1 },
    comboCount: 0,
    lastMergeAt: null,
    missions: { state: new Map(), done: new Set(), completed: [] },
  };
}

test("undo reverts score, merges' side effects and combo to the pre-drop state", () => {
  const snap = baseSnapshot();
  const frozen = createMatchSnapshot(snap);

  // ...player drops a jersey; it merges and earns 150, combo climbs to 3...
  snap.score = 250;
  snap.comboCount = 3;
  snap.lastMergeAt = 1200;

  const result = applyMatchSnapshot(snap, frozen);
  assert.equal(result.scoreDelta, 150); // "UNDO −150"
  assert.equal(snap.score, 100);
  assert.equal(snap.comboCount, 0);
  assert.equal(snap.lastMergeAt, null);
});

test("undo refunds a power-up used AFTER the drop (bomb), keeping pre-drop inventory", () => {
  const snap = baseSnapshot();
  const frozen = createMatchSnapshot(snap);

  // ...after the drop the player also bombs the pile...
  snap.powerups.bomb = 0;

  applyMatchSnapshot(snap, frozen);
  assert.equal(snap.powerups.bomb, 1); // bomb charge comes back
  assert.equal(snap.powerups.joker, 1);
  assert.equal(snap.powerups.undo, 1); // (the undo charge itself is spent by the caller)
});

test("undo reverts mission progress made by the reverted merges", () => {
  const snap = baseSnapshot();
  const frozen = createMatchSnapshot(snap);

  // ...the dropped jersey completes the warm-up mission...
  snap.missions = {
    state: new Map([["warmup", 5]]),
    done: new Set(["warmup"]),
    completed: [{ id: "warmup", title: "Warm-up", description: "Complete 5 merges.", target: 5, reward: 30 }],
  };

  applyMatchSnapshot(snap, frozen);
  assert.equal(snap.missions.done.size, 0);
  assert.equal(snap.missions.completed.length, 0);
  assert.equal(snap.missions.state.get("warmup"), undefined);
});

test("undo is a no-op for score when the drop earned nothing", () => {
  const snap = baseSnapshot();
  const frozen = createMatchSnapshot(snap);
  const result = applyMatchSnapshot(snap, frozen);
  assert.equal(result.scoreDelta, 0);
  assert.equal(snap.score, 100);
});

console.log(`\nAll ${passed} balance/undo tests passed.`);
