/**
 * `MenuChrome` — why the chrome is absolute and what that buys.
 *
 * In v1.1.7 the corner row and the ticker were *flex siblings* of the hero,
 * both `shrink-0`. A flex column gives rigid items their declared heights first
 * and hands the remainder to the flexible one, so on a 720px window:
 *
 *     hero    = 720 − 415 − 55 = 250px      (squeezed)
 *     chrome  = 415 + 55       = 470px      (untouched)
 *
 * The hero was 250px tall with ~430px of content, which is how `LỌ` ended up
 * clipped by the top edge.
 *
 * `absolute inset-x-0 bottom-0` takes the chrome out of that negotiation
 * entirely. The hero then reserves the same height with `padding-bottom`,
 * computed by `planMenuLayout()` — one function, two consumers, no drift.
 *
 * These tests hold the three properties that make it work, because each of them
 * looks removable and none of them is.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const src = readFileSync("src/components/menu/MenuChrome.tsx", "utf8");

describe("the chrome is out of the flex flow", () => {
  it("is absolutely positioned to the bottom", () => {
    expect(src).toMatch(/absolute inset-x-0 bottom-0/);
  });

  it("is not a flex sibling — no shrink-0, no relative flow position", () => {
    // `shrink-0` on the chrome is precisely the v1.1.7 bug.
    expect(src).not.toMatch(/className="[^"]*shrink-0/);
  });

  it("takes its height from the plan, not from its children", () => {
    expect(src).toContain("style={{ height: reserve }}");
  });

  it("sits above the hero band so it cannot be scrolled past", () => {
    expect(src).toMatch(/z-30/);
  });
});

describe("the band does not swallow clicks meant for the hero", () => {
  it("the band itself is pointer-events-none", () => {
    // The band spans the full width. Without this it would intercept every
    // click in the bottom third of the screen, including the mascot chip.
    expect(src).toMatch(/pointer-events-none absolute/);
  });

  it("the panels opt back in", () => {
    // The opt-in lives on CornerPanel, not here; this asserts the band left
    // room for it rather than setting pointer-events-auto on its wrapper.
    expect(src).toContain('className="relative flex h-full flex-col justify-end"');
    const corner = readFileSync("src/components/menu/CornerPanel.tsx", "utf8");
    expect(corner).toContain("pointer-events-auto");
  });
});

describe("the fade is a band, not a full-screen darkener", () => {
  it("the gradient stops at the chrome's own height", () => {
    expect(src).toMatch(/absolute inset-0 bg-gradient-to-t from-jade-950/);
  });

  it("is hidden from assistive tech", () => {
    expect(src).toContain('aria-hidden="true"');
  });
});
