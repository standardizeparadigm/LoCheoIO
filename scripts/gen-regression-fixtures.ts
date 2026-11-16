#!/usr/bin/env node
/**
 * Write the regression snapshot corpus.
 *
 * `tests/fixtures/regressions/` — one JSON file per window that was ever the
 * subject of a screenshot report, from round 1 to round 12. The list itself lives
 * in `src/components/menu/adaptive/regressions.ts`, because it is *knowledge*
 * (which window, which round, which symptom), not a build artifact.
 *
 * WHY A FOURTH CORPUS IS NOT REDUNDANT
 * ------------------------------------
 * `adaptive-matrix/` samples the space; this samples the *incidents*. A sampled
 * matrix can miss 1920×820 — a size that is 120px away from a preset and was still
 * the window in two separate bug reports. Every file here is a window where the
 * layout was once visibly wrong, with the sentence that describes how, so a
 * failure reads:
 *
 *     r10-chip-row-1920x820: the chip is «ellipsis» — «MUỐI DƯA CỔ ĐIỂN» lost the
 *     right side of the chip: border, padding and the end of the name
 *
 * instead of `expected 246 to be <= 200`.
 *
 * Usage:
 *   npx vite-node scripts/gen-regression-fixtures.ts           # write
 *   npx vite-node scripts/gen-regression-fixtures.ts --check   # report only
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { resolveAdaptive } from "../src/components/menu/adaptive/resolve";
import { boxOf } from "../src/components/menu/adaptive/viewport";
import { violations } from "../src/components/menu/adaptive/constraints";
import { warningsFor } from "../src/components/menu/adaptive/diagnostics";
import { heroBandWidth } from "../src/components/menu/adaptive/hero";
import { chipRungFor } from "../src/components/menu/adaptive/audit";
import { chipBoxHeight, planModeChip } from "../src/components/menu/adaptive/chip";
import { REGRESSIONS, type RegressionWindow } from "../src/components/menu/adaptive/regressions";

export const CORPUS = join("tests", "fixtures", "regressions");

/** The widest mode name, so the chip snapshot is an upper bound. */
const CHIP_NAME = "MUỐI DƯA CỔ ĐIỂN";
const CHIP_LABEL = "CHẾ ĐỘ CHƠI";

/** The snapshot: the numbers a reviewer would have wanted in the bug report. */
export function snapshot(window: RegressionWindow) {
  const p = resolveAdaptive({ box: boxOf(window.width, window.height) });
  const chip = planModeChip({
    heroWidth: heroBandWidth(p.box.width),
    side: "right",
    name: CHIP_NAME,
    label: CHIP_LABEL,
  });
  return {
    id: window.id,
    round: window.round,
    window: `${window.width}×${window.height}`,
    width: window.width,
    height: window.height,
    symptom: window.symptom,
    guard: window.guard,
    profile: {
      tier: p.tier,
      device: p.device,
      aspect: p.aspect,
      density: p.density,
      room: Number(p.room.toFixed(2)),
      fit: p.plan.fit,
      minimal: p.plan.minimal,
      scene: p.plan.scene,
      reserve: p.plan.reserve,
      ticker: p.plan.ticker,
      hero: p.hero.sideBySide ? "row" : "stack",
      mascot: p.hero.mascot,
      panelHeight: p.panelHeight,
      modal: `${p.modal.columns}×${p.modal.maxWidth}×${p.modal.maxHeight}`,
      playfield: `${p.playfield.width}×${p.playfield.height}`,
      hudScale: p.playfield.hudScale,
      type: {
        lockupLo: p.type.lockupLo,
        lockupCheo: p.type.lockupCheo,
        rowLabel: p.type.rowLabel,
        rowHint: p.type.rowHint,
        hudScore: p.type.hudScore,
      },
    },
    chip: {
      band: heroBandWidth(p.box.width),
      reason: chipRungFor(p),
      visible: chip.visible,
      nameSize: chip.nameSize,
      showLabel: chip.showLabel,
      text: chip.text,
      box: chipBoxHeight(chip),
    },
    warnings: warningsFor(p).map((w) => w.code),
    violations: violations(p).map((v) => v.id),
  };
}

function main() {
  const check = process.argv.includes("--check");
  const expected = new Map(REGRESSIONS.map((r) => [`${r.id}.json`, snapshot(r)]));

  if (!check) {
    if (existsSync(CORPUS)) rmSync(CORPUS, { recursive: true, force: true });
    mkdirSync(CORPUS, { recursive: true });
    for (const [name, data] of expected) {
      writeFileSync(join(CORPUS, name), JSON.stringify(data, null, 1) + "\n");
    }
    console.log(`regression corpus written — ${expected.size} windows (rounds ${[...new Set(REGRESSIONS.map((r) => r.round))].join(", ")})`);
    return;
  }

  const problems: string[] = [];
  const onDisk = existsSync(CORPUS) ? readdirSync(CORPUS).filter((f) => f.endsWith(".json")) : [];

  for (const [name, data] of expected) {
    if (!onDisk.includes(name)) {
      problems.push(`missing ${name}`);
      continue;
    }
    const actual = readFileSync(join(CORPUS, name), "utf8");
    const want = JSON.stringify(data, null, 1) + "\n";
    if (actual !== want) problems.push(`stale ${name} — re-run without --check`);
    if (data.violations.length) problems.push(`${name} violates ${data.violations.join(", ")}`);
  }
  for (const file of onDisk) {
    if (!expected.has(file)) problems.push(`orphan ${file} — no regression owns it`);
  }

  if (problems.length) {
    console.error(problems.map((p) => `✗ ${p}`).join("\n"));
    process.exit(1);
  }
  console.log(`regression corpus ok — ${expected.size} windows, no violations`);
}

main();
