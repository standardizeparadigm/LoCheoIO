/**
 * The release guide forbids one specific thing, and nothing enforced it.
 *
 * `docs/guides/release-process.md` says, in a paragraph with a scar behind it:
 *
 *     **Đừng chép số test vào đây.** Câu cũ ghi "393 tests" và đúng vào lúc
 *     viết; ba vòng sau nó sai và không ai đọc lại.
 *
 * The rule was written after 393 was copied into the notes and then went stale.
 * It was never applied to the changelog that ships to players: `v1_1_8.ts`
 * claimed "test tăng từ 286 lên 308 trên 36 file" for a release whose suite was
 * 993 across 99 files. The arithmetic was right at the moment of writing — 286
 * plus whatever landed — which is exactly the failure mode the guide describes.
 *
 * A total is not a fact about a release the way "the deck was removed" is. It is
 * a measurement that changes every time anyone writes a test, and a changelog
 * cannot be edited after it ships. So the newest entry states *what* landed and
 * lets `npm run check:readme` print the total.
 *
 * Scoped to the entry under construction, not the whole history: v1.1.5 and
 * v1.1.6 predate the rule and their numbers are the record of what those
 * releases contained.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = join(__dirname, "..", "src/game/changelog/entries");
const ENTRIES = readdirSync(DIR).filter((f) => /^v\d.*\.ts$/.test(f));

/** The highest version — the one whose release notes are still being written. */
const NEWEST = ENTRIES.sort((a, b) =>
  a.localeCompare(b, undefined, { numeric: true }),
).at(-1)!;

const BODY = readFileSync(join(DIR, NEWEST), "utf8");

describe("the newest changelog entry", () => {
  it("is the entry this rule is about", () => {
    expect(NEWEST).toMatch(/^v\d/);
    // Sanity: the file must actually hold item strings, or the scan is vacuous.
    expect(BODY).toMatch(/itemsVi:\s*\[/);
    expect(BODY.split("\n").length).toBeGreaterThan(40);
  });

  it("states no suite-wide totals", () => {
    /*
     * A per-module count ("the ticker module; 8 tests") is a fact about that
     * module — it does not move when someone else adds a test, so it can ship.
     * A suite total ("308 across 36 files", "304 keys") moves with every commit,
     * and a changelog cannot be edited after release.
     *
     * The shapes below are the ones that name a suite rather than a module: a
     * count attached to `file(s)`, a count introduced by "from X to Y", and the
     * two patterns this repo has actually used for the whole suite.
     */
    const found: string[] = [];
    const SUITE = [
      /\b\d{1,3}\s+files?\b/gi,
      /test tăng từ\s+\d+/gi,
      /suite grows from\s+\d+/gi,
      /\b\d{3,4}\s+(?:unit\s+)?tests?\b/gi,
      /\b\d{3}\s+(?:i18n\s+)?(?:keys?|khoá)\b/gi,
    ];
    for (const re of SUITE) {
      for (const m of BODY.matchAll(re)) found.push(m[0]);
    }
    expect(found).toEqual([]);
  });

  it("keeps every per-module count it does state", () => {
    /*
     * Not vacuous: the entry does state module counts, and they are the part
     * that must survive. If a future cleanup removes them all, this fails and
     * says so rather than passing because nothing was there to check.
     */
    const perModule = [...BODY.matchAll(/;\s*(\d{1,3}) tests?\b/gi)];
    expect(perModule.length).toBeGreaterThanOrEqual(8);
  });

  it("keeps the guide and the entry in agreement", () => {
    const guide = readFileSync(join(__dirname, "..", "docs/guides/release-process.md"), "utf8");
    /* If someone deletes the rule from the guide, this file says why it exists. */
    expect(guide).toMatch(/Đừng chép số test/);
    expect(guide).toMatch(/check:readme/);
  });
});

/*
 * `tests/README.md` — the README inside the suite — opened with
 * "**904 tests / 84 files**" while the suite ran 997 across 100. It sat three
 * hundred tests stale in the one file a reader is most likely to open when
 * asking how big the suite is, because the sweep only ever looked at the READMEs
 * in the repository root and this one is a level down.
 *
 * The count is read from the badge, which `npm run sync:badge` generates from a
 * real `vitest run`; asserting against a literal here would make this file the
 * next thing to go stale.
 */
describe("tests/README.md", () => {
  const body = readFileSync(join(__dirname, "README.md"), "utf8");
  const badge = /badge\/tests-(\d+)%20%C2%B7%20(\d+)%20files/.exec(
    readFileSync(join(__dirname, "..", "README.md"), "utf8"),
  );

  it("states the suite size the badge states", () => {
    expect(badge).not.toBeNull();
    const [, tests, files] = badge!;
    expect(body).toContain(`**${tests} tests / ${files} files.**`);
  });

  it("states no other test total", () => {
    /*
     * Historical numbers are quoted with «», the convention the rest of the
     * docs use for "this was true then" — so anything outside guillemets that
     * looks like a total has to be the current one.
     */
    const bare = body.replace(/«[^»]*»/g, "").replace(/`[^`]*`/g, "");
    const totals = [...bare.matchAll(/\b(\d{3,4}) tests?\b/gi)].map((m) => m[1]);
    for (const t of totals) expect(Number(t)).toBe(Number(badge![1]));
  });
});
