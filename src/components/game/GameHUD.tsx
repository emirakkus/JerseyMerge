"use client";

import { useEffect, useState } from "react";
import { GAME_UI } from "@/lib/i18n";

interface GameHUDProps { score: number; best: number; targetScore?: number }

export function GameHUD({ score, best, targetScore }: GameHUDProps) {
  const [shownScore, setShownScore] = useState(score);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setShownScore(score); return; }
    const startValue = shownScore;
    const startAt = performance.now();
    let frame = 0;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - startAt) / 220);
      setShownScore(Math.round(startValue + (score - startValue) * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  // shownScore is deliberately sampled only at effect start for each target score.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);
  return (
    <div className="game-hud" aria-label={`${GAME_UI.score}: ${shownScore.toLocaleString("tr-TR")}${targetScore !== undefined ? ` · ${GAME_UI.friendChallenge.target(targetScore)}` : ""}`}>
      <div className="game-score">
        <span>{GAME_UI.score}</span>
        <strong key={score} className="score-bump">{shownScore.toLocaleString("tr-TR")}</strong>
        {targetScore !== undefined && <span className="mt-0.5 rounded-full bg-[#FF5A5F]/15 px-2 py-0.5 text-[9px] font-extrabold text-[#FFB0B2]">{GAME_UI.friendChallenge.target(targetScore)}</span>}
      </div>
      <div className="game-best" title={GAME_UI.best}>
        <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2h8v2a4 4 0 0 1-8 0V2ZM4 3H1.5v.5A3.5 3.5 0 0 0 5 7m7-4h2.5v.5A3.5 3.5 0 0 1 11 7m-4.5 3.5h3V13h-3m-1 0h5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        <span>{GAME_UI.best}</span>
        <strong>{best.toLocaleString("tr-TR")}</strong>
      </div>
    </div>
  );
}
