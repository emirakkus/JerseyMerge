/**
 * Permanent badges earned across matches. The tracker is per-run (reset in
 * start()) but seeded with already-owned ids so each badge fires only once
 * ever. Pure logic — unit-testable.
 */

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
}

export const BADGES: readonly BadgeDefinition[] = [
  { id: "first_touch", name: "First Touch", description: "Complete your first merge." },
  { id: "kit_32", name: "Kit Collector", description: "Merge up to a 32 jersey." },
  { id: "chain_3", name: "Chain Star", description: "Land a 3-chain from one drop." },
  { id: "merges_10", name: "Hot Streak", description: "Complete 10 merges in one match." },
  { id: "score_300", name: "Big Scorer", description: "Reach 300 points in one match." },
  { id: "kit_128", name: "Grand Final", description: "Merge up to a 128 jersey." },
];

type BadgeListener = (earned: BadgeDefinition[], all: string[]) => void;

export class BadgeTracker {
  private owned = new Set<string>();
  private merges = 0;
  private maxValue = 0;
  private maxChain = 0;
  private score = 0;
  private listeners = new Set<BadgeListener>();

  /** Newly earned badges waiting to be claimed by the engine. */
  earned: BadgeDefinition[] = [];

  constructor(persisted: string[]) {
    this.owned = new Set(persisted);
  }

  push(listener: BadgeListener): void {
    this.listeners.add(listener);
  }

  onMerge(value: number, chain: number): void {
    this.merges += 1;
    this.maxValue = Math.max(this.maxValue, value);
    this.maxChain = Math.max(this.maxChain, chain);
    this.check();
  }

  onScore(score: number): void {
    this.score = Math.max(this.score, score);
    this.check();
  }

  all(): string[] {
    return [...this.owned];
  }

  private check(): void {
    let earnedAny = false;
    for (const def of BADGES) {
      if (this.owned.has(def.id)) continue;
      let ok = false;
      switch (def.id) {
        case "first_touch":
          ok = this.merges >= 1;
          break;
        case "kit_32":
          ok = this.maxValue >= 32;
          break;
        case "chain_3":
          ok = this.maxChain >= 3;
          break;
        case "merges_10":
          ok = this.merges >= 10;
          break;
        case "score_300":
          ok = this.score >= 300;
          break;
        case "kit_128":
          ok = this.maxValue >= 128;
          break;
        default:
          break;
      }
      if (ok) {
        this.owned.add(def.id);
        this.earned.push(def);
        earnedAny = true;
      }
    }
    if (earnedAny) {
      for (const listener of this.listeners) listener(this.earned, this.all());
    }
  }
}
