/**
 * `docs/guides/storage-keys.md` opens with "Toàn bộ key `localStorage` của Lọ
 * Chéo" — *every* key — and prints a table of eight.
 *
 * That claim is only true by luck. A ninth key added to `STORAGE_KEYS` would
 * appear in the app, in `clearAllGameKeys()`, and in nothing else: the guide
 * would keep saying "every key", a reader resetting their browser would miss
 * one, and the only symptom would be a setting that never clears.
 *
 * So the document is checked against the constant, in both directions:
 *
 *   · every key in `STORAGE_KEYS` is listed in the table
 *   · every `locheo.*` key in the table exists in `STORAGE_KEYS`
 *
 * The second direction matters more than it looks: a key that was renamed
 * leaves the table describing something that is no longer written, which reads
 * as documentation of a feature that was removed.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { STORAGE_KEYS } from "../src/game/safeStorage";

const DOC = "docs/guides/storage-keys.md";
const body = readFileSync(DOC, "utf8");

describe("storage-keys.md describes every key the game writes", () => {
  it("lists each key in STORAGE_KEYS", () => {
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      expect(body, `${name} → ${key} is not in the table`).toContain(`\`${key}\``);
    }
  });

  it("names no key that the game does not write", () => {
    /*
     * Pull every `locheo.<something>` out of the document and require it to be
     * a current key. `locheo.run.v1` and friends appear in prose as well as in
     * the table, so this is a whole-file check, which is the stricter form.
     */
    const named = new Set(
      [...body.matchAll(/`(locheo\.[a-z0-9.]+)`/g)].map((m) => m[1]),
    );
    expect(named.size).toBeGreaterThan(0);
    const current = new Set<string>(Object.values(STORAGE_KEYS));
    for (const key of named) {
      expect(current.has(key), `${DOC} names ${key}, which nothing writes`).toBe(true);
    }
  });

  it("says eight keys, and eight is what there are", () => {
    // The sentence "Xoá đúng 8 key của game" is a promise about clearAllGameKeys.
    expect(body).toContain("**8**");
    expect(Object.keys(STORAGE_KEYS)).toHaveLength(8);
  });

  it("uses the v1 suffix on every key, so no key can silently shadow a v2", () => {
    // The .v1 suffix is the migration contract: a schema change writes .v2 and
    // reads .v1 only to migrate. A key without a suffix breaks that.
    for (const key of Object.values(STORAGE_KEYS)) {
      expect(key, key).toMatch(/^locheo\.[a-z]+\.v\d+$/);
    }
  });
});
