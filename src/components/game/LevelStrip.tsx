"use client";

import { useEffect, useRef, useState } from "react";
import { GAME_UI } from "@/lib/i18n";
import { levelProgress } from "@/lib/game/levels";

interface LevelStripProps { score: number; modeLabel?: string }

export function LevelStrip({ score, modeLabel }: LevelStripProps) {
  const { level, index, next, pct } = levelProgress(score);
  const previous = useRef(index);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (previous.current !== index) {
      setToast(GAME_UI.levelReached(GAME_UI.levelNames[index] ?? level.name));
      const timer = window.setTimeout(() => setToast(""), 1500);
      previous.current = index;
      return () => window.clearTimeout(timer);
    }
  }, [index, level.name]);
  return (
    <div className="level-strip" aria-label={`${GAME_UI.levelNames[index] ?? level.name}: ${next ? GAME_UI.nextRankGoal(GAME_UI.levelNames[index + 1] ?? next.name, next.min) : GAME_UI.maxRank}`}>
      <div className="level-meta">
        <span>{GAME_UI.levelNames[index] ?? level.name}{modeLabel ? ` · ${modeLabel}` : ""}</span>
        {toast ? <span className="level-toast" role="status">{toast}</span> : <span className="level-goal">{next ? GAME_UI.nextRankGoal(GAME_UI.levelNames[index + 1] ?? next.name, next.min) : GAME_UI.maxRank}</span>}
      </div>
      {next && <div className="level-track"><div className="level-fill" style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: level.color }} /></div>}
    </div>
  );
}
