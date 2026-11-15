import { describe, expect, it } from "vitest";

import * as utils from "../src/utils";
import * as i18n from "../src/i18n";
import * as game from "../src/game";
import * as modes from "../src/game/modes";
import * as howto from "../src/components/menu/howto";
import * as scene from "../src/components/menu/scene";

/*
 * Round 4 added a barrel to every folder that did not have one, so that a call
 * site can say `from "../utils"` and the folder's public surface is one file to
 * read. The risk of a barrel is that it silently rots — someone deletes a
 * helper and the re-export keeps pointing at a name that is no longer there, or
 * nobody ever imports through it and it becomes dead weight.
 *
 * These tests are cheap and they answer both: every re-export must resolve, and
 * every barrel must actually be used by at least one file outside itself.
 */

const BARRELS: Array<[string, string, Record<string, unknown>]> = [
  ["src/utils", "../src/utils", utils],
  ["src/i18n", "../src/i18n", i18n],
  ["src/game", "../src/game", game],
  ["src/game/modes", "../src/game/modes", modes],
  ["src/components/menu/howto", "../src/components/menu/howto", howto],
  ["src/components/menu/scene", "../src/components/menu/scene", scene],
];

describe("folder barrels", () => {
  it.each(BARRELS)("%s re-exports something", (_label, _path, mod) => {
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });

  it.each(BARRELS)("%s resolves every name it claims", async (_label, path, mod) => {
    for (const [name, value] of Object.entries(mod)) {
      expect(value, `${path} exports ${name} as undefined`).toBeDefined();
    }
  });

  it("does not re-export the locale files themselves", () => {
    // Importing a locale directly from a component bypasses the parity check.
    const keys = Object.keys(i18n);
    expect(keys).not.toContain("vi");
    expect(keys).not.toContain("locales");
  });

  it("keeps game/ free of React", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const dir = "src/game";
    const offenders = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(".ts"))
      .filter((e) => readFileSync(`${dir}/${e.name}`, "utf8").includes('from "react"'))
      .map((e) => e.name);
    expect(offenders).toEqual([]);
  });
});
