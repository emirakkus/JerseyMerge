"use client";

import { levelProgress } from "@/lib/game/levels";

interface LevelStripProps {
  score: number;
  modeLabel?: string;
}

/** Gamified rank strip: current level name + progress toward the next rank. */
export function LevelStrip({ score, modeLabel }: LevelStripProps) {
  const { level, index, next, pct } = levelProgress(score);
  return (
<<<<<<< HEAD
    <div className="rounded-2xl bg-[#1B2450] px-3 py-2.5 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {modeLabel && (
            <span className="shrink-0 rounded-md bg-[#2EC4B6] px-1.5 py-0.5 text-[11.5px] font-extrabold text-[#0F1B3D]">
=======
    <div className="rounded-2xl bg-[#1B2450] px-3 py-2 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {modeLabel && (
            <span className="shrink-0 rounded-md bg-[#2EC4B6] px-1.5 py-0.5 text-[10px] font-extrabold text-[#0F1B3D]">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
              {modeLabel}
            </span>
          )}
          <span
<<<<<<< HEAD
            className="rounded-md px-1.5 py-0.5 text-[11.5px] font-extrabold text-[#0F1B3D]"
=======
            className="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold text-[#0F1B3D]"
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
            style={{ backgroundColor: level.color }}
          >
            LVL {index + 1}
          </span>
<<<<<<< HEAD
          <span className="truncate text-[13.5px] font-extrabold text-white">{level.name}</span>
        </span>
        <span className="shrink-0 text-[11.5px] font-bold text-[#9FB0E8]">
=======
          <span className="truncate text-[12px] font-extrabold text-white">{level.name}</span>
        </span>
        <span className="shrink-0 text-[10px] font-bold text-[#9FB0E8]">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
          {next ? `${next.min - score} pts to ${next.name}` : "Max rank!"}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: level.color }}
        />
      </div>
    </div>
  );
}
