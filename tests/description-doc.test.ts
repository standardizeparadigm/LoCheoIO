/**
 * `docs/DESCRIPTION.md` is the one document that says where its own text goes:
 *
 *     | Vị trí | Mục đích |
 *     | `package.json` → `description` | npm registry / GitHub detected description |
 *     | GitHub repo → About | … |
 *
 * It also prints a character count for every translation — "373 ký tự", "376
 * chars", "135 字符" — and those counts were exact, all six of them. Being exact
 * made them a trap: the counts were right while the thing they described was
 * wrong.
 *
 * `package.json` held 666 characters, not 373. Its first 372 were the official
 * Vietnamese text verbatim, and then it kept going: the language list, then the
 * whole 1.1.8 changelog — the hero fixes, the ticker, the fourteen decorations,
 * the declared heights. That string is what npm shows as this package's
 * description and what GitHub shows under the repository name, so the 1.1.8
 * release had shipped its release notes as its tagline.
 *
 * Two assertions, because there are two ways to get this wrong: the text can
 * drift from the document, and the document's own count can drift from the text.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const DOC = readFileSync(join(ROOT, "docs/DESCRIPTION.md"), "utf8");
const PKG = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
  description: string;
};

/** The first block quote under a heading — the Vietnamese original. */
function officialVietnamese(): string {
  return [...DOC.matchAll(/^> (.+)$/gm)][0][1];
}

describe("the project description", () => {
  it("is what package.json actually carries", () => {
    const official = officialVietnamese();
    expect(PKG.description).toBe(official);
  });

  it("is one line and reads like a tagline", () => {
    /*
     * A description that keeps going after its own full stop is a changelog
     * appended to a sentence — which is exactly how the 666-character one
     * looked, and why nobody spotted it: the sentence itself was correct.
     */
    expect(PKG.description).not.toContain("\n");
    expect(PKG.description.endsWith(".")).toBe(true);
    /*
     * "9 chế độ" · "16 thành tựu" · "TOP 8" — this text names counts inline, and
     * those are fine because they change per release, not per commit. What it
     * must not do is describe a *version*: a tagline cannot go stale if it never
     * mentions one.
     */
    expect(PKG.description).not.toMatch(/\bv?\d+\.\d+\.\d+\b/);
  });

  it("states a length that matches its own text", () => {
    /*
     * Every heading prints a count — Vietnamese in "ký tự", English in "chars",
     * Chinese in "字符", Japanese "文字", Korean "자", Spanish "caracteres",
     * French "caractères". Read the number, count the text, compare.
     */
    const lines = DOC.split("\n");
    const wrong: string[] = [];
    let heading = "";
    let sawQuote = false;
    for (const line of lines) {
      if (line.startsWith("## ")) {
        heading = line;
        sawQuote = false;
        continue;
      }
      if (!line.startsWith("> ") || sawQuote) continue;
      sawQuote = true;
      const claimed = /\(≈?\s*(\d+)\s*(?:ký tự|chars|字符|文字|자|caracteres|caractères|caracteres|Zeichen|ตัวอักษร|문자)\)/.exec(heading);
      if (!claimed) continue;
      const real = [...line.slice(2)].length;
      if (real !== Number(claimed[1])) {
        wrong.push(`${heading.slice(0, 40)}: claims ${claimed[1]}, text is ${real}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("covers all seven UI languages", () => {
    /* Seven locales ship; six translations plus the Vietnamese original. */
    const headings = [...DOC.matchAll(/^## (?:🇻🇳|🇬🇧|🇨🇳|🇯🇵|🇰🇷|🇪🇸|🇫🇷)/gm)];
    expect(headings.length).toBe(7);
  });
});

/*
 * The short About line is the one claim in this document that wraps. A wrapped
 * block quote is one paragraph, not two, and its length is the joined text —
 * counting the first line alone gives 1 character if the regex catches the
 * trailing `>` of the previous paragraph, which is how "164" survived while the
 * text was 162.
 */
describe("the GitHub About short form", () => {
  it("states its own length correctly, counting the joined paragraph", () => {
    const lines = DOC.split("\n");
    const claimedAt = lines.findIndex((l) => /\(\d+ ký tự\)/.test(l) && l.startsWith("> ("));
    expect(claimedAt).toBeGreaterThan(0);
    const claimed = Number(/\((\d+) ký tự\)/.exec(lines[claimedAt])![1]);

    /* Walk back over the contiguous `> ` lines above the count. */
    let i = claimedAt - 1;
    const parts: string[] = [];
    while (i >= 0 && lines[i].startsWith("> ")) {
      parts.unshift(lines[i].slice(2));
      i -= 1;
    }
    expect(parts.length).toBeGreaterThan(0);
    const real = [...parts.join(" ")].length;
    /* The prose joins with a space; the block quote may or may not. Allow one. */
    expect(Math.abs(real - claimed), `claims ${claimed}, text is ${real}`).toBeLessThanOrEqual(1);
  });
});

/*
 * The project has a name in two languages, and one of them drifted by a single
 * letter.
 *
 *     README.{en,de,pt,th}.md    "Pickled Jar Showdown"   (banner alt + About)
 *     docs/DESCRIPTION.md        "Pickle Jar Showdown"
 *
 * Seven places said "Pickled", one said "Pickle". The English README opens with
 * the phrase inside the `<img alt>` of the banner and again in the About block,
 * so a reader sees "Pickled" first and "Pickle" — if they ever opened the
 * description document at all — as a typo in a document they trust less. Names
 * are the kind of string nobody spell-checks because it looks like branding.
 */
describe("the project's English name", () => {
  it("is spelled the same way everywhere", () => {
    const CANON = "Pickled Jar Showdown";
    const files = [
      "docs/DESCRIPTION.md",
      "README.en.md",
      "README.de.md",
      "README.pt.md",
      "README.th.md",
    ];
    const wrong: string[] = [];
    for (const f of files) {
      const body = readFileSync(join(ROOT, f), "utf8");
      for (const m of body.matchAll(/Pickle(?!d) Jar Showdown/g)) wrong.push(`${f}: ${m[0]}`);
      /* It must appear at all, or "no mismatches" means "nothing was checked". */
      expect(body, `${f} never names the project`).toContain(CANON);
    }
    expect(wrong).toEqual([]);
  });
});
