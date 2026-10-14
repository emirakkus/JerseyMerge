/** Client-side API helper with token storage (SSR-safe). */

export interface ApiUser {
  id: number;
  username: string;
  bestScore: number;
  bestTimeMs: number;
  bestAt: number;
  createdAt: number;
  lastActiveDay?: string | null;
  streak?: number;
}

const TOKEN_KEY = "jersey-merge.token";
const USER_KEY = "jersey-merge.user";

export function getToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (typeof window === "undefined") return;
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function getCachedUser(): ApiUser | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as ApiUser).id === "number" &&
      typeof (parsed as ApiUser).username === "string"
    ) {
      return parsed as ApiUser;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCachedUser(user: ApiUser | null): void {
  try {
    if (typeof window === "undefined") return;
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Base URL for the API. Empty on the web (same origin). In a Capacitor build
 * point this at the deployed app: NEXT_PUBLIC_API_URL=https://app.example.com
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = "Something went wrong. Try again.";
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body.error === "string" && body.error) message = body.error;
    } catch {
      /* keep default */
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
