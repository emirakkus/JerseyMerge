"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameBoard, type GameHandle } from "@/components/game/GameBoard";
import { GameHUD } from "@/components/game/GameHUD";
import { MainMenu } from "@/components/game/MainMenu";
import { GameOverModal } from "@/components/game/GameOverModal";
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
  getSimpleDailyQuests,
  questProgress,
  type QuestCounters,
} from "@/lib/daily/quests";
import { touchStreak } from "@/lib/daily/streak";
import type { DailyBoardEntry, DailyResultInfo, DailyStateResponse, TouchResult } from "@/lib/daily/types";
import {
  addBank,
  getTouchDayKey,
  loadBank,
  loadClaimed,
  loadCounters,
  loadGuestStreak,
  saveClaimed,
  saveBank,
  saveCounters,
  saveGuestStreak,
  setTouchDayKey,
} from "@/lib/daily/local";
import type { DailyQuest } from "@/lib/daily/quests";
import { ProgressTracker } from "@/lib/progress/tracker";
import { mergeProgress } from "@/lib/progress/merge";
import { computeMatchXp, levelForXp } from "@/lib/progress/xp";
import { loadProgress, saveProgress } from "@/lib/progress/local";
import type { ProgressDto, ProgressSyncResult } from "@/lib/progress/api";
import type { ProgressState } from "@/lib/progress/types";
import { emptyProgress } from "@/lib/progress/types";
import { ProgressOverlay } from "@/components/game/ProgressOverlay";
import { LeaderboardModal } from "@/components/game/LeaderboardModal";
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
import { GAME_UI } from "@/lib/i18n";
import { JerseySprite } from "@/components/game/JerseySprite";
import { EvolutionStrip } from "@/components/game/EvolutionStrip";
import { loadHapticsEnabled, setHapticsEnabled } from "@/lib/game/haptics";
import { decodeChallengeCode, randomChallengeSeed, type FriendChallenge } from "@/lib/game/friendChallenge";

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
  const [upcoming, setUpcoming] = useState(4);
  const [following, setFollowing] = useState(8);
  const [highestReached, setHighestReached] = useState(2);
  const [missions, setMissions] = useState<MissionView[]>(initialMissionViews);
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
  const [mode, setMode] = useState<"classic" | "daily" | "challenge">("classic");
  const modeRef = useRef<"classic" | "daily" | "challenge">("classic");
  const [dayKey, setDayKey] = useState("");
  const [dailyPlayedScore, setDailyPlayedScore] = useState<number | null>(null);
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
  const [challengeInvite, setChallengeInvite] = useState<FriendChallenge | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<FriendChallenge | null>(null);
  const runMaxValue = useRef(2);
  const runSeed = useRef(0);
  const [streak, setStreak] = useState(0);
  const trackerRef = useRef<DailyQuestTracker | null>(null);
  // Keep SSR and the first browser render identical; restore local progress after hydration.
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [progressOpen, setProgressOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [toast, setToast] = useState<{ key: number; name: string; xp: number } | null>(null);
  const [sessionTrophies, setSessionTrophies] = useState<string[]>([]);
  const progressTrackerRef = useRef<ProgressTracker | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [musicEnabled, setMusicEnabledState] = useState(false);
  const [hapticsEnabled, setHapticsState] = useState(true);
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

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("c");
    if (!code) return;
    const challenge = decodeChallengeCode(code);
    if (challenge) setChallengeInvite(challenge);
    url.searchParams.delete("c");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
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
    setProgress(loadProgress());
    setTop(loadTopScores());
    setBadges(loadOwnedBadges());
    setMuted(sfx.loadMuted());
    sfx.setMuted(sfx.loadMuted());
    const musicOn = sfx.loadMusicEnabled();
    setMusicEnabledState(musicOn);
    sfx.setMusicEnabled(musicOn);
    const hapticsOn = loadHapticsEnabled();
    setHapticsState(hapticsOn);
    setHapticsEnabled(hapticsOn);

    // Restore an existing session: localStorage token or httpOnly cookie
    // (the cookie is how the Google OAuth redirect signs the user in).
    const cached = getCachedUser();
    if (cached) setUser(cached);
    setPowerups((p) => ({ ...p, inventory: { ...p.inventory, ...loadBank() } }));
    api<{ stock: { joker: number; bomb: number; scramble: number } }>("/api/powerups")
      .then(({ stock }) => {
        saveBank(stock);
        setPowerups((p) => ({ ...p, inventory: { ...p.inventory, ...stock } }));
      })
      .catch(() => {});
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

    // Simple daily quests: fixed set, same for everyone, every day.
    setDailyMeta((m) => ({
      seed: m?.seed ?? 0,
      quests: getSimpleDailyQuests(),
      board: m?.board ?? [],
      claimed: m?.claimed ?? loadClaimed(dk),
      streak: m?.streak ?? loadGuestStreak().streak,
      yourRank: m?.yourRank ?? null,
      dailyBest: m?.dailyBest ?? null,
    }));

    refreshGlobal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshGlobal]);

  const handleScore = useCallback((s: number, b: number) => {
    setScore(s);
    setBest(b);
    if (modeRef.current === "daily") {
      const dk = dayKey || utcDayKey();
      setDailyPlayedScore((current) => Math.max(current ?? 0, s));
      try {
        const raw = window.localStorage.getItem("jersey-merge.daily-played");
        const saved = raw ? JSON.parse(raw) as { dayKey?: string; score?: number } : null;
        const previous = saved?.dayKey === dk && typeof saved.score === "number" ? saved.score : 0;
        window.localStorage.setItem("jersey-merge.daily-played", JSON.stringify({ dayKey: dk, score: Math.max(previous, s) }));
      } catch { /* storage may be unavailable */ }
    }
    if (s > 0) {
      setCheering(true);
      if (cheerTimer.current !== null) window.clearTimeout(cheerTimer.current);
      cheerTimer.current = window.setTimeout(() => setCheering(false), 800);
    }
  }, [dayKey]);

  const handleNext = useCallback((v: number) => setNext(v), []);
  const handleUpcoming = useCallback((v: number) => setUpcoming(v), []);
  const handleFollowing = useCallback((v: number) => setFollowing(v), []);

  const handleMissions = useCallback((m: MissionView[]) => setMissions(m), []);
  const handleBadges = useCallback((owned: string[]) => setBadges(owned), []);
  const handleDanger = useCallback((d: boolean) => setDanger(d), []);
  const handlePowerups = useCallback((p: PowerupSnapshot) => {
    setPowerups(p);
    if (modeRef.current !== "challenge" && (status === "playing" || status === "over")) {
      const stock = saveBank({ joker: p.inventory.joker, bomb: p.inventory.bomb, scramble: p.inventory.scramble });
      if (user) api("/api/powerups", { method: "PUT", body: JSON.stringify({ stock }) }).catch(() => {});
    }
  }, [status, user]);

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
    const localDayKey = utcDayKey();
    // Restore this browser's completion independently of the account/leaderboard API.
    // A database outage must not make a finished local daily run look unplayed.
    try {
      const saved = JSON.parse(window.localStorage.getItem("jersey-merge.daily-played") ?? "null") as { dayKey?: string; score?: number } | null;
      setDailyPlayedScore(saved?.dayKey === localDayKey && typeof saved.score === "number" ? saved.score : null);
    } catch { setDailyPlayedScore(null); }
    api<DailyStateResponse>("/api/daily/state")
      .then((data) => {
        setDayKey(data.dayKey);
        try {
          const saved = JSON.parse(window.localStorage.getItem("jersey-merge.daily-played") ?? "null") as { dayKey?: string; score?: number } | null;
          setDailyPlayedScore(saved?.dayKey === data.dayKey && typeof saved.score === "number" ? saved.score : null);
        } catch { setDailyPlayedScore(null); }
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
      setProgress({ xp: t.state.xp, counters: { ...t.state.counters }, achievements: [...t.state.achievements], skins: [...t.state.skins] });
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
      if (modeRef.current === "challenge") {
        if (e.type === "merge") {
          runMaxValue.current = Math.max(runMaxValue.current, e.value);
          setHighestReached((current) => Math.max(current, e.value));
        }
        return;
      }
      if (e.type === "merge") {
        runMaxValue.current = Math.max(runMaxValue.current, e.value);
        setHighestReached((current) => Math.max(current, e.value));
      }
      const t = trackerRef.current;
      if (t) {
        t.handleEvent(e);
        if (dayKey) saveCounters(dayKey, t.counters);
        setQuestCounters({ ...t.counters });
      }
      const pt = progressTrackerRef.current;
      if (!pt) return;
      pt.handleEvent(e);
      // Collection points: 1 point per merge, 5 per new trophy.
      if (e.type === "merge") {
        const c = pt.state.counters;
        c.collectionPoints += 1;
      }
      const fresh = pt.drainUnlocked();
      if (fresh.length > 0) {
        setSessionTrophies((prev) => [...prev, ...fresh.map((f) => f.id)]);
        const last = fresh[fresh.length - 1];
        setToast({ key: Date.now(), name: last.name, xp: last.rewardXp });
        if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 3600);
        pt.state.counters.collectionPoints += 5 * fresh.length;
        persistProgress();
      }
      // Daily match counter increments on gameover.
      if (e.type === "gameover") {
        const c = (trackerRef.current as DailyQuestTracker).counters;
        c.matches += 1;
        if (dayKey) saveCounters(dayKey, c);
        setQuestCounters({ ...c });
      }
    },
    [dayKey, persistProgress]
  );

  const claimQuest = useCallback(
    (questId: string) => {
      if (!dayKey) return;
      // The menu can show the fixed fallback quests before daily metadata loads.
      // Resolve claims from the same list the menu renders so those rewards work too.
      const visibleQuests = dailyMeta?.quests ?? getSimpleDailyQuests();
      const quest = visibleQuests.find((q) => q.id === questId);
      if (!quest) return;
      if (user) {
        api<{ reward: { questId: string; powerup: string }; claimed: string[]; stock?: { joker: number; bomb: number; scramble: number } }>(
          "/api/daily/claim",
          { method: "POST", body: JSON.stringify({ dayKey, questId }) }
        )
          .then((r) => {
            setDailyMeta((m) => (m ? { ...m, claimed: r.claimed } : m));
            if (r.stock) {
              saveBank(r.stock);
              setPowerups((p) => ({ ...p, inventory: { ...p.inventory, ...r.stock } }));
            } else addBank({ [r.reward.powerup]: 1 } as Record<string, number>);
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
        const stock = loadBank();
        setPowerups((p) => ({ ...p, inventory: { ...p.inventory, ...stock } }));
      }
    },
    [dailyMeta?.quests, dayKey, user]
  );

  const handleGameOver = useCallback(
    (s: number) => {
      const timeMs = gameRef.current?.elapsed() ?? 0;
      setFinalScore(s);
      setFinalTimeMs(timeMs);

      const totalUsed = Object.values(powerups.used).reduce((a, b) => a + b, 0);
      const isDaily = modeRef.current === "daily";
      const isChallenge = modeRef.current === "challenge";
      if (isDaily) {
        // Daily challenge: guests play but are not recorded.
        const dk = dayKey || utcDayKey();
        const savedScore = dailyPlayedScore ?? 0;
        const recordedScore = Math.max(savedScore, s);
        setDailyPlayedScore(recordedScore);
        try { window.localStorage.setItem("jersey-merge.daily-played", JSON.stringify({ dayKey: dk, score: recordedScore })); } catch { /* storage may be unavailable */ }
        if (user) {
          setDailyResult({ dayKey: dk, isGuest: false, maxValue: runMaxValue.current, streak });
          api<{ dayKey: string; best: number; isNewBest: boolean; rank: number }>(
            "/api/daily/challenge",
            { method: "POST", body: JSON.stringify({ score: s, timeMs, dayKey: dk, seed: dailyMeta?.seed }) }
          )
            .then((r) => {
              setDailyResult({
                dayKey: r.dayKey,
                isGuest: false,
                rank: r.rank,
                best: r.best,
                isNewBest: r.isNewBest,
                maxValue: runMaxValue.current,
                streak,
              });
              loadDailyState();
            })
            .catch(() => setDailyResult({ dayKey: dk, isGuest: false, error: true, maxValue: runMaxValue.current, streak }));
        } else {
          setDailyResult({ dayKey: dk, isGuest: true, maxValue: runMaxValue.current, streak });
        }
      }
      if (!isDaily && !isChallenge && user) {
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
      } else if (!isDaily && !isChallenge) {
        // Guest: keep progress (incl. power-up stats) in this browser.
        const local = recordScore(s, timeMs, "Player");
        addLifetimeStats(totalUsed, powerups.bestCombo);
        setBest(local.best);
        setIsNewBest(local.isNewBest);
        setTop(local.top);
      }
      // Match XP (score + combo bonus + daily bonus) on top of achievement XP.
      const pt = progressTrackerRef.current;
      if (pt && !isChallenge) {
        pt.addXp(computeMatchXp({ score: s, maxCombo: pt.state.counters.maxCombo, isDaily: isDaily }));
        persistProgress();
      }
      setCombo(null);
      setStatus("over");
    },
    [user, badges, badgesAtRunStart, powerups, refreshGlobal, dayKey, loadDailyState, persistProgress, dailyMeta, questCounters, streak, dailyPlayedScore]
  );

  const beginRun = useCallback(
    (runMode: "classic" | "daily" | "challenge", seed?: number, challenge?: FriendChallenge) => {
      sfx.unlock();
      const seedForRun = seed ?? randomChallengeSeed();
      runSeed.current = seedForRun;
      modeRef.current = runMode;
      runMaxValue.current = 2;
      setHighestReached(2);
      const bonus = loadBank();
      setActiveChallenge(runMode === "challenge" ? challenge ?? null : null);
      setChallengeInvite(null);
      setIsNewBest(false);
      if (runMode === "daily") {
        gameRef.current?.startDaily(seedForRun, bonus);
      } else if (runMode === "challenge") {
        gameRef.current?.startChallenge(seedForRun);
      } else {
        gameRef.current?.start(bonus, seedForRun);
      }
      setMode(runMode);
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

  const startChallenge = useCallback((challenge: FriendChallenge) => {
    beginRun("challenge", challenge.seed, challenge);
  }, [beginRun]);

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

  const toggleMusic = useCallback(() => {
    setMusicEnabledState((enabled) => {
      sfx.setMusicEnabled(!enabled);
      return !enabled;
    });
  }, []);

  const toggleFeedback = useCallback(() => {
    const enabled = muted && !hapticsEnabled;
    setMuted(!enabled);
    sfx.setMuted(!enabled);
    setHapticsState(enabled);
    setHapticsEnabled(enabled);
  }, [hapticsEnabled, muted]);

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

      <main
        data-game-status={status}
        className="game-main safe-area-main mx-auto flex min-h-dvh w-full max-w-[600px] flex-col gap-3.5 min-[900px]:max-w-[840px]"
      >
        {status !== "idle" && <header className="game-topbar">
          <button className="game-menu-button" type="button" onClick={() => status === "over" ? goMenu() : togglePause()} aria-label={status === "playing" ? GAME_UI.pause : status === "paused" ? GAME_UI.resume : GAME_UI.mainMenu}>
            {status === "over" ? <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> : <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4v12M13 4v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>}
          </button>
          <GameHUD score={score} best={best} targetScore={mode === "challenge" ? activeChallenge?.score : undefined} />
          <button className="game-feedback-button" type="button" onClick={toggleFeedback}
            aria-label={muted && !hapticsEnabled ? GAME_UI.feedbackEnabled : GAME_UI.feedbackDisabled}
            aria-pressed={!muted || hapticsEnabled}
            title={muted && !hapticsEnabled ? GAME_UI.feedbackEnabled : GAME_UI.feedbackDisabled}>
            {muted && !hapticsEnabled ? "◌" : "♫"}
          </button>
        </header>}
        <header className="menu-header mx-auto flex w-full max-w-[560px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div aria-label={GAME_UI.title} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFC93C] shadow-[0_3px_0_#D9A406]">
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
          </div>
          <div className="flex items-center gap-2">
            <span
              title={`${GAME_UI.levelShort} ${lvlInfo.level} · ${progress.xp.toLocaleString()} XP`}
              className="hidden h-12 items-center gap-1.5 rounded-xl bg-[#1B2450] px-2.5 ring-1 ring-white/10 min-[380px]:flex"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" className="text-[#FFC93C]" aria-hidden="true">
                <path d="M8 1.5 9.9 6l4.6.3-3.5 3 1.1 4.5L8 11.2l-4.1 2.6 1.1-4.5-3.5-3L6.1 6z" fill="currentColor" />
              </svg>
              <span className="text-[10px] font-extrabold text-[#C7CCEA]">{GAME_UI.levelShort}</span>
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
                title={GAME_UI.streakTooltip(streak)}
                className="flex h-12 items-center gap-1 rounded-xl bg-[#1B2450] px-2.5 ring-1 ring-white/10"
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
              aria-label={user ? `${GAME_UI.profile}: ${user.username}` : GAME_UI.signInOrRegister}
              title={user ? `${GAME_UI.profile}: ${user.username}` : GAME_UI.signInOrRegister}
              className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#1B2450] px-2.5 text-white ring-1 ring-white/10 transition hover:bg-[#232E63] active:scale-95"
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
              aria-label={GAME_UI.collectionTooltip}
              title={GAME_UI.collectionTooltip}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B2450] text-white ring-1 ring-white/10 transition hover:bg-[#232E63] active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M8 9 6 17l4-2 4 2-2-8M5 3 3 4.5 4 7M15 3l2 1.5L16 7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardOpen(true)}
              aria-label={GAME_UI.leaderboard}
              title={GAME_UI.leaderboard}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B2450] text-white ring-1 ring-white/10 transition hover:bg-[#232E63] active:scale-95"
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
              aria-label={muted ? GAME_UI.soundOn : GAME_UI.soundOff}
              title={muted ? GAME_UI.soundOn : GAME_UI.soundOff}
              aria-pressed={muted}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B2450] text-white ring-1 ring-white/10 transition hover:bg-[#232E63] active:scale-95"
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
            <div className="game-rank-row">
              <LevelStrip
                score={score}
                modeLabel={mode === "daily" && dayKey ? `${GAME_UI.dailyLabel} ${dayKey.slice(5)}` : undefined}
              />
              {(status === "playing" || status === "paused") && (
                <div className="next-pieces-box" aria-label={`${GAME_UI.next}: ${upcoming}; ${GAME_UI.following}: ${following}`}>
                  <span className="next-pieces-label">{GAME_UI.next}</span>
                  <JerseySprite value={upcoming} size={28} />
                  <JerseySprite value={following} size={28} />
                </div>
              )}
            </div>
            {(status === "playing" || status === "paused") && <EvolutionStrip nextValue={next} highestValue={highestReached} />}
          </div>

          <section className="layout-board">
          <GameBoard
            gameRef={gameRef}
            onScore={handleScore}
            onNext={handleNext}
            onUpcoming={handleUpcoming}
            onFollowing={handleFollowing}
            onGameOver={handleGameOver}
            onMissions={handleMissions}
            onBadges={handleBadges}
            onDanger={handleDanger}
            onPowerups={handlePowerups}
            onCombo={handleCombo}
            onGameEvent={handleGameEvent}
          >
            {status === "idle" && <Mascot mood={mood} />}
            {combo && combo.count >= 2 && (
              <div className="combo-chip pointer-events-none absolute left-2 top-2 z-[5] rounded-full bg-[#101d42]/85 px-3 py-1 shadow-lg">
                <span className="font-display text-sm tracking-wide text-amber-300">
                  {GAME_UI.combo(combo.count, combo.multiplier)}
                </span>
              </div>
            )}
            {status === "idle" && challengeInvite && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-[#0B1229]/85 p-5 backdrop-blur-sm">
                <section role="dialog" aria-modal="true" aria-label={GAME_UI.friendChallenge.button} className="w-full max-w-[360px] rounded-3xl bg-[#16204A] p-6 text-center text-white shadow-2xl ring-1 ring-white/15">
                  <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#2EC4B6]">{GAME_UI.title}</p>
                  <h2 className="m-0 mt-3 font-display text-2xl leading-tight">{GAME_UI.friendChallenge.invite(challengeInvite.name, challengeInvite.score)}</h2>
                  <p className="m-0 mt-3 text-sm font-bold text-[#C7CCEA]">{GAME_UI.friendChallenge.highest(challengeInvite.maxLevel)}</p>
                  <button type="button" autoFocus onClick={() => startChallenge(challengeInvite)} className="mt-6 min-h-[58px] w-full rounded-2xl bg-[#FFC93C] px-5 py-3 font-display text-lg tracking-wide text-[#0F1B3D] shadow-[0_4px_0_#D9A406] active:translate-y-[2px]">
                    {GAME_UI.friendChallenge.accept}
                  </button>
                  <button type="button" onClick={() => setChallengeInvite(null)} className="mt-2 min-h-[44px] w-full rounded-xl px-4 py-2 text-sm font-bold text-[#D6DDF1] hover:text-white">
                    {GAME_UI.friendChallenge.dismiss}
                  </button>
                </section>
              </div>
            )}
            {status === "idle" && !challengeInvite && (
              <MainMenu
                best={best}
                top={top}
                globalTop={globalTop}
                missions={missions}
                ownedBadges={badges}
                user={user}
                daily={{
                  dayKey,
                  seed: dailyMeta?.seed ?? 0,
                  quests: dailyMeta?.quests ?? getSimpleDailyQuests(),
                  board: dailyMeta?.board ?? [],
                  streak: dailyMeta?.streak ?? streak,
                  claimed: dailyMeta?.claimed ?? loadClaimed(dayKey),
                  progress: Object.fromEntries(
                    (dailyMeta?.quests ?? []).map((q) => [q.id, questProgress(q, questCounters)])
                  ),
                  isGuest: !user,
                  yourRank: dailyMeta?.yourRank ?? null,
                  dailyBest: dailyMeta?.dailyBest ?? null,
                  dailyPlayedScore,
                }}
                onOpenAuth={openAuth}
                onPlay={startGame}
                onPlayDaily={startDaily}
                onClaimQuest={claimQuest}
              />
            )}
            {status === "paused" && <PauseOverlay
              muted={muted}
              musicEnabled={musicEnabled}
              onToggleSound={toggleMute}
              onToggleMusic={toggleMusic}
              onResume={togglePause}
              onRestart={startGame}
              onMenu={goMenu}
            />}
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
                challenge={mode === "challenge" ? activeChallenge : null}
                challengeSeed={runSeed.current}
                challengeMaxLevel={runMaxValue.current}
                playerName={user?.username ?? GAME_UI.friendChallenge.guestName}
                allowFriendChallenge={mode !== "daily"}
                onPlayAgain={startGame}
                onRematch={startChallenge}
                onMenu={goMenu}
              />
            )}
          </GameBoard>
          </section>

          <div className="layout-right">
            <PowerupBar
              snapshot={powerups}
              canPlay={status === "playing"}
              disabledReason={mode === "challenge" ? GAME_UI.friendChallenge.powerupsOff : undefined}
              onUse={usePowerup}
            />

          </div>
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

      {leaderboardOpen && (
        <LeaderboardModal
          entries={globalTop}
          highlightName={user?.username ?? null}
          onClose={() => setLeaderboardOpen(false)}
        />
      )}

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
                {GAME_UI.trophyUnlocked}
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

function PauseOverlay({
  muted,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
  onResume,
  onRestart,
  onMenu,
}: {
  muted: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const [confirmRestart, setConfirmRestart] = useState(false);
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0B1229]/70 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={GAME_UI.paused}
        className="w-[280px] max-w-[calc(100vw-32px)] rounded-2xl bg-[#16204A] p-5 text-center text-white shadow-2xl ring-1 ring-white/10"
      >
        <h2 className="m-0 font-display text-2xl tracking-tight text-white">{GAME_UI.paused}</h2>
        <div className="mt-4 flex flex-col gap-2">
          {confirmRestart ? (
            <>
              <p className="m-0 py-1 text-sm font-bold text-[#E3E7F5]">{GAME_UI.restartConfirmTitle} {GAME_UI.restartConfirmBody}</p>
              <button type="button" onClick={() => { setConfirmRestart(false); onRestart(); }} className="min-h-[44px] rounded-xl bg-[#FF5A5F] px-4 py-2 font-bold text-white hover:bg-[#ff7277]">
                {GAME_UI.confirmRestart}
              </button>
              <button type="button" onClick={() => setConfirmRestart(false)} className="min-h-[44px] rounded-xl px-4 py-2 font-bold text-[#E3E7F5] ring-1 ring-white/20">
                {GAME_UI.cancel}
              </button>
            </>
          ) : (
            <>
          <button
            type="button"
            onClick={onResume}
            autoFocus
            className="min-h-[48px] rounded-xl bg-[#FFC93C] px-5 py-2.5 font-display tracking-wide text-[#0F1B3D] transition hover:bg-[#FFD76A] active:scale-[0.98]"
          >
            {GAME_UI.resume}
          </button>
          <button
            type="button"
            onClick={() => setConfirmRestart(true)}
            className="min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-semibold text-[#E3E7F5] ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white active:scale-[0.98]"
          >
            {GAME_UI.restart}
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="min-h-[40px] rounded-xl px-5 py-2 text-sm font-semibold text-[#D6DDF1] transition hover:text-white active:scale-[0.98]"
          >
            {GAME_UI.mainMenu}
          </button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={onToggleSound} aria-pressed={!muted} className="min-h-[44px] rounded-xl bg-white/5 px-2 text-xs font-extrabold text-[#E3E7F5] ring-1 ring-white/10">
              {GAME_UI.auth.soundLabel}: {muted ? GAME_UI.soundPauseOn : GAME_UI.soundPauseOff}
            </button>
            <button type="button" onClick={onToggleMusic} aria-pressed={musicEnabled} className="min-h-[44px] rounded-xl bg-white/5 px-2 text-xs font-extrabold text-[#E3E7F5] ring-1 ring-white/10">
              {GAME_UI.auth.musicLabel}: {musicEnabled ? GAME_UI.musicOn : GAME_UI.musicOff}
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
