/**
 * `panel/README.md` now prints a four-row table of panel heights — the four
 * economies the corner panel can be in. The table had to be written twice:
 * the first version said 218/178/218/190 for the three-row INFO panel, and the
 * measured values are 158/134/218/202.
 *
 * That is the failure mode this test exists for. A hand-written table of eight
 * numbers, four of which were invented by interpolating between two that were
 * right, looks completely plausible — the errors are 20 to 60px, which is one
 * row-ish, exactly the size a reader would not question.
 *
 * So every cell is compared to `cornerPanelHeight()`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { cornerPanelHeight } from "../src/components/menu/layout/metrics";

const README = readFileSync("src/components/menu/panel/README.md", "utf8");

/** [label in the table, rich, tight, compact] → the two heights it must print. */
const ECONOMIES: Array<[string, boolean, boolean, boolean]> = [
  ["gọn", false, false, false],
  ["gọn + tight", false, true, false],
  ["đầy đủ", true, false, false],
  ["đầy đủ + compact", true, false, true],
];

/** Pull a markdown row out of the file by its first cell. */
function rowFor(label: string): string[] {
  const line = README.split("\n").find((l) => l.trimStart().startsWith(`| ${label} |`));
  expect(line, `no table row for «${label}»`).toBeDefined();
  return line!.split("|").map((c) => c.trim().replace(/\*\*/g, ""));
}

describe("the panel height table", () => {
  it("prints seven-row heights that match the code", () => {
    for (const [label, rich, tight, compact] of ECONOMIES) {
      const cells = rowFor(label);
      const expected = cornerPanelHeight(7, rich, tight, compact);
      expect(cells[4], `${label}: GAME is ${expected}px`).toBe(String(expected));
    }
  });

  it("prints three-row heights that match the code", () => {
    for (const [label, rich, tight, compact] of ECONOMIES) {
      const cells = rowFor(label);
      const expected = cornerPanelHeight(3, rich, tight, compact);
      expect(cells[5], `${label}: INFO is ${expected}px`).toBe(String(expected));
    }
  });

  it("lists all four economies, because there are four", () => {
    // Two economies were added in round 7 (tight, compact) after this table's
    // first version documented only the original two.
    expect(README).toContain("| gọn |");
    expect(README).toContain("| gọn + tight |");
    expect(README).toContain("| đầy đủ |");
    expect(README).toContain("| đầy đủ + compact |");
  });

  it("names the header · gap · padding triple for each compact row", () => {
    // The triple is the *definition* of compact in this table: if someone
    // changes PANEL_HEADER_HEIGHT_COMPACT, the printed 18 is a lie.
    expect(rowFor("đầy đủ + compact")[3]).toBe("18 · 3 · 10");
    expect(rowFor("đầy đủ")[3]).toBe("22 · 6 · 16");
  });

  it("keeps the 240px INFO gap the release doc explains", () => {
    // Same subtraction as tests/layout-metrics.test.ts, stated in the README.
    expect(cornerPanelHeight(7, true) - cornerPanelHeight(3, true)).toBe(240);
    expect(README).toContain("240px ở chế độ đầy đủ");
  });
});
