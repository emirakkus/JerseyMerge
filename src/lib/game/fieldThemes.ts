import { GAME_UI } from "@/lib/i18n";

export type FieldThemeId = "classic" | "night" | "neighborhood" | "rain" | "derby" | "beach" | "winter" | "golden";
export type FieldParticleType = "none" | "rain" | "snow";

export interface FieldTheme {
  id: FieldThemeId;
  name: string;
  unlockLevel: number;
  backgroundTop: string;
  backgroundBottom: string;
  preview: string;
  pitchColor: string;
  pitchOpacity: number;
  dangerColor: string;
  ghostFill: number;
  ghostOutline: string;
  particles: FieldParticleType;
  particleCount: number;
}

export const FIELD_THEMES: readonly FieldTheme[] = [
  { id: "classic", name: GAME_UI.fieldThemes.names.classic, unlockLevel: 1, backgroundTop: "#0F1B3D", backgroundBottom: "#2A1B5C", preview: "linear-gradient(145deg,#0F1B3D,#2A1B5C)", pitchColor: "#E6FFEE", pitchOpacity: 0.10, dangerColor: "#FF5A5F", ghostFill: 0.48, ghostOutline: "#FFFFFF", particles: "none", particleCount: 0 },
  { id: "night", name: GAME_UI.fieldThemes.names.night, unlockLevel: 3, backgroundTop: "#080D20", backgroundBottom: "#182746", preview: "linear-gradient(145deg,#080D20,#182746)", pitchColor: "#B9D7FF", pitchOpacity: 0.13, dangerColor: "#FF687A", ghostFill: 0.7, ghostOutline: "#C9E1FF", particles: "none", particleCount: 0 },
  { id: "neighborhood", name: GAME_UI.fieldThemes.names.neighborhood, unlockLevel: 6, backgroundTop: "#142D2D", backgroundBottom: "#244B3A", preview: "linear-gradient(145deg,#142D2D,#244B3A)", pitchColor: "#E5FFE9", pitchOpacity: 0.17, dangerColor: "#FF776B", ghostFill: 0.68, ghostOutline: "#F0FFF1", particles: "none", particleCount: 0 },
  { id: "rain", name: GAME_UI.fieldThemes.names.rain, unlockLevel: 10, backgroundTop: "#102338", backgroundBottom: "#27445B", preview: "linear-gradient(145deg,#102338,#27445B)", pitchColor: "#D1EEFF", pitchOpacity: 0.16, dangerColor: "#FF706C", ghostFill: 0.72, ghostOutline: "#E0F5FF", particles: "rain", particleCount: 30 },
  { id: "derby", name: GAME_UI.fieldThemes.names.derby, unlockLevel: 15, backgroundTop: "#32191F", backgroundBottom: "#542B39", preview: "linear-gradient(145deg,#32191F,#542B39)", pitchColor: "#FFE8D9", pitchOpacity: 0.15, dangerColor: "#FF806E", ghostFill: 0.7, ghostOutline: "#FFF0E6", particles: "none", particleCount: 0 },
  { id: "beach", name: GAME_UI.fieldThemes.names.beach, unlockLevel: 20, backgroundTop: "#164252", backgroundBottom: "#28727A", preview: "linear-gradient(145deg,#164252,#28727A)", pitchColor: "#E0FFFF", pitchOpacity: 0.19, dangerColor: "#FF656B", ghostFill: 0.72, ghostOutline: "#E7FFFF", particles: "none", particleCount: 0 },
  { id: "winter", name: GAME_UI.fieldThemes.names.winter, unlockLevel: 25, backgroundTop: "#1D3551", backgroundBottom: "#41637D", preview: "linear-gradient(145deg,#1D3551,#41637D)", pitchColor: "#F0FAFF", pitchOpacity: 0.21, dangerColor: "#FF666C", ghostFill: 0.76, ghostOutline: "#FFFFFF", particles: "snow", particleCount: 32 },
  { id: "golden", name: GAME_UI.fieldThemes.names.golden, unlockLevel: 30, backgroundTop: "#30270E", backgroundBottom: "#66501B", preview: "linear-gradient(145deg,#30270E,#66501B)", pitchColor: "#FFF2BD", pitchOpacity: 0.19, dangerColor: "#FF6464", ghostFill: 0.76, ghostOutline: "#FFF4CE", particles: "none", particleCount: 0 },
];

const THEME_BY_ID = new Map<string, FieldTheme>(FIELD_THEMES.map((theme) => [theme.id, theme]));
export const CLASSIC_FIELD_THEME = FIELD_THEMES[0];

export function fieldThemeById(id: unknown): FieldTheme | undefined {
  return typeof id === "string" ? THEME_BY_ID.get(id) : undefined;
}

export function validFieldThemeId(id: unknown): id is FieldThemeId {
  return fieldThemeById(id) !== undefined;
}

export function unlockedFieldThemes(level: number): FieldTheme[] {
  return FIELD_THEMES.filter((theme) => theme.unlockLevel <= level);
}

export function resolveFieldTheme(id: unknown, level: number): FieldTheme {
  const theme = fieldThemeById(id);
  return theme && theme.unlockLevel <= level ? theme : CLASSIC_FIELD_THEME;
}
