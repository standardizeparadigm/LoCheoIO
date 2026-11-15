/**
 * The wordmark must keep its diacritics.
 *
 * THE BUG (report screenshot, v1.1.8 QA round 2)
 * ----------------------------------------------
 *     LỌ
 *     CHEO        ← should read CHÉO
 *
 * `.text-shimmer` painted its gold gradient *into* the glyphs with
 * `background-clip: text` + `color: transparent`. `background-clip: text`
 * builds its mask from the painted glyph outline. For a Vietnamese composed
 * glyph (`É` = E + U+0301) the mark is not always carried into that mask, so
 * the accent disappeared while the base letter remained. And because the only
 * opaque copy of the word was the clipped layer, the failure was silent:
 * nothing fell back to plain gold text.
 *
 * WHAT IS ASSERTED HERE
 * ---------------------
 *   1. the wordmark strings in the locales really do carry their diacritics
 *      (so the bug can never be "fixed" by deleting the accent);
 *   2. the stylesheet no longer makes the *only* opaque text transparent —
 *      `.text-shimmer` sets a real colour;
 *   3. no CSS rule leaves `background-clip: text` as the sole paint of the
 *      wordmark;
 *   4. the component still renders the accented spelling, not a stripped one.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import viLocale from "../src/i18n/locales/vi";
import enLocale from "../src/i18n/locales/en";

// Round 4 split the wordmark rules into its own stylesheet. Concatenate
// both so the assertions below stay about the *project*, not about which
// file somebody happened to put a rule in.
const CSS =
  readFileSync("src/index.css", "utf8") +
  "\n" +
  readFileSync("src/styles/wordmark.css", "utf8");
const START = readFileSync("src/components/StartScreen.tsx", "utf8");

describe("the accent is real text, not decoration", () => {
  it("the Vietnamese wordmark in the component is CHÉO with an acute", () => {
    expect(START).toContain("CHÉO");
    // 'CHÉO'.normalize('NFD') ends in a combining acute on the E.
    expect("CHÉO".normalize("NFD")).toContain("E\u0301");
  });

  it("the wordmark is built from the same letters in every locale's page", () => {
    // The wordmark itself is a proper noun and is not translated, but the
    // app.wordmark key is what aria-label reads — it must be accented too.
    expect(viLocale["app.wordmark"]).toContain("LỌ");
    expect(viLocale["app.wordmark"]).toContain("CHÉO");
    expect(enLocale["app.wordmark"]).toContain("CHÉO");
  });

  it("both glyphs keep their own diacritic (Ọ has a dot below, É an acute)", () => {
    expect("LỌ".normalize("NFD")).toContain("O\u0323");
    expect("CHÉO".normalize("NFD")).toContain("E\u0301");
  });
});

describe("the stylesheet cannot clip the accent away", () => {
  it(".text-shimmer sets a solid colour instead of transparent", () => {
    const start = CSS.indexOf(".text-shimmer {");
    const block = CSS.slice(start, CSS.indexOf("}", start));
    expect(block).toMatch(/color:\s*#f5a81c/);
    expect(block).not.toMatch(/color:\s*transparent/);
  });

  it(".text-shimmer keeps a text-shadow so the glyph reads without any layer", () => {
    const start = CSS.indexOf(".text-shimmer {");
    const block = CSS.slice(start, CSS.indexOf("}", start));
    expect(block).toContain("text-shadow");
  });

  it("no rule paints the shimmer by clipping text and hiding the colour", () => {
    // The old rule was exactly this pair; it must not come back anywhere.
    expect(CSS).not.toMatch(/\.text-shimmer[^{]*\{[^}]*background-clip:\s*text[^}]*color:\s*transparent/);
    expect(CSS).not.toMatch(/\.text-shimmer[^{]*\{[^}]*color:\s*transparent/);
  });

  it("the word still moves, through its shadow rather than a plate", () => {
    // Round 3 removed the gold `::before` band (the report's «phần vuông
    // vuông xung quanh chữ chéo»), which also removed `lc-shimmer-sweep`. The
    // motion is not lost: `lc-gold-breathe` animates the text-shadow, and a
    // shadow has no edges to look like a box.
    expect(CSS).toContain("lc-gold-breathe");
    expect(CSS).toContain("animation: lc-gold-breathe");
  });

  it("nothing is painted behind the word any more", () => {
    // A pseudo-element behind a word is a box. There is no shape a gradient
    // can take that follows glyph outlines, so the fix is absence, not
    // styling: no ::before, and no keyframes left over for it.
    expect(CSS).not.toContain(".text-shimmer::before");
    expect(CSS).not.toContain("lc-shimmer-sweep");
  });

  it("CHÉO is not larger than LỌ — now owned by the wordmark module", () => {
    // Round 4 moved the two sizes out of StartScreen into `menu/wordmark/`,
    // where `tests/wordmark-scale.test.ts` asserts the ratio at every width
    // from 320 to 3840px. This test only has to prove the screen did not keep
    // a second, competing set of numbers.
    const start = readFileSync("src/components/StartScreen.tsx", "utf8");
    expect(start).toContain("<Wordmark");
    expect(start).not.toMatch(/text-\[clamp\(/);
  });
});
