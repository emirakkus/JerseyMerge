/** Persistent player progress: XP, lifetime counters, unlocked achievements. */

export interface LifetimeCounters {
  merges: number;
  maxValue: number;
  maxCombo: number;
  maxScore: number;
  matches: number;
  powerups: number;
  joker: number;
  bomb: number;
  scramble: number;
  undo: number;
<<<<<<< HEAD
  collectionPoints: number;
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
}

export interface ProgressState {
  xp: number;
  counters: LifetimeCounters;
  achievements: string[];
<<<<<<< HEAD
  /** Unlocked cosmetic skin ids (purely visual). */
  skins: string[];
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
}

/** All collectible kit values (fictional designs — see collection screen). */
export const KIT_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048] as const;

export function emptyProgress(): ProgressState {
  return {
    xp: 0,
    counters: {
      merges: 0,
      maxValue: 0,
      maxCombo: 0,
      maxScore: 0,
      matches: 0,
      powerups: 0,
      joker: 0,
      bomb: 0,
      scramble: 0,
      undo: 0,
<<<<<<< HEAD
      collectionPoints: 0,
    },
    achievements: [],
    skins: [],
=======
    },
    achievements: [],
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
  };
}
