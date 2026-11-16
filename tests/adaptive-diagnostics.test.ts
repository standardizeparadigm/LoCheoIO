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
import { DESKTOP_ENVIRONMENT } from "../src/components/menu/adaptive/environment";
import { explainHold, sameRung } from "../src/components/menu/adaptive/hysteresis";

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
  it("walks the ten unconditional layers in derivation order", () => {
    /*
     * Round 15 added `10 · prefs`, and an `11 · repair` row that only exists on a
     * profile the hook painted — `resolveAdaptive()` never walks the ladder, so a raw
     * profile has no rung and inventing one would be a diagnosis of something that
     * did not happen.
     */
    const d = diagnose(resolveForSize(1280, 720));
    expect(d.rows.map((r) => r.layer)).toEqual([
      "1 · box",
      "2 · tier",
      "3 · plan",
      "4 · density",
      "5 · hero",
      "6 · type",
      "7 · modal",
      "8 · chip",
      "9 · board",
      "10 · prefs",
    ]);
  });

  it("reports the repair rung only when there is one", () => {
    const raw = diagnose(resolveForSize(1280, 720));
    expect(raw.rows.map((r) => r.layer)).not.toContain("11 · repair");

    const repaired = diagnose({ ...resolveForSize(1280, 720), repair: { rung: "as-planned", ok: true } });
    const row = repaired.rows.find((r) => r.layer === "11 · repair");
    expect(row?.value).toBe("as-planned");
    expect(row?.because).toContain("no lever pulled");

    const failed = diagnose({ ...resolveForSize(1280, 720), repair: { rung: "smallest-type", ok: false } });
    expect(failed.rows.find((r) => r.layer === "11 · repair")?.value).toBe("smallest-type · FAILED");
  });

  it("explains a held frame as layer 12, and only when one was held", () => {
    /*
     * Same rule as `11 · repair`: a hold is a runtime fact, so a raw profile has no
     * row. When it does have one, the row has to name *both* rungs — "held" alone
     * would tell a reviewer that the layout is stale without saying what it is
     * stale against.
     */
    /* Find a width where one pixel really does change the rung. */
    let width = 0;
    for (let w = 400; w < 1900 && !width; w += 1) {
      if (!sameRung(resolveForSize(w, 720), resolveForSize(w + 1, 720))) width = w;
    }
    expect(width, "a rung boundary exists at 720px").toBeGreaterThan(0);
    const previous = resolveForSize(width, 720);
    const candidate = resolveForSize(width + 1, 720);
    expect(sameRung(previous, candidate)).toBe(false);

    const held = diagnose({
      ...previous,
      held: explainHold(previous, candidate),
    });
    const row = held.rows.find((r) => r.layer === "12 · hold");
    expect(row).toBeDefined();
    expect(row?.value).toContain("band 2px");
    expect(row?.because).toContain("held");
    expect(row?.because).toContain("instead of");
    expect(row?.because).toContain("early");
    expect(held.rows.at(-1)?.layer).toBe("12 · hold");

    /* A profile that was not held never grows the row. */
    expect(diagnose(previous).rows.map((r) => r.layer)).not.toContain("12 · hold");
  });

  it("says why the animation stopped", () => {
    const reduced = diagnose(resolveForSize(1280, 720, { ...DESKTOP_ENVIRONMENT, reducedMotion: true, moreContrast: true }));
    const row = reduced.rows.find((r) => r.layer === "10 · prefs");
    expect(row?.value).toBe("motion reduced · contrast more");
    expect(row?.because).toContain("OS asked for less motion");
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

  it("says which rung of the chip ladder this window is on", () => {
    // The round-10 bug, in the tool a screenshot review runs first.
    expect(diagnose(resolveForSize(1280, 720)).rows[7].value).toContain("full");
    expect(diagnose(resolveForSize(1280, 720)).rows[7].because).toContain("right-aligned");
    const tiny = diagnose(resolveForSize(320, 320));
    expect(tiny.rows[7].value).not.toMatch(/NaN|undefined/);
    expect(diagnose(resolveForSize(200, 400)).rows[7].value).toMatch(/hidden|label-dropped|name-shrunk|ellipsis|full/);
  });

  it("explains the dialog's column count", () => {
    expect(diagnose(resolveForSize(390, 844)).rows[6].because).toContain("two-column floor");
    const big = diagnose(resolveForSize(1920, 1080));
    expect(big.rows[6].value).toContain("col");
  });
});

describe("the warnings", () => {
  it("names the box that overruns, and says it can be reached", () => {
    /*
     * Round 14: the message said "hero is cropped". The hero is exactly the box
     * that is *not* cropped — `fit: "crop"` clamps it at its 140px floor and
     * lets the column overrun, so the player loses the bottom of the chrome.
     */
    const w = warningsFor(resolveForSize(1280, 300));
    const crop = w.find((x) => x.code === "crop");
    expect(crop).toBeTruthy();
    expect(crop!.message).toMatch(/\d+px past floor \+ chrome/);
    expect(crop!.message).toContain("reachable by scrolling");
    expect(crop!.message).not.toContain("hero is cropped");
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
