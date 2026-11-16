/**
 * The drag audit: the layout's behaviour *over time*, not per window.
 *
 * WHY THIS FILE EXISTS WHEN `adaptive-audit.test.ts` DOES
 * ------------------------------------------------------
 * The window audit resolves 578 windows and checks the contract on each. None of
 * those windows is broken, and the complaint that produced the two-pixel band —
 * "the menu re-lays-out on every mouse move" — cannot appear in that table at
 * all, because a table has no yesterday.
 *
 * So this file replays gestures. Three properties matter, and each of them is a
 * way the band could be wrong rather than merely different:
 *
 *   safety    a held profile must still satisfy every invariant (it is a
 *             *previous* profile, so it should — this is the assertion that
 *             catches a future `stabilize()` that mixes fields);
 *   liveness  a hold must be released: no path may end on the rung it started on
 *             when the window ended somewhere else;
 *   effect    jitter must be suppressed completely, and a monotone drag must never
 *             get *worse*.
 */
import { describe, expect, it } from "vitest";

import {
  DRAG_SPAN,
  dragAudit,
  dragPath,
  describeDrag,
  renderDragMarkdown,
  rungText,
} from "../src/components/menu/adaptive/audit";
import { PRESETS } from "../src/components/menu/adaptive/presets";
import { HYSTERESIS_MARGIN } from "../src/components/menu/adaptive/hysteresis";
import { resolveAdaptive } from "../src/components/menu/adaptive/resolve";
import { boxOf } from "../src/components/menu/adaptive/viewport";

/** The whole sweep, computed once — the report is pure, so one run serves all. */
const report = dragAudit();

describe("the drag audit", () => {
  it("replays one path per preset, at that preset's own height", () => {
    expect(report.paths.length).toBe(PRESETS.length);
    expect(report.paths.map((p) => p.label)).toEqual(PRESETS.map((p) => p.id));
    for (const [i, path] of report.paths.entries()) {
      expect(path.height).toBe(PRESETS[i].height);
      /* Symmetric, and never below the 320px floor the planner assumes. */
      expect(path.from).toBeLessThanOrEqual(path.to);
      expect(path.from).toBeGreaterThanOrEqual(320);
      expect(path.to - path.from + 1).toBe(path.steps);
    }
    expect(report.steps).toBe(report.paths.reduce((n, p) => n + p.steps, 0));
  });

  it("is deterministic: the same drags, replayed again, give the same numbers", () => {
    const again = dragAudit();
    expect(again.changesRaw).toBe(report.changesRaw);
    expect(again.changesHeld).toBe(report.changesHeld);
    expect(again.ditherRaw).toBe(report.ditherRaw);
    expect(again.ditherHeld).toBe(report.ditherHeld);
  });
});

describe("safety — a held profile is still a legal profile", () => {
  it("paints nothing the contract rejects, over 4 600 windows", () => {
    /*
     * The band returns the *previous* profile, so this is an assertion about
     * `stabilize()` not composing two profiles: if it ever built a hybrid, the
     * invariants would catch it here and not in a screenshot.
     */
    expect(report.violations).toBe(0);
    expect(report.paths.filter((p) => p.violations > 0)).toEqual([]);
  });

  it("never paints a profile from further away than the band", () => {
    expect(report.worstLag).toBeLessThanOrEqual(HYSTERESIS_MARGIN);
    for (const path of report.paths) {
      expect(path.worstLag, path.label).toBeLessThanOrEqual(HYSTERESIS_MARGIN);
    }
  });
});

describe("liveness — a hold is always released", () => {
  it("no hold outlives the band: no run longer than margin + 1 frames", () => {
    expect(report.stalled).toEqual([]);
    for (const path of report.paths) {
      expect(path.longestHold, path.label).toBeLessThanOrEqual(HYSTERESIS_MARGIN + 1);
    }
  });

  it("a hand-built drag agrees with the walk it replays", () => {
    const preset = PRESETS.find((p) => p.id === "iphone-12");
    expect(preset).toBeDefined();
    const path = dragPath(preset!, 30);
    expect(path.to - path.from + 1).toBe(path.steps);
    expect(path.endsOn).toBe(rungText(resolveAdaptive({ box: boxOf(path.to, path.height) })));
    expect(path.expects).toBe(path.endsOn);
  });
});

describe("effect — what the band actually buys", () => {
  it("suppresses jitter completely: 48 rung changes on a shaking pointer, 0 painted", () => {
    /*
     * This is the number the band exists for, and it is only visible in a
     * sequence: a pointer settling near a boundary and moving by a pixel. Without
     * the band every one of those frames repaints a different rung.
     */
    expect(report.ditherRaw).toBeGreaterThan(0);
    expect(report.ditherHeld).toBe(0);
  });

  it("never makes a monotone drag worse, and holds for a bounded share of it", () => {
    expect(report.changesHeld).toBeLessThanOrEqual(report.changesRaw);
    expect(report.ratio).toBeLessThanOrEqual(1);
    /*
     * A sweep crosses each boundary once, so there is very little to suppress —
     * the report says so out loud rather than pretending the band is a drag
     * optimiser. The band's cost is a bounded stall, and this is the bound.
     */
    expect(report.heldFrames).toBeLessThan(report.steps * 0.05);
  });

  it("copies the same rules to a subset, so a future sweep can be narrower", () => {
    const subset = dragAudit({ presets: PRESETS.slice(0, 3), span: 40 });
    expect(subset.paths.length).toBe(3);
    expect(subset.steps).toBeLessThan(report.steps);
    expect(subset.violations).toBe(0);
    expect(subset.stalled).toEqual([]);
  });
});

describe("the report", () => {
  it("states both gestures, because one number would tell only one story", () => {
    const md = renderDragMarkdown(report);
    expect(md).toContain("sweep");
    expect(md).toContain("shake");
    expect(md).toContain(`${report.steps} windows`);
    expect(md).toContain("`HYSTERESIS_MARGIN`");
    expect(md).not.toMatch(/NaN|undefined|Infinity/);
    /* Every preset has a row, so the table is not a sample of the sweep. */
    for (const preset of PRESETS) expect(md).toContain(`\`${preset.id}\``);
  });

  it("summarises in one line that a reader can quote", () => {
    const line = describeDrag(report);
    expect(line).toContain(`${report.paths.length} drags`);
    expect(line).toContain("worst lag");
    expect(line).not.toMatch(/NaN|undefined/);
  });

  it("spans the documented 120px either side of a preset", () => {
    expect(DRAG_SPAN).toBe(120);
    const path = report.paths.find((p) => p.label === "ipad-portrait");
    expect(path).toBeDefined();
    expect(path!.from).toBe(Math.max(320, 768 - DRAG_SPAN));
    expect(path!.to).toBe(768 + DRAG_SPAN);
  });
});
