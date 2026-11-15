/**
 * `diagnose()` — the answer to "why does it look like that".
 *
 * A table of numbers answers *what*. The questions that arrive with a screenshot
 * are *why*: why is the ticker gone, why is the hero a row here and a column
 * 260px lower, why is this dialog one column. Each answer already existed in a
 * field; this file checks that `diagnose()` puts the right field next to the
 * right reason, in derivation order, and that `warningsFor()` names the
 * trade-offs rather than the defects.
 */
import { describe, expect, it } from "vitest";

import { diagnose, headline, renderDiagnosis, warningsFor } from "../src/components/menu/adaptive/diagnostics";
import { PRESETS, presetFor } from "../src/components/menu/adaptive/presets";
import { resolveForSize } from "../src/components/menu/adaptive/resolve";

const codes = (w: number, h: number) => warningsFor(resolveForSize(w, h)).map((x) => x.code);

describe("the headline", () => {
  it("reads as size · tier · density · hero · fit", () => {
    expect(headline(resolveForSize(1280, 720))).toBe("1280×720 · lg · comfortable · row · fit none");
    expect(headline(resolveForSize(844, 390))).toContain("minimal");
    expect(headline(resolveForSize(844, 390))).toContain("squeeze");
    // `crop` is reserved for windows shorter than floor + chrome, which no real
    // phone is — a 300px-tall browser window is.
    expect(headline(resolveForSize(1280, 300))).toContain("crop");
  });

  it("is finite for every preset, including the absurd ones", () => {
    for (const preset of PRESETS) {
      const line = headline(resolveForSize(preset.width, preset.height));
      expect(line).not.toMatch(/NaN|Infinity|undefined/);
      expect(line.split(" · ").length).toBe(5);
    }
  });
});

describe("the rows", () => {
  it("walks the eight layers in derivation order", () => {
    const d = diagnose(resolveForSize(1280, 720));
    expect(d.rows.map((r) => r.layer)).toEqual([
      "1 · box",
      "2 · tier",
      "3 · plan",
      "4 · density",
      "5 · hero",
      "6 · type",
      "7 · modal",
      "8 · board",
    ]);
  });

  it("pairs every value with a because", () => {
    for (const preset of PRESETS) {
      const d = diagnose(resolveForSize(preset.width, preset.height));
      for (const row of d.rows) {
        expect(row.value.length, `${preset.id} ${row.layer}`).toBeGreaterThan(2);
        expect(row.because.length, `${preset.id} ${row.layer}`).toBeGreaterThan(12);
        expect(row.because, `${preset.id} ${row.layer}`).not.toMatch(/NaN|undefined/);
      }
    }
  });

  it("names the reason the hero is a row, a stack or minimal", () => {
    expect(diagnose(resolveForSize(1920, 1080)).rows[4].because).toContain("clears the row floor");
    expect(diagnose(resolveForSize(844, 390)).rows[4].because).toContain("minimal");
    expect(diagnose(resolveForSize(1000, 900)).rows[4].because).toContain("1024px row floor");
  });

  it("says which cap decided the wordmark", () => {
    // A phone is width-limited (the clamp has not reached its ceiling yet)…
    expect(diagnose(resolveForSize(360, 640)).rows[5].because).toContain("width");
    // …and every window tall enough to hit the 89.5px cap is band-limited,
    // even a 4K one, because the cap is the band's own maximum.
    expect(diagnose(resolveForSize(1920, 400)).rows[5].because).toContain("band");
    expect(diagnose(resolveForSize(3840, 2160)).rows[5].because).toContain("band");
  });

  it("explains the dialog's column count", () => {
    expect(diagnose(resolveForSize(390, 844)).rows[6].because).toContain("two-column floor");
    const big = diagnose(resolveForSize(1920, 1080));
    expect(big.rows[6].value).toContain("col");
  });
});

describe("the warnings", () => {
  it("calls a cropped hero a trade-off, with the shortfall in pixels", () => {
    const w = warningsFor(resolveForSize(1280, 300));
    const crop = w.find((x) => x.code === "crop");
    expect(crop).toBeTruthy();
    expect(crop!.message).toMatch(/\d+px shorter/);
  });

  it("reports the economies a small window pays for and a desktop does not", () => {
    expect(codes(320, 480)).toContain("no-ticker");
    expect(codes(320, 480)).toContain("no-footer");
    expect(codes(844, 390)).toContain("minimal");
    expect(codes(1280, 300)).toContain("crop");
    const desktop = codes(1920, 1080);
    for (const code of ["crop", "no-ticker", "no-footer", "minimal"]) {
      expect(desktop, code).not.toContain(code);
    }
  });

  it("notices stacked panels, a floor-sized jar, a cramped dialog and the safe-area inset", () => {
    expect(codes(390, 844)).toContain("panels-stacked");
    expect(codes(320, 480)).toContain("dialog-compact");
    const notched = resolveForSize(844, 390, { dpr: 3, insetTop: 44, insetBottom: 34, pointer: "coarse", reducedMotion: false, orientation: "landscape" } as never);
    expect(warningsFor(notched).map((x) => x.code)).toContain("inset");
    expect(warningsFor(resolveForSize(320, 320)).map((x) => x.code)).toContain("jar-at-floor");
  });

  it("gives every warning a stable code and a sentence", () => {
    for (const preset of PRESETS) {
      for (const warn of warningsFor(resolveForSize(preset.width, preset.height))) {
        expect(warn.code, preset.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        expect(warn.message.length, `${preset.id} ${warn.code}`).toBeGreaterThan(20);
      }
    }
  });

  it("is empty on the reference window", () => {
    expect(codes(1280, 720)).toEqual([]);
  });
});

describe("the rendered report", () => {
  it("starts with the headline and lists the trade-offs", () => {
    const text = renderDiagnosis(resolveForSize(1568, 677));
    const lines = text.split("\n");
    expect(lines[0]).toBe(headline(resolveForSize(1568, 677)));
    expect(text).toContain("trade-offs:");
    expect(text).toContain("↳");
    for (const preset of PRESETS) {
      const report = renderDiagnosis(resolveForSize(preset.width, preset.height));
      expect(report, preset.id).not.toMatch(/NaN|undefined/);
    }
  });

  it("says so when there is nothing to trade", () => {
    expect(renderDiagnosis(resolveForSize(1280, 720))).toContain("this window gets the full layout");
  });

  it("is what the debugging guide tells you to run", () => {
    expect(presetFor("720p")).toBeTruthy();
  });
});
