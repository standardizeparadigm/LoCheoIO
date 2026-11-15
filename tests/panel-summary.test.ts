/**
 * `panel/summary.ts` is the INFO panel's filler and had no test at all.
 *
 * Both functions are small and pure, which is exactly why they were skipped —
 * and exactly why a defect in them is invisible until someone reads the screen.
 * `challengeLine("", 100)` produced the i18n key `mode..name`; `t()` returns the
 * key itself when it is not in the table, so the start screen would have shown
 * the literal string `mode..name` under «THỬ THÁCH HÔM NAY».
 *
 * Neither input is reachable from `challengeFor()` today, which is why this is
 * a hardening commit and not a hotfix. But `challengeLine` is exported, the
 * call site passes its output straight to `t()`, and "unreachable today" is not
 * a property that survives a refactor.
 */
import { describe, expect, it } from "vitest";

import {
  challengeLine,
  summaryLines,
  summaryText,
} from "../src/components/menu/panel/summary";

describe("summaryLines", () => {
  it("returns the three rows in reading order: play, catch, earn", () => {
    const lines = summaryLines({ modes: 9, ingredients: 14, achievements: 16 });
    expect(lines.map((l) => l.key)).toEqual([
      "summary.modes",
      "summary.ingredients",
      "summary.achievements",
    ]);
    expect(lines.map((l) => l.count)).toEqual([9, 14, 16]);
  });

  it("never yields NaN — a missing catalogue renders as 0, not as NaN", () => {
    // `NaN.toString()` is "NaN", which would print as "NaN chế độ" on the panel.
    const [modes] = summaryLines({
      modes: Number.NaN,
      ingredients: 0,
      achievements: 0,
    });
    expect(modes.count).toBe(0);
  });

  it("floors at zero: a negative count cannot reach the DOM", () => {
    const lines = summaryLines({ modes: -5, ingredients: -1, achievements: -99 });
    expect(lines.map((l) => l.count)).toEqual([0, 0, 0]);
  });

  it("truncates rather than rounds, so a fraction never reads as more", () => {
    const lines = summaryLines({ modes: 3.9, ingredients: 0.5, achievements: 16.99 });
    expect(lines.map((l) => l.count)).toEqual([3, 0, 16]);
  });

  it("clamps an infinity to zero instead of printing Infinity", () => {
    const [modes] = summaryLines({
      modes: Number.POSITIVE_INFINITY,
      ingredients: 0,
      achievements: 0,
    });
    expect(modes.count).toBe(0);
  });

  it("always returns exactly three lines, whatever the input says", () => {
    // The panel is a fixed-height strip; a fourth row would overflow it.
    for (const input of [
      { modes: 0, ingredients: 0, achievements: 0 },
      { modes: 1e9, ingredients: -1e9, achievements: 7 },
    ]) {
      expect(summaryLines(input)).toHaveLength(3);
    }
  });

  it("summaryText joins count and key, which is how the DOM builds the row", () => {
    expect(summaryText({ count: 9, key: "summary.modes" })).toBe("9 summary.modes");
  });
});

describe("challengeLine", () => {
  it("builds the i18n key from a valid mode id", () => {
    expect(challengeLine("zen", 2400)).toEqual({
      modeKey: "mode.zen.name",
      target: 2400,
    });
  });

  it("falls back to classic for an empty id, because `mode..name` is not a key", () => {
    /*
     * This is the defect this file was written for. An empty string is not a
     * mode; it is a mode that failed to load. Rendering its key is worse than
     * rendering the default mode, because "mode..name" reads as a bug in the
     * game rather than as a missing challenge.
     */
    expect(challengeLine("", 100).modeKey).toBe("mode.classic.name");
  });

  it("rejects ids that could not be mode identifiers", () => {
    // A dot would produce a four-segment key; a space would too; a slash would
    // look like a path. None of them can name a mode file in `src/game/modes/`.
    for (const bad of ["a.b", "a b", "a/b", "A", "9", "-x", "x-y_z"]) {
      expect(challengeLine(bad, 1).modeKey, bad).toBe("mode.classic.name");
    }
  });

  it("accepts the ids the catalogue actually uses", () => {
    // All nine, so a new mode with a hyphen in its name is covered too.
    for (const id of [
      "classic", "zen", "inferno", "blitz", "goldrush",
      "storm", "hardcore", "combo", "feast", "gold-rush",
    ]) {
      expect(challengeLine(id, 1).modeKey, id).toBe(`mode.${id}.name`);
    }
  });

  it("clamps a corrupt target to zero rather than passing it through", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -10, -0.5]) {
      expect(challengeLine("classic", bad).target, String(bad)).toBe(0);
    }
  });

  it("truncates a fractional target", () => {
    expect(challengeLine("classic", 1500.9).target).toBe(1500);
  });
});
