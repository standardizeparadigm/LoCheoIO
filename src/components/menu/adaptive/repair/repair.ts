/**
 * The repair engine — what the layout does when a window cannot satisfy the contract.
 *
 * THE QUESTION THIS ANSWERS
 * -------------------------
 * `constraints.ts` says whether a profile is valid. `diagnostics.ts` says why it
 * looks like that. Neither says what to *do* when the answer is "invalid", and
 * until round 12 the answer was "nothing": every consumer rendered whatever
 * `resolveAdaptive()` returned. That is defensible for the 578 windows the audit
 * covers — none of them violates anything — and indefensible for the window
 * nobody tested: a foldable mid-rotation, a device with a 140px safe-area inset,
 * a `visualViewport` report that arrives one frame before the layout viewport.
 *
 * `repairProfile()` is the missing verb. It resolves, checks, and if the contract
 * fails it walks a **finite, ordered ladder** of degradations until it passes.
 * The order is the same principle as `heroLayout()`: give up the least valuable
 * thing first, and never give up readability.
 *
 * WHY THE LADDER IS DATA
 * ----------------------
 * A repair path written as `if (bad) { try stuff }` is untestable: the only way to
 * reach a later rung is to find a window that breaks two invariants at once. Here
 * each rung is `{ id, why, overrides }`, so a test can start at any rung with an
 * explicit override — and `tests/adaptive-repair.test.ts` does exactly that, on
 * every rung, for every preset.
 *
 * WHY IT NEVER RETURNS `null`
 * ---------------------------
 * A caller cannot do anything useful with "unrepairable": the app has to paint
 * something. So the function always returns a profile, plus `ok` saying whether
 * the contract holds and `steps` saying what it changed to get there. A caller
 * that wants to log the degradation can; a caller that just wants pixels can
 * ignore both.
 */

import { resolveAdaptive, type AdaptiveOverrides, type AdaptiveProfile } from "../resolve";
import { violations } from "../constraints";
import { boxOf, type Box } from "../viewport";
import type { Environment } from "../environment";

/** One rung of the ladder. */
export interface RepairRung {
  /** Stable id — printed in `describeRepair()` and asserted in the docs test. */
  id: string;
  /** What it gives up, in the player's terms. */
  why: string;
  /** The levers it pulls. */
  overrides: AdaptiveOverrides;
}

/**
 * The ladder, richest first.
 *
 * Rung 0 is not a degradation at all: it is the profile the app renders today.
 * Everything after it removes something a player would notice, in the order a
 * player would least mind losing it:
 *
 *   1. the safe-area inset (`ignore-inset`) — the chrome stops paying for a
 *      notch it may not have;
 *   2. the HUD's share of the board (`compact-hud`) — the score gets smaller,
 *      never illegible;
 *   3. one column on wide dialogs (`single-column`) — a changelog wraps;
 *   4. type, in two steps (`smaller-type`, `smallest-type`) — **last**, because
 *      the 8px floor is a promise, and text you cannot read is not a repair.
 */
export const REPAIR_LADDER: readonly RepairRung[] = [
  { id: "as-planned", why: "the profile the app renders with no levers at all", overrides: {} },
  { id: "ignore-inset", why: "the safe-area inset stops claiming chrome height", overrides: { ignoreInset: true } },
  { id: "compact-hud", why: "the HUD takes 85% of its scale on the board", overrides: { ignoreInset: true, hudScale: 0.85 } },
  {
    id: "single-column",
    why: "wide dialogs wrap to one column instead of scrolling sideways",
    overrides: { ignoreInset: true, hudScale: 0.85, singleColumn: true },
  },
  {
    id: "smaller-type",
    why: "type drops to 94% of the plan, still above the 8px floor",
    overrides: { ignoreInset: true, hudScale: 0.85, singleColumn: true, typeScale: 0.94 },
  },
  {
    id: "smallest-type",
    why: "type drops to 88% of the plan — the last rung before the floor",
    overrides: { ignoreInset: true, hudScale: 0.85, singleColumn: true, typeScale: 0.88 },
  },
];

/** What a repair attempt did. */
export interface RepairResult {
  /** Always a usable profile. */
  profile: AdaptiveProfile;
  /** True when the returned profile satisfies every invariant. */
  ok: boolean;
  /** The rung that produced it — `as-planned` when nothing had to change. */
  rung: string;
  /** Rungs tried, in order, with the violation ids each one still had. */
  attempts: Array<{ rung: string; violations: string[] }>;
  /** Flat ids of everything that was still broken at the end. Empty when `ok`. */
  remaining: string[];
}

