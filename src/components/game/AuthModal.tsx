"use client";

import { useState } from "react";
import type { ApiUser } from "@/lib/api";

type Mode = "login" | "register";

interface AuthModalProps {
  user: ApiUser | null;
  googleEnabled: boolean;
  onClose: () => void;
  onAuthed: (user: ApiUser) => void;
  onSignedOut: () => void;
}

/**
 * Sign-in / sign-up dialog (dark sticker style). The actual auth flow is
 * handled by the page via /api/auth/* — this component owns the UI state.
 */
export function AuthModal({ user, googleEnabled, onClose, onAuthed, onSignedOut }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = (await res.json()) as { user?: ApiUser; token?: string; error?: string };
      if (!res.ok || !data.user || !data.token) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      try {
        window.localStorage.setItem("jersey-merge.token", data.token);
        window.localStorage.setItem("jersey-merge.user", JSON.stringify(data.user));
      } catch {
        /* ignore */
      }
      onAuthed(data.user);
      onClose();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      const token = (() => {
        try {
          return window.localStorage.getItem("jersey-merge.token");
        } catch {
          return null;
        }
      })();
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {
          /* ignore */
        });
      }
    } finally {
      try {
        window.localStorage.removeItem("jersey-merge.token");
        window.localStorage.removeItem("jersey-merge.user");
      } catch {
        /* ignore */
      }
      onSignedOut();
      onClose();
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1229]/80 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={user ? "Account" : "Sign in or create account"}
        className="w-full max-w-[360px] overflow-y-auto rounded-3xl bg-[#16204A] p-5 text-white shadow-2xl ring-1 ring-white/10 max-h-[88dvh]"
      >
        {user ? (
          <div className="text-center">
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#2EC4B6]">Signed in</p>
            <div className="mx-auto mt-3 flex w-fit items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2EC4B6] font-display text-xl text-[#0F1B3D]">
                {user.username.charAt(0).toUpperCase()}
              </span>
              <div className="text-left">
                <p className="m-0 font-display text-lg leading-tight text-white">{user.username}</p>
                <p className="m-0 text-[11px] font-bold text-[#9FB0E8]">
                  Best {user.bestScore.toLocaleString()} pts · streak {user.streak ?? 0} day
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={busy}
                className="min-h-[48px] rounded-2xl bg-white/5 px-5 py-3 text-sm font-extrabold text-[#FF7A7D] ring-1 ring-[#FF5A5F]/30 transition hover:bg-white/10 active:scale-[0.98] disabled:opacity-50"
              >
                Sign out
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] rounded-2xl bg-[#FFC93C] px-5 py-3 font-display tracking-wide text-[#0F1B3D] transition hover:bg-[#FFD76A] active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#2EC4B6]">
              Jersey Merge
            </p>
            <h2 className="m-0 mt-1 font-display text-[24px] leading-tight text-white">
              {mode === "login" ? "Welcome back!" : "Join the team!"}
            </h2>

            <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`min-h-[40px] rounded-xl px-2 py-2 text-[11px] font-extrabold uppercase tracking-wide transition ${
                    mode === m ? "bg-[#FFC93C] text-[#0F1B3D]" : "text-[#C7CCEA] hover:text-white"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            {googleEnabled && (
              <button
                type="button"
                onClick={() => {
                  window.location.assign("/api/auth/google");
                }}
                className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm font-extrabold text-white ring-1 ring-white/15 transition hover:bg-white/10 active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Continue with Google
              </button>
            )}

            <form onSubmit={(e) => void submit(e)} className="mt-3 flex flex-col gap-2">
              <label className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-white/5 px-3.5 py-2.5 ring-1 ring-white/10 focus-within:ring-[#2EC4B6]">
                <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9FB0E8]">
                  Name
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={14}
                  autoComplete="username"
                  aria-label="Username"
                  placeholder="star_kick"
                  className="m-0 w-full min-w-0 bg-transparent text-right text-sm font-bold text-white outline-none placeholder:text-[#4A5680]"
                />
              </label>
              <label className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-white/5 px-3.5 py-2.5 ring-1 ring-white/10 focus-within:ring-[#2EC4B6]">
                <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9FB0E8]">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={64}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  aria-label="Password"
                  placeholder="min 4 characters"
                  className="m-0 w-full min-w-0 bg-transparent text-right text-sm font-bold text-white outline-none placeholder:text-[#4A5680]"
                />
              </label>

              {error && (
                <p
                  role="alert"
                  className="m-0 rounded-xl bg-[#FF5A5F]/10 px-3 py-2 text-left text-[12px] font-bold text-[#FF8A8D] ring-1 ring-[#FF5A5F]/30"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-1 min-h-[52px] rounded-2xl bg-[#FFC93C] px-5 py-3 font-display tracking-wide text-[#0F1B3D] shadow-[0_4px_0_#D9A406] transition hover:bg-[#FFD76A] active:translate-y-[2px] active:shadow-[0_2px_0_#D9A406] disabled:opacity-60"
              >
                {busy ? "One second…" : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
              </button>
            </form>

            <p className="m-0 mt-3 text-[11px] font-semibold leading-snug text-[#9FB0E8]">
              Your scores, streak, collection and trophies sync to your account.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 min-h-[44px] text-xs font-extrabold text-[#9FB0E8] transition hover:text-white"
            >
              Play without an account
            </button>
          </>
        )}
      </div>
    </div>
  );
}
