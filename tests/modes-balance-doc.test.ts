/**
 * `docs/design/modes-balance.md` opens with a nine-row table of every mode's
 * four multipliers and then says, in bold, that the table **must match**
 * `src/game/modes/*.ts`.
 *
 * Nothing checked that. Four rows had drifted — `zen` spawn, `goldrush` spawn,
 * `hardcore` was right, but `combo` and `feast` were wrong on three of four
 * columns each. The existing `modes-balance.test.ts` pins the *code*; this pins
 * the *document*, which is the version a reader who is tuning balance reads.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MODE_LIST } from "../src/game/modesIndex";

const doc = readFileSync("docs/design/modes-balance.md", "utf8");

/** "×0.85" → 0.85; "×0" → 0; "×1.0" → 1. */
const num = (cell: string) => Number(cell.replace("×", ""));

/** The four multiplier cells of the table row whose `id` column matches. */
function rowFor(id: string): string[] {
  const line = doc.split("\n").find((l) => l.includes(`\`${id}\``));
  expect(line, `no table row for ${id}`).toBeTruthy();
  const cells = line!.split("|").map((c) => c.trim());
  // | # | name | id | score | speed | hazard | spawn | knob |
  return cells.slice(4, 8);
}

describe("the modes-balance table matches the nine records", () => {
  it("has a row for every mode, in catalogue order", () => {
    const ids = [...doc.matchAll(/`([a-z]+)`/g)].map((m) => m[1]);
    const tableIds = MODE_LIST.map((m) => m.id);
    for (const id of tableIds) expect(ids).toContain(id);
  });

  it("prints the score multiplier each record actually has", () => {
    for (const m of MODE_LIST) {
      expect(num(rowFor(m.id)[0]), `${m.id} score`).toBeCloseTo(m.scoreMult, 2);
    }
  });

  it("prints the speed multiplier each record actually has", () => {
    for (const m of MODE_LIST) {
      expect(num(rowFor(m.id)[1]), `${m.id} speed`).toBeCloseTo(m.speedMult, 2);
    }
  });

  it("prints the hazard multiplier each record actually has", () => {
    for (const m of MODE_LIST) {
      expect(num(rowFor(m.id)[2]), `${m.id} hazard`).toBeCloseTo(m.hazardMult, 2);
    }
  });

  it("prints the spawn multiplier each record actually has", () => {
    // The four rows that had drifted were all in this column or the two beside
    // it; asserting all four columns separately names the wrong one when a
    // future edit breaks a single cell.
    for (const m of MODE_LIST) {
      expect(num(rowFor(m.id)[3]), `${m.id} spawn`).toBeCloseTo(m.spawnMult, 2);
    }
  });

  it("keeps the knob column describing the record it sits beside", () => {
    // A row can have the right four numbers and the wrong special-case note.
    const knobs: [string, string][] = [
      ["zen", "hazard tắt hẳn"],
      ["blitz", "timeLimit: 60"],
      ["goldrush", "goldMult: 2.6"],
      ["hardcore", "maxCracks: 1"],
      ["combo", "comboWindowMult: 2"],
      ["feast", "jarBonusMult: 2.5"],
    ];
    for (const [id, note] of knobs) {
      const line = doc.split("\n").find((l) => l.includes(`\`${id}\``))!;
      expect(line, `${id} knob`).toContain(note);
    }
  });
});

/*
 * `CONTRIBUTING.md` told a contributor to name the modes a balance change
 * affects, then listed five of them:
 *
 *     (Cổ điển / Thảnh Thơi / Ớt Lửa / Đua 60 Giây / Mùa Vàng)
 *
 * There are nine. A guide that defines the review surface as five modes tells
 * every future balance PR that the other four do not need mentioning — and the
 * four it omits are the recent ones, which are exactly the ones a new
 * contributor is least sure about.
 *
 * Worse, when the list was first extended it was extended with invented names
 * (`Bão Tố`, `Khắc Nghiệt`); the real ones are `Mưa Dưa` and `Gốm Mỏng`. So the
 * test compares against `vi.ts`, not against a hardcoded list here.
 */
describe("mode names wherever a document lists them", () => {
  const vi = readFileSync(join(__dirname, "../src/i18n/locales/vi.ts"), "utf8");
  const names = [...vi.matchAll(/"mode\.[a-z]+\.name":\s*"([^"]+)"/g)].map((m) => m[1]);

  it("reads nine names from the locale", () => {
    expect(names.length).toBe(9);
  });

  it("CONTRIBUTING.md lists all nine, spelled as the game spells them", () => {
    const guide = readFileSync(join(__dirname, "../CONTRIBUTING.md"), "utf8");
    /*  upper-cases these for display; a guide writes them as prose. */
    const missing = names.filter((n) => !guide.toLowerCase().includes(n.toLowerCase()));
    expect(missing, "mode names the guide omits").toEqual([]);
  });

  it("CONTRIBUTING.md names no mode that does not exist", () => {
    /*
     * The invented names are the reason for this direction. `Bão Tố` and
     * `Khắc Nghiệt` read like plausible Vietnamese mode names and nothing in the
     * repo contradicts them — unless you check the locale.
     */
    for (const invented of ["Bão Tố", "Khắc Nghiệt"]) {
      expect(guideText(), `"${invented}" is not a mode`).not.toContain(invented);
    }
  });

  function guideText(): string {
    return readFileSync(join(__dirname, "../CONTRIBUTING.md"), "utf8");
  }
});
