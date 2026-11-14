import { audio } from "./audio";
import { t, fmtNum } from "../i18n/i18n";
import type { SavedRun } from "./runSave";
import { clamp, damp, lerp } from "../utils/math";
import { CANVAS_COLORS } from "./palette";
import { weightedPick } from "./spawn";
import {
  MODES,
  comboWindowFor,
  jarBonusFor,
  levelForCatches,
  multiplierForCombo,
  type ModeId,
} from "./modes";

/* ------------------------------------------------------------------ types */

export type Phase = "menu" | "playing" | "paused" | "gameover";

export interface RunStats {
  score: number;
  catches: number;
  bestCombo: number;
  level: number;
  jars: number;
  sliced: number;
  time: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jx: number;
  jy: number;
  joy: boolean;
}

type ItemKind =
  | "ca"
  | "ot"
  | "toi"
  | "gung"
  | "muoi"
  | "dua"
  | "moc"
  | "ruoi"
  | "vang"
  | "othiem"
  | "da"
  | "cavang"
  | "toivang"
  | "sau";

export type { ItemKind };

interface ItemDef {
  r: number;
  pts: number;
  speed: number;
  hazard?: boolean;
  power?: "heal" | "frenzy" | "slow" | "shield";
  /** Extra fill contributed toward a full jar when caught */
  fillBoost?: number;
  color: string;
  color2: string;
  label: string;
  weight: (lvl: number) => number;
}

interface Item {
  kind: ItemKind;
  def: ItemDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  spin: number;
  sway: number;
  swayF: number;
  mag: number;
  born: number;
  dead: boolean;
  deco: boolean;
  /** Pre-generated mould spots (stable per item, no per-frame flicker) */
  spots?: { x: number; y: number; r: number }[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: "dot" | "shard" | "spark" | "drop" | "confetti";
  rot: number;
  vr: number;
  grav: number;
  drag: number;
}

interface Popup {
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  text: string;
  color: string;
  size: number;
}

interface Ring {
  x: number;
  y: number;
  r: number;
  to: number;
  life: number;
  max: number;
  color: string;
  width: number;
}

interface Decal {
  x: number;
  y: number;
  rx: number;
  ry: number;
  life: number;
  max: number;
  color: string;
  rot: number;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  a: number;
  wob: number;
}

/* ------------------------------------------------------------------ defs */

const DEFS_RECORD: Record<ItemKind, ItemDef> = {
  ca: {
    r: 13, pts: 10, speed: 1, color: "#e9f0c9", color2: "#a9c46a", label: "CÀ PHÁO",
    weight: () => 3.1,
  },
  ot: {
    r: 12, pts: 15, speed: 1.18, color: "#e63b2e", color2: "#8f1a1c", label: "ỚT",
    weight: () => 2.6,
  },
  toi: {
    r: 13, pts: 10, speed: 0.92, color: "#f6ecd9", color2: "#c9b193", label: "TỎI",
    weight: () => 2.2,
  },
  gung: {
    r: 14, pts: 12, speed: 0.88, color: "#e2b267", color2: "#a9743a", label: "GỪNG",
    weight: (l) => (l >= 2 ? 2.0 : 0),
  },
  muoi: {
    r: 10, pts: 8, speed: 1.32, color: "#ffffff", color2: "#cfe3ea", label: "MUỐI",
    weight: () => 2.4,
  },
  dua: {
    r: 15, pts: 18, speed: 0.82, color: "#8cc63f", color2: "#3f7d2a", label: "CẢI",
    weight: (l) => (l >= 3 ? 1.8 : 0),
  },
  moc: {
    r: 15, pts: 25, speed: 0.8, hazard: true, color: "#7d8f6a", color2: "#3b4a33", label: "MỐC",
    weight: (l) => 0.9 + l * 0.42,
  },
  ruoi: {
    r: 12, pts: 30, speed: 1.5, hazard: true, color: "#2c2f3a", color2: "#9aa4b8", label: "RUỒI",
    weight: (l) => (l >= 3 ? 0.4 + l * 0.28 : 0),
  },
  vang: {
    r: 13, pts: 120, speed: 1.05, power: "heal", color: "#ffc94a", color2: "#d4850a", label: "MUỐI VÀNG",
    weight: () => 0.5,
  },
  othiem: {
    r: 12, pts: 60, speed: 1.1, power: "frenzy", color: "#ff6a4d", color2: "#b81f22", label: "ỚT HIỂM",
    weight: () => 0.42,
  },
  da: {
    r: 13, pts: 60, speed: 1.0, power: "slow", color: "#a8e6ff", color2: "#3d8fb8", label: "ĐÁ LẠNH",
    weight: () => 0.4,
  },
  cavang: {
    r: 15, pts: 45, speed: 0.9, fillBoost: 0.16, color: "#ffd766", color2: "#b8770e", label: "CẢI VÀNG",
    weight: (l) => (l >= 2 ? 1.05 : 0),
  },
  toivang: {
    r: 13, pts: 30, speed: 0.98, power: "shield", color: "#ffe9a8", color2: "#c79b2d", label: "TỎI VÀNG",
    weight: (l) => 0.32 + l * 0.02,
  },
  sau: {
    r: 14, pts: 40, speed: 0.72, hazard: true, color: "#9dbb4e", color2: "#4a5d1e", label: "SÂU RAU",
    weight: (l) => (l >= 4 ? 0.55 + l * 0.3 : 0),
  },
};

const DEFS = DEFS_RECORD;
const KINDS = Object.keys(DEFS_RECORD) as ItemKind[];
export { DEFS, KINDS };

const C = CANVAS_COLORS;

/* ------------------------------------------------------------------ utils */

const TAU = Math.PI * 2;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// roundRect fallback for older engines
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    this: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number | number[] = 0,
  ) {
    const rad = Math.min(typeof r === "number" ? r : r[0] ?? 0, Math.abs(w) / 2, Math.abs(h) / 2);
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}

/* ------------------------------------------------------------------ game */

