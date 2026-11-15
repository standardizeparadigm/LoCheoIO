/*
 * `menu/scene/` — the painted backdrop of the menu hero: the jar, its halo and
 * the decorative glyphs that fill the empty corners.
 *
 * Barrel added in round 4. `HeroDecor` is the only thing a screen mounts; the
 * rest is exported so `menu-decor.test.ts` can check the glyph list, the
 * overlap rule and the reserved wordmark zone without rendering.
 */

export { HeroDecor } from "./HeroDecor";
export { DecorGlyph } from "./DecorGlyph";
export { JarHalo } from "./JarHalo";
export type { Decor, DecorKind } from "./decor";
export { HERO_DECOR, decorCounts, decorOverlap, insideWordmark, WORDMARK_ZONE } from "./decor";
