"use client";

import { JerseySprite } from "./JerseySprite";
import { formatTime } from "@/lib/game/format";

interface GameHUDProps {
  score: number;
  best: number;
  next: number;
  timeMs: number;
}

export function GameHUD({ score, best, next, timeMs }: GameHUDProps) {
  return (
    <div className="hud-grid grid grid-cols-4 gap-2 sm:gap-3">
      <div className="rounded-2xl bg-[#1B2450] px-3 py-2.5 ring-1 ring-white/10 sm:px-4 sm:py-3">
        <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-[#FFC93C]">
          Skor
        </p>
        <p
          key={score}
          className="score-bump m-0 mt-1 font-display text-[22px] leading-none tabular-nums text-[#FFC93C] sm:text-[26px]"
        >
          {score.toLocaleString()}
        </p>
      </div>
      <div className="rounded-2xl bg-[#1B2450] px-3 py-2.5 ring-1 ring-white/10 sm:px-4 sm:py-3">
        <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-white/70">
          Süre
        </p>
        <p className="m-0 mt-1 font-display text-[22px] leading-none tabular-nums text-white sm:text-[26px]">
          {formatTime(timeMs)}
        </p>
      </div>
      <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#1B2450] px-2 py-2.5 ring-1 ring-white/10 sm:gap-2 sm:px-3 sm:py-3">
        <JerseySprite value={next} size={42} />
        <div className="flex flex-col items-start">
          <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-[#2EC4B6]">
            Sıradaki
          </p>
          <p className="m-0 mt-1 text-lg font-extrabold tabular-nums text-white">{next}</p>
        </div>
      </div>
      <div className="rounded-2xl bg-[#1B2450] px-3 py-2.5 text-right ring-1 ring-white/10 sm:px-4 sm:py-3">
        <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-[#2EC4B6]">
          Rekor
        </p>
        <p className="m-0 mt-1 font-display text-[22px] leading-none tabular-nums text-[#2EC4B6] sm:text-[26px]">
          {best.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
