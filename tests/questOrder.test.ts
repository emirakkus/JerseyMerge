import { describe, expect, it } from "vitest";
import { questState, sortQuestCards, toQuestCard, type QuestOrderInput } from "@/lib/daily/questOrder";

const q = (over: Partial<QuestOrderInput> & { id: string }): QuestOrderInput => ({
  title: over.id,
  target: 10,
  progress: 0,
  reward: "joker",
  claimed: false,
  ...over,
});

describe("quest card state", () => {
  it("marks done-and-not-claimed as claimable", () => {
    expect(questState(q({ id: "a", progress: 10, target: 10 }))).toBe("claimable");
    expect(questState(q({ id: "a", progress: 15, target: 10 }))).toBe("claimable");
  });

  it("marks claimed first, whatever the progress", () => {
    expect(questState(q({ id: "a", progress: 0, claimed: true }))).toBe("claimed");
    expect(questState(q({ id: "a", progress: 10, claimed: true }))).toBe("claimed");
  });

  it("keeps partial progress as in-progress", () => {
    expect(questState(q({ id: "a", progress: 9, target: 10 }))).toBe("progress");
    expect(questState(q({ id: "a", progress: 0, target: 10 }))).toBe("progress");
  });

  it("clamps pct into 0..1 and guards zero targets", () => {
    expect(toQuestCard(q({ id: "a", progress: 5, target: 10 })).pct).toBe(0.5);
    expect(toQuestCard(q({ id: "a", progress: 50, target: 10 })).pct).toBe(1);
    expect(toQuestCard(q({ id: "a", progress: 5, target: 0 })).pct).toBe(0);
  });
});

describe("quest card ordering", () => {
  it("orders claimable first, in-progress second, claimed last", () => {
    const cards = sortQuestCards([
      q({ id: "claimed-1", progress: 10, claimed: true }),
      q({ id: "progress-low", progress: 2 }),
      q({ id: "claimable-1", progress: 10 }),
      q({ id: "progress-high", progress: 8 }),
      q({ id: "claimable-2", progress: 10 }),
    ]);
    expect(cards.map((c) => c.quest.id)).toEqual([
      "claimable-1",
      "claimable-2",
      "progress-high",
      "progress-low",
      "claimed-1",
    ]);
  });

  it("sorts in-progress by descending progress percentage", () => {
    const cards = sortQuestCards([
      q({ id: "a", progress: 1, target: 100 }), // 1%
      q({ id: "b", progress: 9, target: 10 }), // 90%
      q({ id: "c", progress: 3, target: 10 }), // 30%
      q({ id: "d", progress: 2, target: 4 }), // 50%
    ]);
    expect(cards.map((c) => c.quest.id)).toEqual(["b", "d", "c", "a"]);
  });

  it("breaks ties alphabetically (stable, deterministic)", () => {
    const once = sortQuestCards([
      q({ id: "zebra", progress: 10 }),
      q({ id: "apple", progress: 10 }),
      q({ id: "mango", progress: 10 }),
    ]);
    const twice = sortQuestCards([...once].reverse().map((c) => c.quest));
    expect(once.map((c) => c.quest.id)).toEqual(["apple", "mango", "zebra"]);
    expect(twice.map((c) => c.quest.id)).toEqual(once.map((c) => c.quest.id));
  });

  it("returns an empty list for no quests", () => {
    expect(sortQuestCards([])).toEqual([]);
  });
});
