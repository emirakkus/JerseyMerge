import type { LifetimeCounters } from "../progress/types.ts";

/**
 * Achievement data file. All names are fictional — no real clubs,
 * players or brands. Conditions are evaluated by ProgressTracker,
 * which subscribes to game events (loose coupling with the engine).
 */

export type AchievementMetric = keyof LifetimeCounters;

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  target: number;
  /** XP reward, granted exactly once per account/device. */
  rewardXp: number;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: "first_merge", name: "First Touch", description: "Complete your first merge.", metric: "merges", target: 1, rewardXp: 20 },
  { id: "merge_50", name: "Passing Machine", description: "Complete 50 merges.", metric: "merges", target: 50, rewardXp: 50 },
  { id: "merge_200", name: "Quarterback", description: "Complete 200 merges.", metric: "merges", target: 200, rewardXp: 100 },
  { id: "kit_16", name: "Kit Collector", description: "Merge up to a 16 jersey.", metric: "maxValue", target: 16, rewardXp: 20 },
  { id: "kit_64", name: "Golden Boot", description: "Merge up to a 64 jersey.", metric: "maxValue", target: 64, rewardXp: 60 },
  { id: "kit_256", name: "Stadium Legend", description: "Merge up to a 256 jersey.", metric: "maxValue", target: 256, rewardXp: 120 },
  { id: "combo_3", name: "Quick Feet", description: "Land a x3 combo.", metric: "maxCombo", target: 3, rewardXp: 30 },
  { id: "combo_6", name: "Tiki Taka", description: "Land a x6 combo.", metric: "maxCombo", target: 6, rewardXp: 80 },
  { id: "score_500", name: "Goal Machine", description: "Score 500 in a single match.", metric: "maxScore", target: 500, rewardXp: 60 },
  { id: "score_2000", name: "Match Winner", description: "Score 2000 in a single match.", metric: "maxScore", target: 2000, rewardXp: 150 },
  { id: "powerup_10", name: "Playmaker", description: "Use 10 power-ups.", metric: "powerups", target: 10, rewardXp: 40 },
  { id: "joker_5", name: "Wild Card", description: "Drop 5 joker forms.", metric: "joker", target: 5, rewardXp: 40 },
  { id: "bomb_3", name: "Pyrotechnics", description: "Drop 3 bombs.", metric: "bomb", target: 3, rewardXp: 30 },
  { id: "undo_1", name: "Time Out", description: "Undo a drop.", metric: "undo", target: 1, rewardXp: 10 },
  { id: "matches_5", name: "Regular Season", description: "Finish 5 matches.", metric: "matches", target: 5, rewardXp: 40 },
  { id: "matches_25", name: "Veteran", description: "Finish 25 matches.", metric: "matches", target: 25, rewardXp: 100 },
];

export const ACHIEVEMENT_IDS: ReadonlySet<string> = new Set(ACHIEVEMENTS.map((a) => a.id));
