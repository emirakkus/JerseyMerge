import type { PowerupId } from "../game/powerups.ts";
import type { GameEvent } from "../game/events.ts";
import { hashSeed, mulberry32 } from "../game/prng.ts";

/**
 * Daily quests: 3 per UTC day, deterministically derived from the day key,
 * so every player sees the same quests that day. Pure module — the engine
 * only feeds it events via DailyQuestTracker.
 */

export type QuestMetric = "merges" | "reachValue" | "maxCombo" | "score" | "drops" | "powerupsUsed" | "matches" | "collectionPoints";

export interface DailyQuest {
  id: string;
  title: string;
  metric: QuestMetric;
  target: number;
  reward: PowerupId;
}

interface QuestDef {
  id: string;
  metric: QuestMetric;
  targets: number[];
  reward: PowerupId;
  title: (t: number) => string;
}

const QUEST_POOL: readonly QuestDef[] = [
  { id: "merges", metric: "merges", targets: [15, 20, 25], reward: "scramble", title: (t) => `Merge ${t} times` },
  { id: "reachValue", metric: "reachValue", targets: [8, 16, 32], reward: "joker", title: (t) => `Reach a ${t} jersey` },
  { id: "combo", metric: "maxCombo", targets: [3, 3, 4], reward: "bomb", title: (t) => `Land a x${t} combo` },
  { id: "score", metric: "score", targets: [150, 200, 300], reward: "joker", title: (t) => `Score ${t} in one match` },
  { id: "drops", metric: "drops", targets: [10, 12, 15], reward: "scramble", title: (t) => `Drop ${t} jerseys` },
  { id: "powerups", metric: "powerupsUsed", targets: [1, 2, 2], reward: "bomb", title: (t) => `Use ${t} power-up${t > 1 ? "s" : ""}` },
  { id: "matches", metric: "matches", targets: [3, 3, 5], reward: "joker", title: (t) => `Complete ${t} matches` },
  { id: "collection", metric: "collectionPoints", targets: [5, 10, 15], reward: "bomb", title: (t) => `Earn ${t} collection points` },
];

/** Simple daily quests: exactly 3 per day, fixed, predictable for everyone. */
export const SIMPLE_DAILY_QUESTS: readonly DailyQuest[] = [
  { id: "daily_matches", title: "Play 3 matches", metric: "matches", target: 3, reward: "joker" },
  { id: "daily_score", title: "Reach 1000 points in one match", metric: "score", target: 1000, reward: "bomb" },
  { id: "daily_merges", title: "Merge 5 jerseys", metric: "merges", target: 5, reward: "scramble" },
];

export function getSimpleDailyQuests(): DailyQuest[] {
  return SIMPLE_DAILY_QUESTS.map((q) => ({ ...q }));
}

export function getDailyQuests(dayKey: string): DailyQuest[] {
  const rng = mulberry32(hashSeed(`jersey-merge-quests-${dayKey}`));
  const pool = [...QUEST_POOL];
  const picked: DailyQuest[] = [];
  while (picked.length < 3 && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    const def = pool.splice(idx, 1)[0];
    const target = def.targets[Math.floor(rng() * def.targets.length)];
    picked.push({ id: `${def.id}_${target}`, title: def.title(target), metric: def.metric, target, reward: def.reward });
  }
  return picked;
}

/** Is a given id a valid quest for that day? (used by the claim endpoint.) */
export function isValidQuestForDay(dayKey: string, questId: string): DailyQuest | null {
  return getDailyQuests(dayKey).find((q) => q.id === questId) ?? null;
}

export interface QuestCounters {
  merges: number;
  maxValue: number;
  maxCombo: number;
  score: number;
  drops: number;
  powerupsUsed: number;
  matches: number;
  collectionPoints: number;
}

export function emptyCounters(): QuestCounters {
  return { merges: 0, maxValue: 0, maxCombo: 0, score: 0, drops: 0, powerupsUsed: 0, matches: 0, collectionPoints: 0 };
}

export function questProgress(q: DailyQuest, c: QuestCounters): number {
  switch (q.metric) {
    case "merges":
      return c.merges;
    case "reachValue":
      return c.maxValue;
    case "maxCombo":
      return c.maxCombo;
    case "score":
      return c.score;
    case "drops":
      return c.drops;
    case "powerupsUsed":
      return c.powerupsUsed;
    case "matches":
      return c.matches;
    case "collectionPoints":
      return c.collectionPoints;
    default:
      return 0;
  }
}

export function isQuestDone(q: DailyQuest, c: QuestCounters): boolean {
  return questProgress(q, c) >= q.target;
}

/**
 * Event-fed listener for daily quests. Created per UTC day with that day's
 * persisted counters; the page pipes engine events into it.
 */
export class DailyQuestTracker {
  counters: QuestCounters;

  constructor(dayKey: string, initial?: QuestCounters) {
    void dayKey;
    this.counters = initial ? { ...initial } : emptyCounters();
  }

  handleEvent(e: GameEvent): void {
    switch (e.type) {
      case "drop":
        this.counters.drops += 1;
        break;
      case "merge":
        this.counters.merges += 1;
        this.counters.maxValue = Math.max(this.counters.maxValue, e.value);
        this.counters.maxCombo = Math.max(this.counters.maxCombo, e.combo);
        break;
      case "powerup":
        this.counters.powerupsUsed += 1;
        break;
      case "score":
        this.counters.score = Math.max(this.counters.score, e.total);
        break;
      case "gameover":
        this.counters.matches += 1;
        break;
      default:
        break;
    }
  }
}
