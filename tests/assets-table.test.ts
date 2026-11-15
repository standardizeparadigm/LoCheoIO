/**
 * `docs/assets.md` says where each picture is used, and the column was fiction.
 *
 *     | `modes.svg`     | 9 chế độ chơi                 | README ×10 |
 *     | `new-modes.svg` | 2 chế độ mới của v1.1.4 (…)   | README ×10 |
 *
 * Neither is embedded in any README. They appear only inside the directory tree
 * that lists `assets/`, on a line that reads
 *
 *     │  ├─ modes.svg            # 9 chế độ chơi (SMIL animation)
 *
 * — a filename, not a picture. `divider.svg` was claimed at ×10 and is embedded
 * in nine: `README.en.md` mentions it in the tree and nowhere else.
 *
 * This column is not decorative. Someone deciding whether an asset is still
 * needed reads it; someone replacing a screenshot looks up which READMEs to
 * change. A ×10 that is really ×0 sends both of them to the wrong place.
 *
 * The check counts what a reader sees: a markdown `![](…)` or an `<img src>`,
 * not a mention of the filename.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const READMES = ["README.md", ...readdirSync(ROOT).filter((f) => /^README\.[a-z]{2}\.md$/.test(f))];

/** Markdown image or `<img src>` pointing at this asset. */
function embedded(body: string, file: string): boolean {
  return new RegExp(`!\\[[^\\]]*\\]\\([^)]*${file}\\)|<img[^>]+src="[^"]*${file}"`).test(body);
}

describe("docs/assets.md, the 'Dùng ở' column", () => {
  const bodies = READMES.map((f) => readFileSync(join(ROOT, f), "utf8"));
  const rows: Array<{ file: string; claimed: number }> = [];

  for (const line of readFileSync(join(ROOT, "docs/assets.md"), "utf8").split("\n")) {
    const row = /^\| `([\w.-]+\.svg)` \|[^|]*\|([^|]*)\|/.exec(line);
    if (!row) continue;
    const claim = /README\s*×\s*(\d+)/.exec(row[2]);
    if (claim) rows.push({ file: row[1], claimed: Number(claim[1]) });
  }

  it("states the number of READMEs that actually embed each picture", () => {
    const wrong: string[] = [];
    for (const { file, claimed } of rows) {
      const real = bodies.filter((b) => embedded(b, file)).length;
      if (real !== claimed) wrong.push(`${file}: says ×${claimed}, embedded in ${real}`);
    }
    expect(wrong).toEqual([]);
  });

  it("covers the whole table", () => {
    /* Thirteen rows carry a ×N claim; a regex that stopped matching would read as clean. */
    expect(rows.length).toBeGreaterThanOrEqual(13);
    expect(READMES.length).toBe(10);
  });

  it("would have caught the rows that were wrong", () => {
    /*
     * The two zero-claims are the reason the counter looks at embeds rather than
     * mentions: both files are named in all ten directory trees, so a `body.includes`
     * check would have agreed with the wrong ×10 in every README.
     */
    const fakeTree = "│  ├─ modes.svg            # 9 chế độ chơi (SMIL animation)";
    expect(embedded(fakeTree, "modes.svg"), "a tree mention is not an embed").toBe(false);
    expect(embedded('<img src="assets/modes.svg" alt="x">', "modes.svg")).toBe(true);
    expect(embedded("![modes](assets/modes.svg)", "modes.svg")).toBe(true);
    /* And divider.svg really is absent from the English README's embeds. */
    const en = readFileSync(join(ROOT, "README.en.md"), "utf8");
    expect(embedded(en, "divider.svg")).toBe(false);
    const vi = readFileSync(join(ROOT, "README.md"), "utf8");
    expect(embedded(vi, "divider.svg")).toBe(true);
  });
});
