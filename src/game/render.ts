import { COLORS, CONFIG, WORLD, type Particle, type Pine, type Pipe } from "./config";

export type BirdView = {
  x: number;
  y: number;
  rotation: number;
  wing: number;
  scaleX: number;
  scaleY: number;
  trail: { x: number; y: number; a: number }[];
};

export function drawLandscape(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  vw: number,
  vh: number,
  scroll: number,
  zoom: number,
) {
  if (!img.naturalWidth) {
    const g = ctx.createLinearGradient(0, 0, 0, vh);
    g.addColorStop(0, "#8ec8e8");
    g.addColorStop(0.45, "#9ecf9a");
    g.addColorStop(1, "#3d6b4a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw, vh);
    return;
  }

  const cover = Math.max(vw / img.naturalWidth, vh / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * cover;
  const dh = img.naturalHeight * cover;
  const period = dw;
  const pan = ((scroll * 0.14) % period + period) % period;
  const ox = (vw - dw) / 2;
  const oy = (vh - dh) / 2 - vh * 0.02;
  ctx.drawImage(img, ox - pan, oy, dw, dh);
  ctx.drawImage(img, ox - pan + dw, oy, dw, dh);
}

export function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  time: number,
  reduced: boolean,
) {
  const sunX = vw * 0.16;
  const sunY = vh * 0.16;
  if (!reduced) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, Math.max(vw, vh) * 0.55);
    glow.addColorStop(0, "rgba(255, 236, 180, 0.28)");
    glow.addColorStop(0.22, "rgba(255, 214, 140, 0.1)");
    glow.addColorStop(1, "rgba(255, 214, 140, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, vw, vh);

    ctx.globalAlpha = 0.07;
    for (let i = 0; i < 7; i++) {
      const a = -0.55 + i * 0.16 + Math.sin(time * 0.15 + i) * 0.02;
      const len = vh * (0.7 + i * 0.04);
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(a - 0.03) * len, sunY + Math.sin(a - 0.03) * len);
      ctx.lineTo(sunX + Math.cos(a + 0.03) * len, sunY + Math.sin(a + 0.03) * len);
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 244, 210, 1)";
      ctx.fill();
    }
    ctx.restore();
  }

  const mist = ctx.createLinearGradient(0, vh * 0.42, 0, vh);
  mist.addColorStop(0, "rgba(232, 244, 236, 0)");
  mist.addColorStop(0.55, "rgba(210, 230, 214, 0.08)");
  mist.addColorStop(1, "rgba(28, 42, 40, 0.22)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, vw, vh);

  const vig = ctx.createRadialGradient(vw * 0.5, vh * 0.42, Math.min(vw, vh) * 0.2, vw * 0.5, vh * 0.46, Math.max(vw, vh) * 0.78);
  vig.addColorStop(0, "rgba(18, 32, 30, 0)");
  vig.addColorStop(1, "rgba(18, 32, 30, 0.28)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, vw, vh);
}

export function drawPines(
  ctx: CanvasRenderingContext2D,
  pines: Pine[],
  offset: number,
  groundY: number,
) {
  for (const p of pines) {
    const x = p.x - offset * (0.35 + p.layer * 0.4);
    const wrapped = ((x % (WORLD.width + 280)) + (WORLD.width + 280)) % (WORLD.width + 280) - 80;
    ctx.save();
    ctx.translate(wrapped, groundY + 8);
    ctx.fillStyle = p.layer === 0 ? "rgba(22, 36, 32, 0.55)" : "rgba(16, 28, 24, 0.82)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(p.w * 0.5, 0);
    ctx.lineTo(p.w * 0.28, -p.h * 0.38);
    ctx.lineTo(p.w * 0.46, -p.h * 0.38);
    ctx.lineTo(p.w * 0.22, -p.h * 0.68);
    ctx.lineTo(p.w * 0.38, -p.h * 0.68);
    ctx.lineTo(p.w * 0.18, -p.h);
    ctx.lineTo(-p.w * 0.02, -p.h * 0.68);
    ctx.lineTo(p.w * 0.12, -p.h * 0.68);
    ctx.lineTo(-p.w * 0.08, -p.h * 0.38);
    ctx.lineTo(p.w * 0.08, -p.h * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
  const y = WORLD.height - WORLD.groundH;
  const soil = ctx.createLinearGradient(0, y, 0, WORLD.height);
  soil.addColorStop(0, "#2a3d32");
  soil.addColorStop(0.18, "#24352c");
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

export function drawPipe(ctx: CanvasRenderingContext2D, pipe: Pipe) {
  const topH = pipe.gapY - pipe.gapSize / 2;
  const botY = pipe.gapY + pipe.gapSize / 2;
  const botH = WORLD.height - botY;
  column(ctx, pipe.x, -24, pipe.width, topH + 24, true, pipe.seed);
  column(ctx, pipe.x, botY, pipe.width, botH + 24, false, pipe.seed + 17);
}

function column(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fromTop: boolean,
  seed: number,
) {
  if (h <= 0) return;
  const capH = 22;
  const capOver = 7;
  ctx.save();

  ctx.fillStyle = "rgba(20, 28, 22, 0.22)";
  ctx.fillRect(x + 6, y + 4, w, h);

  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, COLORS.stoneDark);
  g.addColorStop(0.22, COLORS.stone);
  g.addColorStop(0.55, COLORS.stoneLight);
  g.addColorStop(0.82, COLORS.stoneMid);
  g.addColorStop(1, COLORS.stoneDark);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fillRect(x + 8, y, 6, h);
  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  ctx.fillRect(x + w - 9, y, 5, h);

  const rnd = (i: number) => {
    const n = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };
  ctx.globalAlpha = 0.55;
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
    ctx.lineTo(cx + (rnd(i + 13) - 0.5) * 8, y + h - 10);
    ctx.stroke();
  }

  const capY = fromTop ? y + h - capH : y;
  ctx.fillStyle = COLORS.stoneMid;
  ctx.fillRect(x - capOver, capY, w + capOver * 2, capH);
  ctx.fillStyle = COLORS.stoneLight;
  ctx.fillRect(x - capOver, capY, w + capOver * 2, 6);
  ctx.fillStyle = COLORS.stoneDark;
  ctx.fillRect(x - capOver, capY + capH - 5, w + capOver * 2, 5);

  if (fromTop) {
    ctx.fillStyle = COLORS.snow;
    ctx.globalAlpha = 0.85;
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

export function drawBird(ctx: CanvasRenderingContext2D, bird: BirdView) {
  for (const t of bird.trail) {
    ctx.save();
    ctx.globalAlpha = t.a * 0.22;
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
  body.addColorStop(0.55, COLORS.bird);
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
  ctx.ellipse(-2, 0, 13, 7, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a3330";
  ctx.beginPath();
  ctx.ellipse(-4, 1, 8, 4, -0.15, 0, Math.PI * 2);
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
  ctx.arc(16.4, -9, 0.7, 0, Math.PI * 2);
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
  ctx.ellipse(-6, -6, 6, 2.4, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawParticles(ctx: CanvasRenderingContext2D, items: Particle[]) {
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

export function drawFlash(ctx: CanvasRenderingContext2D, vw: number, vh: number, amount: number) {
  if (amount <= 0.001) return;
  ctx.fillStyle = `rgba(255, 248, 230, ${amount * 0.22})`;
  ctx.fillRect(0, 0, vw, vh);
}

export function drawReadyHint(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const pulse = 0.55 + Math.sin(t * 3) * 0.2;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = "rgba(243, 238, 228, 0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + 36, y - 8, 16 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
