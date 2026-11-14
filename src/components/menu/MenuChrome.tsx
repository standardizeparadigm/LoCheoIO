/**
 * The floating chrome that sits over the bottom of the start screen: the two
 * corner panels and the ingredient ticker, as one absolutely-positioned band.
 *
 * THE BUG THIS EXISTS TO KILL
 * ---------------------------
 * In v1.1.7 the corner row and the ticker were *flex siblings* of the hero,
 * both with `shrink-0`. A flex column gives its items their declared heights
 * first and hands the remainder to the flexible one — so on a 720px window:
 *
 *     hero    = 720 − 415 − 55 = 250px      (the flexible item, squeezed)
 *     chrome  = 415 + 55       = 470px      (rigid, untouched)
 *
 * Two things followed, and both are in the screenshot:
 *
 *   - the hero was 250px tall and its content was ~430px, so the wordmark
 *     was pushed above the top edge and the `LỌ` glyph was cut in half;
 *   - the corner panels were as tall as their six two-line rows, which put
 *     `CÀI ĐẶT` and the copyright line below the fold.
 *
 * Make the chrome `absolute inset-x-0 bottom-0` and it stops negotiating
 * height with the hero at all. The hero then reserves the same height with
 * `padding-bottom`, computed by `planMenuLayout()` — so the two numbers come
 * from one function and cannot drift.
 *
 * `pointer-events-none` on the band, `pointer-events-auto` on the panels: the
 * band covers the full width, and without this it would swallow clicks on
 * the hero behind it.
 */
import type { ReactNode } from "react";

export function MenuChrome({
  children,
  reserve,
}: {
  /** The corner row and the ticker, in that order. */
  children: ReactNode;
  /** Height reserved for the chrome, px — from planMenuLayout(). */
  reserve: number;
}) {
  return (
    <div
      data-chrome="menu"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30"
      style={{ height: reserve }}
    >
      {/*
       * A band of gradient *under* the chrome, not a full-screen darkener.
       * v1.1.7's menu used a 140px black frame around the edge, which is what
       * made the whole screen look foggy; this fades only the strip the
       * panels actually sit on.
       */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-jade-950 via-jade-950/85 to-transparent"
      />
      <div className="relative flex h-full flex-col justify-end">{children}</div>
    </div>
  );
}
