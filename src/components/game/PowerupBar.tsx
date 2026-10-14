"use client";

import { POWERUPS, type PowerupId, type PowerupSnapshot } from "@/lib/game/powerups";

interface PowerupBarProps {
  snapshot: PowerupSnapshot;
  canPlay: boolean;
  onUse: (id: PowerupId) => void;
}

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

const ACTIVE_RING: Record<PowerupId, string> = {
  joker: "ring-[#FFC93C]/70 text-[#FFC93C]",
  bomb: "ring-[#FF5A5F]/70 text-[#FF5A5F]",
  scramble: "ring-[#2EC4B6]/70 text-[#2EC4B6]",
  undo: "ring-[#FF7AB8]/70 text-[#FF7AB8]",
};

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
    </div>
  );
}
