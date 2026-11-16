/**
 * A number for a layout, so two layouts can be compared.
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * `repair/` answers *whether* a candidate satisfies the contract, and stops at the
 * first one that does. That is the right rule for a repair (cheapest rung first)
 * but it is not a comparison: it cannot say that one candidate is *cheaper* than
 * another, so it cannot answer "was as-planned actually the best choice here?"
 * or "of the six rungs, which gives up the least?".
 *
 * A decision needs an order, and an order needs something to order by. This file
 * defines that thing: a `Score` with a fixed set of terms and a fixed priority.
 *
 * THE PRIORITY IS THE POINT
 * -------------------------
 * A weighted sum would be shorter to write and wrong to read: it would let 40px
 * of slack buy back a lost mascot if the weights happened to line up that way.
 * The terms are therefore compared **lexicographically**, in the order they are
 * declared, and each one is a thing a player can see:
 *
 *   1. `violations` — a layout that breaks the contract is not a candidate;
 *   2. `hidden`      — the mascot, deck and tagline are gone (`plan.minimal`);
 *   3. `cropped`     — px the plan is short of its own floor;
 *   4. `hudLost`     — the HUD's share of the board, 0..1;
 *   5. `typeDrop`    — px below the as-planned type, summed over the scale;
 *   6. `levers`      — how many repair levers were pulled at all;
 *   7. `slack`       — unused vertical room. A tie-breaker, not a goal.
 *
 * The first two of those — `hidden` and `cropped` — are measured **against the
 * base profile**, so they mean "we hid the mascot", never "this window is small".
 * A cost that is really a property of the window would make comparisons in the
 * tightest corner of the space meaningless, which is exactly where they matter.
 *
 * Type is fifth and levers sixth: **the smallest visible loss ranks above the
 * number of things we changed**. Inverting those two would prefer a profile that
 * pulls four levers and loses no type over one that pulls a single lever and
 * loses a little — and the player cannot see how many levers were pulled, only
 * the type.
 *
 * WHY `slack` IS LAST
 * -------------------
 * Slack is the only term that is not a loss: a window with a 518px band and 300px
 * of hero content is *spacious*, not wrong — that is what `spacious` density is
 * for. It sits at the bottom so it can break exact ties (two candidates that
 * sacrifice nothing) without ever outweighing a sacrifice.
 */

import { heroContentHeight } from "../hero";
import { lockupBoxOf } from "../typeScale";
import type { AdaptiveProfile } from "../resolve";

/** Every term, in priority order. `terms` is compared left to right. */
export const SCORE_ORDER = [
  "violations",
  "hidden",
  "cropped",
  "hudLost",
  "typeDrop",
  "levers",
  "slack",
] as const;

/** One term's name. */
export type ScoreTerm = (typeof SCORE_ORDER)[number];

/** What a candidate costs, term by term. All finite, all ≥ 0. */
export type ScoreTerms = Record<ScoreTerm, number>;

/** A scored candidate. */
export interface Score {
  /** False when at least one invariant fails: not a candidate at all. */
  ok: boolean;
  /** The terms, for printing and for the fixtures. */
  terms: ScoreTerms;
  /** Violation ids, empty when `ok`. */
  broken: string[];
}

/** What the comparer needs; a `Score` has all of it. */
export interface Comparable {
  ok: boolean;
  terms: ScoreTerms;
  broken: string[];
}

/**
 * Everything a score compares *against*: the profile the app renders with no
 * levers, plus the invariant check for the candidate in hand.
 *
 * `violations` is passed in rather than imported so this module has no opinion
 * about which contract is in force — `select.ts` hands in the real one, and the
 * tests hand in a stricter one to make the lower rungs reachable.
 */
export interface ScoreContext {
  /** The unmodified profile for the same window. */
  base: AdaptiveProfile;
  /** Invariant ids the candidate fails. */
  broken: string[];
}

