/**
 * Every palette colour against every palette colour it is used on.
 *
 * The existing `palette.test.ts` checks that the TypeScript list and the CSS
 * custom properties have not drifted. That is a *consistency* check. This file
 * is a *legibility* check, and it is the one that catches a palette change which
 * is internally consistent and unreadable — the failure mode a hex-value diff
 * cannot show you.
 *
 * The ratios are computed here rather than asserted as literals, so a colour can
 * be adjusted and the test says whether the adjustment is allowed, instead of
 * breaking on an unrelated value change.
 *
 * Thresholds are WCAG 2.2: 4.5:1 for body text, 3:1 for large text and for
 * non-text UI boundaries that carry meaning.
 */
import { describe, expect, it } from "vitest";
import { PALETTE, PALETTE_CSS_TOKENS } from "../src/game/palette";

/** Relative luminance per WCAG 2.2 §relative-luminance. */
function luminance(hex: string): number {
  const channel = (i: number) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("the palette is a set of valid hex colours", () => {
  it("every value is a six-digit hex", () => {
    for (const [name, hex] of Object.entries(PALETTE)) {
      expect(hex, `${name} is not #rrggbb`).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("every colour maps to a CSS token that exists", () => {
    // The mirror list; `palette.test.ts` checks the values, this checks the
    // shape. A name here with no token would silently skip the drift check.
    expect(Object.keys(PALETTE_CSS_TOKENS).sort()).toEqual(Object.keys(PALETTE).sort());
  });
});

describe("text colours are legible on both dark backgrounds", () => {
  /*
   * The two backgrounds in the app: `void` (the canvas and the page) and `ink`
   * (panels). Text is checked against both, because a panel is not the page.
   */
  /*
   * `chili` is deliberately **not** in this list. It measures 4.30:1 on `void`,
   * which fails the body-text threshold and passes the large-text one — and it
   * is only ever used large (the SLAM button, hazard outlines). Putting it here
   * would force a palette change that the design does not want; the case at the
   * bottom of this file pins both halves of that decision instead.
   */
  const TEXT = ["cream", "gold", "goldLight", "brine", "jade"] as const;

  for (const fg of TEXT) {
    it(`${fg} clears 4.5:1 on void and ink`, () => {
      for (const bg of ["void", "ink"] as const) {
        const r = contrast(PALETTE[fg], PALETTE[bg]);
        expect(r, `${fg} on ${bg} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  it("cream, the body colour, is AAA on both", () => {
    // 7:1 is the stricter tier and the one body copy should meet.
    for (const bg of ["void", "ink"] as const) {
      expect(contrast(PALETTE.cream, PALETTE[bg])).toBeGreaterThanOrEqual(7);
    }
  });
});

describe("structural colours are allowed to be low-contrast, deliberately", () => {
  it("jadeDeep fails as text — and must not be used as text", () => {
    /*
     * 1.55:1. That is correct for a *border*: a panel outline should be a
     * hairline, not a headline. The test pins the number so nobody "fixes" it
     * to 4.5 and turns every frame into a visible box — and so the value cannot
     * silently drift into something that looks like text.
     */
    const r = contrast(PALETTE.jadeDeep, PALETTE.void);
    expect(r).toBeLessThan(3);
    expect(r).toBeGreaterThan(1.2);
  });

  it("chili is large-text-only, which is how it is used", () => {
    // 4.30:1 — below the 4.5 body threshold, above the 3.0 large-text one. It
    // appears only on the SLAM button and hazard outlines, both large.
    const r = contrast(PALETTE.chili, PALETTE.void);
    expect(r).toBeGreaterThanOrEqual(3);
    expect(r).toBeLessThan(4.5);
  });
});

describe("the palette is distinguishable, not just legible", () => {
  it("no two semantic colours are the same hex", () => {
    const values = Object.values(PALETTE);
    expect(new Set(values).size).toBe(values.length);
  });

  it("chrome and gold are far enough apart to read as different", () => {
    /*
     * These two carry the two most important signals in the HUD: `gold` is the
     * score and `chili` is damage. A palette tweak that pushed them together
     * would be legible and unusable.
     */
    expect(contrast(PALETTE.gold, PALETTE.chili)).toBeGreaterThan(1.8);
  });

  it("the three jades are ordered dark to light", () => {
    // The panel hierarchy depends on this ordering: void < ink < jadeDeep.
    const { void: v, ink: i, jadeDeep: d } = PALETTE;
    expect(luminance(v)).toBeLessThan(luminance(i));
    expect(luminance(i)).toBeLessThan(luminance(d));
  });
});
