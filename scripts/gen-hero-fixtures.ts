/**
 * Write the hero-ladder snapshot corpus.
 *
 * The second corpus, and it answers a different question from
 * `adaptive-matrix/`: not "what does this window get" but "what does the hero do
 * with a band of exactly N pixels at width W".
 *
 * That is the axis the v1.1.8 screenshots lived on. The report's two windows
 * were 1920×1080 and 1920×820 — the same width, 260px of band apart — and the
 * second one was drawn with a layout that did not fit. The plan is what turns a
 * window into a band, and `heroLayout()` is what turns a band into a layout, so
 * pinning every (width, band) pair pins the ladder itself.
 *
 * 30 widths × 15 bands = 450 files.
 *
 * Usage:
 *   npx vite-node scripts/gen-hero-fixtures.ts           # write
 *   npx vite-node scripts/gen-hero-fixtures.ts --check   # report only
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { heroContentHeight, heroLayout, heroRowFits } from "../src/components/menu/adaptive/hero";
import { lockupAtBand } from "../src/components/menu/wordmark/scale";

export const CORPUS = join("tests", "fixtures", "hero-bands");

/** Widths around every width decision the ladder makes (`1024` is the row floor). */
export const WIDTHS = [320, 360, 375, 414, 480, 520, 560, 640, 720, 768, 820, 900, 960, 1000, 1023, 1024, 1100, 1152, 1200, 1280, 1366, 1440, 1536, 1600, 1728, 1920, 2048, 2560, 3200, 3840];

/**
 * Bands: every rung of the ladder, plus the two screenshot bands (452, 562).
 *
 * The axis starts at 150, not at 1: `TIGHT_SCENE_HEIGHT` is 140 and the
 * wordmark-only arrangement needs 150, so a band below 150 is a band no plan can
 * produce (`check-adaptive` shows the real floor at 174 on a 320×480 window).
 * Sampling it would assert a property of an impossible input.
 */
export const BANDS = [150, 180, 210, 232, 240, 260, 280, 300, 320, 360, 400, 452, 500, 562, 620, 700, 900];

export function matrix(): Array<[number, number]> {
  return WIDTHS.flatMap((w) => BANDS.map((b) => [w, b] as [number, number]));
}

export function snapshot(width: number, scene: number) {
  const layout = heroLayout({ scene, width, minimal: false });
  const lockup = lockupAtBand(width, scene);
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
    lockup: lockup.lo,
    cheo: lockup.cheo,
    limitedBy: lockup.limitedBy,
  };
}

export function fileName(width: number, scene: number): string {
  return `w${width}-s${scene}.json`;
}

export function serialise(value: unknown): string {
  return `${JSON.stringify(value, null, 1)}\n`;
}

const check = process.argv.includes("--check");

if (!check) {
  if (existsSync(CORPUS)) {
    for (const entry of readdirSync(CORPUS)) rmSync(join(CORPUS, entry), { force: true });
  }
  mkdirSync(CORPUS, { recursive: true });
}

let written = 0;
const drifted: string[] = [];

for (const [w, b] of matrix()) {
  const file = join(CORPUS, fileName(w, b));
  const body = serialise(snapshot(w, b));
  if (check) {
    if (!existsSync(file)) {
      drifted.push(`${fileName(w, b)}: missing`);
      continue;
    }
    if (readFileSync(file, "utf8") !== body) drifted.push(`${fileName(w, b)}: stale`);
    continue;
  }
  writeFileSync(file, body);
  written += 1;
}

if (check) {
  if (drifted.length) {
    for (const d of drifted.slice(0, 20)) console.error(`✗ ${d}`);
    console.error(`\n${drifted.length} fixture(s) out of date — run npx vite-node scripts/gen-hero-fixtures.ts`);
    process.exit(1);
  }
  console.log(`hero corpus ok — ${matrix().length} (width, band) pairs`);
} else {
  console.log(`wrote ${written} fixture(s) to ${CORPUS}`);
}
