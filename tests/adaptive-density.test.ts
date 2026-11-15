/**
 * `density.ts` — one table, two readers.
 *
 * The bug this file exists for is not in the table, it is in a *call*:
 * `GameMenu` and `InfoMenu` painted `cornerRowHeight(plan.dense, plan.tight)`
 * while the plan reserved `cornerRowReserve(dense, tight, ticker, compact)`.
 * On a compact window the panel was drawn 28px taller than the space reserved
 * for it, so it overlapped the ticker — the same class of defect as the
 * v1.1.7 screenshots, in a smaller size and with no test watching.
 *
 * So there are two halves here: the table is checked against the planner's own
 * arithmetic, and the *callers* are checked to go through it.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { planMenuLayout } from "../src/components/menu/layout";
import { cornerPanelHeight, cornerRowHeight } from "../src/components/menu/layout/metrics";
import type { MenuPlan } from "../src/components/menu/layout";
import {
  airier,
  chromeShare,
  denser,
  densityFor,
  metricsFor,
  panelHeightFor,
  panelHeightForPlan,
  panelWidthFor,
  reserveFor,
  type Density,
} from "../src/components/menu/adaptive/density";

const DENSITIES: Density[] = ["spacious", "comfortable", "compact", "tight", "minimal"];

describe("densityFor", () => {
  it("collapses the plan's three flags into the five reachable states", () => {
    expect(densityFor({ dense: true, tight: false, compact: false })).toBe("spacious");
    expect(densityFor({ dense: false, tight: false, compact: false })).toBe("comfortable");
    expect(densityFor({ dense: true, tight: false, compact: true })).toBe("compact");
    expect(densityFor({ dense: false, tight: true, compact: false })).toBe("tight");
    expect(densityFor({ dense: false, tight: true, compact: true })).toBe("minimal");
  });

  it("lets the tighter flag win, because that is the one that saves pixels", () => {
    // `dense` and `compact` together is a real plan (a wide, short window); the
    // row height has to follow the 34px that was reserved, not the 54px.
    const span = metricsFor(densityFor({ dense: true, tight: false, compact: true }));
    expect(span.richRowHeight).toBe(54);
    expect(span.rowHeight).toBe(34);
  });
});

describe("the table and the planner agree", () => {
  it("paints exactly what cornerPanelHeight says", () => {
    for (const density of DENSITIES) {
      const m = metricsFor(density);
      expect(panelHeightFor(density), density).toBe(
        cornerPanelHeight(m.rows, m.rich, m.tight, m.compact),
      );
      expect(panelHeightFor(density), density).toBe(cornerRowHeight(m.rich, m.tight, m.compact));
    }
  });

  it("reproduces the reserve of every plan in a 1 600-viewport sweep", () => {
    for (let w = 320; w <= 2600; w += 61) {
      for (let h = 240; h <= 1600; h += 47) {
        const plan = planMenuLayout({ width: w, height: h });
        const density = densityFor(plan);
        expect(reserveFor(density, plan.ticker, plan.footer), `${w}×${h}`).toBe(plan.reserve);
        expect(panelHeightForPlan(plan), `${w}×${h}`).toBe(
          cornerRowHeight(plan.dense, plan.tight, plan.compact),
        );
      }
    }
  });

  it("is the only way the two menus size their panel", () => {
    for (const file of ["src/components/menu/GameMenu.tsx", "src/components/menu/InfoMenu.tsx"]) {
      const src = readFileSync(file, "utf8");
      // The regression: a direct cornerRowHeight() call that forgot `compact`.
      expect(src, `${file} still calls cornerRowHeight`).not.toMatch(/cornerRowHeight\s*\(/);
      expect(src, `${file} must size from the plan`).toContain("panelHeightForPlan(plan)");
    }
  });
});

describe("the metrics table", () => {
  it("changes every dimension it promises to change", () => {
    const spacious = metricsFor("spacious");
    const minimal = metricsFor("minimal");
    expect(spacious.rowGap).toBeGreaterThan(minimal.rowGap);
    expect(spacious.panelPadding).toBeGreaterThan(minimal.panelPadding);
    expect(spacious.panelHeader).toBeGreaterThan(minimal.panelHeader);
    expect(spacious.iconSize).toBeGreaterThan(minimal.iconSize);
    expect(minimal.rowHeight).toBeLessThan(spacious.rowHeight);
  });

  it("never lets a panel be wider than the window", () => {
    for (let w = 200; w <= 2000; w += 7) {
      const width = panelWidthFor(w, "comfortable");
      expect(width, `${w}px window`).toBeLessThanOrEqual(w);
      expect(width).toBeGreaterThan(0);
    }
    expect(panelWidthFor(NaN, "comfortable")).toBeGreaterThan(0);
  });

  it("walks up and down the density ladder without falling off", () => {
    expect(airier("minimal")).toBe("tight");
    expect(airier("spacious")).toBe("spacious");
    expect(denser("spacious")).toBe("comfortable");
    expect(denser("minimal")).toBe("minimal");
  });

  it("reports what share of the window the chrome claims", () => {
    const plan: MenuPlan = planMenuLayout({ width: 1280, height: 720 });
    const share = chromeShare(plan);
    expect(share).toBeGreaterThan(0.3);
    expect(share).toBeLessThan(0.9);
    expect(Number.isFinite(chromeShare({ ...plan, scene: 0, reserve: 0 }))).toBe(true);
  });
});
