/**
 * JerseyEngine — owns the Matter.js world, the merge queue, power-ups, combo
 * scoring, canvas rendering, FX and game-over logic. React never renders
 * per-frame: the engine pushes discrete events through callbacks.
 */

import Matter from "matter-js";
import {
  BOARD_W,
  BOMB_RADIUS,
  BOMB_VALUE,
  BREACH_GRACE_MS,
  DANGER_Y,
  DROP_COOLDOWN_MS,
  DROP_Y,
  JOKER_RADIUS,
  JOKER_VALUE,
  STEP_MS,
  radiusFor,
  randomSpawnValue,
  themeFor,
} from "./constants";
import { createJerseyBody, createWorld } from "./physics";
import { drawFrame } from "./render";
import { MergeQueue, type Mergeable } from "./merge";
import { FxSystem } from "./fx";
import { MissionTracker, type MissionSnapshot, type MissionView } from "./missions";
import { BadgeTracker } from "./badges";
import { levelFor } from "./levels";
import { refreshJerseySprites } from "./jersey";
import { loadBest, loadOwnedBadges, saveBest, saveOwnedBadges } from "./scoring";
import { sfx } from "./sfx";
<<<<<<< HEAD
import { COMBO_RULES, comboMultiplier, mergeGain, nextCombo, streakBonus } from "./scoreRules";
import { vibrate } from "./haptics";
=======
import { COMBO_RULES, comboMultiplier, mergeGain, nextCombo } from "./scoreRules";
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
import { mulberry32, type Rng } from "./prng";
import type { GameEvent } from "./events";
import {
  BOMB_BLAST_RADIUS,
  POWERUPS,
  addBonus,
  applyEarn,
  consumeCharge,
  emptyUsed,
  initialInventory,
  type PowerupId,
  type PowerupInventory,
  type PowerupSnapshot,
} from "./powerups";

export type GameStatus = "idle" | "playing" | "paused" | "over";

export interface ComboEvent {
  count: number;
  multiplier: number;
}

export interface EngineCallbacks {
  onScore: (score: number, best: number) => void;
  onNext: (value: number) => void;
  onGameOver: (score: number) => void;
  onMissions: (missions: MissionView[]) => void;
  onBadges: (owned: string[]) => void;
  onDanger: (danger: boolean) => void;
  onPowerups: (snapshot: PowerupSnapshot) => void;
  onCombo: (combo: ComboEvent) => void;
  onGameEvent: (event: GameEvent) => void;
}

export type GameMode = "classic" | "daily";

interface SnapshotJersey {
  value: number;
  radius: number;
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
}

/** Point-in-time world state used by the Undo power-up. */
interface WorldSnapshot {
  jerseys: SnapshotJersey[];
  score: number;
  powerups: PowerupInventory;
  comboCount: number;
  lastMergeAt: number | null;
  missions: MissionSnapshot;
}

class Jersey implements Mergeable {
  readonly id: number;
  readonly value: number;
  readonly radius: number;
  readonly spawnAt: number;
  readonly body: Matter.Body;
  alive = true;

  constructor(value: number, body: Matter.Body, radius: number, now: number) {
    this.value = value;
    this.body = body;
    this.radius = radius;
    this.id = body.id;
    this.spawnAt = now;
  }

  get x(): number {
    return this.body.position.x;
  }

  get y(): number {
    return this.body.position.y;
  }
}

