"use client";

import type { ScoreEntry } from "@/lib/game/scoring";
import { formatTime } from "@/lib/game/format";
import { BADGES } from "@/lib/game/badges";
import { ACHIEVEMENTS } from "@/lib/data/achievements";
import type { DailyResultInfo } from "@/lib/daily/types";
import { rankBadgeClass } from "./Leaderboard";
import { GAME_UI } from "@/lib/i18n";
import { useState } from "react";
import { createChallengeCode, type FriendChallenge } from "@/lib/game/friendChallenge";

interface GameOverModalProps {
  score: number;
  best: number;
  timeMs: number;
  isNewBest: boolean;
  top: ScoreEntry[];
  newBadges: string[];
  newTrophies?: string[];
  daily?: DailyResultInfo | null;
  challenge?: FriendChallenge | null;
  challengeSeed: number;
  challengeMaxLevel: number;
  playerName: string;
  allowFriendChallenge: boolean;
  onPlayAgain: () => void;
  onRematch: (challenge: FriendChallenge) => void;
  onMenu: () => void;
}

function cheerLine(score: number): string {
  if (score >= 500) return GAME_UI.wonderfulGame;
  if (score >= 200) return GAME_UI.greatGame;
  if (score >= 50) return GAME_UI.niceKicks;
  return GAME_UI.keepPracticing;
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
  challenge,
  challengeSeed,
  challengeMaxLevel,
  playerName,
  allowFriendChallenge,
  onPlayAgain,
  onRematch,
  onMenu,
}: GameOverModalProps) {
  const [shareToast, setShareToast] = useState(false);
  const shareFriendChallenge = async () => {
    const code = createChallengeCode({
      seed: challengeSeed,
      score,
      maxLevel: challengeMaxLevel,
      name: playerName,
    });
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("c", code);
    const link = url.toString();
    const text = GAME_UI.friendChallenge.shareText(score, link);
    try {
      if (navigator.share) await navigator.share({ title: GAME_UI.friendChallenge.button, text });
      else {
        await navigator.clipboard.writeText(text);
        setShareToast(true);
        window.setTimeout(() => setShareToast(false), 2200);
      }
    } catch { /* share sheet dismissed or clipboard unavailable */ }
  };
  const shareDaily = async () => {
    if (!daily) return;
    const dayNo = daily.dayKey.replaceAll("-", "");
    const highest = daily.maxValue ?? 2;
    const chainValues = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    const chain = chainValues.filter((v) => v <= highest).map(() => "👕").join("");
    const card = GAME_UI.shareCard(dayNo, score, highest, daily.streak ?? 0, chain, window.location.origin);
    try {
      if (navigator.share) await navigator.share({ text: card });
      else {
        await navigator.clipboard.writeText(card);
        setShareToast(true);
        window.setTimeout(() => setShareToast(false), 2200);
      }
    } catch { /* share dialog dismissed or clipboard unavailable */ }
  };
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0B1229]/80 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={GAME_UI.gameOver}
        className="w-full max-w-[330px] overflow-y-auto rounded-3xl bg-[#16204A] p-5 text-center text-white shadow-2xl ring-4 ring-[#FFC93C] max-h-[92%]"
      >
        <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#FF7A7D]">{GAME_UI.gameOver}</p>
        <h2 className="m-0 mt-1 font-display text-[26px] leading-tight tracking-tight text-white">
          {challenge ? (score > challenge.score ? GAME_UI.friendChallenge.won : GAME_UI.friendChallenge.lost) : cheerLine(score)}
        </h2>

        {challenge && (
          <p className="m-0 mt-2 text-sm font-bold text-[#E3E7F5]">
            {GAME_UI.friendChallenge.difference(Math.abs(score - challenge.score))} · {GAME_UI.friendChallenge.target(challenge.score)}
          </p>
        )}

        {!challenge && isNewBest && (
          <p className="mx-auto mt-3 w-fit rounded-full bg-[#FFC93C]/15 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[#FFC93C] ring-1 ring-[#FFC93C]/40">
            {GAME_UI.newRecord}
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/5 px-2 py-3 ring-1 ring-white/10">
            <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-[#FFC93C]">Skor</p>
            <p className="m-0 mt-1 font-display text-[24px] tabular-nums text-[#FFC93C]">
              {score.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 px-2 py-3 ring-1 ring-white/10">
            <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-white/70">{GAME_UI.duration}</p>
            <p className="m-0 mt-1 font-display text-[24px] tabular-nums text-white">{formatTime(timeMs)}</p>
          </div>
          <div className="rounded-2xl bg-white/5 px-2 py-3 ring-1 ring-white/10">
            <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-[#2EC4B6]">Rekor</p>
            <p className="m-0 mt-1 font-display text-[24px] tabular-nums text-[#2EC4B6]">
              {best.toLocaleString()}
            </p>
          </div>
        </div>

        {daily && (
          <div className="mt-3 rounded-2xl bg-[#2EC4B6]/10 px-4 py-3 ring-1 ring-[#2EC4B6]/30">
            <p className="m-0 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2EC4B6]">
              {GAME_UI.dailyChallenge} · {daily.dayKey}
            </p>
            {daily.isGuest ? (
              <p className="m-0 mt-1 text-[13px] font-semibold leading-snug text-[#C7CCEA]">
                {GAME_UI.guestRun}
              </p>
            ) : daily.error ? (
              <p className="m-0 mt-1 text-[13px] font-semibold leading-snug text-[#C7CCEA]">
                {GAME_UI.submitError}
              </p>
            ) : (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#C7CCEA]">{GAME_UI.dailyRank}</span>
                <span className="font-display text-lg text-white">
                  #{daily.rank} · best {daily.best?.toLocaleString()}
                </span>
              </div>
            )}
            <button type="button" onClick={shareDaily} className="mt-3 min-h-11 w-full rounded-xl bg-[#2EC4B6]/20 px-3 py-2 text-sm font-extrabold text-[#2EC4B6] ring-1 ring-[#2EC4B6]/40">{GAME_UI.share}</button>
            {shareToast && <p role="status" className="m-0 mt-2 text-xs text-white/80">{GAME_UI.copied}</p>}
          </div>
        )}

        {!challenge && newTrophies && newTrophies.length > 0 && (
          <div className="mt-3">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#FFC93C]">
              {GAME_UI.newTrophies}
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

        {!challenge && newBadges.length > 0 && (
          <div className="mt-3">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#FFC93C]">
              {GAME_UI.newBadges}
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

        {!challenge && top.length > 0 && (
          <div className="mt-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <p className="m-0 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9FB0E8]">
              {GAME_UI.topScores}
            </p>
            <ol className="m-0 mt-1.5 list-none space-y-1.5">
              {top.slice(0, 5).map((entry, i) => (
                <li key={`${entry.at}-${i}`} className="flex items-center gap-2 text-[14px]">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold ${rankBadgeClass(i)}`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left font-bold text-white">{entry.name}</span>
                  <span className="text-[11.5px] font-semibold tabular-nums text-[#9FB0E8]">
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
          {challenge ? (
            <>
              <button type="button" onClick={() => onRematch(challenge)} className="min-h-[56px] rounded-2xl bg-[#FFC93C] px-5 py-3 font-display tracking-wide text-[#0F1B3D] shadow-[0_4px_0_#D9A406] transition hover:bg-[#FFD76A] active:translate-y-[2px]">
                {GAME_UI.friendChallenge.rematch}
              </button>
              <button type="button" onClick={shareFriendChallenge} className="min-h-[48px] rounded-2xl bg-[#2EC4B6]/15 px-5 py-2.5 text-[14px] font-extrabold text-[#67e4d5] ring-1 ring-[#2EC4B6]/40">
                {GAME_UI.friendChallenge.challengeOthers}
              </button>
            </>
          ) : allowFriendChallenge ? (
            <>
              <button type="button" onClick={shareFriendChallenge} className="min-h-[48px] rounded-2xl bg-[#2EC4B6]/15 px-5 py-2.5 text-[14px] font-extrabold text-[#67e4d5] ring-1 ring-[#2EC4B6]/40">
                {GAME_UI.friendChallenge.button}
              </button>
              <button
                type="button"
                onClick={onPlayAgain}
                autoFocus
                className="min-h-[56px] rounded-2xl bg-[#FFC93C] px-5 py-3 font-display tracking-wide text-[#0F1B3D] shadow-[0_4px_0_#D9A406] transition hover:bg-[#FFD76A] active:translate-y-[2px] active:shadow-[0_2px_0_#D9A406]"
              >
                {GAME_UI.playAgain}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onPlayAgain}
              autoFocus
              className="min-h-[56px] rounded-2xl bg-[#FFC93C] px-5 py-3 font-display tracking-wide text-[#0F1B3D] shadow-[0_4px_0_#D9A406] transition hover:bg-[#FFD76A] active:translate-y-[2px] active:shadow-[0_2px_0_#D9A406]"
            >
              {GAME_UI.playAgain}
            </button>
          )}
          <button
            type="button"
            onClick={onMenu}
            className="min-h-[48px] rounded-2xl px-5 py-2.5 text-[14px] font-extrabold text-[#C7CCEA] ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white active:scale-[0.98]"
          >
            {GAME_UI.mainMenu}
          </button>
        </div>
        {shareToast && <p role="status" className="m-0 mt-2 text-xs text-white/85">{GAME_UI.friendChallenge.copied}</p>}
        <p className="m-0 mt-3 text-[12.5px] font-semibold text-[#9FB0E8]">
          {GAME_UI.restartTip}
        </p>
      </div>
    </div>
  );
}
