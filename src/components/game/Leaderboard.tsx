"use client";

import type { ScoreEntry } from "@/lib/game/scoring";

export function rankBadgeClass(index: number): string {
  if (index === 0) return "bg-[#FFC93C] text-[#0F1B3D]";
  if (index === 1) return "bg-slate-300 text-slate-800";
  if (index === 2) return "bg-orange-300 text-orange-900";
  return "bg-white/10 text-[#C7CCEA]";
}

interface LeaderboardProps {
  entries: ScoreEntry[];
  highlightName?: string | null;
}

export function Leaderboard({ entries, highlightName }: LeaderboardProps) {
  return (
    <section
      id="leaderboard"
      className="scroll-mt-4 rounded-2xl bg-[#1B2450]/50 p-4 ring-1 ring-white/10"
      aria-label="Leaderboard"
    >
      <div className="flex items-center justify-between">
        <h2 className="m-0 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9FB0E8]">
          <svg width="14" height="14" viewBox="0 0 16 16" className="text-[#FFC93C]" aria-hidden="true">
            <path
              d="M4 2h8v2a4 4 0 0 1-8 0V2ZM4 3H1.5v.5A3.5 3.5 0 0 0 5 7m7-4h2.5v.5A3.5 3.5 0 0 1 11 7m-4.5 3.5h3V13h-3m-1 0h5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          Leaderboard
        </h2>
        <span className="text-[11px] font-semibold text-[#9FB0E8]">Top 10 · all players</span>
      </div>

      {entries.length === 0 ? (
        <p className="m-0 mt-3 rounded-xl bg-white/5 px-4 py-6 text-center text-[13px] font-medium text-[#9FB0E8]">
          No scores yet. Play a game and claim the top spot!
        </p>
      ) : (
        <ol className="m-0 mt-3 list-none space-y-1.5">
          {entries.map((entry, i) => (
            <li
              key={`${entry.at}-${i}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                highlightName && entry.name === highlightName
                  ? "bg-[#FFC93C]/10 ring-1 ring-[#FFC93C]/50"
                  : "bg-white/5"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-extrabold ${rankBadgeClass(i)}`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[15px] font-bold text-white">{entry.name}</p>
                <p className="m-0 text-[12px] font-medium text-[#9FB0E8]">
                  {entry.timeMs > 0
                    ? `${Math.floor(entry.timeMs / 60000)}:${String(Math.floor((entry.timeMs % 60000) / 1000)).padStart(2, "0")}`
                    : ""}{" "}
                  · {new Date(entry.at).toLocaleDateString()}
                </p>
              </div>
              <span className="font-display text-[19px] tabular-nums text-white">
                {entry.score.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
