/**
 * Environment signals the layout needs but the viewport size does not carry.
 *
 * `planMenuLayout()` is a pure function of `{ width, height }`, and that is the
 * right signature for the *geometry*. It is not enough for four things that
 * change what the geometry should be:
 *
 *   · **safe-area insets** — a notched phone loses 44px at the top and 34px at
 *     the bottom to the system, and those pixels are not available to a panel
 *     pinned to the screen edge;
 *   · **`dpr`** — a 2× display draws a 1px border as 2 device pixels, which is
 *     why the corner ticks are 3px and not 1; below 1.5 they read as hairlines;
 *   · **orientation** — `width > height` is not the same question as "is this a
 *     landscape phone", because a 1600×900 window is landscape too and should
 *     not get the phone economy;
 *   · **coarse pointer** — a touch device has no hover, so anything revealed on
 *     `:hover` is unreachable, and the 34px row is below the 44px touch target.
 *
 * Everything here is a *reading*, not a decision. Decisions stay in `fit.ts` and
 * `hero.ts`; this module exists so they can be given the values without either
 * of them touching `window`.
 */

/** What the environment reports, normalised to a shape a pure function can take. */
export interface Environment {
  /** Device pixel ratio, clamped to `[1, 4]`. 1 when unknown. */
  dpr: number;
  /** `width > height`. */
  landscape: boolean;
  /** The primary input cannot hover — a touch screen. */
  coarse: boolean;
  /**
   * Insets in CSS pixels, in the order CSS uses. `0` where the platform does
   * not report them (every desktop browser).
   */
  insetTop: number;
  insetRight: number;
  insetBottom: number;
  insetLeft: number;
  /** `prefers-reduced-motion: reduce`. */
  reducedMotion: boolean;
}

/** The environment every browser without the relevant APIs reports. */
export const DESKTOP_ENVIRONMENT: Environment = {
  dpr: 1,
  landscape: true,
  coarse: false,
  insetTop: 0,
  insetRight: 0,
  insetBottom: 0,
  insetLeft: 0,
  reducedMotion: false,
};

/** `[1, 4]`, with anything non-finite read as 1. */
export function saneDpr(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return 1;
  return Math.min(4, Math.max(1, v));
}

/**
 * Parse one `env(safe-area-inset-*)` value.
 *
 * The value arrives either as a number (from a test) or as a CSS px string (from
 * `getComputedStyle`). `"44px"` → 44, `""` → 0 (Chrome on desktop returns the
 * empty string for an unsupported `env()`), `"auto"` → 0.
 */
export function parseInset(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
  if (typeof v !== "string") return 0;
  const m = v.trim().match(/^(-?[\d.]+)px$/);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

/**
 * How many pixels the safe areas take from the *vertical* budget.
 *
 * Top and bottom only. The left and right insets do not shrink the hero — they
 * narrow the *panel* column, which `planMenuLayout` already handles with its
 * `width - CORNER_ROW_MARGIN * 2` clamp — but they do matter on a landscape
 * notched phone, where the notch is on one side and 44px of a 390px-tall screen
 * is 11% of the height.
 */
export function verticalInset(env: Environment): number {
  return Math.max(0, env.insetTop) + Math.max(0, env.insetBottom);
}

/**
 * Is this a *phone* in landscape, rather than a short desktop window?
 *
 * The distinction matters and the existing plan does not make it: a 900×500
 * window and an 844×390 phone both report landscape, and both land in the same
 * economy. That is right for the geometry and wrong for the controls — the phone
 * needs 44px rows, the window does not.
 *
 * Coarse pointer is the discriminator, because it is the only signal that
 * distinguishes "small screen" from "small window".
 */
export function isHandheld(env: Environment, width: number, height: number): boolean {
  if (!env.coarse) return false;
  const w = Number.isFinite(width) ? Math.max(1, Math.trunc(width)) : 1;
  const h = Number.isFinite(height) ? Math.max(1, Math.trunc(height)) : 1;
  return w > h && h <= HANDHELD_MAX_HEIGHT;
}

/** Taller than this and a touch screen is a tablet, not a phone. */
export const HANDHELD_MAX_HEIGHT = 500;

/**
 * The row height a touch device needs, in px.
 *
 * WCAG 2.2 SC 2.5.8 asks for 24×24 CSS px as a minimum and Apple's HIG asks for
 * 44; this project's rows are 34 (normal) and 26 (tight), so a touch device gets
 * neither. Raising them is not free — it is 8 × 7 = 56px off a 390px screen —
 * which is exactly why `isHandheld()` gates it.
 */
export const TOUCH_ROW_HEIGHT = 44;
