import { ACHIEVEMENTS, type AchievementDef } from "../data/achievements.ts";
import type { GameEvent } from "../game/events.ts";
import type { ProgressState } from "./types.ts";
import { emptyProgress } from "./types.ts";

/**
 * Event-fed progress tracker: keeps lifetime counters, evaluates
 * achievement conditions and grants each reward exactly once.
 * The page pipes engine GameEvents into it (no engine coupling).
 */
export class ProgressTracker {
  state: ProgressState;
  private justUnlocked: AchievementDef[] = [];

  constructor(initial?: ProgressState) {
    this.state = initial
      ? {
          xp: Math.max(0, Math.floor(initial.xp)),
          counters: { ...emptyProgress().counters, ...initial.counters },
          achievements: [...initial.achievements],
          skins: [...initial.skins],
        }
      : emptyProgress();
  }

  handleEvent(e: GameEvent): void {
    const c = this.state.counters;
    switch (e.type) {
      case "merge":
        c.merges += 1;
        c.maxValue = Math.max(c.maxValue, e.value);
        c.maxCombo = Math.max(c.maxCombo, e.combo);
        break;
      case "powerup":
        c.powerups += 1;
        c[e.id] += 1;
        break;
      case "score":
        c.maxScore = Math.max(c.maxScore, e.total);
        break;
      case "gameover":
        c.matches += 1;
        break;
      default:
        return; // "drop" is not tracked for achievements
    }
    this.evaluate();
  }

  addXp(xp: number): void {
    this.state.xp += Math.max(0, Math.floor(xp));
  }

  /** Returns (and clears) achievements unlocked since the last drain. */
  drainUnlocked(): AchievementDef[] {
    const u = this.justUnlocked;
    this.justUnlocked = [];
    return u;
  }

  private evaluate(): void {
    const c = this.state.counters;
    for (const def of ACHIEVEMENTS) {
      if (this.state.achievements.includes(def.id)) continue;
      if (c[def.metric] >= def.target) {
        this.state.achievements.push(def.id);
        this.state.xp += def.rewardXp;
        this.justUnlocked.push(def);
      }
    }
  }
}
