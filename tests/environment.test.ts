/**
 * The environment signals, and the four ways each of them lies.
 *
 * Every function here takes `unknown` because every one of them is reading a
 * browser API that reports nonsense at least once per session: `dpr` is 0
 * during a zoom transition, `env(safe-area-inset-bottom)` is `""` on desktop
 * Chrome and `"auto"` on an older Safari, and `matchMedia` is absent in every
 * SSR render this project does.
 */
import { describe, expect, it } from "vitest";
import {
  DESKTOP_ENVIRONMENT,
  HANDHELD_MAX_HEIGHT,
  isHandheld,
  parseInset,
  saneDpr,
  TOUCH_ROW_HEIGHT,
  verticalInset,
} from "../src/components/menu/adaptive/environment";

describe("saneDpr", () => {
  it("clamps into [1, 4]", () => {
    expect(saneDpr(1)).toBe(1);
    expect(saneDpr(2)).toBe(2);
    expect(saneDpr(0.5)).toBe(1);
    expect(saneDpr(8)).toBe(4);
  });

  it("reads garbage as 1, not as 0", () => {
    // 0 is not a valid ratio and `1 / 0` is Infinity — the whole reason this
    // function exists rather than `Math.min(4, Math.max(1, v))`.
    for (const bad of [NaN, Infinity, -Infinity, 0, -2, undefined, null, "2"]) {
      expect(saneDpr(bad), `saneDpr(${String(bad)})`).toBe(1);
    }
  });
});

describe("parseInset", () => {
  it("reads a px string", () => {
    expect(parseInset("44px")).toBe(44);
    expect(parseInset("0px")).toBe(0);
    expect(parseInset("  34px  ")).toBe(34);
  });

  it("reads the empty string as 0", () => {
    // Desktop Chrome returns "" for an unsupported env() — not "0px".
    expect(parseInset("")).toBe(0);
    expect(parseInset("   ")).toBe(0);
  });

  it("reads anything unparseable as 0", () => {
    for (const bad of ["auto", "44", "44em", "px", null, undefined, {}, NaN]) {
      expect(parseInset(bad), `parseInset(${String(bad)})`).toBe(0);
    }
  });

  it("never returns a negative inset", () => {
    // A negative inset would *add* space, which no browser means by it.
    expect(parseInset("-44px")).toBe(0);
    expect(parseInset(-10)).toBe(0);
  });

  it("rounds a fractional px with the browser's own rounding", () => {
    expect(parseInset("43.6px")).toBe(44);
    expect(parseInset(43.6)).toBe(44);
  });
});

describe("verticalInset", () => {
  it("adds top and bottom only", () => {
    const env = { ...DESKTOP_ENVIRONMENT, insetTop: 44, insetBottom: 34, insetLeft: 99 };
    expect(verticalInset(env)).toBe(78);
  });

  it("is 0 for a device without insets", () => {
    expect(verticalInset(DESKTOP_ENVIRONMENT)).toBe(0);
  });
});

describe("isHandheld", () => {
  const phone = { ...DESKTOP_ENVIRONMENT, coarse: true };

  it("is true for a landscape phone", () => {
    expect(isHandheld(phone, 844, 390)).toBe(true);
    expect(isHandheld(phone, 375, 667)).toBe(false); // portrait: not landscape
  });

  it("is false for a landscape window of the same size", () => {
    // The whole point: a 900×500 *window* on a desktop is not a phone, and must
    // not get 44px rows.
    const desktop = { ...DESKTOP_ENVIRONMENT, coarse: false };
    expect(isHandheld(desktop, 844, 390)).toBe(false);
    expect(isHandheld(desktop, 900, 500)).toBe(false);
  });

  it("is false for a tablet even with a coarse pointer", () => {
    expect(isHandheld(phone, 1024, 768)).toBe(false);
    expect(isHandheld(phone, 768, 1024)).toBe(false);
  });

  it("treats the height ceiling as exclusive of taller windows", () => {
    expect(isHandheld(phone, 900, HANDHELD_MAX_HEIGHT)).toBe(true);
    expect(isHandheld(phone, 900, HANDHELD_MAX_HEIGHT + 1)).toBe(false);
  });

  it("survives non-finite dimensions", () => {
    // `Number.isFinite` first: `Math.trunc(NaN)` is NaN and every comparison
    // against it is false, which would silently answer "not a phone".
    expect(isHandheld(phone, NaN, NaN)).toBe(false);
    expect(isHandheld(phone, Infinity, -Infinity)).toBe(false);
  });
});

describe("TOUCH_ROW_HEIGHT", () => {
  it("clears both accessibility floors", () => {
    // WCAG 2.2 SC 2.5.8 wants 24px; Apple's HIG wants 44. The stricter wins
    // because the two disagree and there is no cost to choosing the larger.
    expect(TOUCH_ROW_HEIGHT).toBeGreaterThanOrEqual(44);
  });

  it("is taller than every row height the panel can already paint", () => {
    // 34 normal, 26 tight. A touch row below either would be a regression.
    expect(TOUCH_ROW_HEIGHT).toBeGreaterThan(34);
  });
});
