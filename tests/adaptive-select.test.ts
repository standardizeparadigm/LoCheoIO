/**
 * `select/` — the comparator over the repair ladder.
 *
 * Round 12 could say "no window breaks an invariant". That is a *safety* claim.
 * This round's module makes a *quality* claim, and this file is where it is
 * checked:
 *
 *     on every window the app can be played in, the profile it ships is the
 *     cheapest one of the six the ladder can produce.
 *
 * Two things make that claim testable rather than rhetorical. First, `score.ts`
 * orders its terms lexicographically, so "cheaper" is a total order and not a
 * taste. Second, the ladder is a fixed list of six, so "every candidate" is six
 * comparisons per window, not a search.
 *
 * The strict-validator cases exist for the same reason `adaptive-repair.test.ts`
 * has them: with the real fourteen invariants every rung below `as-planned` is
 * unreachable, so the comparison would ship having never chosen anything but its
 * first option. A test that only ever exercises the happy branch is a test of the
 * branch that cannot be wrong.
 */
import { describe, expect, it } from "vitest";

import { PRESETS } from "../src/components/menu/adaptive/presets";
import { REPAIR_LADDER, repairRungIds } from "../src/components/menu/adaptive/repair";
import { violations } from "../src/components/menu/adaptive/constraints";
import {
  SCORE_ORDER,
  bestOn,
  candidatesFor,
  compareScores,
  countLevers,
  describeScore,
  describeSelection,
  isFiniteProfile,
  scoreProfile,
  selectBest,
  selectionRungIds,
  shippedIsBest,
  slackOf,
  typeDropOf,
  type Comparable,
  type Score,
  type ScoreTerm,
  type ScoreTerms,
} from "../src/components/menu/adaptive/select";
import type { AdaptiveProfile } from "../src/components/menu/adaptive/resolve";

/** A score with every term at zero, so a test can set exactly one. */
function terms(over: Partial<ScoreTerms> = {}): ScoreTerms {
  const base = Object.fromEntries(SCORE_ORDER.map((t) => [t, 0])) as ScoreTerms;
  return { ...base, ...over };
}

/** A comparable candidate, for the pure comparator tests. */
function comparable(over: Partial<ScoreTerms> = {}, broken: string[] = []): Comparable {
  return { ok: (over.violations ?? 0) === 0, terms: terms(over), broken };
}

/** A stricter contract: the real invariants plus a type floor above the plan's. */
function floorAbove(px: number) {
  return (profile: AdaptiveProfile): string[] => {
    const out = violations(profile).map((v) => v.id);
    if (profile.type.rowLabel > px + 0.001) out.push("type-legible");
    return out;
  };
}

describe("the score's priority", () => {
  it("orders violations before anything a player can see", () => {
    const broken = comparable({ violations: 1, hidden: 0 });
    const ugly = comparable({ violations: 0, hidden: 1 });
    expect(compareScores(broken, ugly)).toBeGreaterThan(0);
  });

  it("orders every term the way SCORE_ORDER declares them", () => {
    /*
     * Each pair differs in exactly one adjacent term, with the later one worse.
     * A weighted sum would pass some of these and fail others depending on the
     * weights; the point of the order is that the answer is inspectable.
     */
    for (let i = 1; i < SCORE_ORDER.length; i += 1) {
      const better = SCORE_ORDER[i - 1];
      const worse = SCORE_ORDER[i];
      if (better === "violations") continue; // covered above, and it is a gate
      /* Giving up the earlier term is the larger loss, so it sorts last. */
      const losesEarlier = comparable({ [better]: 1 } as Partial<ScoreTerms>);
      const losesLater = comparable({ [worse]: 1 } as Partial<ScoreTerms>);
      expect(compareScores(losesEarlier, losesLater), `${better} should beat ${worse}`).toBeGreaterThan(0);
    }
  });

  it("puts type before the number of levers pulled", () => {
    /*
     * The inversion this guards against is tempting: "we only pulled one lever"
     * sounds cheaper than "we pulled four and shrank the type a little". The
     * player cannot see levers. They can see 1px of type.
     */
    const oneLeverBadType = comparable({ typeDrop: 4, levers: 1 });
    const fourLeversGoodType = comparable({ typeDrop: 0, levers: 4 });
    expect(compareScores(oneLeverBadType, fourLeversGoodType)).toBeGreaterThan(0);
  });

  it("uses slack only as a tie-breaker", () => {
    const roomy = comparable({ slack: 400 });
    const tight = comparable({ slack: 0 });
    expect(compareScores(tight, roomy)).toBeLessThan(0);
    /* …and a single pixel of visible loss outweighs any amount of slack. */
    expect(compareScores(comparable({ typeDrop: 1 }), comparable({ slack: 9999 }))).toBeGreaterThan(0);
  });

  it("is total: equal terms fall back to the broken ids", () => {
    const a: Comparable = { ok: false, terms: terms({ violations: 1 }), broken: ["a"] };
    const b: Comparable = { ok: false, terms: terms({ violations: 1 }), broken: ["b"] };
    expect(compareScores(a, b)).toBeLessThan(0);
    expect(compareScores(b, a)).toBeGreaterThan(0);
    expect(compareScores(a, { ...a, broken: ["a"] })).toBe(0);
  });

  it("never awards a candidate whose numbers are not finite", () => {
    const selection = selectBest({ width: 390, height: 844 });
    const broken: Score = scoreProfile(
      { ...selection.chosen.profile, room: Number.NaN },
      { base: selection.chosen.profile, broken: [] },
    );
    expect(broken.ok).toBe(false);
    expect(broken.broken).toContain("numbers-finite");
  });
});

