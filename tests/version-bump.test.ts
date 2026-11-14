import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { APP_VERSION } from "../src/version";

const root = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

describe("version coherence (release hygiene)", () => {
  it("APP_VERSION matches package.json", () => {
    const pkg = JSON.parse(read("package.json")) as { version: string };
    expect(APP_VERSION).toBe(pkg.version);
  });

  it("package-lock root version matches too", () => {
    const lock = JSON.parse(read("package-lock.json")) as {
      version?: string;
      packages: Record<string, { version?: string }>;
    };
    expect(lock.version).toBe(APP_VERSION);
    expect(lock.packages[""]?.version).toBe(APP_VERSION);
  });

  it("CHANGELOG.md documents the current version with a link definition", () => {
    const changelog = read("CHANGELOG.md");
    expect(changelog).toContain(`[${APP_VERSION}]`);
    expect(changelog).toMatch(new RegExp(`\\[${APP_VERSION.replace(/\./g, "\\.")}\\]: `));
  });

  it("every localized README badge advertises APP_VERSION", () => {
    const readmes = [
      "README.md", "README.en.md", "README.zh.md", "README.ja.md", "README.ko.md",
      "README.es.md", "README.fr.md", "README.th.md", "README.de.md", "README.pt.md",
    ];
    for (const file of readmes) {
      const s = read(file);
      expect(s, file).toContain(`version-${APP_VERSION}-`);
    }
  });

  it("release notes exist for the current version", () => {
    const s = read(`docs/releases/v${APP_VERSION}.md`);
    expect(s.length).toBeGreaterThan(500);
  });
});

/*
 * The list above covers package.json, the lockfile, CHANGELOG, the ten README
 * badges and the release notes. It does not cover the three places the version
 * is also written — and `docs/guides/release-process.md` step 4 lists all of
 * them as part of the bump:
 *
 *     `index.html` (<meta name="version">) · `scripts/play-linux.sh` ·
 *     `scripts/play-mac.command` · `scripts/play-windows.bat`
 *
 * A missed `index.html` ships a page that claims a version its own source does
 * not have; a missed launcher prints the old number in the terminal for anyone
 * running the game from a checkout. Both are silent: nothing reads these files
 * at build time, and the guide's instruction to "grep `1\.[0-7]` after the bump"
 * is a human step that a test can do instead.
 */
describe("version written outside the badge", () => {
  const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

  it("index.html declares the current version in its meta tag", () => {
    const html = read("index.html");
    const meta = /<meta\s+name="version"\s+content="([^"]+)"/.exec(html);
    expect(meta, "index.html has no <meta name=\"version\">").not.toBeNull();
    expect(meta![1]).toBe(APP_VERSION);
  });

  it.each([
    ["scripts/play-linux.sh"],
    ["scripts/play-mac.command"],
    ["scripts/play-windows.bat"],
  ])("%s prints the current version", (file) => {
    const body = read(file);
    /*
     * Match any SemVer in the file and require the current one among them,
     * rather than searching for APP_VERSION: a launcher stuck on 1.1.7 must
     * fail, and it can only fail if the test can see the wrong number.
     */
    /*
     * A launcher also contains a URL — `http://127.0.0.1:5173` — which is not a
     * version and must not be read as one. Versions start with the major the
     * app actually uses, so the scan is anchored there rather than to a bare
     * three-part number.
     */
    const major = APP_VERSION.split(".")[0];
    const versions = new Set(
      [...body.matchAll(new RegExp(`\\b${major}\\.\\d+\\.\\d+\\b`, "g"))].map((m) => m[0]),
    );
    expect([...versions], `${file} states ${[...versions].join(", ")}`).toContain(APP_VERSION);
    expect([...versions].filter((v) => v !== APP_VERSION)).toEqual([]);
  });

  it("leaves no 1.1.x string anywhere the bump is supposed to reach", () => {
    /*
     * The guide asks a human to grep for the old version after bumping. This is
     * that grep, restricted to files that carry the *current* release's number
     * rather than history: the launchers and the page itself.
     */
    const files = ["index.html", "scripts/play-linux.sh", "scripts/play-mac.command", "scripts/play-windows.bat"];
    const stale: string[] = [];
    for (const f of files) {
      for (const m of read(f).matchAll(/\b(1\.\d+\.\d+)\b/g)) {
        if (m[1] !== APP_VERSION) stale.push(`${f}: ${m[1]}`);
      }
    }
    expect(stale).toEqual([]);
  });
});
