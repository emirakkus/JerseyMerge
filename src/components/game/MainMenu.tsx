"use client";

import { useRef, useState } from "react";
import { JerseySprite } from "./JerseySprite";
import { rankBadgeClass } from "./Leaderboard";
import { formatTime } from "@/lib/game/format";
import type { MissionView } from "@/lib/game/missions";
import { BADGES } from "@/lib/game/badges";
import type { ApiUser } from "@/lib/api";
import type { ScoreEntry } from "@/lib/game/scoring";
import type { DailyBoardEntry } from "@/lib/daily/types";
import type { DailyQuest } from "@/lib/daily/quests";
import { sortQuestCards, type QuestCard } from "@/lib/daily/questOrder";
import { LANG, t, type StringKey } from "@/lib/i18n";

type TabId = "quests" | "how" | "scores" | "badges";

interface TabDef {
  id: TabId;
  label: StringKey;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  {
    id: "quests",
    label: "tabQuests",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="3" y="2" width="10" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5.5 6h5M5.5 9h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "how",
    label: "tabHow",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6.2 6.2a1.8 1.8 0 1 1 2.6 1.6c-.5.3-.8.6-.8 1.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="11.2" r="0.9" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "scores",
    label: "tabScores",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M4 2h8v2a4 4 0 0 1-8 0V2ZM4 3H1.5v.5A3.5 3.5 0 0 0 5 7m7-4h2.5v.5A3.5 3.5 0 0 1 11 7m-4.5 3.5h3V13h-3m-1 0h5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "badges",
    label: "tabBadges",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.5 9.9 6l4.6.3-3.5 3 1.1 4.5L8 11.2l-4.1 2.6 1.1-4.5-3.5-3L6.1 6z" fill="currentColor" />
      </svg>
    ),
  },
];

/** Slow-drifting kit composition (reuses the cached jersey sprites). */
const HERO_KITS = [
  { value: 2, left: "6%", top: 26, size: 44, delay: "0s" },
  { value: 16, left: "30%", top: 4, size: 60, delay: "1.4s" },
  { value: 64, left: "58%", top: 12, size: 52, delay: "2.8s" },
  { value: 256, left: "82%", top: 30, size: 44, delay: "4.2s" },
];

export interface DailyBundle {
  dayKey: string;
  seed: number;
  quests: DailyQuest[];
  board: DailyBoardEntry[];
  streak: number;
  claimed: string[];
  progress: Record<string, number>;
  isGuest: boolean;
  yourRank: number | null;
  dailyBest: number | null;
}

interface MainMenuProps {
  best: number;
  top: ScoreEntry[];
  globalTop: ScoreEntry[];
  missions: MissionView[];
  ownedBadges: string[];
  user: ApiUser | null;
  daily: DailyBundle;
  onOpenAuth: () => void;
  onPlay: () => void;
  onPlayDaily: () => void;
  onClaimQuest: (questId: string) => void;
}

