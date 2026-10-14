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
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      <div className="rounded-2xl bg-[#1B2450] px-3 py-2.5 ring-1 ring-white/10 sm:px-4 sm:py-3">
        <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#FFC93C] sm:text-[11px]">
          Skor
        </p>
        <p
          key={score}
          className="score-bump m-0 mt-1 font-display text-[20px] leading-none tabular-nums text-[#FFC93C] sm:text-[24px]"
        >
          {score.toLocaleString()}
        </p>
      </div>
      <div className="rounded-2xl bg-[#1B2450] px-3 py-2.5 ring-1 ring-white/10 sm:px-4 sm:py-3">
        <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/60 sm:text-[11px]">
          Süre
        </p>
        <p className="m-0 mt-1 font-display text-[20px] leading-none tabular-nums text-white sm:text-[24px]">
          {formatTime(timeMs)}
        </p>
      </div>
      <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#1B2450] px-2 py-2.5 ring-1 ring-white/10 sm:gap-2 sm:px-3 sm:py-3">
        <JerseySprite value={next} size={38} />
        <div className="flex flex-col items-start">
          <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#2EC4B6] sm:text-[11px]">
            Sıradaki
          </p>
          <p className="m-0 mt-1 text-base font-extrabold tabular-nums text-white">{next}</p>
        </div>
      </div>
      <div className="rounded-2xl bg-[#1B2450] px-3 py-2.5 text-right ring-1 ring-white/10 sm:px-4 sm:py-3">
        <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#2EC4B6] sm:text-[11px]">
          Rekor
        </p>
        <p className="m-0 mt-1 font-display text-[20px] leading-none tabular-nums text-[#2EC4B6] sm:text-[24px]">
          {best.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