export class LoCheoGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private destroyed = false;

  w = 800;
  h = 600;
  private dpr = 1;
  private S = 1;
  private SP = 1;

  phase: Phase = "menu";
  stats: RunStats = { score: 0, catches: 0, bestCombo: 0, level: 1, jars: 0, sliced: 0, time: 0 };
  best = 0;
  /** Selected game mode — applied on the next run */
  mode: ModeId = "classic";

  onPhase: (p: Phase) => void = () => {};
  onGameOver: (s: RunStats) => void = () => {};

  private input: InputState = { left: false, right: false, up: false, down: false, jx: 0, jy: 0, joy: false };

  private t = 0;
  private timeScale = 1;
  private freeze = 0;
  private trauma = 0;
  /** 0 disables screen shake entirely (settings.shake === false) */
  private shakeScale = 1;
  /** settings.shakeLevel — "low" ≈ 45% of the trauma offset, "high" = full */
  private shakeAmount = 1;
  /** settings.visualQuality — "low" halves particles and skips glow passes */
  private quality: "low" | "high" = "high";
  /** 1 normal, ~0.25 when reduced motion is on (softens the white flash) */
  private flashScale = 1;
  private flash = 0;
  private flashColor = C.cream;
  private hudAlpha = 0;
  private overTimer = 0;
  private overFired = false;
  private spawnT = 1;
  private banner: { text: string; sub: string; life: number; max: number; color: string } | null = null;

  private px = 0;
  private py = 0;
  private pvx = 0;
  private pvy = 0;
  private pr = 28;
  private fill = 0;
  private cracks = 0;
  private stamina = 1;
  private staminaLock = 0;
  private cheo = false;
  private cheoLatch = false;
  private invuln = 0;
  private slamCd = 0;
  private frenzy = 0;
  private slow = 0;
  private shield = 0;
  private combo = 0;
  private comboT = 0;
  private squash = 0;
  private hurtT = 0;
  private blink = 2;
  private spin = 0;
  private spinRot = 0;
  private playerAlive = true;
  private trail: { x: number; y: number; a: number }[] = [];

  private items: Item[] = [];
  private parts: Particle[] = [];
  private pops: Popup[] = [];
  private rings: Ring[] = [];
  private decals: Decal[] = [];
  private bubbles: Bubble[] = [];
  private stars: { x: number; y: number; r: number; ph: number; sp: number }[] = [];
  private bg: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D context unavailable");
    this.ctx = ctx;
    this.resize(canvas.clientWidth || 800, canvas.clientHeight || 600);
    this.resetRun();
    this.phase = "menu";
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    audio.stopMusic();
  }

  /* -------------------------------------------------------------- setup */

  resize(w: number, h: number) {
    /*
     * `Math.max(240, Math.floor(w))` clamps a *negative* width and lets `NaN`
     * and `Infinity` straight through — the same shape as the six other clamps
     * in this release. It only looked safe because negatives were the case
     * anyone thought to try.
     *
     * The damage here is worse than a bad number in a variable: `canvas.width =
     * NaN` makes the browser reset the backing store to its default 300×150, so
     * the game keeps running at a size nothing else in the app knows about, and
     * `this.w` stays `NaN` for every subsequent collision check.
     *
     * Zero is a real value a hidden/mounting canvas reports, so it falls back to
     * the CSS defaults below rather than being treated as corrupt.
     */
    const cw = Math.max(240, Math.floor(Number.isFinite(w) && w > 0 ? w : 240));
    const ch = Math.max(320, Math.floor(Number.isFinite(h) && h > 0 ? h : 320));
    this.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    this.canvas.width = Math.floor(cw * this.dpr);
    this.canvas.height = Math.floor(ch * this.dpr);
    this.canvas.style.width = `${cw}px`;
    this.canvas.style.height = `${ch}px`;
    this.w = cw;
    this.h = ch;
    this.S = clamp(ch / 700, 0.62, 1.45);
    // player speed blends width + height so phones and ultrawides both feel right
    this.SP = clamp((cw / 1000 + ch / 700) / 2, 0.6, 1.25);
    this.pr = clamp(Math.min(cw, ch) * 0.055, 21, 38);
    this.px = clamp(this.px || cw / 2, this.pr, cw - this.pr);
    this.py = clamp(this.py || ch * 0.72, this.pr, ch - this.pr);
    this.buildBackground();
    this.seedBubbles();
    this.seedStars();
  }

  private seedStars() {
    this.stars = [];
    const n = Math.round(clamp((this.w * this.h) / 26000, 18, 46));
    for (let i = 0; i < n; i++) {
      this.stars.push({
        x: rnd(0, this.w),
        y: rnd(0, this.h),
        r: rnd(0.6, 1.9) * this.S,
        ph: rnd(0, TAU),
        sp: rnd(0.9, 2.4),
      });
    }
  }

  private seedBubbles() {
    this.bubbles = [];
    const n = Math.round(clamp((this.w * this.h) / 42000, 10, 26));
    for (let i = 0; i < n; i++) {
      this.bubbles.push({
        x: rnd(0, this.w),
        y: rnd(0, this.h),
        r: rnd(2, 9) * this.S,
        vy: rnd(6, 26) * this.S,
        a: rnd(0.05, 0.2),
        wob: rnd(0, TAU),
      });
    }
  }

  private buildBackground() {
    const pad = 80;
    const c = document.createElement("canvas");
    c.width = Math.floor((this.w + pad * 2) * this.dpr);
    c.height = Math.floor((this.h + pad * 2) * this.dpr);
    const g = c.getContext("2d");
    if (!g) return;
    g.scale(this.dpr, this.dpr);
    const W = this.w + pad * 2;
    const H = this.h + pad * 2;

    const base = g.createLinearGradient(0, 0, W * 0.4, H);
    base.addColorStop(0, "#0c3330");
    base.addColorStop(0.5, "#092724");
    base.addColorStop(1, "#061a1a");
    g.fillStyle = base;
    g.fillRect(0, 0, W, H);

    // gạch bông (cement tile) motif
    const cell = Math.round(72 * this.S);
    g.lineWidth = 1.4;
    for (let y = 0; y < H + cell; y += cell) {
      for (let x = 0; x < W + cell; x += cell) {
        const odd = ((x / cell + y / cell) | 0) % 2 === 0;
        g.strokeStyle = odd ? "rgba(43,180,140,0.14)" : "rgba(253,243,224,0.055)";
        g.strokeRect(x + 0.5, y + 0.5, cell, cell);
        g.save();
        g.translate(x + cell / 2, y + cell / 2);
        g.rotate(Math.PI / 4);
        g.strokeStyle = odd ? "rgba(245,168,28,0.1)" : "rgba(43,180,140,0.09)";
        g.strokeRect(-cell * 0.22, -cell * 0.22, cell * 0.44, cell * 0.44);
        g.restore();
        g.beginPath();
        g.strokeStyle = odd ? "rgba(253,243,224,0.05)" : "rgba(43,180,140,0.12)";
        for (const [sx, sy] of [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ]) {
          g.moveTo(x + cell / 2 + (sx * cell) / 2, y + cell / 2 + (sy * cell) / 2);
          g.arc(x + cell / 2 + (sx * cell) / 2, y + cell / 2 + (sy * cell) / 2, cell * 0.5, 0, TAU);
        }
        g.stroke();
      }
    }

    // warm centre pool + vignette
    const pool = g.createRadialGradient(W * 0.5, H * 0.42, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.62);
    pool.addColorStop(0, "rgba(245,168,28,0.11)");
    pool.addColorStop(0.45, "rgba(43,180,140,0.05)");
    pool.addColorStop(1, "rgba(6,26,26,0.86)");
    g.fillStyle = pool;
    g.fillRect(0, 0, W, H);
    this.bg = c;
  }

  /* -------------------------------------------------------------- state */

  resetRun() {
    this.stats = { score: 0, catches: 0, bestCombo: 0, level: 1, jars: 0, sliced: 0, time: 0 };
    this.items.length = 0;
    this.parts.length = 0;
    this.pops.length = 0;
    this.rings.length = 0;
    this.decals.length = 0;
    this.trail.length = 0;
    this.px = this.w / 2;
    this.py = this.h * 0.72;
    this.pvx = 0;
    this.pvy = 0;
    this.fill = 0;
    this.cracks = 0;
    this.stamina = 1;
    this.cheo = false;
    this.cheoLatch = false;
    this.invuln = 0.8;
    this.slamCd = 0;
    this.frenzy = 0;
    this.slow = 0;
    this.shield = 0;
    this.combo = 0;
    this.comboT = 0;
    this.squash = 0;
    this.hurtT = 0;
    this.spin = 0;
    this.spinRot = 0;
    this.trauma = 0;
    this.flash = 0;
    this.timeScale = 1;
    this.freeze = 0;
    this.spawnT = 0.55;
    this.overTimer = 0;
    this.overFired = false;
    this.playerAlive = true;
    this.banner = null;
    audio.setIntensity(1);
  }

  start() {
    this.resetRun();
    this.phase = "playing";
    this.onPhase(this.phase);
    this.banner = { text: t("banner.start.title"), sub: t("banner.start.sub"), life: 1.4, max: 1.4, color: C.goldLight };
    // action inside the first second: a staggered opening volley
    for (let i = 0; i < 4; i++) {
      const it = this.makeItem(this.pickKind(), false);
      it.y = -30 * this.S - i * 135 * this.S;
      it.x = this.w * (0.26 + 0.48 * ((i * 0.37) % 1));
      it.vy *= 1.5;
      this.items.push(it);
    }
    this.spawnT = 0.75;
    audio.unlock();
    audio.play("start");
    audio.startMusic();
  }

  togglePause() {
    if (this.phase === "playing") {
      this.phase = "paused";
      audio.stopMusic();
      this.onPhase(this.phase);
    } else if (this.phase === "paused") {
      this.phase = "playing";
      this.last = performance.now();
      audio.unlock();
      audio.startMusic();
      this.onPhase(this.phase);
    }
  }

  toMenu() {
    this.phase = "menu";
    this.resetRun();
    this.hudAlpha = 0;
    audio.stopMusic();
    this.onPhase(this.phase);
  }

  setInput(patch: Partial<InputState>) {
    Object.assign(this.input, patch);
  }

  setBest(v: number) {
    this.best = v;
  }

  /** Switch the active mode. Takes effect on the next run. */
  setMode(m: ModeId) {
    this.mode = m;
  }

  /** Enable/disable screen shake at render time (settings.shake). */
  setShakeEnabled(on: boolean) {
    this.shakeScale = on ? 1 : 0;
    if (!on) this.trauma = 0;
  }

  /** Shake strength — settings.shakeLevel. Independent of the on/off switch. */
  setShakeLevel(level: "low" | "high") {
    this.shakeAmount = level === "low" ? 0.45 : 1;
  }

  /** Visual quality — settings.visualQuality. Low halves particles, no glow. */
  setQuality(q: "low" | "high") {
    this.quality = q;
  }

  /** Reduce flash intensity for motion-sensitive players. */
  setReducedMotion(on: boolean) {
    this.flashScale = on ? 0.25 : 1;
    if (on) this.trauma = Math.min(this.trauma, 0.12);
  }

  /**
   * Suspend the run and snapshot enough state to resume it later.
   * The falling-produce field is intentionally dropped — a resumed run
   * starts with a clear sky and a short invulnerability grace period.
   */
  captureRun(savedAt = Date.now()): SavedRun {
    return {
      version: 1,
      savedAt,
      mode: this.mode,
      stats: { ...this.stats },
      fill: this.fill,
      cracks: this.cracks,
      stamina: this.stamina,
      frenzy: this.frenzy,
      slow: this.slow,
      shield: this.shield,
      slamCd: this.slamCd,
      combo: this.combo,
      comboT: this.comboT,
      px: this.px,
      py: this.py,
    };
  }

  /**
   * Resume a suspended run captured earlier by {@link captureRun}.
   * Field items are not restored; the jar keeps its fill, cracks,
   * stamina, combo timer and score. Fires onPhase("playing").
   */
  restoreRun(saved: SavedRun) {
    this.resetRun();
    this.mode = saved.mode;
    this.stats = { ...saved.stats };
    this.fill = clamp(saved.fill, 0, 1);
    const maxCracks = MODES[this.mode].maxCracks ?? 3;
    this.cracks = clamp(Math.round(saved.cracks), 0, maxCracks);
    this.stamina = clamp(saved.stamina, 0, 1);
    /*
     * ROUND 6: these six fields were the last unvalidated path from disk into
     * the simulation.
     *
     * `runSave.ts` already rejects a save whose `stats.score` is not finite,
     * so the *stats* object is trustworthy. The body fields are not covered by
     * that check: `Math.max(0, Infinity)` is `Infinity`, and `Math.max` on NaN
     * is `NaN`. A save with `"shield": 1e999` (valid JSON!) restored an
     * infinite shield, and a NaN `comboT` made the combo timer never expire.
     *
     * `finiteOr()` is the same discipline as `runSave`'s `nonNegInt`, applied
     * at the layer that would otherwise trust its caller.
     */
    const finiteOr = (v: unknown, fallback: number): number =>
      typeof v === "number" && Number.isFinite(v) ? v : fallback;

    this.frenzy = finiteOr(saved.frenzy, 0);
    this.slow = finiteOr(saved.slow, 0);
    this.shield = Math.max(0, Math.round(finiteOr(saved.shield, 0)));
    this.slamCd = Math.max(0, finiteOr(saved.slamCd, 0));
    this.combo = Math.max(0, Math.round(finiteOr(saved.combo, 0)));
    this.comboT = Math.max(0, finiteOr(saved.comboT, 0));
    this.px = clamp(saved.px || this.w / 2, this.pr, this.w - this.pr);
    this.py = clamp(saved.py || this.h * 0.72, this.pr, this.h - this.pr);
    this.invuln = 1.2; // brief grace while the player re-finds the jar
    this.spawnT = 1.1; // let the volley stagger in gently
    this.phase = "playing";
    this.onPhase(this.phase);
    this.banner = {
      text: t("banner.resume.title"),
      sub: t("banner.resume.sub"),
      life: 1.4,
      max: 1.4,
      color: C.goldLight,
    };
    audio.unlock();
    audio.play("start");
    audio.startMusic();
  }

  get snapshot() {
    return {
      cheo: this.cheo,
      stamina: this.stamina,
      slamCd: this.slamCd,
      frenzy: this.frenzy,
      slow: this.slow,
      combo: this.combo,
      shield: this.shield,
      mode: this.mode,
    };
  }

  slam() {
    if (this.phase !== "playing" || this.slamCd > 0 || !this.playerAlive) return;
    this.slamCd = 6;
    this.spin = 1;
    this.trauma = Math.max(this.trauma, 0.62);
    this.freeze = Math.max(this.freeze, 0.05);
    this.rings.push({
      x: this.px, y: this.py, r: this.pr, to: 270 * this.S, life: 0.5, max: 0.5, color: C.goldLight, width: 9,
    });
    this.rings.push({
      x: this.px, y: this.py, r: this.pr, to: 200 * this.S, life: 0.66, max: 0.66, color: C.brine, width: 4,
    });
    audio.play("shake");
    this.popup(this.px, this.py - this.pr * 1.6, t("popup.slam"), C.goldLight, 26);
    const rad = 260 * this.S;
    for (const it of this.items) {
      if (it.deco) continue;
      const d = Math.hypot(it.x - this.px, it.y - this.py);
      if (d > rad) continue;
      if (it.def.hazard) {
        this.destroyItem(it, true, 15);
      } else {
        it.mag = 1.0;
      }
    }
    for (let i = 0; i < 26; i++) {
      const a = rnd(0, TAU);
      this.spawnParticle({
        x: this.px, y: this.py, vx: Math.cos(a) * rnd(160, 520) * this.S, vy: Math.sin(a) * rnd(160, 520) * this.S,
        life: rnd(0.3, 0.62), size: rnd(2, 5) * this.S, color: i % 3 === 0 ? C.goldLight : C.brine,
        kind: i % 4 === 0 ? "spark" : "dot", grav: 120, drag: 2.2,
      });
    }
  }

  /* -------------------------------------------------------------- loop */

  private frame = (now: number) => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.frame);
    let raw = (now - this.last) / 1000;
    this.last = now;
    if (!isFinite(raw) || raw < 0) raw = 0;
    raw = Math.min(raw, 1 / 20);

    if (this.freeze > 0) {
      this.freeze -= raw;
      this.render();
      return;
    }

    const dt = raw * this.timeScale;
    this.t += dt;
    this.update(dt, raw);
    this.render();
  };

  private update(dt: number, raw: number) {
    // ambient always runs
    this.updateBubbles(dt);
    this.updateParticles(dt);
    this.updatePopups(dt);
    this.updateRings(dt);
    this.updateDecals(dt);
    this.trauma = Math.max(0, this.trauma - dt * 1.9);
    this.flash = Math.max(0, this.flash - dt * 3.1);
    if (this.banner) {
      this.banner.life -= dt;
      if (this.banner.life <= 0) this.banner = null;
    }
    this.blink -= dt;
    if (this.blink < -0.12) this.blink = rnd(1.6, 4.4);

    if (this.phase === "menu") {
      this.updateAttract(dt);
      this.hudAlpha = damp(this.hudAlpha, 0, 6, dt);
      return;
    }

    if (this.phase === "paused") {
      this.hudAlpha = damp(this.hudAlpha, 0.25, 4, dt);
      return;
    }

    if (this.phase === "gameover") {
      this.overTimer -= raw;
      this.timeScale = damp(this.timeScale, 0.45, 2, dt);
      this.updateItems(dt);
      this.hudAlpha = damp(this.hudAlpha, 0.35, 3, dt);
      if (this.overTimer <= 0 && !this.overFired) {
        this.overFired = true;
        this.onGameOver({ ...this.stats });
      }
      return;
    }

    // -------- playing
    this.hudAlpha = damp(this.hudAlpha, 1, 4, dt);
    this.stats.time += raw;
    const timeLimit = MODES[this.mode].timeLimit;
    if (timeLimit && this.stats.time >= timeLimit) {
      this.stats.time = timeLimit;
      this.gameOver();
      return;
    }
    this.timeScale = damp(this.timeScale, this.slow > 0 ? 0.52 : 1, 6, dt);
    if (this.slow > 0) this.slow = Math.max(0, this.slow - dt);
    if (this.frenzy > 0) this.frenzy = Math.max(0, this.frenzy - dt);
    if (this.slamCd > 0) this.slamCd = Math.max(0, this.slamCd - dt);
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
    if (this.hurtT > 0) this.hurtT = Math.max(0, this.hurtT - dt);
    if (this.spin > 0) {
      this.spin = Math.max(0, this.spin - dt * 2.2);
      this.spinRot += dt * 13.85; // lands back upright after exactly two turns
      if (this.spin <= 0) this.spinRot = 0;
    }

    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0 && this.combo > 0) this.combo = 0;
    }

    this.updatePlayer(dt);
    this.updateSpawns(dt);
    this.updateItems(dt);
  }

  /* ------------------------------------------------------------ attract */

  private updateAttract(dt: number) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = rnd(0.32, 0.7);
      const it = this.makeItem(this.pickKind(true), true);
      this.items.push(it);
    }
    this.px = this.w / 2 + Math.sin(this.t * 0.7) * this.w * 0.13;
    this.py = this.h * 0.74 + Math.cos(this.t * 0.9) * this.h * 0.03;
    this.pvx = Math.cos(this.t * 0.7) * 60;
    this.cheo = (this.t * 0.7) % 4 < 2;
    for (const it of this.items) {
      it.y += it.vy * dt * 0.6;
      it.rot += it.spin * dt;
      it.x += Math.sin(it.sway + this.t * it.swayF) * 26 * dt;
      if (it.y > this.h + 60) it.dead = true;
    }
    this.items = this.items.filter((i) => !i.dead);
  }

  /* ------------------------------------------------------------ player */

  private updatePlayer(dt: number) {
    const inp = this.input;
    let dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    let dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    let mag = Math.hypot(dx, dy);
    if (inp.joy && Math.hypot(inp.jx, inp.jy) > 0.05) {
      dx = inp.jx;
      dy = inp.jy;
      mag = Math.hypot(dx, dy);
    }
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
      mag = 1;
    }

    const diagonal = mag > 0.35 && Math.abs(Math.abs(dx) - Math.abs(dy)) < mag * 0.44;
    const free = this.frenzy > 0;
    // hysteresis so the boost clicks on/off cleanly instead of flickering
    if (diagonal && (free || this.stamina > (this.cheo ? 0.02 : 0.14))) this.cheoLatch = true;
    else if (!diagonal || (!free && this.stamina <= 0.02)) this.cheoLatch = false;
    const wantCheo = this.cheoLatch && (diagonal || free);
    this.cheo = wantCheo;

    if (wantCheo && !free) {
      this.stamina = Math.max(0, this.stamina - dt * 0.24);
      this.staminaLock = 0.2;
    } else {
      this.staminaLock = Math.max(0, this.staminaLock - dt);
      if (this.staminaLock <= 0) this.stamina = Math.min(1, this.stamina + dt * 0.5);
    }

    const maxSpd = (this.cheo ? 640 : 442) * this.SP;
    const tvx = dx * maxSpd * (mag > 1 ? 1 : mag);
    const tvy = dy * maxSpd * (mag > 1 ? 1 : mag);
    const resp = Math.min(1, dt * (this.cheo ? 19 : 15));
    this.pvx = lerp(this.pvx, tvx, resp);
    this.pvy = lerp(this.pvy, tvy, resp);
    this.px += this.pvx * dt;
    this.py += this.pvy * dt;

    // walls
    const m = this.pr * 0.86;
    if (this.px < m) {
      this.px = m;
      if (this.pvx < -140) this.wallHit(1, 0);
      this.pvx = Math.abs(this.pvx) * 0.25;
    }
    if (this.px > this.w - m) {
      this.px = this.w - m;
      if (this.pvx > 140) this.wallHit(-1, 0);
      this.pvx = -Math.abs(this.pvx) * 0.25;
    }
    if (this.py < m + 6) {
      this.py = m + 6;
      if (this.pvy < -140) this.wallHit(0, 1);
      this.pvy = Math.abs(this.pvy) * 0.25;
    }
    if (this.py > this.h - m) {
      this.py = this.h - m;
      if (this.pvy > 140) this.wallHit(0, -1);
      this.pvy = -Math.abs(this.pvy) * 0.25;
    }

    this.squash = damp(this.squash, 0, 9, dt);

    // combo flame aura — visual reward for red-hot streaks (12+ in a row)
    if (this.combo >= 12 && Math.random() < 0.6) {
      const flameColors = [C.goldLight, C.chili, "#ffd766"];
      this.spawnParticle({
        x: this.px + rnd(-this.pr * 0.7, this.pr * 0.7),
        y: this.py + this.pr * 0.55,
        vx: rnd(-45, 45),
        vy: rnd(40, 140),
        life: rnd(0.28, 0.55),
        size: rnd(2.5, 5.2) * this.S,
        color: flameColors[(Math.random() * flameColors.length) | 0],
        kind: "spark",
        grav: -520,
        drag: 2.4,
      });
    }

    // chéo trail
    if (this.cheo && Math.hypot(this.pvx, this.pvy) > 120) {
      this.trail.push({ x: this.px, y: this.py, a: 0.5 });
      if (this.trail.length > 16) this.trail.shift();
      if (Math.random() < 0.6) {
        this.spawnParticle({
          x: this.px + rnd(-this.pr, this.pr) * 0.6, y: this.py + rnd(-this.pr, this.pr) * 0.6,
          vx: -this.pvx * 0.08 + rnd(-30, 30), vy: -this.pvy * 0.08 + rnd(-30, 30),
          life: rnd(0.2, 0.42), size: rnd(2, 4.5) * this.S,
          color: Math.random() < 0.5 ? C.goldLight : C.brine, kind: "spark", grav: 0, drag: 3,
        });
      }
    }
    for (const tr of this.trail) tr.a -= dt * 1.6;
    this.trail = this.trail.filter((tr) => tr.a > 0);
  }

  private wallHit(nx: number, ny: number) {
    this.squash = 0.35;
    this.trauma = Math.max(this.trauma, 0.16);
    for (let i = 0; i < 7; i++) {
      const a = Math.atan2(ny, nx) + rnd(-0.9, 0.9);
      this.spawnParticle({
        x: this.px + nx * this.pr, y: this.py + ny * this.pr,
        vx: Math.cos(a) * rnd(60, 220), vy: Math.sin(a) * rnd(60, 220),
        life: rnd(0.18, 0.4), size: rnd(1.6, 3.6) * this.S, color: C.cream, kind: "dot", grav: 260, drag: 2,
      });
    }
  }

  /* ------------------------------------------------------------ spawns */

  private pickKind(deco = false): ItemKind {
    // balance logic lives in ./spawn so it can be tested without a canvas
    return weightedPick(KINDS, {
      level: deco ? 4 : this.stats.level,
      mode: MODES[this.mode],
      deco,
    });
  }

  private makeItem(kind: ItemKind, deco: boolean): Item {
    const def = DEFS[kind];
    const lvl = this.stats.level;
    const cfg = MODES[this.mode];
    const margin = this.w * 0.08;
    const speed = (186 + lvl * 18) * this.S * def.speed * cfg.speedMult * (this.frenzy > 0 ? 1.12 : 1);
    const it: Item = {
      kind, def, deco,
      x: rnd(margin, this.w - margin),
      y: -30 * this.S - rnd(0, 40),
      vx: rnd(-26, 26) * this.S,
      vy: speed * rnd(0.92, 1.1),
      r: (def.r + 3) * this.S,
      rot: rnd(0, TAU),
      spin: rnd(-2.4, 2.4),
      sway: rnd(0, TAU),
      swayF: kind === "sau" ? rnd(1.4, 2.0) : rnd(0.8, 2.1),
      mag: 0,
      born: this.t,
      dead: false,
    };
    // mould speckles are fixed at spawn so they don't dance every frame
    if (kind === "moc") {
      it.spots = Array.from({ length: 6 }, () => {
        const a = rnd(0, TAU);
        const rr = rnd(0, 6.5);
        return { x: Math.cos(a) * rr, y: Math.sin(a) * rr, r: rnd(1, 2.4) };
      });
    }
    return it;
  }

  private updateSpawns(dt: number) {
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    const lvl = this.stats.level;
    const base = Math.max(0.32, 1.0 - lvl * 0.06) * (this.frenzy > 0 ? 0.68 : 1) * MODES[this.mode].spawnMult;
    this.spawnT = base * rnd(0.75, 1.25);

    if (Math.random() < 0.24) {
      // diagonal formation — the signature "chéo" line
      const kind = this.pickKind();
      const dirX = Math.random() < 0.5 ? -1 : 1;
      const x0 = clamp(rnd(this.w * 0.2, this.w * 0.8), 40, this.w - 40);
      for (let i = 0; i < 3; i++) {
        const it = this.makeItem(i === 1 && Math.random() < 0.35 ? this.pickKind() : kind, false);
        it.x = clamp(x0 + dirX * i * 62 * this.S, 26, this.w - 26);
        it.y = -30 * this.S - i * 52 * this.S;
        this.items.push(it);
      }
      return;
    }
    this.items.push(this.makeItem(this.pickKind(), false));
  }

  private updateItems(dt: number) {
    if (this.items.length > 70) this.items.splice(0, this.items.length - 70);
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.mag > 0) {
        it.mag -= dt;
        const a = Math.atan2(this.py - it.y, this.px - it.x);
        const pull = 1500 * this.S;
        it.vx = lerp(it.vx, Math.cos(a) * pull * 0.55, Math.min(1, dt * 8));
        it.vy = lerp(it.vy, Math.sin(a) * pull * 0.55, Math.min(1, dt * 8));
        if (Math.random() < 0.4) {
          this.spawnParticle({
            x: it.x, y: it.y, vx: rnd(-40, 40), vy: rnd(-40, 40), life: 0.3,
            size: rnd(1.5, 3) * this.S, color: C.goldLight, kind: "dot", grav: 0, drag: 2,
          });
        }
      } else if (it.kind === "ruoi") {
        it.vx = Math.sin(this.t * 6 + it.sway) * 130 * this.S;
      } else if (it.kind === "sau") {
        // caterpillar: lazy, heavy undulation
        it.vx = Math.sin(this.t * 2.3 + it.sway) * 105 * this.S;
      } else {
        it.vx = Math.sin(it.sway + this.t * it.swayF) * 34 * this.S;
      }
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      it.rot += it.spin * dt;
      if (it.x < it.r) { it.x = it.r; it.vx *= -1; }
      if (it.x > this.w - it.r) { it.x = this.w - it.r; it.vx *= -1; }

      if (!it.deco && this.phase === "playing" && this.playerAlive) {
        const d = Math.hypot(it.x - this.px, it.y - this.py);
        if (d < this.pr * 0.92 + it.r * 1.02) {
          this.resolveCatch(it);
          if (it.dead) { this.items.splice(i, 1); continue; }
        }
      }

      if (it.y - it.r > this.h + 10) {
        if (!it.deco && !it.def.hazard && !it.def.power && this.phase === "playing") this.missItem(it);
        this.items.splice(i, 1);
      }
    }
  }

  private resolveCatch(it: Item) {
    it.dead = true;
    if (it.def.hazard) {
      if (this.cheo || this.frenzy > 0) {
        this.destroyItem(it, false, it.def.pts);
      } else {
        this.damage(it);
      }
      return;
    }
    if (it.def.power) {
      this.applyPower(it);
      return;
    }
    this.catchGood(it);
  }

  private catchGood(it: Item) {
    const cfg = MODES[this.mode];
    const prevMult = this.multiplier();
    this.combo++;
    this.comboT = comboWindowFor(this.mode);
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo);
    this.stats.catches++;
    const mult = this.multiplier();
    // mult already includes the frenzy ×2 — applying it again would pay ×4
    const gain = Math.round(it.def.pts * mult * cfg.scoreMult);
    this.stats.score += gain;
    this.fill = Math.min(1, this.fill + 0.052 + (it.def.fillBoost ?? 0));
    this.squash = -0.34;
    this.freeze = Math.max(this.freeze, mult >= 4 ? 0.045 : 0.02);
    this.trauma = Math.max(this.trauma, clamp(0.05 + mult * 0.02, 0, 0.34));
    this.flash = Math.max(this.flash, 0.14);
    this.flashColor = it.def.color;
    this.popup(it.x, it.y - 10, `+${gain}`, mult >= 4 ? C.goldLight : C.cream, mult >= 4 ? 30 : 22);
    audio.play("catch", this.combo);

    for (let i = 0; i < 13; i++) {
      const a = rnd(0, TAU);
      const sp = rnd(90, 420) * this.S;
      this.spawnParticle({
        x: it.x, y: it.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        life: rnd(0.28, 0.66), size: rnd(2, 5.5) * this.S,
        color: i % 3 === 0 ? C.brine : it.def.color, kind: i % 5 === 0 ? "drop" : "dot",
        grav: 620, drag: 1.6,
      });
    }
    this.rings.push({ x: it.x, y: it.y, r: it.r * 0.6, to: it.r * 3.4, life: 0.26, max: 0.26, color: it.def.color, width: 3 });

    if (mult > prevMult) {
      // multiplier milestone — the sweetest sound in the game
      audio.play("level");
      this.popup(this.px, this.py - this.pr * 2.5, t("popup.mult", { n: mult }), mult >= 6 ? C.chili : C.goldLight, 34);
      this.rings.push({
        x: this.px, y: this.py, r: this.pr, to: this.pr * 6.5, life: 0.45, max: 0.45,
        color: mult >= 6 ? C.chili : C.goldLight, width: 5,
      });
      this.flash = Math.max(this.flash, 0.3);
      this.flashColor = mult >= 6 ? C.chili : C.goldLight;
      this.trauma = Math.max(this.trauma, 0.28);
      this.freeze = Math.max(this.freeze, 0.06);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        this.spawnParticle({
          x: this.px, y: this.py, vx: Math.cos(a) * 380 * this.S, vy: Math.sin(a) * 380 * this.S,
          life: rnd(0.35, 0.7), size: rnd(2.5, 5) * this.S,
          color: mult >= 6 ? C.chili : C.goldLight, kind: "spark", grav: 260, drag: 2,
        });
      }
    }

    if (this.fill >= 1) this.jarFull();
    const newLevel = levelForCatches(this.stats.catches);
    if (newLevel > this.stats.level) this.levelUp(newLevel);
  }

  private destroyItem(it: Item, fromSlam: boolean, pts: number) {
    it.dead = true;
    const mult = this.multiplier();
    const gain = Math.round(pts * mult * MODES[this.mode].scoreMult);
    this.stats.score += gain;
    this.stats.sliced++;
    this.combo++;
    this.comboT = comboWindowFor(this.mode);
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo);
    this.popup(it.x, it.y, fromSlam ? `+${gain}` : t("popup.cheo", { n: gain }), C.goldLight, fromSlam ? 20 : 26);
    audio.play("slice");
    this.trauma = Math.max(this.trauma, fromSlam ? 0.1 : 0.24);
    this.freeze = Math.max(this.freeze, fromSlam ? 0.01 : 0.045);
    this.rings.push({ x: it.x, y: it.y, r: it.r, to: it.r * 4, life: 0.24, max: 0.24, color: C.goldLight, width: 3 });
    for (let i = 0; i < 16; i++) {
      const a = rnd(0, TAU);
      const sp = rnd(140, 560) * this.S;
      this.spawnParticle({
        x: it.x, y: it.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rnd(0.25, 0.6), size: rnd(2, 6) * this.S,
        color: i % 2 ? it.def.color : it.def.color2, kind: i % 3 === 0 ? "shard" : "dot",
        grav: 700, drag: 1.5, rot: rnd(0, TAU), vr: rnd(-14, 14),
      });
    }
  }

  private applyPower(it: Item) {
    it.dead = true;
    audio.play("power");
    this.freeze = Math.max(this.freeze, 0.06);
    this.flash = Math.max(this.flash, 0.4);
    this.flashColor = it.def.color;
    this.trauma = Math.max(this.trauma, 0.3);
    this.rings.push({ x: it.x, y: it.y, r: it.r, to: 230 * this.S, life: 0.5, max: 0.5, color: it.def.color, width: 6 });
    const kind = it.def.power;
    if (kind === "heal") {
      const gain = Math.round(it.def.pts * this.multiplier() * MODES[this.mode].scoreMult);
      this.stats.score += gain;
      if (this.cracks > 0) {
        this.cracks--;
        this.popup(this.px, this.py - this.pr * 2, t("popup.healCrack", { gain }), C.brine, 24);
      } else {
        this.stats.score += 150;
        this.popup(this.px, this.py - this.pr * 2, t("popup.healFull", { gain: gain + 150 }), C.goldLight, 24);
      }
      this.fill = Math.min(1, this.fill + 0.18);
    } else if (kind === "frenzy") {
      this.frenzy = 7;
      const gain = Math.round(it.def.pts * this.multiplier() * MODES[this.mode].scoreMult);
      this.stats.score += gain;
      this.popup(this.px, this.py - this.pr * 2, t("popup.frenzy"), "#ff6a4d", 26);
      this.banner = { text: t("banner.frenzy"), sub: t("banner.frenzy.sub"), life: 1.2, max: 1.2, color: "#ff6a4d" };
    } else if (kind === "shield") {
      this.shield = Math.min(2, this.shield + 1);
      const gain = Math.round(it.def.pts * this.multiplier() * MODES[this.mode].scoreMult);
      this.stats.score += gain;
      this.popup(this.px, this.py - this.pr * 2, t("popup.shieldGain", { n: this.shield }), "#ffe9a8", 26);
      this.banner = { text: t("banner.shield"), sub: t("banner.shield.sub"), life: 1.2, max: 1.2, color: "#ffe9a8" };
    } else {
      this.slow = 5;
      const gain = Math.round(it.def.pts * this.multiplier() * MODES[this.mode].scoreMult);
      this.stats.score += gain;
      this.popup(this.px, this.py - this.pr * 2, t("popup.slow"), "#a8e6ff", 26);
      this.banner = { text: t("banner.slow"), sub: t("banner.slow.sub"), life: 1.2, max: 1.2, color: "#a8e6ff" };
    }
    for (let i = 0; i < 30; i++) {
      const a = rnd(0, TAU);
      this.spawnParticle({
        x: it.x, y: it.y, vx: Math.cos(a) * rnd(120, 620) * this.S, vy: Math.sin(a) * rnd(120, 620) * this.S,
        life: rnd(0.35, 0.85), size: rnd(2, 6) * this.S,
        color: i % 3 === 0 ? C.cream : it.def.color, kind: i % 4 === 0 ? "confetti" : "spark",
        grav: 380, drag: 1.4, rot: rnd(0, TAU), vr: rnd(-12, 12),
      });
    }
  }

  private damage(it: Item) {
    it.dead = true;
    if (this.invuln > 0) {
      // deflected while still blinking — it must not look like the item vanished
      this.rings.push({ x: it.x, y: it.y, r: it.r, to: it.r * 3.2, life: 0.22, max: 0.22, color: C.cream, width: 3 });
      for (let i = 0; i < 9; i++) {
        const a = rnd(0, TAU);
        this.spawnParticle({
          x: it.x, y: it.y, vx: Math.cos(a) * rnd(90, 320), vy: Math.sin(a) * rnd(90, 320),
          life: rnd(0.18, 0.4), size: rnd(2, 4) * this.S, color: C.cream, kind: "spark", grav: 320, drag: 2,
        });
      }
      return;
    }
    if (this.shield > 0) {
      // the golden garlic wards one hit off entirely — no crack, no combo loss
      this.shield--;
      this.invuln = Math.max(this.invuln, 0.9);
      this.squash = 0.4;
      this.trauma = Math.max(this.trauma, 0.4);
      this.freeze = Math.max(this.freeze, 0.05);
      this.flash = Math.max(this.flash, 0.3);
      this.flashColor = "#ffe9a8";
      audio.play("power");
      this.popup(this.px, this.py - this.pr * 1.9, t("popup.shieldBlock"), "#ffe9a8", 26);
      this.rings.push({ x: this.px, y: this.py, r: this.pr, to: this.pr * 5.6, life: 0.4, max: 0.4, color: "#ffe9a8", width: 6 });
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        this.spawnParticle({
          x: this.px, y: this.py, vx: Math.cos(a) * 300 * this.S, vy: Math.sin(a) * 300 * this.S,
          life: rnd(0.3, 0.6), size: rnd(2, 4.5) * this.S, color: "#ffe9a8", kind: "spark", grav: 120, drag: 2.4,
        });
      }
      return;
    }
    this.cracks++;
    this.combo = 0;
    this.comboT = 0;
    this.invuln = 1.35;
    this.hurtT = 0.5;
    this.squash = 0.5;
    this.fill = Math.max(0, this.fill - 0.14);
    this.trauma = 1;
    this.freeze = Math.max(this.freeze, 0.09);
    this.flash = 0.75;
    this.flashColor = C.chili;
    audio.play("hurt");
    const maxCracks = MODES[this.mode].maxCracks ?? 3;
    this.popup(this.px, this.py - this.pr * 1.9, this.cracks >= maxCracks ? t("popup.broken") : t("popup.cracked"), C.chili, 28);
    this.rings.push({ x: this.px, y: this.py, r: this.pr, to: this.pr * 7, life: 0.4, max: 0.4, color: C.chili, width: 7 });
    for (let i = 0; i < 26; i++) {
      const a = rnd(0, TAU);
      this.spawnParticle({
        x: this.px, y: this.py, vx: Math.cos(a) * rnd(120, 560), vy: Math.sin(a) * rnd(120, 560) - 80,
        life: rnd(0.4, 0.95), size: rnd(3, 8) * this.S,
        color: i % 2 ? C.cream : "#d9c7ab", kind: "shard", grav: 900, drag: 1.1, rot: rnd(0, TAU), vr: rnd(-16, 16),
      });
    }
    for (let i = 0; i < 12; i++) {
      const a = rnd(0, TAU);
      this.spawnParticle({
        x: it.x, y: it.y, vx: Math.cos(a) * rnd(80, 300), vy: Math.sin(a) * rnd(80, 300),
        life: rnd(0.3, 0.7), size: rnd(2, 5) * this.S, color: it.def.color, kind: "dot", grav: 700, drag: 1.6,
      });
    }
    if (this.cracks >= (MODES[this.mode].maxCracks ?? 3)) this.gameOver();
  }

  private missItem(it: Item) {
    const before = this.combo;
    this.combo = Math.floor(this.combo * 0.5);
    if (this.combo === 0) this.comboT = 0;
    if (before >= 6) this.popup(it.x, this.h - 30 * this.S, t("popup.miss"), "#cfe3ea", 20);
    audio.play("miss");
    this.decals.push({
      x: it.x, y: this.h - rnd(4, 16), rx: rnd(14, 26) * this.S, ry: rnd(5, 9) * this.S,
      life: 3.4, max: 3.4, color: it.def.color2, rot: rnd(0, TAU),
    });
    for (let i = 0; i < 9; i++) {
      const a = rnd(Math.PI, TAU);
      this.spawnParticle({
        x: it.x, y: this.h - 6, vx: Math.cos(a) * rnd(60, 260), vy: Math.sin(a) * rnd(60, 260),
        life: rnd(0.25, 0.5), size: rnd(2, 4.5) * this.S, color: it.def.color, kind: "drop", grav: 800, drag: 1.4,
      });
    }
  }

  private jarFull() {
    this.stats.jars++;
    this.fill = 0;
    const bonus = jarBonusFor(this.stats.level, this.mode);
    this.stats.score += bonus;
    audio.play("full");
    this.banner = { text: t("banner.jarFull", { bonus }), sub: t("banner.jarFull.sub"), life: 1.6, max: 1.6, color: C.brine };
    this.flash = 0.5;
    this.flashColor = C.brine;
    this.trauma = Math.max(this.trauma, 0.4);
    for (let i = 0; i < 46; i++) {
      this.spawnParticle({
        x: rnd(0, this.w), y: -rnd(10, 90), vx: rnd(-60, 60), vy: rnd(90, 300) * this.S,
        life: rnd(1.1, 2.1), size: rnd(4, 9) * this.S,
        color: [C.goldLight, C.brine, C.chili, C.cream, C.jade][i % 5], kind: "confetti",
        grav: 210, drag: 0.35, rot: rnd(0, TAU), vr: rnd(-9, 9),
      });
    }
  }

  private levelUp(lvl: number) {
    this.stats.level = lvl;
    audio.setIntensity(lvl);
    audio.play("level");
    this.banner = { text: t("banner.level", { n: lvl }), sub: t("banner.level.sub"), life: 1.3, max: 1.3, color: C.goldLight };
    this.trauma = Math.max(this.trauma, 0.3);
    this.rings.push({ x: this.px, y: this.py, r: this.pr, to: 320 * this.S, life: 0.6, max: 0.6, color: C.goldLight, width: 5 });
    for (let i = 0; i < 24; i++) {
      const a = rnd(0, TAU);
      this.spawnParticle({
        x: this.px, y: this.py, vx: Math.cos(a) * rnd(200, 700), vy: Math.sin(a) * rnd(200, 700),
        life: rnd(0.4, 0.9), size: rnd(2.5, 6) * this.S,
        color: i % 2 ? C.goldLight : C.cream, kind: "spark", grav: 200, drag: 1.8,
      });
    }
  }

  private gameOver() {
    this.phase = "gameover";
    this.playerAlive = false;
    this.overTimer = 1.1;
    this.overFired = false;
    this.trauma = 1;
    this.freeze = Math.max(this.freeze, 0.13);
    this.flash = 1;
    this.flashColor = C.chili;
    audio.play("over");
    audio.stopMusic();
    this.banner = null;
    for (let i = 0; i < 42; i++) {
      const a = rnd(0, TAU);
      this.spawnParticle({
        x: this.px + rnd(-8, 8), y: this.py + rnd(-8, 8),
        vx: Math.cos(a) * rnd(140, 780), vy: Math.sin(a) * rnd(140, 780) - 160,
        life: rnd(0.7, 1.7), size: rnd(4, 12) * this.S,
        color: i % 3 === 0 ? C.brine : i % 3 === 1 ? C.cream : "#dcc9ac", kind: "shard",
        grav: 1100, drag: 0.9, rot: rnd(0, TAU), vr: rnd(-18, 18),
      });
    }
    this.onPhase(this.phase);
  }

  multiplier() {
    return multiplierForCombo(this.combo, this.frenzy > 0);
  }

  /* ---------------------------------------------------- fx primitives */

  private spawnParticle(p: Partial<Particle> & { x: number; y: number }) {
    const cap = this.quality === "low" ? 230 : 460;
    if (this.parts.length > cap) this.parts.shift();
    this.parts.push({
      x: p.x, y: p.y, vx: p.vx ?? 0, vy: p.vy ?? 0,
      life: p.life ?? 0.5, max: p.life ?? 0.5, size: p.size ?? 3,
      color: p.color ?? C.cream, kind: p.kind ?? "dot", rot: p.rot ?? 0, vr: p.vr ?? 0,
      grav: p.grav ?? 500, drag: p.drag ?? 1.4,
    });
  }

  private popup(x: number, y: number, text: string, color: string, size: number) {
    if (this.pops.length > 34) this.pops.shift();
    this.pops.push({ x, y, vy: -62 * this.S, life: 0.95, max: 0.95, text, color, size });
  }

  private updateParticles(dt: number) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      p.vy += p.grav * dt;
      const d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  }

  private updatePopups(dt: number) {
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i];
      p.life -= dt;
      if (p.life <= 0) { this.pops.splice(i, 1); continue; }
      p.y += p.vy * dt;
      p.vy *= Math.max(0, 1 - 1.9 * dt);
    }
  }

  private updateRings(dt: number) {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) { this.rings.splice(i, 1); continue; }
      r.r = damp(r.r, r.to, 9, dt);
    }
  }

  private updateDecals(dt: number) {
    for (let i = this.decals.length - 1; i >= 0; i--) {
      this.decals[i].life -= dt;
      if (this.decals[i].life <= 0) this.decals.splice(i, 1);
    }
  }

  private updateBubbles(dt: number) {
    for (const b of this.bubbles) {
      b.y -= b.vy * dt;
      b.wob += dt * 1.6;
      if (b.y < -20) { b.y = this.h + 20; b.x = rnd(0, this.w); }
    }
  }

  /* ------------------------------------------------------------ render */

  private render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    // screen shake (settings.shake can zero this out)
    const sh = this.trauma * this.trauma * this.shakeScale * this.shakeAmount;
    const ox = rnd(-1, 1) * 26 * sh;
    const oy = rnd(-1, 1) * 26 * sh;
    const rot = rnd(-1, 1) * 0.02 * sh;
    ctx.translate(this.w / 2 + ox, this.h / 2 + oy);
    ctx.rotate(rot);
    ctx.translate(-this.w / 2, -this.h / 2);

    ctx.fillStyle = C.void;
    ctx.fillRect(-40, -40, this.w + 80, this.h + 80);

    if (this.bg) {
      const px = clamp((this.px - this.w / 2) * -0.035, -30, 30);
      const py = clamp((this.py - this.h / 2) * -0.035, -30, 30);
      ctx.drawImage(this.bg, -80 + px, -80 + py, this.bg.width / this.dpr, this.bg.height / this.dpr);
    }

    this.drawBubbles(ctx);
    this.drawStars(ctx);
    this.drawDecals(ctx);

    const modeTint = MODES[this.mode].tint;
    if (modeTint && this.phase !== "menu") {
      ctx.fillStyle = modeTint;
      ctx.fillRect(-40, -40, this.w + 80, this.h + 80);
    }

    if (this.slow > 0 && this.phase === "playing") {
      ctx.fillStyle = `rgba(120,200,255,${0.1 * clamp(this.slow, 0, 1)})`;
      ctx.fillRect(-40, -40, this.w + 80, this.h + 80);
    }

    for (const it of this.items) this.drawItem(ctx, it);

    if (this.phase !== "paused") this.drawPlayer(ctx);

    this.drawParticles(ctx);
    this.drawRings(ctx);
    this.drawPopups(ctx);
    this.drawBanner(ctx);
    if (this.hudAlpha > 0.01 && this.phase !== "menu") this.drawHud(ctx);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.flash > 0.01) {
      ctx.globalAlpha = clamp(this.flash * 0.5 * this.flashScale, 0, 0.6);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.globalAlpha = 1;
    }
    if (this.hurtT > 0) {
      ctx.globalAlpha = this.hurtT * 0.55;
      const g = ctx.createRadialGradient(this.w / 2, this.h / 2, this.h * 0.25, this.w / 2, this.h / 2, this.h * 0.75);
      g.addColorStop(0, "rgba(230,59,46,0)");
      g.addColorStop(1, "rgba(230,59,46,0.9)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.globalAlpha = 1;
    }
    // last-crack danger frame
    if (this.phase === "playing" && this.cracks >= 2) {
      ctx.globalAlpha = clamp(0.3 + Math.sin(this.t * 6.5) * 0.16, 0.08, 0.5);
      ctx.strokeStyle = C.chili;
      ctx.lineWidth = 9;
      ctx.strokeRect(4.5, 4.5, this.w - 9, this.h - 9);
      ctx.globalAlpha = 1;
    }
    if (this.phase === "paused") {
      ctx.fillStyle = "rgba(6,26,26,0.62)";
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  private drawBubbles(ctx: CanvasRenderingContext2D) {
    for (const b of this.bubbles) {
      const x = b.x + Math.sin(b.wob) * 8;
      ctx.globalAlpha = b.a;
      ctx.fillStyle = C.brine;
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = b.a * 1.6;
      ctx.strokeStyle = C.jade;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawStars(ctx: CanvasRenderingContext2D) {
    for (const s of this.stars) {
      const tw = 0.5 + 0.5 * Math.sin(this.t * s.sp + s.ph);
      const a = 0.12 + tw * 0.55;
      ctx.globalAlpha = a;
      ctx.fillStyle = tw > 0.72 ? C.goldLight : C.cream;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (0.7 + tw * 0.7), 0, TAU);
      ctx.fill();
      if (tw > 0.86) {
        // sparkle cross on the brightest frames
        ctx.globalAlpha = a * 0.8;
        ctx.strokeStyle = C.cream;
        ctx.lineWidth = 1;
        const L = s.r * 3.4;
        ctx.beginPath();
        ctx.moveTo(s.x - L, s.y); ctx.lineTo(s.x + L, s.y);
        ctx.moveTo(s.x, s.y - L); ctx.lineTo(s.x, s.y + L);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawDecals(ctx: CanvasRenderingContext2D) {
    for (const d of this.decals) {
      const a = clamp(d.life / d.max, 0, 1) * 0.4;
      ctx.globalAlpha = a;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.rx, d.ry, d.rot, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private outline(ctx: CanvasRenderingContext2D, w = 2.6) {
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = w;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  private drawItem(ctx: CanvasRenderingContext2D, it: Item) {
    ctx.save();
    ctx.translate(it.x, it.y);
    const s = it.r / 16;
    ctx.scale(s, s);
    const pop = clamp((this.t - it.born) * 6, 0, 1);
    ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);

    // shadow
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(2, 4, 15, 13, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.rotate(it.rot);
    switch (it.kind) {
      case "ca": {
        ctx.fillStyle = it.def.color;
        ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill(); this.outline(ctx);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.beginPath(); ctx.ellipse(-4, -5, 4.4, 3, -0.6, 0, TAU); ctx.fill();
        ctx.fillStyle = it.def.color2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU - Math.PI / 2;
          ctx.lineTo(Math.cos(a) * 6.5, -10 + Math.sin(a) * 4.5);
        }
        ctx.closePath(); ctx.fill(); this.outline(ctx, 2);
        break;
      }
      case "ot":
      case "othiem": {
        if (it.kind === "othiem") {
          if (this.quality === "high") { ctx.shadowColor = "#ff6a4d"; ctx.shadowBlur = 22; }
        }
        ctx.fillStyle = it.def.color;
        ctx.beginPath();
        ctx.moveTo(-3, -12);
        ctx.quadraticCurveTo(11, -4, 5, 14);
        ctx.quadraticCurveTo(0, 10, -6, 2);
        ctx.quadraticCurveTo(-9, -6, -3, -12);
        ctx.closePath(); ctx.fill();
        if (this.quality === "high") ctx.shadowBlur = 0;
        this.outline(ctx);
        ctx.fillStyle = "#3f7d2a";
        ctx.beginPath(); ctx.ellipse(-3, -13, 4.5, 3, -0.4, 0, TAU); ctx.fill(); this.outline(ctx, 2);
        ctx.strokeStyle = "#3f7d2a"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-4, -14); ctx.quadraticCurveTo(-9, -19, -6, -22); ctx.stroke();
        break;
      }
      case "toi": {
        ctx.fillStyle = it.def.color;
        ctx.beginPath(); ctx.arc(0, 1, 12, 0, TAU); ctx.fill(); this.outline(ctx);
        ctx.strokeStyle = it.def.color2; ctx.lineWidth = 1.6;
        for (const dx of [-5, 0, 5]) {
          ctx.beginPath(); ctx.moveTo(dx, -8); ctx.quadraticCurveTo(dx * 1.5, 2, dx, 12); ctx.stroke();
        }
        ctx.fillStyle = it.def.color2;
        ctx.beginPath(); ctx.moveTo(-3, -10); ctx.lineTo(3, -10); ctx.lineTo(0, -17); ctx.closePath();
        ctx.fill(); this.outline(ctx, 2);
        break;
      }
      case "gung": {
        ctx.fillStyle = it.def.color;
        ctx.beginPath();
        ctx.ellipse(-4, 2, 9, 7, 0.3, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(5, -2, 8, 6, -0.4, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(1, 7, 7, 5, 0, 0, TAU); ctx.fill();
        this.outline(ctx);
        ctx.strokeStyle = it.def.color2; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(-4, 2, 4.5, 0.4, 2.6); ctx.stroke();
        break;
      }
      case "muoi": {
        ctx.fillStyle = it.def.color;
        ctx.beginPath(); ctx.rect(-9, -9, 18, 18); ctx.fill(); this.outline(ctx);
        ctx.fillStyle = it.def.color2;
        ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(0, -3); ctx.lineTo(9, -9); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(-9, 9); ctx.lineTo(0, 3); ctx.lineTo(9, 9); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }
      case "dua": {
        ctx.fillStyle = it.def.color;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.quadraticCurveTo(14, -2, 0, 15);
        ctx.quadraticCurveTo(-14, -2, 0, -15);
        ctx.closePath(); ctx.fill(); this.outline(ctx);
        ctx.strokeStyle = it.def.color2; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, 13); ctx.stroke();
        for (const sy of [-6, 0, 6]) {
          ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(7, sy - 3); ctx.moveTo(0, sy); ctx.lineTo(-7, sy - 3); ctx.stroke();
        }
        break;
      }
      case "moc": {
        ctx.fillStyle = it.def.color2;
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * TAU;
          ctx.beginPath(); ctx.arc(Math.cos(a) * 8, Math.sin(a) * 8, 6.5, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = it.def.color;
        ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill(); this.outline(ctx);
        ctx.fillStyle = "#2b3a26";
        for (const sp of it.spots ?? []) {
          ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r, 0, TAU); ctx.fill();
        }
        // sour face
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(-2, -1); ctx.moveTo(5, -2); ctx.lineTo(2, -1); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 7, 3.2, Math.PI, TAU); ctx.stroke();
        break;
      }
      case "ruoi": {
        const flap = Math.sin(this.t * 42 + it.sway) * 0.7;
        ctx.fillStyle = "rgba(220,235,245,0.55)";
        ctx.save(); ctx.rotate(-0.5 + flap * 0.5);
        ctx.beginPath(); ctx.ellipse(-6, -5, 9, 4, 0, 0, TAU); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.rotate(0.5 - flap * 0.5);
        ctx.beginPath(); ctx.ellipse(6, -5, 9, 4, 0, 0, TAU); ctx.fill();
        ctx.restore();
        ctx.fillStyle = it.def.color;
        ctx.beginPath(); ctx.ellipse(0, 1, 6.5, 10, 0, 0, TAU); ctx.fill(); this.outline(ctx);
        ctx.fillStyle = "#4a5165";
        ctx.beginPath(); ctx.arc(0, -9, 5.5, 0, TAU); ctx.fill(); this.outline(ctx, 2);
        ctx.fillStyle = "#e63b2e";
        ctx.beginPath(); ctx.arc(-2.4, -10, 2, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(2.4, -10, 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = it.def.color; ctx.lineWidth = 1.4;
        for (const sx of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(sx * 4, 3); ctx.lineTo(sx * 9, 8); ctx.stroke();
        }
        break;
      }
      case "vang": {
        if (this.quality === "high") { ctx.shadowColor = "#ffc94a"; ctx.shadowBlur = 26; }
        ctx.fillStyle = it.def.color;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          const rr = i % 2 === 0 ? 15 : 6;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill();
        if (this.quality === "high") ctx.shadowBlur = 0;
        this.outline(ctx, 2.2);
        ctx.fillStyle = "#fff6d8";
        ctx.beginPath(); ctx.arc(-2, -2, 3.4, 0, TAU); ctx.fill();
        break;
      }
      case "da": {
        if (this.quality === "high") { ctx.shadowColor = "#a8e6ff"; ctx.shadowBlur = 22; }
        ctx.fillStyle = "rgba(168,230,255,0.85)";
        ctx.beginPath();
        ctx.moveTo(-10, -7); ctx.lineTo(0, -13); ctx.lineTo(10, -7); ctx.lineTo(10, 7);
        ctx.lineTo(0, 13); ctx.lineTo(-10, 7); ctx.closePath(); ctx.fill();
        if (this.quality === "high") ctx.shadowBlur = 0;
        this.outline(ctx, 2.2);
        ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(-10, -7); ctx.lineTo(0, 0); ctx.lineTo(10, -7); ctx.moveTo(0, 0); ctx.lineTo(0, 13); ctx.stroke();
        break;
      }
      case "cavang": {
        // golden cabbage leaf — rare, fills the jar fast
        if (this.quality === "high") { ctx.shadowColor = "#ffd766"; ctx.shadowBlur = 18; }
        ctx.fillStyle = it.def.color;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.quadraticCurveTo(15, -4, 9, 12);
        ctx.quadraticCurveTo(5, 17, 0, 15);
        ctx.quadraticCurveTo(-5, 17, -9, 12);
        ctx.quadraticCurveTo(-15, -4, 0, -16);
        ctx.closePath(); ctx.fill();
        if (this.quality === "high") ctx.shadowBlur = 0;
        this.outline(ctx, 2.4);
        ctx.strokeStyle = it.def.color2; ctx.lineWidth = 1.9;
        ctx.beginPath(); ctx.moveTo(0, -13); ctx.quadraticCurveTo(3, 0, 0, 13); ctx.stroke();
        for (const sy of [-7, -1, 5]) {
          ctx.beginPath(); ctx.moveTo(0, sy); ctx.quadraticCurveTo(6, sy - 2, 9, sy - 6); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, sy); ctx.quadraticCurveTo(-6, sy - 2, -9, sy - 6); ctx.stroke();
        }
        // sparkle pip
        ctx.fillStyle = "#fffbe8";
        ctx.beginPath(); ctx.arc(0, -9, 2, 0, TAU); ctx.fill();
        break;
      }
      case "toivang": {
        // golden garlic — shield power-up, two cloves hugging a heart
        if (this.quality === "high") { ctx.shadowColor = "#ffe9a8"; ctx.shadowBlur = 24; }
        ctx.fillStyle = it.def.color;
        ctx.beginPath(); ctx.arc(-5, 2, 8.5, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(5, 2, 8.5, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -2, 8, 0, TAU); ctx.fill();
        if (this.quality === "high") ctx.shadowBlur = 0;
        this.outline(ctx, 2.2);
        ctx.fillStyle = it.def.color2;
        ctx.beginPath(); ctx.moveTo(-3.4, -9); ctx.lineTo(3.4, -9); ctx.lineTo(0, -16); ctx.closePath(); ctx.fill();
        this.outline(ctx, 2);
        ctx.strokeStyle = "rgba(199,155,45,0.9)"; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-6, 5, -4, 9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(5, 0); ctx.quadraticCurveTo(6, 5, 4, 9); ctx.stroke();
        break;
      }
      case "sau": {
        // caterpillar — segmented body with feelers, hazard
        const wig = Math.sin(this.t * 9 + it.sway) * 2.2;
        ctx.fillStyle = it.def.color2;
        for (const [sx, sy] of [[-9, 4], [9, 4]] as const) {
          ctx.beginPath(); ctx.arc(sx, sy + wig * 0.4, 4.6, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = it.def.color;
        for (const [sx, sy, rr] of [[-8, 2, 6.4], [-2.6, -2 + wig, 7], [3.2, -2 - wig, 7], [9, 2 + wig * 0.4, 6]] as const) {
          ctx.beginPath(); ctx.arc(sx, sy, rr, 0, TAU); ctx.fill();
        }
        this.outline(ctx, 2.4);
        // angry eyes
        ctx.fillStyle = C.ink;
        ctx.beginPath(); ctx.arc(-4.4, -3 + wig, 1.5, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(4.9, -3 - wig, 1.5, 0, TAU); ctx.fill();
        // feelers
        ctx.strokeStyle = it.def.color2; ctx.lineWidth = 1.8; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-5, -8 + wig); ctx.quadraticCurveTo(-7, -13 + wig, -9.5, -14 + wig); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(5, -8 - wig); ctx.quadraticCurveTo(7, -13 - wig, 9.5, -14 - wig); ctx.stroke();
        break;
      }
    }
    ctx.restore();

    if (it.mag > 0) {
      ctx.strokeStyle = `rgba(255,201,74,${clamp(it.mag, 0, 1) * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(it.x, it.y, it.r * 1.5, 0, TAU); ctx.stroke();
    }
  }

  private jarBody(ctx: CanvasRenderingContext2D, r: number) {
    const h = r * 1.18;
    ctx.beginPath();
    ctx.moveTo(-r * 0.56, -h);
    ctx.bezierCurveTo(-r * 1.06, -h * 0.42, -r * 1.02, h * 0.78, -r * 0.44, h);
    ctx.lineTo(r * 0.44, h);
    ctx.bezierCurveTo(r * 1.02, h * 0.78, r * 1.06, -h * 0.42, r * 0.56, -h);
    ctx.closePath();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    if (!this.playerAlive && this.phase === "gameover") return;
    const r = this.pr;
    const h = r * 1.18;
    const speed = Math.hypot(this.pvx, this.pvy);
    const tilt = clamp(this.pvx / 900, -0.3, 0.3) + Math.sin(this.t * 2) * 0.02;
    const sq = this.squash;
    const bob = Math.sin(this.t * 3.1) * r * 0.05;

    // trail
    for (const tr of this.trail) {
      ctx.globalAlpha = tr.a * 0.5;
      ctx.fillStyle = C.goldLight;
      ctx.beginPath(); ctx.arc(tr.x, tr.y, r * 0.5 * tr.a, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ground shadow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#04100f";
    ctx.beginPath(); ctx.ellipse(this.px, this.py + h * 1.05, r * 0.86, r * 0.28, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(this.px, this.py + bob);
    ctx.rotate(tilt + this.spinRot);
    ctx.scale(1 + sq * 0.5, 1 - sq * 0.5);

    if (this.invuln > 0 && Math.floor(this.t * 22) % 2 === 0 && this.phase === "playing") ctx.globalAlpha = 0.45;

    if (this.cheo) {
      if (this.quality === "high") ctx.shadowColor = C.goldLight;
      if (this.quality === "high") ctx.shadowBlur = 26;
    }

    // body glaze
    const g = ctx.createLinearGradient(-r, -h, r, h);
    g.addColorStop(0, "#fffaf0");
    g.addColorStop(0.45, "#f3e3c8");
    g.addColorStop(1, "#d9c09c");
    ctx.fillStyle = g;
    this.jarBody(ctx, r);
    ctx.fill();
    if (this.quality === "high") ctx.shadowBlur = 0;

    // brine
    ctx.save();
    this.jarBody(ctx, r);
    ctx.clip();
    const level = this.fill;
    const top = h - level * (h * 2 - 6) - 3;
    const wave = this.cheo ? 4.5 : 2.2;
    ctx.fillStyle = this.frenzy > 0 ? "rgba(255,106,77,0.72)" : "rgba(140,198,63,0.72)";
    ctx.beginPath();
    ctx.moveTo(-r * 1.2, top);
    for (let x = -r * 1.2; x <= r * 1.2; x += 4) {
      ctx.lineTo(x, top + Math.sin(x * 0.16 + this.t * 6 - this.pvx * 0.004) * wave);
    }
    ctx.lineTo(r * 1.2, h * 1.4);
    ctx.lineTo(-r * 1.2, h * 1.4);
    ctx.closePath();
    ctx.fill();
    // floating bits
    if (level > 0.05) {
      ctx.fillStyle = "rgba(253,243,224,0.75)";
      for (let i = 0; i < 4; i++) {
        const bx = Math.sin(this.t * 1.3 + i * 2.1) * r * 0.5;
        const by = top + 6 + ((i * 13 + this.t * 9) % Math.max(6, level * h * 1.7));
        ctx.beginPath(); ctx.arc(bx, by, r * 0.11, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();

    // decorative band
    ctx.save();
    this.jarBody(ctx, r);
    ctx.clip();
    ctx.fillStyle = "rgba(22,97,83,0.9)";
    ctx.fillRect(-r * 1.2, h * 0.34, r * 2.4, r * 0.3);
    ctx.fillStyle = C.gold;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.3, h * 0.34 + 2);
      ctx.lineTo(i * r * 0.3 + r * 0.09, h * 0.34 + r * 0.15);
      ctx.lineTo(i * r * 0.3, h * 0.34 + r * 0.3 - 2);
      ctx.lineTo(i * r * 0.3 - r * 0.09, h * 0.34 + r * 0.15);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // body outline
    this.jarBody(ctx, r);
    this.outline(ctx, 3.2);

    // rim
    ctx.fillStyle = this.cheo ? C.goldLight : C.gold;
    ctx.beginPath(); ctx.ellipse(0, -h, r * 0.62, r * 0.19, 0, 0, TAU); ctx.fill();
    this.outline(ctx, 3);
    ctx.fillStyle = "rgba(6,26,26,0.55)";
    ctx.beginPath(); ctx.ellipse(0, -h, r * 0.44, r * 0.12, 0, 0, TAU); ctx.fill();

    // cracks
    ctx.strokeStyle = "rgba(60,40,30,0.8)";
    ctx.lineWidth = 2;
    for (let i = 0; i < this.cracks; i++) {
      const cx = (i - 1) * r * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, -h * 0.8);
      ctx.lineTo(cx + r * 0.14, -h * 0.35);
      ctx.lineTo(cx - r * 0.1, h * 0.05);
      ctx.lineTo(cx + r * 0.12, h * 0.5);
      ctx.stroke();
    }

    // face
    const eyeY = -h * 0.24;
    const eyeX = r * 0.3;
    const lookX = clamp(this.pvx / 700, -1, 1) * r * 0.07;
    const lookY = clamp(this.pvy / 700, -1, 1) * r * 0.05;
    const blinking = this.blink < 0;
    const hurt = this.hurtT > 0;
    for (const sx of [-1, 1]) {
      const ex = sx * eyeX + lookX;
      if (hurt) {
        ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.11, eyeY - r * 0.11); ctx.lineTo(ex + r * 0.11, eyeY + r * 0.11);
        ctx.moveTo(ex + r * 0.11, eyeY - r * 0.11); ctx.lineTo(ex - r * 0.11, eyeY + r * 0.11);
        ctx.stroke();
      } else if (blinking) {
        ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(ex - r * 0.11, eyeY); ctx.lineTo(ex + r * 0.11, eyeY); ctx.stroke();
      } else {
        ctx.fillStyle = "#fffdf6";
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, r * 0.16, this.cheo ? r * 0.13 : r * 0.19, 0, 0, TAU);
        ctx.fill();
        this.outline(ctx, 1.8);
        ctx.fillStyle = C.ink;
        ctx.beginPath(); ctx.arc(ex + lookX * 0.7, eyeY + lookY, r * 0.075, 0, TAU); ctx.fill();
        if (this.cheo) {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath(); ctx.arc(ex + lookX * 0.7 - 1.6, eyeY + lookY - 1.6, r * 0.03, 0, TAU); ctx.fill();
        }
      }
    }
    if (!hurt) {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.4; ctx.lineCap = "round";
      const smile = this.combo > 3 || this.cheo ? r * 0.14 : r * 0.07;
      ctx.beginPath();
      ctx.arc(lookX * 0.6, -h * 0.02 + lookY, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      if (smile > r * 0.1) {
        ctx.fillStyle = "rgba(230,59,46,0.35)";
        for (const sx of [-1, 1]) {
          ctx.beginPath(); ctx.ellipse(sx * r * 0.52, -h * 0.06, r * 0.12, r * 0.07, 0, 0, TAU); ctx.fill();
        }
      }
    }

    ctx.restore();

    // garlic-shield ring — rotating dashed halo, one ring per charge
    if (this.shield > 0) {
      ctx.save();
      ctx.translate(this.px, this.py + bob);
      ctx.rotate(this.t * 1.7);
      for (let i = 0; i < this.shield; i++) {
        ctx.strokeStyle = i === 0 ? "rgba(255,233,168,0.92)" : "rgba(255,201,74,0.75)";
        ctx.lineWidth = i === 0 ? 3 : 2;
        ctx.setLineDash(i === 0 ? [12, 15] : [6, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, r * (1.42 + i * 0.22), 0, TAU);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // chéo speed streaks
    if (this.cheo && speed > 150) {
      const ang = Math.atan2(this.pvy, this.pvx) + Math.PI;
      ctx.save();
      ctx.translate(this.px, this.py + bob);
      ctx.rotate(ang);
      ctx.strokeStyle = `rgba(255,201,74,${clamp(speed / 900, 0.2, 0.75)})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (const off of [-r * 0.55, 0, r * 0.55]) {
        ctx.beginPath();
        ctx.moveTo(r * 0.9, off);
        ctx.lineTo(r * 0.9 + clamp(speed * 0.06, 10, 46), off);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.parts) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.kind === "dot") {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a, 0, TAU); ctx.fill();
      } else if (p.kind === "drop") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 1.7);
        ctx.quadraticCurveTo(p.size, 0, 0, p.size);
        ctx.quadraticCurveTo(-p.size, 0, 0, -p.size * 1.7);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === "spark") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillRect(-p.size * 2.4, -p.size * 0.34, p.size * 4.8, p.size * 0.68);
        ctx.restore();
      } else if (p.kind === "shard") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(-p.size, -p.size * 0.7);
        ctx.lineTo(p.size * 0.9, -p.size);
        ctx.lineTo(p.size * 0.4, p.size);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size * 0.6, -p.size, p.size * 1.2, p.size * 2);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawRings(ctx: CanvasRenderingContext2D) {
    for (const r of this.rings) {
      const a = clamp(r.life / r.max, 0, 1);
      ctx.globalAlpha = a * 0.85;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width * a;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawPopups(ctx: CanvasRenderingContext2D) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const p of this.pops) {
      const k = p.life / p.max;
      const scale = 1 + (1 - k) * 0.12 + Math.sin((1 - k) * 9) * 0.05;
      ctx.globalAlpha = clamp(k * 1.7, 0, 1);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(scale, scale);
      ctx.font = `${p.size}px Bungee, "Be Vietnam Pro", sans-serif`;
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(6,26,26,0.9)";
      ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  private drawBanner(ctx: CanvasRenderingContext2D) {
    if (!this.banner) return;
    const b = this.banner;
    const k = 1 - b.life / b.max;
    const inK = clamp(k * 6, 0, 1);
    const outK = clamp(b.life / 0.4, 0, 1);
    const sc = 0.7 + inK * 0.3 + Math.sin(inK * Math.PI) * 0.08;
    ctx.save();
    ctx.globalAlpha = clamp(Math.min(inK, outK), 0, 1);
    ctx.translate(this.w / 2, this.h * 0.3);
    ctx.scale(sc, sc);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.round(clamp(this.w * 0.075, 30, 62))}px Bungee, "Be Vietnam Pro", sans-serif`;
    ctx.lineWidth = 9;
    ctx.strokeStyle = "rgba(6,26,26,0.92)";
    ctx.strokeText(b.text, 0, 0);
    ctx.fillStyle = b.color;
    ctx.fillText(b.text, 0, 0);
    ctx.font = `600 ${Math.round(clamp(this.w * 0.022, 13, 20))}px "Be Vietnam Pro", sans-serif`;
    ctx.lineWidth = 5;
    ctx.strokeText(b.sub, 0, clamp(this.w * 0.062, 26, 52));
    ctx.fillStyle = C.cream;
    ctx.fillText(b.sub, 0, clamp(this.w * 0.062, 26, 52));
    ctx.restore();
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }

  /* --------------------------------------------------------------- hud */

  private txt(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, font = "Bungee") {
    ctx.font = `${size}px ${font}, "Be Vietnam Pro", sans-serif`;
    ctx.lineWidth = Math.max(3, size * 0.18);
    ctx.strokeStyle = "rgba(6,26,26,0.85)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  private bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, v: number, col: string, bg = "rgba(6,26,26,0.7)") {
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.roundRect(x + 2, y + 2, Math.max(0, (w - 4) * clamp(v, 0, 1)), h - 4, (h - 4) / 2); ctx.fill();
  }

  private drawHud(ctx: CanvasRenderingContext2D) {
    const a = this.hudAlpha;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textBaseline = "alphabetic";
    const pad = Math.round(clamp(this.w * 0.022, 14, 26));
    const s = clamp(this.w / 900, 0.78, 1.16);

    // ---- score (top-left)
    ctx.textAlign = "left";
    const score = fmtNum(this.stats.score);
    this.txt(ctx, score, pad, pad + 34 * s, Math.round(36 * s), C.cream);
    this.txt(ctx, `${t("hud.best")} ${fmtNum(Math.max(this.best, Math.round(this.stats.score)))}`, pad, pad + 54 * s, Math.round(13 * s), C.goldLight, '"Be Vietnam Pro"');

    // stamina (chéo)
    const sy = pad + 68 * s;
    ctx.save();
    ctx.translate(pad + 6, sy + 5);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = this.cheo ? C.goldLight : "rgba(253,243,224,0.55)";
    ctx.fillRect(-2.5, -7, 5, 14);
    ctx.restore();
    this.bar(ctx, pad + 18, sy, 118 * s, 11, this.stamina, this.stamina < 0.25 ? C.chili : C.goldLight);
    if (this.cheo) this.txt(ctx, t("hud.cheo"), pad + 142 * s, sy + 11, Math.round(14 * s), C.goldLight);

    // ---- cracks (top-right)
    ctx.textAlign = "right";
    const cr = 16 * s;
    for (let i = 0; i < 3; i++) {
      const x = this.w - pad - (2 - i) * (cr + 8);
      const y = pad + 78 * s;
      const alive = i >= this.cracks;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = a * (alive ? 1 : 0.28);
      ctx.fillStyle = alive ? C.cream : "#6b5a48";
      ctx.beginPath();
      ctx.moveTo(-cr * 0.42, -cr * 0.6);
      ctx.bezierCurveTo(-cr * 0.8, -cr * 0.1, -cr * 0.75, cr * 0.55, -cr * 0.3, cr * 0.62);
      ctx.lineTo(cr * 0.3, cr * 0.62);
      ctx.bezierCurveTo(cr * 0.75, cr * 0.55, cr * 0.8, -cr * 0.1, cr * 0.42, -cr * 0.6);
      ctx.closePath();
      ctx.fill();
      this.outline(ctx, 2.2);
      ctx.fillStyle = alive ? C.gold : "#4a3f33";
      ctx.beginPath(); ctx.ellipse(0, -cr * 0.6, cr * 0.46, cr * 0.15, 0, 0, TAU); ctx.fill();
      this.outline(ctx, 2);
      ctx.restore();
    }
    ctx.globalAlpha = a;

    // ---- centre column: level, combo, fill
    const cx = this.w / 2;
    ctx.textAlign = "center";
    this.txt(ctx, t("hud.level", { n: this.stats.level }), cx, pad + 20 * s, Math.round(15 * s), C.goldLight);
    this.txt(
      ctx,
      t("hud.jarsCatches", { jars: this.stats.jars, catches: this.stats.catches }),
      cx, pad + 38 * s, Math.round(12 * s), "rgba(253,243,224,0.75)", '"Be Vietnam Pro"',
    );

    // fill meter
    const fw = clamp(this.w * 0.24, 120, 240);
    this.bar(ctx, cx - fw / 2, pad + 46 * s, fw, 10, this.fill, C.brine);
    const timeLimit = MODES[this.mode].timeLimit;
    if (timeLimit) {
      // ĐUA 60 GIÂY — countdown replaces the quiet jar label; pulses red under 10s
      const left = Math.max(0, timeLimit - this.stats.time);
      const urgent = left <= 10.5;
      const pulse = urgent ? 1 + 0.18 * Math.abs(Math.sin(this.t * 6)) : 1;
      this.txt(ctx, t("hud.timeLeft", { n: Math.ceil(left) }), cx, pad + 70 * s, Math.round((urgent ? 15 : 13) * s * pulse), urgent ? C.chili : C.goldLight, '"Be Vietnam Pro"');
    } else {
      ctx.font = `700 ${Math.round(10 * s)}px "Be Vietnam Pro", sans-serif`;
      ctx.fillStyle = "rgba(253,243,224,0.7)";
      ctx.fillText(t("hud.jar"), cx, pad + 70 * s);
    }

    // combo
    if (this.combo > 1) {
      const k = clamp(this.comboT / comboWindowFor(this.mode), 0, 1);
      const pulse = 1 + Math.sin(this.t * 12) * 0.04 * (this.combo > 8 ? 1 : 0.4);
      ctx.save();
      ctx.translate(cx, pad + 96 * s);
      ctx.scale(pulse, pulse);
      this.txt(ctx, t("hud.combo", { n: this.combo }), 0, 0, Math.round(clamp(18 + this.combo * 0.7, 18, 34) * s), this.multiplier() >= 6 ? C.chili : C.goldLight);
      ctx.restore();
      this.bar(ctx, cx - 46 * s, pad + 104 * s, 92 * s, 5, k, "rgba(255,201,74,0.8)");
      ctx.textAlign = "center";
      this.txt(ctx, `×${this.multiplier()}`, cx, pad + 128 * s, Math.round(16 * s), C.cream);
    }

    // power chips
    const chips: [string, number, number, string][] = [];
    if (this.frenzy > 0) chips.push([t("hud.frenzy"), this.frenzy, 7, "#ff6a4d"]);
    if (this.slow > 0) chips.push([t("hud.slow"), this.slow, 5, "#a8e6ff"]);
    if (this.shield > 0) chips.push([t("hud.shield", { n: this.shield }), this.shield, 2, "#ffe9a8"]);
    if (this.phase === "playing") {
      chips.push([
        this.slamCd > 0 ? t("hud.slamCd") : t("hud.slamReady"),
        6 - this.slamCd,
        6,
        this.slamCd > 0 ? "#7fa396" : C.goldLight,
      ]);
    }
    chips.forEach(([label, v, m, col], i) => {
      const y = pad + (this.combo > 1 ? 146 : 96) * s + i * 24 * s;
      const wChip = Math.max(142 * s, 126);
      ctx.fillStyle = "rgba(6,26,26,0.72)";
      ctx.beginPath(); ctx.roundRect(cx - wChip / 2, y - 14 * s, wChip, 18 * s, 9 * s); ctx.fill();
      this.bar(ctx, cx - wChip / 2 + 3, y - 11 * s, wChip - 6, 12 * s, v / m, col);
      ctx.globalAlpha = a;
      ctx.textAlign = "center";
      ctx.font = `800 ${Math.round(10.5 * s)}px "Be Vietnam Pro", sans-serif`;
      ctx.lineWidth = 3.4;
      ctx.strokeStyle = "rgba(6,26,26,0.92)";
      ctx.strokeText(label, cx, y - 2 * s);
      ctx.fillStyle = C.cream;
      ctx.fillText(label, cx, y - 2 * s);
    });

    // mode tag — bottom-centre, very quiet
    ctx.textAlign = "center";
    ctx.globalAlpha = a * 0.55;
    ctx.font = `800 ${Math.round(9 * s)}px "Be Vietnam Pro", sans-serif`;
    ctx.fillStyle = "rgba(253,243,224,0.9)";
    ctx.fillText(`— ${t(`mode.${this.mode}.name`)} —`, cx, this.h - 10 * s);
    ctx.globalAlpha = a;

    ctx.restore();
    ctx.textAlign = "left";
  }
}
