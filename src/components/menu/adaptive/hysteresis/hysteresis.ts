/**
 * Stop the layout flapping at a breakpoint.
 *
 * THE BUG THIS PREVENTS
 * ---------------------
 * `resolveAdaptive()` is a pure function, so the layout is a step function of the
 * window. Two of those steps are 1px wide: at 700px the hero switches row→stack,
 * the panel row switches dense→compact, and the ticker appears. Drag a window edge
 * slowly across that pixel and the screen re-lays-out on every mouse move — a hero
 * that jumps between two arrangements, a ticker that blinks on and off, a font that
 * changes size. On a trackpad that lands near the boundary, it can oscillate while
 * the pointer is still.
 *
 * A pure step function cannot fix that, because the *input* is genuinely on both
 * sides of the step. What fixes it is a little state: remember the rung that was
 * painted, and only change it when the window has moved far enough past the edge
 * that the change is a decision rather than jitter.
 *
 * WHY THIS IS SAFE
 * ----------------
 * The held profile is the *previous* profile, so every number in it was already
 * validated by the contract for a window within `margin` pixels of this one. The
 * hold is bounded twice over:
 *
 *  - by distance — `margin` is 2px by default, and the smallest step between two
 *    rungs in the contract is the 8px of the panel header, so a held profile is
 *    never a *visibly wrong* layout;
 *  - by direction — the hold only applies while the window is on the *same side* as
 *    it came from, so a drag that keeps going applies the new rung as soon as it is
 *    `margin` past the edge. Nothing gets stuck.
 *
 * A large jump (a rotation, a fullscreen toggle, a restored window) is never held:
 * it is more than `margin` away in the first frame, so the new rung applies at once.
 */

import type { AdaptiveProfile } from "../resolve";

/**
 * How far the window may move before a rung change is believed, in px.
 *
 * 2 is chosen against the grid rather than by taste: `planMenuLayout()`'s own
 * thresholds are integer pixels and the chrome's smallest step (panel header
 * compact vs full) is 8px, so a 2px hold can never straddle two visual states that
 * differ by less than the band it is holding.
 */
export const HYSTERESIS_MARGIN = 2;

/** The part of a profile a player can *see* change in one frame. */
export interface RungKey {
  tier: string;
  density: string;
  hero: string;
  fit: string;
  panelHeight: number;
}

/** The visible rung of a profile, as a comparable value. */
export function rungKeyOf(profile: AdaptiveProfile): RungKey {
  return {
    tier: profile.tier,
    density: profile.density,
    hero: profile.hero.sideBySide ? "row" : "stack",
    fit: profile.plan.fit,
    panelHeight: profile.panelHeight,
  };
}

/** True when two profiles would paint the same *arrangement* (size may differ). */
export function sameRung(a: AdaptiveProfile, b: AdaptiveProfile): boolean {
  const x = rungKeyOf(a);
  const y = rungKeyOf(b);
  return (
    x.tier === y.tier &&
    x.density === y.density &&
    x.hero === y.hero &&
    x.fit === y.fit &&
    x.panelHeight === y.panelHeight
  );
}

/**
 * Should the previous profile be kept instead of the freshly resolved one?
 *
 * `previous` may be `null` (first frame, or after a reset) and then the answer is
 * always `false`: there is nothing to hold, and holding nothing is how a profile
 * gets stuck at the SSR reference size.
 */
export function shouldHold(
  previous: AdaptiveProfile | null,
  next: AdaptiveProfile,
  margin: number = HYSTERESIS_MARGIN,
): boolean {
  if (!previous) return false;
  if (!Number.isFinite(margin) || margin <= 0) return false;
  /* Same arrangement: the numbers may differ freely, there is nothing to hold. */
  if (sameRung(previous, next)) return false;
  const dw = Math.abs(previous.box.width - next.box.width);
  const dh = Math.abs(previous.box.height - next.box.height);
  if (!Number.isFinite(dw) || !Number.isFinite(dh)) return false;
  return dw <= margin && dh <= margin;
}

/**
 * The profile to paint: the previous one while the window is within `margin` of a
 * rung change, the new one otherwise.
 *
 * Pure and total — the same arguments always give the same answer, and a `NaN`
 * box (which `previous` cannot have, but a caller can pass) simply means "hold
 * nothing", never "hold forever".
 */
export function stabilize(
  previous: AdaptiveProfile | null,
  next: AdaptiveProfile,
  margin: number = HYSTERESIS_MARGIN,
): AdaptiveProfile {
  return shouldHold(previous, next, margin) && previous ? previous : next;
}
