import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { SkyboundEngine } from "@/game/engine";
import { INTRO_VIDEO_SRC, LANDSCAPE_SRC, type HudSnapshot } from "@/game/config";
import { cn } from "@/lib/utils";

const INITIAL: HudSnapshot = {
  state: "menu",
  score: 0,
  best: 0,
  isNewBest: false,
  muted: false,
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function Skybound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SkyboundEngine | null>(null);
  const reduced = usePrefersReducedMotion();
  const [hud, setHud] = useState<HudSnapshot>(INITIAL);
  const [intro, setIntro] = useState<"in" | "out" | "done">("in");
  const [scoreBump, setScoreBump] = useState(0);

  useEffect(() => {
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

  useEffect(() => {
    setScoreBump((n) => n + 1);
  }, [hud.score]);

  useEffect(() => {
    const ms = reduced ? 700 : 5200;
    const t = window.setTimeout(() => setIntro((s) => (s === "in" ? "out" : s)), ms);
    return () => window.clearTimeout(t);
  }, [reduced]);

  useEffect(() => {
    if (intro !== "out") return;
    const t = window.setTimeout(() => setIntro("done"), reduced ? 180 : 520);
    return () => window.clearTimeout(t);
  }, [intro, reduced]);

  const skipIntro = useCallback(() => {
    engineRef.current?.unlockAudio();
    setIntro((s) => (s === "done" ? s : "out"));
  }, []);

  const fly = useCallback(() => {
    engineRef.current?.unlockAudio();
    engineRef.current?.requestFlap();
  }, []);

  const onMute = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    engineRef.current?.unlockAudio();
    engineRef.current?.toggleMute();
  }, []);

  return (
    <div className="game-shell">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        aria-label="Skybound flight"
      />

      {intro !== "done" && (
        <IntroScreen phase={intro} reduced={reduced} onSkip={skipIntro} />
      )}

      {intro === "done" && hud.state === "menu" && (
        <MenuScreen best={hud.best} muted={hud.muted} onFly={fly} onMute={onMute} />
      )}

      {(hud.state === "playing" || hud.state === "paused") && (
        <Hud
          score={hud.score}
          bump={scoreBump}
          muted={hud.muted}
          onPause={() => engineRef.current?.pause()}
          onMute={onMute}
        />
      )}

      {hud.state === "paused" && (
        <PauseScreen
          onResume={() => engineRef.current?.resume()}
          onMenu={() => engineRef.current?.toMenu()}
        />
      )}

      {hud.state === "over" && (
        <OverScreen
          score={hud.score}
          best={hud.best}
          isNewBest={hud.isNewBest}
          onRetry={() => engineRef.current?.retry()}
          onMenu={() => engineRef.current?.toMenu()}
        />
      )}
    </div>
  );
}

function IntroScreen({
  phase,
  reduced,
  onSkip,
}: {
  phase: "in" | "out";
  reduced: boolean;
  onSkip: () => void;
}) {
  return (
    <section
      className={cn("intro", phase === "out" && "is-leaving", reduced && "is-static")}
      aria-label="Opening"
      onPointerDown={onSkip}
    >
      <video
        className="intro-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={LANDSCAPE_SRC}
        src={INTRO_VIDEO_SRC}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div className="intro-still" aria-hidden="true" />
      <div className="intro-veil" />
      <div className="intro-sun" />

      <div className="intro-copy">
        <p className="intro-kicker">A highland flight</p>
        <h1 className="intro-title" aria-label="Skybound">
          {"SKYBOUND".split("").map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </h1>
        <div className="intro-rule" />
        <p className="intro-tag">One tap. One more flight.</p>
      </div>

      <button type="button" className="intro-skip" data-ui onPointerDown={(e) => e.stopPropagation()} onClick={onSkip}>
        Skip
      </button>
    </section>
  );
}

function MenuScreen({
  best,
  muted,
  onFly,
  onMute,
}: {
  best: number;
  muted: boolean;
  onFly: () => void;
  onMute: (e: MouseEvent) => void;
}) {
  return (
    <section className="overlay-screen menu-screen" aria-label="Main menu" onPointerDown={onFly}>
      <div className="menu-brand">
        <p className="menu-kicker">One tap. One more flight.</p>
        <h1 className="menu-title">Skybound</h1>
      </div>

      <div className="menu-actions" data-ui onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" className="sb-btn sb-btn-primary" onClick={onFly}>
          <Play className="size-4 ml-0.5" strokeWidth={2.2} aria-hidden="true" />
          Fly
        </button>
        <p className="menu-best">
          Best <strong>{best}</strong>
        </p>
      </div>

      <IconBtn label={muted ? "Unmute" : "Mute"} onClick={onMute} className="corner-btn">
        {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </IconBtn>
    </section>
  );
}

function Hud({
  score,
  bump,
  muted,
  onPause,
  onMute,
}: {
  score: number;
  bump: number;
  muted: boolean;
  onPause: () => void;
  onMute: (e: MouseEvent) => void;
}) {
  return (
    <div className="hud" aria-live="polite">
      <div key={bump} className="hud-score">
        {score}
      </div>
      <div className="hud-tools">
        <IconBtn label={muted ? "Unmute" : "Mute"} onClick={onMute}>
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </IconBtn>
        <IconBtn label="Pause" onClick={onPause}>
          <Pause className="size-5" />
        </IconBtn>
      </div>
    </div>
  );
}

function PauseScreen({ onResume, onMenu }: { onResume: () => void; onMenu: () => void }) {
  return (
    <section className="overlay-screen dim" aria-label="Paused">
      <div className="panel">
        <p className="panel-kicker">Hold</p>
        <h2 className="panel-title">Paused</h2>
        <button type="button" className="sb-btn sb-btn-primary" onClick={onResume}>
          Resume
        </button>
        <button type="button" className="sb-btn sb-btn-ghost" onClick={onMenu}>
          Menu
        </button>
      </div>
    </section>
  );
}

function OverScreen({
  score,
  best,
  isNewBest,
  onRetry,
  onMenu,
}: {
  score: number;
  best: number;
  isNewBest: boolean;
  onRetry: () => void;
  onMenu: () => void;
}) {
  return (
    <section className="overlay-screen dim" aria-label="Flight ended" onPointerDown={onRetry}>
      <div className="panel" data-ui onPointerDown={(e) => e.stopPropagation()}>
        <p className="panel-kicker">Flight ended</p>
        <h2 className="panel-title">Grounded</h2>
        <div className="stat-grid">
          <div>
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div>
            <span>Best</span>
            <strong>{best}</strong>
          </div>
        </div>
        <p className={cn("new-best", isNewBest && "show")}>{isNewBest ? "New best" : "\u00a0"}</p>
        <button type="button" className="sb-btn sb-btn-primary" data-ui onClick={onRetry}>
          <RotateCcw className="size-4" strokeWidth={2.2} aria-hidden="true" />
          Fly again
        </button>
        <button type="button" className="sb-btn sb-btn-ghost" onClick={onMenu}>
          Menu
        </button>
      </div>
    </section>
  );
}

function IconBtn({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn("icon-btn", className)}
      aria-label={label}
      data-ui
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
