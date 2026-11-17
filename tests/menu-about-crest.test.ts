/**
 * The author card's crest — the ring that did not move.
 *
 * THE REPORT
 * ----------
 * *"cái lọ gốm vòng chuyển động xung quanh không chuyển động"* — the ring around
 * the ceramic jar in «GIỚI THIỆU TÁC GIẢ» did not rotate.
 *
 * WHAT WAS ACTUALLY WRONG
 * -----------------------
 * The v1.1.6 ring was one `<span>` with a conic gradient, masked to a 7px band,
 * rotated by one `transform` animation. Three properties of that construction
 * were load-bearing and none of them were asserted anywhere:
 *
 *  1. the *only* motion cue was a CSS `transform` on an element whose centring
 *     came from `translate` utilities — a second rule touching `transform`
 *     cancels the rotation and nobody notices;
 *  2. the rest state was three sparse translucent arcs, which reads as a
 *     half-drawn circle rather than as an ornament — so "motion off" (OS
 *     reduce-motion, or the player's switch, which the app seeds from the OS on
 *     first run) looked indistinguishable from "broken";
 *  3. one ring at one speed is a spinner, not a halo.
 *
 * The replacement is an SVG crest with three orbits. These tests pin the three
 * properties that make it immune to the old failure, in the stylesheet and in
 * the component, because both halves can regress independently:
 *
 *   · the rotation is on an SVG group with an explicit `transform-origin`,
 *   · the orbits run at three different speeds and two directions,
 *   · every animation the crest uses is a *defined* keyframe name,
 *   · and the reduced-motion path is covered by both hooks.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { CREST_CENTRE, CREST_ORBITS, CREST_VIEW } from "../src/components/menu/about/AboutCrest";

const root = resolve(__dirname, "..");
const css = readFileSync(resolve(root, "src/index.css"), "utf8");
const keyframes = readFileSync(resolve(root, "src/styles/animations.css"), "utf8");
const crestSource = readFileSync(
  resolve(root, "src/components/menu/about/AboutCrest.tsx"),
  "utf8",
);
const modalSource = readFileSync(resolve(root, "src/components/menu/AboutModal.tsx"), "utf8");

/** The body of the first rule whose selector starts with `selector`. */
function rule(selector: string): string {
  const i = css.indexOf(`${selector} {`);
  expect(i, `${selector} must exist in index.css`).toBeGreaterThan(-1);
  const open = css.indexOf("{", i);
  return css.slice(open, css.indexOf("}", open));
}

/** Every `animation:` / `animation-name:` value used by a selector body. */
function animationNames(body: string): string[] {
  return [...body.matchAll(/animation(?:-name)?:\s*([^;]+);/g)].flatMap((m) =>
    m[1]
      .split(",")
      .map((part) => part.trim().split(/\s+/).find((token) => token.startsWith("lc-")))
      .filter((v): v is string => Boolean(v)),
  );
}

const ORBITS = ["about-crest-orbit-main", "about-crest-orbit-inner", "about-crest-orbit-dotted"] as const;

describe("about crest — geometry", () => {
  it("has a square view box with an integer centre", () => {
    expect(CREST_VIEW).toBeGreaterThan(100);
    expect(CREST_CENTRE).toBe(CREST_VIEW / 2);
    expect(Number.isInteger(CREST_CENTRE)).toBe(true);
  });

  it("keeps every orbit inside the box, and strictly ordered", () => {
    const { inner, main, dotted } = CREST_ORBITS;
    expect(inner).toBeLessThan(main);
    expect(main).toBeLessThan(dotted);
    // The outermost stroke is 2.2 units wide, so the circle plus its half-stroke
    // has to fit inside the box or it is clipped at `overflow: hidden` sites.
    expect(dotted + 2).toBeLessThan(CREST_CENTRE);
  });

  it("draws the orbits with dash patterns, so the static state is an ornament", () => {
    // The whole point of the replacement: no bare arcs. Every orbit carries a
    // dash array, which is what makes a motionless crest look deliberate.
    const dashes = crestSource.match(/strokeDasharray=/g) ?? [];
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps the fast comet clear of the gold arc", () => {
    /*
     * The first version drew the comets 10 units inside the gold arc and both
     * started their dash pattern at 0°, so at the bottom of the crest the two
     * strokes ran parallel about 30px apart at render size — two orbits that
     * read as one doubled line. Separation is the fix that costs nothing:
     * sixteen units, plus a per-orbit `stroke-dashoffset` so the leading dashes
     * do not stack on the same radius at rest.
     */
    expect(CREST_ORBITS.main - CREST_ORBITS.inner).toBeGreaterThanOrEqual(14);
  });

  it("phases the orbits apart instead of stacking them at 0°", () => {
    const offsets = [...crestSource.matchAll(/strokeDashoffset=\{([^}]+)\}/g)].map((m) => m[1]);
    expect(offsets.length, "every dashed orbit should declare a phase").toBeGreaterThanOrEqual(4);
    expect(new Set(offsets).size, "two orbits share a phase").toBe(offsets.length);
  });

  it("mixes dash patterns that do not all share one period", () => {
    // Three identical dash arrays would line up into a single pulsing ring.
    const patterns = [...crestSource.matchAll(/orbit\(CREST_ORBITS\.(\w+),\s*([\d.]+)/g)].map(
      (m) => `${m[1]}:${m[2]}`,
    );
    expect(new Set(patterns).size).toBe(patterns.length);
  });
});

