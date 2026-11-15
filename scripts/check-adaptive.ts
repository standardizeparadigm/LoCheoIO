/**
 * Print the adaptive profile for 21 real viewports.
 *
 * WHY A SCRIPT AND NOT A TEST
 * ---------------------------
 * The tests assert properties ("the lockup fits the band"). A person debugging a
 * screenshot needs the *table* — which tier, which density, how much band, how
 * big the type — for the window in the report. That table is what this prints.
 *
 * It imports the same `resolveAdaptive()` the app calls, so it cannot disagree
 * with what ships. Run it with:
 *
 *     npm run check:adaptive
 *     npx vite-node scripts/check-adaptive.ts
 */
import { resolveForSize } from "../src/components/menu/adaptive/resolve";

/** The sizes the project is tested against, plus the ones from bug reports. */
const VIEWPORTS: Array<[number, number, string]> = [
  [320, 480, "iPhone 4 / smallest"],
  [320, 568, "iPhone SE 1"],
  [360, 640, "Android small"],
  [375, 667, "iPhone SE 2"],
  [390, 844, "iPhone 12"],
  [414, 896, "iPhone 11 Pro Max"],
  [768, 1024, "iPad portrait"],
  [844, 390, "iPhone landscape (notched)"],
  [900, 500, "short window"],
  [1024, 600, "small laptop"],
  [1024, 768, "iPad landscape"],
  [1280, 640, "720p minus chrome"],
  [1280, 720, "720p"],
  [1366, 650, "1366 window"],
  [1366, 768, "1366 laptop"],
  [1440, 900, "MacBook Air"],
  [1568, 677, "windowed report 1"],
  [1920, 820, "windowed report 2"],
  [1920, 1080, "1080p fullscreen"],
  [2560, 1440, "1440p"],
  [3840, 2160, "4K"],
];

const pad = (v: string | number, n: number) => String(v).padEnd(n);
const num = (v: number, n: number) => String(v).padStart(n);

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
  " note";

console.log(header);
console.log("-".repeat(header.length));

for (const [w, h, note] of VIEWPORTS) {
  const p = resolveForSize(w, h);
  console.log(
    pad(`${w}×${h}`, 12) +
      pad(p.tier, 5) +
      pad(p.density, 12) +
      num(p.plan.scene, 7) +
      num(p.plan.reserve, 9) +
      num(p.type.lockupLo, 8) +
      num(p.type.rowLabel, 7) +
      pad(` ${p.plan.fit}`, 8) +
      pad(` ${p.hero.sideBySide ? "row" : "stack"}`, 7) +
      ` ${note}`,
  );
}

/*
 * A tiny invariant check, so the script is a gate as well as a table. It is the
 * one promise the whole folder makes: the column fills the window, or the plan
 * says out loud that it cannot.
 */
let failures = 0;
for (const [w, h] of VIEWPORTS) {
  const p = resolveForSize(w, h);
  if (p.plan.fit !== "crop" && p.plan.scene + p.plan.reserve !== h) {
    failures += 1;
    console.error(`✗ ${w}×${h}: scene + reserve = ${p.plan.scene + p.plan.reserve}, expected ${h}`);
  }
  if (p.type.lockupLo * 1.68 > p.plan.scene + 0.5) {
    failures += 1;
    console.error(`✗ ${w}×${h}: lockup ${p.type.lockupLo}px does not fit a ${p.plan.scene}px band`);
  }
  if (p.type.lockupCheo >= p.type.lockupLo) {
    failures += 1;
    console.error(`✗ ${w}×${h}: CHÉO ${p.type.lockupCheo} ≥ LỌ ${p.type.lockupLo}`);
  }
}

console.log(failures === 0 ? "\nADAPTIVE OK — 21 viewports" : `\n${failures} problem(s)`);
if (failures > 0) process.exit(1);
