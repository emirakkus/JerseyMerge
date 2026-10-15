"use client";

<<<<<<< HEAD
import { useState } from "react";
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
import { POWERUPS, type PowerupId, type PowerupSnapshot } from "@/lib/game/powerups";

interface PowerupBarProps {
  snapshot: PowerupSnapshot;
  canPlay: boolean;
  onUse: (id: PowerupId) => void;
}

<<<<<<< HEAD
=======
const ICONS: Record<PowerupId, React.ReactNode> = {
  joker: (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 1.5 12.4 7l5.6.4-4.3 3.7 1.4 5.5L10 13.6 4.9 16.6l1.4-5.5L2 7.4 7.6 7z"
        fill="currentColor"
      />
    </svg>
  ),
  bomb: (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="9" cy="11.5" r="6.5" fill="currentColor" />
      <path d="M12 5.5 14.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15.5" cy="2.6" r="1.6" fill="#ffd24a" />
    </svg>
  ),
  scramble: (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M2 6h4l7 8h4m2-2-2.5 2.5L18 17M2 14h4l2.5-3.2M13 6h5m0 0-2.5-2.5M18 6l-2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  undo: (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M7 4 3 8l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 8h9a5 5 0 0 1 0 10H8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  ),
};

>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
const ACTIVE_RING: Record<PowerupId, string> = {
  joker: "ring-[#FFC93C]/70 text-[#FFC93C]",
  bomb: "ring-[#FF5A5F]/70 text-[#FF5A5F]",
  scramble: "ring-[#2EC4B6]/70 text-[#2EC4B6]",
  undo: "ring-[#FF7AB8]/70 text-[#FF7AB8]",
};

<<<<<<< HEAD
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

/** Power-up buttons (52px+ touch targets) with an on-demand info panel. */
export function PowerupBar({ snapshot, canPlay, onUse }: PowerupBarProps) {
  // Descriptions live in the button tooltips (title/aria-label) and in the
  // main menu's "How to play" section — no extra panel on the game screen.

  return (
    <div className="px-0.5">
      <p className="m-0 px-0.5 pb-1 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#9FB0E8]">
        Power-ups
      </p>

      <div className="powerup-grid grid grid-cols-4 gap-1.5" role="group" aria-label="Power-ups">
        {POWERUPS.map((p) => {
          const count = snapshot.inventory[p.id];
          const disabled = !canPlay || count <= 0 || (p.id === "undo" && !snapshot.canUndo);
          const active = !disabled;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onUse(p.id)}
              disabled={disabled}
              title={`${p.name} (${p.key}) — ${p.description}`}
              aria-label={`${p.name} power-up, ${count} left. ${p.description}${
                p.id === "undo" && !snapshot.canUndo ? " Nothing to undo." : ""
              }`}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl bg-[#1B2450] px-1 py-2 transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-35 ${
                active ? `ring-2 ${ACTIVE_RING[p.id]}` : "ring-1 ring-white/10 text-white/40"
              }`}
            >
              <PowerupIcon id={p.id} />
              <span className="text-[12px] font-extrabold leading-none text-white">
                {p.name} <span className="tabular-nums">×{count}</span>
              </span>
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-bold text-white/70">
                {p.key}
              </kbd>
            </button>
          );
        })}
      </div>
=======
/** Four compact, keyboard-labeled power-up buttons (J / B / K / Z), ≥44px. */
export function PowerupBar({ snapshot, canPlay, onUse }: PowerupBarProps) {
  return (
    <div className="powerup-grid grid grid-cols-4 gap-1.5 px-0.5" role="group" aria-label="Power-ups">
      {POWERUPS.map((p) => {
        const count = snapshot.inventory[p.id];
        const disabled = !canPlay || count <= 0 || (p.id === "undo" && !snapshot.canUndo);
        const active = !disabled;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onUse(p.id)}
            disabled={disabled}
            title={`${p.name} (${p.key}) — ${p.description}`}
            aria-label={`${p.name} power-up, ${count} left${
              p.id === "undo" && !snapshot.canUndo ? ", nothing to undo" : ""
            }`}
            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl bg-[#1B2450] px-1 py-1.5 transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-35 ${
              active ? `ring-2 ${ACTIVE_RING[p.id]}` : "ring-1 ring-white/10 text-white/40"
            }`}
          >
            <span>{ICONS[p.id]}</span>
            <span className="text-[10px] font-extrabold leading-none text-white">
              {p.name} <span className="tabular-nums">×{count}</span>
            </span>
            <kbd className="rounded bg-white/10 px-1 text-[9px] font-bold text-white/60">{p.key}</kbd>
          </button>
        );
      })}
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    </div>
  );
}