export class JerseyEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;
  private engine: Matter.Engine;
  private walls: Matter.Body[];
  private mergeQueue: MergeQueue<Jersey>;
  private fx = new FxSystem();
  private viewScale = 1;
  private raf = 0;
  private lastTs = 0;
  private accumulator = 0;
  private destroyed = false;
  private reducedMotion = false;

  status: GameStatus = "idle";
  mode: GameMode = "classic";
  private rng: Rng = Math.random;
  private score = 0;
  private best: number;
  private aimX = BOARD_W / 2;
  private nextValue: number;
  private lastDropAt = -1e9;
  private breachMs = 0;
  private elapsedMs = 0;
  private breachWarned = false;

  private powerups: PowerupInventory = initialInventory();
  private used: Record<PowerupId, number> = emptyUsed();
  private canUndo = false;
  private snapshot: WorldSnapshot | null = null;
  private comboCount = 0;
  private lastMergeAt: number | null = null;
  private bestCombo = 0;
  private pendingJoker: { joker: Jersey; target: Jersey } | null = null;
  private pendingBomb: Jersey | null = null;

  private missions = new MissionTracker();
  private badges: BadgeTracker;
  private jerseys: Jersey[] = [];
  private byId = new Map<number, Jersey>();

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.best = loadBest();
    this.badges = new BadgeTracker([]);
    this.reducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.fx.setReducedMotion(this.reducedMotion);
    // Re-bake jersey sprites once the rounded webfont is available.
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready
        .then(() => {
          if (!this.destroyed) refreshJerseySprites();
        })
        .catch(() => {
          /* ignore */
        });
    }
    const setup = createWorld();
    this.engine = setup.engine;
    this.walls = setup.walls;
    this.mergeQueue = new MergeQueue<Jersey>();
    this.nextValue = randomSpawnValue();
    Matter.Events.on(this.engine, "collisionStart", this.handleCollisionStart);
    this.raf = requestAnimationFrame(this.loop);
  }

  // ------------------------------------------------------------------ setup

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    Matter.Events.off(this.engine, "collisionStart", this.handleCollisionStart);
    Matter.Engine.clear(this.engine);
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    const w = Math.max(1, Math.round(cssWidth * dpr));
    const h = Math.max(1, Math.round(cssHeight * dpr));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    this.viewScale = w / BOARD_W;
    void h;
  }

  // ---------------------------------------------------------------- control

  /** Starts a fresh classic game (also used for instant restart). */
  start(bonus?: Partial<PowerupInventory>): void {
    this.beginRun("classic", Math.random, bonus);
  }

  /**
   * Starts the daily challenge: same spawn sequence for everyone today
   * (seed derived from the UTC day), plus any quest-reward bonuses.
   */
  startDaily(seed: number, bonus?: Partial<PowerupInventory>): void {
    this.beginRun("daily", mulberry32(seed), bonus);
  }

  private beginRun(mode: GameMode, rng: Rng, bonus?: Partial<PowerupInventory>): void {
    if (this.destroyed) return;
    this.mode = mode;
    this.rng = rng;
    Matter.Composite.clear(this.engine.world, false, true);
    Matter.Composite.add(this.engine.world, this.walls);
    this.jerseys = [];
    this.byId.clear();
    this.mergeQueue.reset();
    this.fx.clear();
    this.score = 0;
    this.breachMs = 0;
    this.elapsedMs = 0;
    this.lastDropAt = -1e9;
    this.aimX = BOARD_W / 2;
    this.missions = new MissionTracker();
    this.missions.push(this.callbacks.onMissions);
    this.badges = new BadgeTracker(loadOwnedBadges());
    this.badges.push((_earned, all) => this.callbacks.onBadges(all));
    this.breachWarned = false;
    this.powerups = addBonus(initialInventory(), bonus);
    this.used = emptyUsed();
    this.canUndo = false;
    this.snapshot = null;
    this.comboCount = 0;
    this.lastMergeAt = null;
    this.bestCombo = 0;
    this.pendingJoker = null;
    this.pendingBomb = null;
    this.nextValue = randomSpawnValue(this.rng);
    this.status = "playing";
    sfx.unlock();
    sfx.ui();
    this.callbacks.onScore(0, this.best);
    this.callbacks.onNext(this.nextValue);
    this.emitPowerups();
    this.callbacks.onCombo({ count: 0, multiplier: 1 });
  }

  pause(): void {
    if (this.status === "playing") this.status = "paused";
  }

  resume(): void {
    if (this.status === "paused") this.status = "playing";
  }

  togglePause(): void {
    if (this.status === "playing") this.status = "paused";
    else if (this.status === "paused") this.status = "playing";
  }

  /** Back to the menu: clears the arena and stops the simulation. */
  toMenu(): void {
    if (this.destroyed || this.status === "idle") return;
    Matter.Composite.clear(this.engine.world, false, true);
    Matter.Composite.add(this.engine.world, this.walls);
    this.jerseys = [];
    this.byId.clear();
    this.mergeQueue.reset();
    this.fx.clear();
    this.breachMs = 0;
    this.breachWarned = false;
    this.powerups = initialInventory();
    this.used = emptyUsed();
    this.canUndo = false;
    this.snapshot = null;
    this.comboCount = 0;
    this.lastMergeAt = null;
    this.pendingJoker = null;
    this.pendingBomb = null;
    this.status = "idle";
  }

  // ------------------------------------------------------------------ input

  setAimFromClient(clientX: number): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = ((clientX - rect.left) / rect.width) * BOARD_W;
    this.aimX = this.clampAim(x, radiusFor(this.nextValue));
  }

  nudgeAim(dx: number): void {
    this.aimX = this.clampAim(this.aimX + dx, radiusFor(this.nextValue));
  }

  drop(): void {
    if (this.status !== "playing") return;
    const now = performance.now();
    if (now - this.lastDropAt < DROP_COOLDOWN_MS) return;
    this.takeSnapshot();
    const r = radiusFor(this.nextValue);
    const x = this.clampAim(this.aimX, r);
    const body = createJerseyBody(x, DROP_Y, r);
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 0.8, y: 2.2 });
    Matter.Composite.add(this.engine.world, body);
    const jersey = new Jersey(this.nextValue, body, r, now);
    this.jerseys.push(jersey);
    this.byId.set(body.id, jersey);
    this.lastDropAt = now;
    this.canUndo = true;
    sfx.drop();
