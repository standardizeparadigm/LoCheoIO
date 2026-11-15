/**
 * Vietnamese tone marks must survive every box the layout puts them in.
 *
 * THE TWO BUGS, ELEVEN ROUNDS APART
 * ---------------------------------
 * Round 2: «CHÉO» read as «CHEO» because `.text-shimmer` painted the wordmark
 * through a glyph-outline mask, and `É` is `E` + a combining acute — the mask took
 * the base letter and dropped the mark.
 *
 * Round 11: «MUỐI DƯA CỔ ĐIỂN» read as «MUỐI DƯA CỔ ĐIÊN» in the mode chip,
 * because round 10's fix added `truncate` to the chip's name span — and
 * `truncate` is `overflow: hidden`, which clips *vertically* at the line box. A
 * stacked mark (`Ố` = O + circumflex + acute) puts ~0.35em of ink above the cap
 * height, so a tight line box shaves exactly the tips.
 *
 * Both are the same shape: a technique that is correct for Latin-1 text applied
 * to a script with ink outside the conventional box. Neither was caught by a
 * component test, because both are properties of *CSS*.
 *
 * WHAT THIS FILE ENFORCES
 * -----------------------
 *   1. `.clip-safe` exists and expands the clip rectangle vertically;
 *   2. no component clips Vietnamese text with a bare `truncate` any more;
 *   3. the chip renders a string the planner already cut, with a 1.5em line box;
 *   4. the line boxes that carry display text are tall enough for stacked marks.
 *
 * It reads files rather than rendering, because the repo has no browser: the
 * failure being prevented is visible in a screenshot and invisible in jsdom.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const CSS = readFileSync("src/index.css", "utf8");

/** The file without comments — the comments quote the bugs on purpose. */
function source(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");
}

describe(".clip-safe", () => {
  it("is defined with the padding trick", () => {
    const rule = CSS.match(/\.clip-safe\s*\{([\s\S]*?)\}/);
    expect(rule, ".clip-safe is missing").not.toBeNull();
    const body = rule![1];
    expect(body).toMatch(/overflow:\s*hidden/);
    expect(body).toMatch(/text-overflow:\s*ellipsis/);
    expect(body).toMatch(/white-space:\s*nowrap/);
    // The two lines that make it safe: room for the ink, no effect on flow.
    expect(body).toMatch(/padding-block:\s*0\.\d+em/);
    expect(body).toMatch(/margin-block:\s*-0\.\d+em/);
  });

  it("uses the same amount of padding and margin, so nothing moves", () => {
    const body = CSS.match(/\.clip-safe\s*\{([\s\S]*?)\}/)![1];
    const pad = body.match(/padding-block:\s*([\d.]+)em/)![1];
    const margin = body.match(/margin-block:\s*-([\d.]+)em/)![1];
    expect(margin).toBe(pad);
  });

  it("pads at least a quarter of an em, which is what a stacked mark needs", () => {
    const body = CSS.match(/\.clip-safe\s*\{([\s\S]*?)\}/)![1];
    const pad = Number(body.match(/padding-block:\s*([\d.]+)em/)![1]);
    expect(pad).toBeGreaterThanOrEqual(0.2);
  });
});

describe("no component clips Vietnamese text with a bare truncate", () => {
  const FILES = [
    "src/components/menu/MenuItemButton.tsx",
    "src/components/menu/panel/PanelChallenge.tsx",
    "src/components/ui/scoreboard.tsx",
    "src/components/settings/PresetsSection.tsx",
    "src/components/AchievementsPanel.tsx",
  ];

  it.each(FILES)("%s uses clip-safe", (file) => {
    const body = source(file);
    expect(body, `${file} still uses truncate`).not.toContain("truncate");
    expect(body, `${file} does not use clip-safe`).toContain("clip-safe");
  });

  it("leaves no `truncate` in the tree at all", async () => {
    const { readdirSync, statSync } = await import("node:fs");
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(dir)) {
        const rel = `${dir}/${entry}`;
        if (statSync(rel).isDirectory()) walk(rel, out);
        else if (entry.endsWith(".tsx")) out.push(rel);
      }
      return out;
    };
    const offenders = walk("src").filter((f) => source(f).includes("truncate"));
    expect(offenders).toEqual([]);
  });
});

describe("the chip never clips", () => {
  const chip = source("src/components/menu/ModeChip.tsx");

  it("paints the planner's string", () => {
    expect(chip).toContain("{plan.text}");
  });

  it("keeps the full name for assistive tech", () => {
    // The visible text is shortened; the accessible name must not be, or a
    // screen-reader user would hear the ellipsis as part of the mode name.
    expect(chip).toMatch(/aria-label=\{`\$\{label\}: \$\{name\}`\}/);
  });

  it("has no overflow in its subtree", () => {
    expect(chip).not.toContain("overflow-hidden");
    expect(chip).not.toContain("truncate");
  });

  it("declares the planner's line box", () => {
    expect(chip).toContain("lineHeight: plan.lineHeight");
  });
});

describe("display text has line boxes tall enough for stacked marks", () => {
  it("the menu row label is 1.35, not 1.2", () => {
    const rule = CSS.match(/\.menu-row-label,\s*\.menu-row-hint,\s*\.panel-head\s*\{([\s\S]*?)\}/);
    expect(rule, "the shared row line-height rule is missing").not.toBeNull();
    const value = Number(rule![1].match(/line-height:\s*([\d.]+)/)![1]);
    expect(value).toBeGreaterThanOrEqual(1.3);
  });

  it("the wordmark keeps its own documented ratio", () => {
    // `leading-[0.9]` is deliberate (glyph box, not line box) and the wordmark is
    // never clipped — `tests/wordmark-diacritics.test.ts` owns that invariant.
    const wordmark = readFileSync("src/components/menu/wordmark/Wordmark.tsx", "utf8");
    expect(wordmark).toContain("leading-[0.9]");
  });
});
