/**
 * Markdown tables fail loudly or not at all.
 *
 * `docs/releases/v1.1.8.md` shipped a row reading
 *
 *     | Test | 501 / 48 file | **828 / 77 file |
 *
 * — bold opened in the last cell and closed nowhere. The table *structure* was
 * fine (five pipes, three cells), so a column-count check passes; the damage is
 * inline, and it renders as a literal `**828 / 77 file` in the release notes for
 * the version about to ship. In a table row, CommonMark ends the paragraph at the
 * row boundary, so there is nothing later that could close it: an odd number of
 * `**` in one row is always wrong, never a bold that wraps.
 *
 * That is the rule this file enforces. It deliberately does not flag bold that
 * spans two *prose* lines — that is legal and appears 49 times.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const SKIP = new Set(["node_modules", ".git", "dist", "assets", "coverage"]);

function markdown(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) markdown(p, out);
    else if (p.endsWith(".md")) out.push(p);
  }
  return out;
}

const FILES = markdown(ROOT);

/** Table rows, with fenced code blocks and inline code spans removed. */
function tableRows(body: string): Array<{ row: string; line: number }> {
  const out: Array<{ row: string; line: number }> = [];
  let fence = false;
  body.split("\n").forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence;
      return;
    }
    if (fence || !/^\s*\|/.test(line)) return;
    // `**` inside a code span is a literal asterisk pair, not emphasis.
    out.push({ row: line.replace(/`[^`]*`/g, ""), line: i + 1 });
  });
  return out;
}

describe("markdown table rows", () => {
  it("close every bold they open", () => {
    const broken: string[] = [];
    for (const file of FILES) {
      for (const { row, line } of tableRows(readFileSync(file, "utf8"))) {
        const marks = (row.match(/\*\*/g) ?? []).length;
        if (marks % 2 === 1) {
          broken.push(`${file.replace(ROOT + "/", "")}:${line} ${row.trim().slice(0, 70)}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("keep a constant cell count across each table", () => {
    /*
     * A missing pipe turns a three-column row into two, which renders as a
     * shifted row rather than an error. Cheap to check, and it is the other
     * way a table silently loses a column.
     */
    const broken: string[] = [];
    for (const file of FILES) {
      const lines = readFileSync(file, "utf8").split("\n");
      let start = -1;
      let fence = false;
      const check = (from: number, to: number) => {
        if (to - from < 3) return;
        const cells = (l: string) => l.trim().replace(/\\\|/g, "").split("|").length;
        const want = cells(lines[from]);
        for (let i = from; i < to; i++) {
          if (cells(lines[i]) !== want) {
            broken.push(`${file.replace(ROOT + "/", "")}:${i + 1} ${lines[i].trim().slice(0, 60)}`);
          }
        }
      };
      lines.forEach((line, i) => {
        if (/^\s*(```|~~~)/.test(line)) {
          fence = !fence;
          return;
        }
        const isRow = !fence && /^\s*\|/.test(line);
        if (!isRow && start >= 0) {
          check(start, i);
          start = -1;
        } else if (isRow && start < 0) {
          start = i;
        }
      });
      if (start >= 0) check(start, lines.length);
    }
    expect(broken).toEqual([]);
  });

  it("scans every markdown file, not a hand-listed subset", () => {
    // 77 today; a floor so adding a document is allowed, deleting one is not.
    expect(FILES.length).toBeGreaterThanOrEqual(70);
    expect(FILES).toContain(join(ROOT, "docs/releases/v1.1.8.md"));
  });
});
