/**
 * Print the adaptive profile for the 21 presets, then check the contract.
 *
 * WHY A SCRIPT AND NOT A TEST
 * ---------------------------
 * The tests assert properties ("the lockup fits the band"). A person debugging a
 * screenshot needs the *table* — which tier, which density, how much band, how
 * big the type, what was given up — for the window in the report. That table is
 * what this prints.
 *
 * It imports the same `resolveAdaptive()` the app calls and the same `PRESETS` the
 * docs print, so it cannot disagree with either. Since round 9 it also runs the
 * same `CONSTRAINTS` list the tests run, which is why the gate and the suite can
 * never drift: there is one definition of every invariant, not one per tool.
 *
 *     npm run check:adaptive
 *     npx vite-node scripts/check-adaptive.ts --explain 1280x720
 */
import { PRESETS } from "../src/components/menu/adaptive/presets";
import { resolveForSize } from "../src/components/menu/adaptive/resolve";
import { violations, constraintIds } from "../src/components/menu/adaptive/constraints";
import { renderDiagnosis, warningsFor } from "../src/components/menu/adaptive/diagnostics";
import { chipBoxHeight, planModeChip } from "../src/components/menu/adaptive/chip";
import { heroBandWidth } from "../src/components/menu/adaptive/hero";
import { MODE_LIST } from "../src/game/modes";

const pad = (v: string | number, n: number) => String(v).padEnd(n);
const num = (v: string | number, n: number) => String(v).padStart(n);

/*
 * `--explain 1280x720`: the long answer for one window.
 *
 * The table answers "what"; a screenshot review usually needs "why". Printing the
 * diagnosis from the same script means the person reading a bug report does not
 * have to find the right module first.
 */
const explainAt = process.argv.indexOf("--explain");
if (explainAt > -1) {
  const [w, h] = (process.argv[explainAt + 1] ?? "").split(/[x×]/).map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h)) {
    console.error("usage: npx vite-node scripts/check-adaptive.ts --explain 1280x720");
    process.exit(1);
  }
  const profile = resolveForSize(w, h);
  console.log(renderDiagnosis(profile));
  const bad = violations(profile);
  console.log(bad.length ? `\nviolations: ${bad.map((b) => b.id).join(", ")}` : "\nviolations: none");
  process.exit(bad.length ? 1 : 0);
}

const header =
  pad("viewport", 12) +
  pad("tier", 5) +
  pad("density", 12) +
  num("scene", 7) +
  num("reserve", 9) +
  num("lockup", 8) +
  num("label", 7) +
  pad(" fit", 8) +
  pad(" hero", 7) +
  pad(" trade-offs", 22) +
  pad(" chip", 16) +
  num("box", 5) +
  " window";

console.log(header);
console.log("-".repeat(header.length));

/*
 * The widest name the chip can be asked to print, in the app's own language.
 * Using the widest one makes the column an upper bound: every other mode fits at
 * the same size or better.
 */
const WIDEST = MODE_LIST.reduce((best, m) => (m.name.length > best.length ? m.name : best), "");

for (const preset of PRESETS) {
  const p = resolveForSize(preset.width, preset.height);
  const trade = warningsFor(p)
    .map((w) => w.code)
    .join(",");
  const chipPlan = p.plan.minimal
    ? null
    : planModeChip({ heroWidth: heroBandWidth(p.box.width), side: "right", name: WIDEST, label: "CHẾ ĐỘ CHƠI" });
  const chip = chipPlan?.reason ?? "—";
  /*
   * The chip's outer height, in the same table as the reason.
   *
   * Round 11 raised the line box from 1.2 to 1.5 and the chip grew 3.3px; the
   * gate below now refuses a chip taller than the mascot it hangs from, which is
   * the neighbour that change could have broken.
   */
  const box = chipPlan ? chipBoxHeight(chipPlan) : 0;
  console.log(
    pad(`${preset.width}×${preset.height}`, 12) +
      pad(p.tier, 5) +
      pad(p.density, 12) +
      num(p.plan.scene, 7) +
      num(p.plan.reserve, 9) +
      num(p.type.lockupLo, 8) +
      num(p.type.rowLabel, 7) +
      pad(` ${p.plan.fit}`, 8) +
      pad(` ${p.hero.sideBySide ? "row" : "stack"}`, 7) +
      pad(` ${trade || "—"}`, 22) +
      pad(` ${chip}`, 16) +
      num(box, 5) +
      ` ${preset.note}`,
  );
}

/*
 * The gate: the same twelve invariants the suite runs, over the same 21 windows.
 * The old version checked three of them inline and the tests checked nine
 * elsewhere, which is how two of them came to disagree.
 */
let failures = 0;
for (const preset of PRESETS) {
  const p = resolveForSize(preset.width, preset.height);
  /*
   * The chip may not be taller than the mascot it is pinned to. Not one of the
   * adaptive invariants — `chipBoxHeight` is a component number, not a window
   * number — but it is the check this round needed and nothing had.
   */
  if (!p.plan.minimal) {
    const h = chipBoxHeight(planModeChip({ heroWidth: heroBandWidth(p.box.width), side: "right", name: WIDEST, label: "CHẾ ĐỘ CHƠI" }));
    if (h > 128) {
      failures += 1;
      console.error(`✗ ${preset.width}×${preset.height} [chip-box] chip is ${h}px, taller than the 128px mascot`);
    }
  }
  for (const bad of violations(p)) {
    failures += 1;
    console.error(`✗ ${preset.width}×${preset.height} [${bad.id}] ${bad.message}`);
  }
}

console.log("");
console.log(`${constraintIds().length} invariants × ${PRESETS.length} presets`);
console.log(failures === 0 ? `ADAPTIVE OK — ${PRESETS.length} viewports` : `\n${failures} problem(s)`);
if (failures > 0) process.exit(1);
