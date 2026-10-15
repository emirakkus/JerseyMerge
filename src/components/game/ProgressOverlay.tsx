"use client";

import { useState } from "react";
import { JerseySprite } from "./JerseySprite";
import { ACHIEVEMENTS } from "@/lib/data/achievements";
import { levelForXp } from "@/lib/progress/xp";
import { KIT_VALUES, type ProgressState } from "@/lib/progress/types";
<<<<<<< HEAD
import { SKINS, isSkinUnlocked, type SkinDef } from "@/lib/cosmetics";
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
import { themeFor } from "@/lib/game/constants";

interface ProgressOverlayProps {
  progress: ProgressState;
  onClose: () => void;
}

<<<<<<< HEAD
type Tab = "kits" | "skins" | "trophies";
=======
type Tab = "kits" | "trophies";
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c

/** My Club: player level/XP + kit collection + achievements. Responsive for
 * narrow and landscape phones (scrollable, dvh-capped). */
export function ProgressOverlay({ progress, onClose }: ProgressOverlayProps) {
  const [tab, setTab] = useState<Tab>("kits");
  const lvl = levelForXp(progress.xp);
  const unlockedKits = KIT_VALUES.filter((v) => progress.counters.maxValue >= v).length;
<<<<<<< HEAD
  const unlockedSkinCount = SKINS.filter((s) => isSkinUnlocked(s, { xp: progress.xp, maxScore: progress.counters.maxScore, level: lvl.level })).length;
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0B1229]/80 p-3 backdrop-blur-[2px] sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="My club: collection and achievements"
        className="flex max-h-[88dvh] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl bg-[#131B40] text-white shadow-2xl ring-1 ring-white/10"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#FFC93C] text-[#0F1B3D]">
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#8A6A00]">Level</span>
            <span className="font-display text-lg leading-none">{lvl.level}</span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
<<<<<<< HEAD
              <span className="truncate text-[14px] font-extrabold text-white">
                {progress.xp.toLocaleString()} XP
              </span>
              <span className="shrink-0 text-[12px] font-bold text-[#9FB0E8]">
