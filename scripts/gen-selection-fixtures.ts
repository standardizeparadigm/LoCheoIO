#!/usr/bin/env node
/**
 * Write the selection snapshot corpus.
 *
 * `tests/fixtures/selection/` — one JSON file per window in a small cross-section
 * of the space, recording what `selectBest()` decides and what every rung it beat
 * cost. Twelve windows, chosen so the corpus spans the corners where decisions
 * are actually contested:
 *
 *   the floor (320×320) and the ceiling (3840×2160);
 *   both sides of every kind of threshold (row/stack, ticker, footer, minimal);
 *   a windowed desktop, where round 7 found the chrome eating the hero;
 *   a notched phone, where the inset is real and `ignore-inset` is not free.
 *
 * WHY THIS CORPUS EXISTS WHEN THE AUDIT ALREADY SWEEPS 578 WINDOWS
 * ---------------------------------------------------------------
 * The audit records what one profile *is*. This records why it was chosen — the
 * full ranking, each loser's cost, and the margin. A future round that changes a
 * threshold should see, in the diff of these twelve files, exactly which decisions
 * moved and by how much; the audit would only show that some number changed.
 *
 * Usage:
 *   npx vite-node scripts/gen-selection-fixtures.ts           # write
 *   npx vite-node scripts/gen-selection-fixtures.ts --check   # report only
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { selectBest, shippedIsBest, type Selection } from "../src/components/menu/adaptive/select";
import { describeScore } from "../src/components/menu/adaptive/select";

export const CORPUS = join("tests", "fixtures", "selection");

/** The twelve windows, and the sentence that says why each one is in here. */
export const WINDOWS: ReadonlyArray<{ id: string; width: number; height: number; why: string }> = [
  { id: "s01-floor-320x320", width: 320, height: 320, why: "the floor of the space — crop, minimal hero, no ticker" },
  { id: "s02-phone-360x640", width: 360, height: 640, why: "a common Android phone, one step above the floor" },
  { id: "s03-notch-390x844", width: 390, height: 844, why: "an inset that is real, so `ignore-inset` would cost something" },
  { id: "s04-landscape-717x512", width: 717, height: 512, why: "landscape phone — the band where the hero flips to a row" },
  { id: "s05-tablet-768x1024", width: 768, height: 1024, why: "portrait tablet: spacious, stacked panels" },
  { id: "s06-hd-1280x720", width: 1280, height: 720, why: "the reference window every round is compared on" },
  { id: "s07-windowed-1568x677", width: 1568, height: 677, why: "the windowed screenshot that started round 7" },
  { id: "s08-windowed-1920x820", width: 1920, height: 820, why: "windowed report 2 — the clipped chip" },
  { id: "s09-full-1920x1080", width: 1920, height: 1080, why: "1080p fullscreen, the most common desktop" },
  { id: "s10-mac-1440x900", width: 1440, height: 900, why: "MacBook Air, where density is `spacious` a tier early" },
  { id: "s11-4k-3840x2160", width: 3840, height: 2160, why: "the ceiling: the dialog cap, the widest band" },
  { id: "s12-portrait-tall-320x480", width: 320, height: 480, why: "the tight portrait window from the first round of reports" },
];

/** One window's decision, flattened to the numbers worth diffing. */
export function snapshot(window: (typeof WINDOWS)[number]) {
  const selection: Selection = selectBest({ width: window.width, height: window.height });
  const chosen = selection.chosen;
  return {
    id: window.id,
    window: `${window.width}×${window.height}`,
    width: window.width,
    height: window.height,
    why: window.why,
    chosen: chosen.rung,
    shippedIsBest: shippedIsBest(selection),
    score: chosen.score.terms,
    ok: chosen.score.ok,
    tell: describeScore(chosen.score),
    ranked: selection.ranked.map((c) => `${c.rung} · ${describeScore(c.score)}`),
    losers: selection.losers.length,
    /* The runner-up's margin, so a diff shows *how close* the decision was. */
    runnerUp: selection.ranked[1] ? selection.ranked[1].rung : null,
    /** The profile the winner produced — the numbers the app would render. */
    profile: {
      tier: chosen.profile.tier,
      density: chosen.profile.density,
      fit: chosen.profile.plan.fit,
      minimal: chosen.profile.plan.minimal,
      scene: chosen.profile.plan.scene,
      reserve: chosen.profile.plan.reserve,
      hero: chosen.profile.hero.sideBySide ? "row" : "stack",
      panelHeight: chosen.profile.panelHeight,
      hudScale: chosen.profile.playfield.hudScale,
      rowLabel: chosen.profile.type.rowLabel,
    },
  };
}

/*
 * `argv[1]` under `vite-node` is the runner, not this file, so the guard is on the
 * environment: the suite imports `snapshot()` and must not have the corpus
 * rewritten underneath it, and a human running the script must.
 */
if (!process.env.VITEST) {
  const check = process.argv.includes("--check");
  const files = new Map(WINDOWS.map((w) => [`${w.id}.json`, JSON.stringify(snapshot(w), null, 1) + "\n"]));

  if (!check) {
    if (existsSync(CORPUS)) rmSync(CORPUS, { recursive: true, force: true });
    mkdirSync(CORPUS, { recursive: true });
    for (const [name, body] of files) writeFileSync(join(CORPUS, name), body);
    console.log(`wrote ${files.size} files to ${CORPUS}`);
  } else {
    const problems: string[] = [];
    const onDisk = existsSync(CORPUS) ? readdirSync(CORPUS).filter((f) => f.endsWith(".json")) : [];
    for (const name of files.keys()) {
      if (!onDisk.includes(name)) problems.push(`missing ${name}`);
    }
    for (const name of onDisk) {
      if (!files.has(name)) problems.push(`orphan ${name} — no window produces it`);
    }
    for (const [name, want] of files) {
      if (!onDisk.includes(name)) continue;
      const actual = readFileSync(join(CORPUS, name), "utf8");
      if (actual !== want) problems.push(`stale ${name} — re-run without --check`);
    }
    for (const w of WINDOWS) {
      const snap = snapshot(w);
      if (!snap.ok) problems.push(`violation in ${w.id} — the corpus may not contain a broken window`);
      if (!snap.shippedIsBest) problems.push(`${w.id} does not choose as-planned`);
    }
    if (problems.length) {
      console.error(`${problems.length} problem(s):`);
      for (const p of problems) console.error(`  ✗ ${p}`);
      process.exit(1);
    }
    console.log(`${files.size} snapshots match — all choose as-planned, none broken`);
  }
}
