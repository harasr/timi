export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  muted: boolean;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  ensure() {
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyMute();
    } catch {
      this.ctx = null;
    }
  }

  resume() {
    this.ensure();
    if (this.ctx?.state === "suspended") {
      void this.ctx.resume();
    }
  }

  private applyMute() {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.03);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyMute();
  }

  toggle() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private tone(opts: {
    frequency: number;
    duration?: number;
    type?: OscillatorType;
    gain?: number;
    slide?: number;
  }) {
    if (this.muted) return;
    this.ensure();
    this.resume();
    if (!this.ctx || !this.sfx) return;
    const now = this.ctx.currentTime;
    const duration = opts.duration ?? 0.08;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.frequency, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, opts.frequency * (opts.slide ?? 1)),
      now + duration,
    );
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(opts.gain ?? 0.03, now + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp).connect(this.sfx);
    osc.start(now);
    osc.stop(now + duration + 0.03);
    osc.onended = () => {
      osc.disconnect();
      amp.disconnect();
    };
  }

  flap() {
    this.tone({ frequency: 520, duration: 0.07, type: "triangle", gain: 0.028, slide: 1.22 });
  }

  score() {
    this.tone({ frequency: 680, duration: 0.09, type: "sine", gain: 0.03, slide: 1.38 });
    window.setTimeout(() => {
      this.tone({ frequency: 910, duration: 0.1, type: "triangle", gain: 0.022, slide: 1.12 });
    }, 70);
  }

  hit() {
    this.tone({ frequency: 160, duration: 0.18, type: "sawtooth", gain: 0.03, slide: 0.48 });
  }

  best() {
    this.tone({ frequency: 740, duration: 0.16, type: "triangle", gain: 0.03, slide: 1.5 });
  }

  click() {
    this.tone({ frequency: 340, duration: 0.045, type: "sine", gain: 0.016, slide: 1.1 });
  }
}
