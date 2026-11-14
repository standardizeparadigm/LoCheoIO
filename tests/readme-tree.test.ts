/**
 * A README's project tree is prose that happens to be drawn, and it is the one
 * part of a document nobody re-reads once it looks right.
 *
 * `sync-prose-counts.mjs` rewrote three tree nodes in this repo:
 *
 *     │  └─ ui/          # 8 primitive, 48 file mỗi cái      ← was 1
 *     ├─ changelog/      # in-game changelog (tách từ 48 file) ← was 1
 *     │  ├─ entries/     #   48 file / 1 bản                  ← was 1
 *
 * Every one of them replaced "1 file" with the number of *test* files, because
 * the rule for "N files" prose matched the node description. The result read as
 * plausible for six rounds: `entries/` really does hold a bunch of files, so
 * "48 file / 1 bản" was wrong in a way that looked like a typo in the other
 * direction.
 *
 * The script now skips any line containing a box-drawing glyph. This file is
 * the independent check: it reads the tree and requires that a node which says
 * "1 file" actually describes a single file, and that no node claims a count
 * that matches the suite size.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const body = readFileSync("README.md", "utf8");
const treeLines = body.split("\n").filter((l) => /[│├└─]/.test(l));

describe("the project tree in README.md", () => {
  it("has tree lines to check at all", () => {
    expect(treeLines.length).toBeGreaterThan(20);
  });

  it("does not claim a node holds the number of test files", () => {
    /*
     * The specific corruption: the *suite's* file count was written into three
     * tree nodes that each describe one file. The `tests/` node is the one node
     * that legitimately states that number, so it is excluded by name rather
     * than the check being weakened — a node claiming "48 file" for `ui/` or
     * `changelog/` is the bug, and a node claiming it for `tests/` is the point.
     */
    for (const line of treeLines) {
      if (/[└├]─ tests\//.test(line)) continue;
      expect(line, `tree line claims the suite's file count: ${line.trim()}`).not.toMatch(
        /\b(48|95) file/,
      );
    }
  });

  it("keeps the three nodes that were corrupted saying `1 file`", () => {
    // Each is a directory containing one module or one concept per file.
    expect(body).toContain("8 primitive, 1 file mỗi cái");
    expect(body).toContain("tách từ 1 file");
    expect(body).toContain("1 file / 1 bản");
  });

  it("does not let the sync script touch tree lines", () => {
    /*
     * Reads the script rather than running it — running it needs a vitest pass
     * of its own. What matters is that the guard exists and is applied at the
     * same place the other line filters are.
     */
    const script = readFileSync("scripts/sync-prose-counts.mjs", "utf8");
    expect(script).toMatch(/const TREE = /);
    /*
     * Not the literal `PAST.test(line) || TREE.test(line)`: that conjunction
     * stopped being true when the guards became separate early returns, and a
     * test pinned to the spelling of a guard fails on every refactor while
     * missing the case where a *rule* is exempted from the guard entirely —
     * which is exactly what happened.
     */
    const loop = script.slice(script.indexOf("for (const { re, to, current } of RULES)"));
    const body = loop.slice(0, loop.indexOf("if (next !== body)"));
    expect(body).toMatch(/TREE\.test\(line\)/);
    expect(body).not.toMatch(/if \(!current\)/);
  });
});
