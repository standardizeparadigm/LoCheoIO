/**
 * The glossary's technical table must name things that exist.
 *
 * Two failure modes for a glossary, and this file covers both:
 *
 *   1. a term that no longer exists (the `deck`/`stage` case) — those are marked
 *      *deleted* in the doc, and the test permits them only if the row says so;
 *   2. a term that exists but is described with a word the code does not use,
 *      which sends a reader grepping for something that is not there.
 *
 * The game-vocabulary half (lọ chéo, hứng) is not checked: it is content, not
 * identifiers, and translating it is the point.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const guide = readFileSync("docs/guides/glossary.md", "utf8");

/** All TypeScript source, concatenated — grep is the point, not parsing. */
function allSource(dir: string): string {
  let out = "";
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out += allSource(path);
    else if (/\.(ts|tsx)$/.test(name)) out += readFileSync(path, "utf8");
  }
  return out;
}
const src = allSource("src");

describe("technical terms name real identifiers", () => {
  const terms = [
    "planMenuLayout",
    "MenuPlan",
    "scene",
    "reserve",
    "economy",
    "chrome",
    "wordmark",
    "slam",
    "challenge",
    "tipIndexFor",
    "tierFor",
    "itemsVi",
  ];

  it("every live term appears in src/", () => {
    for (const term of terms) {
      expect(src, `glossary names ${term}, which is not in src/`).toContain(term);
    }
  });

  it("the glossary mentions each of them", () => {
    for (const term of terms) {
      expect(guide, `glossary omits ${term}`).toContain(term);
    }
  });
});

describe("deleted things are marked as deleted", () => {
  /*
   * The changelog entries are the record of what *was* deleted, so they are
   * allowed to name deleted things — that is the whole point of an entry. Only
   * live code is checked.
   */
  const liveSrc = src.replace(/\/\*[\s\S]*?\*\//g, "");

  it("marks deck as removed", () => {
    // The row is a table cell: `| **deck** | ... — **đã bị xoá** ở vòng 6. ...|`
    expect(guide).toMatch(/\*\*deck\*\*[\s\S]{0,200}?đã bị xoá/);
    // And it must not exist, or the marking is wrong.
    expect(liveSrc).not.toMatch(/MenuDeck|data-deck-cell/);
  });

  it("marks stage as removed", () => {
    expect(guide).toMatch(/\*\*stage\*\*[\s\S]{0,200}?đã bị xoá/);
    // `StageFacts` survives only as a *string inside changelog prose*, which is
    // history. A live import or JSX use would be the bug.
    expect(liveSrc).not.toMatch(/from ["'][./]*stage\//);
    expect(liveSrc).not.toMatch(/<StageFacts/);
  });
});

describe("the three confusable pairs are stated", () => {
  it("separates plan from state", () => {
    expect(guide).toContain("plan ≠ state");
  });

  it("separates scene from hero", () => {
    expect(guide).toContain("scene ≠ hero");
  });

  it("separates chrome from panel", () => {
    expect(guide).toContain("chrome ≠ panel");
    // The claim has a mechanism: pointer-events on the band.
    expect(src).toContain("pointer-events-none");
  });
});
