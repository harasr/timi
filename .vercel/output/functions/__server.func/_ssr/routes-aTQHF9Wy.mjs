import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Play, i as RotateCcw, n as Volume2, o as Pause, t as VolumeX } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-aTQHF9Wy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AudioManager = class {
	ctx = null;
	master = null;
	sfx = null;
	muted;
	constructor(muted) {
		this.muted = muted;
	}
	ensure() {
		if (this.ctx) return;
		try {
			const Ctx = window.AudioContext || window.webkitAudioContext;
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
		if (this.ctx?.state === "suspended") this.ctx.resume();
	}
	applyMute() {
		if (!this.master || !this.ctx) return;
		const now = this.ctx.currentTime;
		this.master.gain.setTargetAtTime(this.muted ? 0 : 1, now, .03);
	}
	setMuted(muted) {
		this.muted = muted;
		this.applyMute();
	}
	toggle() {
		this.setMuted(!this.muted);
		return this.muted;
	}
	tone(opts) {
		if (this.muted) return;
		this.ensure();
		this.resume();
		if (!this.ctx || !this.sfx) return;
		const now = this.ctx.currentTime;
		const duration = opts.duration ?? .08;
		const osc = this.ctx.createOscillator();
		const amp = this.ctx.createGain();
		osc.type = opts.type ?? "sine";
		osc.frequency.setValueAtTime(opts.frequency, now);
		osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.frequency * (opts.slide ?? 1)), now + duration);
		amp.gain.setValueAtTime(1e-4, now);
		amp.gain.exponentialRampToValueAtTime(opts.gain ?? .03, now + .01);
		amp.gain.exponentialRampToValueAtTime(1e-4, now + duration);
		osc.connect(amp).connect(this.sfx);
		osc.start(now);
		osc.stop(now + duration + .03);
		osc.onended = () => {
			osc.disconnect();
			amp.disconnect();
		};
	}
	flap() {
		this.tone({
			frequency: 520,
			duration: .07,
			type: "triangle",
			gain: .028,
			slide: 1.22
		});
	}
	score() {
		this.tone({
			frequency: 680,
			duration: .09,
			type: "sine",
			gain: .03,
			slide: 1.38
		});
		window.setTimeout(() => {
			this.tone({
				frequency: 910,
				duration: .1,
				type: "triangle",
				gain: .022,
				slide: 1.12
			});
		}, 70);
	}
	hit() {
		this.tone({
			frequency: 160,
			duration: .18,
			type: "sawtooth",
			gain: .03,
			slide: .48
		});
	}
	best() {
		this.tone({
			frequency: 740,
			duration: .16,
			type: "triangle",
			gain: .03,
			slide: 1.5
		});
	}
	click() {
		this.tone({
			frequency: 340,
			duration: .045,
			type: "sine",
			gain: .016,
			slide: 1.1
		});
	}
};
var WORLD = {
	width: 360,
	height: 640,
	minWidth: 320,
	groundH: 118,
	ceilingH: 16
};
var CONFIG = {
	gravity: 1680,
	flapImpulse: -492,
	maxFall: 760,
	pipeWidth: 72,
	pipeSpeed: 176,
	baseGap: 188,
	minGap: 154,
	pipeSpacing: 238,
	firstPipeX: 420,
	birdW: 44,
	birdH: 32,
	hitInsetX: 8,
	hitInsetY: 7,
	worldSpeedMax: 246,
	difficultyStart: 3,
	difficultyRate: .015,
	maxParticles: 128,
	maxTrail: 10,
	step: 1 / 60,
	flapBuffer: .12
};
var COLORS = {
	stone: "#5a564c",
	stoneLight: "#8d8778",
	stoneMid: "#6e685c",
	stoneDark: "#35332c",
	moss: "#4a6a46",
	mossDeep: "#2f4a32",
	snow: "#eef3ef",
	bird: "#f2ead8",
	birdDark: "#2b3331",
	birdWing: "#3d4744",
	beak: "#c56a3a",
	ink: "#1c2a28",
	paper: "#f3eee4"
};
var LANDSCAPE_SRC = "/world/highlands.jpg";
var INTRO_VIDEO_SRC = "/world/intro.mp4";
function drawLandscape(ctx, img, vw, vh, scroll, zoom) {
	if (!img.naturalWidth) {
		const g = ctx.createLinearGradient(0, 0, 0, vh);
		g.addColorStop(0, "#8ec8e8");
		g.addColorStop(.45, "#9ecf9a");
		g.addColorStop(1, "#3d6b4a");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, vw, vh);
		return;
	}
	const cover = Math.max(vw / img.naturalWidth, vh / img.naturalHeight) * zoom;
	const dw = img.naturalWidth * cover;
	const dh = img.naturalHeight * cover;
	const period = dw;
	const pan = (scroll * .14 % period + period) % period;
	const ox = (vw - dw) / 2;
	const oy = (vh - dh) / 2 - vh * .02;
	ctx.drawImage(img, ox - pan, oy, dw, dh);
	ctx.drawImage(img, ox - pan + dw, oy, dw, dh);
}
function drawAtmosphere(ctx, vw, vh, time, reduced) {
	const sunX = vw * .16;
	const sunY = vh * .16;
	if (!reduced) {
		ctx.save();
		ctx.globalCompositeOperation = "screen";
		const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, Math.max(vw, vh) * .55);
		glow.addColorStop(0, "rgba(255, 236, 180, 0.28)");
		glow.addColorStop(.22, "rgba(255, 214, 140, 0.1)");
		glow.addColorStop(1, "rgba(255, 214, 140, 0)");
		ctx.fillStyle = glow;
		ctx.fillRect(0, 0, vw, vh);
		ctx.globalAlpha = .07;
		for (let i = 0; i < 7; i++) {
			const a = -.55 + i * .16 + Math.sin(time * .15 + i) * .02;
			const len = vh * (.7 + i * .04);
			ctx.beginPath();
			ctx.moveTo(sunX, sunY);
			ctx.lineTo(sunX + Math.cos(a - .03) * len, sunY + Math.sin(a - .03) * len);
			ctx.lineTo(sunX + Math.cos(a + .03) * len, sunY + Math.sin(a + .03) * len);
			ctx.closePath();
			ctx.fillStyle = "rgba(255, 244, 210, 1)";
			ctx.fill();
		}
		ctx.restore();
	}
	const mist = ctx.createLinearGradient(0, vh * .42, 0, vh);
	mist.addColorStop(0, "rgba(232, 244, 236, 0)");
	mist.addColorStop(.55, "rgba(210, 230, 214, 0.08)");
	mist.addColorStop(1, "rgba(28, 42, 40, 0.22)");
	ctx.fillStyle = mist;
	ctx.fillRect(0, 0, vw, vh);
	const vig = ctx.createRadialGradient(vw * .5, vh * .42, Math.min(vw, vh) * .2, vw * .5, vh * .46, Math.max(vw, vh) * .78);
	vig.addColorStop(0, "rgba(18, 32, 30, 0)");
	vig.addColorStop(1, "rgba(18, 32, 30, 0.28)");
	ctx.fillStyle = vig;
	ctx.fillRect(0, 0, vw, vh);
}
function drawPines(ctx, pines, offset, groundY) {
	for (const p of pines) {
		const wrapped = ((p.x - offset * (.35 + p.layer * .4)) % (WORLD.width + 280) + (WORLD.width + 280)) % (WORLD.width + 280) - 80;
		ctx.save();
		ctx.translate(wrapped, groundY + 8);
		ctx.fillStyle = p.layer === 0 ? "rgba(22, 36, 32, 0.55)" : "rgba(16, 28, 24, 0.82)";
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(p.w * .5, 0);
		ctx.lineTo(p.w * .28, -p.h * .38);
		ctx.lineTo(p.w * .46, -p.h * .38);
		ctx.lineTo(p.w * .22, -p.h * .68);
		ctx.lineTo(p.w * .38, -p.h * .68);
		ctx.lineTo(p.w * .18, -p.h);
		ctx.lineTo(-p.w * .02, -p.h * .68);
		ctx.lineTo(p.w * .12, -p.h * .68);
		ctx.lineTo(-p.w * .08, -p.h * .38);
		ctx.lineTo(p.w * .08, -p.h * .38);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
}
function drawGround(ctx, offset) {
	const y = WORLD.height - WORLD.groundH;
	const soil = ctx.createLinearGradient(0, y, 0, WORLD.height);
	soil.addColorStop(0, "#2a3d32");
	soil.addColorStop(.18, "#24352c");
	soil.addColorStop(1, "#1a2620");
	ctx.fillStyle = soil;
	ctx.fillRect(0, y + 18, WORLD.width, WORLD.groundH);
	ctx.fillStyle = "#314a3a";
	ctx.fillRect(0, y, WORLD.width, 22);
	ctx.fillStyle = "#3d5c44";
	ctx.fillRect(0, y, WORLD.width, 7);
	ctx.save();
	ctx.translate(-(offset % 56), 0);
	for (let x = -56; x < WORLD.width + 56; x += 56) {
		ctx.fillStyle = "rgba(12, 20, 16, 0.28)";
		ctx.fillRect(x + 8, y + 36, 22, 4);
		ctx.fillRect(x + 30, y + 64, 14, 3);
		ctx.fillStyle = "rgba(210, 230, 180, 0.08)";
		ctx.fillRect(x + 16, y + 48, 8, 3);
	}
	ctx.restore();
	ctx.fillStyle = "rgba(8, 14, 12, 0.35)";
	ctx.fillRect(0, y - 1, WORLD.width, 2);
}
function drawPipe(ctx, pipe) {
	const topH = pipe.gapY - pipe.gapSize / 2;
	const botY = pipe.gapY + pipe.gapSize / 2;
	const botH = WORLD.height - botY;
	column(ctx, pipe.x, -24, pipe.width, topH + 24, true, pipe.seed);
	column(ctx, pipe.x, botY, pipe.width, botH + 24, false, pipe.seed + 17);
}
function column(ctx, x, y, w, h, fromTop, seed) {
	if (h <= 0) return;
	const capH = 22;
	const capOver = 7;
	ctx.save();
	ctx.fillStyle = "rgba(20, 28, 22, 0.22)";
	ctx.fillRect(x + 6, y + 4, w, h);
	const g = ctx.createLinearGradient(x, 0, x + w, 0);
	g.addColorStop(0, COLORS.stoneDark);
	g.addColorStop(.22, COLORS.stone);
	g.addColorStop(.55, COLORS.stoneLight);
	g.addColorStop(.82, COLORS.stoneMid);
	g.addColorStop(1, COLORS.stoneDark);
	ctx.fillStyle = g;
	ctx.fillRect(x, y, w, h);
	ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
	ctx.fillRect(x + 8, y, 6, h);
	ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
	ctx.fillRect(x + w - 9, y, 5, h);
	const rnd = (i) => {
		const n = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
		return n - Math.floor(n);
	};
	ctx.globalAlpha = .55;
	for (let i = 0; i < 4; i++) {
		ctx.fillStyle = i % 2 ? COLORS.moss : COLORS.mossDeep;
		const my = y + 16 + rnd(i) * Math.max(8, h - 40);
		ctx.beginPath();
		ctx.ellipse(x + 10 + rnd(i + 3) * (w - 20), my, 7 + rnd(i + 5) * 8, 4 + rnd(i + 7) * 4, 0, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
	ctx.strokeStyle = "rgba(20, 18, 14, 0.28)";
	ctx.lineWidth = 1;
	for (let i = 0; i < 3; i++) {
		const cx = x + 14 + rnd(i + 11) * (w - 28);
		ctx.beginPath();
		ctx.moveTo(cx, y + 10);
		ctx.lineTo(cx + (rnd(i + 13) - .5) * 8, y + h - 10);
		ctx.stroke();
	}
	const capY = fromTop ? y + h - capH : y;
	ctx.fillStyle = COLORS.stoneMid;
	ctx.fillRect(x - capOver, capY, w + 14, capH);
	ctx.fillStyle = COLORS.stoneLight;
	ctx.fillRect(x - capOver, capY, w + 14, 6);
	ctx.fillStyle = COLORS.stoneDark;
	ctx.fillRect(x - capOver, capY + capH - 5, w + 14, 5);
	if (fromTop) {
		ctx.fillStyle = COLORS.snow;
		ctx.globalAlpha = .85;
		ctx.beginPath();
		ctx.moveTo(x - capOver, capY + 2);
		ctx.lineTo(x - capOver + 10, capY - 4);
		ctx.lineTo(x + w + capOver - 8, capY - 3);
		ctx.lineTo(x + w + capOver, capY + 4);
		ctx.closePath();
		ctx.fill();
		ctx.globalAlpha = 1;
	}
	ctx.restore();
}
function drawBird(ctx, bird) {
	for (const t of bird.trail) {
		ctx.save();
		ctx.globalAlpha = t.a * .22;
		ctx.fillStyle = COLORS.bird;
		ctx.beginPath();
		ctx.ellipse(t.x, t.y, 10, 6, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
	ctx.save();
	ctx.translate(bird.x, bird.y);
	ctx.rotate(bird.rotation);
	ctx.scale(bird.scaleX, bird.scaleY);
	ctx.fillStyle = "rgba(20, 32, 28, 0.16)";
	ctx.beginPath();
	ctx.ellipse(-2, 16, 16, 4, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = COLORS.birdDark;
	ctx.beginPath();
	ctx.moveTo(-16, 2);
	ctx.lineTo(-28, -4);
	ctx.lineTo(-22, 8);
	ctx.lineTo(-28, 10);
	ctx.lineTo(-14, 8);
	ctx.closePath();
	ctx.fill();
	const body = ctx.createRadialGradient(-4, -5, 2, 0, 0, 22);
	body.addColorStop(0, "#fffaf0");
	body.addColorStop(.55, COLORS.bird);
	body.addColorStop(1, "#d9cbb0");
	ctx.fillStyle = body;
	ctx.beginPath();
	ctx.ellipse(0, 1, 18, 13, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.save();
	ctx.translate(-2, 3);
	ctx.rotate(bird.wing);
	ctx.fillStyle = COLORS.birdWing;
	ctx.beginPath();
	ctx.ellipse(-2, 0, 13, 7, -.2, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "#2a3330";
	ctx.beginPath();
	ctx.ellipse(-4, 1, 8, 4, -.15, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
	ctx.fillStyle = COLORS.bird;
	ctx.beginPath();
	ctx.arc(12, -5, 11, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "#fff";
	ctx.beginPath();
	ctx.arc(16, -8, 4.2, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = COLORS.ink;
	ctx.beginPath();
	ctx.arc(17.2, -8, 1.8, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "#fff";
	ctx.beginPath();
	ctx.arc(16.4, -9, .7, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = COLORS.beak;
	ctx.beginPath();
	ctx.moveTo(21, -4);
	ctx.lineTo(32, -1);
	ctx.lineTo(21, 3);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = "#a4532c";
	ctx.beginPath();
	ctx.moveTo(21, -1);
	ctx.lineTo(30, -1);
	ctx.lineTo(21, 2);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = "rgba(255,255,255,0.4)";
	ctx.beginPath();
	ctx.ellipse(-6, -6, 6, 2.4, -.3, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}
function drawParticles(ctx, items) {
	for (const p of items) {
		const a = Math.max(0, p.life / p.maxLife);
		ctx.save();
		ctx.translate(p.x, p.y);
		ctx.rotate(p.rotation);
		ctx.globalAlpha = a;
		ctx.fillStyle = p.color;
		ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
		ctx.restore();
	}
	ctx.globalAlpha = 1;
}
function drawFlash(ctx, vw, vh, amount) {
	if (amount <= .001) return;
	ctx.fillStyle = `rgba(255, 248, 230, ${amount * .22})`;
	ctx.fillRect(0, 0, vw, vh);
}
function drawReadyHint(ctx, x, y, t) {
	const pulse = .55 + Math.sin(t * 3) * .2;
	ctx.save();
	ctx.globalAlpha = pulse;
	ctx.strokeStyle = "rgba(243, 238, 228, 0.7)";
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.arc(x + 36, y - 8, 16 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
	ctx.stroke();
	ctx.restore();
}
var KEY = "skybound.v1";
var VERSION = 1;
var defaults = {
	version: VERSION,
	best: 0,
	muted: false
};
function migrate(raw) {
	const next = {
		...defaults,
		...raw,
		version: VERSION
	};
	next.best = Number.isFinite(next.best) && next.best >= 0 ? Math.floor(next.best) : 0;
	next.muted = Boolean(next.muted);
	return next;
}
function loadSave() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...defaults };
		return migrate(JSON.parse(raw));
	} catch {
		return { ...defaults };
	}
}
function writeSave(patch) {
	const next = migrate({
		...loadSave(),
		...patch,
		version: VERSION
	});
	try {
		localStorage.setItem(KEY, JSON.stringify(next));
	} catch {}
	return next;
}
function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
var Spring = class {
	value;
	velocity = 0;
	constructor(value = 0) {
		this.value = value;
	}
	step(target, stiffness, damping, dt) {
		this.velocity += (target - this.value) * stiffness * dt;
		this.velocity *= Math.exp(-damping * dt);
		this.value += this.velocity * dt;
		return this.value;
	}
};
var SkyboundEngine = class {
	canvas;
	ctx;
	onHud;
	audio;
	landscape = new Image();
	reduced;
	state = "menu";
	score = 0;
	best = 0;
	isNewBest = false;
	runTime = 0;
	lastTime = 0;
	acc = 0;
	raf = 0;
	dpr = 1;
	view = {
		scale: 1,
		ox: 0,
		oy: 0
	};
	hitStop = 0;
	flash = 0;
	ken = 0;
	worldTime = 0;
	scroll = 0;
	overAt = 0;
	running = false;
	bird = {
		x: 0,
		y: 0,
		vy: 0,
		rotation: 0,
		targetRot: 0,
		wingTime: 0,
		flapPulse: 0,
		scaleX: new Spring(1),
		scaleY: new Spring(1),
		trail: []
	};
	pipes = [];
	particles = [];
	pines = [];
	shake = 0;
	shakeX = 0;
	shakeY = 0;
	groundOffset = 0;
	unbind = [];
	constructor(canvas, onHud, reduced) {
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
			if (this.worldTime - this.overAt > .5) this.retry();
			return;
		}
		if (this.state === "menu") {
			this.beginRun();
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
	beginRun() {
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
	resetBird(idle) {
		this.bird.x = WORLD.width * .26;
		this.bird.y = WORLD.height * (idle ? .46 : .48);
		this.bird.vy = 0;
		this.bird.rotation = 0;
		this.bird.targetRot = 0;
		this.bird.wingTime = 0;
		this.bird.flapPulse = 0;
		this.bird.scaleX = new Spring(1);
		this.bird.scaleY = new Spring(1);
		this.bird.trail = [];
	}
	seedPines() {
		this.pines = [];
		for (let i = 0; i < 18; i++) this.pines.push({
			x: i * 70 + i % 3 * 12,
			h: 46 + i * 37 % 54,
			w: 28 + i * 13 % 18,
			layer: i % 3 === 0 ? 0 : 1
		});
	}
	bind() {
		const onKey = (e) => {
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
		const onPointer = (e) => {
			if (e.button !== 0 && e.pointerType === "mouse") return;
			if (e.target?.closest?.("button, a, [data-ui]")) return;
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
		this.unbind.push(() => window.removeEventListener("keydown", onKey), () => this.canvas.removeEventListener("pointerdown", onPointer), () => window.removeEventListener("resize", onResize), () => window.removeEventListener("orientationchange", onResize), () => window.removeEventListener("blur", onBlur), () => document.removeEventListener("visibilitychange", onVis));
	}
	resize() {
		const vw = Math.max(1, window.innerWidth);
		const vh = Math.max(1, window.innerHeight);
		const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
		this.dpr = dpr;
		const isLandscape = vw / vh >= .88;
		const scale = isLandscape ? vh / WORLD.height : vw / WORLD.minWidth;
		WORLD.width = Math.max(WORLD.minWidth, vw / scale);
		this.canvas.width = Math.max(1, Math.floor(vw * dpr));
		this.canvas.height = Math.max(1, Math.floor(vh * dpr));
		this.canvas.style.width = `${vw}px`;
		this.canvas.style.height = `${vh}px`;
		this.view.scale = scale;
		this.view.ox = 0;
		this.view.oy = isLandscape ? 0 : (vh - WORLD.height * scale) / 2;
		this.bird.x = WORLD.width * .26;
		this.seedPines();
	}
	loop = (timestamp) => {
		if (!this.running) return;
		const raw = this.lastTime ? (timestamp - this.lastTime) / 1e3 : CONFIG.step;
		this.lastTime = timestamp;
		const dt = clamp(raw, 0, .05);
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
	difficulty() {
		const t = Math.max(0, this.score - CONFIG.difficultyStart);
		return {
			speed: Math.min(CONFIG.worldSpeedMax, CONFIG.pipeSpeed * (1 + t * CONFIG.difficultyRate)),
			gap: Math.max(CONFIG.minGap, CONFIG.baseGap - t * 1.2)
		};
	}
	update(dt) {
		this.worldTime += dt;
		this.ken = this.reduced ? 0 : (Math.sin(this.worldTime * .12) + 1) * .5;
		this.shake = Math.max(0, this.shake - dt * 4.4);
		const m = this.shake * this.shake;
		this.shakeX = this.reduced ? 0 : (Math.random() - .5) * 12 * m;
		this.shakeY = this.reduced ? 0 : (Math.random() - .5) * 10 * m;
		this.flash = Math.max(0, this.flash - dt * 3.2);
		this.hitStop = Math.max(0, this.hitStop - dt);
		if (this.hitStop > 0 && this.state === "playing") {
			this.updateParticles(dt * .3);
			return;
		}
		const speed = this.state === "menu" || this.state === "paused" ? 28 : this.state === "over" ? CONFIG.pipeSpeed * .2 : this.difficulty().speed;
		if (this.state === "playing" || this.state === "menu") {
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
	updateBird(dt) {
		const b = this.bird;
		const playing = this.state === "playing";
		const over = this.state === "over";
		b.wingTime += dt * (playing ? 13 : 6.2);
		if (!playing && !over) {
			b.y += Math.sin(b.wingTime * .65) * 10 * dt;
			b.targetRot = -.08 + Math.sin(b.wingTime * .35) * .04;
		} else {
			b.vy += CONFIG.gravity * dt;
			b.vy = Math.min(b.vy, CONFIG.maxFall);
			b.y += b.vy * dt;
			b.targetRot = clamp(b.vy / 520, -1, 1) * 1.15;
			if (over) b.targetRot = Math.min(1.4, b.targetRot + .25);
		}
		b.rotation += (b.targetRot - b.rotation) * Math.min(1, dt * 10.5);
		b.flapPulse = Math.max(0, b.flapPulse - dt * 5.8);
		b.scaleX.step(1 - b.flapPulse * .1, 170, 18, dt);
		b.scaleY.step(1 + b.flapPulse * .14, 170, 18, dt);
		if (playing) {
			b.trail.unshift({
				x: b.x - 8,
				y: b.y,
				a: 1
			});
			if (b.trail.length > CONFIG.maxTrail) b.trail.pop();
			for (const t of b.trail) t.a *= Math.exp(-8 * dt);
		} else b.trail = [];
	}
	flap(playSound) {
		if (this.state !== "playing") return;
		this.bird.vy = CONFIG.flapImpulse;
		this.bird.flapPulse = 1;
		this.bird.targetRot = -.46;
		this.spawn(this.bird.x - 12, this.bird.y + 10, this.reduced ? 2 : 6, [COLORS.bird, "#fff7e8"], .5);
		this.shake = Math.max(this.shake, .16);
		if (playSound) this.audio.flap();
	}
	updatePipes(dt, speed) {
		const { gap } = this.difficulty();
		for (const p of this.pipes) p.x -= speed * dt;
		if (!last) {
			if (this.runTime > .72) this.spawnPipe(WORLD.width + 48, gap);
		} else if (last.x < WORLD.width - CONFIG.pipeSpacing) this.spawnPipe(last.x + CONFIG.pipeSpacing, gap);
		this.pipes = this.pipes.filter((p) => p.x + p.width > -40);
	}
	spawnPipe(x, gapSize) {
		const minC = WORLD.ceilingH + 78 + gapSize / 2;
		const maxC = WORLD.height - WORLD.groundH - 78 - gapSize / 2;
		const gapY = minC + Math.random() * Math.max(1, maxC - minC);
		this.pipes.push({
			x,
			gapY,
			gapSize,
			width: CONFIG.pipeWidth,
			passed: false,
			seed: Math.random() * 1e3 | 0
		});
	}
	hitbox() {
		return {
			x: this.bird.x - CONFIG.birdW / 2 + CONFIG.hitInsetX,
			y: this.bird.y - CONFIG.birdH / 2 + CONFIG.hitInsetY,
			w: CONFIG.birdW - CONFIG.hitInsetX * 2,
			h: CONFIG.birdH - CONFIG.hitInsetY * 2
		};
	}
	collide() {
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
	addScore() {
		this.score += 1;
		this.spawn(this.bird.x + 10, this.bird.y - 8, this.reduced ? 2 : 7, ["#f7f1e4", "#dce8c8"], .65);
		this.flash = Math.min(1, this.flash + .18);
		this.audio.score();
		this.emit();
	}
	finish() {
		if (this.state !== "playing") return;
		this.state = "over";
		this.overAt = this.worldTime;
		this.audio.hit();
		this.shake = .95;
		this.flash = .7;
		this.hitStop = .07;
		this.spawn(this.bird.x, this.bird.y, this.reduced ? 6 : 18, [
			COLORS.beak,
			COLORS.bird,
			COLORS.stoneLight
		], 1.2);
		if (this.score > this.best) {
			this.best = this.score;
			this.isNewBest = true;
			writeSave({ best: this.best });
			this.audio.best();
		}
		this.emit();
	}
	spawn(x, y, count, palette, power) {
		const n = Math.min(count, CONFIG.maxParticles - this.particles.length);
		for (let i = 0; i < n; i++) {
			const ang = Math.random() * Math.PI * 2;
			const spd = (28 + Math.random() * 110) * power;
			const life = .26 + Math.random() * .36;
			this.particles.push({
				x,
				y,
				vx: Math.cos(ang) * spd,
				vy: Math.sin(ang) * spd,
				life,
				maxLife: life,
				size: 1.4 + Math.random() * 3.4,
				color: palette[Math.random() * palette.length | 0] ?? COLORS.paper,
				gravity: 70 + Math.random() * 130,
				rotation: Math.random() * 6,
				spin: (Math.random() - .5) * 8
			});
		}
	}
	updateParticles(dt) {
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
	birdView() {
		return {
			x: this.bird.x,
			y: this.bird.y,
			rotation: this.bird.rotation,
			wing: Math.sin(this.bird.wingTime) * .34 - this.bird.flapPulse * .28,
			scaleX: this.bird.scaleX.value,
			scaleY: this.bird.scaleY.value,
			trail: this.bird.trail
		};
	}
	render() {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const ctx = this.ctx;
		ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = "high";
		ctx.clearRect(0, 0, vw, vh);
		const zoom = this.reduced ? 1.05 : 1.05 + this.ken * .04;
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
	emit() {
		this.onHud({
			state: this.state,
			score: this.score,
			best: this.best,
			isNewBest: this.isNewBest,
			muted: this.audio.muted
		});
	}
};
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var INITIAL = {
	state: "menu",
	score: 0,
	best: 0,
	isNewBest: false,
	muted: false
};
function usePrefersReducedMotion() {
	const [reduced, setReduced] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(mq.matches);
		const onChange = () => setReduced(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);
	return reduced;
}
function Skybound() {
	const canvasRef = (0, import_react.useRef)(null);
	const engineRef = (0, import_react.useRef)(null);
	const reduced = usePrefersReducedMotion();
	const [hud, setHud] = (0, import_react.useState)(INITIAL);
	const [intro, setIntro] = (0, import_react.useState)("in");
	const [scoreBump, setScoreBump] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const engine = new SkyboundEngine(canvas, setHud, reduced);
		engineRef.current = engine;
		engine.start();
		return () => {
			engine.destroy();
			engineRef.current = null;
		};
	}, [reduced]);
	(0, import_react.useEffect)(() => {
		setScoreBump((n) => n + 1);
	}, [hud.score]);
	(0, import_react.useEffect)(() => {
		const ms = reduced ? 700 : 5200;
		const t = window.setTimeout(() => setIntro((s) => s === "in" ? "out" : s), ms);
		return () => window.clearTimeout(t);
	}, [reduced]);
	(0, import_react.useEffect)(() => {
		if (intro !== "out") return;
		const t = window.setTimeout(() => setIntro("done"), reduced ? 180 : 520);
		return () => window.clearTimeout(t);
	}, [intro, reduced]);
	const skipIntro = (0, import_react.useCallback)(() => {
		engineRef.current?.unlockAudio();
		setIntro((s) => s === "done" ? s : "out");
	}, []);
	const fly = (0, import_react.useCallback)(() => {
		engineRef.current?.unlockAudio();
		engineRef.current?.requestFlap();
	}, []);
	const onMute = (0, import_react.useCallback)((e) => {
		e.stopPropagation();
		engineRef.current?.unlockAudio();
		engineRef.current?.toggleMute();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "game-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "game-canvas",
				"aria-label": "Skybound flight"
			}),
			intro !== "done" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntroScreen, {
				phase: intro,
				reduced,
				onSkip: skipIntro
			}),
			intro === "done" && hud.state === "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuScreen, {
				best: hud.best,
				muted: hud.muted,
				onFly: fly,
				onMute
			}),
			(hud.state === "playing" || hud.state === "paused") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {
				score: hud.score,
				bump: scoreBump,
				muted: hud.muted,
				onPause: () => engineRef.current?.pause(),
				onMute
			}),
			hud.state === "paused" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PauseScreen, {
				onResume: () => engineRef.current?.resume(),
				onMenu: () => engineRef.current?.toMenu()
			}),
			hud.state === "over" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverScreen, {
				score: hud.score,
				best: hud.best,
				isNewBest: hud.isNewBest,
				onRetry: () => engineRef.current?.retry(),
				onMenu: () => engineRef.current?.toMenu()
			})
		]
	});
}
function IntroScreen({ phase, reduced, onSkip }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("intro", phase === "out" && "is-leaving", reduced && "is-static"),
		"aria-label": "Opening",
		onPointerDown: onSkip,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				className: "intro-video",
				autoPlay: true,
				muted: true,
				loop: true,
				playsInline: true,
				preload: "auto",
				poster: LANDSCAPE_SRC,
				src: INTRO_VIDEO_SRC,
				onError: (e) => {
					e.currentTarget.style.display = "none";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "intro-still",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "intro-veil" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "intro-sun" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "intro-copy",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "intro-kicker",
						children: "A highland flight"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "intro-title",
						"aria-label": "Skybound",
						children: "SKYBOUND".split("").map((ch, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ch }, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "intro-rule" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "intro-tag",
						children: "One tap. One more flight."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "intro-skip",
				"data-ui": true,
				onPointerDown: (e) => e.stopPropagation(),
				onClick: onSkip,
				children: "Skip"
			})
		]
	});
}
function MenuScreen({ best, muted, onFly, onMute }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "overlay-screen menu-screen",
		"aria-label": "Main menu",
		onPointerDown: onFly,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "menu-brand",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "menu-kicker",
					children: "One tap. One more flight."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "menu-title",
					children: "Skybound"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "menu-actions",
				"data-ui": true,
				onPointerDown: (e) => e.stopPropagation(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "sb-btn sb-btn-primary",
					onClick: onFly,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
						className: "size-4 ml-0.5",
						strokeWidth: 2.2,
						"aria-hidden": "true"
					}), "Fly"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "menu-best",
					children: ["Best ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: best })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
				label: muted ? "Unmute" : "Mute",
				onClick: onMute,
				className: "corner-btn",
				children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" })
			})
		]
	});
}
function Hud({ score, bump, muted, onPause, onMute }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hud",
		"aria-live": "polite",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "hud-score",
			children: score
		}, bump), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "hud-tools",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
				label: muted ? "Unmute" : "Mute",
				onClick: onMute,
				children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
				label: "Pause",
				onClick: onPause,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-5" })
			})]
		})]
	});
}
function PauseScreen({ onResume, onMenu }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "overlay-screen dim",
		"aria-label": "Paused",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "panel-kicker",
					children: "Hold"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "panel-title",
					children: "Paused"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "sb-btn sb-btn-primary",
					onClick: onResume,
					children: "Resume"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "sb-btn sb-btn-ghost",
					onClick: onMenu,
					children: "Menu"
				})
			]
		})
	});
}
function OverScreen({ score, best, isNewBest, onRetry, onMenu }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "overlay-screen dim",
		"aria-label": "Flight ended",
		onPointerDown: onRetry,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel",
			"data-ui": true,
			onPointerDown: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "panel-kicker",
					children: "Flight ended"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "panel-title",
					children: "Grounded"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "stat-grid",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Score" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: score })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Best" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: best })] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("new-best", isNewBest && "show"),
					children: isNewBest ? "New best" : "\xA0"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "sb-btn sb-btn-primary",
					"data-ui": true,
					onClick: onRetry,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
						className: "size-4",
						strokeWidth: 2.2,
						"aria-hidden": "true"
					}), "Fly again"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "sb-btn sb-btn-ghost",
					onClick: onMenu,
					children: "Menu"
				})
			]
		})
	});
}
function IconBtn({ label, onClick, className, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: cn("icon-btn", className),
		"aria-label": label,
		"data-ui": true,
		onPointerDown: (e) => e.stopPropagation(),
		onClick,
		children
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skybound, {});
}
//#endregion
export { Home as component };
