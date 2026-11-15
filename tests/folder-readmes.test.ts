/**
 * Every folder under `src/` that has a README must describe every file in it.
 *
 * This is the cheapest documentation test there is and it catches the failure
 * mode documentation actually has: not "nobody wrote a README", but "the README
 * was written once and four files landed afterwards". `src/game/README.md` was
 * missing `audio.ts`, `modeMath.ts`, `modeTypes.ts` and the barrel — including
 * the file a reader would follow the README specifically to find.
 *
 * The test is deliberately structural rather than semantic: it cannot tell
 * whether the description is *good*, only whether the file is mentioned at all.
 * That is enough, because a missing mention is always a mistake and a bad
 * mention is at least reviewable.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Directories under `src/` that carry a README. */
function foldersWithReadme(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (!statSync(path).isDirectory()) continue;
    if (statSync(join(path, "README.md"), { throwIfNoEntry: false })) out.push(path);
    out.push(...foldersWithReadme(path));
  }
  return out;
}

const FOLDERS = foldersWithReadme("src");

describe("folder READMEs cover their own contents", () => {
  it("finds at least ten documented folders", () => {
    // A canary: if the walk breaks, every case below passes vacuously.
    expect(FOLDERS.length).toBeGreaterThanOrEqual(10);
  });

  it("names every .ts/.tsx file in the folder", () => {
    const missing: string[] = [];
    for (const folder of FOLDERS) {
      const readme = readFileSync(join(folder, "README.md"), "utf8");
      const files = readdirSync(folder).filter(
        (f) => (f.endsWith(".ts") || f.endsWith(".tsx")) && !f.endsWith(".d.ts"),
      );
      for (const f of files) {
        // Match the filename or the stem, so `index.ts` can be described as
        // "the barrel" in prose while still being findable.
        const stem = f.replace(/\.(tsx?|test)$/, "");
        if (!readme.includes(f) && !readme.includes(stem)) missing.push(`${folder}/${f}`);
      }
    }
    expect(missing, `READMEs do not mention: ${missing.join(", ")}`).toEqual([]);
  });

  it("names every subfolder that carries its own README", () => {
    /*
     * A folder described in a parent README but with no path to its own is how
     * `panel/` ended up documented twice with different names for the same
     * concept.
     */
    const missing: string[] = [];
    for (const folder of FOLDERS) {
      const readme = readFileSync(join(folder, "README.md"), "utf8");
      for (const sub of readdirSync(folder)) {
        const subPath = join(folder, sub);
        if (!statSync(subPath).isDirectory()) continue;
        if (!statSync(join(subPath, "README.md"), { throwIfNoEntry: false })) continue;
        if (!readme.includes(`${sub}/`)) missing.push(`${folder} → ${sub}/`);
      }
    }
    expect(missing, `parent READMEs omit: ${missing.join(", ")}`).toEqual([]);
  });
});
