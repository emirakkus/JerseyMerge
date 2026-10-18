import type { LifetimeCounters } from "../progress/types.ts";
import { GAME_UI } from "../i18n";

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
  { id: "first_merge", ...GAME_UI.achievements.first_merge, metric: "merges", target: 1, rewardXp: 20 },
  { id: "merge_50", ...GAME_UI.achievements.merge_50, metric: "merges", target: 50, rewardXp: 50 },
  { id: "merge_200", ...GAME_UI.achievements.merge_200, metric: "merges", target: 200, rewardXp: 100 },
  { id: "kit_16", ...GAME_UI.achievements.kit_16, metric: "maxValue", target: 16, rewardXp: 20 },
  { id: "kit_64", ...GAME_UI.achievements.kit_64, metric: "maxValue", target: 64, rewardXp: 60 },
  { id: "kit_256", ...GAME_UI.achievements.kit_256, metric: "maxValue", target: 256, rewardXp: 120 },
  { id: "combo_3", ...GAME_UI.achievements.combo_3, metric: "maxCombo", target: 3, rewardXp: 30 },
  { id: "combo_6", ...GAME_UI.achievements.combo_6, metric: "maxCombo", target: 6, rewardXp: 80 },
  { id: "score_500", ...GAME_UI.achievements.score_500, metric: "maxScore", target: 500, rewardXp: 60 },
  { id: "score_2000", ...GAME_UI.achievements.score_2000, metric: "maxScore", target: 2000, rewardXp: 150 },
  { id: "powerup_10", ...GAME_UI.achievements.powerup_10, metric: "powerups", target: 10, rewardXp: 40 },
  { id: "joker_5", ...GAME_UI.achievements.joker_5, metric: "joker", target: 5, rewardXp: 40 },
  { id: "bomb_3", ...GAME_UI.achievements.bomb_3, metric: "bomb", target: 3, rewardXp: 30 },
  { id: "undo_1", ...GAME_UI.achievements.undo_1, metric: "undo", target: 1, rewardXp: 10 },
  { id: "matches_5", ...GAME_UI.achievements.matches_5, metric: "matches", target: 5, rewardXp: 40 },
  { id: "matches_25", ...GAME_UI.achievements.matches_25, metric: "matches", target: 25, rewardXp: 100 },
];

export const ACHIEVEMENT_IDS: ReadonlySet<string> = new Set(ACHIEVEMENTS.map((a) => a.id));
