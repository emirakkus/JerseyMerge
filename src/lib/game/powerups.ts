/**
 * Central power-up configuration: counts, caps, earn rules and blast radius.
 * Balance tweaks live here only — the engine consumes these values.
 */

export type PowerupId = "joker" | "bomb" | "scramble" | "undo";

export interface PowerupConfig {
  id: PowerupId;
  name: string;
  /** Keyboard shortcut shown in the UI. */
  key: string;
  /** Charges at the start of every match. */
  start: number;
  /** Per-match cap. */
  max: number;
  /** When a merge reaches this value, grant +1 charge (optional). */
  earnAt?: number;
  description: string;
}

export const POWERUPS: readonly PowerupConfig[] = [
  {
    id: "joker",
    name: "Joker",
    key: "J",
    start: 1,
    max: 2,
    earnAt: 64,
    description:
      "Turns the first jersey it touches into the next value. Scores exactly like a normal merge (combo rules apply).",
  },
  {
    id: "bomb",
    name: "Bomb",
    key: "B",
    start: 1,
    max: 2,
    earnAt: 128,
    description: "Clears every jersey in its blast radius. No score effect — pure space.",
  },
  {
    id: "scramble",
    name: "Scramble",
    key: "K",
    start: 1,
    max: 2,
    description: "Bursts the whole pile apart to open space. No score effect.",
  },
  {
    id: "undo",
    name: "Undo",
    key: "Z",
    start: 1,
    max: 1,
    description:
      "Reverts your last drop and everything since: jersey, merges, score, mission progress and power-ups used after it. Badges and records stay.",
  },
];

/** Bomb blast radius in board units. */
export const BOMB_BLAST_RADIUS = 95;

export interface PowerupInventory {
  joker: number;
  bomb: number;
  scramble: number;
  undo: number;
}

export function initialInventory(): PowerupInventory {
  const inv: PowerupInventory = { joker: 0, bomb: 0, scramble: 0, undo: 0 };
  for (const p of POWERUPS) inv[p.id] = p.start;
  return inv;
}

export function emptyUsed(): Record<PowerupId, number> {
  return { joker: 0, bomb: 0, scramble: 0, undo: 0 };
}

/** New inventory with +1 charge if room remains; otherwise unchanged. */
export function applyEarn(inv: PowerupInventory, id: PowerupId): PowerupInventory {
  const cfg = POWERUPS.find((p) => p.id === id);
  if (!cfg || inv[id] >= cfg.max) return inv;
  return { ...inv, [id]: inv[id] + 1 };
}

/** New inventory with one charge consumed; null when empty. */
export function consumeCharge(inv: PowerupInventory, id: PowerupId): PowerupInventory | null {
  if (inv[id] <= 0) return null;
  return { ...inv, [id]: inv[id] - 1 };
}

/** Adds reward bonuses (e.g. daily quest rewards) onto a base inventory. */
export function addBonus(inv: PowerupInventory, bonus?: Partial<PowerupInventory>): PowerupInventory {
  if (!bonus) return inv;
  const n = (v?: number): number => Math.max(0, Math.floor(Number(v) || 0));
  return {
    joker: inv.joker + n(bonus.joker),
    bomb: inv.bomb + n(bonus.bomb),
    scramble: inv.scramble + n(bonus.scramble),
    undo: inv.undo + n(bonus.undo),
  };
}

/** Snapshot pushed to React whenever the inventory changes. */
export interface PowerupSnapshot {
  inventory: PowerupInventory;
  used: Record<PowerupId, number>;
  canUndo: boolean;
  bestCombo: number;
}
