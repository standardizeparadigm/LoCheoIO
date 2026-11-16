/**
 * The adaptive system, audited over a window space instead of a handful of tests.
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * Round 8 built a corpus of 1 110 numeric snapshots, round 9 a table for the HUD,
 * round 10 a third corpus for the chip. Each one answers a *narrow* question:
 * "does this shape of window still look the same", "does the chip still fit",
 * "does the HUD still stay on the board". None of them answers the question a
 * maintainer actually asks before a release:
 *
 *     across every window the app can be played in, what does the layout do,
 *     how often, and is anything broken?
 *
 * That answer was spread over three test files, a probe table and a design doc.
 * This module makes it one value — `AuditReport` — computed from the same
 * `resolveAdaptive()` the app renders with, so it cannot disagree with the
 * pixels. `scripts/audit-adaptive.ts` prints it, `docs/adaptive-audit.md` is the
 * checked-in copy, and `tests/adaptive-audit.test.ts` pins the numbers.
 *
 * WHY A GRID *AND* THE PRESETS
 * ---------------------------
 * The presets are 21 named devices, and they are where regressions actually
 * happened — so they are always in the audit, and a failure names them
 * (`iphone-4`), not a pair of numbers. But 21 windows cannot see a cliff between
 * two of them: the row/stack flip is a *width* threshold, and a 420px window is
 * a real phone that no preset covers. So the default sweep is the presets **plus**
 * a rectangular grid of widths × heights, deduplicated.
 *
 * The grid is deliberately coarse. A finer grid reports the same cliffs at more
 * points; the frontier is what matters, and every frontier in this layout is
 * either a breakpoint (`breakpoints.ts`), a tier floor (`tiers.ts`) or a density
 * threshold (`density.ts`) — all of which the audit catches because it includes
 * a window just below and just above each one.
 *
 * WHAT IT DOES NOT DO
 * -------------------
 * It does not render. It cannot see a font fallback or a 1px border. It answers
 * questions about numbers, and `scripts/smoke-ssr.tsx` answers the questions about
 * markup. Between them, the only thing left is a screenshot — which is why the
 * regression fixtures (`tests/fixtures/regressions/`) name the screenshots that
 * have already happened.
 */

import { resolveAdaptive, type AdaptiveProfile } from "../resolve";
import { boxOf } from "../viewport";
import { constraintIds, violations } from "../constraints";
import { warningsFor } from "../diagnostics";
import { PRESETS } from "../presets";
import { heroBandWidth } from "../hero";
import { planModeChip, widestOf, widestProbe } from "../chip";
import type { Environment } from "../environment";

/** What one audited window produced. */
export interface AuditSample {
  /** `preset:iphone-4` for a named window, `grid` for the sweep. */
  origin: string;
  width: number;
  height: number;
  tier: string;
  density: string;
  fit: string;
  hero: "row" | "stack";
  chip: string;
  /** Warning codes, in `warningsFor()` order. */
  warnings: string[];
  /** Constraint ids that failed. Empty is the only acceptable value. */
  violations: string[];
  /** The numbers a reviewer compares two windows by. */
  scene: number;
  reserve: number;
  room: number;
  /** The plan decided the band cannot seat even a wordmark. */
  minimal: boolean;
}

/** Count with the examples that produced it. */
export interface AuditTally {
  key: string;
  count: number;
  /** Up to three windows, so a report can say *which* ones. */
  examples: string[];
}

/** The whole audit, as data. */
export interface AuditReport {
  /** How many windows were resolved. */
  windows: number;
  /** True when not one of them broke the contract. */
  ok: boolean;
  /** `Constraint` ids that failed anywhere. */
  violations: AuditTally[];
  /** Trade-offs the layout made, by code. */
  warnings: AuditTally[];
  /** `plan.fit` histogram. */
  fits: AuditTally[];
  /** `density` histogram. */
  densities: AuditTally[];
  /** `tier` histogram. */
  tiers: AuditTally[];
  /** Row vs stack. */
  hero: { row: number; stack: number };
  /** Chip ladder rungs. */
  chip: AuditTally[];
  /** How many windows are wordmark-only. */
  minimal: number;
  /** The tightest values the sweep produced — the cliff edges, as numbers. */
  extrema: {
    smallestScene: { value: number; window: string };
    largestScene: { value: number; window: string };
    smallestReserve: { value: number; window: string };
    tightestRoom: { value: number; window: string };
  };
  /** Every sample, in sweep order. A report may print only the interesting ones. */
  samples: AuditSample[];
}

