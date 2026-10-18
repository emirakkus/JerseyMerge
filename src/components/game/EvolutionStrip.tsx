"use client";

import type { CSSProperties } from "react";
import { JERSEY_VALUES, themeFor } from "@/lib/game/constants";
import { GAME_UI } from "@/lib/i18n";

export function EvolutionStrip({ nextValue, highestValue }: { nextValue: number; highestValue: number }) {
  return (
    <div className="evolution-wrap">
      <span className="evolution-highest">{GAME_UI.highestReached}: {highestValue}</span>
      <ol className="evolution-strip" aria-label={GAME_UI.evolution}>
        {JERSEY_VALUES.map((value, index) => (
          <li
            key={value}
            aria-label={`${index + 1}. seviye: ${value}${value === nextValue ? `, ${GAME_UI.next}` : ""}${value === highestValue ? `, ${GAME_UI.highestReached}` : ""}`}
            aria-current={value === nextValue ? "step" : undefined}
            className={`evolution-step${value === nextValue ? " is-next" : ""}${value <= highestValue ? " is-reached" : ""}`}
            style={{ "--evolution-color": themeFor(value).primary } as CSSProperties}
          >
            {value}
          </li>
        ))}
      </ol>
    </div>
  );
}
