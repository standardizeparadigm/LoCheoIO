/**
 * What the chip can be asked to print, in every language the app ships.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Four places asked a question of the form "does the chip fit?" and all four
 * answered it with a **hardcoded Vietnamese string**:
 *
 *     constraints.ts               const CHIP_LABEL = "CHẾ ĐỘ CHƠI"
 *     diagnostics.ts               const CHIP_LABEL = "CHẾ ĐỘ CHƠI"
 *     audit/audit.ts               const CHIP_LABEL = "CHẾ ĐỘ CHƠI"
 *     scripts/gen-regression-fixtures.ts   const CHIP_NAME = "MUỐI DƯA CỔ ĐIỂN"
 *
 * Four copies of a **translated** string is the round-12 bug again, one layer
 * down: a predicate written twice drifts. Here it does more than drift — it made
 * a shipped invariant false. Vietnamese is the *shortest* of the seven:
 *
 *     language   label             widest mode name
 *     vi         CHẾ ĐỘ CHƠI (11)  MUỐI DƯA CỔ ĐIỂN (19)
 *     es         MODOS DE JUEGO (14)   60 SEGUNDOS DE LOCURA (21)
 *     fr         MODES DE JEU (12)     FESTIVAL DES COMBOS (19)
 *
 * `chip-labelled` claimed "the chip keeps its label on every playable window"
 * and the audit reported 0 violations — while in Spanish the label is dropped at
 * 320px and 360px, and in French at 320px. Nothing could see it, because nothing
 * ever looked at a language other than the one in a string literal.
 *
 * So the probes live here, derived from the i18n table and `MODE_LIST` — not
 * typed into a test and not typed into four modules. A new mode, a new language
 * or a re-translation moves all of them at once, which is the point.
 */

import { localeTable, type Language } from "../../../../i18n/i18n";
import { MODE_LIST } from "../../../../game/modes";

/** Every language the app ships, in the order the language menu lists them. */
export const CHIP_LOCALES: readonly Language[] = ["vi", "en", "zh", "ja", "ko", "es", "fr"];

/** One language's chip strings. */
export interface ChipProbe {
  locale: Language;
  /** The «mode» label the chip prints, translated. */
  label: string;
  /** Every mode name the chip can be asked to print, translated. */
  names: readonly string[];
}

/** Every language's probe, `vi` first. */
export function chipProbes(): ChipProbe[] {
  return CHIP_LOCALES.map((locale) => {
    const table = localeTable(locale) as Record<string, string | undefined>;
    const label = table["game.modes"] ?? "";
    const names = MODE_LIST.map((mode) => table[`mode.${mode.id}.name`] ?? "").filter(
      (name) => name.length > 0,
    );
    return { locale, label, names };
  });
}

/** The longest string in a list, by UTF-16 length — the estimator's own unit. */
export function widestOf(strings: readonly string[]): string {
  return strings.reduce((best, s) => (s.length > best.length ? s : best), "");
}

/**
 * The probe that is hardest to fit: the widest label, then the widest name.
 *
 * Exactly one language wins, and it is *not* Vietnamese in the current table —
 * that is the finding, not an accident. Everything that measures "the chip"
 * without a language in hand (the audit, the diagnosis, the corpus generators)
 * uses this, so the number it prints is an upper bound over the app rather than
 * a fact about one translation.
 */
export function widestProbe(): ChipProbe {
  const probes = chipProbes();
  let best = probes[0];
  for (const probe of probes) {
    if (probe.label.length > best.label.length) best = probe;
  }
  return best;
}

/** The widest mode name across every language — the same literal, everywhere. */
export function widestChipName(): string {
  const best = widestProbe();
  return widestOf(best.names);
}

/**
 * The widest translation of **one** mode's name, across every language.
 *
 * The corpus generators walk `PRESETS × MODES` — a matrix of *modes*, not of
 * languages — so each row needs the worst translation of its **own** mode. The
 * global worst name would claim that `classic` prints «60 SEGUNDOS DE LOCURA».
 */
export function widestNameFor(modeId: string): string {
  const names = chipProbes()
    .map((probe) => (localeTable(probe.locale) as Record<string, string | undefined>)[`mode.${modeId}.name`] ?? "")
    .filter((name) => name.length > 0);
  return widestOf(names);
}

/** The widest label across every language. */
export function widestChipLabel(): string {
  return widestProbe().label;
}

/**
 * The probe for one language, or `undefined` if the app does not ship it.
 *
 * Used by the locale sweep in `tests/chip-locales.test.ts`, which is the test
 * that would have caught this: it walks every language rather than asserting
 * about the one in a constant.
 */
export function chipProbeFor(locale: Language): ChipProbe | undefined {
  return chipProbes().find((probe) => probe.locale === locale);
}
