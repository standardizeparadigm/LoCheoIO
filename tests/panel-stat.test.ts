/**
 * The panel footer strips: two numbers that must never print a non-number.
 *
 * `stat.ts` exists so this arithmetic is testable without React, and its whole
 * point is that the values come from the live catalogue and from localStorage.
 * That is also why it needed a guard: localStorage is the one input in this app
 * that a user can edit by hand, and the previous clamps were
 * `Math.max(0, Math.trunc(x))`, which does not stop `NaN` or `Infinity`.
 *
 * The failure was visible, not theoretical: the GAME footer printed
 * `✓NaN/NaN` and `✓5/Infinity`.
 */
import { describe, expect, it } from "vitest";
import { buildStat, progressStat, statText } from "../src/components/menu/panel/stat";

/** No rendered strip may contain these, ever. */
const BAD = /NaN|Infinity|undefined|null/;

describe("progressStat clamps to integers the strip can print", () => {
  it("prints the honest fraction for a normal save", () => {
    expect(statText(progressStat(5, 16, 9))).toBe("✓5/16 · ◆9");
  });

  it("never prints NaN when the total is NaN", () => {
    // `Math.trunc(NaN)` is NaN and `Math.max(0, NaN)` is NaN — the old bug.
    expect(statText(progressStat(5, Number.NaN, 9))).not.toMatch(BAD);
    expect(statText(progressStat(5, Number.NaN, 9))).toBe("✓0/0 · ◆9");
  });

  it("never prints NaN when the unlocked count is NaN", () => {
    // The important half: the total survives, so the player still sees 16.
    expect(statText(progressStat(Number.NaN, 16, 9))).toBe("✓0/16 · ◆9");
  });

  it("never prints Infinity", () => {
    // `max()` of an empty list is -Infinity before the clamp, so this is a
    // reachable value, not a hypothetical one.
    expect(statText(progressStat(5, Number.POSITIVE_INFINITY, 9))).not.toMatch(BAD);
    expect(statText(progressStat(5, 16, Number.POSITIVE_INFINITY))).not.toMatch(BAD);
  });

  it("clamps an unlocked count that exceeds the total", () => {
    // This is the original reason the clamp exists: a stale save could show
    // 18/16 once the catalogue shrank.
    expect(statText(progressStat(18, 16, 9))).toBe("✓16/16 · ◆9");
  });

  it("floors a corrupt fractional count", () => {
    expect(statText(progressStat(5.9, 16.7, 9.2))).toBe("✓5/16 · ◆9");
  });

  it("clamps negatives to zero on both sides", () => {
    expect(statText(progressStat(-3, -1, -7))).toBe("✓0/0 · ◆0");
  });

  it("returns exactly two stats, with a glyph label on each", () => {
    const stats = progressStat(5, 16, 9);
    expect(stats).toHaveLength(2);
    for (const s of stats) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.value).not.toMatch(BAD);
    }
  });
});

describe("buildStat survives a missing tier", () => {
  it("prints the version and the uppercase tier", () => {
    expect(statText(buildStat("1.1.8", "patch"))).toBe("v1.1.8 · ◆PATCH");
  });

  it("does not throw when the tier is undefined", () => {
    // `tier.toUpperCase()` used to throw here, inside INFO's footer, which
    // unmounts the whole panel rather than losing a glyph.
    expect(() => buildStat("1.1.8", undefined as unknown as string)).not.toThrow();
    expect(statText(buildStat("1.1.8", undefined as unknown as string))).toBe("v1.1.8 · ◆—");
  });

  it("does not print an empty half when the version is empty", () => {
    expect(statText(buildStat("", "patch"))).toBe("v— · ◆PATCH");
  });
});

describe("statText is the renderer's own join", () => {
  it("uses the same separator the strip uses", () => {
    // If the component and the test disagreed on the join, these tests would
    // pass while the DOM printed something else.
    expect(statText([{ label: "a", value: "1" }, { label: "b", value: "2" }])).toBe("a1 · b2");
  });

  it("returns an empty string for no stats", () => {
    expect(statText([])).toBe("");
  });
});
