/**
 * Pure merge-queue logic (no physics or DOM dependencies).
 *
 * Collision handlers push candidate pairs; the game loop calls `process()`
 * *between* physics steps so the world is only mutated at a safe point.
 * Guarantees:
 *  - only equal values merge
 *  - a jersey is consumed at most once per step (locked while processing)
 *  - the same physical pair can never trigger two merges (seenPairs)
 *  - dead/already-consumed jerseys are skipped, so chains resolve safely
 */

export interface Mergeable {
  readonly id: number;
  readonly value: number;
  readonly alive: boolean;
  readonly x: number;
  readonly y: number;
}

export interface MergeOutcome<T extends Mergeable> {
  a: T;
  b: T;
  resultValue: number;
  x: number;
  y: number;
}

export type MergeHandler<T extends Mergeable> = (a: T, b: T, x: number, y: number) => void;

const PAIR_SEEN_CAP = 600;

export class MergeQueue<T extends Mergeable> {
  private queued: Array<[T, T]> = [];
  private locked = new Set<number>();
  private seenPairs = new Set<string>();

  /** Called from collision events. Safe to call at any time. */
  register(a: T, b: T): void {
    if (a.id === b.id) return;
    if (a.value <= 0 || b.value <= 0) return; // wild/joker forms never merge
    if (a.value !== b.value) return;
    if (!a.alive || !b.alive) return;
    if (this.locked.has(a.id) || this.locked.has(b.id)) return;
    const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
    if (this.seenPairs.has(key)) return;
    this.seenPairs.add(key);
    if (this.seenPairs.size > PAIR_SEEN_CAP) this.seenPairs.clear();
    this.queued.push([a, b]);
  }

  get pending(): number {
    return this.queued.length;
  }

  /**
   * Consume the queue. `handler` must consume (mark dead / remove) `a` and `b`
   * and spawn the replacement. Returns one outcome per performed merge.
   */
  process(handler: MergeHandler<T>): MergeOutcome<T>[] {
    const outcomes: MergeOutcome<T>[] = [];
    while (this.queued.length > 0) {
      const [a, b] = this.queued.shift()!;
      if (!a.alive || !b.alive || a.value !== b.value) continue;
      if (this.locked.has(a.id) || this.locked.has(b.id)) continue;
      this.locked.add(a.id);
      this.locked.add(b.id);
      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      handler(a, b, x, y);
      outcomes.push({ a, b, resultValue: a.value * 2, x, y });
    }
    return outcomes;
  }

  /** Unreserve an id once its jersey is removed from the world. */
  release(id: number): void {
    this.locked.delete(id);
  }

  /** Full reset for a new game — clears pending pairs, locks and dedupe state. */
  reset(): void {
    this.queued = [];
    this.locked.clear();
    this.seenPairs.clear();
  }
}
