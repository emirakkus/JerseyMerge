/**
 * Cosmetic skins. Purely visual — they never change physics, radius or score.
 * A skin maps a jersey value to a style override (colors + pattern tier).
 *
 * Unlock rules are driven by player progress (score/level) and are evaluated
 * by CosmeticsTracker. The first 5 skins are unlocked by default.
 */

export interface SkinStyle {
  primary: string;
  secondary: string;
  number: string;
  trim?: string;
  tier: number;
}

export interface SkinDef {
  id: string;
  name: string;
  description: string;
  /** Target the skin applies to: a single jersey value or "all" (every kit). */
  scope: "all" | number;
  /** Cosmetic style override. */
  style: SkinStyle;
  /** Unlock rule. */
  rule: "default" | "score" | "level";
  /** Threshold (score or player level) for non-default rules. */
  threshold: number;
}

export const SKINS: readonly SkinDef[] = [
  {
    id: "classic",
    name: "Classic",
    description: "The original sticker kits.",
    scope: "all",
    style: { primary: "#4C9AFF", secondary: "#FFFFFF", number: "#FFFFFF", tier: 1 },
    rule: "default",
    threshold: 0,
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep navy and electric blue.",
    scope: "all",
    style: { primary: "#1F2A5C", secondary: "#7DD3FC", number: "#FFFFFF", tier: 2 },
    rule: "score",
    threshold: 300,
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange and pink.",
    scope: "all",
    style: { primary: "#FF7A5F", secondary: "#FFD166", number: "#FFFFFF", tier: 3 },
    rule: "score",
    threshold: 1000,
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Pitch green and gold trim.",
    scope: "all",
    style: { primary: "#1FAE5A", secondary: "#FFC93C", number: "#FFFFFF", tier: 4 },
    rule: "score",
    threshold: 2500,
  },
  {
    id: "champion",
    name: "Champion",
    description: "Gold and white, for the big leagues.",
    scope: "all",
    style: { primary: "#FFC93C", secondary: "#FFFFFF", number: "#0F1B3D", tier: 6 },
    rule: "level",
    threshold: 8,
  },
];

export function isSkinUnlocked(skin: SkinDef, progress: { xp: number; maxScore: number; level: number }): boolean {
  switch (skin.rule) {
    case "default":
      return true;
    case "score":
      return progress.maxScore >= skin.threshold;
    case "level":
      return progress.level >= skin.threshold;
    default:
      return false;
  }
}

export function unlockedSkins(progress: { xp: number; maxScore: number; level: number }): SkinDef[] {
  return SKINS.filter((s) => isSkinUnlocked(s, progress));
}
