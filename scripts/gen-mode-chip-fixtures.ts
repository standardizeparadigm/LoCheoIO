/**
 * Write the mode-chip snapshot corpus.
 *
 * The third corpus, and the first that is about a *component* rather than a
 * layout. `adaptive-matrix/` pins what a window gets, `hero-bands/` pins what the
 * hero does with a band, and this one pins what the chip does with a band and a
 * translation — the two inputs that produced the round-10 screenshot.
 *
 * WHY THE MODE NAMES AND NOT THE LOCALES
 * --------------------------------------
 * `MODE_LIST` carries the canonical (Vietnamese) names, and they are the widest
 * set: nineteen characters for the classic mode, versus twelve for the English
 * one. A corpus over the widest set is a corpus that bounds the narrow ones. The
 * translations are covered separately by `tests/mode-chip.test.ts`, which is the
 * only place that needs all seven languages at once.
 *
 * 21 presets × 9 modes = 189 files.
 *
 * Usage:
 *   npx vite-node scripts/gen-mode-chip-fixtures.ts           # write
 *   npx vite-node scripts/gen-mode-chip-fixtures.ts --check   # report only
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { heroBandWidth } from "../src/components/menu/adaptive/hero";
import { planModeChip } from "../src/components/menu/adaptive/chip";
import { PRESETS } from "../src/components/menu/adaptive/presets";
import { MODE_LIST } from "../src/game/modes";

export const CORPUS = join("tests", "fixtures", "mode-chips");

/** The label the app actually prints, so the snapshot includes it. */
export const CHIP_LABEL = "CHẾ ĐỘ CHƠI";

export function matrix(): Array<{ preset: (typeof PRESETS)[number]; mode: (typeof MODE_LIST)[number] }> {
  return PRESETS.flatMap((preset) => MODE_LIST.map((mode) => ({ preset, mode })));
}

export function snapshot(preset: (typeof PRESETS)[number], mode: (typeof MODE_LIST)[number]) {
  const band = heroBandWidth(preset.width);
  const plan = planModeChip({ heroWidth: band, side: "right", name: mode.name, label: CHIP_LABEL });
  return {
    preset: preset.id,
    window: `${preset.width}×${preset.height}`,
    mode: mode.id,
    name: mode.name,
    band,
    visible: plan.visible,
    align: plan.align,
    showLabel: plan.showLabel,
    nameSize: plan.nameSize,
    labelSize: plan.labelSize,
    maxWidth: plan.maxWidth,
    needed: plan.needed,
    available: plan.available,
    truncated: plan.truncated,
    reason: plan.reason,
  };
}

export function fileName(presetId: string, modeId: string): string {
  return `${presetId}--${modeId}.json`;
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

for (const { preset, mode } of matrix()) {
  const file = join(CORPUS, fileName(preset.id, mode.id));
  const body = serialise(snapshot(preset, mode));
  if (check) {
    if (!existsSync(file)) {
      drifted.push(`${fileName(preset.id, mode.id)}: missing`);
      continue;
    }
    if (readFileSync(file, "utf8") !== body) drifted.push(`${fileName(preset.id, mode.id)}: stale`);
    continue;
  }
  writeFileSync(file, body);
  written += 1;
}

if (check) {
  if (drifted.length) {
    for (const d of drifted.slice(0, 20)) console.error(`✗ ${d}`);
    console.error(`\n${drifted.length} fixture(s) out of date — run npx vite-node scripts/gen-mode-chip-fixtures.ts`);
    process.exit(1);
  }
  console.log(`mode-chip corpus ok — ${matrix().length} (preset, mode) pairs`);
} else {
  console.log(`wrote ${written} fixture(s) to ${CORPUS}`);
}
