/**
 * The adaptive snapshot corpus.
 *
 * `tests/fixtures/adaptive-matrix/` holds one JSON file per viewport, each
 * recording what `resolveAdaptive()` decided for that window. This file
 * recomputes every one of them and fails on the first disagreement.
 *
 * WHY THAT IS WORTH 1 110 FILES
 * -----------------------------
 * The alternative — one test function per interesting viewport — tests the
 * windows someone thought of. The corpus tests a grid, and a grid is what
 * catches a boundary that moved: a threshold edited from 840 to 860 changes the
 * density of 120 windows, and each of those windows is a file that stops
 * matching. The failure names the window, so the report is "w1280-h840.json is
 * stale" rather than "a snapshot changed".
 *
 * It also makes the corpus reviewable: `git diff --stat` after a threshold change
 * lists the widths and heights that moved.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveForSize } from "../src/components/menu/adaptive/resolve";
import { LOCKUP_BOX_RATIO } from "../src/components/menu/adaptive/typeScale";
import { usableHeight } from "../src/components/menu/layout";

const DIR = join(__dirname, "fixtures", "adaptive-matrix");
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();

/** `w1280-h720.json` → `[1280, 720]`. */
function fromName(file: string): [number, number] {
  const m = /^w(\d+)-h(\d+)\.json$/.exec(file);
  if (!m) throw new Error(`unexpected fixture name: ${file}`);
  return [Number(m[1]), Number(m[2])];
}

/** The snapshot the current code produces — the same shape the generator writes. */
function snapshot(width: number, height: number) {
  const p = resolveForSize(width, height);
  return {
    viewport: [width, height],
    tier: p.tier,
    density: p.density,
    fit: p.plan.fit,
    hero: p.hero.sideBySide ? "row" : "stack",
    minimal: p.plan.minimal,
    ticker: p.plan.ticker,
    footer: p.plan.footer,
    scene: p.plan.scene,
    reserve: p.plan.reserve,
    panelHeight: p.panelHeight,
    footer: p.plan.footer,
    lockup: p.type.lockupLo,
    cheo: p.type.lockupCheo,
    rowLabel: p.type.rowLabel,
    rowHint: p.type.rowHint,
    modalWidth: p.modal.maxWidth,
    modalHeight: p.modal.maxHeight,
    modalColumns: p.modal.columns,
    itemScale: p.playfield.itemScale,
    playerRadius: p.playfield.playerRadius,
    hudScale: p.playfield.hudScale,
  };
}

describe("the adaptive matrix", () => {
  it("has a real corpus, not a token sample", () => {
    expect(FILES.length).toBeGreaterThanOrEqual(1_000);
  });

  it("names the viewport it describes", () => {
    for (const file of FILES) {
      const [w, h] = fromName(file);
      const body = JSON.parse(readFileSync(join(DIR, file), "utf8")) as { viewport: number[] };
      expect(body.viewport, file).toEqual([w, h]);
    }
  });

  it("matches what the current code decides, for every file", () => {
    const drifted: string[] = [];
    for (const file of FILES) {
      const [w, h] = fromName(file);
      const expected = JSON.parse(readFileSync(join(DIR, file), "utf8"));
      const actual = JSON.parse(JSON.stringify(snapshot(w, h)));
      if (JSON.stringify(expected) !== JSON.stringify(actual)) drifted.push(file);
    }
    expect(
      drifted.slice(0, 10),
      `${drifted.length} fixture(s) no longer match — either regenerate the corpus ` +
        "(`npx vite-node scripts/gen-adaptive-fixtures.ts`) because the change is " +
        "intended, or fix the behaviour change",
    ).toEqual([]);
  });

  it("records snapshots whose own numbers are coherent", () => {
    for (const file of FILES) {
      const s = JSON.parse(readFileSync(join(DIR, file), "utf8")) as ReturnType<typeof snapshot>;
      const [w, h] = s.viewport as [number, number];
      // The invariant the whole layout rests on, restated against the snapshot
      // rather than against the code that produced it.
      if (s.fit !== "crop") {
        expect(s.scene + s.reserve, file).toBe(usableHeight({ width: w, height: h }));
      }
      // The wordmark fits the band it was given.
      expect(s.lockup * LOCKUP_BOX_RATIO, file).toBeLessThanOrEqual(s.scene + 0.5);
      // CHÉO is never larger than LỌ.
      expect(s.cheo, file).toBeLessThan(s.lockup);
      /*
       * Panels never overlap the ticker or run off the bottom edge: the painted
       * box plus its 12px margin has to fit the band the reserve bought. This is
       * the assertion that caught the footer bug — the reserve dropped 30px for
       * a footer the panel still drew.
       */
      expect(s.panelHeight + 12, file).toBeLessThanOrEqual(s.reserve);
      // Every dialog fits its window.
      expect(s.modalWidth, file).toBeLessThanOrEqual(w);
      expect(s.modalHeight, file).toBeLessThanOrEqual(h);
      // The jar is never wider than the board.
      expect(s.playerRadius * 2, file).toBeLessThanOrEqual(Math.min(w, h));
    }
  });

  it("covers both axes of the two screenshots in the report", () => {
    // 1920×1080 and 1920×820 differ by 260px of height and nothing else.
    const tall = FILES.includes("w1920-h1080.json");
    const windowed = FILES.includes("w1920-h820.json");
    expect({ tall, windowed }).toEqual({ tall: true, windowed: true });
  });

  it("covers every tier and every density", () => {
    const tiers = new Set<string>();
    const densities = new Set<string>();
    for (const file of FILES) {
      const s = JSON.parse(readFileSync(join(DIR, file), "utf8")) as ReturnType<typeof snapshot>;
      tiers.add(s.tier);
      densities.add(s.density);
    }
    expect([...tiers].sort()).toEqual(["lg", "md", "sm", "xl", "xs", "xxl"]);
    expect(densities.has("spacious")).toBe(true);
    expect(densities.has("comfortable")).toBe(true);
    expect(densities.has("tight")).toBe(true);
  });
});
