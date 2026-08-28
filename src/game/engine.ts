import { AudioManager } from "./audio";
import {
  COLORS,
  CONFIG,
  LANDSCAPE_SRC,
  WORLD,
  type EngineState,
  type HudSnapshot,
  type Particle,
  type Pine,
  type Pipe,
} from "./config";
import {
  drawAtmosphere,
  drawBird,
  drawFlash,
  drawGround,
  drawLandscape,
  drawParticles,
  drawPines,
  drawPipe,
  drawReadyHint,
  type BirdView,
} from "./render";
import { loadSave, writeSave } from "./storage";

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

class Spring {
  value: number;
  velocity = 0;
  constructor(value = 0) {
    this.value = value;
  }
  step(target: number, stiffness: number, damping: number, dt: number) {
    this.velocity += (target - this.value) * stiffness * dt;
    this.velocity *= Math.exp(-damping * dt);
    this.value += this.velocity * dt;
    return this.value;
  }
}

export class SkyboundEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHud: (s: HudSnapshot) => void;
  private audio: AudioManager;
  private landscape = new Image();
  private reduced: boolean;

  private state: EngineState = "menu";
  private score = 0;
  private best = 0;
  private isNewBest = false;
  private runTime = 0;
  private lastTime = 0;
  private acc = 0;
  private raf = 0;
  private dpr = 1;
  private view = { scale: 1, ox: 0, oy: 0 };
  private hitStop = 0;
  private flash = 0;
  private ken = 0;
  private worldTime = 0;
  private scroll = 0;
  private flapBuf = 0;
  private overAt = 0;
  private running = false;

  private bird = {
    x: 0,
    y: 0,
    vy: 0,
    rotation: 0,
    targetRot: 0,
    wingTime: 0,
    flapPulse: 0,
    scaleX: new Spring(1),
    scaleY: new Spring(1),
    trail: [] as { x: number; y: number; a: number }[],
  };
  private pipes: Pipe[] = [];
  private particles: Particle[] = [];
  private pines: Pine[] = [];
  private shake = 0;
  private shakeX = 0;
  private shakeY = 0;
  private groundOffset = 0;

  private unbind: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement, onHud: (s: HudSnapshot) => void, reduced: boolean) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D is unavailable");
    this.ctx = ctx;
    this.onHud = onHud;
    this.reduced = reduced;
    const save = loadSave();
    this.best = save.best;
    this.audio = new AudioManager(save.muted);
    this.landscape.src = LANDSCAPE_SRC;
    this.landscape.decoding = "async";
    this.resetBird(true);
    this.seedPines();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.bind();
    this.resize();
    this.emit();
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    for (const off of this.unbind) off();
    this.unbind = [];
  }

  get muted() {
    return this.audio.muted;
  }

  unlockAudio() {
    this.audio.ensure();
    this.audio.resume();
  }

  toggleMute() {
    const muted = this.audio.toggle();
    writeSave({ muted });
    this.emit();
    return muted;
  }

  requestFlap() {
    this.unlockAudio();
    if (this.state === "paused") return;
    if (this.state === "over") {
      if (this.worldTime - this.overAt > 0.5) this.retry();
      return;
    }
    if (this.state === "menu") {
      this.beginRun();
      return;
    }
    if (this.state === "playing") {
      this.flap(true);
      this.flapBuf = 0;
      return;
    }
    this.flapBuf = CONFIG.flapBuffer;
  }

  pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.audio.click();
    this.emit();
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.lastTime = performance.now();
    this.acc = 0;
    this.audio.click();
    this.emit();
  }

  retry() {
    this.audio.click();
    this.beginRun();
  }

  toMenu() {
    this.audio.click();
    this.state = "menu";
    this.resetBird(true);
    this.pipes = [];
    this.particles = [];
    this.score = 0;
    this.isNewBest = false;
    this.flash = 0;
    this.shake = 0;
    this.emit();
  }

  private beginRun() {
    this.score = 0;
    this.runTime = 0;
    this.isNewBest = false;
    this.pipes = [];
    this.particles = [];
    this.flash = 0;
    this.shake = 0;
    this.hitStop = 0;
    this.flapBuf = 0;
    this.resetBird(false);
    this.state = "playing";
    this.flap(true);
    this.emit();
  }

  private resetBird(idle: boolean) {
    this.bird.x = WORLD.width * 0.26;
    this.bird.y = WORLD.height * (idle ? 0.46 : 0.48);
    this.bird.vy = 0;
    this.bird.rotation = 0;
    this.bird.targetRot = 0;
    this.bird.wingTime = 0;
    this.bird.flapPulse = 0;
    this.bird.scaleX = new Spring(1);
    this.bird.scaleY = new Spring(1);
    this.bird.trail = [];
  }

  private seedPines() {
    this.pines = [];
    for (let i = 0; i < 18; i++) {
      this.pines.push({
        x: i * 70 + (i % 3) * 12,
        h: 46 + ((i * 37) % 54),
        w: 28 + ((i * 13) % 18),
        layer: i % 3 === 0 ? 0 : 1,
      });
    }
  }

  private bind() {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        this.requestFlap();
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        if (this.state === "playing") this.pause();
        else if (this.state === "paused") this.resume();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("button, a, [data-ui]")) return;
      e.preventDefault();
      this.requestFlap();
    };
    const onResize = () => this.resize();
    const onBlur = () => {
      if (this.state === "playing") this.pause();
    };
    const onVis = () => {
      if (document.hidden && this.state === "playing") this.pause();
      else this.audio.resume();
    };

    window.addEventListener("keydown", onKey, { passive: false });
    this.canvas.addEventListener("pointerdown", onPointer, { passive: false });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVis);

    this.unbind.push(
      () => window.removeEventListener("keydown", onKey),
      () => this.canvas.removeEventListener("pointerdown", onPointer),
      () => window.removeEventListener("resize", onResize),
      () => window.removeEventListener("orientationchange", onResize),
      () => window.removeEventListener("blur", onBlur),
      () => document.removeEventListener("visibilitychange", onVis),
    );
  }

  resize() {
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.dpr = dpr;
    const isLandscape = vw / vh >= 0.88;
    const scale = isLandscape ? vh / WORLD.height : vw / WORLD.minWidth;
    WORLD.width = Math.max(WORLD.minWidth, vw / scale);
    this.canvas.width = Math.max(1, Math.floor(vw * dpr));
    this.canvas.height = Math.max(1, Math.floor(vh * dpr));
    this.canvas.style.width = `${vw}px`;
    this.canvas.style.height = `${vh}px`;
    this.view.scale = scale;
    this.view.ox = 0;
    this.view.oy = isLandscape ? 0 : (vh - WORLD.height * scale) / 2;
    this.bird.x = WORLD.width * 0.26;
    this.seedPines();
  }

  private loop = (timestamp: number) => {
    if (!this.running) return;
    const raw = this.lastTime ? (timestamp - this.lastTime) / 1000 : CONFIG.step;
    this.lastTime = timestamp;
    const dt = clamp(raw, 0, 0.05);
    this.acc += dt;
    const step = CONFIG.step;
    let guard = 0;
    while (this.acc >= step && guard < 6) {
      this.update(step);
      this.acc -= step;
      guard += 1;
    }
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private difficulty() {
    const t = Math.max(0, this.score - CONFIG.difficultyStart);
    const speed = Math.min(CONFIG.worldSpeedMax, CONFIG.pipeSpeed * (1 + t * CONFIG.difficultyRate));
    const gap = Math.max(CONFIG.minGap, CONFIG.baseGap - t * 1.2);
    return { speed, gap };
  }

  private update(dt: number) {
    this.worldTime += dt;
    this.ken = this.reduced ? 0 : (Math.sin(this.worldTime * 0.12) + 1) * 0.5;
    this.shake = Math.max(0, this.shake - dt * 4.4);
    const m = this.shake * this.shake;
    this.shakeX = this.reduced ? 0 : (Math.random() - 0.5) * 12 * m;
    this.shakeY = this.reduced ? 0 : (Math.random() - 0.5) * 10 * m;
    this.flash = Math.max(0, this.flash - dt * 3.2);
    this.hitStop = Math.max(0, this.hitStop - dt);

    if (this.hitStop > 0 && this.state === "playing") {
      this.updateParticles(dt * 0.3);
      return;
    }

    const idle = this.state === "menu" || this.state === "paused";
    const speed = idle ? 28 : this.state === "over" ? CONFIG.pipeSpeed * 0.2 : this.difficulty().speed;
    const moving = this.state === "playing" || this.state === "menu";
    if (moving) {
      this.scroll += speed * dt;
      this.groundOffset = (this.groundOffset + speed * dt) % 56;
    }

    this.updateBird(dt);
    this.updateParticles(dt);

    if (this.state === "playing") {
      this.runTime += dt;
      this.flapBuf = Math.max(0, this.flapBuf - dt);
      if (this.flapBuf > 0) {
        this.flap(true);
        this.flapBuf = 0;
      }
      this.updatePipes(dt, speed);
      this.collide();
    } else if (this.state === "over") {
      if (this.bird.y > WORLD.height - WORLD.groundH - 18) {
        this.bird.y = WORLD.height - WORLD.groundH - 18;
        this.bird.vy = 0;
      }
    }
  }

  private updateBird(dt: number) {
    const b = this.bird;
    const playing = this.state === "playing";
    const over = this.state === "over";
    b.wingTime += dt * (playing ? 13 : 6.2);
    if (!playing && !over) {
      b.y += Math.sin(b.wingTime * 0.65) * 10 * dt;
      b.targetRot = -0.08 + Math.sin(b.wingTime * 0.35) * 0.04;
    } else {
      b.vy += CONFIG.gravity * dt;
      b.vy = Math.min(b.vy, CONFIG.maxFall);
      b.y += b.vy * dt;
      const t = clamp(b.vy / 520, -1, 1);
      b.targetRot = t * 1.15;
      if (over) b.targetRot = Math.min(1.4, b.targetRot + 0.25);
    }
    b.rotation += (b.targetRot - b.rotation) * Math.min(1, dt * 10.5);
    b.flapPulse = Math.max(0, b.flapPulse - dt * 5.8);
    b.scaleX.step(1 - b.flapPulse * 0.1, 170, 18, dt);
    b.scaleY.step(1 + b.flapPulse * 0.14, 170, 18, dt);

    if (playing) {
      b.trail.unshift({ x: b.x - 8, y: b.y, a: 1 });
      if (b.trail.length > CONFIG.maxTrail) b.trail.pop();
      for (const t of b.trail) t.a *= Math.exp(-8 * dt);
    } else {
      b.trail = [];
    }
  }

  private flap(playSound: boolean) {
    if (this.state !== "playing") return;
    this.bird.vy = CONFIG.flapImpulse;
    this.bird.flapPulse = 1;
    this.bird.targetRot = -0.46;
    this.spawn(this.bird.x - 12, this.bird.y + 10, this.reduced ? 2 : 6, [COLORS.bird, "#fff7e8"], 0.5);
    this.shake = Math.max(this.shake, 0.16);
    if (playSound) this.audio.flap();
  }

  private updatePipes(dt: number, speed: number) {
    const { gap } = this.difficulty();
    for (const p of this.pipes) p.x -= speed * dt;
    const last = this.pipes[this.pipes.length - 1];
    if (!last) {
      if (this.runTime > 0.72) this.spawnPipe(WORLD.width + 48, gap);
    } else if (last.x < WORLD.width - CONFIG.pipeSpacing) {
      this.spawnPipe(last.x + CONFIG.pipeSpacing, gap);
    }
    this.pipes = this.pipes.filter((p) => p.x + p.width > -40);
  }

  private spawnPipe(x: number, gapSize: number) {
    const minC = WORLD.ceilingH + 78 + gapSize / 2;
    const maxC = WORLD.height - WORLD.groundH - 78 - gapSize / 2;
    const gapY = minC + Math.random() * Math.max(1, maxC - minC);
    this.pipes.push({
      x,
      gapY,
      gapSize,
      width: CONFIG.pipeWidth,
      passed: false,
      seed: (Math.random() * 1000) | 0,
    });
  }

  private hitbox() {
    return {
      x: this.bird.x - CONFIG.birdW / 2 + CONFIG.hitInsetX,
      y: this.bird.y - CONFIG.birdH / 2 + CONFIG.hitInsetY,
      w: CONFIG.birdW - CONFIG.hitInsetX * 2,
      h: CONFIG.birdH - CONFIG.hitInsetY * 2,
    };
  }

  private collide() {
    const b = this.hitbox();
    if (b.y < WORLD.ceilingH || b.y + b.h > WORLD.height - WORLD.groundH) {
      this.finish();
      return;
    }
    for (const pipe of this.pipes) {
      const gapTop = pipe.gapY - pipe.gapSize / 2;
      const gapBot = pipe.gapY + pipe.gapSize / 2;
      const overlapX = b.x < pipe.x + pipe.width && b.x + b.w > pipe.x;
      const hitY = b.y < gapTop || b.y + b.h > gapBot;
      if (overlapX && hitY) {
        this.finish();
        return;
      }
      if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
        pipe.passed = true;
        this.addScore();
      }
    }
  }

  private addScore() {
    this.score += 1;
    this.spawn(this.bird.x + 10, this.bird.y - 8, this.reduced ? 2 : 7, ["#f7f1e4", "#dce8c8"], 0.65);
    this.flash = Math.min(1, this.flash + 0.18);
    this.audio.score();
    this.emit();
  }

  private finish() {
    if (this.state !== "playing") return;
    this.state = "over";
    this.overAt = this.worldTime;
    this.audio.hit();
    this.shake = 0.95;
    this.flash = 0.7;
    this.hitStop = 0.07;
    this.spawn(this.bird.x, this.bird.y, this.reduced ? 6 : 18, [COLORS.beak, COLORS.bird, COLORS.stoneLight], 1.2);
    if (this.score > this.best) {
      this.best = this.score;
      this.isNewBest = true;
      writeSave({ best: this.best });
      this.audio.best();
    }
    this.emit();
  }

  private spawn(x: number, y: number, count: number, palette: string[], power: number) {
    const n = Math.min(count, CONFIG.maxParticles - this.particles.length);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (28 + Math.random() * 110) * power;
      const life = 0.26 + Math.random() * 0.36;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life,
        maxLife: life,
        size: 1.4 + Math.random() * 3.4,
        color: palette[(Math.random() * palette.length) | 0] ?? COLORS.paper,
        gravity: 70 + Math.random() * 130,
        rotation: Math.random() * 6,
        spin: (Math.random() - 0.5) * 8,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p) continue;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
    }
  }

  private birdView(): BirdView {
    return {
      x: this.bird.x,
      y: this.bird.y,
      rotation: this.bird.rotation,
      wing: Math.sin(this.bird.wingTime) * 0.34 - this.bird.flapPulse * 0.28,
      scaleX: this.bird.scaleX.value,
      scaleY: this.bird.scaleY.value,
      trail: this.bird.trail,
    };
  }

  private render() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, vw, vh);

    const zoom = this.reduced ? 1.05 : 1.05 + this.ken * 0.04;
    drawLandscape(ctx, this.landscape, vw, vh, this.scroll, zoom);
    drawAtmosphere(ctx, vw, vh, this.worldTime, this.reduced);

    ctx.save();
    ctx.translate(this.view.ox + this.shakeX, this.view.oy + this.shakeY);
    ctx.scale(this.view.scale, this.view.scale);
    drawPines(ctx, this.pines, this.scroll, WORLD.height - WORLD.groundH);
    for (const p of this.pipes) drawPipe(ctx, p);
    drawGround(ctx, this.groundOffset);
    drawParticles(ctx, this.particles);
    drawBird(ctx, this.birdView());
    if (this.state === "menu") drawReadyHint(ctx, this.bird.x, this.bird.y, this.worldTime);
    ctx.restore();

    drawFlash(ctx, vw, vh, this.flash);
  }

  private emit() {
    this.onHud({
      state: this.state,
      score: this.score,
      best: this.best,
      isNewBest: this.isNewBest,
      muted: this.audio.muted,
    });
  }
}
