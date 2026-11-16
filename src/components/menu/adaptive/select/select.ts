/**
 * Choosing, rather than accepting the first thing that works.
 *
 * `repair/` walks the ladder and stops at the first rung whose profile satisfies
 * the contract. That is correct for a repair — the ladder is ordered by how much
 * a player loses, so the first pass *is* the cheapest pass. But "first that
 * passes" is not a comparison, and it leaves two questions unanswered that this
 * project keeps having to ask by hand:
 *
 *     was the profile we ship actually the best of the six?
 *     when two rungs both pass, which one gives up less?
 *
 * This module answers both, once, over the whole ladder: it resolves every rung,
 * scores each one (`score.ts`), and sorts. The result is a `Selection` — the
 * winner, every candidate it beat, and *why each one lost*.
 *
 * THE INVARIANT THIS BUYS
 * -----------------------
 * `selectBest()` must return rung 0, `as-planned`, on every window in the audit's
 * 578 — otherwise the app is shipping a layout it has a cheaper replacement for.
 * That is a claim about the shipped product, not about this module, and
 * `tests/adaptive-select.test.ts` sweeps the whole space to check it. Round 12
 * could only say "no invariant fails"; this round can say "nothing cheaper
 * exists", which is the stronger statement.
 *
 * WHY NOT SEARCH MORE WIDELY
 * --------------------------
 * Combinations of levers are 2⁴ = 16, and a combinatorial search would be more
 * code for a decision that the ladder already orders correctly. The search space
 * is therefore exactly the ladder — six candidates — and the honest name for this
 * module is "a comparator over the repair ladder", not "a planner". Anything
 * wider needs a reason to exist first; the audit is where that reason would show
 * up.
 */

import { violations } from "../constraints";
import { boxOf, type Box } from "../viewport";
import type { Environment } from "../environment";
import { REPAIR_LADDER, type RepairRung } from "../repair/repair";
import { resolveAdaptive, type AdaptiveOverrides, type AdaptiveProfile } from "../resolve";
import { compareScores, describeScore, scoreProfile, type Score } from "./score";

/** One rung, resolved for one window. */
export interface Candidate {
  /** `as-planned`, `ignore-inset`, … — the ladder's own id. */
  rung: string;
  /** What the rung gave up, in the player's terms. */
  why: string;
  /** The levers it pulls. */
  overrides: AdaptiveOverrides;
  /** The profile it produces for this window. */
  profile: AdaptiveProfile;
  /** Its cost. */
  score: Score;
}

/** A rung that lost, and the one line that says why. */
export interface Loser {
  rung: string;
  reason: string;
}

/** The whole decision, with its receipts. */
export interface Selection {
  width: number;
  height: number;
  /** Index of the winning rung in `REPAIR_LADDER`, 0 = nothing given up. */
  rungIndex: number;
  /** The winner. Never `undefined`: `as-planned` is always a candidate. */
  chosen: Candidate;
  /** Every candidate, best first — including the winner. */
  ranked: Candidate[];
  /** The candidates that lost, in rank order, with the reason each lost. */
  losers: Loser[];
}

/** A contract to satisfy: given a profile, the invariant ids it breaks. */
export type SelectionValidator = (profile: AdaptiveProfile) => string[];

/** What to select for. */
export interface SelectionInput {
  /** Window, as numbers — `boxOf` sanitises them. */
  width: unknown;
  height: unknown;
  env?: Environment;
  /** Open wide dialog: changes `modal.columns`, which `single-column` touches. */
  wideModal?: boolean;
  /**
   * The contract. Defaults to the real fourteen invariants.
   *
   * The seam exists for the same reason `repairProfile()`'s does: with the real
   * contract every rung below `as-planned` is *unreachable*, so the comparison
   * between rungs would ship untested. The tests hand in a stricter contract and
   * assert which rung wins and which ones lose on what.
   */
  validator?: SelectionValidator;
}

/** The candidate list for a window, in ladder order, unranked. */
export function candidatesFor(input: SelectionInput): Candidate[] {
  const box: Box = boxOf(input.width, input.height);
  const validate = input.validator ?? ((profile: AdaptiveProfile) => violations(profile).map((v) => v.id));
  const base = resolveAdaptive({ box, env: input.env, wideModal: input.wideModal });

  return REPAIR_LADDER.map((rung: RepairRung) => {
    const profile = resolveAdaptive({
      box,
      env: input.env,
      wideModal: input.wideModal,
      overrides: rung.overrides,
    });
    return {
      rung: rung.id,
      why: rung.why,
      overrides: rung.overrides,
      profile,
      score: scoreProfile(profile, { base, broken: validate(profile) }),
    };
  });
}

/**
 * Pick the cheapest candidate that satisfies the contract.
 *
 * Ties are impossible by construction: the comparer ends on the sorted broken-id
 * list, and two rungs of one ladder always differ in at least their levers, which
 * `levers` counts. So the sort is total without relying on stability.
 */