describe("about crest — motion", () => {
  it("rotates SVG groups about the view box centre, not the corner", () => {
    /*
     * An SVG `<g>` rotates about the view box origin unless `transform-box` is
     * set. That default is the v1.1.6 bug wearing a different hat: the ring
     * swings out of its box instead of spinning in place.
     */
    for (const selector of ORBITS) {
      const body = rule(`.${selector}`);
      expect(body, selector).toContain("transform-box: view-box");
      expect(body, selector).toContain("transform-origin: 50% 50%");
      expect(animationNames(body), selector).toHaveLength(1);
    }
  });

  it("uses three distinct durations, in two directions", () => {
    /*
     * The durations are written as `calc(14s * var(--adaptive-motion-factor, 1))`
     * since round 17, so the number is the one before the `*` — or, in a rule
     * that has not been graded yet, the one before `linear`.
     */
    const durationOf = (selector: string) => {
      const body = rule(`.${selector}`);
      return (/calc\((\d+(?:\.\d+)?)s \*/.exec(body) ?? /(\d+(?:\.\d+)?)s\s+linear/.exec(body))?.[1];
    };
    const durations = ORBITS.map(durationOf);
    expect(new Set(durations).size).toBe(3);
    const names = ORBITS.map((selector) => animationNames(rule(`.${selector}`))[0]);
    expect(names.filter((n) => n === "lc-halo-cw")).toHaveLength(2);
    expect(names.filter((n) => n === "lc-halo-ccw")).toHaveLength(1);
  });

  it("never references a keyframe that is not defined", () => {
    /*
     * A typo in an animation name is silent: the element simply does not
     * animate, which is precisely the class of bug this file exists to catch.
     */
    const used = new Set<string>();
    for (const selector of [...ORBITS, "about-crest-glow", "about-crest-spark", "about-title-accent"]) {
      for (const name of animationNames(rule(`.${selector}`))) used.add(name);
    }
    expect(used.size).toBeGreaterThanOrEqual(4);
    for (const name of used) {
      expect(keyframes, `@keyframes ${name}`).toContain(`@keyframes ${name} {`);
    }
  });

  it("stops every one of those animations under both reduced-motion hooks", () => {
    const media = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)", css.indexOf("about-crest")));
    for (const selector of [...ORBITS, "about-crest-glow", "about-crest-spark", "about-title-accent"]) {
      // Last member of the list is followed by `{`; the others by `,`.
      expect(media, `media query must name .${selector}`).toMatch(
        new RegExp(`\\.${selector}(,| \\{)`),
      );
      expect(css, `the player's switch must name .${selector}`).toContain(
        `[data-reduced-motion="true"] .${selector}`,
      );
    }
  });

  it("scales its durations by the adaptive motion factor, and never by zero", () => {
    /*
     * The grade reaches the cascade as a multiplier, so a handset slows the same
     * orbits instead of losing them. `calc(14s * 0)` would be a zero-duration
     * *infinite* animation — an engine-specific edge case rather than a stop —
     * so the factor is only ever ≥ 1 and `still` is left to the
     * `animation: none` hooks above.
     */
    for (const selector of ORBITS) {
      const body = rule(`.${selector}`);
      expect(body, selector).toContain("var(--adaptive-motion-factor, 1)");
      expect(body, selector).toMatch(/calc\(\d+(\.\d+)?s \* var\(--adaptive-motion-factor, 1\)\)/);
    }
  });

  it("keeps the old ring class working, because other surfaces still use it", () => {
    // The fix must not be "delete the ring": `.glow-ring` is still a supported
    // class with its own keyframe.
    expect(rule(".glow-ring")).toContain("lc-ring-rotate");
    expect(keyframes).toContain("@keyframes lc-ring-rotate {");
  });
});

describe("about modal — the crest is actually mounted", () => {
  it("renders the crest behind a jar, and both are positioned independently", () => {
    expect(modalSource).toContain("<AboutCrest");
    expect(modalSource).toContain("<JarLogo");
    // The jar must not be a child of the SVG.
    const crestAt = modalSource.indexOf("<AboutCrest");
    const jarAt = modalSource.indexOf("<JarLogo", crestAt);
    expect(jarAt).toBeGreaterThan(-1);
  });

  it("no longer wraps the hero in the panning border of `.about-card`", () => {
    /*
     * `.about-card` animates a 3px border background. Inside a dialog that also
     * has a plaque border it produced a double frame around the crest — the
     * `about-card` class is kept for other surfaces, but this panel must not
     * use it.
     */
    expect(modalSource).not.toContain('className="about-card');
    expect(modalSource).toContain('className="about-hero');
  });

  it("gives every section a heading class and every paragraph the copy colour", () => {
    expect(modalSource).toContain("about-heading");
    expect(modalSource).toContain("about-copy");
  });
});
