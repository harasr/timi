export const WORLD = {
  width: 360,
  height: 640,
  minWidth: 320,
  groundH: 118,
  ceilingH: 16,
};

export const CONFIG = {
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
  difficultyRate: 0.015,
  maxParticles: 128,
  maxTrail: 10,
  step: 1 / 60,
  flapBuffer: 0.12,
} as const;

export const COLORS = {
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
  paper: "#f3eee4",
} as const;

export const LANDSCAPE_SRC = "/world/highlands.jpg";
export const INTRO_VIDEO_SRC = "/world/intro.mp4";

export type EngineState = "menu" | "playing" | "paused" | "over";

export type HudSnapshot = {
  state: EngineState;
  score: number;
  best: number;
  isNewBest: boolean;
  muted: boolean;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  rotation: number;
  spin: number;
};

export type Pipe = {
  x: number;
  gapY: number;
  gapSize: number;
  width: number;
  passed: boolean;
  seed: number;
};

export type Pine = {
  x: number;
  h: number;
  w: number;
  layer: number;
};
