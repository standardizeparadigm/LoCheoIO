/**
 * The mode chip — the bug in the round-10 screenshot, and the guard against it
 * coming back.
 *
 * The chip was centred on the mascot. In the row layout the mascot is the last
 * item of the row, so a centred chip of the longest mode name reached past the
 * hero's `overflow: hidden` and lost its right edge — border, padding and the end
 * of «MUỐI DƯA CỔ ĐIỂN». The classic mode was simply the one long enough to make
 * it obvious.
 *
 * These tests do not check a screenshot. They check the two properties that make
 * the screenshot impossible: the plan never claims a width it does not have, and
 * the only state that can overflow is the one that also says so.
 */
import { describe, expect, it } from "vitest";

import { charsThatFit, estimateText } from "../src/components/menu/adaptive/chip/measure";
import {
  chipBoxHeight,
  describeModeChip,
  planModeChip,
  CHIP_BORDER,
  CHIP_PAD_Y,
  MODE_CHIP_FLOOR,
  MODE_CHIP_LINE_HEIGHT,
  MODE_CHIP_NAME_FLOOR,
} from "../src/components/menu/adaptive/chip/modeChip";
import { PRESETS } from "../src/components/menu/adaptive/presets";
import { heroBandWidth } from "../src/components/menu/adaptive/hero";
import { MODE_LIST } from "../src/game/modes";
import { LANGUAGES, localeTable, type MessageKey } from "../src/i18n/i18n";

const LABEL = "CHẾ ĐỘ CHƠI";

/** Every (locale, mode) name the chip can ever be asked to print. */
const NAMES: Array<{ lang: string; id: string; name: string }> = [];
for (const lang of LANGUAGES) {
  const table = localeTable(lang);
  for (const mode of MODE_LIST) {
    const name = table[`mode.${mode.id}.name` as MessageKey];
    if (typeof name === "string" && name.length) NAMES.push({ lang, id: mode.id, name });
  }
}

describe("estimateText", () => {
  it("is total", () => {
    expect(estimateText("", 11)).toBe(0);
    expect(estimateText(null, 11)).toBe(0);
    expect(estimateText(undefined, 11)).toBe(0);
    expect(estimateText(42, 11)).toBe(0);
    expect(estimateText("ABC", Number.NaN)).toBe(0);
    expect(estimateText("ABC", 0)).toBe(0);
    expect(estimateText("ABC", -4)).toBe(0);
    expect(estimateText("ABC", 11, Number.NaN)).toBeGreaterThan(0);
  });

  it("grows with the text and with the size", () => {
    expect(estimateText("MÙA VÀNG", 11)).toBeGreaterThan(estimateText("MÙA", 11));
    expect(estimateText("MÙA VÀNG", 22)).toBeGreaterThan(estimateText("MÙA VÀNG", 11));
    expect(estimateText("", 11, 1)).toBe(0);
  });

  it("counts a wide glyph as wider than a narrow one", () => {
    expect(estimateText("MWM", 11)).toBeGreaterThan(estimateText("ili", 11));
    expect(estimateText("000", 11)).toBeGreaterThan(estimateText("...", 11));
  });

  it("treats Vietnamese with diacritics as its base letter", () => {
    // `Ế` is `E` plus a mark: the advance must not balloon.
    expect(estimateText("Ế", 11)).toBe(estimateText("E", 11));
    expect(estimateText("Ạ", 11)).toBe(estimateText("A", 11));
    expect(estimateText("ạ", 11)).toBe(estimateText("a", 11));
  });

  it("adds tracking per character", () => {
    const plain = estimateText("ABC", 11, 0);
    const tracked = estimateText("ABC", 11, 0.2);
    expect(tracked).toBeGreaterThan(plain);
    expect(tracked - plain).toBeCloseTo(0.2 * 3 * 11 * 1.06, 0);
  });
});

