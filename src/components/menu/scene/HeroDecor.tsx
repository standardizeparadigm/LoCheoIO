/**
 * The floating decoration layer behind the hero.
 *
 * Pure presentation over `decor.ts`: absolute boxes positioned by percentage,
 * each with its own float animation and phase offset, so nothing moves in
 * lockstep. `pointer-events-none` and `aria-hidden` throughout — decoration
 * must never intercept a click or be announced.
 *
 * It sits *behind* the wordmark (`z-0` against the hero's `z-10`), so even a
 * future careless position cannot paint over a glyph.
 */
import { HERO_DECOR } from "./decor";
import { DecorGlyph } from "./DecorGlyph";

export function HeroDecor({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}>
      {HERO_DECOR.map((d) => (
        <span
          key={d.id}
          data-decor={d.kind}
          className="anim-float decor-item absolute"
          style={
            {
              left: `${d.x}%`,
              top: `${d.y}%`,
              opacity: d.opacity,
              "--float-delay": `${d.delay}s`,
              "--float-dur": `${d.dur}s`,
            } as React.CSSProperties
          }
        >
          <DecorGlyph kind={d.kind} size={d.size} />
        </span>
      ))}
    </div>
  );
}
