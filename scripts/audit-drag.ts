#!/usr/bin/env node
/**
 * The drag audit, on the command line.
 *
 *   npm run audit:drag              → the totals, and the worst drags
 *   npm run audit:drag -- --json    → the whole `DragReport`
 *   npm run audit:drag -- --write   → rewrite `docs/adaptive-drag.md`
 *   npm run audit:drag -- --check   → exit 1 if that file is stale
 *
 * WHY A SCRIPT AS WELL AS A TEST
 * ------------------------------
 * `tests/adaptive-drag.test.ts` pins the properties — no latches, no violations,
 * no lag past the band, jitter fully suppressed. A pinned property is the right
 * gate and the wrong read: a maintainer wants to see *which* drags cross how many
 * boundaries before deciding whether the margin is still the right number. The
 * script prints that table; `--check` makes the checked-in copy honest.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { describeDrag, dragAudit, renderDragMarkdown, type DragReport } from "../src/components/menu/adaptive/audit";

const DOC = "docs/adaptive-drag.md";
const argv = process.argv.slice(2);
const has = (flag: string) => argv.includes(flag);

/* Same rule as the window audit: one mode, never two. */
const MODES = ["--json", "--write", "--check"].filter(has);
if (MODES.length > 1) {
  console.error(`✗ pick one mode — got ${MODES.join(" ")}`);
  process.exit(2);
}

/** The human summary: totals, then the drags that cross the most boundaries. */
function printSummary(r: DragReport) {
  const line = "-".repeat(78);
  console.log(`\nDRAG AUDIT — ${r.paths.length} drags, ${r.steps} windows\n${line}`);
  console.log(describeDrag(r));
  console.log(
    `jitter        ${r.ditherRaw} rung changes on a shaking pointer → ${r.ditherHeld} with the band` +
      ` (${r.boundaries} boundaries)`,
  );
  console.log(`sweep         ${r.changesRaw} → ${r.changesHeld} — a drag crosses each boundary once`);
  console.log(`held frames   ${r.heldFrames}, worst lag ${r.worstLag}px (band 2px)`);
  console.log(`contract      ${r.violations === 0 ? "OK — every painted profile is legal" : `FAILED — ${r.violations}`}`);
  if (r.stalled.length) console.log(`stalled       ✗ ${r.stalled.join(", ")}`);
  console.log(`longest hold  ${Math.max(...r.paths.map((p) => p.longestHold))} frames in a row (bound: margin + 1)`);

  const byBoundaries = [...r.paths].sort((a, b) => b.boundaries - a.boundaries || a.label.localeCompare(b.label));
  console.log(`\nboundaries crossed`);
  for (const p of byBoundaries.slice(0, 8)) {
    console.log(
      `  ${p.label.padEnd(16)} h${String(p.height).padEnd(5)} ${p.from}–${p.to}  ` +
        `b${String(p.boundaries).padStart(2)}  shake ${p.ditherRaw}→${p.ditherHeld}  sweep ${p.changesRaw}→${p.changesHeld}`,
    );
  }
  console.log(`\n${line}`);
  console.log(`docs copy: ${DOC} — \`npm run audit:drag -- --check\`\n`);
}

const report = dragAudit();

if (has("--json")) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else if (has("--write")) {
  writeFileSync(DOC, renderDragMarkdown(report));
  console.log(`wrote ${DOC} — ${report.paths.length} drags, ${report.steps} windows`);
} else if (has("--check")) {
  let onDisk = "";
  try {
    onDisk = readFileSync(DOC, "utf8");
  } catch {
    console.error(`✗ ${DOC} is missing — run: npm run audit:drag -- --write`);
    process.exit(1);
  }
  const fresh = renderDragMarkdown(report);
  if (onDisk !== fresh) {
    /* Name the first differing line: a byte diff with no diff is unhelpful. */
    const a = onDisk.split("\n");
    const b = fresh.split("\n");
    const at = a.findIndex((text, i) => text !== b[i]);
    console.error(`✗ ${DOC} is stale — run: npm run audit:drag -- --write`);
    console.error(`  first difference at line ${at + 1}:`);
    console.error(`    on disk: ${at >= 0 ? a[at] : "(missing line)"}`);
    console.error(`    fresh:   ${at >= 0 ? b[at] : "(extra line)"}`);
    process.exit(1);
  }
  console.log(`✓ ${DOC} matches the drags — ${report.paths.length} drags, ${report.heldFrames} held frames`);
} else {
  printSummary(report);
}

if ((report.violations > 0 || report.stalled.length > 0) && !has("--write")) {
  process.exit(1);
}
