"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameBoard, type GameHandle } from "@/components/game/GameBoard";
import { GameHUD } from "@/components/game/GameHUD";
import { MainMenu } from "@/components/game/MainMenu";
import { GameOverModal } from "@/components/game/GameOverModal";
import { Leaderboard } from "@/components/game/Leaderboard";
import { SplashScreen } from "@/components/game/SplashScreen";
import { MissionStrip } from "@/components/game/MissionStrip";
import { LevelStrip } from "@/components/game/LevelStrip";
import { Mascot, type MascotMood } from "@/components/game/Mascot";
import { AuthModal } from "@/components/game/AuthModal";
import { PowerupBar } from "@/components/game/PowerupBar";
import { initialMissionViews, type MissionView } from "@/lib/game/missions";
import type { ComboEvent, GameStatus } from "@/lib/game/engine";
import type { GameEvent } from "@/lib/game/events";
import { COMBO_RULES } from "@/lib/game/scoreRules";
import {
  emptyUsed,
  initialInventory,
  type PowerupId,
  type PowerupSnapshot,
} from "@/lib/game/powerups";
import { utcDayKey } from "@/lib/game/prng";
import {
  DailyQuestTracker,
  emptyCounters,
  getDailyQuests,
  questProgress,
  type QuestCounters,
} from "@/lib/daily/quests";
import { touchStreak } from "@/lib/daily/streak";
import type { DailyBoardEntry, DailyResultInfo, DailyStateResponse, TouchResult } from "@/lib/daily/types";
import {
  addBank,
  getTouchDayKey,
  loadClaimed,
  loadCounters,
  loadGuestStreak,
  saveClaimed,
  saveCounters,
  saveGuestStreak,
  setTouchDayKey,
  takeBank,
} from "@/lib/daily/local";
import type { DailyQuest } from "@/lib/daily/quests";
import { ProgressTracker } from "@/lib/progress/tracker";
import { mergeProgress } from "@/lib/progress/merge";
import { computeMatchXp, levelForXp } from "@/lib/progress/xp";
import { loadProgress, saveProgress } from "@/lib/progress/local";
import type { ProgressDto, ProgressSyncResult } from "@/lib/progress/api";
import type { ProgressState } from "@/lib/progress/types";
import { ProgressOverlay } from "@/components/game/ProgressOverlay";
import { api, getCachedUser, getToken, setToken, type ApiUser } from "@/lib/api";
import {
  addLifetimeStats,
  loadBest,
  loadOwnedBadges,
  loadTopScores,
  recordScore,
  type ScoreEntry,
} from "@/lib/game/scoring";
import { sfx } from "@/lib/game/sfx";

interface MeResponse {
  user: ApiUser;
  top: ScoreEntry[];
  badges: string[];
}