<<<<<<< HEAD
    if (this.nextValue >= 64) {
      // Premium kits make a louder entrance.
      this.fx.flash(x, DROP_Y, r, "#ffd24a", 200);
      this.fx.ring(x, DROP_Y, "#ffd24a", r * 1.8);
    }
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    this.emitEvent({ type: "drop" });
    this.nextValue = randomSpawnValue(this.rng);
    this.callbacks.onNext(this.nextValue);
  }

  /** Drops the joker form: merges with the first jersey it touches. */
  dropJoker(): void {
    this.spawnPowerupDrop("joker", JOKER_VALUE, JOKER_RADIUS);
  }

  /** Drops the bomb: clears every form inside its blast radius. */
  dropBomb(): void {
    this.spawnPowerupDrop("bomb", BOMB_VALUE, BOMB_RADIUS);
  }

  /** Instantly shuffles the pile with a light physics burst. */
  scramblePile(): void {
    if (this.status !== "playing") return;
    const inv = consumeCharge(this.powerups, "scramble");
    if (!inv) return;
    this.powerups = inv;
    this.used.scramble += 1;
    for (const j of this.jerseys) {
      Matter.Sleeping.set(j.body, false);
      const drift = (Math.random() - 0.5) * 7;
      Matter.Body.setVelocity(j.body, { x: drift, y: -(2.5 + Math.random() * 3.5) });
      Matter.Body.setAngularVelocity(j.body, (Math.random() - 0.5) * 0.35);
    }
    this.fx.floater(BOARD_W / 2, 190, "SHUFFLE!", "#7dd3fc", 24);
    this.fx.ring(BOARD_W / 2, 300, "#7dd3fc", 150);
    this.shakeFx(6);
    sfx.scramble();
    this.emitEvent({ type: "powerup", id: "scramble" });
    this.emitPowerups();
  }

  /** Restores the world captured before the last jersey drop. */
  undoDrop(): void {
    if (this.status !== "playing") return;
    if (this.powerups.undo <= 0 || !this.snapshot || !this.canUndo) return;
    const snap = this.snapshot;
    this.powerups = { ...snap.powerups, undo: snap.powerups.undo - 1 };
    this.used.undo += 1;
    this.snapshot = null;
    this.canUndo = false;

    for (const j of this.jerseys) {
      j.alive = false;
      Matter.Composite.remove(this.engine.world, j.body);
      this.mergeQueue.release(j.id);
    }
    this.byId.clear();
    this.jerseys = [];
    this.mergeQueue.reset();
    this.pendingJoker = null;
    this.pendingBomb = null;

    const now = performance.now();
    for (const s of snap.jerseys) {
      const body = createJerseyBody(s.x, s.y, s.radius);
      Matter.Body.setVelocity(body, { x: s.vx, y: s.vy });
      Matter.Body.setAngle(body, s.angle);
      Matter.Body.setAngularVelocity(body, 0);
      Matter.Sleeping.set(body, false);
      Matter.Composite.add(this.engine.world, body);
      const jersey = new Jersey(s.value, body, s.radius, now);
      this.jerseys.push(jersey);
      this.byId.set(body.id, jersey);
    }

<<<<<<< HEAD
    const revertedScore = Math.max(0, this.score - snap.score);
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    this.score = snap.score;
    this.comboCount = snap.comboCount;
    this.lastMergeAt = snap.lastMergeAt;
    this.missions.restore(snap.missions);

<<<<<<< HEAD
    // Show exactly what came back: the points the reverted drop had earned.
    this.fx.floater(
      BOARD_W / 2,
      160,
      revertedScore > 0 ? `UNDO  −${revertedScore}` : "UNDO",
      "#7dd3fc",
      22
    );
=======
    this.fx.floater(BOARD_W / 2, 160, "UNDO!", "#7dd3fc", 22);
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    sfx.undo();
    this.emitEvent({ type: "powerup", id: "undo" });
    this.emitPowerups();
    this.callbacks.onScore(this.score, this.best);
    this.callbacks.onMissions(this.missions.view());
    this.callbacks.onCombo({ count: this.comboCount, multiplier: comboMultiplier(this.comboCount) });
  }

  private spawnPowerupDrop(id: "joker" | "bomb", value: number, radius: number): void {
    if (this.status !== "playing") return;
    const now = performance.now();
    if (now - this.lastDropAt < DROP_COOLDOWN_MS) return;
    const inv = consumeCharge(this.powerups, id);
    if (!inv) return;
    this.powerups = inv;
    this.used[id] += 1;
    const x = this.clampAim(this.aimX, radius);
    const body = createJerseyBody(x, DROP_Y, radius);
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 0.8, y: 2.2 });
    Matter.Composite.add(this.engine.world, body);
    const jersey = new Jersey(value, body, radius, now);
    this.jerseys.push(jersey);
    this.byId.set(body.id, jersey);
    this.lastDropAt = now;
    sfx.drop();
    this.emitEvent({ type: "powerup", id });
    this.emitPowerups();
  }

  /** Point-in-time copy of the world, taken right before each jersey drop. */
  private takeSnapshot(): void {
    this.snapshot = {
      jerseys: this.jerseys.map((j) => ({
        value: j.value,
        radius: j.radius,
        x: j.x,
        y: j.y,
        angle: j.body.angle,
        vx: j.body.velocity.x,
        vy: j.body.velocity.y,
      })),
      score: this.score,
      powerups: { ...this.powerups },
      comboCount: this.comboCount,
      lastMergeAt: this.lastMergeAt,
      missions: this.missions.snapshot(),
    };
  }

  private clampAim(x: number, r: number): number {
    const min = r * 0.72 + 8;
    const max = BOARD_W - min;
    return Math.min(max, Math.max(min, x));
  }

  powerupView(): PowerupSnapshot {
    return {
      inventory: { ...this.powerups },
      used: { ...this.used },
      canUndo: this.canUndo,
      bestCombo: this.bestCombo,
    };
  }

  private emitPowerups(): void {
    this.callbacks.onPowerups(this.powerupView());
  }

  // ---------------------------------------------------------------- physics

  private handleCollisionStart = (event: Matter.IEventCollision<Matter.Engine>): void => {
    for (const pair of event.pairs) {
      const a = this.byId.get(pair.bodyA.id);
      const b = this.byId.get(pair.bodyB.id);
      const aAlive = a && a.alive ? a : null;
      const bAlive = b && b.alive ? b : null;

      // Bomb: pops on first contact with anything (resolved between steps).
      const bomb =
        aAlive && aAlive.value === BOMB_VALUE
          ? aAlive
          : bAlive && bAlive.value === BOMB_VALUE
            ? bAlive
            : null;
      if (bomb) {
        if (this.pendingBomb === null) this.pendingBomb = bomb;
        continue;
      }

      // Joker: pairs with the jersey it touches; idle until contact.
      const joker =
        aAlive && aAlive.value === JOKER_VALUE
          ? aAlive
          : bAlive && bAlive.value === JOKER_VALUE
            ? bAlive
            : null;
      if (joker) {
        const target = joker === aAlive ? bAlive : aAlive;
        if (target && target.value > 0 && this.pendingJoker === null) {
          this.pendingJoker = { joker, target };
        }
        continue;
      }

      if (aAlive && bAlive) this.mergeQueue.register(aAlive, bAlive);
    }
  };

  private loop = (ts: number): void => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.loop);
    if (this.lastTs === 0) this.lastTs = ts;
    let dt = ts - this.lastTs;
    this.lastTs = ts;
    if (dt > 100) dt = 100;

    if (this.status === "playing") {
      this.elapsedMs += dt;
      this.accumulator += dt;
      let steps = 0;
      while (this.accumulator >= STEP_MS && steps < 3) {
        Matter.Engine.update(this.engine, STEP_MS);
        this.accumulator -= STEP_MS;
        steps += 1;
      }
      if (steps > 0) this.afterPhysics(dt);
    } else {
      this.accumulator = 0;
    }

    this.fx.update(dt);
    this.render(ts);
  };

  /** Runs only between physics steps — the safe point to mutate the world. */
  private afterPhysics(dt: number): void {
    if (this.pendingJoker) {
      const p = this.pendingJoker;
      this.pendingJoker = null;
      if (p.joker.alive && p.target.alive) {
        this.completeMerge(
          p.joker,
          p.target,
          p.target.value * 2,
          (p.joker.x + p.target.x) / 2,
          (p.joker.y + p.target.y) / 2
        );
      }
    }
    if (this.pendingBomb) {
      const bomb = this.pendingBomb;
      this.pendingBomb = null;
      if (bomb.alive) this.explode(bomb);
    }
    this.mergeQueue.process((a, b, x, y) => this.completeMerge(a, b, a.value * 2, x, y));
    this.updateDanger(dt);
  }

  /** Removes everything inside the blast radius. No score — just space. */
  private explode(bomb: Jersey): void {
    bomb.alive = false;
    Matter.Composite.remove(this.engine.world, bomb.body);
    this.byId.delete(bomb.id);
    const R = BOMB_BLAST_RADIUS;
<<<<<<< HEAD
    let cleared = 0;
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    for (const j of this.jerseys) {
      const dx = j.x - bomb.x;
      const dy = j.y - bomb.y;
      if (dx * dx + dy * dy <= (R + j.radius) * (R + j.radius)) {
        j.alive = false;
        Matter.Composite.remove(this.engine.world, j.body);
        this.byId.delete(j.id);
        this.mergeQueue.release(j.id);
        this.burstS(j.x, j.y, ["#94a3b8", "#e2e8f0", "#64748b"], 10, 4);
<<<<<<< HEAD
        cleared += 1;
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
      }
    }
    this.jerseys = this.jerseys.filter((j) => j.alive);
    this.burstS(bomb.x, bomb.y, ["#ffd24a", "#ffffff", "#94a3b8"], 30, 6);
    this.fx.ring(bomb.x, bomb.y, "#e2e8f0", R + 12);
<<<<<<< HEAD
    // Make the effect visible: show exactly how much space was opened.
    this.fx.floater(bomb.x, bomb.y - 40, cleared > 0 ? `BOOM! ${cleared} cleared` : "BOOM!", "#fca5a5", 22);
=======
    this.fx.floater(bomb.x, bomb.y - 40, "BOOM!", "#fca5a5", 22);
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    this.shakeFx(9);
    sfx.bomb();
  }

  /** Consumes a and b and spawns the merged jersey; applies combo scoring. */
  private completeMerge(a: Jersey, b: Jersey, value: number, x: number, y: number): void {
    const now = performance.now();
    a.alive = false;
    b.alive = false;
    Matter.Composite.remove(this.engine.world, a.body);
    Matter.Composite.remove(this.engine.world, b.body);
    this.byId.delete(a.id);
    this.byId.delete(b.id);
    this.mergeQueue.release(a.id);
    this.mergeQueue.release(b.id);
    this.jerseys = this.jerseys.filter((j) => j.alive);

    const r = radiusFor(value);
    const body = createJerseyBody(x, Math.max(y, r), r);
    Matter.Body.setVelocity(body, { x: 0, y: 1.6 });
    Matter.Body.setAngularVelocity(body, 0.02);
    Matter.Composite.add(this.engine.world, body);
    const jersey = new Jersey(value, body, r, now);
    this.jerseys.push(jersey);
    this.byId.set(body.id, jersey);

    // Combo: merges inside the window extend the streak (game time, pause-safe).
    this.comboCount = nextCombo(this.comboCount, this.lastMergeAt, this.elapsedMs);
    this.lastMergeAt = this.elapsedMs;
    this.bestCombo = Math.max(this.bestCombo, this.comboCount);
    const mult = comboMultiplier(this.comboCount);
    const gain = mergeGain(value, this.comboCount);
<<<<<<< HEAD
    const bonus = streakBonus(this.comboCount);
    this.emitEvent({ type: "merge", value, combo: this.comboCount });
    this.addScore(gain + bonus);
=======
    this.emitEvent({ type: "merge", value, combo: this.comboCount });
    this.addScore(gain);
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    this.missions.onMerge(value, this.comboCount);
    if (this.missions.completed.length > 0) this.settleMissions();
    this.badges.onMerge(value, this.comboCount);
    if (this.badges.earned.length > 0) this.settleBadges();

    const theme = themeFor(value);
    const colors = [theme.primary, theme.secondary, "#ffffff"];
<<<<<<< HEAD
    // Merge moment: flash + pop + burst + ring (pop scale is in the render module).
    this.fx.flash(x, y, r * 1.25, value >= 64 ? "#ffd24a" : "#ffffff", value >= 64 ? 260 : 200);
    this.burstS(x, y, colors, Math.min(40, 12 + Math.floor(value / 16)), 4.5 + Math.min(4, value / 96));
    this.fx.ring(x, y, theme.secondary, r * 1.6);
    this.fx.floater(x, y - r * 0.35, `+${gain + bonus}`, "#ffffff", Math.min(34, 19 + value / 64));
=======
    this.burstS(x, y, colors, Math.min(40, 12 + Math.floor(value / 16)), 4.5 + Math.min(4, value / 96));
    this.fx.ring(x, y, theme.secondary, r * 1.6);
    this.fx.floater(x, y - r * 0.35, `+${gain}`, "#ffffff", Math.min(34, 19 + value / 64));
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    if (this.comboCount >= 2) {
      this.fx.floater(x, y - r - 18, `COMBO x${this.comboCount}  ${mult}×`, "#ffd24a", 19);
      this.burstS(x, y - r, ["#ffd24a", "#ffffff"], 8, 3);
      this.shakeFx(1.5);
<<<<<<< HEAD
      sfx.comboTick(this.comboCount);
    }
    if (bonus > 0) {
      this.fx.floater(x, y - r - 38, `STREAK +${bonus}`, "#ffd24a", 21);
      this.fx.ring(x, y, "#ffd24a", r * 2.2);
      sfx.streak();
      vibrate([20, 30, 20]);
    }
    if (value >= 64 && (value & (value - 1)) === 0) {
      this.fx.floater(x, y - r - 58, `${theme.name.toUpperCase()} KIT!`, theme.secondary, 15);
    }
    const jokerUsed = a.value === JOKER_VALUE || b.value === JOKER_VALUE;
    if (jokerUsed) {
      // Make the joker's score effect explicit: which kit it upgraded.
      this.fx.floater(x, y - r - 78, `JOKER ${value / 2} → ${value}`, "#7dd3fc", 16);
    }
    if (value >= 2048) {
      // Champion-tier fanfare.
      this.burstS(x, y, ["#ffd24a", "#fff3b0", "#ffffff"], 34, 7);
      this.fx.flash(x, y, r * 1.7, "#fff3b0", 340);
      this.shakeFx(8);
=======
    }
    if (value >= 64 && (value & (value - 1)) === 0) {
      this.fx.floater(x, y - r - 40, `${theme.name.toUpperCase()} KIT!`, theme.secondary, 15);
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    }
    for (const cfg of POWERUPS) {
      if (cfg.earnAt && value >= cfg.earnAt && this.powerups[cfg.id] < cfg.max) {
        this.powerups = applyEarn(this.powerups, cfg.id);
<<<<<<< HEAD
        const slot = jokerUsed ? 98 : this.comboCount >= 2 ? 78 : 58;
        this.fx.floater(x, y - r - slot, `${cfg.name.toUpperCase()} +1`, "#fff3b0", 14);
=======
        this.fx.floater(x, y - r - (this.comboCount >= 2 ? 62 : 44), `${cfg.name.toUpperCase()} +1`, "#fff3b0", 14);
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
      }
    }
    this.shakeFx(1.5 + Math.min(8, value / 48));
    sfx.merge(value);
<<<<<<< HEAD
    // Light haptic: bigger kits buzz a bit longer.
    vibrate(value >= 64 ? 35 : 20);
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    this.emitPowerups();
    this.callbacks.onCombo({ count: this.comboCount, multiplier: mult });
  }

  /** Adds points, keeps the live best in sync and celebrates records / level-ups. */
  private addScore(amount: number): void {
    const crossedBest = this.best > 0 && this.score + amount > this.best;
    const levelBefore = levelFor(this.score);
    this.score += amount;
    if (this.score > this.best) {
      this.best = this.score;
      saveBest(this.best);
    }
    if (crossedBest) {
      this.burstS(BOARD_W / 2, 70, ["#ffd24a", "#f2b705", "#ffffff"], 28, 5.5);
      this.fx.floater(BOARD_W / 2, 130, "NEW BEST!", "#ffd24a", 22);
      sfx.newBest();
    }
    this.badges.onScore(this.score);
    const levelAfter = levelFor(this.score);
    if (levelAfter.name !== levelBefore.name) {
      this.fx.floater(BOARD_W / 2, 200, `LEVEL UP! ${levelAfter.name.toUpperCase()}`, "#ffffff", 21);
      this.fx.ring(BOARD_W / 2, 200, levelAfter.color, 95);
      this.burstS(BOARD_W / 2, 200, [levelAfter.color, "#ffffff"], 18, 5);
      this.shakeFx(3);
      sfx.levelUp();
    }
    this.emitEvent({ type: "score", total: this.score });
    this.callbacks.onScore(this.score, this.best);
  }

  private emitEvent(e: GameEvent): void {
    this.callbacks.onGameEvent(e);
  }

  /** Pays out finished mission bonuses and re-emits the mission list. */
  private settleMissions(): void {
    // Drain first — rewards must be paid exactly once per mission.
    const finished = this.missions.completed;
    this.missions.completed.length = 0;
    for (const done of finished) {
      this.addScore(done.reward);
      this.fx.floater(BOARD_W / 2, 175, `MISSION COMPLETE  +${done.reward}`, "#ffd24a", 22);
      this.fx.ring(BOARD_W / 2, 175, "#ffd24a", 80);
      this.shakeFx(4);
      sfx.mission();
    }
    this.callbacks.onMissions(this.missions.view());
  }

  /** Claims newly earned badges, persists them and celebrates. */
  private settleBadges(): void {
    const newly = this.badges.earned;
    this.badges.earned.length = 0;
    for (const badge of newly) {
      this.fx.floater(BOARD_W / 2, 235, `BADGE! ${badge.name.toUpperCase()}`, "#ffd24a", 20);
      this.fx.ring(BOARD_W / 2, 235, "#ffd24a", 70);
      this.shakeFx(3);
      sfx.badge();
    }
    saveOwnedBadges(this.badges.all());
    this.callbacks.onBadges(this.badges.all());
  }

  private updateDanger(dt: number): void {
    let breach = false;
    for (const j of this.jerseys) {
      if (j.value <= 0) continue; // wild forms don't count toward pile height
      if (j.y - j.radius < DANGER_Y && j.body.speed < 3) {
        breach = true;
        break;
      }
    }
    if (breach) {
      this.breachMs += dt;
      if (!this.breachWarned) {
        this.breachWarned = true;
        sfx.warn();
        this.callbacks.onDanger(true);
      }
      if (this.breachMs >= BREACH_GRACE_MS) {
        this.gameOver();
      }
    } else {
      this.breachMs = Math.max(0, this.breachMs - dt * 2);
      if (this.breachWarned) {
        this.breachWarned = false;
        this.callbacks.onDanger(false);
      }
    }
  }

  private gameOver(): void {
    if (this.status !== "playing") return;
    this.status = "over";
    this.shakeFx(10);
    sfx.gameover();
<<<<<<< HEAD
    vibrate([60, 40, 60]);
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    this.emitEvent({ type: "gameover", score: this.score });
    // React records the score (with match time + stats) via this event.
    this.callbacks.onMissions(this.missions.view());
    this.callbacks.onGameOver(this.score);
  }

  // ------------------------------------------------------------ fx helpers

  /** Shake that respects prefers-reduced-motion. */
  private shakeFx(amount: number): void {
    if (!this.reducedMotion) this.fx.addShake(amount);
  }

  /** Burst with a lighter particle budget when reduced motion is on. */
  private burstS(x: number, y: number, colors: string[], count: number, power: number): void {
    this.fx.burst(x, y, colors, this.reducedMotion ? Math.ceil(count / 2) : count, power);
  }

  private get dangerLevel(): number {
    return Math.min(1, this.breachMs / BREACH_GRACE_MS);
  }

  /** Elapsed play time of the current match (ms), frozen once the match ends. */
  get elapsed(): number {
    return this.elapsedMs;
  }

  // ----------------------------------------------------------------- render

  private render(ts: number): void {
    const off = this.fx.offset();
    drawFrame(this.ctx, this.viewScale, off, this.fx, {
      jerseys: this.jerseys.map((j) => ({
        x: j.x,
        y: j.y,
        angle: j.body.angle,
        radius: j.radius,
        value: j.value,
        spawnAt: j.spawnAt,
      })),
      aimX: this.aimX,
      nextValue: this.nextValue,
      showAim: this.status === "playing",
      dangerLevel: this.dangerLevel,
      ts,
      reducedMotion: this.reducedMotion,
    });
  }

}
