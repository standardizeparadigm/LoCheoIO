import { describe, expect, it } from "vitest";
import { DEFS, KINDS } from "../src/game/engine";
import { itemWeight, weightTable, weightedPick } from "../src/game/spawn";
import { MODES } from "../src/game/modes";

describe("itemWeight", () => {
  it("matches the raw definition curve when no modifiers apply", () => {
    const def = DEFS.ca;
    expect(itemWeight(def, { level: 3 })).toBe(def.weight(3));
  });

  it("scales hazards by hazardMult and golden items by goldMult", () => {
    const hazard = KINDS.find((k) => DEFS[k].hazard)!;
    const gold = KINDS.find((k) => DEFS[k].power || DEFS[k].fillBoost)!;
    expect(itemWeight(DEFS[hazard], { level: 5, mode: { hazardMult: 2 } })).toBeCloseTo(
      DEFS[hazard].weight(5) * 2,
    );
    expect(itemWeight(DEFS[gold], { level: 5, mode: { goldMult: 3 } })).toBeCloseTo(
      DEFS[gold].weight(5) * 3,
    );
  });

  it("calms decorative passes (hazard ×0.4, gold ×0.5)", () => {
    const hazard = KINDS.find((k) => DEFS[k].hazard)!;
    const gold = KINDS.find((k) => DEFS[k].power)!;
    expect(itemWeight(DEFS[hazard], { level: 4, deco: true })).toBeCloseTo(DEFS[hazard].weight(4) * 0.4);
    expect(itemWeight(DEFS[gold], { level: 4, deco: true })).toBeCloseTo(DEFS[gold].weight(4) * 0.5);
  });

  it("never returns a negative or non-finite weight", () => {
    const weird = { weight: () => NaN };
    expect(itemWeight(weird, { level: 1 })).toBe(0);
  });
});

describe("weightedPick", () => {
  it("is deterministic for a fixed random sequence", () => {
    const opts = { level: 2, mode: MODES.classic };
    expect(weightedPick(KINDS, opts, () => 0)).toBe(KINDS[0]);
    // the tail fallback must land on a kind that actually has weight —
    // `sau` weighs 0 below level 4 and must never be picked at level 2
    const tail = weightedPick(KINDS, opts, () => 0.999999);
    expect(tail).toBe("toivang"); // last kind with a non-zero weight at lvl 2
    const weights = weightTable(KINDS, opts);
    expect(weights[KINDS.indexOf(tail)]).toBeGreaterThan(0);
    expect(weights[KINDS.indexOf("sau")]).toBe(0);
  });

  it("never falls through to a zero-weight kind at low levels", () => {
    // every random value, at a level where several kinds weigh 0
    for (let i = 0; i < 200; i++) {
      const picked = weightedPick(KINDS, { level: 1, mode: MODES.classic }, () => i / 200);
      const w = weightTable(KINDS, { level: 1, mode: MODES.classic })[KINDS.indexOf(picked)];
      expect(w, `picked ${picked} at r=${i / 200}`).toBeGreaterThan(0);
    }
  });

  it("always returns a real kind, even when every weight is zero", () => {
    const zero = { level: 1, mode: { hazardMult: 0, goldMult: 0 } };
    expect(KINDS).toContain(weightedPick(KINDS, zero, () => 0.5));
  });

  it("clamps a random() that returns exactly 1 (Math.random never does, spies do)", () => {
    expect(KINDS).toContain(weightedPick(KINDS, { level: 1 }, () => 1));
  });

  it("storm is hazard-heavier than classic at the same level", () => {
    const idx = KINDS.findIndex((k) => DEFS[k].hazard);
    const classic = weightTable(KINDS, { level: 5, mode: MODES.classic })[idx];
    const storm = weightTable(KINDS, { level: 5, mode: MODES.storm })[idx];
    expect(storm).toBeGreaterThan(classic);
  });
});

/**
 * The roll is a probability, and neither `Math.random` nor an injected test RNG
 * promises one. `NaN` used to reach the drift fallback and return the *last*
 * legal kind — the rarest item in the table — which reads as a balance bug.
 */
describe("weightedPick and a broken RNG", () => {
  const kinds = KINDS.slice(0, 4);
  const opts = { level: 1, mode: {} };

  it("returns the first weighted kind for every non-finite roll", () => {
    const first = weightedPick(kinds, opts, () => 0);
    for (const r of [NaN, Infinity, -Infinity]) {
      expect(weightedPick(kinds, opts, () => r), `random=${r}`).toBe(first);
    }
  });

  it("treats a negative roll as the lowest roll, not the highest", () => {
    // `-1` used to work by accident: `r` was negative and the first subtraction
    // satisfied `r <= 0`. Asserting it so a future clamp cannot invert it.
    expect(weightedPick(kinds, opts, () => -5)).toBe(weightedPick(kinds, opts, () => 0));
  });

  it("still accepts exactly 1, which the drift branch was written for", () => {
    const last = weightedPick(kinds, opts, () => 1);
    const weights = weightTable(kinds, opts);
    const lastWeighted = kinds[weights.findLastIndex((w) => w > 0)];
    expect(last).toBe(lastWeighted);
  });

  it("never returns a kind whose weight is zero, whatever the roll", () => {
    // The property the drift branch exists to protect, now checked against
    // every roll in the broken set rather than only the one it anticipated.
    const off = { level: 1, mode: { hazardMult: 0 } };
    const weights = weightTable(kinds, off);
    for (const r of [0, 0.5, 1, NaN, Infinity, -1]) {
      const picked = weightedPick(kinds, off, () => r);
      expect(weights[kinds.indexOf(picked)], `random=${r} picked ${picked}`).toBeGreaterThan(0);
    }
  });

  it("is deterministic for a given roll sequence", () => {
    // The reason `random` is injectable at all: the same seed must replay.
    const rolls = [0.1, 0.7, 0.3, 0.9];
    const a = rolls.map((r) => weightedPick(kinds, opts, () => r));
    const b = rolls.map((r) => weightedPick(kinds, opts, () => r));
    expect(a).toEqual(b);
  });
});
