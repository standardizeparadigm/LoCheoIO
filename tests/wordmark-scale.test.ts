/**
 * The wordmark's size ratio.
 *
 * The report's round-4 note — «chữ chéo thì quá to, che chữ lọ luôn rồi» — is
 * a claim about a *relationship*, not about a number. `CHÉO` was not "too big"
 * in the abstract; it was bigger than `LỌ` despite being the second line.
 *
 * So these tests assert the relationship at every width a player can have,
 * rather than pinning two `clamp()` strings. A rewrite that changes both
 * numbers but keeps `CHÉO` under `LỌ` passes; a rewrite that changes one and
 * lets `CHÉO` overtake fails.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  CHEO_CLAMP,
  CHEO_RATIO_MAX,
  LO_CLAMP,
  lockupAt,
  resolve,
  toClass,
} from "../src/components/menu/wordmark/scale";

describe("CHÉO never overtakes LỌ", () => {
  it("holds at every width from 320 to 3840px", () => {
    const failures: string[] = [];
    for (let w = 320; w <= 3840; w += 1) {
      const { lo, cheo, safe } = lockupAt(w);
      if (!safe) failures.push(`${w}px: LỌ ${lo.toFixed(1)} / CHÉO ${cheo.toFixed(1)}`);
    }
    expect(failures.slice(0, 5)).toEqual([]);
  });

  it("holds at the widths a real device reports", () => {
    for (const w of [320, 360, 375, 390, 414, 428, 640, 768, 820, 1024, 1280, 1366, 1440, 1920, 2560, 3840]) {
      const { safe } = lockupAt(w);
      expect({ w, safe }).toEqual({ w, safe: true });
    }
  });

  it("the old pair failed this test — that is why it exists", () => {
    // The regression, reconstructed: LỌ `clamp(2.6rem,9.5vw,5.6rem)` and CHÉO
    // `clamp(3.6rem,13vw,8rem)` at the 1280px reference.
    const oldLo = resolve({ min: 2.6, slope: 9.5, max: 5.6 }, 1280);
    const oldCheo = resolve({ min: 3.6, slope: 13, max: 8 }, 1280);
    expect(oldCheo).toBeGreaterThan(oldLo);
    expect(oldCheo / oldLo).toBeCloseTo(1.43, 1);
  });
});

describe("the ratio at the ceiling", () => {
  it("CHÉO's max is exactly CHEO_RATIO_MAX of LỌ's max", () => {
    expect(CHEO_CLAMP.max / LO_CLAMP.max).toBeCloseTo(CHEO_RATIO_MAX, 2);
  });

  it("the resolved ratio at desktop widths stays near that ceiling", () => {
    for (const w of [1024, 1280, 1440, 1920, 2560]) {
      const { ratio } = lockupAt(w);
      expect(ratio).toBeGreaterThan(0.75);
      expect(ratio).toBeLessThan(1);
    }
  });
});

describe("slope, not just ceiling", () => {
  it("CHÉO's vw slope is slower than LỌ's", () => {
    // A smaller ceiling with a larger slope still overtakes mid-range. The
    // first draft of this fix used 10.4vw against LỌ's 9.5 and was bigger
    // between 375 and 768 — caught by this assertion, not by eye.
    expect(CHEO_CLAMP.slope).toBeLessThan(LO_CLAMP.slope);
  });

  it("a hypothetical bad slope is actually rejected by the invariant", () => {
    // Prove the invariant has teeth: give CHÉO a bigger slope and watch the
    // ratio invert mid-range, which is what `safe` reports.
    // 9.5vw → 5.6rem ceiling; give CHÉO a 14vw slope and a 6rem ceiling and it
    // is bigger than LỌ from the moment the slope takes over.
    const bad = { min: 2.9, slope: 14, max: 6 };
    let inverted = false;
    for (let w = 320; w <= 2000; w += 5) {
      const lo = resolve(LO_CLAMP, w);
      if (resolve(bad, w) >= lo) inverted = true;
    }
    expect(inverted).toBe(true);
  });
});

describe("resolve()", () => {
  it("clamps below the floor and above the ceiling, in px", () => {
    const c = { min: 2, slope: 10, max: 4 };   // 32px floor, 64px ceiling
    expect(resolve(c, 0)).toBe(32);
    expect(resolve(c, 10)).toBe(32);
    expect(resolve(c, 100)).toBe(32);          // 10vw of 100px = 10px → floor
    expect(resolve(c, 400)).toBe(40);          // 10vw of 400px = 40px, in range
    expect(resolve(c, 1000)).toBe(64);         // 10vw of 1000px = 100px → ceiling
    expect(resolve(c, 10_000)).toBe(64);
  });

  it("is linear between the bounds, in pixels", () => {
    /*
     * `resolve()` returns **px**; the clamp bounds are written in rem and
     * converted at the 16px root. A first draft of this test compared rem with
     * px and asserted 3 against 30 — the assertion was wrong, not the function.
     */
    const c = { min: 1, slope: 10, max: 100 };  // 16px floor, 1600px ceiling
    const a = resolve(c, 300);                  // 10vw = 30px
    const b = resolve(c, 600);                  // 10vw = 60px
    expect(a).toBeCloseTo(30, 5);
    expect(b).toBeCloseTo(60, 5);
    expect(b - a).toBeCloseTo(30, 5);
  });

  it("returns a usable number for rubbish input instead of NaN", () => {
    expect(resolve(LO_CLAMP, NaN)).toBe(LO_CLAMP.min * 16);
    expect(resolve(LO_CLAMP, Infinity)).toBe(LO_CLAMP.max * 16);
  });
});

describe("toClass()", () => {
  it("produces a valid CSS clamp() with rem and vw units", () => {
    expect(toClass(LO_CLAMP)).toMatch(/^clamp\([\d.]+rem, [\d.]+vw, [\d.]+rem\)$/);
  });

  it("renders the declared numbers, not rounded ones", () => {
    expect(toClass({ min: 2.6, slope: 9.5, max: 5.6 })).toBe("clamp(2.6rem, 9.5vw, 5.6rem)");
  });
});

describe("the component uses the module, not its own numbers", () => {
  it("Wordmark has no literal clamp() in it", () => {
    const src = readFileSync("src/components/menu/wordmark/Wordmark.tsx", "utf8");
    // A literal here means the size has left the module that tests it.
    expect(src).not.toMatch(/clamp\(\s*\d/);
    expect(src).toContain("toClass(LO_CLAMP)");
    expect(src).toContain("toClass(CHEO_CLAMP)");
  });

  it("StartScreen mounts the Wordmark component", () => {
    const src = readFileSync("src/components/StartScreen.tsx", "utf8");
    expect(src).toContain("<Wordmark");
    expect(src).not.toMatch(/className="text-shimmer block pl-/);
  });

  it("the localised strings keep their diacritics", () => {
    for (const f of ["vi", "en", "zh", "ja", "ko", "es", "fr"]) {
      const src = readFileSync(`src/i18n/locales/${f}.ts`, "utf8");
      expect(src).toContain('"app.wordmarkLo"');
      expect(src).toContain('"app.wordmarkCheo": "CHÉO"');
    }
  });
});
