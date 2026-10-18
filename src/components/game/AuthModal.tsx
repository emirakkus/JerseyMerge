"use client";

import { useEffect, useRef, useState } from "react";
import type { ApiUser } from "@/lib/api";
import { GAME_UI } from "@/lib/i18n";

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
  const [showPassword, setShowPassword] = useState(false);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) {
      setError(GAME_UI.auth.errors.required);
      return;
    }
    if (password.length < 8 || password.length > 64) {
      setError(GAME_UI.auth.errors.passwordLength);
      return;
    }
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
        setError(data.error ?? GAME_UI.auth.errors.generic);
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
      setError(GAME_UI.auth.errors.connection);
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
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        setError(GAME_UI.auth.errors.connection);
        return;
      }
      try {
        window.localStorage.removeItem("jersey-merge.token");
        window.localStorage.removeItem("jersey-merge.user");
      } catch {
        /* ignore */
      }
      onSignedOut();
      onClose();
    } catch {
      setError(GAME_UI.auth.errors.connection);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1229]/80 p-4 backdrop-blur-[2px]"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onTouchStart={(event) => { touchStartY.current = event.touches[0]?.clientY ?? null; }}
      onTouchEnd={(event) => {
        const endY = event.changedTouches[0]?.clientY;
        if (touchStartY.current !== null && endY !== undefined && endY - touchStartY.current > 80) onClose();
        touchStartY.current = null;
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={user ? GAME_UI.auth.account : GAME_UI.auth.dialog}
        className="relative w-full max-w-[360px] overflow-y-auto rounded-3xl bg-[#16204A] p-5 pt-12 text-white shadow-2xl ring-1 ring-white/10 max-h-[88dvh]"
      >
        <button type="button" onClick={onClose} aria-label={GAME_UI.auth.close} title={GAME_UI.auth.close}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xl font-bold text-white hover:bg-white/15">×</button>
        {user ? (
          <div className="text-center">
            <p className="m-0 text-[11px] font-extrabold tracking-[0.2em] text-[#2EC4B6]">{GAME_UI.auth.signedIn}</p>
            <div className="mx-auto mt-3 flex w-fit items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2EC4B6] font-display text-xl text-[#0F1B3D]">
                {user.username.charAt(0).toUpperCase()}
              </span>
              <div className="text-left">
                <p className="m-0 font-display text-[19px] leading-tight text-white">{user.username}</p>
                <p className="m-0 text-[12.5px] font-bold text-[#C7CCEA]">{GAME_UI.auth.bestAndStreak(user.bestScore, user.streak ?? 0)}</p>
              </div>
            </div>
              <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={busy}
                className="min-h-[52px] rounded-2xl bg-white/5 px-5 py-3 text-[14px] font-extrabold text-[#FF7A7D] ring-1 ring-[#FF5A5F]/30 transition hover:bg-white/10 active:scale-[0.98] disabled:opacity-50"
              >
                {GAME_UI.auth.signOut}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[52px] rounded-2xl bg-[#FFC93C] px-5 py-3 font-display text-[16px] tracking-wide text-[#0F1B3D] transition hover:bg-[#FFD76A] active:scale-[0.98]"
              >
                {GAME_UI.auth.close}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#2EC4B6]">
              {GAME_UI.title}
            </p>
            <h2 className="m-0 mt-1 font-display text-[24px] leading-tight text-white">
              {mode === "login" ? GAME_UI.auth.welcome : GAME_UI.auth.join}
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
                  {m === "login" ? GAME_UI.auth.signIn : GAME_UI.auth.createAccount}
                </button>
              ))}
            </div>

            {googleEnabled && (
              <button
                type="button"
                onClick={() => {
                  window.location.assign("/api/auth/google");
                }}
                className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-[14px] font-extrabold text-white ring-1 ring-white/15 transition hover:bg-white/10 active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {GAME_UI.auth.google}
              </button>
            )}

            <form noValidate onSubmit={(e) => void submit(e)} className="mt-3 flex flex-col gap-2">
              <label className="flex min-h-[52px] items-center gap-2 rounded-2xl bg-white/5 px-3.5 py-2.5 ring-1 ring-white/10 focus-within:ring-[#2EC4B6]">
                <span className="shrink-0 text-[11.5px] font-extrabold tracking-[0.1em] text-[#C7CCEA]">
                  {GAME_UI.auth.username}
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={14}
                  autoComplete="username"
                  aria-label={GAME_UI.auth.username}
                  placeholder="star_kick"
                  className="m-0 w-full min-w-0 bg-transparent text-right text-[14px] font-bold text-white outline-none placeholder:text-[#AEB8D6]"
                />
              </label>
              <label className="flex min-h-[52px] items-center gap-2 rounded-2xl bg-white/5 px-3.5 py-2.5 ring-1 ring-white/10 focus-within:ring-[#2EC4B6]">
                <span className="shrink-0 text-[11.5px] font-extrabold tracking-[0.1em] text-[#C7CCEA]">
                  {GAME_UI.auth.password}
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={64}
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  aria-label={GAME_UI.auth.password}
                  placeholder={GAME_UI.auth.passwordPlaceholder}
                  className="m-0 w-full min-w-0 bg-transparent text-right text-[14px] font-bold text-white outline-none placeholder:text-[#AEB8D6]"
                />
                <button type="button" onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? GAME_UI.auth.hidePassword : GAME_UI.auth.showPassword}
                  aria-pressed={showPassword}
                  className="shrink-0 rounded-lg px-2 py-2 text-xs font-extrabold text-[#C7CCEA] hover:text-white">
                  {showPassword ? GAME_UI.auth.hidePassword : GAME_UI.auth.showPassword}
                </button>
              </label>

              {error && (
                <p
                  role="alert"
                  className="m-0 rounded-xl bg-[#FF5A5F]/10 px-3 py-2 text-left text-[13px] font-bold text-[#FF8A8D] ring-1 ring-[#FF5A5F]/30"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-1 min-h-[56px] rounded-2xl bg-[#FFC93C] px-5 py-3 font-display text-[16px] tracking-wide text-[#0F1B3D] shadow-[0_4px_0_#D9A406] transition hover:bg-[#FFD76A] active:translate-y-[2px] active:shadow-[0_2px_0_#D9A406] disabled:opacity-60"
              >
                {busy ? GAME_UI.auth.working : mode === "login" ? GAME_UI.auth.signIn : GAME_UI.auth.createAccount}
              </button>
            </form>

            <p className="m-0 mt-3 text-[12.5px] font-semibold leading-snug text-[#C7CCEA]">{GAME_UI.auth.description}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-1 min-h-[48px] text-[13px] font-extrabold text-[#C7CCEA] transition hover:text-white"
            >
              {GAME_UI.auth.guestContinue}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
