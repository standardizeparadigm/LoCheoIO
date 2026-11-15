/**
 * `scripts/check-adaptive.ts` must not grow its own copy of the truth.
 *
 * Until round 9 the script carried a 21-line `VIEWPORTS` table and three
 * hand-written invariants while the suite carried nine. That is why a window
 * could pass CI (`npm run check:adaptive`) and fail the suite: both were right
 * about their own copy.
 *
 * The fix was structural — the script imports `PRESETS` and `violations()` — and
 * this file is what keeps it structural. It reads the script as text, which is
 * crude, but the failure it guards against is crude too: someone re-inlining a
 * table because "it is only for printing".
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const script = readFileSync("scripts/check-adaptive.ts", "utf8");

describe("the adaptive check script", () => {
  it("reads its viewports from presets.ts", () => {
    expect(script).toContain('from "../src/components/menu/adaptive/presets"');
    expect(script).toContain("for (const preset of PRESETS)");
  });

  it("does not carry a second viewport table", () => {
    // A tuple literal like `[1280, 720, "the reference window"]` is the shape the
    // old table had; it must not come back.
    expect(script).not.toMatch(/\[\s*\d{3,4}\s*,\s*\d{3,4}\s*,/);
    expect(script).not.toContain("VIEWPORTS");
  });

  it("gates on the shared constraint list, not on inline predicates", () => {
    expect(script).toContain("violations");
    expect(script).toContain("constraintIds");
    /*
     * The three checks that used to live here are now in constraints.ts. If one
     * of them is re-inlined, the file has two sources again.
     */
    expect(script).not.toMatch(/scene \+ p\.plan\.reserve/);
  });

  it("keeps the --explain flag that the debugging guide documents", () => {
    expect(script).toContain("--explain");
    const guide = readFileSync("docs/guides/adaptive-debugging.md", "utf8");
    expect(guide).toContain("check:adaptive -- --explain");
    expect(script).toContain("renderDiagnosis");
  });

  it("still fails the build on a violation", () => {
    expect(script).toContain("process.exit(1)");
    expect(script).toContain("ADAPTIVE OK");
  });

  it("prints every preset, not a sample", () => {
    // A table that samples 5 of 21 windows is a table that misses the 320px ones.
    expect(script).not.toMatch(/slice\(0,\s*\d+\)/);
    expect(script).toContain("PRESETS.length");
  });
});
