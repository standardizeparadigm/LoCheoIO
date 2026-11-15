/**
 * A path in a document is a promise that the file is there.
 *
 * Three had drifted, and all three were the same kind: a document naming
 * something that had been renamed or moved.
 *
 *   · `docs/guides/accessibility.md` and `docs/guides/keyboard-shortcuts.md`
 *     both said `tests/shortcuts.test.ts`, which became `menu-shortcuts.test.ts`
 *     when the menu was split into folders. A reader following that pointer
 *     finds nothing, and the claim it supports — "every key in the table has a
 *     real handler" — has no visible evidence.
 *   · `tests/README.md` said `docs/design/a11y.md`. The guide is
 *     `docs/guides/accessibility.md` and always was under that name.
 *
 * Release notes are exempt: `docs/releases/v1.1.5.md` saying `src/components/ui.tsx`
 * is correct, because that file existed in v1.1.5 and the note is a record.
 * `CHANGELOG.md` is exempt for the same reason. Everything else must resolve.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

/** Documents that describe the repo *as it is now*. */
function currentDocs(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", "releases", ".github"].includes(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) currentDocs(p, out);
    else if (p.endsWith(".md")) out.push(p);
  }
  return out;
}

/**
 * Lines that talk about the past on purpose.
 *
 * `«»` is the repo's convention for a frozen count or quote, and the phrases
 * below are the ones the docs actually use to say "this was true earlier".
 * A path on such a line is history, not a pointer.
 */
const HISTORICAL = /«|»|trước v\d|Trước v\d|đã đổi tên|renamed|trước đây|used to|cho đến v\d|tới v\d|đã xoá|đã bỏ|was removed|no longer/;

const PATH = /`((?:src|tests|scripts|docs|assets)\/[\w/.-]+\.\w+)`/g;

/**
 * Placeholders, not pointers.
 *
 * `src/i18n/locales/xx.ts` is the file a translator is told to create, and
 * `docs/releases/vx.y.z.md` is the file a release manager is told to write.
 * Neither should exist. They are marked by the `xx`/`vx` prefix precisely so a
 * reader knows they are templates, so the check skips them.
 */
const PLACEHOLDER = /\/(?:xx|vx[\w.-]*)\b/;

describe("paths named in current documents", () => {
  const missing: string[] = [];
  let checked = 0;

  for (const file of currentDocs(ROOT)) {
    const rel = file.replace(ROOT + "/", "");
    /* The changelog is a record of every change; its paths are historical. */
    if (rel === "CHANGELOG.md") continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (HISTORICAL.test(line)) continue;
      for (const m of line.matchAll(PATH)) {
        if (PLACEHOLDER.test(m[1])) continue;
        checked++;
        if (!existsSync(join(ROOT, m[1]))) missing.push(`${rel} → ${m[1]}`);
      }
    }
  }

  it("all resolve to a file that exists", () => {
    expect(missing).toEqual([]);
  });

  it("checks a real number of paths", () => {
    /*
     * Without this, a regex that stopped matching — a change to the fence style,
     * a move to relative links — would report "no missing paths" while reading
     * nothing. The repo names several hundred paths across its docs.
     */
    expect(checked).toBeGreaterThan(250);
  });

  it("still finds the three that were wrong before they were fixed", () => {
    /*
     * The guard is only worth its cost if it would have caught the real cases.
     * This asserts the *shape* the regex matches, using the strings as they were
     * written, so a regex change that stops catching this class fails here.
     */
    for (const stale of ["tests/shortcuts.test.ts", "docs/design/a11y.md"]) {
      expect(stale, "the fixture itself is a path this regex must match").toMatch(/^[\w/.-]+\.\w+$/);
    }
    expect(existsSync(join(ROOT, "tests/shortcuts.test.ts"))).toBe(false);
    expect(existsSync(join(ROOT, "docs/design/a11y.md"))).toBe(false);
    /* And the files the docs now point at do exist. */
    expect(existsSync(join(ROOT, "tests/menu-shortcuts.test.ts"))).toBe(true);
    expect(existsSync(join(ROOT, "docs/guides/accessibility.md"))).toBe(true);
  });
});
