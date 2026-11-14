/**
 * The eight decoration glyphs.
 *
 * Each is a 24×24 drawing that scales to whatever `size` the decor record
 * asks for. They are deliberately simple shapes with one accent fill: at
 * 10–26px they read as silhouette, not as detail, and detail at that size is
 * just noise.
 *
 * Drawn as inline SVG rather than emoji so they inherit the palette and
 * render the same on every platform. (The emoji versions of a chili and a
 * jar look wildly different on macOS, Windows and Android — which is exactly
 * how a "decorated" menu ends up looking accidental.)
 */
import type { ComponentType } from "react";
import type { DecorKind } from "./decor";

const ACCENT = {
  tumeric: "#f5a81c",
  brine: "#2bb48c",
  lime: "#8cc63f",
  chili: "#e63b2e",
  clay: "#f3e3c8",
  violet: "#9d6bff",
} as const;

/** A star: four points, drawn as a path so it stays crisp when scaled. */
function Star() {
  return (
    <path
      d="M12 1.5 14.4 9.6 22.5 12 14.4 14.4 12 22.5 9.6 14.4 1.5 12 9.6 9.6Z"
      fill={ACCENT.tumeric}
    />
  );
}

/** A spark: a thin four-point twinkle, warmer and lighter than the star. */
function Spark() {
  return (
    <g>
      <path d="M12 2c.7 6.3 3.7 9.3 10 10-6.3.7-9.3 3.7-10 10-.7-6.3-3.7-9.3-10-10 6.3-.7 9.3-3.7 10-10Z" fill={ACCENT.clay} />
      <circle cx="12" cy="12" r="2.2" fill="#fffdf6" />
    </g>
  );
}

/** A ring: two concentric strokes, used as the quietest decoration. */
function Ring() {
  return (
    <g fill="none" strokeWidth="1.6">
      <circle cx="12" cy="12" r="10" stroke={ACCENT.brine} />
      <circle cx="12" cy="12" r="5.4" stroke={ACCENT.tumeric} strokeDasharray="2 3" />
    </g>
  );
}

/** A brine bubble: circle with a highlight arc, the jar's own motif. */
function Bubble() {
  return (
    <g>
      <circle cx="12" cy="12" r="9" fill={ACCENT.brine} fillOpacity="0.35" stroke={ACCENT.brine} strokeWidth="1.5" />
      <path d="M6.5 9a6 6 0 0 1 5-4.6" fill="none" stroke="#fffdf6" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

/** A chili: the game's hazard, the menu's accent. */
function Chili() {
  return (
    <g>
      <path
        d="M15 4c3 1.4 5 4.6 5 8.4 0 4.2-3.4 7.6-7.6 7.6-3.4 0-6.3-2.2-7.3-5.3 3.1.9 6.4-.3 8.2-3 1-1.6 1.4-3.4 1.2-5.2-.1-1 .2-1.9.5-2.5Z"
        fill={ACCENT.chili}
      />
      <path d="M14.6 4.2c-.4-1.3.2-2.4 1.4-2.7" fill="none" stroke={ACCENT.lime} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

/** A lime leaf: the other half of the flavour pairing. */
function Leaf() {
  return (
    <g>
      <path d="M20 4C9.5 4 4 9.5 4 20c10.5 0 16-5.5 16-16Z" fill={ACCENT.lime} fillOpacity="0.75" />
      <path d="M6 18C10 14 14 10 18 6" fill="none" stroke={ACCENT.brine} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

/** A fly: three strokes, reads as an insect only at size — intentionally. */
function Fly() {
  return (
    <g stroke={ACCENT.chili} strokeWidth="1.7" strokeLinecap="round" fill="none">
      <path d="M7 12h10" />
      <path d="M9 5c-2 2.6-2 11.4 0 14" opacity="0.75" />
      <path d="M15 5c2 2.6 2 11.4 0 14" opacity="0.75" />
      <circle cx="12" cy="12" r="2.4" fill={ACCENT.chili} stroke="none" />
    </g>
  );
}

/** A fish-sauce drop: round body, pointed cap. */
function FishSauce() {
  return (
    <g>
      <path d="M12 2c3.2 4 6.4 7.6 6.4 11.6A6.4 6.4 0 0 1 12 20a6.4 6.4 0 0 1-6.4-6.4C5.6 9.6 8.8 6 12 2Z" fill={ACCENT.violet} fillOpacity="0.6" stroke={ACCENT.violet} strokeWidth="1.3" />
      <circle cx="9.6" cy="12.6" r="1.5" fill="#fffdf6" opacity="0.85" />
    </g>
  );
}

const GLYPHS: Record<DecorKind, ComponentType> = {
  star: Star,
  spark: Spark,
  ring: Ring,
  bubble: Bubble,
  chili: Chili,
  leaf: Leaf,
  fly: Fly,
  "fish-sauce": FishSauce,
};

/** The glyph for one decoration kind, sized by the caller. */
export function DecorGlyph({ kind, size }: { kind: DecorKind; size: number }) {
  const Glyph = GLYPHS[kind];
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <Glyph />
    </svg>
  );
}
