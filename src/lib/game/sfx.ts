/** Tiny WebAudio synth for game feedback. No assets, lazily created, mute-persisted. */

const MUTE_KEY = "jersey-merge.muted";
const MUSIC_KEY = "jersey-merge.music-enabled";

class Sfx {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicEnabled = false;
  private musicOscillator: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;

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

  loadMusicEnabled(): boolean {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(MUSIC_KEY) === "1";
    } catch {
      return false;
    }
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(MUSIC_KEY, enabled ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (enabled) this.startMusic();
    else this.stopMusic();
  }

  private startMusic(): void {
    if (this.musicOscillator || typeof window === "undefined") return;
    const ctx = this.ensure();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 196;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.008, ctx.currentTime + 0.6);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    this.musicOscillator = oscillator;
    this.musicGain = gain;
    const notes = [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63];
    this.musicStep = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.musicEnabled || !this.musicOscillator || !this.ctx) return;
      const note = notes[this.musicStep++ % notes.length];
      this.musicOscillator.frequency.setTargetAtTime(note, this.ctx.currentTime, 0.16);
    }, 850);
  }

  private stopMusic(): void {
    if (this.musicTimer !== null && typeof window !== "undefined") window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.musicOscillator && this.ctx) {
      const oscillator = this.musicOscillator;
      this.musicGain?.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.04);
      window.setTimeout(() => { try { oscillator.stop(); } catch { /* already stopped */ } }, 180);
    }
    this.musicOscillator = null;
    this.musicGain = null;
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

  merge(value: number, combo = 1): void {
    const base = Math.min(1200, (240 + Math.log2(Math.max(2, value)) * 46) * Math.min(1.45, 1 + Math.max(0, combo - 1) * 0.055));
    this.tone(base, 0.1, "sine", 0.16);
    this.tone(Math.min(1800, base * 1.5), 0.14, "sine", 0.12, 0.055);
    if (value >= 64) this.tone(Math.min(2200, base * 2), 0.16, "triangle", 0.07, 0.11);
  }

  /** Rising tick per chain link — the longer the chain, the higher it climbs. */
  comboTick(combo: number): void {
    this.tone(320 + Math.min(12, combo) * 70, 0.06, "triangle", 0.09);
  }

  /** Streak-bonus fanfare (chain milestone). */
  streak(): void {
    this.tone(523, 0.08, "square", 0.07);
    this.tone(659, 0.08, "square", 0.07, 0.07);
    this.tone(784, 0.12, "square", 0.08, 0.14);
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
