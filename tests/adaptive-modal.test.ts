/**
 * `modalPlan.ts` — dialogs that fit the window they open in.
 *
 * The old constants were `max-h-[86vh]` and `max-w-md`, and both fail on the
 * screen the game is most likely to be opened on. `86vh` of a 390×844 phone is
 * 726px of panel with the keyboard up (about 300px usable), and `max-w-md` is
 * 448px on a 390px screen — wider than the display. This file sweeps 1 200
 * windows and asserts the properties a dialog actually needs.
 */
import { describe, expect, it } from "vitest";

import {
  MODAL_MIN_INSET,
  MODAL_TWO_COLUMN_MIN,
  MODAL_WIDTH,
  modalStyle,
  planModal,
} from "../src/components/ui/modalPlan";
import { boxOf } from "../src/components/menu/adaptive/viewport";

describe("planModal", () => {
  it("never exceeds the window, at any size", () => {
    for (let w = 240; w <= 3840; w += 57) {
      for (let h = 200; h <= 2160; h += 61) {
        const box = boxOf(w, h);
        const plan = planModal(box, true);
        expect(plan.maxWidth, `${w}×${h} width`).toBeLessThanOrEqual(w);
        expect(plan.maxHeight, `${w}×${h} height`).toBeLessThanOrEqual(h);
        expect(plan.maxWidth).toBeGreaterThanOrEqual(240);
        expect(plan.maxHeight).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the panel reachable with a keyboard open", () => {
    // 390×844 with a phone keyboard: ~300px of visible height.
    const plan = planModal(boxOf(390, 300), false);
    expect(plan.maxHeight).toBeLessThanOrEqual(300 - MODAL_MIN_INSET * 2 + 1);
  });

  it("downgrades two columns on a phone instead of squeezing them", () => {
    expect(planModal(boxOf(390, 844), true).columns).toBe(1);
    expect(planModal(boxOf(768, 1024), true).columns).toBe(2);
    expect(planModal(boxOf(1920, 1080), true).columns).toBe(2);
    // A narrow dialog stays one column even on a cinema display.
    expect(planModal(boxOf(3840, 2160), false).columns).toBe(1);
  });

  it("only asks for two columns when two readable columns fit", () => {
    for (const w of [320, 375, 414, 480, 560, 640, 768, 1024, 1920]) {
      const plan = planModal(boxOf(w, 900), true);
      if (plan.columns === 2) expect(plan.maxWidth).toBeGreaterThanOrEqual(MODAL_TWO_COLUMN_MIN);
    }
  });

  it("caps the width at the class it was asked for", () => {
    expect(planModal(boxOf(1920, 1080), false).maxWidth).toBe(MODAL_WIDTH.narrow);
    expect(planModal(boxOf(1920, 1080), true).maxWidth).toBe(MODAL_WIDTH.wide);
  });

  it("scales padding, gap and type with the window and floors them", () => {
    const phone = planModal(boxOf(360, 640), false);
    const cinema = planModal(boxOf(3840, 2160), false);
    expect(phone.padding).toBeLessThan(cinema.padding);
    expect(phone.bodySize).toBeLessThan(cinema.bodySize);
    expect(phone.padding).toBeGreaterThanOrEqual(8);
    expect(phone.titleSize).toBeGreaterThanOrEqual(11);
    for (const plan of [phone, cinema]) {
      for (const value of [plan.padding, plan.gap, plan.titleSize, plan.bodySize, plan.maxWidth, plan.maxHeight]) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  it("is total for a corrupt box", () => {
    const plan = planModal(boxOf(NaN, NaN), true);
    expect(plan.maxWidth).toBeGreaterThan(0);
    expect(plan.maxHeight).toBeGreaterThan(0);
    expect(Number.isFinite(plan.bodySize)).toBe(true);
  });

  it("hands the component a style object it can spread", () => {
    const style = modalStyle(planModal(boxOf(1280, 720), true));
    expect(style.width).toBe("100%");
    expect(style.maxWidth).toBeGreaterThan(240);
    expect(style.maxHeight).toBeLessThan(720);
  });
});
