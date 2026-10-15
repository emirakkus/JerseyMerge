"use client";

import type { MissionView } from "@/lib/game/missions";

interface MissionStripProps {
  missions: MissionView[];
}

<<<<<<< HEAD
/** Per-match mission chips (larger text, comfortable tap-free display). */
=======
/** Per-match mission chips (dark sticker style). */
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
export function MissionStrip({ missions }: MissionStripProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 px-0.5" aria-label="Per-match missions">
      {missions.map((m) => {
        const prog = Math.min(m.progress, m.target);
        return (
          <div
            key={m.id}
            title={`${m.title} (+${m.reward} points)`}
<<<<<<< HEAD
            className={`rounded-xl px-2 py-2 ring-1 ${
=======
            className={`rounded-xl px-2 py-1.5 ring-1 ${
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
              m.done ? "bg-[#FFC93C]/15 ring-[#FFC93C]/40" : "bg-[#1B2450] ring-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
<<<<<<< HEAD
              <span className="truncate text-[11px] font-extrabold uppercase tracking-wide text-[#9FB0E8]">
                {m.title}
              </span>
              {m.done ? (
                <svg width="13" height="13" viewBox="0 0 12 12" className="shrink-0 text-[#FFC93C]" aria-hidden="true">
=======
              <span className="truncate text-[9px] font-extrabold uppercase tracking-wide text-[#9FB0E8]">
                {m.title}
              </span>
              {m.done ? (
                <svg width="11" height="11" viewBox="0 0 12 12" className="shrink-0 text-[#FFC93C]" aria-hidden="true">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
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
<<<<<<< HEAD
                <span className="shrink-0 text-[11px] font-extrabold tabular-nums text-white">
=======
                <span className="shrink-0 text-[9px] font-extrabold tabular-nums text-white">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
                  {prog}/{m.target}
                </span>
              )}
            </div>
<<<<<<< HEAD
            <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-white/10">
=======
            <div className="mt-1 h-1 overflow-hidden rounded bg-white/10">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
              <div
                className={`h-full rounded ${m.done ? "bg-[#FFC93C]" : "bg-[#2EC4B6]"}`}
                style={{ width: `${(prog / m.target) * 100}%` }}
              />
            </div>
<<<<<<< HEAD
            <p className="m-0 mt-1 text-[11px] font-semibold tabular-nums text-white/60">
              +{m.reward} pts
            </p>
=======
            <p className="m-0 mt-0.5 text-[9px] font-semibold tabular-nums text-white/50">+{m.reward} pts</p>
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
          </div>
        );
      })}
    </div>
  );
}
