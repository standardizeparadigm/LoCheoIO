/**
 * The directory tree in the READMEs is a claim about the filesystem.
 *
 * Three entries in it were wrong, in a section headed "Dự án lại tách thêm thư
 * mục" — a diagram whose entire purpose is to show where things moved:
 *
 *     ├── ticker/   strings.ts · tickerTone.ts · MenuTicker
 *     └── deck/     daily.ts · tip.ts · MenuDeck
 *
 * `strings.ts` and `tickerTone.ts` do not exist; the module holds `keys.ts` and
 * `MenuTicker.tsx`. And `deck/` was deleted with the deck strip in v1.1.8 — the
 * same release the diagram documents — so the README showed a folder that the
 * changelog three sections above says was removed. All nine translations carried
 * the same three errors, because the tree is translated by copying the shape.
 *
 * A tree is browsed, not read, which is why this survives: nobody follows
 * `deck/daily.ts` from a diagram; they scan for their area and move on.
 *
 * This test resolves every entry against `src/components/menu/`.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const MENU = join(ROOT, "src/components/menu");

/**
 * Pull `name` entries out of one tree line and resolve them.
 *
 * `├── ticker/   keys.ts · MenuTicker   ← NEW: …` yields `["keys.ts", "MenuTicker"]`
 * from the segment before the arrow. Entries ending in a known extension are
 * files; bare capitalised names are components, so `.tsx` is tried as well.
 */
function unresolvedIn(line: string, dir: string): string[] {
  const body = line.split("←")[0];
  const after = body.replace(/^[├└─\s│]+/, "").replace(/^[\w./-]+\s+/, "");
  const entries = after.split("·").map((s) => s.trim()).filter(Boolean);
  const base = join(MENU, dir);
  return entries.filter((entry) => {
    const candidates = [join(base, entry), join(base, `${entry}.ts`), join(base, `${entry}.tsx`)];
    return !candidates.some((c) => existsSync(c));
  });
}

describe("the src/components/menu tree in README.md", () => {
  const body = readFileSync(join(ROOT, "README.md"), "utf8");
  const start = body.indexOf("src/components/menu/");
  const block = body.slice(start, body.indexOf("```", start));
  const lines = block.split("\n").filter((l) => /^[├└]/.test(l));

  it("names only folders that exist", () => {
    const missing: string[] = [];
    for (const line of lines) {
      const dir = /^[├└]── ([\w./-]+)\//.exec(line)?.[1];
      if (!dir) continue;
      if (!existsSync(join(MENU, dir))) missing.push(`${dir}/`);
    }
    expect(missing, "folders shown in the tree that do not exist").toEqual([]);
  });

  it("names only files that exist inside them", () => {
    const missing: string[] = [];
    for (const line of lines) {
      const dir = /^[├└]── ([\w./-]+)\//.exec(line)?.[1];
      if (!dir) continue;
      for (const entry of unresolvedIn(line, dir)) missing.push(`${dir}/${entry}`);
    }
    expect(missing, "files shown in the tree that do not exist").toEqual([]);
  });

  it("parses the whole tree", () => {
    /* Six folders, then one line naming the two loose component files. */
    expect(lines.length).toBeGreaterThanOrEqual(7);
    const dirs = lines.filter((l) => /^[├└]── [\w./-]+\//.test(l)).length;
    expect(dirs).toBeGreaterThanOrEqual(6);
  });

  it("does not resurrect the two names that were wrong", () => {
    expect(existsSync(join(MENU, "deck"))).toBe(false);
    expect(existsSync(join(MENU, "ticker/strings.ts"))).toBe(false);
    expect(existsSync(join(MENU, "ticker/keys.ts"))).toBe(true);
  });

  it("keeps the nine translations in step", () => {
    /*
     * All nine carried the same errors because the tree is copied, not
     * rewritten. The fix is checked here so a future edit to one language does
     * not have to be repeated by hand nine times.
     */
    const stale: string[] = [];
    for (const f of ["README.de.md", "README.en.md", "README.es.md", "README.fr.md",
      "README.ja.md", "README.ko.md", "README.pt.md", "README.th.md", "README.zh.md"]) {
      const t = readFileSync(join(ROOT, f), "utf8");
      if (t.includes("tickerTone.ts")) stale.push(`${f}: tickerTone.ts`);
      if (/^[├└]── deck\//m.test(t)) stale.push(`${f}: deck/`);
    }
    expect(stale).toEqual([]);
  });
});
