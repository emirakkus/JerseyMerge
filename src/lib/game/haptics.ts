/**
 * Light haptic feedback via the Web Vibration API (Android/Chrome).
 * Silently no-ops where unsupported (e.g. iOS Safari).
 */
export function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore — haptics are best-effort */
  }
}
