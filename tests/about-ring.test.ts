/**
 * Regression locks for the «vòng lọ đứng yên» report.
 *
 * The about card's halo ring rendered as two static arcs because the one node
 * carried *both* the layout translation (`-translate-x-1/2 -translate-y-1/2`,
 * compiled by Tailwind v4 to the `translate` property) *and* the rotation
 * (`animation: lc-ring-rotate`, keyframes on `transform`). These tests make
 * that class of mistake unrepresentable:
 *
 *   1. the node animating `transform` never also carries a `translate`-family
 *      utility — layout and animation live on different elements;
 *   2. `.glow-ring` pins `transform-origin: 50% 50%` — a rotation without a
 *      settled origin is one engine away from orbiting the parent centre;
 *   3. both reduced-motion lists cover every animated about-card class, so a
 *      player who asked for less motion never sees one of them move;
 *   4. the animations file has no duplicate `@keyframes` names (a duplicate
 *      silently redefines the earlier one — the project counts 31).
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const about = readFileSync("src/components/menu/AboutModal.tsx", "utf8");
const css = readFileSync("src/index.css", "utf8");
const keyframes = readFileSync("src/styles/animations.css", "utf8");

/** The JSX element whose className contains `needle` — comments are ignored. */
function tagWith(needle: string): string {
  const match = about.match(new RegExp(`<[a-zA-Z][^>]*className=[^>]*${needle}[^>]*>`));
  expect(match, `${needle} element not found in AboutModal.tsx`).not.toBeNull();
  return match![0];
}

describe("the ring around the jar", () => {
  it("never shares a node with a layout translate utility", () => {
    for (const tag of ["glow-ring", "about-halo"]) {
      const el = tagWith(tag);
      expect(el, `${tag} tag`).not.toMatch(/-translate-(x|y)|translate-x-|translate-y-/);
      expect(el, `${tag} tag`).not.toMatch(/\bleft-1\/2|\btop-1\/2/);
    }
  });

  it("fills its wrapper with inset-0, so its box and the wrapper's box agree", () => {
    expect(tagWith("glow-ring")).toMatch(/\binset-0\b/);
  });

  it("pins transform-origin so the rotation is about its own centre", () => {
    const ring = css.match(/\.glow-ring\s*\{[^}]+\}/);
    expect(ring, ".glow-ring rule missing").not.toBeNull();
    expect(ring![0]).toContain("transform-origin: 50% 50%");
    expect(ring![0]).toMatch(/animation:[^;]*lc-ring-rotate/);
  });

  it("animates only transform, 0° → 360°", () => {
    const kf = keyframes.match(/@keyframes lc-ring-rotate\s*\{[\s\S]*?\}\s*\n\}/);
    expect(kf, "lc-ring-rotate keyframes missing").not.toBeNull();
    expect(kf![0]).toContain("rotate(0deg)");
    expect(kf![0]).toContain("rotate(360deg)");
    expect(kf![0]).not.toMatch(/translate|left|top/);
  });
});

describe("reduced motion covers every about-card animation", () => {
  /* Both lists (OS media query and the in-game [data-reduced-motion] switch)
     must name every class that moves — that is the whole point of two lists:
     the OS says what the person needs, the switch is what they chose. */
  const moving = [".glow-ring", ".jar-glow", ".about-card", ".about-card::after", ".about-halo", ".about-name", ".about-chip"];
  const mediaList = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/);
  const dataList = css.match(/\[data-reduced-motion="true"\]\s*\.aurora-bg[\s\S]*?\n\}/);

  it("the media query disables all of them", () => {
    expect(mediaList, "prefers-reduced-motion block missing").not.toBeNull();
    for (const cls of moving) expect(mediaList![0]).toContain(cls);
  });

  it("the in-game switch disables all of them", () => {
    expect(dataList, "data-reduced-motion block missing").not.toBeNull();
    for (const cls of moving) expect(dataList![0]).toContain(cls);
  });
});

describe("the animations file stays auditable", () => {
  it("has 31 keyframes and no duplicate names", () => {
    const names = [...keyframes.matchAll(/^@keyframes ([a-z0-9-]+)/gm)].map((m) => m[1]);
    expect(names).toHaveLength(31);
    expect(new Set(names).size).toBe(names.length);
  });
});