describe("charsThatFit", () => {
  it("returns 0 when nothing fits and everything when it all does", () => {
    expect(charsThatFit("MUỐI", 0, 11)).toBe(0);
    expect(charsThatFit("MUỐI", 10_000, 11)).toBe(4);
    expect(charsThatFit("", 100, 11)).toBe(0);
  });

  it("is monotone in width", () => {
    let last = 0;
    for (let w = 5; w <= 300; w += 5) {
      const n = charsThatFit("MUỐI DƯA CỔ ĐIỂN", w, 11);
      expect(n).toBeGreaterThanOrEqual(last);
      last = n;
    }
  });
});

describe("planModeChip — the guarantee", () => {
  it("never claims more width than the band has", () => {
    for (const preset of PRESETS) {
      const band = heroBandWidth(preset.width);
      for (const { name } of NAMES) {
        for (const side of ["right", "center"] as const) {
          const plan = planModeChip({ heroWidth: band, side, name, label: LABEL });
          if (!plan.visible) continue;
          expect(plan.maxWidth, `${preset.id} ${name}`).toBeLessThanOrEqual(plan.available);
          expect(plan.maxWidth + 2 * 8).toBeLessThanOrEqual(band);
        }
      }
    }
  });

  it("only lets the ellipsis state overflow", () => {
    for (const { name } of NAMES) {
      for (let band = 100; band <= 1200; band += 7) {
        const plan = planModeChip({ heroWidth: band, side: "right", name, label: LABEL });
        if (!plan.visible) continue;
        if (plan.truncated) continue;
        expect(plan.needed, `${band}px ${name}`).toBeLessThanOrEqual(plan.available);
      }
    }
  });

  it("aligns to the inner edge in the row layout, and centres otherwise", () => {
    const right = planModeChip({ heroWidth: 960, side: "right", name: "MÙA VÀNG", label: LABEL });
    const centre = planModeChip({ heroWidth: 960, side: "center", name: "MÙA VÀNG", label: LABEL });
    expect(right.align).toBe("end");
    expect(centre.align).toBe("center");
    expect(right.maxWidth).toBe(centre.maxWidth);
  });

  it("hides below the floor instead of returning a negative width", () => {
    for (const band of [0, 1, 40, 80, MODE_CHIP_FLOOR - 1, Number.NaN, -100, Infinity]) {
      const plan = planModeChip({ heroWidth: band, side: "right", name: "MÙA VÀNG", label: LABEL });
      expect(plan.visible, String(band)).toBe(false);
      expect(plan.maxWidth).toBe(0);
      expect(plan.reason).toBe("hidden");
    }
  });

  it("hides when there is no name to print", () => {
    expect(planModeChip({ heroWidth: 900, side: "right", name: "", label: LABEL }).visible).toBe(false);
    expect(planModeChip({ heroWidth: 900, side: "right", name: 42 as never, label: LABEL }).visible).toBe(false);
  });
});

