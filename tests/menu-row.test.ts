/**
 * `MenuItemButton` — the rule that a row's height never depends on its label.
 *
 * This is the mechanism behind the round-1 fix. German `Fortschritt und
 * Einstellungen` and Thai `ความคืบหน้าและการตั้งค่า` are both long enough to wrap
 * to three lines at 11px in a 210px panel; before this component they did, and
 * each wrapped row pushed the panel 20px taller — which is how a panel whose
 * height was supposed to be a constant ended up depending on the language.
 *
 * The component cannot be rendered here (no DOM), so these tests read the
 * source and assert the properties that make the guarantee:
 *
 *   1. height is an inline style from `layout/metrics`, not from content;
 *   2. the label is `truncate` (overflow:hidden + ellipsis + nowrap);
 *   3. the label's wrapper is `min-w-0`, without which a flex child refuses to
 *      shrink below its content width and `truncate` never fires;
 *   4. a dropped hint moves to `title`, so truncation never loses information.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MENU_ROW_HEIGHT, MENU_ROW_RICH_HEIGHT } from "../src/components/menu/layout/metrics";

const src = readFileSync("src/components/menu/MenuItemButton.tsx", "utf8");

describe("the row height is declared, never measured", () => {
  it("reads both heights from the layout module", () => {
    expect(src).toContain("MENU_ROW_HEIGHT");
    expect(src).toContain("MENU_ROW_RICH_HEIGHT");
    expect(src).toContain("style={{ height }}");
  });

  it("the two densities differ, and compact is the smaller", () => {
    expect(MENU_ROW_RICH_HEIGHT).toBeGreaterThan(MENU_ROW_HEIGHT);
  });

  it("carries data-row so the probe can tell which density rendered", () => {
    expect(src).toContain('data-row={rich ? "rich" : "compact"}');
  });
});

describe("the label truncates instead of growing the row", () => {
  it("the label is truncated", () => {
    expect(src).toMatch(/menu-row-label[^"]*truncate/);
  });

  it("the label's wrapper can shrink below its content", () => {
    // `min-w-0` on a flex child is what allows `truncate` to do anything. This
    // is the single most common way this layout breaks: remove the class and
    // the row silently grows again, with no error anywhere.
    expect(src).toMatch(/min-w-0[^"]*flex-1/);
  });

  it("the row itself clips as a last resort", () => {
    expect(src).toMatch(/menu-row[^"]*overflow-hidden/);
  });

  it("the hint line truncates too, in rich density", () => {
    expect(src).toMatch(/block truncate font-body text-\[9px\]/);
  });
});

describe("nothing is lost when text is cut", () => {
  it("a hidden hint becomes the tooltip", () => {
    expect(src).toContain("title={!rich && hint ? hint : undefined}");
  });

  it("the hint is not duplicated when it is already visible", () => {
    // In rich density the hint is on screen, so a tooltip repeating it would be
    // noise for sighted users and an extra stop for screen readers.
    expect(src).toContain("{rich && hint && (");
  });
});

describe("the five variants are all distinct", () => {
  it("declares exactly five, each with its own background", () => {
    const block = src.slice(src.indexOf("const VARIANTS = {"), src.indexOf("} as const;"));
    const names = [...block.matchAll(/^\s+(\w+):/gm)].map((m) => m[1]);
    expect(names).toEqual(["primary", "brine", "danger", "ghost", "ink"]);

    // Every variant must name a background utility. A variant that only sets
    // a border renders as the default and looks like a missing case.
    for (const line of block.split("\n").filter((l) => l.includes(":"))) {
      expect(line, `variant without bg: ${line}`).toMatch(/bg-/);
    }
  });

  it("the disabled state is visible, not just inert", () => {
    // `opacity-40 saturate-0` is what makes a disabled row *look* disabled;
    // without it the only signal is that clicking does nothing.
    // The class list applies `opacity-40 saturate-0` when `disabled` is true.
    expect(src).toMatch(/\$\{disabled \? "[^"]*opacity-40 saturate-0/);
    expect(src).toContain("aria-disabled={disabled}");
  });
});
