/**
 * The playfield, sized from the canvas instead of from constants.
 *
 * WHY THIS MOVED OUT OF `engine.ts`
 * ---------------------------------
 * `LoCheoGame.resize()` computed four numbers inline:
 *
 *     this.S  = clamp(ch / 700, 0.62, 1.45)          item + particle scale
 *     this.SP = clamp((cw/1000 + ch/700) / 2, .6, 1.25)  player speed
 *     this.pr = clamp(min(cw, ch) * 0.055, 21, 38)   player radius
 *     n       = clamp(w*h / 26000, 18, 46)           background stars
 *
 * They are correct, and they are unreachable: nothing can ask "what does the
 * engine think a 320×240 canvas is" without constructing an engine, a canvas and
 * a `ResizeObserver`. This release adds the HUD scale and the edge margin the
 * same way, and a fourth question inline would have made the resize handler the
 * only place in the app where adaptive maths lives inside a class.
 *
 * The formulas are copied **exactly** — the same constants, the same clamps — so
 * this is a move, not a change of feel. `tests/playfield.test.ts` asserts the
 * numbers against the old expressions at every size the app can be run at.
 *
 * WHAT IS NEW
 * -----------
 *   `hudScale`     the score and combo readouts grow with the canvas; at 1280
 *                  they were 34px on a 2400px-wide ultrawide
 *   `edgeMargin`   how far from the canvas edge an item may be born, so a
 *                  hazard cannot appear half-clipped against a wall
 *   `safeBottom`   the strip the touch joystick lives in
 */

/** Everything the engine needs to know about its canvas. */
export interface PlayfieldPlan {
  /** Canvas width, CSS px. */
  width: number;
  /** Canvas height, CSS px. */
  height: number;
  /** Device pixel ratio, clamped to `[1, 2]` — the engine's own ceiling. */
  dpr: number;
  /** Item size, particle size and speed multiplier. */
  itemScale: number;
  /** Player movement multiplier — blends both axes. */
  playerSpeed: number;
  /** Player radius, px. */
  playerRadius: number;
  /** HUD text multiplier, `[0.85, 1.3]`. */
  hudScale: number;
  /** Background star count. */
  stars: number;
  /** Floating decoration count. */
  decor: number;
  /** Background tile size, px. */
  tile: number;
  /** Keep-out margin for spawning, px. */
  edgeMargin: number;
  /** Height of the bottom strip reserved for the touch stick, px. */
  safeBottom: number;
}

/** The engine's own floor: below this the canvas is not a game board. */
export const MIN_PLAYFIELD_W = 240;
export const MIN_PLAYFIELD_H = 320;

/**
 * A canvas dimension, made safe the way `resize()` already does.
 *
 * Kept here rather than in the engine so `planPlayfield()` is total: the engine
 * can hand it a `NaN` from a `getBoundingClientRect()` on a hidden element and
 * get a usable board back.
 */
export function saneCanvasSide(value: unknown, floor: number): number {
  const v = typeof value === "number" && Number.isFinite(value) && value > 0 ? value : floor;
  return Math.max(floor, Math.floor(v));
}

/** `[1, 2]`, and `1` for anything that is not a finite positive number. */
export function saneDpr(value: unknown): number {
  const v = typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 1;
  return Math.min(2, Math.max(1, v));
}

/**
 * The plan for a canvas.
 *
 * Every clamp is written with an explicit finite guard rather than
 * `Math.max(0, x)`, because `Math.max(0, NaN)` is `NaN` and a `NaN` in
 * `this.pr` makes every collision check false — the jar stops colliding with
 * anything, which reads as "the hitbox broke", not as "a number was bad".
 */
export function planPlayfield(width: unknown, height: unknown, dpr: unknown = 1): PlayfieldPlan {
  const w = saneCanvasSide(width, MIN_PLAYFIELD_W);
  const h = saneCanvasSide(height, MIN_PLAYFIELD_H);
  const small = Math.min(w, h);
  const area = w * h;

  const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);

  const itemScale = clamp(h / 700, 0.62, 1.45);
  const playerSpeed = clamp((w / 1000 + h / 700) / 2, 0.6, 1.25);
  const playerRadius = clamp(small * 0.055, 21, 38);
  /*
   * The HUD multiplier tops out **below** the item multiplier's ceiling on
   * purpose: a score that scales as aggressively as the falling produce ends up
   * covering the board on a cinema display, and the score is the one number the
   * player must be able to read while moving.
   */
  const hudScale = clamp(small / 720, 0.85, 1.3);

  return {
    width: w,
    height: h,
    dpr: saneDpr(dpr),
    itemScale: Math.round(itemScale * 1000) / 1000,
    playerSpeed: Math.round(playerSpeed * 1000) / 1000,
    playerRadius: Math.round(playerRadius * 10) / 10,
    hudScale: Math.round(hudScale * 1000) / 1000,
    stars: Math.round(clamp(area / 26_000, 18, 46)),
    decor: Math.round(clamp(area / 42_000, 10, 26)),
    tile: Math.round(72 * itemScale),
    edgeMargin: Math.round(clamp(small * 0.06, 12, 48)),
    safeBottom: Math.round(clamp(h * 0.16, 56, 140)),
  };
}

/**
 * Is the canvas big enough to play on?
 *
 * A 320×320 board with a 38px jar and 90px-tall produce is not a game, it is a
 * slideshow. The engine does not refuse to run — a hidden tab reports 0 and must
 * recover — but the HUD uses this to hide the combo meter it cannot fit.
 */
export function playable(plan: PlayfieldPlan): boolean {
  return plan.width >= 360 && plan.height >= 420;
}

/** One line, for the game-over screen's debug row and the tests. */
export function describePlayfield(plan: PlayfieldPlan): string {
  return `${plan.width}×${plan.height} · items ×${plan.itemScale} · jar ${plan.playerRadius}px · hud ×${plan.hudScale}`;
}
