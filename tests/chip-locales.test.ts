/**
 * The chip, in all seven languages.
 *
 * The bug this file exists to prevent was not a wrong number — it was a wrong
 * *quantifier*. Four modules measured the chip with a hardcoded Vietnamese string
 * (`const CHIP_LABEL = "CHẾ ĐỘ CHƠI"`, `const CHIP_NAME = "MUỐI DƯA CỔ ĐIỂN"`), so
 * every chip promise the project made was really a promise about the shortest of
 * its seven translations:
 *
 *     language   label                widest mode name
 *     vi         CHẾ ĐỘ CHƠI      (11)  MUỐI DƯA CỔ ĐIỂN     (19)
 *     es         MODOS DE JUEGO  (14)  60 SEGUNDOS DE LOCURA (21)
 *     fr         MODES DE JEU    (12)  FESTIVAL DES COMBOS   (19)
 *
 * `chip-labelled` said "the chip keeps its label on every playable window" and
 * the audit reported **0 violations**, while Spanish drops the label at 320px and
 * 360px and French at 320px. Nothing could see it: the contract, the diagnosis,
 * the census and the corpus all asked the same one-language question.
 *
 * So this file asks it seven times, and it derives the strings from the i18n table
 * rather than typing them — a re-translation has to move the tests too, which is
 * the point. `src/components/menu/adaptive/chip/probes.ts` is the single
 * definition; everything else reads it.
 */
import { describe, expect, it } from "vitest";

import {
  CHIP_LOCALES,
  MODE_CHIP_FLOOR,
  MODE_CHIP_WANT,
  chipProbeFor,
  chipProbes,
  estimateText,
  planModeChip,
  widestChipLabel,
  widestChipName,
  widestOf,
  widestProbe,
} from "../src/components/menu/adaptive/chip";
import { heroBandWidth } from "../src/components/menu/adaptive/hero";
import { PRESETS } from "../src/components/menu/adaptive/presets";
import { violations } from "../src/components/menu/adaptive/constraints";
import { resolveForSize } from "../src/components/menu/adaptive/resolve";
import { chipRungFor } from "../src/components/menu/adaptive/audit";
import { localeTable } from "../src/i18n/i18n";
import { MODE_LIST } from "../src/game/modes";

describe("the probes are derived, not typed", () => {
  it("carries one probe per shipped language", () => {
    expect(chipProbes().map((p) => p.locale)).toEqual([...CHIP_LOCALES]);
    expect(CHIP_LOCALES).toHaveLength(7);
  });

  it("reads the label from the i18n table", () => {
    for (const probe of chipProbes()) {
      const table = localeTable(probe.locale) as Record<string, string | undefined>;
      expect(probe.label, probe.locale).toBe(table["game.modes"]);
      expect(probe.label.length, probe.locale).toBeGreaterThan(0);
    }
  });

  it("reads every mode name from the i18n table, in MODE_LIST order", () => {
    for (const probe of chipProbes()) {
      const table = localeTable(probe.locale) as Record<string, string | undefined>;
      expect(probe.names.length, probe.locale).toBe(MODE_LIST.length);
      probe.names.forEach((name, i) => {
        expect(name, `${probe.locale}/${MODE_LIST[i].id}`).toBe(table[`mode.${MODE_LIST[i].id}.name`]);
      });
    }
  });

  it("has no empty string in any language", () => {
    for (const probe of chipProbes()) {
      for (const name of probe.names) expect(name.trim().length, probe.locale).toBeGreaterThan(0);
    }
  });
});

describe("the worst case is not Vietnamese", () => {
  /*
   * The claim that made the old constants look safe. If Vietnamese ever becomes
   * the widest language, this test fails — and that would be the moment to
   * re-read the comment at the top of `probes.ts`, not to delete the assertion.
   */
  it("is wider than vi in both the label and the name", () => {
    const vi = chipProbeFor("vi")!;
    const worst = widestProbe();
    expect(worst.locale).not.toBe("vi");
    expect(widestChipLabel().length).toBeGreaterThan(vi.label.length);
    expect(widestChipName().length).toBeGreaterThan(widestOf(vi.names).length);
  });

  it("is Spanish today, at 14 characters of label over 21 of name", () => {
    expect(widestProbe().locale).toBe("es");
    expect(widestChipLabel()).toBe("MODOS DE JUEGO");
    expect(widestChipName()).toBe("60 SEGUNDOS DE LOCURA");
  });
});

