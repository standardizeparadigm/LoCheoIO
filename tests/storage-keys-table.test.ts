/**
 * `docs/guides/storage-keys.md` is the document a user reads before wiping their
 * browser, and the one a contributor reads before adding a key.
 *
 * Three of its rows named a file that no longer holds the code:
 *
 *     | locheo.scores.v1 | storage.ts | …
 *
 * `storage.ts` became `storage/` in v1.1.8, and the three record modules moved
 * into it. The barrel re-exports everything, so nothing broke — the document
 * just pointed at the wrong file, and a reader following it to understand how
 * scores are written lands on a file that only re-exports.
 *
 * The table must also stay complete: a key in `STORAGE_KEYS` with no row is a key
 * nobody documents and nobody knows to clear.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const DOC = readFileSync(join(ROOT, "docs/guides/storage-keys.md"), "utf8");
const CODE = readFileSync(join(ROOT, "src/game/safeStorage.ts"), "utf8");

/** `key: "locheo.x.v1"` pairs from `STORAGE_KEYS`. */
const keys = [...CODE.matchAll(/(\w+): "(locheo\.[a-z]+\.v1)"/g)].map((m) => ({
  name: m[1],
  key: m[2],
}));

/** `| `locheo.x.v1` | `writer` | …` rows. */
const rows = [...DOC.matchAll(/^\| `(locheo\.[a-z]+\.v1)` \| `([^`]+)` \|/gm)].map((m) => ({
  key: m[1],
  writer: m[2],
}));

describe("docs/guides/storage-keys.md", () => {
  it("reads eight keys", () => {
    expect(keys.length).toBe(8);
  });

  it("documents every key the code defines", () => {
    const documented = new Set(rows.map((r) => r.key));
    const missing = keys.filter((k) => !documented.has(k.key)).map((k) => k.key);
    expect(missing, "keys with no row").toEqual([]);
  });

  it("documents no key the code does not define", () => {
    const defined = new Set(keys.map((k) => k.key));
    const ghost = rows.filter((r) => !defined.has(r.key)).map((r) => r.key);
    expect(ghost, "rows for keys that do not exist").toEqual([]);
  });

  it("names a writer file that exists", () => {
    const missing = rows
      .filter((r) => !existsSync(join(ROOT, "src/game", r.writer)) && !existsSync(join(ROOT, "src", r.writer)))
      .map((r) => `${r.key} → ${r.writer}`);
    expect(missing, "writer paths that do not resolve").toEqual([]);
  });

  it("points the three record modules at storage/, not the old file", () => {
    /*
     * The barrel `src/game/storage.ts` still exists and would satisfy a naive
     * existence check, which is exactly how these three stayed wrong: the path
     * resolves, it just is not where the code is.
     */
    for (const [key, module] of [
      ["locheo.scores.v1", "storage/scores.ts"],
      ["locheo.progress.v1", "storage/progress.ts"],
      ["locheo.achievements.v1", "storage/achievements.ts"],
    ] as const) {
      const row = rows.find((r) => r.key === key)!;
      expect(row.writer).toBe(module);
      expect(existsSync(join(ROOT, "src/game", module)), `${module} must exist`).toBe(true);
    }
    /* And the old single file must no longer be credited to any of them. */
    expect(rows.filter((r) => r.writer === "storage.ts")).toEqual([]);
  });
});
