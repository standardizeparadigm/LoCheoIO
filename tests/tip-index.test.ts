/**
 * `tipIndexFor()` must return an index, not merely a number.
 *
 * The selector is a pure function of the day, so it needs no DOM and no clock.
 * What it does need is a contract tight enough that its one caller can build a
 * key from the result: `rule.${idx}.t`. Every value that does not correspond to
 * a rule produces a key the message table does not have, and `t()` then renders
 * the key itself or an empty string — a blank line in the how-to modal.
 *
 * The function guarded `count <= 0` and nothing else. Two inputs get past that
 * guard and both break the caller:
 *
 *   count = NaN   `NaN <= 0` is **false**, so the guard does not fire; the
 *                 modulo yields NaN and the index is NaN.
 *   count = 5.5   accepted; `%` is a float remainder; the index is 0.5.
 *
 * This is the same family as the five clamps in `numeric-guards.md`: a guard
 * that tests the sign and forgets the type.
 */
import { describe, expect, it } from "vitest";
import { RULE_COUNT, tipIndexFor } from "../src/game/daily/tip";

/** Every result must be a usable index into `RULE_COUNT` slots. */
const isIndex = (n: number) => Number.isInteger(n) && n >= 0 && n < RULE_COUNT;

describe("the guard covers types, not just signs", () => {
  it("rejects a fractional count instead of returning a fractional index", () => {
    expect(tipIndexFor(1000, 5.5)).toBe(0);
  });

  it("rejects NaN count, which `<= 0` does not catch", () => {
    // The regression itself: NaN <= 0 is false.
    expect(Number.NaN <= 0).toBe(false);
    expect(tipIndexFor(1000, Number.NaN)).toBe(0);
    expect(tipIndexFor(1000, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("still rejects the counts the old guard caught", () => {
    for (const count of [0, -1, -6]) expect(tipIndexFor(1000, count)).toBe(0);
  });

  it("rejects a non-finite day", () => {
    for (const day of [Number.NaN, Infinity, -Infinity]) {
      expect(tipIndexFor(day)).toBe(0);
    }
  });
});

describe("the shape of the result", () => {
  it("is an index for every day in a 400-day span", () => {
    for (let day = 0; day < 400; day++) {
      expect(isIndex(tipIndexFor(day))).toBe(true);
    }
  });

  it("is an index for negative days too", () => {
    // Days before the epoch are not a game state, but a clock set to 1969 is,
    // and the modulo has to be normalised rather than left negative.
    for (let day = -20; day < 0; day++) {
      expect(isIndex(tipIndexFor(day))).toBe(true);
    }
  });

  it("truncates a fractional day rather than letting it through", () => {
    expect(tipIndexFor(1.9)).toBe(tipIndexFor(1));
  });
});

describe("the stride is what makes the cycle work", () => {
  it("visits all six rules before repeating", () => {
    const seen = new Set<number>();
    for (let day = 0; day < RULE_COUNT; day++) seen.add(tipIndexFor(day));
    expect(seen.size).toBe(RULE_COUNT);
  });

  it("does not follow the challenge's sequence", () => {
    // The tip strides by 5 and the challenge hashes by mix(); if they moved
    // together, players would learn one mode↔rule pairing. Assert the tip is
    // not monotonically +1, which is the shape a shared `day % n` would have.
    const first = [0, 1, 2, 3].map((d) => tipIndexFor(d));
    const steps = first.slice(1).map((v, i) => (v - first[i] + RULE_COUNT) % RULE_COUNT);
    expect(steps).not.toEqual([1, 1, 1]);
  });

  it("is stable for the same day", () => {
    for (const day of [0, 1, 19_000, 20_000]) {
      expect(tipIndexFor(day)).toBe(tipIndexFor(day));
    }
  });
});
