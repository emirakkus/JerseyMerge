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
  font: string;
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
  private particlePool: Particle[] = [];
  private floaters: Floater[] = [];
  private rings: Ring[] = [];
  private flashes: Flash[] = [];
  shake = 0;
  private reducedMotion = false;
  private offsetValue = { x: 0, y: 0 };

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
    const available = Math.min(count, 120 - this.particles.length);
    for (let i = 0; i < available; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.4 + Math.random() * 0.7) * power;
      const particle = this.particlePool.pop() ?? {} as Particle;
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed - power * 0.35;
      particle.life = 0;
      particle.ttl = 450 + Math.random() * 450;
      particle.size = 2 + Math.random() * 3.5;
      particle.color = colors[Math.floor(Math.random() * colors.length)];
      particle.rect = Math.random() < 0.4;
      particle.rot = Math.random() * Math.PI;
      particle.vr = (Math.random() - 0.5) * 0.3;
      this.particles.push(particle);
    }
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
    this.floaters.push({ x, y, text, life: 0, ttl: 780, color, size, font: `900 ${size}px "Arial Black", "Arial Bold", ui-sans-serif, system-ui, sans-serif` });
  }

  update(dt: number): void {
    const k = dt / 16.667;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.vy += 0.16 * k;
      p.vx *= Math.pow(0.985, k);
      p.rot += p.vr * k;
      if (p.life >= p.ttl) {
        this.particles.splice(i, 1);
        this.particlePool.push(p);
      }
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      if ((this.floaters[i].life += dt) >= this.floaters[i].ttl) this.floaters.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      if ((this.rings[i].life += dt) >= this.rings[i].ttl) this.rings.splice(i, 1);
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      if ((this.flashes[i].life += dt) >= this.flashes[i].ttl) this.flashes.splice(i, 1);
    }
    this.shake *= Math.pow(0.88, k);
    if (this.shake < 0.05) this.shake = 0;
  }

  offset(): { x: number; y: number } {
    this.offsetValue.x = this.shake > 0 ? (Math.random() - 0.5) * 2 * this.shake : 0;
    this.offsetValue.y = this.shake > 0 ? (Math.random() - 0.5) * 2 * this.shake : 0;
    return this.offsetValue;
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
      ctx.font = f.font;
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
    this.particlePool = [];
    this.floaters = [];
    this.rings = [];
    this.flashes = [];
    this.shake = 0;
  }
}
