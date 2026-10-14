/** Tiny WebAudio synth for game feedback. No assets, lazily created, mute-persisted. */

const MUTE_KEY = "jersey-merge.muted";

class Sfx {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Call from a user gesture (click/tap) so the context is allowed to start. */
  unlock(): void {
    this.ensure();
  }

  loadMuted(): boolean {
    try {
      if (typeof window === "undefined") return false;
      return window.localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slideTo?: number): void {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  drop(): void {
    this.tone(175, 0.07, "triangle", 0.1, 0, 95);
  }

  merge(value: number): void {
    const base = 240 + Math.log2(Math.max(2, value)) * 46;
    this.tone(base, 0.1, "sine", 0.16);
    this.tone(base * 1.5, 0.14, "sine", 0.12, 0.055);
    if (value >= 64) this.tone(base * 2, 0.16, "triangle", 0.07, 0.11);
  }

  gameover(): void {
    this.tone(330, 0.18, "sawtooth", 0.09, 0, 220);
    this.tone(240, 0.22, "sawtooth", 0.09, 0.16, 140);
    this.tone(150, 0.3, "sawtooth", 0.11, 0.34, 80);
  }

  ui(): void {
    this.tone(520, 0.05, "square", 0.045);
  }

  mission(): void {
    this.tone(440, 0.08, "triangle", 0.12);
    this.tone(660, 0.08, "triangle", 0.12, 0.07);
    this.tone(880, 0.14, "triangle", 0.12, 0.14);
  }

  newBest(): void {
    this.tone(523, 0.09, "sine", 0.14);
    this.tone(784, 0.16, "sine", 0.12, 0.08);
  }

  warn(): void {
    this.tone(920, 0.05, "square", 0.04);
    this.tone(920, 0.05, "square", 0.04, 0.12);
  }

  levelUp(): void {
    this.tone(392, 0.08, "triangle", 0.12);
    this.tone(523, 0.08, "triangle", 0.12, 0.07);
    this.tone(659, 0.1, "triangle", 0.12, 0.14);
    this.tone(784, 0.18, "triangle", 0.13, 0.21);
  }

  badge(): void {
    this.tone(660, 0.07, "sine", 0.14);
    this.tone(880, 0.07, "sine", 0.14, 0.06);
    this.tone(1320, 0.16, "sine", 0.12, 0.12);
  }

  scramble(): void {
    this.tone(320, 0.28, "sawtooth", 0.09, 0, 70);
    this.tone(1100, 0.07, "square", 0.06, 0.03, 480);
    this.tone(70, 0.22, "sine", 0.13, 0.05, 40);
  }

  bomb(): void {
    this.tone(90, 0.35, "sine", 0.2, 0, 35);
    this.tone(600, 0.12, "sawtooth", 0.08, 0.02, 90);
  }

  undo(): void {
    this.tone(500, 0.08, "triangle", 0.1, 0, 300);
    this.tone(300, 0.1, "triangle", 0.08, 0.06, 220);
  }
}

export const sfx = new Sfx();
