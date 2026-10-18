import type { DailyQuest, QuestCounters } from "./quests";

/** Shared request/response types used by route handlers AND the client. */

export interface DailyBoardEntry {
  name: string;
  score: number;
  timeMs: number;
}

export interface DailyStateYou {
  streak: number;
  lastActiveDay: string | null;
  dailyBest: number | null;
  dailyRank: number | null;
  claimed: string[];
  questCounters: QuestCounters;
}

export interface DailyStateResponse {
  dayKey: string;
  seed: number;
  quests: DailyQuest[];
  board: DailyBoardEntry[];
  you: DailyStateYou | null;
}

export interface DailyChallengeSubmit {
  score: number;
  timeMs: number;
  dayKey: string;
  seed: number;
}

export interface DailyChallengeResult {
  dayKey: string;
  best: number;
  isNewBest: boolean;
  rank: number;
}

export interface DailyClaimRequest {
  dayKey: string;
  questId: string;
}

export interface DailyClaimResult {
  reward: { questId: string; powerup: string };
  claimed: string[];
  stock?: { joker: number; bomb: number; scramble: number };
}

export interface TouchResult {
  dayKey: string;
  streak: number;
}

export interface ApiError {
  error: string;
}

/** Client-side summary of a finished daily match (shown in the game-over modal). */
export interface DailyResultInfo {
  dayKey: string;
  isGuest: boolean;
  error?: boolean;
  rank?: number;
  best?: number;
  isNewBest?: boolean;
  maxValue?: number;
  streak?: number;
}