export function selectBest(input: SelectionInput): Selection {
  const candidates = candidatesFor(input);
  /*
   * Sort on the score, then on ladder position. The second key is not a
   * formality: a lever that changes nothing (an inset on a window that has none)
   * produces terms *identical* to `as-planned`, so the scores tie. Preferring the
   * earlier rung keeps the answer "nothing was pulled" instead of whichever rung
   * `Array.prototype.sort` happened to see first — stable sorting is a property
   * of the engine, and this decision should not depend on one.
   */
  const order = (c: Candidate) => REPAIR_LADDER.findIndex((r) => r.id === c.rung);
  const ranked = [...candidates].sort(
    (a, b) => compareScores(a.score, b.score) || order(a) - order(b),
  );
  const chosen = ranked[0];
  const losers: Loser[] = ranked.slice(1).map((c) => ({
    rung: c.rung,
    reason: c.score.ok === false
      ? `still broken: ${c.score.broken.join(", ")}`
      : `costs more: ${describeScore(c.score)}`,
  }));

  return {
    width: boxOf(input.width, input.height).width,
    height: boxOf(input.width, input.height).height,
    rungIndex: REPAIR_LADDER.findIndex((r) => r.id === chosen.rung),
    chosen,
    ranked,
    losers,
  };
}

/**
 * True when the shipped profile is the selection's choice *and* nothing cheaper
 * exists — the per-window form of the claim in this file's header.
 *
 * Compares on the decision, not on object identity: a rung can be chosen while
 * producing a profile that is field-for-field the same as `as-planned` (a lever
 * that bites nothing), and that is a different situation — the comparator would
 * have ranked `as-planned` first, so if that ever happens it is a bug here, and
 * this function reports it rather than smoothing it over.
 */
export function shippedIsBest(selection: Selection): boolean {
  return selection.rungIndex === 0 && selection.chosen.score.ok;
}

/**
 * The decision as one line.
 *
 * Reads `chosen` first, then the margin — because "we chose as-planned" is only
 * informative next to "and the next-best rung cost the HUD 15%".
 */
export function describeSelection(selection: Selection): string {
  const { chosen, ranked } = selection;
  const head = `${selection.width}×${selection.height} → ${chosen.rung}`;
  const spare = chosen.score.terms.slack;
  const body = `${describeScore(chosen.score)}${spare > 0 ? `, ${spare}px spare` : ""}`;
  if (ranked.length < 2) return `${head} (${body})`;
  const next = ranked[1];
  /*
   * "tied" is worth saying out loud. It means the runner-up sacrificed exactly as
   * little — a lever that bit nothing — and the earlier rung won on position, not
   * on cost. Calling that "next" would claim a margin that does not exist.
   */
  const verb = compareScores(chosen.score, next.score) === 0 ? "tied, earlier rung" : "next";
  return `${head} (${body}; ${verb}: ${next.rung}, ${describeScore(next.score)})`;
}

/** The rung ids, in ladder order — for docs tests that must name every one. */
export function selectionRungIds(): string[] {
  return REPAIR_LADDER.map((r) => r.id);
}

/**
 * How many windows of a space the shipped profile wins.
 *
 * The audit asks "is anything broken"; this asks "is anything sub-optimal", which
 * is a weaker failure and a much larger number of windows. Kept here rather than
 * in `audit/` because it is a statement about `selectBest()`, and the script that
 * prints it (`scripts/gen-selection-fixtures.ts`) is about the corpus.
 */
/**
 * How many of a **list of windows** the shipped profile wins.
 *
 * This is the honest version of the claim, and it replaces a cross product. The
 * first `--select` multiplied the audit's distinct widths by its distinct heights
 * and reported 648 — a grid that is neither the audit's 578 windows nor the space
 * between them, described in four documents and ten READMEs as "648 windows". A
 * number that big is not wrong *as a sweep*, but calling it the window count made
 * two tools disagree about how big the space is.
 */
export function bestOnWindows(windows: ReadonlyArray<{ width: number; height: number }>): {
  windows: number;
  shipped: number;
  failures: string[];
} {
  let shipped = 0;
  const failures: string[] = [];
  for (const { width, height } of windows) {
    const selection = selectBest({ width, height });
    if (shippedIsBest(selection)) shipped += 1;
    else failures.push(`${width}×${height} → ${selection.chosen.rung}`);
  }
  return { windows: windows.length, shipped, failures };
}

/** The same question over a rectangular grid — `widths × heights`. */
export function bestOn(widths: readonly number[], heights: readonly number[]): {
  windows: number;
  shipped: number;
  failures: string[];
} {
  let windows = 0;
  let shipped = 0;
  const failures: string[] = [];
  for (const w of widths) {
    for (const h of heights) {
      windows += 1;
      const selection = selectBest({ width: w, height: h });
      if (shippedIsBest(selection)) shipped += 1;
      else failures.push(`${w}×${h} → ${selection.chosen.rung}`);
    }
  }
  return { windows, shipped, failures };
}
