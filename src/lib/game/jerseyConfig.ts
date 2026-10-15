/**
 * Single source of truth for jersey visuals. All designs are ORIGINAL
 * fictional kits — no real clubs, players or brands.
 *
 * Tiers (color-blind friendly: every tier changes pattern AND lightness):
 *  1  (lv 1-2)   flat color
 *  2  (lv 3-4)   two-tone sleeve stripes
 *  3  (lv 5-6)   horizontal hoops / vertical stripes
 *  4  (lv 7-8)   diagonal band + two-tone
 *  5  (lv 9-10)  gradient + gold trim
 *  6  (lv 11)    gold champion (star + shine)
 */

export type JerseyTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface JerseyStyle {
  value: number;
  level: number;
  tier: JerseyTier;
  name: string;
  primary: string;
  secondary: string;
  /** Number fill color. */
  number: string;
  /** Gold trim color (tiers 5-6). */
  trim?: string;
}

/** Sticker outline shared by all kits. */
export const JERSEY_OUTLINE = "#0E1230";

export const JERSEY_STYLES: readonly JerseyStyle[] = [
  { value: 2, level: 1, tier: 1, name: "Rookie", primary: "#4C9AFF", secondary: "#0E1230", number: "#FFFFFF" },
  { value: 4, level: 2, tier: 1, name: "Tangerine", primary: "#FF9F40", secondary: "#0E1230", number: "#FFFFFF" },
  { value: 8, level: 3, tier: 2, name: "Turquoise", primary: "#2EC4B6", secondary: "#FFFFFF", number: "#FFFFFF" },
  { value: 16, level: 4, tier: 2, name: "Coral", primary: "#FF5A5F", secondary: "#0E1230", number: "#FFFFFF" },
  { value: 32, level: 5, tier: 3, name: "Violet Hoops", primary: "#9B5CFF", secondary: "#FFFFFF", number: "#FFFFFF" },
  { value: 64, level: 6, tier: 3, name: "Gold Hoops", primary: "#FFC93C", secondary: "#0E1230", number: "#FFFFFF" },
  { value: 128, level: 7, tier: 4, name: "Green Slash", primary: "#3DD68C", secondary: "#0E1230", number: "#FFFFFF" },
  { value: 256, level: 8, tier: 4, name: "Pink Slash", primary: "#FF7AB8", secondary: "#0E1230", number: "#FFFFFF" },
  { value: 512, level: 9, tier: 5, name: "Sky Shimmer", primary: "#1B6FD8", secondary: "#5FD0FF", number: "#FFFFFF", trim: "#FFC93C" },
  { value: 1024, level: 10, tier: 5, name: "Indigo Shimmer", primary: "#4B2FD4", secondary: "#9B7BFF", number: "#FFFFFF", trim: "#FFC93C" },
  { value: 2048, level: 11, tier: 6, name: "Champion", primary: "#FFC93C", secondary: "#FFE28A", number: "#FFFFFF", trim: "#FFE28A" },
];

const DEFAULT_STYLE: JerseyStyle = {
  value: 4096,
  level: 12,
  tier: 2,
  name: "Beyond",
  primary: "#2A3357",
  secondary: "#FFC93C",
  number: "#FFFFFF",
};

/** Level number shown on the jersey: 2→1, 4→2, ... 2048→11, 4096→12. */
export function levelForValue(value: number): number {
  return Math.max(1, Math.round(Math.log2(Math.max(2, value))));
}

export function styleFor(value: number): JerseyStyle {
  if (value > 0) {
    const known = JERSEY_STYLES.find((s) => s.value === value);
    if (known) return known;
    return { ...DEFAULT_STYLE, level: levelForValue(value) };
  }
  return DEFAULT_STYLE;
}

/** Backward-compatible name for existing imports. */
export function themeFor(value: number): JerseyStyle {
  return styleFor(value);
}
