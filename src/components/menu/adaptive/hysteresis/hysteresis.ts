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
 *
 * ROUND 16 — THE ONE CASE THAT WOULD HAVE STUCK
 * ---------------------------------------------
 * Twice over: the *distance* guards above are about the window moving, and the
 * first version asked only whether the two boxes were close — which is also true
 * when they are identical. A rung change with **no movement at all** does not come
 * from the window: a safe-area inset arrives, a preference flips, a dialog opens.
 * The old condition held that too, and because the next frame is in exactly the
 * same state, `last.current` never advanced: the layout stayed on the old rung for
 * as long as the condition that changed it lasted. `explainHold()` now names that
 * case (`still`) and applies the new rung at once. See `band.ts`.
 */
import type { AdaptiveProfile } from "../resolve";
import { HYSTERESIS_MARGIN, shouldHold } from "./band";

export {
  HYSTERESIS_MARGIN,
  describeVerdict,
  explainHold,
  rungKeyOf,
  sameRung,
  shouldHold,
} from "./band";
export type { HoldAxis, HoldReason, HoldVerdict, RungKey } from "./band";

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
