/**
 * Two clamps in the layout layer that were shapes, not guards.
 *
 * `cornerPanelHeight` and `VolumeStepper`'s `clampVolume` both used the idiom
 * `Math.max(floor, Math.min(ceil, …))`, which is correct for the three inputs
 * anyone types into a test (`7`, `0`, `-3`) and wrong for the three that arrive
 * from the DOM (`NaN`, `Infinity`, `-Infinity`).
 *
 * `cornerPanelHeight` is exported and is the number the scene *reserves*, so a
 * non-finite value does not degrade — it removes the reservation entirely.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  CORNER_MAX_ROWS,
  cornerPanelHeight,
  cornerRowHeight,
  MENU_ROW_GAP,
  PANEL_BORDER,
  PANEL_HEADER_HEIGHT,
  PANEL_PADDING,
  rowHeight,
} from "../src/components/menu/layout/metrics";

describe("cornerPanelHeight", () => {
  it("is finite for every non-finite row count", () => {
    for (const rows of [NaN, Infinity, -Infinity]) {
      const h = cornerPanelHeight(rows, true);
      expect(Number.isFinite(h), `rows=${rows} → ${h}`).toBe(true);
    }
  });

  it("treats a non-finite row count as a single row", () => {
    // Not zero: a panel with a header and no rows still has a header.
    const one = cornerPanelHeight(1, true);
    expect(cornerPanelHeight(NaN, true)).toBe(one);
    expect(cornerPanelHeight(Infinity, true)).toBe(one);
  });

  it("truncates a fractional row count", () => {
    // A partial row is not a thing; `2.7` used to produce a height no row sum
    // can equal, which `plan.scene + plan.reserve` cannot reconcile.
    expect(cornerPanelHeight(2.7, true)).toBe(cornerPanelHeight(2, true));
    expect(cornerPanelHeight(2.7, true)).not.toBe(cornerPanelHeight(3, true));
  });

  it("reproduces the documented formula for the real value the caller passes", () => {
    // The guard must not move the number the layout is tuned around. `7` is the
    // GAME panel's row count; the formula is header + rows×(row+gaps) + padding.
    const rows = 7;
    const fromParts =
      PANEL_HEADER_HEIGHT +
      rows * rowHeight(true) +
      (rows - 1) * MENU_ROW_GAP +
      PANEL_PADDING +
      PANEL_BORDER;
    expect(cornerPanelHeight(rows, true)).toBe(fromParts);
  });

  it("is monotonic in the row count", () => {
    // The property the scene reservation depends on: more rows, taller panel.
    let prev = 0;
    for (const rows of [1, 2, 3, 4, 5, 6, 7]) {
      const h = cornerPanelHeight(rows, true);
      expect(h, `rows=${rows}`).toBeGreaterThan(prev);
      prev = h;
    }
  });
});

describe("cornerRowHeight is not a row height", () => {
  /*
   * The name promises the height of one row and returns the height of the whole
   * panel at `CORNER_MAX_ROWS` rows. Every caller treats it correctly, so this
   * is not a bug — but it cost me one wrong test assertion while writing this
   * file, which is exactly the reader the name will mislead next.
   */
  it("returns the full panel at the maximum row count", () => {
    expect(cornerRowHeight(true)).toBe(cornerPanelHeight(CORNER_MAX_ROWS, true));
  });

  it("is much taller than a single row", () => {
    expect(cornerRowHeight(true)).toBeGreaterThan(rowHeight(true) * 3);
  });
});

describe("VolumeStepper's clampVolume", () => {
  /*
   * The helper is module-private, so it is mirrored here and pinned to the
   * source below. Same trade-off as `tests/engine-resize.test.ts`, stated for
   * the same reason: the component needs a React renderer, and the arithmetic
   * is where the bug was.
   */
  const clampVolume = (n: number): number =>
    Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0;

  it("collapses every non-finite value to 0", () => {
    for (const n of [NaN, Infinity, -Infinity]) {
      expect(clampVolume(n), `clampVolume(${n})`).toBe(0);
    }
  });

  it("clamps into 0–100", () => {
    expect(clampVolume(-40)).toBe(0);
    expect(clampVolume(140)).toBe(100);
    expect(clampVolume(55)).toBe(55);
  });

  it("rounds to an integer", () => {
    expect(clampVolume(54.4)).toBe(54);
    expect(clampVolume(54.6)).toBe(55);
  });

  it("is idempotent", () => {
    // A value that survives one pass must survive the next, or the −/+ buttons
    // drift on repeated presses.
    for (const n of [0, 1, 55, 100, 100.4, -1]) {
      expect(clampVolume(clampVolume(n))).toBe(clampVolume(n));
    }
  });

  it("keeps the source's guard", () => {
    const src = readFileSync("src/components/settings/VolumeStepper.tsx", "utf8");
    expect(src).toContain("function clampVolume");
    expect(src).toContain("!Number.isFinite(n)");
    // Both the display and the setter must go through it — a guarded readout
    // with an unguarded `onChange` would still write `NaN` to settings.
    expect(src.match(/clampVolume\(/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
