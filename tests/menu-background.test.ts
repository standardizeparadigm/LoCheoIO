import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  MENU_BACKGROUND_BUDGET,
  MENU_BACKGROUND_LAYERS,
} from "../src/components/menu/background/layers";

/**
 * Locks the v1.1.7 background fix.
 *
 * The bug was not a typo — it was four individually reasonable layers that
 * compounded into a grey smear. These assertions encode the rules learned
 * from it (docs/design/menu-scene.md § Độ tương phản) so a future layer
 * cannot quietly re-introduce the fog.
 */
const root = resolve(__dirname, "..");
/**
 * Every stylesheet the app loads, comments stripped.
 *
 * v1.1.8 moved 28 `@keyframes` out of `index.css` into `styles/animations.css`.
 * Reading only `index.css` would have made this file pass on a stylesheet that
 * no longer contains the rules it thinks it is checking — a test that reads the
 * wrong file is worse than no test, because it reports green.
 *
 * The list is explicit rather than a glob: a new stylesheet should require
 * adding a line here, which is the moment someone reads this comment.
 */
const css = [
  "src/index.css",
  "src/styles/fonts.css",
  "src/styles/wordmark.css",
  "src/styles/animations.css",
]
  .map((f) => readFileSync(resolve(root, f), "utf8"))
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "");

/** Grab a CSS rule body by selector, e.g. rule(".nebula-a") -> "…{…}". */
function rule(selector: string): string {
  // Match the selector then its opening brace, so both single-selector rules
  // (".app-vignette {") and grouped ones (".nebula-a,\n.nebula-b {") work.
  const i = css.indexOf(selector);
  expect(i, `${selector} must exist in index.css`).toBeGreaterThan(-1);
  const open = css.indexOf("{", i);
  const close = css.indexOf("}", open);
  return css.slice(open, close);
}

describe("menu background — layer list", () => {
  it("stays within the render budget", () => {
    expect(MENU_BACKGROUND_LAYERS.length).toBeLessThanOrEqual(MENU_BACKGROUND_BUDGET);
  });

  it("has unique ids (they double as React keys)", () => {
    const ids = MENU_BACKGROUND_LAYERS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("paints the floor before the vignette so the frame sits on top", () => {
    const order = MENU_BACKGROUND_LAYERS.map((l) => l.id);
    expect(order.indexOf("tile-floor")).toBeLessThan(order.indexOf("vignette"));
    expect(order[order.length - 1]).toBe("vignette");
  });

  it("never forces inset-0 onto the nebulae", () => {
    // inset-0 would stretch the 46vw blob across the viewport — the bug itself.
    for (const nebula of ["nebula-a", "nebula-b"]) {
      const layer = MENU_BACKGROUND_LAYERS.find((l) => l.id === nebula)!;
      expect(layer.layout ?? "").not.toContain("inset-0");
    }
  });
});

describe("menu background — contrast rules (v1.1.7)", () => {
  it("nebula blur stays at or below the 24px ceiling", () => {
    const body = rule(".nebula-a,");
    const px = Number(/blur\((\d+)px\)/.exec(body)?.[1]);
    expect(px).toBeGreaterThan(0);
    expect(px).toBeLessThanOrEqual(24);
  });

  it("nebula opacity peaks stay below 0.85", () => {
    for (const key of ["lc-nebula-a", "lc-nebula-b"]) {
      const start = css.indexOf(`@keyframes ${key}`);
      const body = css.slice(start, css.indexOf("}", css.indexOf("100%", start)));
      const opacities = [...body.matchAll(/opacity: ([\d.]+)/g)].map((m) => Number(m[1]));
      expect(opacities.length).toBeGreaterThan(0);
      for (const o of opacities) expect(o).toBeLessThanOrEqual(0.85);
    }
  });

  it("the menu vignette is corner-weighted, not a full-screen darkener", () => {
    const body = rule(".menu-vignette {");
    // Two radials anchored at corners, and nothing near full opacity.
    expect((body.match(/radial-gradient/g) || []).length).toBe(2);
    for (const m of body.matchAll(/rgba\(6, 26, 26, ([\d.]+)\)/g)) {
      expect(Number(m[1])).toBeLessThan(0.7);
    }
  });

  it("the app CRT frame is softer than the 1.1.6 140px @ 0.9", () => {
    const body = rule(".app-vignette {");
    const px = Number(/(\d+)px/.exec(body)?.[1]);
    const alpha = Number(/rgba\(6, 26, 26, ([\d.]+)\)/.exec(body)?.[1]);
    expect(px).toBeLessThan(140);
    expect(alpha).toBeLessThan(0.9);
  });

  it("StartScreen no longer carries the scene inline", () => {
    const screen = readFileSync(resolve(root, "src/components/StartScreen.tsx"), "utf8");
    expect(screen).toContain("<MenuBackground />");
    expect(screen).not.toContain('className="nebula-a"');
    expect(screen).not.toContain("rgba(6,26,26,0.88)");
  });
});
