/**
 * Render module — all drawing is separated from game state (engine).
 * The engine pushes a lightweight frame state; this module draws it.
 */

import { BOARD_H, BOARD_W, DANGER_Y, DROP_Y, bowlFloorY, radiusFor, styleFor } from "./constants";
import { drawJerseyNumber, getJerseySprite } from "./jersey";
import type { FxSystem } from "./fx";
import { CLASSIC_FIELD_THEME, type FieldTheme } from "./fieldThemes";

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
  fieldTheme: FieldTheme;
}

const ACCENT_CORAL = "#FF5A5F";
const JERSEY_ART_SCALE = 1.14;
const backgroundGradients = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasGradient>>();
const dangerGradients = new WeakMap<CanvasRenderingContext2D, CanvasGradient>();

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  viewScale: number,
  offset: { x: number; y: number },
  fx: FxSystem,
  state: FrameState
): void {
  ctx.setTransform(viewScale, 0, 0, viewScale, 0, 0);
  ctx.translate(offset.x, offset.y);
  // Keep every sprite and effect inside the physical bowl silhouette.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, bowlFloorY(0));
  ctx.quadraticCurveTo(BOARD_W / 2, BOARD_H + 110, BOARD_W, bowlFloorY(BOARD_W));
  ctx.lineTo(BOARD_W, 0);
  ctx.closePath();
  ctx.clip();
  drawBackground(ctx, state.dangerLevel, state.fieldTheme, state.ts, state.reducedMotion);
  if (state.showAim) drawAim(ctx, state.aimX, state.nextValue, state.jerseys, state.fieldTheme);
  for (const j of state.jerseys) {
    drawJerseySprite(ctx, j, state.ts, state.reducedMotion);
  }
  fx.draw(ctx);
  drawDangerVignette(ctx, state.dangerLevel, state.ts);
  ctx.restore();
}

