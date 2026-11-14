/**
 * The SVGs are the only place a stale count can hide from `grep` — they are
 * generated-looking figures, embedded in all ten READMEs, and their numbers are
 * inside `<text>` nodes that no documentation test was reading.
 *
 * Three were wrong:
 *
 *     assets/test-matrix.svg    308 tests / 36 files   →  976 / 96
 *     assets/architecture.svg   "7 locale · 302 khoá"  →  327
 *     assets/layout-fix.svg     "32 test khoá phép cộng" → 30
 *
 * The first is the worst possible place for it: a number three times too small,
 * under a badge that was correct, in an image. A reader cannot diff an image,
 * and a reviewer cannot see that it changed.
 *
 * This file sweeps every SVG for the three claim shapes and checks the numbers.
 * It is deliberately narrow — it looks for a number *immediately followed by*
 * the word, so the hundreds of coordinates in an SVG are not scanned as counts.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";

import { localeTable } from "../src/i18n/i18n";

const TESTS = 976;
const FILES = 96;
const KEYS = Object.keys(localeTable("vi")).length;

const SVGS = readdirSync("assets")
  .filter((f) => f.endsWith(".svg"))
  .map((f) => ({ name: `assets/${f}`, body: readFileSync(`assets/${f}`, "utf8") }));

/** Every `NNN tests` / `NNN test` claim in every SVG. */
function testClaims(): Array<{ file: string; n: number; raw: string }> {
  const out: Array<{ file: string; n: number; raw: string }> = [];
  for (const { name, body } of SVGS) {
    for (const m of body.matchAll(/(\d{2,4}) tests?\b/g)) {
      out.push({ file: name, n: Number(m[1]), raw: m[0] });
    }
  }
  return out;
}

describe("counts printed inside SVG figures", () => {
  it("never states a total-suite test count other than the real one", () => {
    /*
     * `layout-fix.svg` legitimately says "30 test khoá phép cộng" — that is a
     * subset count, not the suite. So the rule cannot be "every number is 976";
     * it is "every number that claims to be the whole suite is 976", and the
     * only way to tell them apart without parsing prose is to allow numbers
     * below a threshold that a suite total could never be.
     */
    for (const claim of testClaims()) {
      if (claim.n >= 100) {
        expect(claim.n, `${claim.file} says "${claim.raw}"`).toBe(TESTS);
      }
    }
  });

  it("never states a file count other than the real one", () => {
    for (const { name, body } of SVGS) {
      for (const m of body.matchAll(/(\d{1,3}) files\b/g)) {
        expect(Number(m[1]), `${name} says "${m[0]}"`).toBe(FILES);
      }
    }
  });

  it("never states an i18n key count other than the real one", () => {
    for (const { name, body } of SVGS) {
      for (const m of body.matchAll(/(\d{2,4}) khoá\b/g)) {
        expect(Number(m[1]), `${name} says "${m[0]}"`).toBe(KEYS);
      }
    }
  });

  it("keeps the three repaired figures repaired", () => {
    // Named explicitly, so a regeneration that reverts one is caught by name.
    expect(readFileSync("assets/test-matrix.svg", "utf8")).toContain(`>${TESTS}<`);
    expect(readFileSync("assets/architecture.svg", "utf8")).toContain(`${KEYS} khoá`);
    expect(readFileSync("assets/layout-fix.svg", "utf8")).toContain("30 test khoá");
  });

  it("scans every SVG in the folder, not a hand-listed subset", () => {
    // 20 today; a floor rather than an equality so adding a figure is allowed.
    expect(SVGS.length).toBeGreaterThanOrEqual(20);
  });
});
