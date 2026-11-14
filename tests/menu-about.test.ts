import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { aboutFacts, aboutSections } from "../src/components/menu/about";
import { localeTable } from "../src/i18n/i18n";

/*
 * The «GIỚI THIỆU» modal absorbed the hero tagline in round 5. Two things have
 * to stay true for that to be an improvement rather than a move:
 *
 *   1. the tagline's *content* still exists (it is not deleted, it moved), and
 *   2. every section it renders has a heading and a body in all seven
 *      languages — a missing key would render as the literal key string in the
 *      middle of a panel, which is worse than the tagline was.
 */

describe("about sections", () => {
  it("opens with the game, not the author", () => {
    // A new player needs to know what the game is before who wrote it.
    const first = aboutSections()[0];
    expect(first.key).toBe("about.introHeading");
    expect(first.body).toEqual(["about.intro"]);
    expect(first.ruled, "the first section draws no rule above itself").toBe(false);
  });

  it("rules every section after the first", () => {
    const sections = aboutSections();
    expect(sections.slice(1).every((s) => s.ruled)).toBe(true);
  });

  it("has a heading and a body for every section, in every locale", () => {
    const tables = ["vi", "en", "zh", "ja", "ko", "es", "fr"].map((l) =>
      localeTable(l as never),
    );
    for (const table of tables) {
      for (const section of aboutSections()) {
        expect(table[section.key], `${section.key} heading missing`).toBeTruthy();
        for (const bodyKey of section.body) {
          expect(table[bodyKey as never], `${bodyKey} body missing`).toBeTruthy();
        }
      }
    }
  });

  it("carries the tagline text that used to live in the hero", () => {
    /*
     * The whole justification for removing the tagline from the hero is that
     * nothing is lost. If someone later deletes `about.intro`, that becomes
     * a silent deletion of the game's only prose description.
     */
    const intro = localeTable("vi")["about.intro" as never] as string;
    expect(intro.length).toBeGreaterThan(60);
    expect(intro).toContain("chỉ chịu đi đường chéo");
  });

  it("lists the four facts in the order a curious player asks them", () => {
    expect(aboutFacts()).toEqual([
      "about.contact",
      "about.source",
      "about.license",
      "about.fonts",
    ]);
  });

  it("is not still hardcoded in the hero", () => {
    // Regression guard: the tagline keys must not reappear in StartScreen.
    const start = readFileSync("src/components/StartScreen.tsx", "utf8");
    expect(start).not.toContain("menu.desc1");
    expect(start).not.toContain("menu.desc2");
  });
});
