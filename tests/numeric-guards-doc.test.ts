/**
 * `docs/guides/numeric-guards.md` names sites; the sites must still have guards.
 *
 * The guide's value is that it is a list of places this codebase got a numeric
 * guard wrong. Its risk is the same as every other document in this repo: a
 * future refactor removes a guard and the entry becomes a claim about code that
 * no longer exists.
 *
 * Each case below corresponds to one row of the guide's table. It does not check
 * that the guard *works* — the module's own test file does that. It checks that
 * the guard is still **there**, which is the failure a reviewer misses.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const guide = readFileSync("docs/guides/numeric-guards.md", "utf8");
const read = (p: string) => readFileSync(p, "utf8");

describe("every module the guide names still carries its guard", () => {
  it("modeMath has saneInt and multOf", () => {
    const src = read("src/game/modeMath.ts");
    expect(src).toContain("function saneInt");
    expect(src).toContain("Number.isFinite(n)");
    expect(src).toContain("function multOf");
    // The guard that replaced `??` must reject non-finite, not just nullish.
    expect(src).toContain("!Number.isFinite(raw)");
  });

  it("utils/math has the damp guard", () => {
    const src = read("src/utils/math.ts");
    expect(src).toContain("Number.isFinite");
  });

  it("engine.restoreRun has finiteOr", () => {
    expect(read("src/game/engine.ts")).toContain("finiteOr");
  });

  it("audioLevels has unit()", () => {
    const src = read("src/game/audioLevels.ts");
    expect(src).toContain("function unit");
    expect(src).toContain("Number.isFinite");
  });

  it("layout/fit clamps sanely", () => {
    expect(read("src/components/menu/layout/fit.ts")).toMatch(/Number\.isFinite|sane/);
  });

  it("panel/stat has whole()", () => {
    const src = read("src/components/menu/panel/stat.ts");
    expect(src).toContain("function whole");
    expect(src).toContain("!Number.isFinite(n)");
  });
});

describe("the guide's own claims", () => {
  it("states the count it actually lists", () => {
    /*
     * Both numbers in the summary line drift independently of the table, which
     * is why they are asserted here at all — the eight→nine update was caught
     * by this test, and so was nine→eleven.
     *
     * Asserted as *the current numbers* rather than by counting table rows,
     * because the prose deliberately undercounts: it says "eleven places in
     * eight modules" while the table has twelve rows, since `modeMath.ts ×2`
     * shares one file. The reader should trust the sentence.
     */
    expect(guide).toMatch(/mười một/);
    expect(guide).toMatch(/tám module/);
  });

  it("explains why `??` is not a guard", () => {
    // The section added after the seventh and eighth sites were found.
    expect(guide).toContain("?? 1");
    expect(guide).toMatch(/không phải guard|not a guard/);
  });

  it("gives the three-way question for choosing an operator", () => {
    // What replaced "use saneInt everywhere" as the actual rule.
    expect(guide).toMatch(/có phải là một câu trả lời|is this value an answer/);
  });

  it("includes a correct `??` usage, not only wrong ones", () => {
    // A guide that only shows the anti-pattern teaches avoidance, not judgement.
    expect(guide).toContain("autoPauseOnBlur ?? true");
  });
});