/**
 * How many px of type the candidate gave up against the base, summed.
 *
 * Summed rather than maxed on purpose: shrinking fourteen sizes by 1px is a
 * different thing from shrinking one size by 14px, and a maximum would call them
 * equal. The scale is mostly the same value repeated (label, hint, body), so the
 * sum tracks what the player actually sees across the screen.
 */
export function typeDropOf(base: AdaptiveProfile, candidate: AdaptiveProfile): number {
  let lost = 0;
  for (const key of Object.keys(base.type) as Array<keyof AdaptiveProfile["type"]>) {
    const before = base.type[key];
    const after = candidate.type[key];
    if (typeof before !== "number" || typeof after !== "number") continue;
    const delta = before - after;
    if (Number.isFinite(delta) && delta > 0) lost += delta;
  }
  /* One decimal: the type scale is computed in tenths of a px, so a loss smaller
   * than that is floating-point noise, not a decision. */
  return Math.round(lost * 10) / 10;
}

/**
 * Unused vertical room in the hero band, px.
 *
 * `scene − reserve` is the band; the hero's own content height is what it paints.
 * Negative values are clamped: content taller than the band is `cropped`'s
 * business, not slack's, and a negative slack would sort a broken layout ahead of
 * a roomy one.
 */
export function slackOf(profile: AdaptiveProfile): number {
  const painted = heroPaintedHeight(profile);
  return Math.max(0, Math.round(profile.plan.scene - painted));
}

/**
 * The hero's painted height, px.
 *
 * `hero.ts` owns this measurement — including the stacked case, where the mascot
 * is a flex sibling and the height is a *sum*, not the lockup. Calling it rather
 * than measuring again is the whole rule this project keeps relearning: a second
 * definition of the same quantity drifts, and the drift is silent.
 *
 * The lockup box is the profile's own: the type scale knows the two-line wordmark
 * is `lockupLo × LOCKUP_BOX_RATIO`, and using the default 150 there would
 * over-report the hero on exactly the windows where it is squeezed to 83px.
 */
function heroPaintedHeight(profile: AdaptiveProfile): number {
  /*
   * `lockupBoxOf()` is the one definition of the box, rounding included. This
   * function used to compute it a third time, in its own way.
   */
  const painted = heroContentHeight(profile.hero, lockupBoxOf(profile.type.lockupLo));
  return Number.isFinite(painted) ? painted : 0;
}

/**
 * Score one candidate against the profile it would replace.
 *
 * Deterministic and total: `NaN` in, finite out. A candidate whose own numbers
 * are not finite scores as fully broken rather than as free, because "cannot be
 * measured" must never win a comparison.
 */
export function scoreProfile(candidate: AdaptiveProfile, context: ScoreContext): Score {
  const broken = [...context.broken];
  const finite = isFiniteProfile(candidate);
  /*
   * `hidden` and `cropped` are measured against the base, not against zero.
   *
   * A 320x320 window *is* wordmark-only and *is* cropped, before any lever is
   * pulled: that is the window, not a sacrifice. Scoring the candidate's raw
   * flags would report "hidden 1" for the profile the app already ships, and a
   * cost that is really a property of the window makes every comparison in that
   * corner of the space meaningless. What the player loses is the difference.
   */
  const lostHero = candidate.plan.minimal && !context.base.plan.minimal;
  const lostFit = candidate.plan.fit === "crop" && context.base.plan.fit !== "crop";
  const terms: ScoreTerms = {
    violations: broken.length + (finite ? 0 : 1),
    hidden: lostHero ? 1 : 0,
    cropped: lostFit ? Math.max(0, cropShortfall(candidate)) : 0,
    hudLost: round2(Math.max(0, context.base.playfield.hudScale - candidate.playfield.hudScale)),
    typeDrop: typeDropOf(context.base, candidate),
    levers: countLevers(context.base, candidate),
    slack: slackOf(candidate),
  };
  /*
   * Push **before** the score is built, and keep the list sorted: `compareScores`
   * falls back to the joined ids as its final tie-break, so an unsorted list would
   * make that fallback depend on insertion order — the one thing a tie-break must
   * not do. (The first version pushed after sorting and left it unsorted.)
   */
  if (!finite) broken.push("numbers-finite");
  broken.sort();
  return { ok: terms.violations === 0, terms, broken };
}