export function MainMenu({
  best,
  top,
  globalTop,
  missions,
  ownedBadges,
  user,
  daily,
  onOpenAuth,
  onPlay,
  onPlayDaily,
  onClaimQuest,
}: MainMenuProps) {
  const [tab, setTab] = useState<TabId>("quests");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const s = (key: StringKey): string => t(LANG, key) as string;

  const questCards = sortQuestCards(
    daily.quests.map((q) => ({
      id: q.id,
      title: q.title,
      target: q.target,
      progress: daily.progress[q.id] ?? 0,
      reward: q.reward,
      claimed: daily.claimed.includes(q.id),
    }))
  );
  const anyClaimable = questCards.some((c) => c.state === "claimable");

  const onTabKeyDown = (e: React.KeyboardEvent): void => {
    const idx = tabRefs.current.findIndex((el) => el === document.activeElement);
    if (idx === -1) return;
    let next = -1;
    if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="menu-root absolute inset-0 z-10 flex flex-col bg-gradient-to-b from-[#0F1B3D] via-[#191A4E] to-[#2A1B5C] text-white">
      <div className="menu-scroll menu-scrollable flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {/* side: title + hero scene (shrinks/hides on landscape) */}
        <div className="menu-side flex flex-col gap-2">
          <h1 className="menu-title m-0 text-center font-display text-[30px] font-extrabold leading-none tracking-tight">
            {s("title")}
          </h1>
          <p className="menu-tagline m-0 px-4 text-center text-[14px] font-bold text-[#9FB0E8]">
            {s("tagline")}
          </p>
          <div className="menu-hero relative mx-2 h-[96px] w-auto" aria-hidden="true">
            {HERO_KITS.map((k) => (
              <span
                key={k.value}
                className="hero-float absolute"
                style={{ left: k.left, top: k.top, animationDelay: k.delay }}
              >
                <JerseySprite value={k.value} size={k.size} />
              </span>
            ))}
          </div>
        </div>

        {/* main: banner, tabs, panel (panel fills remaining height) */}
        <div className="menu-main flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex gap-2">
            {user ? (
              <div className="flex min-h-[52px] min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-[#2EC4B6]/10 px-3 py-2 ring-1 ring-[#2EC4B6]/40">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2EC4B6] font-display text-lg text-[#0F1B3D]">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-extrabold">{user.username}</span>
                  <span className="block text-[12.5px] font-bold text-[#2EC4B6]">{s("signedIn")}</span>
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex min-h-[52px] min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-[#2EC4B6]/15 px-3.5 py-2.5 text-left ring-1 ring-[#2EC4B6]/40 transition hover:bg-[#2EC4B6]/25 active:scale-[0.99]"
              >
                <svg width="22" height="22" viewBox="0 0 16 16" className="shrink-0 text-[#2EC4B6]" aria-hidden="true">
                  <circle cx="8" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <path
                    d="M2.5 14c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[14px] font-extrabold leading-tight">{s("signIn")}</span>
              </button>
            )}
            <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-[#FFC93C]/15 px-3.5 ring-1 ring-[#FFC93C]/30">
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#FFC93C]">
                {s("best")}
              </span>
              <span className="font-display text-[17px] leading-none tabular-nums text-[#FFC93C]">
                {best.toLocaleString()}
              </span>
            </div>
          </div>

          <nav
            className="menu-tabs grid grid-cols-4 gap-1 rounded-2xl bg-white/5 p-1"
            role="tablist"
            aria-label="Menu sections"
            onKeyDown={onTabKeyDown}
          >
            {TABS.map((tb, i) => (
              <button
                key={tb.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={tab === tb.id}
                aria-controls={`menu-panel-${tb.id}`}
                id={`menu-tab-${tb.id}`}
                tabIndex={tab === tb.id ? 0 : -1}
                onClick={() => setTab(tb.id)}
                className={`flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl px-1 text-[12.5px] font-extrabold transition ${
                  tab === tb.id
                    ? "bg-[#FFC93C] text-[#0F1B3D]"
                    : "text-[#C7CCEA] hover:bg-white/5 hover:text-white"
                }`}
              >
                {tb.icon}
                <span className="hidden min-[400px]:inline">{s(tb.label)}</span>
              </button>
            ))}
          </nav>

          <div
            key={tab}
            id={`menu-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`menu-tab-${tab}`}
            className="menu-panel tab-fade menu-fade menu-scrollable flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl bg-white/5 p-3 ring-1 ring-white/10"
          >
            {tab === "quests" && (
              <QuestsTab
                s={s}
                daily={daily}
                cards={questCards}
                onClaim={onClaimQuest}
              />
            )}
            {tab === "how" && <HowTab s={s} />}
            {tab === "scores" && <ScoresTab s={s} top={top} globalTop={globalTop} user={user} />}
            {tab === "badges" && <BadgesTab owned={ownedBadges} />}
          </div>
        </div>
      </div>

      {/* bottom actions: safe-area aware */}
      <div className="menu-footer flex gap-2 px-4 pt-3">
        <button
          type="button"
          onClick={onPlay}
          autoFocus
          className="min-h-[60px] flex-[2] rounded-2xl bg-[#FFC93C] font-display text-[23px] tracking-wide text-[#0F1B3D] shadow-[0_5px_0_#D9A406] transition hover:bg-[#FFD76A] active:translate-y-[2px] active:shadow-[0_3px_0_#D9A406]"
        >
          {s("play")}
        </button>
        <button
          type="button"
          onClick={onPlayDaily}
          title={s("dailyAria")}
          aria-label={s("dailyAria")}
          className="relative flex min-h-[60px] flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#2EC4B6] font-display text-[16px] tracking-wide text-[#0F1B3D] shadow-[0_5px_0_#1E8A80] transition hover:bg-[#4FD4C8] active:translate-y-[2px] active:shadow-[0_3px_0_#1E8A80]"
        >
          <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M2 6.5h12M5.5 1.8v2.4M10.5 1.8v2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="m6 10 1.5 1.5L10.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {s("daily")}
          {anyClaimable && (
            <span
              className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-[#FF5A5F] ring-2 ring-[#0F1B3D]"
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </div>
  );
}

type DictFn = (key: StringKey) => string;

function PowerupIcon({ id }: { id: string }) {
  switch (id) {
    case "joker":
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 1.5 9.9 6l4.6.3-3.5 3 1.1 4.5L8 11.2l-4.1 2.6 1.1-4.5-3.5-3L6.1 6z" fill="currentColor" />
        </svg>
      );
    case "bomb":
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="9.5" r="5" fill="currentColor" />
          <path d="M10 4.5 12 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "scramble":
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M2 5.5h3.5l5 5H14M2 10.5h3.5m0 0L9 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="m11.5 3.5 2.5 2-2.5 2M11.5 8.5l2.5 2-2.5 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
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

function QuestCardView({
  card,
  s,
  onClaim,
}: {
  card: QuestCard;
  s: DictFn;
  onClaim: (id: string) => void;
}) {
  const { quest, state, pct } = card;
  const shown = Math.min(quest.progress, quest.target);
  return (
    <div
      className={`relative rounded-2xl p-3 ring-2 ${
        state === "claimable"
          ? "claim-pulse bg-[#FFC93C]/10 ring-[#FFC93C]"
          : state === "progress"
            ? "bg-white/5 ring-white/10"
            : "bg-white/[0.03] opacity-60 ring-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 text-[14px] font-extrabold leading-tight text-white">{quest.title}</p>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-[#0F1B3D] px-2.5 py-1.5 text-[12.5px] font-extrabold capitalize text-[#FFC93C] ring-1 ring-[#FFC93C]/50">
          <PowerupIcon id={quest.reward} />
          +1 {quest.reward}
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${state === "progress" ? "bg-[#2EC4B6]" : "bg-[#FFC93C]"}`}
            style={{ width: `${Math.round(pct * 100)}%` }}
          />
        </div>
        <span className="shrink-0 text-[13px] font-extrabold tabular-nums text-white">
          {shown}/{quest.target}
        </span>
      </div>
      {state === "claimable" && (
        <button
          type="button"
          onClick={() => onClaim(quest.id)}
          className="mt-2.5 min-h-[48px] w-full rounded-xl bg-[#FFC93C] text-[14px] font-extrabold uppercase tracking-wide text-[#0F1B3D] shadow-[0_3px_0_#D9A406] transition hover:bg-[#FFD76A] active:translate-y-[2px] active:shadow-[0_1px_0_#D9A406]"
        >
          {s("claim")} +1 {quest.reward}
        </button>
      )}
      {state === "claimed" && (
        <p className="m-0 mt-2 flex items-center justify-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-[#FFC93C]/70">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M2 6.5 4.8 9 10 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {s("claimed")}
        </p>
      )}
    </div>
  );
}

function QuestsTab({
  s,
  daily,
  cards,
  onClaim,
}: {
  s: DictFn;
  daily: DailyBundle;
  cards: QuestCard[];
  onClaim: (id: string) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#2EC4B6]">
          {s("today")} · {daily.dayKey}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-orange-400/15 px-2 py-0.5 text-[12px] font-extrabold text-orange-300">
          <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 1c1 2.5 4 3.8 4 7a4 4 0 0 1-8 0c0-1.6.7-2.7 1.6-3.7C6.3 5.6 7 6.5 7.4 7.2 7.6 5.4 7.4 3 8 1Z"
              fill="currentColor"
            />
          </svg>
          {daily.streak} {s("streak")}
        </span>
      </div>

      <ul className="m-0 mt-2.5 list-none space-y-2.5">
        {cards.map((c) => (
          <li key={c.quest.id}>
            <QuestCardView card={c} s={s} onClaim={onClaim} />
          </li>
        ))}
      </ul>
      <p className="m-0 mt-2.5 text-center text-[12px] font-semibold text-[#9FB0E8]">{s("perMatchNote")}</p>

      <div className="mt-3">
        <p className="m-0 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#9FB0E8]">
          {s("dailyBoard")}
        </p>
        {daily.board.length === 0 ? (
          <p className="m-0 mt-1.5 text-[12.5px] font-semibold text-[#9FB0E8]">{s("noBoard")}</p>
        ) : (
          <ol className="m-0 mt-1.5 list-none space-y-1">
            {daily.board.slice(0, 5).map((e, i) => (
              <li key={`${e.name}-${i}`} className="flex items-center gap-2 text-[13px]">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-extrabold ${rankBadgeClass(i)}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-bold text-white">{e.name}</span>
                <span className="tabular-nums text-[11.5px] font-semibold text-[#9FB0E8]">
                  {e.timeMs > 0 ? formatTime(e.timeMs) : ""}
                </span>
                <span className="w-14 text-right font-extrabold tabular-nums text-white">
                  {e.score.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}
        {daily.yourRank !== null && (
          <p className="m-0 mt-1.5 text-[12.5px] font-bold text-[#2EC4B6]">
            {s("yourRank")}: #{daily.yourRank} · {daily.dailyBest?.toLocaleString()}
          </p>
        )}
        <p className="m-0 mt-2 text-[12px] font-semibold leading-snug text-[#9FB0E8]">
          {daily.isGuest ? s("guestDaily") : s("seedNote")}
        </p>
      </div>
    </>
  );
}

function HowTab({ s }: { s: DictFn }) {
  const rules = t(LANG, "howRules");
  void s;
  return (
    <ul className="m-0 list-none space-y-2.5">
      {rules.map((rule) => (
        <li key={rule.title} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#FFC93C]">
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M8 1.5 9.9 6l4.6.3-3.5 3 1.1 4.5L8 11.2l-4.1 2.6 1.1-4.5-3.5-3L6.1 6z"
                fill="currentColor"
              />
            </svg>
          </span>
          <div>
            <p className="m-0 text-[13px] font-extrabold text-white">{rule.title}</p>
            <p className="m-0 mt-0.5 text-[12.5px] font-semibold leading-snug text-[#C7CCEA]">{rule.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ScoresTab({
  s,
  top,
  globalTop,
  user,
}: {
  s: DictFn;
  top: ScoreEntry[];
  globalTop: ScoreEntry[];
  user: ApiUser | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="m-0 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#9FB0E8]">En iyi skorun</p>
        {top.length === 0 ? (
          <p className="m-0 mt-1.5 text-[13px] font-semibold text-[#9FB0E8]">{s("noScores")}</p>
        ) : (
          <ol className="m-0 mt-1.5 list-none space-y-1.5">
            {top.slice(0, 5).map((entry, i) => (
              <li
                key={`${entry.at}-${i}`}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5 text-[14px]"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold ${rankBadgeClass(i)}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-bold text-white">{entry.name}</span>
                <span className="text-[11.5px] font-semibold tabular-nums text-[#9FB0E8]">
                  {entry.timeMs > 0 ? formatTime(entry.timeMs) : ""}
                </span>
                <span className="w-16 text-right font-extrabold tabular-nums text-white">
                  {entry.score.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <p className="m-0 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#FFC93C]">
          Sıralama · tüm oyuncular
        </p>
        {globalTop.length === 0 ? (
          <p className="m-0 mt-1.5 text-[13px] font-semibold text-[#9FB0E8]">{s("noBoard")}</p>
        ) : (
          <ol className="m-0 mt-1.5 list-none space-y-1.5">
            {globalTop.slice(0, 10).map((entry, i) => (
              <li
                key={`${entry.at}-${i}`}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[14px] ${
                  user && entry.name === user.username ? "bg-[#FFC93C]/10 ring-1 ring-[#FFC93C]/40" : "bg-white/5"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold ${rankBadgeClass(i)}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-bold text-white">{entry.name}</span>
                <span className="w-16 text-right font-extrabold tabular-nums text-white">
                  {entry.score.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function BadgesTab({ owned }: { owned: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BADGES.map((b) => {
        const has = owned.includes(b.id);
        return (
          <div
            key={b.id}
            className={`rounded-xl p-2.5 ring-1 ${
              has ? "bg-[#FFC93C]/15 ring-[#FFC93C]/50" : "bg-white/5 opacity-70 ring-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  has ? "bg-[#FFC93C] text-[#0F1B3D]" : "bg-white/10 text-[#9FB0E8]"
                }`}
              >
                {has ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                    <path
                      d="M8 1.5 9.9 6l4.6.3-3.5 3 1.1 4.5L8 11.2l-4.1 2.6 1.1-4.5-3.5-3L6.1 6z"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )}
              </span>
              <span className={`text-[12px] font-extrabold leading-tight ${has ? "text-white" : "text-[#9FB0E8]"}`}>
                {b.name}
              </span>
            </div>
            <p className="m-0 mt-1 text-[11.5px] font-semibold leading-snug text-[#9FB0E8]">{b.description}</p>
          </div>
        );
      })}
    </div>
  );
}
