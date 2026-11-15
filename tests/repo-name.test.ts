/**
 * The project's own name, spelled one way.
 *
 * THE BUG
 * -------
 * The «GIỚI THIỆU» modal prints the source line from `about.source`, and every
 * locale printed `github.com/standardizeparadigm/Lo-CheoIO` — with a hyphen.
 * The repository is `LoCheoIO`. The same hyphen had spread into the ten README
 * CI badges, `package.json`'s `homepage` / `repository` / `bugs` URLs, the
 * CHANGELOG's link definitions and `.github/ISSUE_TEMPLATE/config.yml`, so the
 * *only* correct spelling in the repository was the git remote.
 *
 * A hyphen in a URL is not a 404 on GitHub — it redirects — which is exactly why
 * it survived: every link still worked, and the modal was the only place a
 * player would read the wrong name.
 *
 * What this file pins:
 *
 *   1. no tracked text file contains `Lo-CheoIO`;
 *   2. `about.source` in all seven locales names the canonical path;
 *   3. `package.json` and the README badges point at the same path;
 *   4. the repository name the app prints and the name it is hosted under agree.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import en from "../src/i18n/locales/en";
import es from "../src/i18n/locales/es";
import fr from "../src/i18n/locales/fr";
import ja from "../src/i18n/locales/ja";
import ko from "../src/i18n/locales/ko";
import vi from "../src/i18n/locales/vi";
import zh from "../src/i18n/locales/zh";

const CANONICAL = "github.com/standardizeparadigm/LoCheoIO";
const WRONG = "Lo-CheoIO";

/** Every text file a reader or a player can see, minus build output. */
function textFiles(dir = ".", out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", ".cache", "coverage"].includes(entry)) continue;
    const path = join(dir, entry);
    const st = statSync(path);
    if (st.isDirectory()) textFiles(path, out);
    else if (/\.(md|ts|tsx|json|ya?ml|html|mjs|sh|command|bat|svg|txt)$/.test(entry)) out.push(path);
  }
  return out;
}

const FILES = textFiles();

describe("the repository name", () => {
  it("is never spelled with a hyphen", () => {
    /*
     * This file is the one place the wrong spelling has to exist — it is the
     * pattern being searched for. Excluding it by path is honest; excluding it
     * by "skip tests/" would hide a real offender next door.
     */
    const offenders = FILES.filter(
      (f) => !f.endsWith("tests/repo-name.test.ts") && readFileSync(f, "utf8").includes(WRONG),
    );
    expect(offenders, `files still saying ${WRONG}`).toEqual([]);
  });

  it("is not lost in the sweep either — the canonical path is present", () => {
    // A canary: if the file walk breaks, the assertion above passes vacuously.
    expect(FILES.length).toBeGreaterThan(150);
    expect(FILES.some((f) => readFileSync(f, "utf8").includes(CANONICAL))).toBe(true);
  });
});

describe("the about modal's source line", () => {
  const LOCALES = { vi, en, zh, ja, ko, es, fr } as const;

  it("names the canonical repository in all seven locales", () => {
    for (const [lang, table] of Object.entries(LOCALES)) {
      const value = (table as Record<string, string>)["about.source"];
      expect(value, `${lang} has no about.source`).toBeTruthy();
      expect(value, `${lang}: ${value}`).toContain(CANONICAL);
      expect(value, `${lang}: ${value}`).not.toContain(WRONG);
    }
  });

  it("keeps each locale's own label for it", () => {
    // The fix is the URL, not the sentence: a translation that gets replaced by
    // the Vietnamese one is a different bug.
    expect(vi["about.source"].startsWith("Mã nguồn")).toBe(true);
    expect(en["about.source"].startsWith("Source")).toBe(true);
    expect(fr["about.source"].startsWith("Code")).toBe(true);
    expect(ja["about.source"].startsWith("ソース")).toBe(true);
  });
});

describe("the links that carry it", () => {
  it("package.json points at the canonical repository", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      homepage: string;
      repository: { url: string };
      bugs: { url: string };
    };
    expect(pkg.homepage).toBe(`https://${CANONICAL}`);
    expect(pkg.repository.url).toBe(`https://${CANONICAL}.git`);
    expect(pkg.bugs.url).toBe(`https://${CANONICAL}/issues`);
  });

  it("all ten READMEs badge the same CI workflow", () => {
    const readmes = readdirSync(".").filter((f) => /^README(\.[a-z]{2})?\.md$/.test(f));
    expect(readmes.length).toBe(10);
    for (const file of readmes) {
      const body = readFileSync(file, "utf8");
      expect(body, `${file}`).toContain(`https://${CANONICAL}/actions/workflows/ci.yml`);
    }
  });

  it("the changelog's link definitions resolve to the canonical repository", () => {
    const body = readFileSync("CHANGELOG.md", "utf8");
    const links = [...body.matchAll(/^\[(\d+\.\d+\.\d+)\]: (https:\/\/[^\s]+)$/gm)];
    expect(links.length).toBeGreaterThanOrEqual(10);
    for (const [, version, url] of links) {
      expect(url, `${version}`).toBe(`https://${CANONICAL}/releases/tag/v${version}`);
    }
  });
});
