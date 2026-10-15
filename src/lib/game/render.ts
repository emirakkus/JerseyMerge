/**
 * Render module — all drawing is separated from game state (engine).
 * The engine pushes a lightweight frame state; this module draws it.
 */

import { BOARD_H, BOARD_W, DANGER_Y, DROP_Y, radiusFor } from "./constants";
import { getJerseySprite } from "./jersey";
import type { FxSystem } from "./fx";

export interface RenderJersey {
  x: number;
  y: number;
  angle: number;
  radius: number;
  value: number;
  spawnAt: number;
}

export interface FrameState {
  jerseys: readonly RenderJersey[];
  aimX: number;
  nextValue: number;
  showAim: boolean;
  dangerLevel: number;
  ts: number;
  reducedMotion: boolean;
}

const BG_TOP = "#0F1B3D";
const BG_BOTTOM = "#2A1B5C";
const ACCENT_CORAL = "#FF5A5F";

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  viewScale: number,
  offset: { x: number; y: number },
  fx: FxSystem,
  state: FrameState
): void {
  ctx.setTransform(viewScale, 0, 0, viewScale, 0, 0);
  ctx.translate(offset.x, offset.y);
  drawBackground(ctx, state.dangerLevel);
  if (state.showAim) drawAim(ctx, state.aimX, state.nextValue);
  for (const j of state.jerseys) {
    drawJerseySprite(ctx, j, state.ts, state.reducedMotion);
  }
  fx.draw(ctx);
  drawDangerVignette(ctx, state.dangerLevel, state.ts);
}

export function drawBackground(ctx: CanvasRenderingContext2D, dangerLevel: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, BOARD_H);
  g.addColorStop(0, BG_TOP);
  g.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = g;
  ctx.fillRect(-20, -20, BOARD_W + 40, BOARD_H + 40);

  // subtle stadium stripes
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let i = 0; i < BOARD_W; i += 70) ctx.fillRect(i, 0, 35, BOARD_H);

  // stadium pitch lines
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(BOARD_W / 2, BOARD_H + 150, 235, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(BOARD_W / 2, BOARD_H + 150, 60, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  // danger line (coral, pulsing when in breach)
  ctx.save();
  ctx.setLineDash([12, 9]);
  ctx.strokeStyle = `rgba(255,90,95,${(0.6 + dangerLevel * 0.4).toFixed(3)})`;
  ctx.lineWidth = dangerLevel > 0.02 ? 4 : 3;
  ctx.beginPath();
  ctx.moveTo(0, DANGER_Y);
  ctx.lineTo(BOARD_W, DANGER_Y);
  ctx.stroke();
  ctx.restore();

  // thick field border
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, BOARD_W - 3, BOARD_H - 3);
  void ACCENT_CORAL;
}

export function drawAim(ctx: CanvasRenderingContext2D, aimX: number, nextValue: number): void {
  const r = radiusFor(nextValue);
  const x = aimX;
  ctx.save();
  ctx.setLineDash([4, 10]);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, DROP_Y + r + 12);
  ctx.lineTo(x, BOARD_H - 10);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.55;
  const sprite = getJerseySprite(nextValue);
  ctx.drawImage(sprite, x - r, DROP_Y - r, r * 2, r * 2);
  ctx.restore();
}

export function drawJerseySprite(
  ctx: CanvasRenderingContext2D,
  j: RenderJersey,
  ts: number,
  reducedMotion: boolean
): void {
  const sprite = getJerseySprite(j.value);
  const age = ts - j.spawnAt;
  let scale = 1;
  if (age < 220 && !reducedMotion) {
    const t = 1 - age / 220;
    scale = 1 + 0.5 * t * t; // merge "pop"
  }
  ctx.save();
  ctx.translate(j.x, j.y);
  ctx.rotate(j.angle);
  ctx.scale(scale, scale);
  ctx.drawImage(sprite, -j.radius, -j.radius, j.radius * 2, j.radius * 2);
  ctx.restore();
}

function drawDangerVignette(ctx: CanvasRenderingContext2D, dangerLevel: number, ts: number): void {
  if (dangerLevel <= 0.02) return;
  const a = dangerLevel * (0.55 + 0.45 * Math.sin(ts / 130)) * 0.3;
  const g = ctx.createLinearGradient(0, 0, 0, DANGER_Y + 70);
  g.addColorStop(0, `rgba(255,90,95,${a.toFixed(3)})`);
  g.addColorStop(1, "rgba(255,90,95,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, BOARD_W, DANGER_Y + 70);
}
