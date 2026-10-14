/**
 * Standalone unit tests for combo/score rules and power-up inventory helpers.
 * Run with:  node --experimental-strip-types scripts/score.test.ts
 */

import assert from "node:assert/strict";
import { COMBO_RULES, comboMultiplier, mergeGain, nextCombo } from "../src/lib/game/scoreRules.ts";
import {
  POWERUPS,
  applyEarn,
  consumeCharge,
  emptyUsed,
  initialInventory,
} from "../src/lib/game/powerups.ts";

let passed = 0;

function test(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

test("multiplier is 1 for combo 0 and 1", () => {
  assert.equal(comboMultiplier(0), 1);
  assert.equal(comboMultiplier(1), 1);
});

test("multiplier grows by 0.25 per step", () => {
  assert.equal(comboMultiplier(2), 1.25);
  assert.equal(comboMultiplier(3), 1.5);
  assert.equal(comboMultiplier(4), 1.75);
});

test("multiplier is capped at the configured max", () => {
  assert.equal(comboMultiplier(5), COMBO_RULES.cap);
  assert.equal(comboMultiplier(50), COMBO_RULES.cap);
});

test("mergeGain rounds base × multiplier", () => {
  assert.equal(mergeGain(2, 1), 2);
  assert.equal(mergeGain(3, 2), 4); // 3 × 1.25 = 3.75 → 4
  assert.equal(mergeGain(16, 3), 24); // 16 × 1.5
  assert.equal(mergeGain(2048, 5), 4096); // cap
});

test("streak extends inside the window, resets outside", () => {
  assert.equal(nextCombo(0, null, 1000), 1);
  assert.equal(nextCombo(3, 1000, 2500), 4); // exactly windowMs → still active
  assert.equal(nextCombo(3, 1000, 2501), 1); // one ms over → reset
  assert.equal(nextCombo(2, null, 99999), 1);
});

test("custom rules are respected", () => {
  const rules = { windowMs: 500, perStep: 0.5, cap: 1.5 };
  assert.equal(comboMultiplier(3, rules), 1.5);
  assert.equal(comboMultiplier(4, rules), 1.5); // capped
  assert.equal(nextCombo(1, 0, 500, rules), 2);
  assert.equal(nextCombo(1, 0, 501, rules), 1);
});

test("initial inventory matches configured starts", () => {
  const inv = initialInventory();
  for (const cfg of POWERUPS) {
    assert.equal(inv[cfg.id], cfg.start, `start for ${cfg.id}`);
  }
});

test("applyEarn respects the per-match cap", () => {
  const maxCfg = POWERUPS[0];
  let inv = initialInventory();
  inv = applyEarn(inv, maxCfg.id);
  assert.equal(inv[maxCfg.id], maxCfg.start + 1);
  // fill to the cap
  for (let i = 0; i < 10; i += 1) inv = applyEarn(inv, maxCfg.id);
  assert.equal(inv[maxCfg.id], maxCfg.max);
  assert.equal(applyEarn(inv, maxCfg.id), inv); // unchanged reference when capped
});

test("consumeCharge returns null when empty", () => {
  const inv = initialInventory();
  const after = consumeCharge(inv, "joker");
  assert.ok(after);
  assert.equal(after.joker, inv.joker - 1);
  assert.equal(consumeCharge({ ...after, joker: 0 }, "joker"), null);
  assert.equal(inv.joker, 1); // original untouched (immutable)
});

test("used counters start empty and zeroed", () => {
  const used = emptyUsed();
  assert.deepEqual(used, { joker: 0, bomb: 0, scramble: 0, undo: 0 });
});

console.log(`\nAll ${passed} score/power-up tests passed.`);