export function drawBackground(ctx: CanvasRenderingContext2D, dangerLevel: number, theme: FieldTheme = CLASSIC_FIELD_THEME, ts = 0, reducedMotion = false): void {
  let gradients = backgroundGradients.get(ctx);
  if (!gradients) {
    gradients = new Map<string, CanvasGradient>();
    backgroundGradients.set(ctx, gradients);
  }
  let g = gradients.get(theme.id);
  if (!g) {
    g = ctx.createLinearGradient(0, 0, 0, BOARD_H);
    g.addColorStop(0, theme.backgroundTop);
    g.addColorStop(1, theme.backgroundBottom);
    gradients.set(theme.id, g);
  }
  ctx.fillStyle = g;
  ctx.fillRect(-20, -20, BOARD_W + 40, BOARD_H + 40);

  // Low-contrast pitch mowing stripes and markings.
  ctx.fillStyle = "rgba(46,196,120,0.035)";
  for (let i = 0; i < BOARD_W; i += 84) ctx.fillRect(i, 0, 42, BOARD_H);

  // stadium pitch lines
  ctx.strokeStyle = theme.pitchColor;
  ctx.globalAlpha = theme.pitchOpacity;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, BOARD_H * 0.52);
  ctx.lineTo(BOARD_W, BOARD_H * 0.52);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(BOARD_W / 2, BOARD_H * 0.52, 52, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(BOARD_W * 0.24, 0, BOARD_W * 0.52, 92);
  ctx.strokeRect(BOARD_W * 0.36, 0, BOARD_W * 0.28, 42);
  ctx.globalAlpha = 1;

  // danger line (coral, pulsing when in breach)
  ctx.save();
  ctx.setLineDash([12, 9]);
  const pulse = dangerLevel > 0.02 ? 0.62 + dangerLevel * 0.35 * (0.55 + 0.45 * Math.sin(performance.now() / 130)) : 0.42;
  ctx.strokeStyle = theme.dangerColor || ACCENT_CORAL;
  ctx.globalAlpha = pulse;
  ctx.lineWidth = dangerLevel > 0.02 ? 3.5 : 2;
  ctx.beginPath();
  ctx.moveTo(0, DANGER_Y);
  ctx.lineTo(BOARD_W, DANGER_Y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // thick field border
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(1.5, 1.5);
  ctx.lineTo(1.5, bowlFloorY(0));
  ctx.quadraticCurveTo(BOARD_W / 2, BOARD_H + 110, BOARD_W - 1.5, bowlFloorY(BOARD_W));
  ctx.lineTo(BOARD_W - 1.5, 1.5);
  ctx.closePath();
  ctx.stroke();
  if (reducedMotion || !theme.particleCount || theme.particles === "none") return;
  drawWeather(ctx, theme, ts);
}

export function drawAim(ctx: CanvasRenderingContext2D, aimX: number, heldValue: number, jerseys: readonly RenderJersey[], theme: FieldTheme = CLASSIC_FIELD_THEME): void {
  const r = radiusFor(heldValue);
  const landingY = ghostLandingY(aimX, r, jerseys);
  drawJerseyIcon(ctx, aimX, DROP_Y, heldValue, r, 1);
  drawJerseyIcon(ctx, aimX, landingY, heldValue, r, theme.ghostFill);
  ctx.save();
  ctx.globalAlpha = 0.68;
  ctx.strokeStyle = theme.ghostOutline;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(aimX, landingY, r * 0.94, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  const x = aimX;
  ctx.save();
  ctx.setLineDash([4, 10]);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, DROP_Y + r + 3);
  ctx.lineTo(x, landingY - r - 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

const WEATHER_PARTICLE_CAP = 40;
function drawWeather(ctx: CanvasRenderingContext2D, theme: FieldTheme, ts: number): void {
  const count = Math.min(WEATHER_PARTICLE_CAP, theme.particleCount);
  ctx.save();
  ctx.globalAlpha = theme.particles === "rain" ? 0.2 : 0.35;
  ctx.strokeStyle = theme.particles === "rain" ? "#D4ECFF" : "#FFFFFF";
  ctx.fillStyle = "#FFFFFF";
  for (let i = 0; i < count; i += 1) {
    const drift = Math.floor(ts * (theme.particles === "rain" ? 0.12 : 0.025));
    const x = (i * 79 + (theme.particles === "rain" ? drift : i * 3)) % BOARD_W;
    const y = (i * 137 + Math.floor(ts * (theme.particles === "rain" ? 0.42 : 0.08))) % BOARD_H;
    if (theme.particles === "rain") {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + 8);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + (i % 3) * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function ghostLandingY(x: number, radius: number, jerseys: readonly RenderJersey[]): number {
  let landing = bowlFloorY(x) - radius;
  for (const jersey of jerseys) {
    const dx = Math.abs(jersey.x - x);
    const reach = radius + jersey.radius;
    if (dx >= reach || jersey.y < DROP_Y) continue;
    const y = jersey.y - Math.sqrt(reach * reach - dx * dx);
    if (y >= DROP_Y + radius && y < landing) landing = y;
  }
  return landing;
}

function drawJerseyIcon(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, radius: number, alpha: number): void {
  const artRadius = value > 0 ? radius * JERSEY_ART_SCALE : radius;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.drawImage(getJerseySprite(value, false), -artRadius, -artRadius, artRadius * 2, artRadius * 2);
  if (value > 0) {
    const s = 140 * (artRadius * 2 / 320);
    ctx.translate(0, 4 * (artRadius * 2 / 320));
    drawJerseyNumber(ctx, s, styleFor(value));
  }
  ctx.restore();
}

export function drawJerseySprite(
  ctx: CanvasRenderingContext2D,
  j: RenderJersey,
  ts: number,
  reducedMotion: boolean
): void {
  const artRadius = j.value > 0 ? j.radius * JERSEY_ART_SCALE : j.radius;
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
  ctx.drawImage(getJerseySprite(j.value, false), -artRadius, -artRadius, artRadius * 2, artRadius * 2);
  ctx.restore();
  if (j.value > 0) {
    ctx.save();
    ctx.translate(j.x, j.y);
    ctx.scale(scale, scale);
    const s = 140 * (artRadius * 2 / 320);
    ctx.translate(0, 4 * (artRadius * 2 / 320));
    drawJerseyNumber(ctx, s, styleFor(j.value));
    ctx.restore();
  }
}

function drawDangerVignette(ctx: CanvasRenderingContext2D, dangerLevel: number, ts: number): void {
  if (dangerLevel <= 0.02) return;
  const a = dangerLevel * (0.55 + 0.45 * Math.sin(ts / 130)) * 0.3;
  let g = dangerGradients.get(ctx);
  if (!g) {
    g = ctx.createLinearGradient(0, 0, 0, DANGER_Y + 70);
    g.addColorStop(0, "rgba(255,90,95,1)");
    g.addColorStop(1, "rgba(255,90,95,0)");
    dangerGradients.set(ctx, g);
  }
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, BOARD_W, DANGER_Y + 70);
  ctx.globalAlpha = 1;
}
