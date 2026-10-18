"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { JerseyEngine, type ComboEvent, type GameStatus } from "@/lib/game/engine";
import type { GameEvent } from "@/lib/game/events";
import type { MissionView } from "@/lib/game/missions";
import type { PowerupSnapshot } from "@/lib/game/powerups";
import { sfx } from "@/lib/game/sfx";
import type { FieldTheme } from "@/lib/game/fieldThemes";

export interface GameHandle {
  start: (bonus?: Partial<PowerupSnapshot["inventory"]>, seed?: number) => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  toMenu: () => void;
  status: () => GameStatus;
  elapsed: () => number;
  dropJoker: () => void;
  dropBomb: () => void;
  scramblePile: () => void;
  undoDrop: () => void;
  startDaily: (seed: number, bonus?: Partial<PowerupSnapshot["inventory"]>) => void;
  startChallenge: (seed: number) => void;
  setFieldTheme: (theme: FieldTheme) => void;
}

interface GameBoardProps {
  gameRef: { current: GameHandle | null };
  onScore: (score: number, best: number) => void;
  onNext: (value: number) => void;
  onUpcoming: (value: number) => void;
  onFollowing: (value: number) => void;
  onGameOver: (score: number) => void;
  onMissions: (missions: MissionView[]) => void;
  onBadges: (owned: string[]) => void;
  onDanger: (danger: boolean) => void;
  onPowerups: (snapshot: PowerupSnapshot) => void;
  onCombo: (combo: ComboEvent) => void;
  onGameEvent: (event: GameEvent) => void;
  fieldTheme: FieldTheme;
  children?: ReactNode;
}

/** Canvas host: owns the engine instance, pointer + keyboard input and DPR sizing. */
export function GameBoard({ gameRef, onScore, onNext, onUpcoming, onFollowing, onGameOver, onMissions, onBadges, onDanger, onPowerups, onCombo, onGameEvent, fieldTheme, children }: GameBoardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<JerseyEngine | null>(null);
  const cbRef = useRef({ onScore, onNext, onUpcoming, onFollowing, onGameOver, onMissions, onBadges, onDanger, onPowerups, onCombo, onGameEvent });
  useEffect(() => {
    // Keep the callback slot current without recreating the engine.
    cbRef.current = { onScore, onNext, onUpcoming, onFollowing, onGameOver, onMissions, onBadges, onDanger, onPowerups, onCombo, onGameEvent };
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const engine = new JerseyEngine(canvas, {
      onScore: (s, b) => cbRef.current.onScore(s, b),
      onNext: (v) => cbRef.current.onNext(v),
      onUpcoming: (v) => cbRef.current.onUpcoming(v),
      onFollowing: (v) => cbRef.current.onFollowing(v),
      onGameOver: (s) => cbRef.current.onGameOver(s),
      onMissions: (m) => cbRef.current.onMissions(m),
      onBadges: (b) => cbRef.current.onBadges(b),
      onDanger: (d) => cbRef.current.onDanger(d),
      onPowerups: (p) => cbRef.current.onPowerups(p),
      onCombo: (c) => cbRef.current.onCombo(c),
      onGameEvent: (e) => cbRef.current.onGameEvent(e),
    });
    engineRef.current = engine;

    const doResize = (): void => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        engine.resize(rect.width, rect.height, Math.min(2, window.devicePixelRatio || 1));
      }
    };
    doResize();
    const ro = new ResizeObserver(doResize);
    ro.observe(wrap);

    gameRef.current = {
      start: (bonus, seed) => engine.start(bonus, seed),
      pause: () => engine.pause(),
      resume: () => engine.resume(),
      togglePause: () => engine.togglePause(),
      toMenu: () => engine.toMenu(),
      status: () => engine.status,
      elapsed: () => engine.elapsed,
      dropJoker: () => engine.dropJoker(),
      dropBomb: () => engine.dropBomb(),
      scramblePile: () => engine.scramblePile(),
      undoDrop: () => engine.undoDrop(),
      startDaily: (seed, bonus) => engine.startDaily(seed, bonus),
      startChallenge: (seed) => engine.startChallenge(seed),
      setFieldTheme: (theme) => engine.setFieldTheme(theme),
    };

    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest("button") || target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          e.preventDefault();
          engine.nudgeAim(-20);
          break;
        case "ArrowRight":
        case "KeyD":
          e.preventDefault();
          engine.nudgeAim(20);
          break;
        case "ArrowDown":
        case "Space":
          e.preventDefault();
          if (!e.repeat) engine.drop();
          break;
        case "KeyP":
          e.preventDefault();
          if (!e.repeat) engine.togglePause();
          break;
        case "KeyJ":
          e.preventDefault();
          if (!e.repeat) engine.dropJoker();
          break;
        case "KeyB":
          e.preventDefault();
          if (!e.repeat) engine.dropBomb();
          break;
        case "KeyK":
          e.preventDefault();
          if (!e.repeat) engine.scramblePile();
          break;
        case "KeyZ":
          e.preventDefault();
          if (!e.repeat) engine.undoDrop();
          break;
        case "KeyR":
          e.preventDefault();
          if (!e.repeat && engine.status !== "idle") engine.start();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      ro.disconnect();
      gameRef.current = null;
      engine.destroy();
      engineRef.current = null;
    };
  }, [gameRef]);

  useEffect(() => {
    engineRef.current?.setFieldTheme(fieldTheme);
  }, [fieldTheme]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-xl bg-[#0d1531]"
      style={{ aspectRatio: "420 / 720" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-crosshair select-none"
        style={{ touchAction: "none" }}
        role="img"
        aria-label="Jersey Merge play area"
        onPointerMove={(e) => engineRef.current?.setAimFromClient(e.clientX)}
        onPointerDown={(e) => {
          // iOS/Android webviews only allow audio after a user gesture.
          sfx.unlock();
          engineRef.current?.setAimFromClient(e.clientX);
          engineRef.current?.drop();
        }}
      />
      {children}
    </div>
  );
}
