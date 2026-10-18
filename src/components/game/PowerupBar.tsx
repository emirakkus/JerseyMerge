"use client";

import { POWERUPS, type PowerupId, type PowerupSnapshot } from "@/lib/game/powerups";
import { GAME_UI } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";

interface PowerupBarProps {
  snapshot: PowerupSnapshot;
  canPlay: boolean;
  onUse: (id: PowerupId) => void;
}

const ACTIVE_RING: Record<PowerupId, string> = {
  joker: "ring-[#FFC93C]/70 text-[#FFC93C]",
  bomb: "ring-[#FF5A5F]/70 text-[#FF5A5F]",
  scramble: "ring-[#2EC4B6]/70 text-[#2EC4B6]",
  undo: "ring-[#FF7AB8]/70 text-[#FF7AB8]",
};

function PowerupIcon({ id }: { id: string }) {
  switch (id) {
    case "joker":
      return (
        <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 1.5 9.9 6l4.6.3-3.5 3 1.1 4.5L8 11.2l-4.1 2.6 1.1-4.5-3.5-3L6.1 6z" fill="currentColor" />
        </svg>
      );
    case "bomb":
      return (
        <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="9.5" r="5" fill="currentColor" />
          <path d="M10 4.5 12 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "scramble":
      return (
        <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M2 5.5h3.5l5 5H14M2 10.5h3.5m0 0L9 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m11.5 3.5 2.5 2-2.5 2M11.5 8.5l2.5 2-2.5 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M3 6.5 6.5 3 10 6.5M6.5 3v8a3.5 3.5 0 0 0 7 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/** Compact icon-only power-up row with touch sized targets. */
export function PowerupBar({ snapshot, canPlay, onUse }: PowerupBarProps) {
  const [bombArmed, setBombArmed] = useState(false);
  const [touchHelp, setTouchHelp] = useState<PowerupId | null>(null);
  const bombTimer = useRef<number | null>(null);
  const helpTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (bombTimer.current !== null) window.clearTimeout(bombTimer.current);
    if (helpTimer.current !== null) window.clearTimeout(helpTimer.current);
  }, []);
  return (
    <div className="powerup-shell">
      <div className="powerup-grid" role="group" aria-label={GAME_UI.powerups}>
        {POWERUPS.map((p) => {
          const count = snapshot.inventory[p.id];
          const disabled = !canPlay || count <= 0 || snapshot.used[p.id] >= p.max || (p.id === "undo" && !snapshot.canUndo);
          const active = !disabled;
          const name = GAME_UI.powerupNames[p.id];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (p.id !== "bomb") return onUse(p.id);
                if (bombArmed) {
                  if (bombTimer.current !== null) window.clearTimeout(bombTimer.current);
                  setBombArmed(false);
                  onUse(p.id);
                } else {
                  setBombArmed(true);
                  bombTimer.current = window.setTimeout(() => setBombArmed(false), 1800);
                }
              }}
              disabled={disabled}
              data-tooltip={`${name} · ${p.key} — ${GAME_UI.powerupHelp[p.id]}`}
              data-touch-help={touchHelp === p.id ? "true" : undefined}
              onPointerDown={(event) => {
                if (event.pointerType !== "touch") return;
                helpTimer.current = window.setTimeout(() => setTouchHelp(p.id), 500);
              }}
              onPointerUp={() => {
                if (helpTimer.current !== null) window.clearTimeout(helpTimer.current);
                helpTimer.current = null;
                window.setTimeout(() => setTouchHelp(null), 1500);
              }}
              onPointerLeave={() => {
                if (helpTimer.current !== null) window.clearTimeout(helpTimer.current);
                helpTimer.current = null;
                setTouchHelp(null);
              }}
              onContextMenu={(event) => event.preventDefault()}
              aria-label={bombArmed && p.id === "bomb" ? GAME_UI.confirmBomb : `${name}, ${GAME_UI.powerupCount(count)}. ${GAME_UI.powerupHelp[p.id]}`}
              className={`powerup-button ${active ? `is-available ${ACTIVE_RING[p.id]}` : "is-empty"}`}
            >
              <PowerupIcon id={p.id} />
              <span className="powerup-count">{bombArmed && p.id === "bomb" ? "!" : count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