/** Windows that exist because a screenshot made them exist. */
function presetWindows(): Array<{ width: number; height: number; origin: string }> {
  return PRESETS.map((p) => ({ width: p.width, height: p.height, origin: `preset:${p.id}` }));
}

/**
 * The sweep's widths, px.
 *
 * Chosen around the breakpoints this layout actually has: the 320 floor, each
 * side of `sm` (640), the 768 tablet flip, each side of the 1024 row threshold,
 * and the 1152 `max-w-6xl` clamp — above which the geometry stops changing and
 * more samples would only be more of the same.
 */
export const AUDIT_WIDTHS = [
  320, 360, 375, 414, 480, 568, 600, 639, 640, 667, 720, 768, 820, 900, 1023, 1024, 1152, 1153, 1280, 1366, 1440,
  1568, 1920, 2560, 3840,
] as const;

/**
 * The sweep's heights, px.
 *
 * Same idea vertically: the 320 floor, the phone bands, the two heights from the
 * bug report (677 and 820), the 720/768 pair that flips the row, and the tall
 * desktop sizes where nothing is under pressure.
 */
export const AUDIT_HEIGHTS = [
  320, 360, 390, 400, 480, 500, 568, 600, 640, 650, 667, 677, 700, 720, 768, 800, 820, 844, 900, 1024, 1080, 1440,
  2160,
] as const;

