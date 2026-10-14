/**
 * Per-run mission system. Missions observe merge events (new value + chain
 * length) and pay a one-time bonus straight into the score. Pure logic —
 * unit-testable without physics or DOM.
 */

export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
}

export interface MissionView extends MissionDefinition {
  progress: number;
  done: boolean;
}

export interface MissionSnapshot {
  state: ReadonlyMap<string, number>;
  done: ReadonlySet<string>;
  completed: readonly MissionDefinition[];
}

export const MISSIONS: readonly MissionDefinition[] = [
  { id: "warmup", title: "Warm-up", description: "Complete 5 merges.", target: 5, reward: 30 },
  { id: "bigkit", title: "Big kit", description: "Merge up to a 32 jersey.", target: 32, reward: 80 },
  { id: "showtime", title: "Showtime", description: "Land a 3-chain from a single drop.", target: 3, reward: 100 },
];

export class MissionTracker {
  private state = new Map<string, number>();
  private done = new Set<string>();
  private listeners = new Set<(missions: MissionView[]) => void>();

  /** Missions that completed since the last `completed` read. */
  completed: MissionDefinition[] = [];

  push(listener: (missions: MissionView[]) => void): void {
    this.listeners.add(listener);
  }

  /** Call after every merge with the merged value and the current chain length. */
  onMerge(value: number, chain: number): void {
    let changed = false;
    for (const def of MISSIONS) {
      if (this.done.has(def.id)) continue;
      const prev = this.state.get(def.id) ?? 0;
      let next = prev;
      switch (def.id) {
        case "warmup":
          next = prev + 1;
          break;
        case "bigkit":
          next = Math.max(prev, value);
          break;
        case "showtime":
          next = Math.max(prev, chain);
          break;
        default:
          break;
      }
      if (next === prev) continue; // nothing changed — stay quiet
      this.state.set(def.id, next);
      if (next >= def.target) {
        this.done.add(def.id);
        this.completed.push(def);
      }
      changed = true;
    }
    if (changed) this.emit();
  }

  view(): MissionView[] {
    return MISSIONS.map((def) => ({
      ...def,
      progress: Math.min(this.state.get(def.id) ?? 0, def.target),
      done: this.done.has(def.id),
    }));
  }

  /** Point-in-time state for undo. */
  snapshot(): MissionSnapshot {
    return {
      state: new Map(this.state),
      done: new Set(this.done),
      completed: [...this.completed],
    };
  }

  restore(s: MissionSnapshot): void {
    this.state = new Map(s.state);
    this.done = new Set(s.done);
    this.completed = [...s.completed];
  }

  private emit(): void {
    const snapshot = this.view();
    for (const listener of this.listeners) listener(snapshot);
  }
}

export function initialMissionViews(): MissionView[] {
  return MISSIONS.map((def) => ({ ...def, progress: 0, done: false }));
}
