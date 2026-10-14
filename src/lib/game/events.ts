import type { PowerupId } from "./powerups";

/**
 * Game event stream. The engine *emits*; feature modules (daily quests,
 * stats, future analytics) *listen*. This keeps the engine loosely coupled.
 */
export type GameEvent =
  | { type: "drop" }
  | { type: "merge"; value: number; combo: number }
  | { type: "powerup"; id: PowerupId }
  | { type: "score"; total: number }
  | { type: "gameover"; score: number };

export type GameEventListener = (event: GameEvent) => void;