describe("planModeChip — the ladder", () => {
  const plan = (band: number, name = "MUỐI DƯA CỔ ĐIỂN") =>
    planModeChip({ heroWidth: band, side: "right", name, label: LABEL });

  it("keeps the label on every window the app runs in, for the Vietnamese names", () => {
    /*
     * 320×480 is the smallest supported window; its band is 320 − 2×16 = 288.
     * The Vietnamese names are the shortest set, and they all keep the label
     * there — the three exceptions in the matrix are Spanish and French, and are
     * pinned in the last block.
     */
    for (const preset of PRESETS) {
      for (const mode of MODE_LIST) {
        const p = planModeChip({ heroWidth: heroBandWidth(preset.width), side: "right", name: mode.name, label: LABEL });
        expect(p.showLabel, `${mode.id} @ ${preset.id}`).toBe(true);
        expect(p.reason).toBe("full");
        expect(p.truncated).toBe(false);
      }
    }
  });

  it("drops the label before it touches the name", () => {
    const p = plan(260);
    expect(p.reason).toBe("label-dropped");
    expect(p.showLabel).toBe(false);
    expect(p.labelSize).toBe(0);
    expect(p.nameSize).toBe(11);
    expect(p.truncated).toBe(false);
  });

  it("shrinks the name only after the label is gone, and never below the floor", () => {
    let sawShrunk = false;
    for (let band = MODE_CHIP_FLOOR; band <= 400; band += 1) {
      const p = plan(band);
      if (p.reason === "name-shrunk") {
        sawShrunk = true;
        expect(p.showLabel).toBe(false);
        expect(p.nameSize).toBeGreaterThanOrEqual(MODE_CHIP_NAME_FLOOR);
        expect(p.nameSize).toBeLessThan(11);
      }
      if (p.reason === "ellipsis") {
        expect(p.nameSize).toBe(MODE_CHIP_NAME_FLOOR);
        expect(p.truncated).toBe(true);
      }
    }
    expect(sawShrunk).toBe(true);
  });

  it("is monotone: a wider band never picks a smaller chip", () => {
    const order = ["hidden", "ellipsis", "name-shrunk", "label-dropped", "full"];
    let last = 0;
    for (let band = 0; band <= 2000; band += 4) {
      const p = plan(band);
      if (!p.visible) continue;
      const step = order.indexOf(p.reason);
      expect(step, `${band}px went backwards`).toBeGreaterThanOrEqual(last);
      last = step;
    }
  });

  it("is deterministic", () => {
    const a = plan(512);
    const b = plan(512);
    expect(a).toEqual(b);
    expect(describeModeChip(a)).toBe(describeModeChip(b));
  });

  it("survives nonsense sizes", () => {
    for (const size of [Number.NaN, -3, 0, 1e9, Infinity]) {
      const p = planModeChip({ heroWidth: 800, side: "right", name: "MÙA VÀNG", label: LABEL, nameSize: size, labelSize: size });
      expect(p.visible).toBe(true);
      expect(Number.isFinite(p.nameSize)).toBe(true);
      expect(p.nameSize).toBeGreaterThan(0);
    }
  });
});

describe("the whole matrix of names and windows", () => {
  it("never ellipsises a name on a window the app supports", () => {
    /*
     * The reported bug, stated as an assertion: the chip must not have to cut a
     * name. `truncated` is the state that says it did, so it must be empty
     * everywhere — all nine modes, all seven locales, all twenty-one presets.
     */
    for (const preset of PRESETS) {
      const band = heroBandWidth(preset.width);
      for (const { lang, id, name } of NAMES) {
        const p = planModeChip({ heroWidth: band, side: "right", name, label: LABEL });
        expect(p.visible, `${lang} ${id} @ ${preset.id}`).toBe(true);
        expect(p.truncated, `${lang} ${id} @ ${preset.id}`).toBe(false);
      }
    }
  });

  it("keeps the label on the classic mode everywhere — the reported case", () => {
    const classic = NAMES.filter((n) => n.id === "classic");
    expect(classic.length).toBe(LANGUAGES.length);
    for (const preset of PRESETS) {
      const band = heroBandWidth(preset.width);
      for (const { lang, name } of classic) {
        const p = planModeChip({ heroWidth: band, side: "right", name, label: LABEL });
        expect(p.showLabel, `${lang} classic @ ${preset.id}`).toBe(true);
        expect(p.reason).toBe("full");
      }
    }
  });

  it("drops the label only where the name alone needs the band", () => {
    /*
     * On the smallest phone (320×480 → a 288px band) three translated names are
     * long enough that «CHẾ ĐỘ CHƠI» has to go: a Spanish «60 SEGUNDOS DE
     * LOCURA», a Spanish «LLUVIA DE ENCURTIDOS» and a French «FESTIVAL DES
     * COMBOS». The dot and the full name stay, and so do the button's title and
     * aria-label — which is the trade the ladder makes deliberately.
     *
     * Pinned rather than derived, because a translation landing in this list is
     * a decision worth looking at, not a test that should quietly adapt.
     */
    const band = heroBandWidth(320);
    const dropped = NAMES.filter(({ name }) => !planModeChip({ heroWidth: band, side: "right", name, label: LABEL }).showLabel)
      .map(({ lang, name }) => `${lang}:${name}`);
    expect(dropped).toEqual(["es:60 SEGUNDOS DE LOCURA", "es:LLUVIA DE ENCURTIDOS", "fr:FESTIVAL DES COMBOS"]);

    // …and in every one of them the name still fits without an ellipsis.
    for (const { name } of NAMES) {
      const p = planModeChip({ heroWidth: band, side: "right", name, label: LABEL });
      expect(p.truncated, name).toBe(false);
    }
  });

  it("has a name for all nine modes in all seven locales", () => {
    expect(NAMES.length).toBe(MODE_LIST.length * LANGUAGES.length);
  });
});