describe("the score's measurements", () => {
  const profile = selectBest({ width: 390, height: 844 }).chosen.profile;

  it("reports zero for a profile compared with itself", () => {
    const score = scoreProfile(profile, { base: profile, broken: [] });
    for (const term of ["hidden", "cropped", "hudLost", "typeDrop", "levers"] as ScoreTerm[]) {
      expect(score.terms[term], term).toBe(0);
    }
    expect(score.ok).toBe(true);
  });

  it("counts levers from the profile, not from the overrides", () => {
    const same = selectBest({ width: 390, height: 844 }).ranked.find((c) => c.rung === "ignore-inset");
    expect(same).toBeTruthy();
    /*
     * On a desktop-shaped window there is no inset to ignore, so that rung's
     * override changes nothing at all — and the count must say so. This is the
     * difference between "we pulled a lever" and "a lever moved".
     */
    const desktop = selectBest({ width: 1280, height: 720 });
    const ignore = desktop.ranked.find((c) => c.rung === "ignore-inset")!;
    expect(countLevers(desktop.chosen.profile, ignore.profile)).toBe(0);
  });

  it("sums the type drop across the scale, in tenths of a px", () => {
    const smaller = selectBest({ width: 390, height: 844, validator: floorAbove(10.5) }).chosen;
    expect(smaller.rung).toBe("smaller-type");
    const drop = typeDropOf(profile, smaller.profile);
    expect(drop).toBeGreaterThan(0);
    /* The scale is computed in tenths, so the sum must land on one. */
    expect(Math.round(drop * 10)).toBeCloseTo(drop * 10, 6);
  });

  it("never reports negative slack", () => {
    for (const preset of PRESETS) {
      const selection = selectBest({ width: preset.width, height: preset.height });
      expect(slackOf(selection.chosen.profile), preset.id).toBeGreaterThanOrEqual(0);
    }
  });

  it("prints one line that names the first thing given up", () => {
    expect(describeScore({ ok: true, terms: terms(), broken: [] })).toBe("nothing given up");
    expect(describeScore({ ok: true, terms: terms({ hudLost: 0.15 }), broken: [] })).toBe("hudLost 0.15");
    expect(describeScore({ ok: false, terms: terms({ violations: 2 }), broken: ["a", "b"] })).toContain("broken:");
  });

  it("knows a profile with a NaN in it", () => {
    expect(isFiniteProfile(profile)).toBe(true);
    expect(isFiniteProfile({ ...profile, panelHeight: Number.NaN })).toBe(false);
  });
});

