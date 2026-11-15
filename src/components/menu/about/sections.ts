/**
 * The «GIỚI THIỆU» modal, as data.
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * Two separate things were fighting for the same rectangle:
 *
 *   1. The tagline — three lines under the wordmark explaining how the game
 *      works. It lived in the hero.
 *   2. The author card — role, contact, licence, thanks. It lived in
 *      `AboutModal`, reachable from the INFO panel.
 *
 * Both are "about the project", so both belong in one place, and that place is
 * not a fixed-height band on the start screen. Moving the tagline here is what
 * lets the hero be *only* the wordmark, the badge and the deck — which is what
 * makes `LỌ` fit at 1280×720 without touching the wordmark's size.
 *
 * The structure below is deliberately flat and ordered: it is rendered top to
 * bottom, and `aboutSections()` is unit tested so a translation that forgets a
 * section fails a test instead of producing a modal with a hole in it.
 */

/** One block of the about modal. */
export interface AboutSection {
  /** i18n key for the heading. */
  key: "about.introHeading" | "about.craftHeading" | "about.thanksHeading";
  /** i18n keys whose values are rendered as body paragraphs. */
  body: readonly string[];
  /** Draw the dashed rule above this section. False for the first one. */
  ruled: boolean;
}

/**
 * The modal, in render order.
 *
 * «Giới thiệu» comes first because it is what a new player actually needs: what
 * the game is and how it is played. The author card is second — it matters to
 * someone who is already curious, not to someone who has not started yet.
 */
export function aboutSections(): readonly AboutSection[] {
  return [
    {
      key: "about.introHeading",
      body: ["about.intro"],
      ruled: false,
    },
    {
      key: "about.craftHeading",
      body: ["about.craft"],
      ruled: true,
    },
    {
      key: "about.thanksHeading",
      body: ["about.thanks"],
      ruled: true,
    },
  ];
}

/**
 * The three facts rendered as a definition list at the bottom.
 *
 * Order is contact → source → licence → fonts, which is the order a curious
 * player would ask them in: who do I tell, where is the code, what am I allowed
 * to do with it, and what is it built on.
 */
export function aboutFacts(): readonly string[] {
  return ["about.contact", "about.source", "about.license", "about.fonts"];
}