/**
 * How many levers moved between two profiles.
 *
 * Counted from the profile, not from the `AdaptiveOverrides` that produced it:
 * the point of the term is "how much of the plan did we change", and an override
 * that changes nothing (a 0.99 typeScale on a scale that rounds to the same px)
 * did not change the plan. Counting overrides would punish it anyway.
 */
export function countLevers(base: AdaptiveProfile, candidate: AdaptiveProfile): number {
  let n = 0;
  if (base.insetApplied !== candidate.insetApplied) n += 1;
  if (base.playfield.hudScale !== candidate.playfield.hudScale) n += 1;
  if (base.modal.columns !== candidate.modal.columns) n += 1;
  if (typeDropOf(base, candidate) > 0) n += 1;
  return n;
}

/** Px the profile is short of the floor it promised, from its own numbers. */
function cropShortfall(profile: AdaptiveProfile): number {
  const needed = profile.plan.scene + profile.plan.reserve;
  return Math.max(0, needed - profile.box.height);
}

/**
 * Compare two candidates. Negative when `a` is better, positive when `b` is.
 *
 * Lexicographic over `SCORE_ORDER`, then by the broken ids themselves so the
 * order is total: two candidates that fail the same number of invariants still
 * sort deterministically instead of depending on `Array.prototype.sort` stability.
 */
export function compareScores(a: Comparable, b: Comparable): number {
  if (a.ok !== b.ok) return a.ok ? -1 : 1;
  for (const term of SCORE_ORDER) {
    const d = a.terms[term] - b.terms[term];
    if (Number.isFinite(d) && Math.abs(d) > TIE) return d < 0 ? -1 : 1;
  }
  const keyA = a.broken.join(",");
  const keyB = b.broken.join(",");
  return keyA === keyB ? 0 : keyA < keyB ? -1 : 1;
}

/** Two scores this close are the same score; the next term decides. */
const TIE = 1e-9;

/** True when every number the profile publishes is finite. */
export function isFiniteProfile(profile: AdaptiveProfile): boolean {
  /*
   * Every number the profile publishes, not the handful this check started with:
   * a `NaN` in `playfield` or `modal` is just as unusable as one in `type`, and the
   * first version only looked at the type scale and the plan.
   */
  const numbers: number[] = [
    profile.box.width,
    profile.box.height,
    profile.room,
    profile.plan.scene,
    profile.plan.reserve,
    profile.plan.panelWidth,
    profile.panelHeight,
    profile.playfield.hudScale,
    profile.playfield.width,
    profile.playfield.height,
    profile.modal.maxWidth,
    profile.modal.maxHeight,
    profile.modal.padding,
    profile.modal.titleSize,
    profile.modal.bodySize,
    ...Object.values(profile.type).filter((v): v is number => typeof v === "number"),
  ];
  return numbers.every((n) => Number.isFinite(n));
}

/**
 * The score as one line, worst part first.
 *
 * A reader comparing two rows of a table should be able to see *why* one won
 * without opening the module: the first non-zero term is the decision.
 */
export function describeScore(score: Score): string {
  if (!score.ok) return `broken: ${score.broken.join(", ")}`;
  for (const term of SCORE_ORDER) {
    /* `violations` is the gate and `slack` is not a cost; neither belongs in the
     * sentence that explains what the candidate gave up. */
    if (term === "violations" || term === "slack") continue;
    const v = score.terms[term];
    if (v > 0) return `${term} ${round2(v)}`;
  }
  return "nothing given up";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
