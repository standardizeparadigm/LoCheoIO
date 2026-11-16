#!/usr/bin/env node
/**
 * The adaptive audit, on the command line.
 *
 *   npm run audit:adaptive              → a summary table
 *   npm run audit:adaptive -- --json    → the whole `AuditReport`
 *   npm run audit:adaptive -- --write   → rewrite `docs/adaptive-audit.md`
 *   npm run audit:adaptive -- --check   → exit 1 if that file is stale
 *   npm run audit:adaptive -- --select  → did the shipped profile win every window?
 *
 * WHY A SCRIPT AS WELL AS A TEST
 * ------------------------------
 * `tests/adaptive-audit.test.ts` pins the numbers this sweep produces, and a
 * pinned number is exactly what a maintainer cannot read: `expect(report.windows)
 * .toBe(578)` says nothing about *why* 578, or which trade-off fires on a third of
 * them. This script prints the shape of the space — histograms with bars, the two
 * extremes, and the preset table — so the answer to "what does the layout do" is
 * one command away instead of one afternoon away.
 *
 * `--check` is the gate. It re-renders the Markdown and compares it byte for byte
 * with the checked-in file, so `docs/adaptive-audit.md` cannot drift: any change
 * to a breakpoint, a density row or a type floor shows up as a diff in that file
 * in the same commit that caused it.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { auditAdaptive, auditWindows, knownViolationIds, renderAuditMarkdown, type AuditReport } from "../src/components/menu/adaptive/audit";
import { bestOn, describeSelection, selectBest } from "../src/components/menu/adaptive/select";

const DOC = "docs/adaptive-audit.md";
const argv = process.argv.slice(2);
const has = (flag: string) => argv.includes(flag);

/** A bar, scaled to the biggest count in the group. */
function bar(count: number, max: number, width = 28): string {
  if (max <= 0) return "";
  return "█".repeat(Math.max(1, Math.round((count / max) * width))).padEnd(width, "·");
}

/** Print the human summary. */
function printSummary(report: AuditReport) {
  const line = "-".repeat(78);
  console.log(`\nADAPTIVE AUDIT — ${report.windows} windows (21 presets + breakpoint grid)\n${line}`);

  console.log(`contract      ${report.ok ? "OK — no window breaks an invariant" : "FAILED"}`);
  console.log(`minimal       ${report.minimal} window(s) are wordmark-only`);
  console.log(`hero          ${report.hero.row} row · ${report.hero.stack} stack`);
  console.log(`extremes      scene ${report.extrema.smallestScene.value}px (${report.extrema.smallestScene.window}) … ${report.extrema.largestScene.value}px (${report.extrema.largestScene.window})`);
  console.log(`              reserve floor ${report.extrema.smallestReserve.value}px (${report.extrema.smallestReserve.window}) · tightest room ${report.extrema.tightestRoom.value} (${report.extrema.tightestRoom.window})`);

  if (report.violations.length) {
    console.log(`\n${line}\nVIOLATIONS`);
    for (const v of report.violations) console.log(`  ✗ ${v.key}: ${v.count} window(s) — ${v.examples.join(", ")}`);
  }

  const groups: Array<[string, AuditReport["warnings"]]> = [
    ["trade-offs", report.warnings],
    ["fit", report.fits],
    ["density", report.densities],
    ["tier", report.tiers],
    ["chip", report.chip],
  ];
  for (const [title, rows] of groups) {
    if (!rows.length) continue;
    const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
    console.log(`\n${title}`);
    for (const r of rows) {
      const pct = Math.round((r.count / report.windows) * 100);
      console.log(`  ${r.key.padEnd(16)} ${String(r.count).padStart(4)}  ${String(pct).padStart(3)}%  ${bar(r.count, max)}`);
    }
  }
  console.log(`\n${line}`);
  console.log(`known invariant ids: ${knownViolationIds().length}`);
  console.log(`docs copy: ${DOC} — \`npm run audit:adaptive -- --check\`\n`);
}

/*
 * `--select` answers the round-13 question, which is one step past "is anything
 * broken": *is anything sub-optimal*. It reuses the audit's own window list, so
 * the two answers are about the same 578 windows and cannot disagree about which
 * windows exist.
 */
if (has("--select")) {
  const windows = auditWindows();
  const widths = [...new Set(windows.map((w) => w.width))];
  const heights = [...new Set(windows.map((w) => w.height))];
  const sweep = bestOn(widths, heights);
  const sample = selectBest({ width: 1280, height: 720 });
  console.log(`\nSELECTION — ${sweep.windows} windows from the audit's own grid`);
  console.log(`  shipped profile wins   ${sweep.shipped} / ${sweep.windows}`);
  console.log(`  disagreements          ${sweep.failures.length}`);
  for (const f of sweep.failures.slice(0, 10)) console.log(`    ✗ ${f}`);
  console.log(`  sample                 ${describeSelection(sample)}`);
  if (sweep.failures.length) process.exit(1);
  process.exit(0);
}

const report = auditAdaptive();

if (has("--json")) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else if (has("--write")) {
  writeFileSync(DOC, renderAuditMarkdown(report));
  console.log(`wrote ${DOC} — ${report.windows} windows`);
} else if (has("--check")) {
  let onDisk = "";
  try {
    onDisk = readFileSync(DOC, "utf8");
  } catch {
    console.error(`✗ ${DOC} is missing — run: npm run audit:adaptive -- --write`);
    process.exit(1);
  }
  const fresh = renderAuditMarkdown(report);
  if (onDisk !== fresh) {
    /*
     * A byte comparison with no diff is unhelpful, and `diff` is not guaranteed on
     * Windows. Report the first differing line instead: it is almost always the
     * count or a bar length, which names the change well enough to act on.
     */
    const a = onDisk.split("\n");
    const b = fresh.split("\n");
    const at = a.findIndex((text, i) => text !== b[i]);
    console.error(`✗ ${DOC} is stale — run: npm run audit:adaptive -- --write`);
    console.error(`  first difference at line ${at + 1}:`);
    console.error(`    on disk: ${at >= 0 ? a[at] : "(missing line)"}`);
    console.error(`    fresh:   ${at >= 0 ? b[at] : "(extra line)"}`);
    process.exit(1);
  }
  console.log(`✓ ${DOC} matches the sweep — ${report.windows} windows, ${report.ok ? "0 violations" : "VIOLATIONS"}`);
} else {
  printSummary(report);
}

if (!report.ok && !has("--write")) {
  process.exit(1);
}
