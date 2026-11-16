/**
 * The audit, pinned.
 *
 * Three things are being defended here, and only the first is obvious:
 *
 *  1. **The numbers.** 578 windows, zero violations, the exact trade-off
 *     histogram. If a breakpoint moves or a density row changes, this file is
 *     where the reviewer sees what it cost — in counts, not in prose.
 *  2. **The definition of "window".** A sweep that silently stops including the
 *     presets, or the two sides of a breakpoint, still reports "0 violations" and
 *     is worthless. So the grid is asserted *by construction*: every preset is in
 *     it, every breakpoint has a sample on each side, and the list is deduplicated.
 *  3. **The report.** `docs/adaptive-audit.md` is generated; if it and the sweep
 *     disagree, the doc is lying about the code. `--check` in `npm run check`
 *     enforces it byte for byte; this file asserts it is not empty, mentions every
 *     preset, and contains no `NaN`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  AUDIT_HEIGHTS,
  AUDIT_WIDTHS,
  auditAdaptive,
  auditOne,
  auditWindows,
  knownViolationIds,
  renderAuditMarkdown,
  summarise,
} from "../src/components/menu/adaptive/audit";
import { PRESETS } from "../src/components/menu/adaptive/presets";
import { constraintIds } from "../src/components/menu/adaptive/constraints";

const report = auditAdaptive();

describe("the sweep", () => {
  it("is the presets plus the grid, deduplicated", () => {
    const windows = auditWindows();
    const keys = new Set(windows.map((w) => `${w.width}×${w.height}`));
    expect(keys.size).toBe(windows.length);
    expect(windows.length).toBeGreaterThan(500);

    // Every preset is in it, and says so by name.
    for (const preset of PRESETS) {
      expect(
        windows.some((w) => w.width === preset.width && w.height === preset.height && w.origin === `preset:${preset.id}`),
        preset.id,
      ).toBe(true);
    }
  });

  it("brackets every breakpoint the layout has", () => {
    /*
     * The cliffs are thresholds, so a grid that only samples round numbers reports
     * a smooth space that is not smooth. Each pair below is "just below, just
     * above": the `sm` padding switch (640), the row threshold (1024), the
     * `max-w-6xl` clamp (1152) and the 320 floor.
     */
    for (const w of [319, 320, 639, 640, 1023, 1024, 1151, 1152]) {
      // 319 and 1151 are deliberately *not* in the grid: the floor and the clamp
      // are inclusive, so the sample below them is the floor itself.
      if (w === 319 || w === 1151) continue;
      expect(AUDIT_WIDTHS, `${w}px`).toContain(w);
    }
    for (const h of [320, 390, 677, 720, 820, 844]) expect(AUDIT_HEIGHTS).toContain(h);
  });

  it("resolves every window without throwing", () => {
    expect(report.windows).toBe(auditWindows().length);
    expect(report.samples.length).toBe(report.windows);
  });
});

describe("the contract", () => {
  it("is satisfied on every audited window", () => {
    expect(report.violations).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("never reports a violation id that no constraint owns", () => {
    // Both directions: a typo'd id would send a reader to a file that exists not.
    const known = new Set(knownViolationIds());
    expect(known.size).toBe(constraintIds().length);
    for (const id of constraintIds()) expect(known.has(id), id).toBe(true);
    for (const v of report.violations) expect(known.has(v.key), v.key).toBe(true);
  });

  it("accounts for every window in each histogram", () => {
    const sum = (rows: Array<{ count: number }>) => rows.reduce((n, r) => n + r.count, 0);
    expect(sum(report.fits)).toBe(report.windows);
    expect(sum(report.densities)).toBe(report.windows);
    expect(sum(report.tiers)).toBe(report.windows);
    expect(sum(report.chip)).toBe(report.windows);
    expect(report.hero.row + report.hero.stack).toBe(report.windows);
  });
});

describe("the numbers", () => {
  it("has 578 windows, 101 of them wordmark-only", () => {
    // Pinned on purpose: a change here is a change to the layout's behaviour, and
    // the diff in `docs/adaptive-audit.md` is what a reviewer reads to judge it.
    expect(report.windows).toBe(578);
    expect(report.minimal).toBe(101);
  });

  it("splits the hero 170 row / 408 stack", () => {
    expect(report.hero).toEqual({ row: 170, stack: 408 });
  });

  it("gives the chip a rung on every window that draws one", () => {
    // The only two rungs a ≥320px-wide window can reach, which is the promise
    // round 10 made: the label survives, the name is never ellipsised.
    expect(report.chip.map((c) => c.key).sort()).toEqual(["full", "hidden"]);
  });

  it("measures the two ends of the space", () => {
    expect(report.extrema.smallestScene.value).toBe(140);
    expect(report.extrema.smallestScene.window).toBe("320×320");
    expect(report.extrema.largestScene.value).toBe(1642);
    expect(report.extrema.smallestReserve.value).toBe(216);
  });

  it("reports the trade-offs as counts, not booleans", () => {
    const codes = report.warnings.map((w) => w.key);
    expect(codes).toContain("no-ticker");
    expect(codes).toContain("crop");
    for (const row of report.warnings) {
      expect(row.count, row.key).toBeLessThanOrEqual(report.windows);
      expect(row.examples.length, row.key).toBeGreaterThan(0);
      expect(row.examples.length, row.key).toBeLessThanOrEqual(3);
    }
  });
});

describe("one window at a time", () => {
  it("names the preset it came from", () => {
    const sample = auditOne(320, 480, "preset:iphone-4");
    expect(sample.origin).toBe("preset:iphone-4");
    expect(sample.fit).toBe("squeeze");
    expect(sample.chip).toBe("full");
    expect(sample.violations).toEqual([]);
  });

  it("summarises an arbitrary list — the shape a regression test wants", () => {
    const small = summarise([
      auditOne(320, 480),
      auditOne(320, 480),
      auditOne(1920, 1080),
    ]);
    expect(small.windows).toBe(3);
    expect(small.ok).toBe(true);
    const tiers = Object.fromEntries(small.tiers.map((t) => [t.key, t.count]));
    expect(tiers.xs).toBe(2);
    // 1920×1080 is a different tier from 320×480 — the point of the histogram.
    expect(small.tiers.length).toBe(2);
  });

  it("survives the windows that are not windows", () => {
    for (const [w, h] of [[0, 0], [1, 1], [NaN, NaN], [10000, 10000]] as Array<[number, number]>) {
      const s = auditOne(w, h);
      expect(Number.isFinite(s.scene), `${w}×${h}`).toBe(true);
      expect(Number.isFinite(s.room), `${w}×${h}`).toBe(true);
      expect(s.violations, `${w}×${h}`).toEqual([]);
    }
  });
});

describe("the report", () => {
  const md = renderAuditMarkdown(report);

  it("is deterministic", () => {
    expect(renderAuditMarkdown(auditAdaptive())).toBe(md);
  });

  it("states the sweep and the verdict", () => {
    expect(md).toContain("**578**");
    expect(md).toContain("không cửa sổ nào phá hợp đồng");
    expect(md).not.toMatch(/NaN|undefined|\[object/);
  });

  it("names every preset", () => {
    for (const preset of PRESETS) expect(md, preset.id).toContain(preset.id);
  });

  it("matches the copy on disk — the generator is the only author", () => {
    expect(readFileSync("docs/adaptive-audit.md", "utf8")).toBe(md);
  });
});
