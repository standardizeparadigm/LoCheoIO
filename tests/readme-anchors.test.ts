/**
 * A table of contents is a promise that the heading is there.
 *
 * Ten READMEs each start with a row of badge links, and every one of them
 * pointed at least one link at a heading that did not exist:
 *
 *     README.en.md  (#-production-build)   heading: ### Production build
 *     README.de.md  (#-produktions-build)  heading: ### Produktions-Build
 *     README.zh.md  (#-生产构建)            heading: ### 生产构建
 *     …
 *
 * The pattern is visible in the failure: a leading hyphen with no emoji to
 * justify it. GitHub turns `## 🚀 Install & run` into `#-install--run` — the
 * emoji is dropped and its space becomes a hyphen — so the heading that *does*
 * start with an emoji needs the hyphen. Someone copied that shape onto headings
 * that have no emoji, and a link that scrolls nowhere looks exactly like a link
 * that works until you click it.
 *
 * The comment count is the same story one level up: `README.md` linked to
 * `#-changelog-chia-tầng` while the heading continues `— mỗi tầng một màu`. Both
 * survive because nobody clicks a badge.
 *
 * So the slugs are computed here exactly as GitHub computes them, and every
 * in-page anchor has to match a heading.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

/**
 * GitHub's heading anchor rule, as far as this repo's headings exercise it.
 *
 * Lowercase; drop emoji and symbols; drop punctuation; spaces become hyphens.
 * `\p{M}` must stay in the keep-set or every Thai heading is destroyed —
 * `ติดตั้ง` is base characters plus combining marks, and stripping the marks
 * turns a valid slug into a different string that matches nothing. That mistake
 * is why this test first reported three Thai anchors as broken when they were
 * fine, and the process of disproving it is the reason the fix above is only
 * ten lines rather than thirteen.
 */
function slug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, "")
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

const READMES = ["README.md", ...readdirSync(ROOT).filter((f) => /^README\.[a-z]{2}\.md$/.test(f))];

describe("in-page anchors in the READMEs", () => {
  const broken: string[] = [];
  let checked = 0;

  for (const name of READMES) {
    const body = readFileSync(join(ROOT, name), "utf8");
    const headings = new Set([...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => slug(m[1])));
    for (const m of body.matchAll(/\]\(#([^)\s]+)\)/g)) {
      const anchor = m[1];
      checked++;
      if (headings.has(anchor) || headings.has(decodeURIComponent(anchor))) continue;
      broken.push(`${name} → #${decodeURIComponent(anchor)}`);
    }
  }

  it("all resolve to a heading in the same file", () => {
    expect(broken).toEqual([]);
  });

  it("checks every README", () => {
    /* Ten translations; a missing one means the glob broke, not that it is fine. */
    expect(READMES.length).toBe(10);
    expect(checked).toBeGreaterThanOrEqual(34);
  });

  it("computes the slug GitHub computes for the headings that were already right", () => {
    /*
     * Without these, a slug function that returns "" for everything would make
     * "no broken anchors" vacuous. Each of these four resolves today and must
     * keep resolving — they are the controls that prove the algorithm.
     */
    expect(slug("🚀 Install & run")).toBe("-install--run");
    expect(slug("🏷️ Changelog chia tầng — mỗi tầng một màu")).toBe(
      "-changelog-chia-tầng--mỗi-tầng-một-màu",
    );
    expect(slug("Production build")).toBe("production-build");
    expect(slug("📦 Releases & changelog")).toBe("-releases--changelog");
    /* The Thai case the keep-set exists for: marks survive. */
    expect(slug("🚀 ติดตั้ง & เริ่มเล่น")).toBe("-ติดตั้ง--เริ่มเล่น");
  });
});
