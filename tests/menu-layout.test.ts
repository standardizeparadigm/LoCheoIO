/**
 * The layout arithmetic that broke in 1.1.7, pinned.
 *
 * The bug had one sentence behind it:
 *
 *     415px of corner row + 55px of ticker, in a 720px window
 *     → the hero gets 250px, its content needs ~430px
 *     → the wordmark is pushed above the top edge and cannot be scrolled to
 *
 * Every assertion here exists to keep that sentence from becoming true again.
 * The first test is the whole bug as an inequality.
 */
import { describe, expect, it } from "vitest";
import {
  CORNER_MAX_ROWS,
  CORNER_PANEL_WIDTH,
  CORNER_ROW_MARGIN,
  MENU_ROW_GAP,
  MENU_ROW_HEIGHT,
  MENU_ROW_RICH_HEIGHT,
  MIN_SCENE_HEIGHT,
  PREFERRED_SCENE_HEIGHT,
  TIGHT_SCENE_HEIGHT,
  PANEL_BORDER,
  PANEL_HEADER_HEIGHT,
  PANEL_PADDING,
  RICH_ROW_BREAKPOINT,
  STACK_BREAKPOINT,
  TICKER_HEIGHT,
  cornerLayoutFor,
  cornerPanelHeight,
  cornerRowHeight,
  cornerRowReserve,
  planFits,
  planMenuLayout,
  rowDensityFor,
  rowHeight,
} from "../src/components/menu/layout";
import { REFERENCE_VIEWPORT } from "../src/components/menu/layout/useMenuPlan";

describe("the 1.1.7 overflow, as an inequality", () => {
  it("leaves the hero at least MIN_SCENE_HEIGHT on a 720px window", () => {
    const reserve = cornerRowReserve(false);
    expect(reserve).toBeLessThan(720 - MIN_SCENE_HEIGHT);
  });

  it("leaves the hero at least MIN_SCENE_HEIGHT on a 768px window", () => {
    expect(cornerRowReserve(false)).toBeLessThan(768 - MIN_SCENE_HEIGHT);
  });

  it("reports the exact v1.1.7 numbers, so the regression is documented", () => {
    // The old layout: no declared heights, panel grew with its content.
    const OLD_CORNER_ROW = 415;
    const OLD_TICKER = 55;
    expect(720 - OLD_CORNER_ROW - OLD_TICKER).toBe(250);
    // 250 < the *preferred* 320, which is why the wordmark was squeezed. The
    // 220 floor is the crop threshold, not a comfort threshold — do not use
    // it to make this assertion "pass".
    expect(720 - OLD_CORNER_ROW - OLD_TICKER).toBeLessThan(PREFERRED_SCENE_HEIGHT);

    // The new layout on the same window.
    const plan = planMenuLayout({ width: 1280, height: 720 });
    expect(plan.scene).toBe(342);
    expect(plan.reserve).toBe(378);
    expect(plan.scene + plan.reserve).toBe(720);
  });
});

describe("panel height is the sum of declared parts", () => {
  it("compact: header + 6 rows + 5 gaps + padding + border", () => {
    const expected =
      PANEL_HEADER_HEIGHT +
      CORNER_MAX_ROWS * MENU_ROW_HEIGHT +
      (CORNER_MAX_ROWS - 1) * MENU_ROW_GAP +
      PANEL_PADDING +
      PANEL_BORDER;
    expect(cornerPanelHeight(CORNER_MAX_ROWS, false)).toBe(expected);
    expect(cornerRowHeight(false)).toBe(expected);
  });

  it("compact panel is 318px — seven rows", () => {
    expect(cornerRowHeight(false)).toBe(318);
  });

  it("rich panel is 458px", () => {
    expect(cornerRowHeight(true)).toBe(458);
  });

  it("rich minus compact is exactly the row delta times the row count", () => {
    const delta = MENU_ROW_RICH_HEIGHT - MENU_ROW_HEIGHT;
    expect(cornerRowHeight(true) - cornerRowHeight(false)).toBe(delta * CORNER_MAX_ROWS);
    expect(delta).toBe(20);
  });

  it("a one-row panel still has its header, padding and border", () => {
    expect(cornerPanelHeight(1, false)).toBe(MENU_ROW_HEIGHT + PANEL_HEADER_HEIGHT + PANEL_PADDING + PANEL_BORDER);
  });

  it("never returns a height for zero rows that collapses the header", () => {
    expect(cornerPanelHeight(0, false)).toBeGreaterThan(PANEL_HEADER_HEIGHT);
  });

  it("rowHeight follows the density flag", () => {
    expect(rowHeight(false)).toBe(MENU_ROW_HEIGHT);
    expect(rowHeight(true)).toBe(MENU_ROW_RICH_HEIGHT);
  });
});

