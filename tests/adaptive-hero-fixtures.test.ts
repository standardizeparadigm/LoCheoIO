/**
 * The hero-ladder snapshot corpus.
 *
 * `tests/fixtures/hero-bands/` holds one file per (width, band) pair — 570 of
 * them — recording which arrangement `heroLayout()` chose and how much height it
 * says that arrangement needs.
 *
 * WHY A SECOND CORPUS
 * -------------------
 * `adaptive-fixtures.test.ts` covers windows. This covers *bands*, which is the
 * axis the v1.1.8 screenshots lived on: 1920×1080 and 1920×820 are the same
 * width and 260px of band apart, and the second was drawn with a row that did not
 * fit. A window corpus can only sample the bands those windows happen to
 * produce; this one walks the ladder directly, including the rungs no real
 * viewport lands on exactly.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { heroContentHeight, heroLayout, heroRowFits } from "../src/components/menu/adaptive/hero";
import { lockupAtBand } from "../src/components/menu/wordmark/scale";

const DIR = join(__dirname, "fixtures", "hero-bands");
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();

function fromName(file: string): [number, number] {
  const m = /^w(\d+)-s(\d+)\.json$/.exec(file);
  if (!m) throw new Error(`unexpected fixture name: ${file}`);
  return [Number(m[1]), Number(m[2])];
}

function snapshot(width: number, scene: number) {
  const layout = heroLayout({ scene, width, minimal: false });
  return {
    width,
    scene,
    sideBySide: layout.sideBySide,
    halo: layout.halo,
    badgeRow: layout.badgeRow,
    mascot: layout.mascot,
    liveBadge: layout.liveBadge,
    needs: heroContentHeight(layout),
    rowFits: heroRowFits(layout, width),
    lockup: lockupAtBand(width, scene).lo,
    cheo: lockupAtBand(width, scene).cheo,
    limitedBy: lockupAtBand(width, scene).limitedBy,
  };
}

describe("the hero ladder", () => {
  it("has a corpus with real coverage", () => {
    expect(FILES.length).toBeGreaterThanOrEqual(500);
  });

  it("names the pair it describes", () => {
    for (const file of FILES) {
      const [w, s] = fromName(file);
      const body = JSON.parse(readFileSync(join(DIR, file), "utf8")) as { width: number; scene: number };
      expect([body.width, body.scene], file).toEqual([w, s]);
    }
  });

  it("matches the current decisions for every pair", () => {
    const drifted: string[] = [];
    for (const file of FILES) {
      const [w, s] = fromName(file);
      const expected = JSON.parse(readFileSync(join(DIR, file), "utf8"));
      const actual = JSON.parse(JSON.stringify(snapshot(w, s)));
      if (JSON.stringify(expected) !== JSON.stringify(actual)) drifted.push(file);
    }
    expect(
      drifted.slice(0, 10),
      `${drifted.length} fixture(s) no longer match — regenerate with ` +
        "`npx vite-node scripts/gen-hero-fixtures.ts` if the change is intended",
    ).toEqual([]);
  });

  it("never records a layout that needs more band than it was given", () => {
    for (const file of FILES) {
      const s = JSON.parse(readFileSync(join(DIR, file), "utf8")) as ReturnType<typeof snapshot>;
      expect(s.needs, file).toBeLessThanOrEqual(s.scene);
    }
  });

  it("never records a row that does not fit across", () => {
    for (const file of FILES) {
      const s = JSON.parse(readFileSync(join(DIR, file), "utf8")) as ReturnType<typeof snapshot>;
      if (s.sideBySide) expect(s.rowFits, file).toBe(true);
    }
  });

  it("turns features off in one direction as the band shrinks", () => {
    /*
     * The ladder's contract: walking *down* the band axis, a feature that has
     * turned off never turns back on. This is the property the four-threshold
     * version violated — `badgeRow` fired at 232 for a row and at 232 for a
     * stack, which needed 370.
     */
    const byWidth = new Map<number, Array<{ scene: number; flags: string[] }>>();
    for (const file of FILES) {
      const s = JSON.parse(readFileSync(join(DIR, file), "utf8")) as ReturnType<typeof snapshot>;
      const flags = [
        s.mascot ? "mascot" : "",
        s.badgeRow ? "badge" : "",
        s.liveBadge ? "live" : "",
        s.halo ? "halo" : "",
        s.sideBySide ? "row" : "stack",
      ];
      const list = byWidth.get(s.width) ?? [];
      list.push({ scene: s.scene, flags });
      byWidth.set(s.width, list);
    }
    for (const [width, rows] of byWidth) {
      rows.sort((a, b) => a.scene - b.scene);
      let previousCount = -1;
      for (const row of rows) {
        const count = row.flags.filter(Boolean).length;
        // Allow the row/stack switch to trade one flag for another, so compare
        // only the features that are pure cost, plus "is it a row at all".
        const cost = Number(row.flags.includes("mascot")) + Number(row.flags.includes("badge")) + Number(row.flags.includes("live")) + Number(row.flags.includes("halo"));
        if (previousCount >= 0) {
          expect(cost, `${width}px at ${row.scene}px band`).toBeGreaterThanOrEqual(previousCount - 1);
        }
        previousCount = cost;
        expect(count).toBeGreaterThan(0);
      }
    }
  });
});
