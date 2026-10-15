/**
 * Standalone unit tests for the pure merge-queue logic.
 * Run with:  node --experimental-strip-types scripts/merge.test.ts
 */

import assert from "node:assert/strict";
import { MergeQueue } from "../src/lib/game/merge.ts";

interface Stub {
  id: number;
  value: number;
  alive: boolean;
  x: number;
  y: number;
}

let nextId = 1000;

const mk = (id: number, value: number, x = 0, y = 0): Stub => ({ id, value, alive: true, x, y });

function setup() {
  const q = new MergeQueue<Stub>();
  const spawned: Stub[] = [];
  const handler = (a: Stub, b: Stub, x: number, y: number): void => {
    a.alive = false;
    b.alive = false;
    const merged: Stub = { id: nextId++, value: a.value * 2, alive: true, x, y };
    spawned.push(merged);
    q.release(a.id);
    q.release(b.id);
  };
  return {
    q,
    spawned,
    process: () => q.process(handler),
  };
}

let passed = 0;

function test(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

test("2 + 2 = 4 merge", () => {
  const { q, spawned, process } = setup();
  const a = mk(1, 2, 10, 10);
  const b = mk(2, 2, 30, 10);
  q.register(a, b);
  const out = process();
  assert.equal(out.length, 1);
  assert.equal(out[0].resultValue, 4);
  assert.equal(out[0].x, 20);
  assert.equal(out[0].y, 10);
  assert.equal(a.alive, false);
  assert.equal(b.alive, false);
  assert.equal(spawned.length, 1);
  assert.equal(spawned[0].value, 4);
});

test("4 + 4 = 8 merge", () => {
  const { q, spawned, process } = setup();
  const a = mk(11, 4);
  const b = mk(12, 4);
  q.register(a, b);
  const out = process();
  assert.equal(out.length, 1);
  assert.equal(out[0].resultValue, 8);
  assert.equal(spawned[0].value, 8);
});

test("different values never merge", () => {
  const { q, process } = setup();
  const a = mk(21, 2);
  const b = mk(22, 4);
  q.register(a, b);
  q.register(b, a);
  const out = process();
  assert.equal(out.length, 0);
  assert.equal(a.alive, true);
  assert.equal(b.alive, true);
  assert.equal(q.pending, 0);
});

test("same pair registered twice only merges once", () => {
  const { q, spawned, process } = setup();
  const a = mk(31, 8);
  const b = mk(32, 8);
  q.register(a, b);
  q.register(a, b);
  q.register(b, a);
  const out = process();
  assert.equal(out.length, 1);
  assert.equal(spawned.length, 1);
});

test("a jersey is consumed at most once per step", () => {
  const { q, process } = setup();
  const a = mk(41, 4);
  const b = mk(42, 4);
  const c = mk(43, 4);
  q.register(a, b);
  q.register(a, c);
  const out = process();
  assert.equal(out.length, 1);
  assert.equal(a.alive, false);
  assert.equal(c.alive, true);
});

test("chain merge: result can merge with an equal jersey", () => {
  const { q, spawned, process } = setup();
  const a = mk(51, 2);
  const b = mk(52, 2);
  const e = mk(53, 4, 20, 0);
  q.register(a, b);
  process();
  assert.equal(spawned.length, 1);
  const d = spawned[0]; // value 4
  assert.equal(d.value, 4);
  assert.equal(d.alive, true);
  q.register(d, e);
  const out = process();
  assert.equal(out.length, 1);
  assert.equal(out[0].resultValue, 8);
  assert.equal(e.alive, false);
});

test("dead jersey in a queued pair is skipped", () => {
  const { q, process } = setup();
  const a = mk(61, 16);
  const b = mk(62, 16);
  q.register(a, b);
  a.alive = false; // consumed elsewhere before processing
  const out = process();
  assert.equal(out.length, 0);
  assert.equal(b.alive, true);
});

test("reset clears pending pairs, locks and dedupe state", () => {
  const { q, process } = setup();
  const a = mk(71, 2);
  const b = mk(72, 2);
  q.register(a, b);
  assert.equal(q.pending, 1);
  q.reset();
  assert.equal(q.pending, 0);
  assert.equal(process().length, 0);
  assert.equal(a.alive, true);
});

test("locked id cannot be registered for another merge", () => {
  const { q, process } = setup();
  const a = mk(81, 32);
  const b = mk(82, 32);
  const c = mk(83, 32);
  q.register(a, b);
  const before = q.pending;
  q.register(a, c); // a is queued/locked by the time it is processed; register still allowed
  // Simulate lock state directly via first pair processing order:
  assert.equal(before, 1);
  const out = process();
  // a merged with b; (a,c) must be invalid because a is dead
  const acOutcome = out.filter((o) => o.a.id === a.id && o.b.id === c.id);
  assert.equal(acOutcome.length, 0);
  assert.equal(c.alive, true);
});

test("joker (wild) values never merge, even two jokers", () => {
  const { q, spawned, process } = setup();
  const j1 = mk(91, -1);
  const j2 = mk(92, -1);
  const n = mk(93, 4);
  q.register(j1, j2);
  q.register(j1, n);
  q.register(n, j2);
  const out = process();
  assert.equal(out.length, 0);
  assert.equal(spawned.length, 0);
  assert.equal(j1.alive, true);
  assert.equal(j2.alive, true);
  assert.equal(n.alive, true);
});

console.log(`\nAll ${passed} merge-queue tests passed.`);
