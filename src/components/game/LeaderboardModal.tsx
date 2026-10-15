"use client";

import { Leaderboard } from "./Leaderboard";

interface LeaderboardModalProps {
  entries: import("@/lib/game/scoring").ScoreEntry[];
  highlightName: string | null;
  onClose: () => void;
}

/** Quick-access leaderboard (header button / hamburger menu). */
export function LeaderboardModal({ entries, highlightName, onClose }: LeaderboardModalProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0B1229]/80 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[380px] rounded-3xl bg-[#131B40] p-4 shadow-2xl ring-1 ring-white/10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="m-0 font-display text-[20px] tracking-tight text-white">Leaderboard</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close leaderboard"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="m2 2 10 10M12 2 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <Leaderboard entries={entries} highlightName={highlightName} />
      </div>
    </div>
  );
}
