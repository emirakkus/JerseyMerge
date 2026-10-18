/**
 * Light haptic feedback via the Web Vibration API (Android/Chrome).
 * Silently no-ops where unsupported (e.g. iOS Safari).
 */
const HAPTICS_KEY = "jersey-merge.haptics-enabled";
let enabled = true;

export function loadHapticsEnabled(): boolean {
  try {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(HAPTICS_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(HAPTICS_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function vibrate(pattern: number | number[]): void {
  try {
    if (enabled && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore — haptics are best-effort */
  }
}