describe("describeModeChip", () => {
  it("says something useful in every state", () => {
    expect(describeModeChip(planModeChip({ heroWidth: 0, side: "right", name: "X", label: LABEL }))).toContain("hidden");
    for (const band of [200, 260, 320, 900]) {
      const line = describeModeChip(planModeChip({ heroWidth: band, side: "right", name: "MUỐI DƯA CỔ ĐIỂN", label: LABEL }));
      expect(line).not.toMatch(/NaN|undefined/);
      expect(line.length).toBeGreaterThan(20);
    }
  });
});

/*
 * The line box, and the neighbour it moves.
 *
 * Round 11's whole lesson: changing one box changes the numbers around it. The
 * chip's height is now a function, so the things that depend on it — the hero's
 * reserve, the diagnostics row — read it instead of guessing.
 */
describe("chipBoxHeight", () => {
  const plan = (band: number) => planModeChip({ heroWidth: band, side: "right", name: "MUỐI DƯA CỔ ĐIỂN", label: LABEL });

  it("is zero for a chip that is not drawn", () => {
    expect(chipBoxHeight(plan(40))).toBe(0);
  });

  it("is border + padding + one line, in every rung", () => {
    for (const band of [200, 240, 288, 320, 1088]) {
      const p = plan(band);
      const line = Math.max(8, p.nameSize * p.lineHeight);
      expect(chipBoxHeight(p), `band ${band}`).toBe(Math.ceil(2 * CHIP_BORDER + 2 * CHIP_PAD_Y + line));
    }
  });

  it("fits inside the mascot it is pinned to, on every preset", () => {
    // The chip is `absolute -bottom-1` inside a 128px stacked mascot box. A box
    // taller than that would poke out of the hero's clip the same way the name
    // used to poke out of its right edge.
    for (const preset of PRESETS) {
      if (preset.height < 480) continue; // chips are not drawn in the crop economy
      const h = chipBoxHeight(plan(heroBandWidth(preset.width)));
      expect(h, `${preset.id}`).toBeLessThanOrEqual(128);
    }
  });

  it("leaves room for a stacked tone mark above the cap height", () => {
    // 1.5em of line box at 11px is 16.5px. Bungee's caps are 0.78em (8.6px), so
    // 3.9px of the line box sits above them — more than the ~0.35em (3.85px) a
    // circumflex-plus-acute mark needs. Below 1.5 the tips are the first thing a
    // clip takes.
    expect(MODE_CHIP_LINE_HEIGHT).toBeGreaterThanOrEqual(1.45);
    const above = 11 * MODE_CHIP_LINE_HEIGHT - 11 * 0.78;
    expect(above).toBeGreaterThanOrEqual(11 * 0.35);
  });

  it("reports its own height in describeModeChip", () => {
    const p = plan(1088);
    expect(describeModeChip(p)).toContain(`box ${chipBoxHeight(p)}px`);
    expect(describeModeChip(p)).toContain(`/${MODE_CHIP_LINE_HEIGHT}`);
  });
});
