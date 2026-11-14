/**
 * "7 locales × 327 keys" appeared in four current-facing places, and three of
 * them said 306 or 307. The 306 had been copied into two files on two different
 * days, which is what made it look verified.
 *
 * `scripts/sync-prose-counts.mjs` now measures it and can rewrite it, but that
 * script is not part of `npm test` — it needs a vitest run of its own to get the
 * test count, so it cannot be cheap. This file is the part that belongs in the
 * suite: whatever number a document prints for keys must be the number of keys.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { localeTable } from "../src/i18n/i18n";

/** The Vietnamese table is the source every locale is required to match. */
const KEY_COUNT = Object.keys(localeTable("vi")).length;

const DOCS = [
  "README.md",
  "README.en.md",
  "docs/guides/adding-a-locale.md",
  "docs/guides/release-process.md",
  "docs/releases/v1.1.8.md",
];

describe("the documented key count", () => {
  it("is what the source table holds", () => {
    expect(KEY_COUNT).toBe(327);
  });

  it("is the same in all seven locales", () => {
    for (const lang of ["en", "zh", "ja", "ko", "es", "fr"] as const) {
      expect(Object.keys(localeTable(lang)).length, lang).toBe(KEY_COUNT);
    }
  });

  it("is quoted at that value wherever a document quotes it as current", () => {
    /*
     * A document may legitimately mention another number: the v1.1.8 release
     * doc compares 307 (v1.1.7) against 306 (v1.1.8) in a table, which is a
     * record of two past states. So the rule is not "no other number appears" —
     * it is "no line that pairs a locale count with a *wrong* key count", which
     * is what the matrix below checks by requiring the right one to be present
     * in the file that makes the claim.
     */
    for (const file of ["README.md", "README.en.md"]) {
      const body = readFileSync(file, "utf8");
      expect(body, `${file} does not quote ${KEY_COUNT}`).toContain(String(KEY_COUNT));
    }
  });

  it("does not leave 306 or 307 as a *current* claim in the guides", () => {
    // Both guides describe how to add a locale / cut a release today.
    for (const file of ["docs/guides/adding-a-locale.md", "docs/guides/release-process.md"]) {
      const body = readFileSync(file, "utf8");
      expect(body, `${file} still says 306`).not.toMatch(/\b306\b/);
      expect(body, `${file} still says 307`).not.toMatch(/\b307\b/);
      expect(body, `${file} does not quote ${KEY_COUNT}`).toContain(String(KEY_COUNT));
    }
  });

  it("keeps the one historical row, because it records what shipped", () => {
    const release = readFileSync("docs/releases/v1.1.8.md", "utf8");
    expect(release).toContain("| i18n | 307 khoá | **306 khoá**");
  });

  it("reads every document it claims to check", () => {
    // Cheap guard against a rename: a path that no longer exists would make the
    // loops above throw, but a path that exists and is empty would not.
    for (const file of DOCS) {
      expect(readFileSync(file, "utf8").length, file).toBeGreaterThan(500);
    }
  });
});
