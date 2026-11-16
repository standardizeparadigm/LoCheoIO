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

/*
 * The "Hình ra đời" table is the other half of the same file, and it had the
 * opposite fault: a claim that silently stops covering everything.
 *
 *     | v1.1.8 | `layout-fix.svg` · `test-matrix.svg` |
 *
 * v1.1.7 shipped 14 SVGs; the folder holds 23. Nine arrived with v1.1.8 (six
 * diagrams, `adaptive-layers.svg` from round 8, `hud-bands.svg` from round 9,
 * `mode-chip.svg` from round 10, `diacritics-clip.svg` from round 11,
 * `adaptive-audit.svg` from round 12 and `adaptive-select.svg` from round 13)
 * and the row listed two of them, so six pictures — a third of that release's
 * artwork — had no row at all. Nobody notices an absent row: the table looks
 * complete because every line that is there is correct, and the sum is never
 * taken.
 */
describe("docs/assets.md, the 'Hình ra đời' table", () => {
  const body = readFileSync(join(ROOT, "docs/assets.md"), "utf8");
  const listed = new Set([...body.matchAll(/^\| v[\d.]+ \|(.+)$/gm)]
    .flatMap((m) => [...m[1].matchAll(/`([\w.-]+\.svg)`/g)].map((x) => x[1])));

  it("names every SVG in assets/", () => {
    const onDisk = readdirSync(join(ROOT, "assets")).filter((f) => f.endsWith(".svg"));
    expect(onDisk.length).toBe(27);
    const unlisted = onDisk.filter((f) => !listed.has(f));
    expect(unlisted, "SVGs with no release row").toEqual([]);
  });

  it("names nothing that is not there", () => {
    /*
     * A row can also lie in the other direction — a picture renamed or deleted
     * but still credited to a release.
     */
    const onDisk = new Set(readdirSync(join(ROOT, "assets")).filter((f) => f.endsWith(".svg")));
    const ghost = [...listed].filter((f) => !onDisk.has(f));
    expect(ghost).toEqual([]);
  });

  it("keeps the rows in release order", () => {
    const versions = [...body.matchAll(/^\| (v[\d.]+) \|/gm)].map((m) => m[1]);
    const sorted = [...versions].sort((a, b) =>
      a.slice(1).localeCompare(b.slice(1), undefined, { numeric: true }));
    expect(versions).toEqual(sorted);
    expect(versions[0]).toBe("v1.0.0");
  });
});
