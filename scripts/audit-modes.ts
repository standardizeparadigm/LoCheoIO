/**
 * Audit the nine balance records against the rest of the engine.
 *
 *     npm run check:modes          # exit 1 on any finding
 *     npm run check:modes -- -v    # also print the table
 *
 * WHY A SCRIPT AS WELL AS A TEST
 * ------------------------------
 * The test (`tests/modes-audit.test.ts`) asserts "zero findings", which is the
 * right shape for CI and the wrong shape for a person: when it fails, all it can
 * say is that something in one of nine records is inconsistent. This prints
 * every record — the multipliers, the badge the player reads, the crack budget,
 * the six item kinds the mode can spawn at level 1 — and then the findings, so
 * the diff between "what the badge promises" and "what the numbers do" is on one
 * screen.
 *
 * It imports `auditModes()`, the same function the test calls, so the gate and
 * the suite cannot drift.
 */
import { MODE_LIST } from "../src/game/modes";
import { auditModes, describeModeFindings } from "../src/game/modes/audit";
import { maxCracksFor, comboWindowFor, jarBonusFor } from "../src/game/modes";
import { DEFS, KINDS } from "../src/game/engine";
import { itemWeight } from "../src/game/spawn";

const verbose = process.argv.includes("-v") || process.argv.includes("--verbose");

const pad = (v: string | number, n: number) => String(v).padEnd(n);
const num = (v: string | number, n: number) => String(v).padStart(n);

if (verbose) {
  console.log(
    [
      pad("mode", 10),
      num("score", 6),
      num("speed", 6),
      num("spawn", 6),
      num("haz", 5),
      num("gold", 5),
      num("combo", 6),
      num("jar", 6),
      num("cracks", 7),
      num("limit", 6),
      " badge",
    ].join(""),
  );
  for (const m of MODE_LIST) {
    console.log(
      [
        pad(m.id, 10),
        num(`×${m.scoreMult}`, 6),
        num(`×${m.speedMult}`, 6),
        num(`×${m.spawnMult}`, 6),
        num(`×${m.hazardMult}`, 5),
        num(`×${m.goldMult ?? 1}`, 5),
        num(`${comboWindowFor(m).toFixed(1)}s`, 6),
        num(`+${jarBonusFor(1, m)}`, 6),
        num(maxCracksFor(m.id), 7),
        num(m.timeLimit ?? "—", 6),
        ` ${m.badge}`,
      ].join(""),
    );
  }
  console.log();

  /* What each mode can actually spawn at level 1 — the table the audit checks. */
  console.log(pad("mode", 10) + KINDS.map((k) => k.padStart(8)).join(""));
  for (const m of MODE_LIST) {
    const weights = KINDS.map((k) => itemWeight(DEFS[k], { level: 1, mode: m }));
    console.log(pad(m.id, 10) + weights.map((w) => (w > 0 ? w.toFixed(2) : "·").padStart(8)).join(""));
  }
  console.log();
}

const findings = auditModes();
if (findings.length === 0) {
  console.log(`✓ ${MODE_LIST.length} modes audit clean`);
  process.exit(0);
}

console.error(describeModeFindings(findings));
console.error(`\n✗ ${findings.length} finding(s) across ${MODE_LIST.length} modes`);
process.exit(1);
