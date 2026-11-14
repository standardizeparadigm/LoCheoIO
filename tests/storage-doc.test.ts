/**
 * `docs/guides/storage-keys.md` must list every key `STORAGE_KEYS` defines.
 *
 * The guide is the answer to "what does this app write to my machine", which is
 * the question a privacy-conscious player asks and the one a contributor asks
 * before adding a key. It was missing `locheo.muted.v1` — a key that `App.tsx`
 * writes every time `M` is pressed — while claiming to be a complete list.
 *
 * This is the same failure as the folder READMEs: the document was written once,
 * a key was added later, and nothing compared the two. Unlike the README case,
 * the cost here is a wrong belief about what the game stores.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { STORAGE_KEYS } from "../src/game/safeStorage";

const guide = readFileSync("docs/guides/storage-keys.md", "utf8");
const keys = Object.values(STORAGE_KEYS);

describe("the storage guide is complete", () => {
  it("has one table row per key", () => {
    const listed = [...guide.matchAll(/^\| `(locheo\.[a-z]+\.v1)`/gm)].map((m) => m[1]);
    expect(listed.sort()).toEqual([...keys].sort());
  });

  it("names no key that does not exist", () => {
    // A row for a deleted key is the other half of the same drift, and it makes
    // a reader hunt for a constant that was removed.
    const listed = new Set([...guide.matchAll(/`(locheo\.[a-z]+\.v1)`/g)].map((m) => m[1]));
    for (const k of listed) expect(keys, `${k} is documented but not defined`).toContain(k);
  });

  it("says the same number the code has", () => {
    // The doc says "8 key" in prose; that sentence must survive a key being
    // added, so it is checked rather than trusted.
    expect(guide).toContain(`Xoá đúng **${keys.length}** key`);
  });

  it("documents the muted key specifically", () => {
    // The one that was missing. Asserted by name because a count check alone
    // would pass if two keys were swapped.
    expect(guide).toContain("locheo.muted.v1");
    expect(guide).toMatch(/tắt tiếng|muted|mute/i);
  });

  it("claims no network traffic", () => {
    // The strongest statement in the file, and the one a reader checks first.
    expect(guide).toMatch(/không gửi byte nào lên mạng/);
  });
});
