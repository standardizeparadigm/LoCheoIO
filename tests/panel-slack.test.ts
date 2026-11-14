/**
 * Where the slack goes when a panel has fewer rows than its frame.
 *
 * Both corner panels are sized to `CORNER_MAX_ROWS` (7) so their frames line
 * up. GAME has seven rows; INFO has four plus a challenge line and a summary
 * block. The difference is ~126px, and both round-6 screenshots show it as a
 * blank region under «THOÁT».
 *
 * The mechanism, in order of who does what:
 *
 *   1. `justify-content: flex-start` on the body → content stacks at the top;
 *   2. `margin-top: auto` on the footer → footer pinned to the bottom;
 *   3. therefore the gap appears *between* them, in the middle.
 *
 * The fix scopes `space-between` to the INFO panel and drops the auto margin.
 * These tests hold both halves of that, plus the constraint that made round 5
 * reject the first attempt: the panels must not spread their *rows*.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("src/index.css", "utf8");
const corner = readFileSync("src/components/menu/CornerPanel.tsx", "utf8");

/**
 * The declaration block for a selector, or "" when absent.
 *
 * Comments are stripped first. This is not cosmetic: the commit that removed
 * `margin-top: auto` explains *why* in a comment that names it, so testing the
 * raw block would fail on the documentation of the fix.
 */
function block(selector: string): string {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const at = stripped.indexOf(selector);
  if (at === -1) return "";
  const open = stripped.indexOf("{", at);
  return stripped.slice(open, stripped.indexOf("}", open));
}

describe("the INFO panel distributes its slack", () => {
  it("scopes space-between to the right-hand panel only", () => {
    const info = block('.corner-panel[data-panel="right"] .corner-panel-body');
    expect(info, "INFO body rule missing").not.toBe("");
    expect(info).toContain("space-between");
  });

  it("leaves the GAME panel on flex-start", () => {
    // GAME has seven rows and no slack; spreading them would re-introduce the
    // rejected `justify-around` look, where every row floats.
    const base = block(".corner-panel-body");
    expect(base).toContain("justify-content: flex-start");
    expect(base).not.toContain("space-between");
  });

  it("keeps the tight economy compact", () => {
    const tight = block('.corner-panel[data-tight="1"] .corner-panel-body');
    expect(tight, "tight override missing").not.toBe("");
    expect(tight).toContain("flex-start");
  });
});

describe("the footer is not pushed twice", () => {
  it("does not use margin-top: auto on the panel footer", () => {
    /*
     * With `space-between` on the body, an auto margin on the last child
     * pushes it away from the block above it a second time — a smaller copy of
     * the same bug, at the bottom instead of the middle.
     */
    const footer = block(".panel-footer");
    expect(footer).not.toContain("margin-top: auto");
  });

  it("still separates the footer visually", () => {
    // Removing the margin must not remove the border that makes it read as a
    // footer rather than as another row.
    const footer = block(".panel-footer");
    expect(footer).toContain("border-top");
  });
});

describe("the constraint round 5 established still holds", () => {
  it("the body element carries no justify- utility class", () => {
    const at = corner.indexOf('className="corner-panel-body');
    const tag = corner.slice(at, corner.indexOf(">", at));
    expect(tag).not.toMatch(/justify-/);
    expect(tag).toContain("flex-col");
  });

  it("the body still clips rather than scrolls", () => {
    const at = corner.indexOf('className="corner-panel-body');
    const tag = corner.slice(at, corner.indexOf(">", at));
    expect(tag).toContain("overflow-hidden");
    expect(tag).not.toContain("overflow-y");
  });
});

/**
 * The same rule has to hold inside the block that *is* the bottom of INFO.
 *
 * `PanelSummary` is the last child before the footer slot. It carried
 * `mt-auto` from round 5, when the body was `flex-start` and something had to
 * shove the summary down. Once the body became `space-between`, that auto
 * margin asked for a second slice of the same space: the summary would sit
 * against the floor with a fresh gap above it — the v1.1.8 report's hole,
 * reproduced lower down and smaller, which is exactly the failure mode the
 * footer comment warns about.
 *
 * Badge tests would not catch it (the class still compiles) and no screenshot
 * at 720px would either (the gap is ~2px there). It only opens up on a tall
 * window, which is what this asserts.
 */
describe("the last block in the body obeys the same rule as the footer", () => {
  const summary = readFileSync("src/components/menu/panel/PanelSummary.tsx", "utf8");

  /** The root `<dl>`'s className, comments stripped. */
  const rootClass = (() => {
    const src = summary.replace(/\/\*[\s\S]*?\*\//g, "");
    const at = src.indexOf("<dl className=\"");
    const open = src.indexOf('"', at + 14);
    const close = src.indexOf('"', open + 1);
    return src.slice(open + 1, close);
  })();

  it("carries no auto top margin", () => {
    expect(rootClass).not.toContain("mt-auto");
    expect(rootClass).not.toMatch(/\bmx-auto|my-auto\b/);
  });

  it("keeps the dashed rule that separates it from the rows", () => {
    // Same reason as the footer's border: without it the block reads as a
    // fifth menu row.
    expect(rootClass).toContain("border-t-2");
    expect(rootClass).toContain("border-dashed");
  });

  it("is still the block the docs point at", () => {
    // The design doc names this file and this decision. A reader following it
    // from `menu-corners.md` must land on the same rule it describes.
    const design = readFileSync("docs/design/menu-corners.md", "utf8");
    expect(design).toContain("PanelSummary.tsx");
    expect(design).toContain("space-between");
  });
});
