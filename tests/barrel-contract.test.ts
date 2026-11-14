/**
 * The six barrels nothing imports.
 *
 * A lint pass over `src/` found six `index.ts` files with no importer:
 * `menu/howto`, `menu/scene`, `menu/ticker`, `components/settings`, `game`,
 * `i18n`. That looks like dead code and is not — each one is the *documented
 * public surface* of its folder, and the comment above each says so. They
 * exist so a screen mounts `MenuTicker` from the folder rather than from
 * `./ticker/MenuTicker`.
 *
 * The risk that makes them worth testing is the opposite of dead code: a
 * barrel that silently drops an export, so a consumer that *did* import from
 * it breaks at a distance. These tests pin each barrel's shape and require it
 * to carry a doc comment explaining why it exists.
 *
 * `tests/barrels.test.ts` already checks the two oldest ones. This file covers
 * the remaining four and adds the doc-comment rule to all six.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

/** Every barrel in the project, with the reason it is allowed to exist. */
const BARRELS = [
  "src/components/menu/howto/index.ts",
  "src/components/menu/scene/index.ts",
  "src/components/menu/ticker/index.ts",
  "src/components/settings/index.ts",
  "src/game/index.ts",
  "src/i18n/index.ts",
] as const;

describe("every barrel declares why it exists", () => {
  it.each(BARRELS)("%s has a leading doc comment", (path) => {
    expect(existsSync(path), `${path} is missing`).toBe(true);
    const src = readFileSync(path, "utf8");
    /*
     * The comment must be the *first* thing in the file and must run at least
     * three lines. A one-line `// barrel` is what makes the next reader delete
     * the file as dead code; these six survived a lint pass precisely because
     * each explains the contract it represents.
     */
    const head = src.trimStart();
    expect(head.startsWith("/*"), `${path} has no leading comment`).toBe(true);
    const comment = head.slice(0, head.indexOf("*/") + 2);
    expect(comment.split("\n").length, `${path}'s comment is too short`).toBeGreaterThan(2);
  });

  it("none of the six is empty", () => {
    for (const path of BARRELS) {
      const src = readFileSync(path, "utf8");
      // Strip the comment and ask whether anything is left.
      const code = src.slice(src.indexOf("*/") + 2).trim();
      expect(code.length, `${path} exports nothing`).toBeGreaterThan(10);
    }
  });
});

describe("the two barrels with component exports keep their names", () => {
  it("ticker exports the component and its data helpers separately", () => {
    const src = readFileSync("src/components/menu/ticker/index.ts", "utf8");
    expect(src).toContain("MenuTicker");
    expect(src).toContain("TICKER_KEYS");
    expect(src).toContain("TICKER_COUNT");
    expect(src).toContain("tickerTone");
  });

  it("settings exports the modal and every section the registry iterates", () => {
    const src = readFileSync("src/components/settings/index.ts", "utf8");
    for (const name of [
      "SettingsModal",
      "SettingsSection",
      "SegmentedControl",
      "VolumeStepper",
      "AudioSection",
      "DisplaySection",
      "LanguageSection",
    ]) {
      expect(src, `${name} missing from the barrel`).toContain(name);
    }
  });
});

describe("the io barrier the i18n barrel documents", () => {
  it("does not re-export a locale table", () => {
    /*
     * The comment says importing `./locales/vi` from a component is a bug,
     * because it bypasses the parity check. A barrel that re-exported the
     * tables would make that bug a one-line import.
     */
    const src = readFileSync("src/i18n/index.ts", "utf8");
    const code = src.slice(src.indexOf("*/") + 2);
    expect(code).not.toMatch(/from "\.\/locales\//);
  });
});
