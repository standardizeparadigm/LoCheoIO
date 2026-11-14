/**
 * The two corner-panel footers (`src/components/menu/panel/`).
 *
 * v1.1.8 replaced `justify-around` — which spread three INFO rows over a
 * height sized for seven, the report's "phần thông tin tự nhiên bị chia ra" —
 * with a top-aligned stack plus one explicit footer. The footer is what fills
 * the leftover space the same report calls out as empty.
 *
 * What must hold:
 *   - the GAME footer never claims more progress than exists (a corrupt save
 *     used to be able to print 18/16);
 *   - the INFO footer's tier is the changelog module's tier, not a second
 *     hand-typed string that could disagree with the panel above it;
 *   - the joined text is stable so the SSR smoke test can spot a regression.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildStat, progressStat, statText } from "../src/components/menu/panel";
import { APP_VERSION } from "../src/version";
import { tierFor } from "../src/game/changelog";

describe("progressStat — the GAME footer", () => {
  it("renders unlocked/total plus the mode count", () => {
    const stats = progressStat(7, 16, 9);
    expect(stats).toEqual([
      { label: "✓", value: "7/16" },
      { label: "◆", value: "9" },
    ]);
  });

  it("clamps an impossible unlocked count down to the total", () => {
    // A hand-edited localStorage record used to print 18/16.
    expect(progressStat(18, 16, 9)[0].value).toBe("16/16");
  });

  it("clamps negative input to zero", () => {
    expect(progressStat(-3, 16, -1)).toEqual([
      { label: "✓", value: "0/16" },
      { label: "◆", value: "0" },
    ]);
  });

  it("survives a zero total instead of dividing or printing NaN", () => {
    expect(progressStat(4, 0, 9)[0].value).toBe("0/0");
  });

  it("truncates fractions rather than printing decimals", () => {
    expect(progressStat(7.9, 16.4, 9.7)[0].value).toBe("7/16");
  });
});

describe("buildStat — the INFO footer", () => {
  it("shows the version and the uppercased tier", () => {
    expect(buildStat("1.1.8", "patch")).toEqual([
      { label: "v", value: "1.1.8" },
      { label: "◆", value: "PATCH" },
    ]);
  });

  it("uses the live APP_VERSION and its real tier", () => {
    const stats = buildStat(APP_VERSION, tierFor(APP_VERSION));
    expect(stats[0].value).toBe(APP_VERSION);
    expect(stats[1].value).toBe("PATCH");
  });

  it("agrees with the changelog panel it sits under", () => {
    // Same function, same answer — that is the point of not re-typing it.
    expect(buildStat(APP_VERSION, tierFor("1.1.8"))[1].value).toBe("PATCH");
    expect(tierFor("1.2.0")).toBe("minor");
  });
});

describe("statText — the joined strip", () => {
  it("joins label and value with a middot, cells in order", () => {
    expect(statText(progressStat(7, 16, 9))).toBe("✓7/16 · ◆9");
  });

  it("is empty for an empty list rather than printing a separator", () => {
    expect(statText([])).toBe("");
  });
});

describe("the panel body no longer spreads its rows", () => {
  it("does not put justify-around on the panel body element", () => {
    // The comment above the body *describes* the old `justify-around`, so this
    // has to inspect the rendered className, not the file text.
    const corner = readFileSync("src/components/menu/CornerPanel.tsx", "utf8");
    const tag = corner.slice(corner.indexOf('className="corner-panel-body'), corner.indexOf(">", corner.indexOf('className="corner-panel-body')));
    expect(tag).not.toContain("justify-");
    expect(tag).toContain("flex-col");
  });

  it("the stylesheet pins the body to flex-start", () => {
    const css = readFileSync("src/index.css", "utf8");
    const block = css.slice(css.indexOf(".corner-panel-body"), css.indexOf(".corner-panel-body") + 120);
    expect(block).toContain("justify-content: flex-start");
  });
});