describe("reserve = corner row + ticker + margin", () => {
  it("compact reserve is 378", () => {
    expect(cornerRowReserve(false)).toBe(318 + TICKER_HEIGHT + CORNER_ROW_MARGIN);
    expect(cornerRowReserve(false)).toBe(378);
  });

  it("rich reserve is 518", () => {
    expect(cornerRowReserve(true)).toBe(518);
  });

  it("the ticker is a fixed 48px, not a function of its text", () => {
    expect(TICKER_HEIGHT).toBe(48);
  });
});

describe("breakpoints", () => {
  it("stacks below 520px and sits side by side at 520", () => {
    expect(cornerLayoutFor(519)).toBe("stacked");
    expect(cornerLayoutFor(520)).toBe("side-by-side");
  });

  it("two panels plus their margins are what define the stack breakpoint", () => {
    // 224 × 2 + 12 × 2 = 472. Below 520 the row is stacked with room to spare,
    // so the two panels never touch in the middle of the screen.
    expect(CORNER_PANEL_WIDTH * 2 + CORNER_ROW_MARGIN * 2).toBe(472);
    expect(STACK_BREAKPOINT).toBeGreaterThan(472);
  });

  it("stays compact below 840px tall and goes rich at 840", () => {
    expect(rowDensityFor(839)).toBe("compact");
    expect(rowDensityFor(840)).toBe("rich");
  });

  it("rich rows clear the preferred scene height, not merely the floor", () => {
    // 840 − 518 = 322, which is above PREFERRED (320) — a rich row must not
    // cost the hero the height it wants, or a tall laptop would get *less*
    // hero than a short one.
    expect(RICH_ROW_BREAKPOINT - cornerRowReserve(true)).toBe(322);
    expect(RICH_ROW_BREAKPOINT - cornerRowReserve(true)).toBeGreaterThan(PREFERRED_SCENE_HEIGHT);
    // And the switch itself is safe: at 839 the plan still seats a full hero.
    const below = planMenuLayout({ width: 1440, height: 839 });
    expect(below.dense).toBe(false);
    expect(below.scene).toBeGreaterThanOrEqual(PREFERRED_SCENE_HEIGHT);
  });
});

describe("plans for real viewports", () => {
  /*
   * ROUND 3 changed what `scene` means. It used to be `max(320, height −
   * reserve)`, so a short viewport produced a scene *bigger* than the window
   * could seat — and `scene + reserve > height` was the overflow that shipped
   * as a scrollbar. It is now the number of pixels the hero actually gets,
   * and `scene + reserve === height` for every viewport, full stop.
   */
  const CASES = [
    { w: 1280, h: 720, reserve: 378, scene: 342, stacked: false, dense: false, fit: "none" },
    { w: 1366, h: 768, reserve: 378, scene: 390, stacked: false, dense: false, fit: "none" },
    { w: 1920, h: 1080, reserve: 518, scene: 562, stacked: false, dense: true, fit: "none" },
    { w: 768, h: 1024, reserve: 518, scene: 506, stacked: false, dense: true, fit: "none" },
    { w: 375, h: 667, reserve: 378, scene: 289, stacked: true, dense: false, fit: "squeeze" },
  ] as const;

  for (const c of CASES) {
    it(`${c.w}×${c.h} → reserve ${c.reserve}, scene ${c.scene}, fit "${c.fit}"`, () => {
      const plan = planMenuLayout({ width: c.w, height: c.h });
      expect(plan.reserve).toBe(c.reserve);
      expect(plan.scene).toBe(c.scene);
      expect(plan.stacked).toBe(c.stacked);
      expect(plan.dense).toBe(c.dense);
      expect(plan.fit).toBe(c.fit);
    });
  }

  it("every plan occupies exactly its viewport — never more", () => {
    // This is the round-3 promise. It replaces the old conditional check that
    // skipped the phone because the phone did not fit.
    for (const c of CASES) {
      const plan = planMenuLayout({ width: c.w, height: c.h });
      expect(plan.scene + plan.reserve).toBe(c.h);
      expect(planFits(plan, { width: c.w, height: c.h })).toBe(true);
    }
  });

  it("holds for every viewport in a wide sweep, not just the five above", () => {
    for (let h = 300; h <= 1600; h += 7) {
      for (const w of [320, 375, 480, 640, 768, 1024, 1280, 1440, 1920, 2560]) {
        const plan = planMenuLayout({ width: w, height: h });
        // Below the crop threshold the plan is allowed to seat more than the
        // window (there is no other option); at or above it, never.
        if (plan.fit !== "crop") expect(plan.scene + plan.reserve).toBe(h);
        // Which floor applies depends on the plan: 220 normally, 140 when the
        // hero drops to wordmark-only.
        expect(plan.scene).toBeGreaterThanOrEqual(plan.minimal ? TIGHT_SCENE_HEIGHT : MIN_SCENE_HEIGHT);
      }
    }
  });

  it("375×667 shrinks the hero instead of overflowing the column", () => {
    const phone = { width: 375, height: 667 };
    const plan = planMenuLayout(phone);
    // 667 − 378 = 289, which is under PREFERRED (320) but over MIN (220), so
    // the hero takes 289: the column fits the window exactly and the phone
    // does not scroll.
    expect(plan.scene).toBe(289);
    expect(plan.fit).toBe("squeeze");
    expect(plan.dense).toBe(false);
    expect(plan.stacked).toBe(true);
    expect(planFits(plan, phone)).toBe(true);
  });

  it("scene never drops below the floor that applies — 220, or 140 when minimal", () => {
    for (const h of [0, 100, 219, 220, 320, 500, 720]) {
      const plan = planMenuLayout({ width: 1280, height: h });
      const floor = plan.minimal ? TIGHT_SCENE_HEIGHT : MIN_SCENE_HEIGHT;
      expect(plan.scene).toBeGreaterThanOrEqual(floor);
    }
  });

  it("a window too short for both reports crop rather than pretending", () => {
    // 200 < 140 + 244, so not even a wordmark-only hero fits. The planner
    // says so out loud instead of silently overflowing.
    const tiny = { width: 1280, height: 200 };
    const plan = planMenuLayout(tiny);
    expect(plan.fit).toBe("crop");
    expect(plan.minimal).toBe(true);
    expect(plan.scene).toBe(TIGHT_SCENE_HEIGHT);
    expect(planFits(plan, tiny)).toBe(false);
  });

  it("the reference viewport is 1280×720 and yields the documented plan", () => {
    expect(REFERENCE_VIEWPORT).toEqual({ width: 1280, height: 720 });
    const plan = planMenuLayout(REFERENCE_VIEWPORT);
    expect(plan.reserve).toBe(378);
    expect(plan.scene).toBe(342);
    expect(plan.fit).toBe("none");
  });
});