/** The default sweep: every preset, then the grid, deduplicated. */
export function auditWindows(): Array<{ width: number; height: number; origin: string }> {
  const seen = new Set<string>();
  const out: Array<{ width: number; height: number; origin: string }> = [];
  const push = (w: number, h: number, origin: string) => {
    const key = `${w}×${h}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ width: w, height: h, origin });
  };
  for (const w of presetWindows()) push(w.width, w.height, w.origin);
  for (const width of AUDIT_WIDTHS) for (const height of AUDIT_HEIGHTS) push(width, height, "grid");
  return out;
}

/**
 * The chip's worst case across all seven languages.
 *
 * It used to be two literals — the widest *Vietnamese* name and «CHẾ ĐỘ CHƠI» —
 * which made every chip number in this report a statement about one translation.
 * Vietnamese is the shortest of the seven, so the census under-reported: in
 * Spanish the label is dropped at 320px and 360px, and the report said `full`.
 */
const CHIP_WORST = widestProbe();
const WIDEST_NAME = widestOf(CHIP_WORST.names);
const CHIP_LABEL = CHIP_WORST.label;

/**
 * The chip's rung for a profile — the audit's single definition of it.
 *
 * `minimal` means the band cannot seat a mascot, and a chip hangs off the mascot,
 * so there is no chip to plan. That rule used to live in two places (here and in
 * the regression generator) and they disagreed on 1920×400: the audit said
 * `hidden`, the generator said `full`, and the corpus test caught it. One
 * function, one answer.
 */
export function chipRungFor(p: AdaptiveProfile): string {
  if (p.plan.minimal) return "hidden";
  return planModeChip({ heroWidth: heroBandWidth(p.box.width), side: "right", name: WIDEST_NAME, label: CHIP_LABEL }).reason;
}

/** Everything the audit found out about one window. */
export function auditOne(
  width: number,
  height: number,
  origin = "manual",
  env?: Environment,
): AuditSample {
  const profile = resolveAdaptive({ box: boxOf(width, height), env });
  return sampleOf(profile, origin);
}

/** Turn a resolved profile into one row of the audit. */
function sampleOf(p: AdaptiveProfile, origin: string): AuditSample {
  return {
    origin,
    width: p.box.width,
    height: p.box.height,
    tier: p.tier,
    density: p.density,
    fit: p.plan.fit,
    hero: p.hero.sideBySide ? "row" : "stack",
    chip: chipRungFor(p),
    warnings: warningsFor(p).map((w) => w.code),
    violations: violations(p).map((v) => v.id),
    scene: p.plan.scene,
    reserve: p.plan.reserve,
    room: Number(p.room.toFixed(2)),
    minimal: p.plan.minimal,
  };
}

/** Count by key, keeping the first examples. Stable order: first seen. */
function tally(values: string[], examples: string[]): AuditTally[] {
  const map = new Map<string, AuditTally["examples"]>();
  values.forEach((value, i) => {
    const list = map.get(value) ?? [];
    if (list.length < 3 && examples[i]) list.push(examples[i]);
    map.set(value, list);
  });
  return [...map.entries()]
    .map(([key, ex]) => ({ key, count: values.filter((v) => v === key).length, examples: ex }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/** The tightest and roomiest values in a sweep — the cliff edges, as numbers. */
function extremaOf(samples: AuditSample[]): AuditReport["extrema"] {
  const label = (s: AuditSample) => `${s.width}×${s.height}`;
  let smallestScene = samples[0];
  let largestScene = samples[0];
  let smallestReserve = samples[0];
  let tightestRoom = samples[0];
  for (const s of samples) {
    if (s.scene < smallestScene.scene) smallestScene = s;
    if (s.scene > largestScene.scene) largestScene = s;
    if (s.reserve < smallestReserve.reserve) smallestReserve = s;
    if (s.room < tightestRoom.room) tightestRoom = s;
  }
  return {
    smallestScene: { value: smallestScene.scene, window: label(smallestScene) },
    largestScene: { value: largestScene.scene, window: label(largestScene) },
    smallestReserve: { value: smallestReserve.reserve, window: label(smallestReserve) },
    tightestRoom: { value: tightestRoom.room, window: label(tightestRoom) },
  };
}

/** Audit an explicit list of windows. */
export function auditWindowList(
  windows: Array<{ width: number; height: number; origin?: string }>,
  env?: Environment,
): AuditReport {
  const samples = windows.map((w) => auditOne(w.width, w.height, w.origin ?? "list", env));
  return summarise(samples);
}

/** Audit the default sweep (21 presets + the breakpoint grid). */
export function auditAdaptive(env?: Environment): AuditReport {
  return auditWindowList(auditWindows(), env);
}

/** Fold samples into the report. Pure; exported for tests that build their own lists. */
export function summarise(samples: AuditSample[]): AuditReport {
  const labels = samples.map((s) => `${s.width}×${s.height}`);
  const violationsFlat = samples.flatMap((s, i) => s.violations.map((id) => ({ id, i })));
  const warningsFlat = samples.flatMap((s, i) => s.warnings.map((code) => ({ code, i })));

  return {
    windows: samples.length,
    ok: violationsFlat.length === 0,
    violations: tally(violationsFlat.map((v) => v.id), violationsFlat.map((v) => labels[v.i])),
    warnings: tally(warningsFlat.map((w) => w.code), warningsFlat.map((w) => labels[w.i])),
    fits: tally(samples.map((s) => s.fit), labels),
    densities: tally(samples.map((s) => s.density), labels),
    tiers: tally(samples.map((s) => s.tier), labels),
    hero: {
      row: samples.filter((s) => s.hero === "row").length,
      stack: samples.filter((s) => s.hero === "stack").length,
    },
    chip: tally(samples.map((s) => s.chip), labels),
    minimal: samples.filter((s) => s.minimal).length,
    extrema: extremaOf(samples),
    samples,
  };
}
/**
 * Every id the audit is allowed to report as a violation.
 *
 * A report that printed an id no constraint owns would send a reader looking for
 * a file that does not exist; `tests/adaptive-audit.test.ts` asserts the two sets
 * are equal, in both directions.
 */
export function knownViolationIds(): string[] {
  return constraintIds();
}
