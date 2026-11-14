/**
 * THE MENU DOES NOT SCROLL.
 *
 * Not "the scrollbar is hidden" — that was rounds 1 and 2, and each of them
 * moved the overflow somewhere new. The report for round 3 is explicit: the
 * menu must not be scrollable at all, and the patch has to be final.
 *
 * So this file does not grep for CSS that hides a bar. It checks the
 * *arithmetic* that makes a bar unnecessary:
 *
 *     1. planMenuLayout() seats the column inside the window exactly
 *     2. the pane is `overflow: clip` (or `hidden`), not `overflow: auto`
 *     3. the hero is a fixed band, not a growing one
 *     4. no scrollbar-hiding rules survive that would mask a regression
 *
 * If any future change re-introduces overflow, test 1 fails immediately —
 * without a browser, without a screenshot, and without the bug needing to
 * survive to a report.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { planMenuLayout, planFits, occupiesExactly } from "../src/components/menu/layout/fit";


/**
 * The body of a CSS rule, brace-matched.
 *
 * `slice(indexOf("{"), indexOf("}"))` looks fine until the rule contains a
 * comment with braces in it, which `.menu-hero` and `.menu-pane` both do. This
 * walks the braces so the slice is the actual rule.
 */
function ruleBody(css: string, selector: string): string {
  const start = css.indexOf(selector + " {");
  if (start < 0) throw new Error("selector not found: " + selector);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error("unbalanced braces for " + selector);
}

const CSS = readFileSync("src/index.css", "utf8");
const START = readFileSync("src/components/StartScreen.tsx", "utf8");

/** Every viewport a real player is likely to have, plus the awkward ones. */
const VIEWPORTS = [
  { width: 375, height: 667 },
  { width: 375, height: 568 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 844, height: 390 },  // landscape phone — the hard case
];

describe("the column fits the window, exactly", () => {
  it.each(VIEWPORTS)("$width×$height seats scene + reserve === height", (vp) => {
    const plan = planMenuLayout(vp);
    expect(plan.scene + plan.reserve).toBe(vp.height);
    expect(occupiesExactly(plan, vp)).toBe(true);
  });

  it("never returns a scene that would overflow the viewport, from 240px up", () => {
    /*
     * 240px is the lowest height a browser window can actually have on a
     * desktop; below that the plan reports "crop" and the column is allowed to
     * exceed the window, because there is no arrangement that fits. Everything
     * a real device can report must seat exactly.
     */
    for (let h = 300; h <= 2000; h += 5) {
      for (const w of [320, 375, 768, 1280, 1920]) {
        const plan = planMenuLayout({ width: w, height: h });
        // Below the crop threshold there is no arrangement that fits; the
        // plan says so via `fit` instead of pretending.
        if (plan.fit !== "crop") expect(plan.scene + plan.reserve).toBe(h);
      }
    }
    // 300px is where even the wordmark-only hero stops fitting next to the
    // chrome, so from there up every plan must seat exactly.
    for (let h = 390; h <= 2000; h += 5) {
      const plan = planMenuLayout({ width: 844, height: h });
      expect(plan.scene + plan.reserve).toBe(h);
    }
  });

  it("the landscape phone (844×390) fits exactly — it used to scroll", () => {
    const vp = { width: 844, height: 390 };
    const plan = planMenuLayout(vp);
    /*
     * Every economy fires: 26px rows, compact chrome, no ticker, no footer,
     * wordmark-only hero. The chrome needs 216, the hero gets the other 174, and
     * the two add up to exactly 390 — nothing left to scroll.
     *
     * Round 7 added the compact economy, so these numbers moved from
     * 244 / 146 to 216 / 174: the same total, 28px transferred from the corner
     * panels to the wordmark. The landscape phone is where that matters most —
     * 146px was 4px short of the 150px wordmark it has to seat, so the top of
     * `LỌ` was clipped at every landscape phone.
     */
    expect(plan.tight).toBe(true);
    expect(plan.compact).toBe(true);
    expect(plan.minimal).toBe(true);
    expect(plan.ticker).toBe(false);
    expect(plan.footer).toBe(false);
    expect(plan.reserve).toBe(216);
    expect(plan.scene).toBe(174);
    expect(plan.scene + plan.reserve).toBe(390);
    expect(planFits(plan, vp)).toBe(true);
  });
});

describe("the pane is not a scroll container", () => {
  it("uses overflow: clip on .menu-pane", () => {
    const block = CSS.slice(CSS.indexOf(".menu-pane {"), CSS.indexOf("}", CSS.indexOf(".menu-pane {")));
    expect(block).toMatch(/overflow:\s*clip/);
  });

  it("falls back to overflow: hidden where clip is unsupported", () => {
    expect(CSS).toMatch(/@supports not \(overflow: clip\)/);
  });

  it("never sets overflow-y: auto on the pane", () => {
    expect(CSS).not.toMatch(/\.menu-pane[^{]*\{[^}]*overflow(?:-y)?:\s*auto/);
  });

  it("StartScreen no longer mounts a `.menu-scroll` container", () => {
    expect(START).not.toMatch(/className="menu-scroll/);
    expect(START).toContain("menu-pane");
  });

  it("the column is pinned with h-full, not minHeight: 100%", () => {
    expect(START).not.toContain('minHeight: "100%"');
    expect(START).toMatch(/h-full/);
  });
});

describe("the hero is a fixed band", () => {
  it("gets an explicit height from the plan, not a minimum", () => {
    expect(START).toMatch(/height:\s*plan\.scene/);
  });

  it("CSS pins it with height, not min-height, and does not let it grow", () => {
    // Grab the rule body by brace-matching from `.menu-hero {`. Slicing to the
    // first `}` cuts the block short because the rule opens with a comment, and
    // a short slice makes assertions pass or fail for the wrong reason.
    // Strip comments first: this rule's own comment *describes* the round-2
    // `flex: 1 0 auto` bug, and a naive match would read the description as
    // the declaration.
    const block = ruleBody(CSS, ".menu-hero").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(block).toMatch(/height:\s*var\(--menu-scene-h/);
    // `flex: 1 0 auto` + `min-height` is the round-2 combination that let the
    // column grow past the window.
    expect(block).not.toMatch(/flex:\s*1\b/);
    expect(block).not.toMatch(/min-height:\s*var\(--menu-scene-h/);
  });
});

describe("no leftover bar-hiding rules", () => {
  it("does not hide a scrollbar on the menu pane", () => {
    // Hiding a bar was the old strategy. If a rule like this is still here,
    // it means someone expects overflow — which is the bug, not the fix.
    expect(CSS).not.toMatch(/\.menu-(?:pane|scroll)[^{]*\{[^}]*scrollbar-width:\s*none/);
  });

  it("does not set overscroll-behavior on the pane (there is nothing to chain)", () => {
    const block = CSS.slice(CSS.indexOf(".menu-pane {"), CSS.indexOf("}", CSS.indexOf(".menu-pane {")));
    expect(block).not.toContain("overscroll-behavior");
  });

  it("the game's own scroll regions still have their styled bar", () => {
    // Scoping the universal ::-webkit-scrollbar to `.game-scroll` in round 2
    // must not have broken modals: they are the one place that still scrolls.
    expect(CSS).toContain(".game-scroll::-webkit-scrollbar");
    expect(CSS).toMatch(/\.game-scroll::-webkit-scrollbar\s*\{[^}]*width:\s*8px/);
  });
});
