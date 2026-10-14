"use client";

import type { MissionView } from "@/lib/game/missions";

interface MissionStripProps {
  missions: MissionView[];
}

/** Per-match mission chips (dark sticker style). */
export function MissionStrip({ missions }: MissionStripProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 px-0.5" aria-label="Per-match missions">
      {missions.map((m) => {
        const prog = Math.min(m.progress, m.target);
        return (
          <div
            key={m.id}
            title={`${m.title} (+${m.reward} points)`}
            className={`rounded-xl px-2 py-1.5 ring-1 ${
              m.done ? "bg-[#FFC93C]/15 ring-[#FFC93C]/40" : "bg-[#1B2450] ring-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-[9px] font-extrabold uppercase tracking-wide text-[#9FB0E8]">
                {m.title}
              </span>
              {m.done ? (
                <svg width="11" height="11" viewBox="0 0 12 12" className="shrink-0 text-[#FFC93C]" aria-hidden="true">
                  <path
                    d="M2 6.5 4.8 9 10 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className="shrink-0 text-[9px] font-extrabold tabular-nums text-white">
                  {prog}/{m.target}
                </span>
              )}
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded bg-white/10">
              <div
                className={`h-full rounded ${m.done ? "bg-[#FFC93C]" : "bg-[#2EC4B6]"}`}
                style={{ width: `${(prog / m.target) * 100}%` }}
              />
            </div>
            <p className="m-0 mt-0.5 text-[9px] font-semibold tabular-nums text-white/50">+{m.reward} pts</p>
          </div>
        );
      })}
    </div>
  );
}
