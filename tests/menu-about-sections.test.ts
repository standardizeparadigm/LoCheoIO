/**
 * `about/sections.ts` says, in its own header, that "`aboutSections()` is unit
 * tested so a translation that forgets a section fails a test instead of
 * producing a modal with a hole in it."
 *
 * It was not. `menu-about.test.ts` covers the *modal component*; nothing covered
 * the data module the component reads, so a section whose i18n key was renamed
 * would render `about.thanksHeading` as a literal heading — in all seven
 * languages at once, which is the sort of thing that looks like a CSS problem.
 *
 * The doc comment made a promise. This file is the promise.
 */
import { describe, expect, it } from "vitest";

import {
  aboutFacts,
  aboutSections,
} from "../src/components/menu/about/sections";
import { hasKey } from "../src/i18n/i18n";

describe("aboutSections", () => {
  it("renders three sections, in the order a new player needs them", () => {
    expect(aboutSections().map((s) => s.key)).toEqual([
      "about.introHeading",
      "about.craftHeading",
      "about.thanksHeading",
    ]);
  });

  it("rules every section except the first, because a rule needs something above it", () => {
    // A dashed rule above the very first heading draws a line at the top edge of
    // the modal, which reads as a border bug rather than as a separator.
    expect(aboutSections().map((s) => s.ruled)).toEqual([false, true, true]);
  });

  it("gives every section at least one body paragraph", () => {
    for (const s of aboutSections()) {
      expect(s.body.length, s.key).toBeGreaterThan(0);
    }
  });

  it("points every heading and paragraph at a key that exists", () => {
    for (const s of aboutSections()) {
      expect(hasKey(s.key), `${s.key} heading`).toBe(true);
      for (const key of s.body) {
        expect(hasKey(key), `${s.key} → ${key}`).toBe(true);
      }
    }
  });

  it("names a distinct heading per section, so no two blocks share a title", () => {
    const keys = aboutSections().map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns a fresh array each call, so a caller cannot mutate the module's copy", () => {
    // Cheap, but this is the shape a caller is most likely to abuse: pushing a
    // section onto the result and wondering why it survives a re-render.
    const first = aboutSections() as AboutSectionMutable[];
    const length = first.length;
    first.push({ key: "about.introHeading", body: [], ruled: false });
    expect(aboutSections()).toHaveLength(length);
  });
});

describe("aboutFacts", () => {
  it("lists contact, source, licence, fonts — the order a curious player asks", () => {
    expect(aboutFacts()).toEqual([
      "about.contact",
      "about.source",
      "about.license",
      "about.fonts",
    ]);
  });

  it("points every fact at a key that exists", () => {
    for (const key of aboutFacts()) {
      expect(hasKey(key), key).toBe(true);
    }
  });
});

/** Widened alias so the mutation test above does not need a cast at the call. */
type AboutSectionMutable = {
  key: "about.introHeading" | "about.craftHeading" | "about.thanksHeading";
  body: readonly string[];
  ruled: boolean;
};