export default function HomePage() {
  const [booted, setBooted] = useState(false);
  const [splashOut, setSplashOut] = useState(false);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [next, setNext] = useState(2);
  const [missions, setMissions] = useState<MissionView[]>(initialMissionViews);
  const [timerMs, setTimerMs] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [finalTimeMs, setFinalTimeMs] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [top, setTop] = useState<ScoreEntry[]>([]);
  const [globalTop, setGlobalTop] = useState<ScoreEntry[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [badgesAtRunStart, setBadgesAtRunStart] = useState<string[]>([]);
  const [danger, setDanger] = useState(false);
  const [cheering, setCheering] = useState(false);
  const [powerups, setPowerups] = useState<PowerupSnapshot>(() => ({
    inventory: initialInventory(),
    used: emptyUsed(),
    canUndo: false,
    bestCombo: 0,
  }));
  const [combo, setCombo] = useState<ComboEvent | null>(null);
  const comboDeadline = useRef(0);
  const [mode, setMode] = useState<"classic" | "daily">("classic");
  const modeRef = useRef<"classic" | "daily">("classic");
  const [dayKey, setDayKey] = useState("");
  const [questCounters, setQuestCounters] = useState<QuestCounters>(emptyCounters);
  const [dailyMeta, setDailyMeta] = useState<{
    seed: number;
    quests: DailyQuest[];
    board: DailyBoardEntry[];
    claimed: string[];
    streak: number;
    yourRank: number | null;
    dailyBest: number | null;
  } | null>(null);
  const [dailyResult, setDailyResult] = useState<DailyResultInfo | null>(null);
  const [streak, setStreak] = useState(0);
  const trackerRef = useRef<DailyQuestTracker | null>(null);
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [progressOpen, setProgressOpen] = useState(false);
  const [toast, setToast] = useState<{ key: number; name: string; xp: number } | null>(null);
  const [sessionTrophies, setSessionTrophies] = useState<string[]>([]);
  const progressTrackerRef = useRef<ProgressTracker | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const cheerTimer = useRef<number | null>(null);
  const authWasPlaying = useRef(false);
  const gameRef = useRef<GameHandle | null>(null);

  // Splash / loading intro (purely visual, unmounted afterwards)
  useEffect(() => {
    const t1 = window.setTimeout(() => setSplashOut(true), 1500);
    const t2 = window.setTimeout(() => setBooted(true), 2050);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const refreshGlobal = useCallback(() => {
    api<{ entries: ScoreEntry[] }>("/api/leaderboard")
      .then((data) => setGlobalTop(data.entries))
      .catch(() => {
        /* offline — keep what we have */
      });
  }, []);

  useEffect(() => {
    // Hydrate browser-only data (localStorage) once after mount; SSR renders safe defaults.
    setBest(loadBest());
    setTop(loadTopScores());
    setBadges(loadOwnedBadges());
    setMuted(sfx.loadMuted());
    sfx.setMuted(sfx.loadMuted());

    // Restore an existing session: localStorage token or httpOnly cookie
    // (the cookie is how the Google OAuth redirect signs the user in).
    const cached = getCachedUser();
    if (cached) setUser(cached);
    api<MeResponse>("/api/auth/me")
      .then((data) => {
        setUser(data.user);
        setBest(data.user.bestScore);
        setTop(data.top);
        setBadges(data.badges);
      })
      .catch((err) => {
        const status = (err as Error & { status?: number }).status;
        if (status === 401) {
          setUser(null);
          setToken(null);
        }
      });
    api<{ google: boolean }>("/api/auth/config")
      .then((data) => setGoogleEnabled(data.google))
      .catch(() => setGoogleEnabled(false));

    // Daily: day key, quest tracker (persisted counters) and server state.
    const dk = utcDayKey();
    setDayKey(dk);
    const counters = loadCounters(dk);
    setQuestCounters(counters);
    trackerRef.current = new DailyQuestTracker(dk, counters);
    progressTrackerRef.current = new ProgressTracker(loadProgress());
    loadDailyState();

    refreshGlobal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshGlobal]);

  // In-game match timer: ticks twice a second, never per-frame.
  useEffect(() => {
    if (status !== "playing") return;
    const tick = (): void => setTimerMs(gameRef.current?.elapsed() ?? 0);
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [status]);

  const handleScore = useCallback((s: number, b: number) => {
    setScore(s);
    setBest(b);
    if (s > 0) {
      setCheering(true);
      if (cheerTimer.current !== null) window.clearTimeout(cheerTimer.current);
      cheerTimer.current = window.setTimeout(() => setCheering(false), 800);
    }
  }, []);

  const handleNext = useCallback((v: number) => setNext(v), []);

  const handleMissions = useCallback((m: MissionView[]) => setMissions(m), []);
  const handleBadges = useCallback((owned: string[]) => setBadges(owned), []);
  const handleDanger = useCallback((d: boolean) => setDanger(d), []);
  const handlePowerups = useCallback((p: PowerupSnapshot) => setPowerups(p), []);

  const handleCombo = useCallback((c: ComboEvent) => {
    if (c.count >= 2) {
      setCombo(c);
      comboDeadline.current = Date.now() + COMBO_RULES.windowMs;
    } else {
      setCombo(null);
    }
  }, []);

  // Hide the combo chip once its window expires.
  useEffect(() => {
    if (!combo) return;
    const id = window.setInterval(() => {
      if (Date.now() >= comboDeadline.current) setCombo(null);
    }, 200);
    return () => window.clearInterval(id);
  }, [combo]);

  const loadDailyState = useCallback(() => {
    api<DailyStateResponse>("/api/daily/state")
      .then((data) => {
        setDayKey(data.dayKey);
        setDailyMeta({
          seed: data.seed,
          quests: data.quests,
          board: data.board,
          claimed: data.you ? data.you.claimed : loadClaimed(data.dayKey),
          streak: data.you ? data.you.streak : loadGuestStreak().streak,
          yourRank: data.you ? data.you.dailyRank : null,
          dailyBest: data.you ? data.you.dailyBest : null,
        });
      })
      .catch(() => {
        /* offline: daily features stay in local-only mode */
      });
  }, []);

  // Streak touch: once per UTC day (server for accounts, local for guests).
  useEffect(() => {
    if (!dayKey || getTouchDayKey() === dayKey) return;
    if (user) {
      api<TouchResult>("/api/daily/touch", { method: "POST" })
        .then((r) => {
          setStreak(r.streak);
          setTouchDayKey(dayKey);
          if (dailyMeta) setDailyMeta({ ...dailyMeta, streak: r.streak });
        })
        .catch(() => {
          /* offline — streak continues locally next open */
        });
    } else {
      const next = touchStreak(loadGuestStreak(), dayKey);
      saveGuestStreak(next);
      setStreak(next.streak);
      setTouchDayKey(dayKey);
    }
  }, [user, dayKey, dailyMeta]);

  const persistProgress = useCallback(
    (remote?: ProgressDto) => {
      const t = progressTrackerRef.current;
      if (!t) return;
      // "Most advanced wins": merge incoming cloud state before storing.
      if (remote) t.state = mergeProgress(t.state, remote);
      saveProgress(t.state);
      setProgress({ xp: t.state.xp, counters: { ...t.state.counters }, achievements: [...t.state.achievements] });
      if (user) {
        api<ProgressSyncResult>("/api/progress", { method: "POST", body: JSON.stringify(t.state) }).catch(
          () => {
            /* offline — local copy already saved */
          }
        );
      }
    },
    [user]
  );

  const handleGameEvent = useCallback(
    (e: GameEvent) => {
      const t = trackerRef.current;
      if (t) {
        t.handleEvent(e);
        if (dayKey) saveCounters(dayKey, t.counters);
        setQuestCounters({ ...t.counters });
      }
      const pt = progressTrackerRef.current;
      if (!pt) return;
      pt.handleEvent(e);
      const fresh = pt.drainUnlocked();
      if (fresh.length > 0) {
        setSessionTrophies((prev) => [...prev, ...fresh.map((f) => f.id)]);
        const last = fresh[fresh.length - 1];
        setToast({ key: Date.now(), name: last.name, xp: last.rewardXp });
        if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 3600);
        persistProgress();
      }
    },
    [dayKey, persistProgress]
  );

  const claimQuest = useCallback(
    (questId: string) => {
      if (!dayKey) return;
      const quest = getDailyQuests(dayKey).find((q) => q.id === questId);
      if (!quest) return;
      if (user) {
        api<{ reward: { questId: string; powerup: string }; claimed: string[] }>(
          "/api/daily/claim",
          { method: "POST", body: JSON.stringify({ dayKey, questId }) }
        )
          .then((r) => {
            setDailyMeta((m) => (m ? { ...m, claimed: r.claimed } : m));
            addBank({ [r.reward.powerup]: 1 } as Record<string, number>);
          })
          .catch(() => {
            /* double-claim or offline — ignore */
          });
      } else {
        const list = loadClaimed(dayKey);
        if (list.includes(questId)) return;
        saveClaimed(dayKey, [...list, questId]);
        setDailyMeta((m) => (m ? { ...m, claimed: [...list, questId] } : m));
        addBank({ [quest.reward]: 1 } as Record<string, number>);
      }
    },
    [dayKey, user]
  );

  const handleGameOver = useCallback(
    (s: number) => {
      const timeMs = gameRef.current?.elapsed() ?? 0;
      setFinalScore(s);
      setFinalTimeMs(timeMs);

      const totalUsed = Object.values(powerups.used).reduce((a, b) => a + b, 0);
      const isDaily = modeRef.current === "daily";
      if (isDaily) {
        // Daily challenge: guests play but are not recorded.
        const dk = dayKey || utcDayKey();
        if (user) {
          setDailyResult({ dayKey: dk, isGuest: false });
          api<{ dayKey: string; best: number; isNewBest: boolean; rank: number }>(
            "/api/daily/challenge",
            { method: "POST", body: JSON.stringify({ score: s, timeMs }) }
          )
            .then((r) => {
              setDailyResult({
                dayKey: r.dayKey,
                isGuest: false,
                rank: r.rank,
                best: r.best,
                isNewBest: r.isNewBest,
              });
              loadDailyState();
            })
            .catch(() => setDailyResult({ dayKey: dk, isGuest: false, error: true }));
        } else {
          setDailyResult({ dayKey: dk, isGuest: true });
        }
      }
      if (!isDaily && user) {
        // Signed in: persist the run (score, time, power-ups, combo) to the account.
        api<{ best: number; isNewBest: boolean; top: ScoreEntry[] }>("/api/scores", {
          method: "POST",
          body: JSON.stringify({ score: s, timeMs, powerupsUsed: totalUsed, bestCombo: powerups.bestCombo }),
        })
          .then((r) => {
            setBest(r.best);
            setIsNewBest(r.isNewBest);
            setTop(r.top);
          })
          .catch(() => {
            const local = recordScore(s, timeMs, user.username);
            setBest(local.best);
            setIsNewBest(local.isNewBest);
            setTop(local.top);
          });
        const earned = badges.filter((b) => !badgesAtRunStart.includes(b));
        if (earned.length > 0) {
          api<{ owned: string[] }>("/api/badges", {
            method: "POST",
            body: JSON.stringify({ badges: earned }),
          })
            .then((r) => setBadges(r.owned))
            .catch(() => {
              /* local copy already saved by the engine */
            });
        }
        refreshGlobal();
      } else {
        // Guest: keep progress (incl. power-up stats) in this browser.
        const local = recordScore(s, timeMs, "Player");
        addLifetimeStats(totalUsed, powerups.bestCombo);
        setBest(local.best);
        setIsNewBest(local.isNewBest);
        setTop(local.top);
      }
      // Match XP (score + combo bonus + daily bonus) on top of achievement XP.
      const pt = progressTrackerRef.current;
      if (pt) {
        pt.addXp(computeMatchXp({ score: s, maxCombo: pt.state.counters.maxCombo, isDaily: isDaily }));
        persistProgress();
      }
      setCombo(null);
      setStatus("over");
    },
    [user, badges, badgesAtRunStart, powerups, refreshGlobal, dayKey, loadDailyState, persistProgress]
  );

  const beginRun = useCallback(
    (runMode: "classic" | "daily", seed?: number) => {
      sfx.unlock();
      const bonus = takeBank(); // quest rewards apply to this match
      if (runMode === "daily" && seed !== undefined) {
        gameRef.current?.startDaily(seed, bonus);
      } else {
        gameRef.current?.start(bonus);
      }
      modeRef.current = runMode;
      setMode(runMode);
      setTimerMs(0);
      setBadgesAtRunStart(badges);
      setDanger(false);
      setCheering(false);
      setDailyResult(null);
      setSessionTrophies([]);
      setToast(null);
      setStatus("playing");
    },
    [badges]
  );

  const startGame = useCallback(() => beginRun("classic"), [beginRun]);

  const startDaily = useCallback(() => {
    if (dailyMeta) beginRun("daily", dailyMeta.seed);
  }, [beginRun, dailyMeta]);

  const togglePause = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    if (game.status() === "playing") {
      game.pause();
      setStatus("paused");
    } else if (game.status() === "paused") {
      game.resume();
      setStatus("playing");
    }
  }, []);

  const goMenu = useCallback(() => {
    gameRef.current?.toMenu();
    setStatus("idle");
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      sfx.setMuted(!m);
      return !m;
    });
  }, []);

  const scrollToLeaderboard = useCallback(() => {
    document.getElementById("leaderboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const usePowerup = useCallback((id: PowerupId) => {
    const g = gameRef.current;
    if (!g) return;
    if (id === "joker") g.dropJoker();
    else if (id === "bomb") g.dropBomb();
    else if (id === "scramble") g.scramblePile();
    else g.undoDrop();
  }, []);

  // ---- account -----------------------------------------------------------

  const openAuth = useCallback(() => {
    const st = gameRef.current?.status();
    authWasPlaying.current = st === "playing";
    if (st === "playing") {
      gameRef.current?.pause();
      setStatus("paused");
    }
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    if (authWasPlaying.current) {
      gameRef.current?.resume();
      setStatus("playing");
    }
    authWasPlaying.current = false;
  }, []);

  const handleAuthed = useCallback((u: ApiUser) => {
    setUser(u);
    setBest(u.bestScore);
    api<MeResponse>("/api/auth/me")
      .then((data) => {
        setUser(data.user);
        setBest(data.user.bestScore);
        setTop(data.top);
        setBadges(data.badges);
      })
      .catch(() => {
        /* keep the partial profile from the login response */
      });
    // Cloud merge on sign-in: "most advanced wins" (documented in PROGRESS.md).
    api<ProgressDto>("/api/progress")
      .then((remote) => persistProgress(remote))
      .catch(() => {
        /* offline — keep local progress */
      });
  }, [persistProgress]);

  const handleSignedOut = useCallback(() => {
    setUser(null);
    setTop(loadTopScores());
    setBadges(loadOwnedBadges());
    setBest(loadBest());
  }, []);

  const newBadges = badges.filter((b) => !badgesAtRunStart.includes(b));
  const lvlInfo = levelForXp(progress.xp);
  const mood: MascotMood =
    status === "paused"
      ? "sleep"
      : status === "over"
        ? isNewBest
          ? "cheer"
          : "sad"
        : danger
          ? "worried"
          : cheering
            ? "cheer"
            : "happy";

  return (
    <>
      {!booted && (
        <div
          className={`fixed inset-0 z-50 ${splashOut ? "splash-out" : ""}`}
          aria-hidden={splashOut || undefined}
        >
          <SplashScreen />
        </div>
      )}

      <main className="safe-area-main mx-auto flex min-h-dvh w-full max-w-[600px] flex-col gap-4">
        <header className="mx-auto flex w-full max-w-[560px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFC93C] shadow-[0_3px_0_#D9A406]">
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M8.5 3.5 3 6l1.5 4 2-1v9.5h11V9l2 1L21 6l-5.5-2.5a4.5 4.5 0 0 1-7 0Z"
                  fill="none"
                  stroke="#0F1B3D"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M10 11h4M10 14h4" stroke="#0F1B3D" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="m-0 font-display text-[22px] leading-none tracking-tight text-white">
                JERSEY MERGE
              </h1>
              <p className="m-0 mt-1 text-xs font-semibold text-[#9FB0E8]">Merge the kit up to level 11</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              title={`Player level ${lvlInfo.level} · ${progress.xp.toLocaleString()} XP`}
              className="hidden h-11 items-center gap-1.5 rounded-xl bg-[#1B2450] px-2.5 ring-1 ring-white/10 min-[380px]:flex"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" className="text-[#FFC93C]" aria-hidden="true">
                <path d="M8 1.5 9.9 6l4.6.3-3.5 3 1.1 4.5L8 11.2l-4.1 2.6 1.1-4.5-3.5-3L6.1 6z" fill="currentColor" />
              </svg>
              <span className="text-xs font-extrabold tabular-nums text-white">{lvlInfo.level}</span>
              <span className="h-1.5 w-9 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full bg-[#FFC93C]"
                  style={{ width: `${Math.round(lvlInfo.pct * 100)}%` }}
                />
              </span>
            </span>
            {streak > 0 && (
              <span
                title={`${streak} day login streak (resets if a UTC day is missed)`}
                className="flex h-11 items-center gap-1 rounded-xl bg-[#1B2450] px-2.5 ring-1 ring-white/10"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" className="text-orange-400" aria-hidden="true">
                  <path
                    d="M8 1c1 2.5 4 3.8 4 7a4 4 0 0 1-8 0c0-1.6.7-2.7 1.6-3.7C6.3 5.6 7 6.5 7.4 7.2 7.6 5.4 7.4 3 8 1Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-xs font-extrabold tabular-nums text-white">{streak}</span>
              </span>
            )}
            <button
              type="button"
              onClick={openAuth}
              aria-label={user ? `Account: ${user.username}` : "Sign in or create account"}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#1B2450] px-2.5 text-white ring-1 ring-white/10 transition hover:bg-[#232E63] active:scale-95"
            >
              {user ? (
                <>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2EC4B6] text-[12px] font-extrabold text-[#0F1B3D]">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[80px] truncate text-xs font-extrabold text-white">{user.username}</span>
                </>
              ) : (
                <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <path
                    d="M2.5 14c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setProgressOpen(true)}
              aria-label="Open my club: kit collection and achievements"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B2450] text-white ring-1 ring-white/10 transition hover:bg-[#232E63] active:scale-95"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M4 2h8v2a4 4 0 0 1-8 0V2ZM4 3H1.5v.5A3.5 3.5 0 0 0 5 7m7-4h2.5v.5A3.5 3.5 0 0 1 11 7m-4.5 3.5h3V13h-3m-1 0h5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={scrollToLeaderboard}
              aria-label="View leaderboard"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B2450] text-white ring-1 ring-white/10 transition hover:bg-[#232E63] active:scale-95"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M4 2h8v2a4 4 0 0 1-8 0V2ZM4 3H1.5v.5A3.5 3.5 0 0 0 5 7m7-4h2.5v.5A3.5 3.5 0 0 1 11 7m-4.5 3.5h3V13h-3m-1 0h5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              aria-pressed={muted}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B2450] text-white ring-1 ring-white/10 transition hover:bg-[#232E63] active:scale-95"
            >
              {muted ? (
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M3 8v4h3l4 3.5v-11L6 8H3Z" fill="currentColor" />
                  <path d="m13.5 8 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M3 8v4h3l4 3.5v-11L6 8H3Z" fill="currentColor" />
                  <path
                    d="M13.5 7.5a4 4 0 0 1 0 5M15.5 5.5a7 7 0 0 1 0 9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="game-layout">
          <div className="layout-left">
            <GameHUD score={score} best={best} next={next} timeMs={timerMs} />

            <LevelStrip
              score={score}
              modeLabel={mode === "daily" && dayKey ? `DAILY ${dayKey.slice(5)}` : undefined}
            />
          </div>

          <section className="layout-board rounded-2xl bg-[#1B2450]/50 p-2.5 ring-1 ring-white/10 sm:p-3">
          <GameBoard
            gameRef={gameRef}
            onScore={handleScore}
            onNext={handleNext}
            onGameOver={handleGameOver}
            onMissions={handleMissions}
            onBadges={handleBadges}
            onDanger={handleDanger}
            onPowerups={handlePowerups}
            onCombo={handleCombo}
            onGameEvent={handleGameEvent}
          >
            <Mascot mood={mood} />
            {combo && combo.count >= 2 && (
              <div className="pointer-events-none absolute left-2 top-2 z-[5] rounded-full bg-[#101d42]/85 px-3 py-1 shadow-lg">
                <span className="font-display text-sm tracking-wide text-amber-300">
                  COMBO ×{combo.count}
                  <span className="ml-1.5 text-xs font-bold text-white">{combo.multiplier}× puan</span>
                </span>
              </div>
            )}
            {status === "idle" && (
              <MainMenu
                best={best}
                top={top}
                missions={missions}
                ownedBadges={badges}
                user={user}
                daily={{
                  dayKey,
                  seed: dailyMeta?.seed ?? 0,
                  quests: dailyMeta?.quests ?? [],
                  board: dailyMeta?.board ?? [],
                  streak: dailyMeta?.streak ?? streak,
                  claimed: dailyMeta?.claimed ?? loadClaimed(dayKey),
                  progress: Object.fromEntries(
                    (dailyMeta?.quests ?? []).map((q) => [q.id, questProgress(q, questCounters)])
                  ),
                  isGuest: !user,
                  yourRank: dailyMeta?.yourRank ?? null,
                  dailyBest: dailyMeta?.dailyBest ?? null,
                }}
                onOpenAuth={openAuth}
                onPlay={startGame}
                onPlayDaily={startDaily}
                onClaimQuest={claimQuest}
              />
            )}
            {status === "paused" && <PauseOverlay onResume={togglePause} onRestart={startGame} onMenu={goMenu} />}
            {status === "over" && (
              <GameOverModal
                score={finalScore}
                best={best}
                timeMs={finalTimeMs}
                isNewBest={isNewBest}
                top={top}
                newBadges={newBadges}
                newTrophies={sessionTrophies}
                daily={dailyResult}
                onPlayAgain={startGame}
                onMenu={goMenu}
              />
            )}
          </GameBoard>
          </section>

          <div className="layout-right">
            {status !== "idle" && <MissionStrip missions={missions} />}

            <PowerupBar
              snapshot={powerups}
              canPlay={status === "playing"}
              onUse={usePowerup}
            />

            <div className="controls-row flex gap-2">
              <button
                type="button"
                onClick={togglePause}
                disabled={status !== "playing" && status !== "paused"}
                className="min-h-[44px] flex-1 rounded-xl bg-[#FFC93C] px-4 py-2.5 text-sm font-extrabold text-[#0F1B3D] shadow-[0_4px_0_#D9A406] transition hover:bg-[#FFD76A] active:translate-y-[2px] active:shadow-[0_2px_0_#D9A406] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
              >
                {status === "paused" ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                onClick={startGame}
                disabled={status === "idle"}
                className="min-h-[44px] flex-1 rounded-xl bg-[#1B2450] px-4 py-2.5 text-sm font-extrabold text-white ring-1 ring-white/15 transition hover:bg-[#232E63] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Restart
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[520px]">
          <Leaderboard entries={globalTop} highlightName={user?.username ?? null} />

          <section className="rounded-2xl bg-[#1B2450]/50 p-4 ring-1 ring-white/10">
            <h2 className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9FB0E8]">How to play</h2>
            <ul className="m-0 mt-2.5 list-none space-y-2 text-[13px] font-medium leading-snug text-[#C7CCEA]">
              <li>
                <span className="font-bold text-white">Drop:</span> move with your mouse, finger or the arrow
                keys, then click, tap or press Space.
              </li>
              <li>
                <span className="font-bold text-white">Merge:</span> two identical jerseys become the next
                level — 1 + 1 = 2, 2 + 2 = 4, up to the golden level 11.
              </li>
              <li>
                <span className="font-bold text-white">Danger:</span> a resting jersey above the red line ends
                the match after a short grace period.
              </li>
              <li>
                <span className="font-bold text-white">Power-ups:</span> Joker merges with anything it touches,
                Bomb clears an area, Scramble shuffles the pile, Undo takes back your last drop. Keys J / B / K / Z.
              </li>
              <li>
                <span className="font-bold text-white">Combo:</span> chain merges within 1.5s for up to a 2×
                score multiplier.
              </li>
            </ul>
            <p className="m-0 mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-[11px] font-semibold text-[#9FB0E8]">
              <span>
                <Kbd>Space</Kbd> drop
              </span>
              <span>
                <Kbd>←</Kbd> <Kbd>→</Kbd> aim
              </span>
              <span>
                <Kbd>P</Kbd> pause
              </span>
              <span>
                <Kbd>R</Kbd> restart
              </span>
              <span>
                <Kbd>J</Kbd><Kbd>B</Kbd><Kbd>K</Kbd><Kbd>Z</Kbd> power-ups
              </span>
            </p>
          </section>

          <footer className="pb-1 text-center text-[11px] font-medium text-[#8B97C9]">
            Physics by Matter.js · Sign in to keep your progress on your account
          </footer>
        </div>
      </main>

      {authOpen && (
        <AuthModal
          user={user}
          googleEnabled={googleEnabled}
          onClose={closeAuth}
          onAuthed={handleAuthed}
          onSignedOut={handleSignedOut}
        />
      )}

      {progressOpen && <ProgressOverlay progress={progress} onClose={() => setProgressOpen(false)} />}

      {/* Accessible achievement toast (screen readers announce via aria-live). */}
      <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-4 left-1/2 z-[60] -translate-x-1/2">
        {toast && (
          <div
            key={toast.key}
            className="toast-card flex items-center gap-2.5 rounded-2xl bg-[#101d42] px-4 py-2.5 text-white shadow-2xl ring-1 ring-amber-300/60"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" className="shrink-0 text-amber-300" aria-hidden="true">
              <path
                d="M4 2h8v2a4 4 0 0 1-8 0V2ZM4 3H1.5v.5A3.5 3.5 0 0 0 5 7m7-4h2.5v.5A3.5 3.5 0 0 1 11 7m-4.5 3.5h3V13h-3m-1 0h5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              <span className="block text-[9px] font-extrabold uppercase tracking-[0.18em] text-amber-300">
                Trophy unlocked
              </span>
              <span className="block text-[13px] font-extrabold leading-tight">
                {toast.name} <span className="text-amber-300">+{toast.xp} XP</span>
              </span>
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5 font-sans text-[10px] text-[#C7CCEA]">
      {children}
    </kbd>
  );
}

function PauseOverlay({ onResume, onRestart, onMenu }: { onResume: () => void; onRestart: () => void; onMenu: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0B1229]/70 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paused"
        className="w-[240px] rounded-2xl bg-[#16204A] p-6 text-center text-white shadow-2xl ring-1 ring-white/10"
      >
        <h2 className="m-0 font-display text-2xl tracking-tight text-white">PAUSED</h2>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onResume}
            autoFocus
            className="min-h-[48px] rounded-xl bg-[#FFC93C] px-5 py-2.5 font-display tracking-wide text-[#0F1B3D] transition hover:bg-[#FFD76A] active:scale-[0.98]"
          >
            RESUME
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-semibold text-[#C7CCEA] ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white active:scale-[0.98]"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="min-h-[40px] rounded-xl px-5 py-2 text-sm font-semibold text-[#9FB0E8] transition hover:text-white active:scale-[0.98]"
          >
            Main menu
          </button>
        </div>
      </div>
    </div>
  );
}
