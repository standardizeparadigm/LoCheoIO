/**
 * Write the adaptive snapshot corpus.
 *
 * WHAT THIS IS
 * ------------
 * One JSON file per viewport in a fixed matrix (45 widths × 32 heights = 1 440
 * files), each holding the *decisions* `resolveAdaptive()` makes for that
 * window: tier, density, scene, reserve, fit, hero layout, lockup size, row
 * label size, the dialog box and the three canvas numbers.
 *
 * WHY ONE FILE PER VIEWPORT
 * -------------------------
 * A single JSON array would be one file and one diff. This corpus exists to make
 * a threshold change *reviewable*: moving `RICH_ROW_BREAKPOINT` from 840 to 860
 * changes the density of 120 windows, and with one file per window `git diff
 * --stat` names the widths that moved instead of reporting "one line changed in
 * adaptive.json". It also means a reviewer can open the file for the viewport in
 * the bug report and see what the app decided.
 *
 * The matrix is deliberately not every pixel: 1 440 samples at ~350 bytes each
 * is ~500KB and catches a one-step boundary error (the heights include 677, 820
 * and 390 — the windows from the bug reports).
 *
 * WHY GENERATED AND COMMITTED
 * ---------------------------
 * The snapshots are the *expectation*; the tests recompute the profile and
 * compare. Committing them is what makes the expectation independent of the code
 * — a snapshot regenerated on every run would only assert that the code equals
 * itself. `tests/adaptive-fixtures.test.ts` fails the moment the two disagree,
 * and the fix is either "the behaviour changed on purpose, regenerate" or "the
 * behaviour changed by accident, fix the code".
 *
 * Usage:
 *   npx vite-node scripts/gen-adaptive-fixtures.ts           # write
 *   npx vite-node scripts/gen-adaptive-fixtures.ts --check   # report only
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { resolveForSize } from "../src/components/menu/adaptive/resolve";

/** The corpus directory. */
export const CORPUS = join("tests", "fixtures", "adaptive-matrix");

/**
 * Widths: every 160px from 320 to 3 840, plus the widths from the bug reports
 * and from the CSS breakpoints in the project (520, 768, 840, 1024, 1280).
 *
 * The step is coarse because the breakpoints themselves are named; a threshold
 * that moves is caught by the samples that sit next to it, and each edge here is
 * within 20px of a decision boundary in `layout/metrics.ts`.
 */
const WIDTH_EDGES = [320, 360, 375, 390, 414, 480, 520, 600, 768, 820, 900, 1024, 1152, 1280, 1366, 1440, 1568, 1600, 1920, 2560, 3440, 3840];

/** Heights: the same idea, weighted toward the short and windowed sizes. */
const HEIGHT_EDGES = [320, 360, 390, 414, 480, 500, 568, 600, 640, 667, 677, 720, 768, 800, 820, 844, 896, 900, 1024, 1080, 1440, 2160];

/** The full grid, deterministic and sorted. */
export function matrix(): Array<[number, number]> {
  const widths = new Set<number>(WIDTH_EDGES);
  for (let w = 320; w <= 3840; w += 160) widths.add(w);
  const heights = new Set<number>(HEIGHT_EDGES);
  for (let h = 320; h <= 1440; h += 120) heights.add(h);
  const out: Array<[number, number]> = [];
  for (const w of [...widths].sort((a, b) => a - b)) {
    for (const h of [...heights].sort((a, b) => a - b)) out.push([w, h]);
  }
  return out;
}

/** The snapshot for one viewport — what a file holds. */
export function snapshot(width: number, height: number) {
  const p = resolveForSize(width, height);
  return {
    viewport: [width, height] as [number, number],
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

/** `w1280-h720.json` — the name carries the window. */
export function fileName(width: number, height: number): string {
  return `w${width}-h${height}.json`;
}

/** Serialise with a trailing newline, so a diff is one line of context. */
export function serialise(value: unknown): string {
  return `${JSON.stringify(value, null, 1)}\n`;
}

const check = process.argv.includes("--check");

if (!check) {
  // A full rewrite: a removed width must remove its files, not leave orphans.
  if (existsSync(CORPUS)) {
    for (const entry of readdirSync(CORPUS)) rmSync(join(CORPUS, entry), { force: true });
  }
  mkdirSync(CORPUS, { recursive: true });
}

const grid = matrix();
let written = 0;
const drifted: string[] = [];

for (const [w, h] of grid) {
  const file = join(CORPUS, fileName(w, h));
  const body = serialise(snapshot(w, h));
  if (check) {
    if (!existsSync(file)) {
      drifted.push(`${fileName(w, h)}: missing`);
      continue;
    }
    if (readFileSync(file, "utf8") !== body) drifted.push(`${fileName(w, h)}: stale`);
    continue;
  }
  writeFileSync(file, body);
  written += 1;
}

if (check) {
  if (drifted.length) {
    for (const d of drifted.slice(0, 20)) console.error(`✗ ${d}`);
    console.error(`\n${drifted.length} fixture(s) out of date — run npx vite-node scripts/gen-adaptive-fixtures.ts`);
    process.exit(1);
  }
  console.log(`adaptive corpus ok — ${grid.length} viewports`);
} else {
  console.log(`wrote ${written} fixture(s) to ${CORPUS}`);
}