describe("panel width", () => {
  it("is the declared 224 on a normal screen", () => {
    expect(planMenuLayout({ width: 1280, height: 720 }).panelWidth).toBe(CORNER_PANEL_WIDTH);
  });

  it("shrinks only when the viewport is narrower than one panel", () => {
    expect(planMenuLayout({ width: 320, height: 667 }).panelWidth).toBe(CORNER_PANEL_WIDTH);
    expect(planMenuLayout({ width: 230, height: 667 }).panelWidth).toBe(206);
    expect(planMenuLayout({ width: 200, height: 667 }).panelWidth).toBe(176);
  });
});

describe("the classes that caused the bug are gone", () => {
  /** Strip block comments — a comment describing the old class must not fail this. */
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

  it("StartScreen has no scroll container and does not centre its content", async () => {
    const fs = await import("node:fs/promises");
    const src = strip(await fs.readFile("src/components/StartScreen.tsx", "utf8"));
    expect(src).not.toContain("justify-center px-4 pt-12"); // the old nested-centre wrapper
    expect(src).not.toContain("min-h-full");
    // Round 3: `.menu-scroll` is gone. The pane is `.menu-pane`
    // (overflow: clip) and the column is pinned with h-full.
    expect(src).not.toContain("menu-scroll");
    expect(src).toContain("menu-pane");
    expect(src).toContain("plan.reserve");
    expect(src).toMatch(/height:\s*plan\.scene/);
  });

  it("the chrome is absolutely positioned and never a flex sibling", async () => {
    const fs = await import("node:fs/promises");
    const src = strip(await fs.readFile("src/components/menu/MenuChrome.tsx", "utf8"));
    expect(src).toContain("absolute inset-x-0 bottom-0");
    expect(src).not.toContain('"pointer-events-none relative z-30 flex shrink-0');
  });

  it("the ticker does not use the inline marquee block that pushed past the edge", async () => {
    const fs = await import("node:fs/promises");
    const src = strip(await fs.readFile("src/components/StartScreen.tsx", "utf8"));
    expect(src).not.toContain("anim-marquee flex w-max");
  });

  it("CSS declares a non-scrolling pane", async () => {
    const fs = await import("node:fs/promises");
    const css = strip(await fs.readFile("src/index.css", "utf8"));
    expect(css).toContain(".menu-pane");
    expect(css).toMatch(/\.menu-pane\s*\{[^}]*overflow:\s*clip/);
    // `overscroll-behavior` only exists to stop a *scrollable* box chaining to
    // its parent. With the pane clipped, there is nothing to chain.
    expect(css).not.toMatch(/\.menu-pane\s*\{[^}]*overscroll-behavior/);
  });
});
