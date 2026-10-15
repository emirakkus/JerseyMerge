/**
 * Pure quest-card ordering logic (unit-tested with Vitest).
 * Order: claimable (done, not claimed) first, then in-progress by
 * descending progress, claimed last. Ties break alphabetically (stable).
 */

export interface QuestOrderInput {
  id: string;
  title: string;
  target: number;
  progress: number;
  reward: string;
  claimed: boolean;
}

export type QuestCardState = "claimable" | "progress" | "claimed";

export interface QuestCard {
  quest: QuestOrderInput;
  state: QuestCardState;
  /** 0..1 progress. */
  pct: number;
}

const STATE_RANK: Record<QuestCardState, number> = {
  claimable: 0,
  progress: 1,
  claimed: 2,
};

export function questState(input: QuestOrderInput): QuestCardState {
  if (input.claimed) return "claimed";
  const done = input.target > 0 && input.progress >= input.target;
  return done ? "claimable" : "progress";
}

export function toQuestCard(input: QuestOrderInput): QuestCard {
  const pct =
    input.target > 0 ? Math.min(1, Math.max(0, input.progress) / input.target) : 0;
  return { quest: input, state: questState(input), pct };
}

export function sortQuestCards(items: QuestOrderInput[]): QuestCard[] {
  return items
    .map(toQuestCard)
    .sort((a, b) => {
      const rank = STATE_RANK[a.state] - STATE_RANK[b.state];
      if (rank !== 0) return rank;
      if (a.state === "progress") return b.pct - a.pct;
      return a.quest.title.localeCompare(b.quest.title);
    });
}