=======
              <span className="truncate text-[13px] font-extrabold text-white">
                {progress.xp.toLocaleString()} XP
              </span>
              <span className="shrink-0 text-[10px] font-bold text-[#9FB0E8]">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
                {lvl.needed > 0 ? `${lvl.needed.toLocaleString()} XP to next level` : "Max level"}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FFC93C] to-[#2EC4B6] transition-all duration-500"
                style={{ width: `${Math.round(lvl.pct * 100)}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
<<<<<<< HEAD
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
=======
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="m2 2 10 10M12 2 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

<<<<<<< HEAD
        <div className="grid grid-cols-3 gap-1 px-4 pt-3" role="tablist" aria-label="Club sections">
=======
        <div className="grid grid-cols-2 gap-1 px-4 pt-3" role="tablist" aria-label="Club sections">
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
          <button
            type="button"
            role="tab"
            aria-selected={tab === "kits"}
            onClick={() => setTab("kits")}
<<<<<<< HEAD
            className={`min-h-[48px] rounded-xl px-1.5 py-2 text-[11.5px] font-extrabold uppercase tracking-wide transition ${
              tab === "kits" ? "bg-[#FFC93C] text-[#0F1B3D]" : "bg-white/5 text-[#C7CCEA] hover:text-white"
            }`}
          >
            Kits {unlockedKits}/{KIT_VALUES.length}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "skins"}
            onClick={() => setTab("skins")}
            className={`min-h-[48px] rounded-xl px-1.5 py-2 text-[11.5px] font-extrabold uppercase tracking-wide transition ${
              tab === "skins" ? "bg-[#FFC93C] text-[#0F1B3D]" : "bg-white/5 text-[#C7CCEA] hover:text-white"
            }`}
          >
            Skins {unlockedSkinCount}/{SKINS.length}
=======
            className={`min-h-[44px] rounded-xl px-2 py-2 text-[11px] font-extrabold uppercase tracking-wide transition ${
              tab === "kits" ? "bg-[#FFC93C] text-[#0F1B3D]" : "bg-white/5 text-[#C7CCEA] hover:text-white"
            }`}
          >
            Collection {unlockedKits}/{KIT_VALUES.length}
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "trophies"}
            onClick={() => setTab("trophies")}
<<<<<<< HEAD
            className={`min-h-[48px] rounded-xl px-1.5 py-2 text-[11.5px] font-extrabold uppercase tracking-wide transition ${
=======
            className={`min-h-[44px] rounded-xl px-2 py-2 text-[11px] font-extrabold uppercase tracking-wide transition ${
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
              tab === "trophies" ? "bg-[#FFC93C] text-[#0F1B3D]" : "bg-white/5 text-[#C7CCEA] hover:text-white"
            }`}
          >
            Trophies {progress.achievements.length}/{ACHIEVEMENTS.length}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {tab === "kits" ? (
            <div>
              <div className="grid grid-cols-3 gap-2 min-[420px]:grid-cols-4">
                {KIT_VALUES.map((v) => {
                  const unlocked = progress.counters.maxValue >= v;
                  return (
                    <div
                      key={v}
                      className={`flex flex-col items-center gap-0.5 rounded-2xl p-2 ring-1 ${
                        unlocked ? "bg-[#1B2450] ring-[#FFC93C]/40" : "bg-[#0F1530] ring-white/5"
                      }`}
                    >
                      <div className="relative">
                        <JerseySprite
                          value={v}
                          size={54}
                          className={unlocked ? "" : "grayscale brightness-[0.4] opacity-60"}
                        />
                        {!unlocked && (
                          <span className="absolute -bottom-1 -right-1 rounded-full bg-[#131B40] p-1 text-[#9FB0E8] shadow">
                            <svg width="10" height="10" viewBox="0 0 16 16" aria-hidden="true">
                              <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                            </svg>
                          </span>
                        )}
                      </div>
<<<<<<< HEAD
                      <span className={`text-[12.5px] font-extrabold ${unlocked ? "text-white" : "text-[#6B79AD]"}`}>
                        {v}
                      </span>
                      <span className={`text-[10.5px] font-bold leading-none ${unlocked ? "text-[#FFC93C]" : "text-[#4A5680]"}`}>
=======
                      <span className={`text-[11px] font-extrabold ${unlocked ? "text-white" : "text-[#6B79AD]"}`}>
                        {v}
                      </span>
                      <span className={`text-[9px] font-bold leading-none ${unlocked ? "text-[#FFC93C]" : "text-[#4A5680]"}`}>
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
                        {unlocked ? themeFor(v).name : "Locked"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="m-0 mt-3 text-center text-[10px] font-semibold leading-snug text-[#9FB0E8]">
                All kits are original fictional designs — no real clubs, players or brands.
              </p>
            </div>
<<<<<<< HEAD
          ) : tab === "skins" ? (
            <div className="grid grid-cols-2 gap-2">
              {SKINS.map((skin) => {
                const unlocked = isSkinUnlocked(skin, {
                  xp: progress.xp,
                  maxScore: progress.counters.maxScore,
                  level: lvl.level,
                });
                return (
                  <div
                    key={skin.id}
                    className={`flex items-center gap-2 rounded-2xl p-2.5 ring-1 ${
                      unlocked ? "bg-[#1B2450] ring-[#FFC93C]/40" : "bg-[#0F1530] ring-white/5 opacity-60"
                    }`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0F1B3D]">
                      <JerseySprite value={2} size={48} className={unlocked ? "" : "grayscale brightness-[0.4]"} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`m-0 text-[12.5px] font-extrabold ${unlocked ? "text-white" : "text-[#8B97C9]"}`}>
                        {skin.name}
                      </p>
                      <p className="m-0 text-[10.5px] font-semibold leading-snug text-[#9FB0E8]">
                        {skin.description}
                      </p>
                      <p className="m-0 mt-0.5 text-[10px] font-bold text-[#6B79AD]">
                        {skin.rule === "default"
                          ? "Unlocked"
                          : skin.rule === "score"
                            ? `Score ${skin.threshold.toLocaleString()}`
                            : `Reach level ${skin.threshold}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
          ) : (
            <ul className="m-0 list-none space-y-2">
              {ACHIEVEMENTS.map((a) => {
                const has = progress.achievements.includes(a.id);
                return (
                  <li
                    key={a.id}
                    className={`flex items-center gap-3 rounded-2xl p-2.5 ring-1 ${
                      has ? "bg-[#FFC93C]/10 ring-[#FFC93C]/40" : "bg-[#0F1530] ring-white/5"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        has ? "bg-[#FFC93C] text-[#0F1B3D]" : "bg-white/5 text-[#6B79AD]"
                      }`}
                    >
                      {has ? (
                        <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
                          <path
                            d="M4 2h8v2a4 4 0 0 1-8 0V2ZM4 3H1.5v.5A3.5 3.5 0 0 0 5 7m7-4h2.5v.5A3.5 3.5 0 0 1 11 7m-4.5 3.5h3V13h-3m-1 0h5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                          <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
<<<<<<< HEAD
                      <p className={`m-0 text-[13px] font-extrabold ${has ? "text-white" : "text-[#8B97C9]"}`}>
                        {a.name}
                      </p>
                      <p className="m-0 text-[12px] font-semibold leading-snug text-[#9FB0E8]">{a.description}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-extrabold tabular-nums ${
=======
                      <p className={`m-0 text-[12px] font-extrabold ${has ? "text-white" : "text-[#8B97C9]"}`}>
                        {a.name}
                      </p>
                      <p className="m-0 text-[11px] font-semibold leading-snug text-[#9FB0E8]">{a.description}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
                        has ? "bg-[#FFC93C]/20 text-[#FFC93C]" : "bg-white/5 text-[#6B79AD]"
                      }`}
                    >
                      +{a.rewardXp} XP
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
