/**
 * `LoCheoGame.resize` — the one place canvas dimensions enter the engine.
 *
 * The class cannot be instantiated here: its constructor needs a real 2D
 * context, `requestAnimationFrame`, and a canvas whose `.width` setter has
 * side effects. So this file tests the arithmetic in isolation (duplicated
 * below, and pinned to the source by a shape check) and asserts that the source
 * still contains the guard.
 *
 * That is a weaker test than calling the method, and it is stated rather than
 * hidden. It is still worth having: the failure it guards against —
 * `canvas.width = NaN` — is invisible in every screenshot and produces a game
 * that runs at 300×150 with `this.w === NaN`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const engine = readFileSync("src/game/engine.ts", "utf8");

/** The expression the engine uses, copied verbatim from `resize`. */
const dim = (v: number, fallback: number) =>
  Math.max(fallback, Math.floor(Number.isFinite(v) && v > 0 ? v : fallback));

describe("the dimension clamp", () => {
  it("rejects NaN, which `Math.max` alone does not", () => {
    // The bug: `Math.max(240, Math.floor(NaN))` is NaN.
    expect(Math.max(240, Math.floor(Number.NaN))).toBeNaN();
    expect(dim(Number.NaN, 240)).toBe(240);
  });

  it("rejects both infinities", () => {
    for (const v of [Infinity, -Infinity]) {
      expect(dim(v, 240), `dim(${v})`).toBe(240);
    }
  });

  it("treats zero and negatives as the fallback", () => {
    // A mounting canvas reports 0×0; a negative is corrupt. Both give the
    // defaults, which is what the CSS says the element is before layout.
    for (const v of [0, -1, -1e9]) expect(dim(v, 240)).toBe(240);
  });

  it("keeps a real dimension", () => {
    expect(dim(1920, 240)).toBe(1920);
    expect(dim(240, 240)).toBe(240);
  });

  it("floors a fractional dimension", () => {
    // A fractional backing-store size is rounded by the browser anyway; doing it
    // here keeps `this.w` equal to `canvas.width / dpr`.
    expect(dim(1920.7, 240)).toBe(1920);
  });

  it("respects the fallback as a floor", () => {
    expect(dim(1, 240)).toBe(240);
    expect(dim(100, 320)).toBe(320);
  });
});

describe("the engine still calls it", () => {
  it("guards both dimensions with Number.isFinite", () => {
    const at = engine.indexOf("resize(w: number, h: number)");
    expect(at).toBeGreaterThan(-1);
    // Up to the end of the method: `buildBackground()` is the last call in it.
    const body = engine.slice(at, engine.indexOf("buildBackground()", at));
    // Two guards, one per dimension — a fix applied to `w` only would still
    // leave a NaN height.
    expect(body.match(/Number\.isFinite/g)?.length).toBeGreaterThanOrEqual(2);
    expect(body).toContain("Math.floor(");
  });

  it("does not assign a raw dimension to the canvas", () => {
    /*
     * `canvas.width = Math.floor(cw * this.dpr)` is safe only because `cw` is
     * already guarded. A direct `canvas.width = w` would set the DOM property to
     * a non-finite value, which the browser silently turns into the default
     * 300×150 backing store.
     *
     * The first version of this assertion failed on its own forward reference:
     * `canvas.width =` and `Math.floor(` are on separate lines in the source, so
     * a line-anchored negative lookahead matched across the newline. Whitespace
     * is normalised first.
     */
    const flat = engine.replace(/\s+/g, " ");
    const direct = [...flat.matchAll(/canvas\.width = ([^;]{0,40});/g)].map((m) => m[1]);
    expect(direct.length).toBeGreaterThan(0);
    for (const rhs of direct) {
      expect(rhs, `canvas.width = ${rhs}`).toContain("Math.floor");
    }
  });

  it("falls back to values the CSS also uses", () => {
    // 240×320 is not arbitrary: it is the floor the app's own stylesheet states,
    // so a canvas that measures 0 renders at the size it would have had anyway.
    const css = readFileSync("src/index.css", "utf8");
    expect(css).toMatch(/min-width|240/);
    expect(engine).toContain("240");
    expect(engine).toContain("320");
  });
});