describe("the promise, in every language", () => {
  /**
   * The band a preset gives the chip. Sweeping presets — not a synthetic grid — so
   * a failure names a device: `iphone-4`, `ipad-portrait`.
   */
  const bands = PRESETS.map((p) => ({ id: p.id, band: heroBandWidth(p.width) }));

  it("never ellipsises a mode name", () => {
    for (const { id, band } of bands) {
      for (const probe of chipProbes()) {
        for (const name of probe.names) {
          const plan = planModeChip({ heroWidth: band, side: "right", name, label: probe.label });
          expect(plan.truncated, `${probe.locale} «${name}» at ${id}`).toBe(false);
        }
      }
    }
  });

  it("drops the label only where the full-size chip cannot fit", () => {
    for (const { id, band } of bands) {
      for (const probe of chipProbes()) {
        for (const name of probe.names) {
          const plan = planModeChip({ heroWidth: band, side: "right", name, label: probe.label });
          if (!plan.visible || plan.showLabel) continue;
          const withLabel =
            2 * 15 + 16 + 8 + // chrome, dot, gap — the planner's own numbers
            estimateText(probe.label, MODE_CHIP_WANT.labelSize, MODE_CHIP_WANT.labelTracking) +
            estimateText(name, MODE_CHIP_WANT.nameSize, MODE_CHIP_WANT.nameTracking);
          expect(withLabel, `${probe.locale} «${name}» at ${id} drops the label early`).toBeGreaterThan(
            plan.available,
          );
        }
      }
    }
  });

  it("keeps the name at its design size whenever the label is gone", () => {
    for (const { id, band } of bands) {
      for (const probe of chipProbes()) {
        for (const name of probe.names) {
          const plan = planModeChip({ heroWidth: band, side: "right", name, label: probe.label });
          if (plan.showLabel) continue;
          expect(plan.nameSize, `${probe.locale} «${name}» at ${id}`).toBe(MODE_CHIP_WANT.nameSize);
        }
      }
    }
  });

  it("records the Spanish and French label drops as facts, not surprises", () => {
    /*
     * The finding, pinned. Spanish loses the label on the two narrowest bands and
     * French on one; Vietnamese loses it on none. If a future layout change makes
     * the label survive at 288px in Spanish, this test fails and the fix should be
     * celebrated — by updating the numbers, not by deleting them.
     */
    const losing = (locale: "vi" | "es" | "fr") => {
      const probe = chipProbeFor(locale)!;
      return PRESETS.filter((preset) => {
        const band = heroBandWidth(preset.width);
        return probe.names.some(
          (name) => !planModeChip({ heroWidth: band, side: "right", name, label: probe.label }).showLabel,
        );
      }).map((p) => p.id);
    };
    expect(losing("vi")).toEqual([]);
    expect(losing("es").length).toBeGreaterThan(0);
    expect(losing("fr").length).toBeGreaterThan(0);
    expect(losing("fr").length).toBeLessThanOrEqual(losing("es").length);
  });
});

describe("the contract agrees with the sweep", () => {
  it("is not vacuous: a sub-floor window is caught", () => {
    /* 200px is not a playable window; it is the probe that proves the check runs. */
    const p = resolveForSize(200, 640);
    expect(violations(p).map((v) => v.id)).toContain("chip-labelled");
  });

  it("holds on every preset in every language", () => {
    for (const preset of PRESETS) {
      const broken = violations(resolveForSize(preset.width, preset.height));
      expect(broken.map((b) => b.id), preset.id).toEqual([]);
    }
  });

  it("peeks at the chip the same way the audit does", () => {
    /*
     * `chipRungFor()` is the audit's single definition, and it must use the same
     * worst-case probe — otherwise the census and the contract answer different
     * questions, which is exactly the round-12 failure one layer down.
     */
    for (const preset of PRESETS) {
      const rung = chipRungFor(resolveForSize(preset.width, preset.height));
      if (rung === "hidden") continue;
      const band = heroBandWidth(preset.width);
      const expected = planModeChip({
        heroWidth: band,
        side: "right",
        name: widestChipName(),
        label: widestChipLabel(),
      }).reason;
      expect(rung, preset.id).toBe(expected);
    }
  });

  it("still hides the chip where the band is below its floor", () => {
    /*
     * `MODE_CHIP_FLOOR` is 108px of band, and a 120px window leaves 88: the chip
     * is not rendered at all. (200px leaves 168, so the chip *is* rendered there —
     * with the label gone and the name shrunk, which is the double sacrifice
     * `chip-labelled` catches.)
     */
    const tiny = resolveForSize(120, 640);
    expect(heroBandWidth(120)).toBeLessThan(MODE_CHIP_FLOOR);
    expect(chipRungFor(tiny)).toBe("hidden");
  });
});