/** The contract a repair attempt must satisfy. */
export type RepairValidator = (profile: AdaptiveProfile) => string[];

/** Every field of a repair attempt. */
export interface RepairInput {
  box: Box;
  env?: Environment;
  wideModal?: boolean;
  /** The player's own reduced-motion switch, forwarded to every attempt. */
  playerReducedMotion?: boolean;
  /**
   * The contract to satisfy — `violations()` in the app.
   *
   * The seam exists because the ladder's later rungs are, correctly, unreachable
   * with the real contract: no preset and none of the 578 audit windows breaks an
   * invariant, so `as-planned` always wins. Without a way to hand in a *stricter*
   * contract, the search would be shipped untested — and an untested fallback path
   * is a fallback path that does not work the day it is needed. The test suite
   * passes a stricter one and asserts exactly which rung it lands on.
   */
  validator?: RepairValidator;
}

/**
 * Resolve one box, repairing it if the contract fails.
 *
 * Deterministic and total: the same input always produces the same rung, and a
 * `NaN` box, a 1×1 rotation report or an inset taller than the window all return
 * a finite profile.
 */
export function repairProfile(input: RepairInput): RepairResult {
  const attempts: RepairResult["attempts"] = [];
  const validate = input.validator ?? ((profile: AdaptiveProfile) => violations(profile).map((v) => v.id));
  /*
   * Every resolve is stored next to its verdict, not discarded. The failure
   * path below used to *re-resolve* each rung to find the least-broken one —
   * doubling the work of the exact path that runs when the screen is already
   * degraded, and trusting that two identical inputs produce byte-identical
   * profiles. They do today (the resolver is pure), but the guarantee is not
   * worth relying on twice.
   */
  const resolved = new Map<string, AdaptiveProfile>();

  for (const rung of REPAIR_LADDER) {
    const profile = resolveAdaptive({ ...input, overrides: rung.overrides });
    const broken = validate(profile);
    resolved.set(rung.id, profile);
    attempts.push({ rung: rung.id, violations: broken });
    if (broken.length === 0) {
      return { profile, ok: true, rung: rung.id, attempts, remaining: [] };
    }
  }

  /*
   * Every rung failed — which today would mean a bug in `resolveAdaptive()`, not a
   * hostile window. Return the least-broken attempt rather than the most degraded
   * one: the last rung has the smallest text and no guarantee it is closer to
   * valid, and "fewest invariant failures" is the honest tie-break.
   */
  let best: { profile: AdaptiveProfile; rung: string; broken: string[] } | null = null;
  for (const attempt of attempts) {
    if (best && attempt.violations.length >= best.broken.length) continue;
    const profile = resolved.get(attempt.rung);
    if (!profile) continue; // unreachable — every attempt sets its entry
    best = { profile, rung: attempt.rung, broken: attempt.violations };
  }
  return {
    profile: best!.profile,
    ok: false,
    rung: best!.rung,
    attempts,
    remaining: best!.broken,
  };
}

/** Repair straight from two numbers — the shape a probe or a test wants. */
export function repairForSize(
  width: unknown,
  height: unknown,
  env?: Environment,
  validator?: RepairValidator,
): RepairResult {
  return repairProfile({ box: boxOf(width, height), env, validator });
}

/** One line for a log or a test failure: which rung, and what it cost. */
export function describeRepair(result: RepairResult): string {
  /*
   * Failure is checked *first*: a contract stricter than the real one can fail even
   * on `as-planned`, and reporting "nothing changed" for that would be a lie about
   * the one case a caller needs to hear about.
   */
  if (!result.ok) return `repaired: FAILED at «${result.rung}» — ${result.remaining.join(", ")}`;
  if (result.rung === "as-planned") return "repaired: nothing — the plan satisfied the contract";
  const rung = REPAIR_LADDER.find((r) => r.id === result.rung);
  const skipped = result.attempts.length - 1;
  return `repaired: «${result.rung}» after ${skipped} attempt(s) — ${rung?.why ?? ""}`;
}

/** The rung ids, for the docs test that requires every one to be named. */
export function repairRungIds(): string[] {
  return REPAIR_LADDER.map((r) => r.id);
}
