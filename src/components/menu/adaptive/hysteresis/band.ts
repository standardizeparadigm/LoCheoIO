/**
 * The two-pixel band, and the verdict about it.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM `hysteresis.ts`
 * ---------------------------------------------------
 * `shouldHold()` answers one question with one boolean, and a boolean is the
 * right answer for the caller and the wrong answer for everyone else. When the
 * layout does *not* jump at a boundary, three different people ask three
 * different things:
 *
 *   the player      "did it just flicker?"          → nothing to ask
 *   the reviewer    "why is this profile 2px stale?" → `diagnose()` row 12
 *   the test        "which of the five reasons?"     → this file
 *
 * So the question is answered once, here, as a verdict with a reason, and every
 * other reader — `shouldHold()`, `stabilize()`, the diagnosis, the drag audit —
 * reads the same verdict. A second implementation of "is this a hold" is how the
 * diagnosis ends up disagreeing with the pixels.
 *
 * THE FIVE VERDICTS
 * -----------------
 * `first-frame`  nothing painted yet: hold nothing, or the profile is stuck at
 *                the SSR reference size forever.
 * `no-band`      a margin of zero or a `NaN` is a caller asking for no stability,
 *                and it is honoured rather than silently replaced by 2.
 * `same-rung`    the arrangement did not change. Sizes may differ freely — a 1px
 *                wider window is not a decision to un-make.
 * `still`        the window did not move at all and the rung still changed, so
 *                something *other than geometry* changed it: a safe-area inset
 *                arriving, a preference flipping. That is news, not jitter, and
 *                holding it would delay the player's own choice — and, since the
 *                next frame is in the same state, hold it forever.
 * `jump`         the window moved further than the band on either axis.
 * `held`         the window moved inside the band and the rung changed: the one
 *                case where the previous profile is painted instead.
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

/** Why the previous profile was, or was not, kept. */
export type HoldReason =
  | "first-frame"
  | "no-band"
  | "same-rung"
  | "still"
  | "jump"
  | "held";

/** Which axis kept the window inside the band. Only meaningful when `hold`. */
export type HoldAxis = "width" | "height" | "both";

/** The whole answer, in one value. */
export interface HoldVerdict {
  /** Keep the previous profile instead of the freshly resolved one. */
  hold: boolean;
  reason: HoldReason;
  /** Pixels the window moved, per axis — always finite. */
  dw: number;
  dh: number;
  /** `null` unless `hold`: which side(s) of the box moved. */
  axis: HoldAxis | null;
  /** The rung that was painted, and the one that asked to replace it. */
  from: RungKey | null;
  to: RungKey | null;
}

/** One row of a verdict, in the player's terms — for `diagnose()`. */
export function describeVerdict(v: HoldVerdict): string {
  if (!v.hold) {
    if (v.reason === "same-rung") return "no rung change to hold";
    if (v.reason === "still") return "the rung changed without the window moving — applied at once";
    if (v.reason === "jump") return `moved ${Math.max(v.dw, v.dh)}px past the band — a jump, not jitter`;
    if (v.reason === "first-frame") return "nothing painted yet";
    return "no band to hold in";
  }
  const from = v.from ? `${v.from.tier} · ${v.from.density} · ${v.from.hero}` : "?";
  const to = v.to ? `${v.to.tier} · ${v.to.density} · ${v.to.hero}` : "?";
  const moved = v.axis === "both" ? `${v.dw}×${v.dh}px` : `${v.axis === "width" ? v.dw : v.dh}px`;
  return `held ${from} instead of ${to} — the window moved ${moved} (${v.axis})`;
}

/**
 * Should the previous profile be kept instead of the freshly resolved one?
 *
 * Total: `previous` may be `null`, a margin may be `NaN` or negative, and a box
 * may be full of `NaN` — each of those answers "hold nothing", never "hold
 * forever".
 */
export function explainHold(
  previous: AdaptiveProfile | null,
  next: AdaptiveProfile,
  margin: number = HYSTERESIS_MARGIN,
): HoldVerdict {
  const dw = previous ? Math.abs(previous.box.width - next.box.width) : 0;
  const dh = previous ? Math.abs(previous.box.height - next.box.height) : 0;
  const base: HoldVerdict = {
    hold: false,
    reason: "first-frame",
    dw: Number.isFinite(dw) ? dw : 0,
    dh: Number.isFinite(dh) ? dh : 0,
    axis: null,
    from: null,
    to: null,
  };
  if (!previous) return base;
  if (!Number.isFinite(margin) || margin <= 0) return { ...base, reason: "no-band" };
  if (sameRung(previous, next)) return { ...base, reason: "same-rung" };

  const from = rungKeyOf(previous);
  const to = rungKeyOf(next);
  const changed: HoldVerdict = { ...base, from, to };

  /* A `NaN` box is a caller's mistake; a bad input never earns a hold. */
  if (!Number.isFinite(dw) || !Number.isFinite(dh)) return { ...changed, reason: "jump" };

  /*
   * A rung change with the window exactly where it was did not come from the
   * window. Holding it would suppress the thing that *did* change it — and the
   * next frame is identical, so the hold would never be released.
   */
  if (dw + dh === 0) return { ...changed, reason: "still" };

  if (dw > margin || dh > margin) return { ...changed, reason: "jump" };

  const axis: HoldAxis = dw > 0 && dh > 0 ? "both" : dw > 0 ? "width" : "height";
  return { ...changed, hold: true, reason: "held", axis };
}

/**
 * The one-bit form — the API the hook and the tests already use.
 *
 * Implemented as a read of `explainHold()` rather than as its own condition, so
 * "what the layout does" and "why the layout did it" cannot drift apart.
 */
export function shouldHold(
  previous: AdaptiveProfile | null,
  next: AdaptiveProfile,
  margin: number = HYSTERESIS_MARGIN,
): boolean {
  return explainHold(previous, next, margin).hold;
}