describe("selectBest over the real contract", () => {
  it("offers exactly the ladder, in ladder order", () => {
    const candidates = candidatesFor({ width: 1280, height: 720 });
    expect(candidates.map((c) => c.rung)).toEqual(repairRungIds());
    expect(selectionRungIds()).toEqual(REPAIR_LADDER.map((r) => r.id));
  });

  it("chooses as-planned on all 21 presets", () => {
    const wrong = PRESETS.filter((p) => !shippedIsBest(selectBest({ width: p.width, height: p.height })));
    expect(wrong.map((p) => p.id)).toEqual([]);
  });

  it("chooses as-planned across a 270-window cross-section", () => {
    const widths = [320, 360, 390, 414, 480, 540, 640, 717, 768, 820, 1024, 1280, 1366, 1440, 1568, 1920, 2560, 3840];
    const heights = [320, 400, 480, 512, 568, 640, 677, 720, 768, 820, 844, 900, 1080, 1440, 2160];
    const sweep = bestOn(widths, heights);
    expect(sweep.windows).toBe(270);
    expect(sweep.failures).toEqual([]);
    expect(sweep.shipped).toBe(270);
  });

  it("is deterministic", () => {
    const a = selectBest({ width: 1568, height: 677 });
    const b = selectBest({ width: 1568, height: 677 });
    expect(a.chosen.rung).toBe(b.chosen.rung);
    expect(a.ranked.map((c) => c.rung)).toEqual(b.ranked.map((c) => c.rung));
  });

  it("keeps the earlier rung when two candidates tie", () => {
    /*
     * `ignore-inset` on a window with no inset changes nothing, so it scores
     * identically. The tie must resolve to ladder position, not to whatever order
     * the sort happened to see — otherwise the answer depends on the engine.
     */
    const selection = selectBest({ width: 1280, height: 720 });
    expect(selection.chosen.rung).toBe("as-planned");
    expect(compareScores(selection.ranked[0].score, selection.ranked[1].score)).toBe(0);
    expect(selection.ranked[1].rung).toBe("ignore-inset");
  });

  it("says why each loser lost", () => {
    const selection = selectBest({ width: 390, height: 844 });
    expect(selection.losers).toHaveLength(REPAIR_LADDER.length - 1);
    for (const loser of selection.losers) {
      expect(loser.reason.length, loser.rung).toBeGreaterThan(0);
    }
  });

  it("describes the decision in one sentence", () => {
    const line = describeSelection(selectBest({ width: 1920, height: 1080 }));
    expect(line).toMatch(/^1920×1080 → as-planned \(/);
    expect(line).toContain("nothing given up");
  });
});

describe("selectBest under a stricter contract", () => {
  it("walks to the first rung that clears a raised type floor", () => {
    /* Round 12's ladder stops at the same rung; the two must not disagree. */
    const selection = selectBest({ width: 390, height: 844, validator: floorAbove(10.5) });
    expect(selection.chosen.rung).toBe("smaller-type");
    expect(selection.chosen.score.ok).toBe(true);
    expect(selection.rungIndex).toBe(4);
  });

  it("says so when no rung can clear it", () => {
    const selection = selectBest({ width: 390, height: 844, validator: floorAbove(1) });
    expect(selection.chosen.score.ok).toBe(false);
    expect(selection.chosen.score.broken).toContain("type-legible");
    expect(shippedIsBest(selection)).toBe(false);
    /* Every rung was tried: six attempts, six reasons. */
    expect(selection.losers).toHaveLength(5);
    for (const loser of selection.losers) expect(loser.reason).toContain("type-legible");
  });

  it("prefers a smaller HUD to smaller type", () => {
    /*
     * Both fix a raised floor at 390×844… except they do not: only the type
     * rungs move `rowLabel`. What this asserts is the *ordering* — if a HUD-only
     * rung ever clears the contract, it must win over a type rung. Built by
     * raising the floor to exactly what `compact-hud` achieves.
     */
    const probe = selectBest({ width: 390, height: 844 });
    const hud = probe.ranked.find((c) => c.rung === "compact-hud")!;
    const floor = hud.profile.type.rowLabel;
    const selection = selectBest({ width: 390, height: 844, validator: floorAbove(floor) });
    expect(["as-planned", "ignore-inset", "compact-hud"]).toContain(selection.chosen.rung);
    expect(selection.chosen.score.terms.typeDrop).toBe(0);
  });

  it("still reports violations as a gate, not as a cost", () => {
    const selection = selectBest({ width: 390, height: 844, validator: floorAbove(1) });
    const first = selection.ranked[0];
    expect(first.score.ok).toBe(false);
    /* A broken candidate can never be described as free. */
    expect(describeScore(first.score)).toContain("broken");
  });
});
