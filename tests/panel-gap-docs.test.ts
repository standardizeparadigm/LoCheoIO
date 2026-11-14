/**
 * The same 240px gap was documented three times with three different numbers:
 *
 *     docs/releases/v1.1.8.md §12   "458px chứa ba hàng 46px là 320px trống"
 *     docs/design/menu-corners.md   "Chênh lệch ~126px"
 *     src/.../InfoMenu.tsx (twice)  "160px" and "~126px"
 *
 * The true figure is `cornerPanelHeight(7, true) - cornerPanelHeight(3, true)`
 * = 458 − 218 = 240. All three are now corrected, and this file is the reason
 * they stay corrected: the numbers are in prose, where no type and no test can
 * reach them, so the only defence is to grep for the wrong ones.
 *
 * This is deliberately a *documentation* test. It reads source and markdown and
 * asserts a claim about the text, which is the same technique
 * `docs-numbers.test.ts` uses for counts and `a11y-claims.test.ts` for the
 * accessibility guide.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const DOCS = "docs/releases/v1.1.8.md";
const CORNERS = "docs/design/menu-corners.md";
const INFOMENU = "src/components/menu/InfoMenu.tsx";

describe("the 240px panel gap", () => {
  it("is not described as 320px, 160px or ~126px anywhere it was wrong", () => {
    /*
     * Each of these numbers was one of the three wrong figures. 160 and 126 are
     * checked as *phrases*, not bare numbers: both are legitimate values
     * elsewhere (126 appears in no layout constant, but 160 does), so the test
     * matches the sentence shape that made the claim.
     */
    const wrong = [
      { file: DOCS, re: /320px trống/ },
      { file: CORNERS, re: /Chênh lệch ~126px/ },
      { file: INFOMENU, re: /so 160px of it was/ },
      { file: INFOMENU, re: /so ~126px\s*\n?\s*of it was blank/ },
    ];
    for (const { file, re } of wrong) {
      expect(readFileSync(file, "utf8"), `${file} still says ${re}`).not.toMatch(re);
    }
  });

  it("is stated as 240 in the release doc's section heading and body", () => {
    const body = readFileSync(DOCS, "utf8");
    expect(body).toContain("### 12.1 Khoảng trống 240px");
    expect(body).toMatch(/\*\*240px\*\*/);
  });

  it("names the three frame heights the correction relies on", () => {
    // 458 = seven rich rows, 278 = four, 218 = three. A reader has to be able
    // to re-derive 240 from the document alone.
    const corners = readFileSync(CORNERS, "utf8");
    for (const n of ["458", "278", "218", "240"]) {
      expect(corners, `menu-corners.md does not mention ${n}`).toContain(n);
    }
  });

  it("says the row is 54px, not 46px", () => {
    /*
     * The release doc said "ba hàng 46px". 46 is a plausible-looking number —
     * it is the tight row — which is exactly why it needed correcting rather
     * than leaving: a reader would check it, find 46 in metrics.ts, and
     * believe the rest.
     */
    expect(readFileSync(DOCS, "utf8")).not.toMatch(/ba hàng 46px/);
  });
});
