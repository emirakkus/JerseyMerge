/** Lightweight canvas FX: particle bursts, shock rings, floating score text and screen shake. */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  size: number;
  color: string;
  rect: boolean;
  rot: number;
  vr: number;
}

interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  ttl: number;
  color: string;
  size: number;
}

interface Ring {
  x: number;
  y: number;
  maxR: number;
  life: number;
  ttl: number;
  color: string;
}

interface Flash {
  x: number;
  y: number;
  r: number;
  life: number;
  ttl: number;
  color: string;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export class FxSystem {
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private rings: Ring[] = [];
  private flashes: Flash[] = [];
  shake = 0;
  private reducedMotion = false;

  /** With prefers-reduced-motion: particles and rings are off (floaters stay). */
  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  addShake(amount: number): void {
    if (this.reducedMotion) return;
    this.shake = Math.min(16, this.shake + amount);
  }

  burst(x: number, y: number, colors: string[], count: number, power: number): void {
    if (this.reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.4 + Math.random() * 0.7) * power;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - power * 0.35,
        life: 0,
        ttl: 450 + Math.random() * 450,
        size: 2 + Math.random() * 3.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rect: Math.random() < 0.4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
      });
    }
    if (this.particles.length > 400) this.particles.splice(0, this.particles.length - 400);
  }

  ring(x: number, y: number, color: string, maxR: number): void {
    if (this.reducedMotion) return;
    this.rings.push({ x, y, maxR, life: 0, ttl: 320, color });
  }

  /** Quick soft flash disc at the merge point (skipped under reduced motion). */
  flash(x: number, y: number, r: number, color: string, ttl = 200): void {
    if (this.reducedMotion) return;
    this.flashes.push({ x, y, r, life: 0, ttl, color });
  }

  floater(x: number, y: number, text: string, color: string, size: number): void {
    this.floaters.push({ x, y, text, life: 0, ttl: 780, color, size });
  }

  update(dt: number): void {
    const k = dt / 16.667;
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.vy += 0.16 * k;
      p.vx *= Math.pow(0.985, k);
      p.rot += p.vr * k;
    }
    this.particles = this.particles.filter((p) => p.life < p.ttl);
    for (const f of this.floaters) f.life += dt;
    this.floaters = this.floaters.filter((f) => f.life < f.ttl);
    for (const r of this.rings) r.life += dt;
    this.rings = this.rings.filter((r) => r.life < r.ttl);
    for (const f of this.flashes) f.life += dt;
    this.flashes = this.flashes.filter((f) => f.life < f.ttl);
    this.shake *= Math.pow(0.88, k);
    if (this.shake < 0.05) this.shake = 0;
  }

  offset(): { x: number; y: number } {
    if (this.shake <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * 2 * this.shake,
      y: (Math.random() - 0.5) * 2 * this.shake,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const f of this.flashes) {
      const t = f.life / f.ttl;
      ctx.globalAlpha = (1 - t) * 0.55;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * (0.85 + 0.4 * t), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const r of this.rings) {
      const t = r.life / r.ttl;
      const radius = r.maxR * easeOutCubic(t);
      ctx.globalAlpha = (1 - t) * 0.9;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 1 + 3 * (1 - t);
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const p of this.particles) {
      const t = p.life / p.ttl;
      ctx.globalAlpha = Math.max(0, 1 - t * t);
      ctx.fillStyle = p.color;
      if (p.rect) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    for (const f of this.floaters) {
      const t = f.life / f.ttl;
      const y = f.y - 34 * easeOutCubic(t);
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.font = `900 ${f.size}px "Arial Black", "Arial Bold", ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(10,16,42,0.45)";
      ctx.strokeText(f.text, f.x, y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, y);
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.particles = [];
    this.floaters = [];
    this.rings = [];
    this.flashes = [];
    this.shake = 0;
  }
}
