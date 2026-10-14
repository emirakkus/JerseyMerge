/**
 * Jersey rendering module (procedural canvas paths only — no image assets).
 * Sticker style: flat bright fills, thick dark outline, tiered patterns and
 * a bold outlined LEVEL number. All kits are fictional.
 * Sprites are cached offscreen; the render loop is a cheap drawImage.
 */

import { BOMB_VALUE, JOKER_VALUE } from "./constants";
import { JERSEY_OUTLINE, styleFor, type JerseyStyle } from "./jerseyConfig";

const SPRITE_SIZE = 320;
const SPRITE_S = 140;

const cache = new Map<number, HTMLCanvasElement>();

function withAlpha(hex: string, alpha: number): string {
  const v = Number.parseInt(hex.replace("#", ""), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${alpha})`;
}

function silhouettePath(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(-0.42 * s, -0.44 * s);
  ctx.quadraticCurveTo(-0.62 * s, -0.42 * s, -0.8 * s, -0.22 * s);
  ctx.lineTo(-0.86 * s, 0.02 * s);
  ctx.quadraticCurveTo(-0.68 * s, 0.1 * s, -0.52 * s, 0.06 * s);
  ctx.lineTo(-0.5 * s, 0.64 * s);
  ctx.quadraticCurveTo(-0.5 * s, 0.74 * s, -0.4 * s, 0.74 * s);
  ctx.lineTo(0.4 * s, 0.74 * s);
  ctx.quadraticCurveTo(0.5 * s, 0.74 * s, 0.5 * s, 0.64 * s);
  ctx.lineTo(0.52 * s, 0.06 * s);
  ctx.quadraticCurveTo(0.68 * s, 0.1 * s, 0.86 * s, 0.02 * s);
  ctx.lineTo(0.8 * s, -0.22 * s);
  ctx.quadraticCurveTo(0.62 * s, -0.42 * s, 0.42 * s, -0.44 * s);
  ctx.quadraticCurveTo(0.24 * s, -0.26 * s, 0, -0.26 * s);
  ctx.quadraticCurveTo(-0.24 * s, -0.26 * s, -0.42 * s, -0.44 * s);
  ctx.closePath();
}

function sleevePath(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(-0.42 * s, -0.44 * s);
  ctx.quadraticCurveTo(-0.62 * s, -0.42 * s, -0.8 * s, -0.22 * s);
  ctx.lineTo(-0.86 * s, 0.02 * s);
  ctx.quadraticCurveTo(-0.68 * s, 0.1 * s, -0.52 * s, 0.06 * s);
  ctx.quadraticCurveTo(-0.47 * s, -0.16 * s, -0.42 * s, -0.44 * s);
  ctx.closePath();
}

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function band(ctx: CanvasRenderingContext2D, s: number, x: number, y: number, w: number, h: number): void {
  ctx.fillRect(x * s, y * s, w * s, h * s);
}

/** Tier-specific pattern, clipped to the silhouette by the caller. */
function drawTierPattern(ctx: CanvasRenderingContext2D, s: number, st: JerseyStyle): void {
  const c = st.secondary;
  ctx.fillStyle = c;
  switch (st.tier) {
    case 2: {
      // two-tone sleeve stripes (both sleeves)
      ctx.save();
      sleevePath(ctx, s);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.scale(-1, 1);
      sleevePath(ctx, s);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 3: {
      if (st.level === 5) {
        band(ctx, s, -0.56, -0.12, 1.12, 0.2);
        band(ctx, s, -0.56, 0.32, 1.12, 0.2);
      } else {
        band(ctx, s, -0.32, -0.42, 0.18, 1.2);
        band(ctx, s, 0.14, -0.42, 0.18, 1.2);
      }
      break;
    }
    case 4: {
      // diagonal band + two-tone sleeves
      ctx.save();
      ctx.translate(0, 0.14 * s);
      ctx.rotate(-0.35);
      ctx.fillRect(-1.2 * s, -0.02 * s, 2.4 * s, 0.2 * s);
      ctx.restore();
      ctx.save();
      sleevePath(ctx, s);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.scale(-1, 1);
      sleevePath(ctx, s);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 5: {
      // gold shoulder stripes on the gradient base
      if (st.trim) {
        ctx.fillStyle = st.trim;
        band(ctx, s, -0.56, -0.34, 1.12, 0.1);
        ctx.save();
        sleevePath(ctx, s);
        ctx.clip();
        ctx.fillRect(-1.2 * s, -0.3 * s, 2.4 * s, 0.12 * s);
        ctx.restore();
        ctx.save();
        ctx.scale(-1, 1);
        sleevePath(ctx, s);
        ctx.clip();
        ctx.fillRect(-1.2 * s, -0.3 * s, 2.4 * s, 0.12 * s);
        ctx.restore();
      }
      break;
    }
    case 6: {
      // champion star on the chest (the value number sits below it)
      starPath(ctx, 0, -0.05 * s, 0.19 * s);
      ctx.fillStyle = JERSEY_OUTLINE;
      ctx.fill();
      starPath(ctx, 0, -0.05 * s, 0.14 * s);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      starPath(ctx, 0, -0.05 * s, 0.085 * s);
      ctx.fillStyle = JERSEY_OUTLINE;
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      starPath(ctx, -0.36 * s, -0.24 * s, 0.05 * s);
      ctx.fill();
      starPath(ctx, 0.37 * s, 0.5 * s, 0.045 * s);
      ctx.fill();
      starPath(ctx, 0.3 * s, -0.33 * s, 0.04 * s);
      ctx.fill();
      break;
    }
    default:
      break;
  }
}

/** Sticker jersey: flat/gradient fill, tier pattern, collar, level number, thick outline. */
export function drawJersey(ctx: CanvasRenderingContext2D, s: number, st: JerseyStyle): void {
  // base fill (flat or gradient for tiers 5-6)
  silhouettePath(ctx, s);
  if (st.tier >= 5) {
    const g = ctx.createLinearGradient(0, -s * 0.5, 0, s * 0.8);
    g.addColorStop(0, st.secondary);
    g.addColorStop(1, st.primary);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = st.primary;
  }
  ctx.fill();

  // pattern + subtle fabric light, clipped
  ctx.save();
  silhouettePath(ctx, s);
  ctx.clip();
  drawTierPattern(ctx, s, st);
  const sheen = ctx.createLinearGradient(-s, 0, s, 0);
  sheen.addColorStop(0, "rgba(255,255,255,0.22)");
  sheen.addColorStop(0.35, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = sheen;
  ctx.fillRect(-s, -s, 2 * s, 2 * s);
  ctx.restore();

  // collar
  ctx.strokeStyle = st.tier >= 5 && st.trim ? st.trim : st.secondary;
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-0.23 * s, -0.375 * s);
  ctx.quadraticCurveTo(0, -0.15 * s, 0.23 * s, -0.375 * s);
  ctx.stroke();

  // value number (2, 4, 8 … 2048) — outlined sticker style
  const digits = String(st.value);
  const fs =
    digits.length >= 4 ? s * 0.36 : digits.length === 3 ? s * 0.46 : digits.length === 2 ? s * 0.58 : s * 0.8;
  ctx.font = `800 ${fs}px "Baloo 2", "Nunito", ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = fs * 0.22;
  ctx.strokeStyle = JERSEY_OUTLINE;
  ctx.strokeText(digits, 0, 0.24 * s);
  ctx.fillStyle = st.number;
  ctx.fillText(digits, 0, 0.24 * s);

  // gold trim under a thin dark rim (tiers 5-6)
  if (st.tier >= 5 && st.trim) {
    silhouettePath(ctx, s);
    ctx.strokeStyle = st.trim;
    ctx.lineWidth = s * 0.075;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  // thick sticker outline
  silhouettePath(ctx, s);
  ctx.strokeStyle = JERSEY_OUTLINE;
  ctx.lineWidth = s * (st.tier >= 5 ? 0.04 : 0.055);
  ctx.lineJoin = "round";
  ctx.stroke();
}

/** Golden wild joker form. */
function drawJokerKit(ctx: CanvasRenderingContext2D, s: number): void {
  silhouettePath(ctx, s);
  const g = ctx.createRadialGradient(-s * 0.3, -s * 0.45, s * 0.1, 0, 0, s * 1.25);
  g.addColorStop(0, "#FFE9A6");
  g.addColorStop(0.5, "#FFD447");
  g.addColorStop(1, "#F5A623");
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  silhouettePath(ctx, s);
  ctx.clip();
  ctx.fillStyle = JERSEY_OUTLINE;
  band(ctx, s, -0.56, -0.12, 1.12, 0.18);
  band(ctx, s, -0.56, 0.32, 1.12, 0.18);
  const sheen = ctx.createLinearGradient(-s, 0, s, 0);
  sheen.addColorStop(0, "rgba(255,255,255,0.3)");
  sheen.addColorStop(0.4, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = sheen;
  ctx.fillRect(-s, -s, 2 * s, 2 * s);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  starPath(ctx, -0.36 * s, -0.28 * s, 0.05 * s);
  ctx.fill();
  starPath(ctx, 0.36 * s, 0.1 * s, 0.045 * s);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-0.23 * s, -0.375 * s);
  ctx.quadraticCurveTo(0, -0.15 * s, 0.23 * s, -0.375 * s);
  ctx.stroke();

  // "J"
  ctx.font = `800 ${s * 0.78}px "Baloo 2", "Nunito", ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = s * 0.18;
  ctx.strokeStyle = JERSEY_OUTLINE;
  ctx.strokeText("J", 0, 0.24 * s);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("J", 0, 0.24 * s);

  silhouettePath(ctx, s);
  ctx.strokeStyle = JERSEY_OUTLINE;
  ctx.lineWidth = s * 0.055;
  ctx.lineJoin = "round";
  ctx.stroke();
}

/** Round bomb with a sparking fuse. */
function drawBombKit(ctx: CanvasRenderingContext2D, s: number): void {
  const r = s * 0.72;
  const cy = s * 0.06;
  const g = ctx.createRadialGradient(-r * 0.35, cy - r * 0.45, r * 0.1, 0, cy, r * 1.15);
  g.addColorStop(0, "#5A6584");
  g.addColorStop(0.55, "#2B3149");
  g.addColorStop(1, "#141927");
  ctx.beginPath();
  ctx.arc(0, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-r * 0.35, cy - r * 0.35, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fill();

  ctx.strokeStyle = "#D9B98A";
  ctx.lineWidth = s * 0.055;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(s * 0.02, -s * 0.5);
  ctx.quadraticCurveTo(s * 0.28, -s * 0.72, s * 0.44, -s * 0.58);
  ctx.stroke();

  starPath(ctx, s * 0.5, -s * 0.55, s * 0.14);
  ctx.fillStyle = "#FFC93C";
  ctx.fill();
  starPath(ctx, s * 0.5, -s * 0.55, s * 0.07);
  ctx.fillStyle = "#FFE9A6";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = JERSEY_OUTLINE;
  ctx.lineWidth = s * 0.055;
  ctx.stroke();
}

/** Cached 320x320 sprite for a value (jersey / joker / bomb). Client-only. */
export function getJerseySprite(value: number): HTMLCanvasElement {
  const cached = cache.get(value);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.translate(SPRITE_SIZE / 2, SPRITE_SIZE / 2 + 4);
    if (value === JOKER_VALUE) {
      drawJokerKit(ctx, SPRITE_S);
    } else if (value === BOMB_VALUE) {
      drawBombKit(ctx, SPRITE_S);
    } else {
      drawJersey(ctx, SPRITE_S, styleFor(value));
    }
  }
  cache.set(value, canvas);
  if (cache.size > 48) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return canvas;
}

/** Forces sprites to be re-baked (e.g. after webfonts finish loading). */
export function refreshJerseySprites(): void {
  cache.clear();
}
