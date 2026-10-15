"use client";

import type { ScoreEntry } from "@/lib/game/scoring";
import { formatTime } from "@/lib/game/format";
import { BADGES } from "@/lib/game/badges";
import { ACHIEVEMENTS } from "@/lib/data/achievements";
import type { DailyResultInfo } from "@/lib/daily/types";
import { rankBadgeClass } from "./Leaderboard";

interface GameOverModalProps {
  score: number;
  best: number;
  timeMs: number;
  isNewBest: boolean;
  top: ScoreEntry[];
  newBadges: string[];
  newTrophies?: string[];
  daily?: DailyResultInfo | null;
  onPlayAgain: () => void;
  onMenu: () => void;
}

function cheerLine(score: number): string {
  if (score >= 500) return "WONDERFUL GAME!";
  if (score >= 200) return "GREAT GAME!";
  if (score >= 50) return "NICE KICKS!";
  return "KEEP PRACTICING!";
}

export function GameOverModal({
  score,
  best,
  timeMs,
  isNewBest,
  top,
  newBadges,
  newTrophies,
  daily,
  onPlayAgain,
  onMenu,
}: GameOverModalProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0B1229]/80 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Game over"
        className="w-full max-w-[330px] overflow-y-auto rounded-3xl bg-[#16204A] p-5 text-center text-white shadow-2xl ring-4 ring-[#FFC93C] max-h-[92%]"
      >
        <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#FF7A7D]">Full time</p>
        <h2 className="m-0 mt-1 font-display text-[26px] leading-tight tracking-tight text-white">
          {cheerLine(score)}
        </h2>

        {isNewBest && (
          <p className="mx-auto mt-3 w-fit rounded-full bg-[#FFC93C]/15 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[#FFC93C] ring-1 ring-[#FFC93C]/40">
            New record
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/5 px-2 py-3 ring-1 ring-white/10">
<<<<<<< HEAD
            <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-[#FFC93C]">Skor</p>
            <p className="m-0 mt-1 font-display text-[24px] tabular-nums text-[#FFC93C]">
=======
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#FFC93C]">Skor</p>
            <p className="m-0 mt-1 font-display text-[22px] tabular-nums text-[#FFC93C]">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
              {score.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 px-2 py-3 ring-1 ring-white/10">
<<<<<<< HEAD
            <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-white/70">Süre</p>
            <p className="m-0 mt-1 font-display text-[24px] tabular-nums text-white">{formatTime(timeMs)}</p>
          </div>
          <div className="rounded-2xl bg-white/5 px-2 py-3 ring-1 ring-white/10">
            <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-[#2EC4B6]">Rekor</p>
            <p className="m-0 mt-1 font-display text-[24px] tabular-nums text-[#2EC4B6]">
=======
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white/60">Süre</p>
            <p className="m-0 mt-1 font-display text-[22px] tabular-nums text-white">{formatTime(timeMs)}</p>
          </div>
          <div className="rounded-2xl bg-white/5 px-2 py-3 ring-1 ring-white/10">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#2EC4B6]">Rekor</p>
            <p className="m-0 mt-1 font-display text-[22px] tabular-nums text-[#2EC4B6]">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
              {best.toLocaleString()}
            </p>
          </div>
        </div>

        {daily && (
          <div className="mt-3 rounded-2xl bg-[#2EC4B6]/10 px-4 py-3 ring-1 ring-[#2EC4B6]/30">
            <p className="m-0 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2EC4B6]">
              Daily challenge · {daily.dayKey}
            </p>
            {daily.isGuest ? (
<<<<<<< HEAD
              <p className="m-0 mt-1 text-[13px] font-semibold leading-snug text-[#C7CCEA]">
                Guest run: not submitted to the daily board. Sign in to compete for the rank.
              </p>
            ) : daily.error ? (
              <p className="m-0 mt-1 text-[13px] font-semibold leading-snug text-[#C7CCEA]">
=======
              <p className="m-0 mt-1 text-[12px] font-semibold leading-snug text-[#C7CCEA]">
                Guest run: not submitted to the daily board. Sign in to compete for the rank.
              </p>
            ) : daily.error ? (
              <p className="m-0 mt-1 text-[12px] font-semibold leading-snug text-[#C7CCEA]">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
                Could not submit right now (offline or server busy). Your next run will count.
              </p>
            ) : (
              <div className="mt-1 flex items-center justify-between">
<<<<<<< HEAD
                <span className="text-[13px] font-bold text-[#C7CCEA]">Daily board rank</span>
=======
                <span className="text-[12px] font-bold text-[#C7CCEA]">Daily board rank</span>
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
                <span className="font-display text-lg text-white">
                  #{daily.rank} · best {daily.best?.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {newTrophies && newTrophies.length > 0 && (
          <div className="mt-3">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#FFC93C]">
              New trophies
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {newTrophies.map((id) => {
                const a = ACHIEVEMENTS.find((x) => x.id === id);
                if (!a) return null;
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 rounded-full bg-[#FFC93C]/15 px-2.5 py-1 text-[11px] font-extrabold text-[#FFC93C] ring-1 ring-[#FFC93C]/40"
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
                      <path
                        d="M4 2h8v2a4 4 0 0 1-8 0V2ZM4 3H1.5v.5A3.5 3.5 0 0 0 5 7m7-4h2.5v.5A3.5 3.5 0 0 1 11 7m-4.5 3.5h3V13h-3m-1 0h5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {a.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {newBadges.length > 0 && (
          <div className="mt-3">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#FFC93C]">
              New badges
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {newBadges.map((id) => {
                const b = BADGES.find((x) => x.id === id);
                if (!b) return null;
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 rounded-full bg-[#FFC93C]/15 px-2.5 py-1 text-[11px] font-extrabold text-[#FFC93C] ring-1 ring-[#FFC93C]/40"
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
                      <path
                        d="M8 1.5 9.9 6l4.6.3-3.5 3 1.1 4.5L8 11.2l-4.1 2.6 1.1-4.5-3.5-3L6.1 6z"
                        fill="currentColor"
                      />
                    </svg>
                    {b.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {top.length > 0 && (
          <div className="mt-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <p className="m-0 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9FB0E8]">
              Top scores
            </p>
            <ol className="m-0 mt-1.5 list-none space-y-1.5">
              {top.slice(0, 5).map((entry, i) => (
<<<<<<< HEAD
                <li key={`${entry.at}-${i}`} className="flex items-center gap-2 text-[14px]">
=======
                <li key={`${entry.at}-${i}`} className="flex items-center gap-2 text-sm">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold ${rankBadgeClass(i)}`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left font-bold text-white">{entry.name}</span>
<<<<<<< HEAD
                  <span className="text-[11.5px] font-semibold tabular-nums text-[#9FB0E8]">
=======
                  <span className="text-[10px] font-semibold tabular-nums text-[#9FB0E8]">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
                    {entry.timeMs > 0 ? formatTime(entry.timeMs) : ""}
                  </span>
                  <span
                    className={`w-16 text-right font-extrabold tabular-nums ${
                      i === 0 && isNewBest ? "text-[#FFC93C]" : "text-white"
                    }`}
                  >
                    {entry.score.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onPlayAgain}
            autoFocus
<<<<<<< HEAD
            className="min-h-[56px] rounded-2xl bg-[#FFC93C] px-5 py-3 font-display tracking-wide text-[#0F1B3D] shadow-[0_4px_0_#D9A406] transition hover:bg-[#FFD76A] active:translate-y-[2px] active:shadow-[0_2px_0_#D9A406]"
=======
            className="min-h-[52px] rounded-2xl bg-[#FFC93C] px-5 py-3 font-display tracking-wide text-[#0F1B3D] shadow-[0_4px_0_#D9A406] transition hover:bg-[#FFD76A] active:translate-y-[2px] active:shadow-[0_2px_0_#D9A406]"
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
          >
            PLAY AGAIN!
          </button>
          <button
            type="button"
            onClick={onMenu}
<<<<<<< HEAD
            className="min-h-[48px] rounded-2xl px-5 py-2.5 text-[14px] font-extrabold text-[#C7CCEA] ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white active:scale-[0.98]"
=======
            className="min-h-[44px] rounded-2xl px-5 py-2.5 text-sm font-extrabold text-[#C7CCEA] ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white active:scale-[0.98]"
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
          >
            Main menu
          </button>
        </div>
<<<<<<< HEAD
        <p className="m-0 mt-3 text-[12.5px] font-semibold text-[#9FB0E8]">
=======
        <p className="m-0 mt-3 text-[11px] font-semibold text-[#9FB0E8]">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
          Tip: press <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 font-sans text-[#C7CCEA]">R</kbd> for an
          instant restart
        </p>
      </div>
    </div>
  );
}
