/**
 * A corner panel: `GAME` bottom-left, `THÔNG TIN` bottom-right.
 *
 * WHAT CHANGED IN 1.1.8
 * ----------------------
 * The panel used to be as tall as its contents — six rows, each sized by its
 * own padding plus whatever its translated hint happened to wrap to. That
 * made the panel height a function of the language, which is why the German
 * build overflowed where the English one only nearly did, and it made the
 * height impossible to reserve for.
 *
 * Now the height is an input. `planMenuLayout()` decides it, the panel paints
 * it, and the hero reserves it. Six rows are 278px (compact) or 398px (rich),
 * in every language, forever.
 *
 * v1.1.8 also fixes the *distribution*. The body used to be
 * `justify-around`, which spreads N rows over a height sized for seven: GAME
 * has seven and looked right, but INFO has three and the report's screenshot
 * shows its three buttons floating with a gap above, between and below —
 * "phần thông tin tự nhiên bị chia ra". Rows now stack from the top with the
 * declared gap and the leftover space belongs to one explicit `footer` slot,
 * so the same body renders seven rows tightly and three rows plus a footer.
 */
import type { ReactNode } from "react";
import { RICH_ROW_BREAKPOINT, cornerRowHeight, cornerRowReserve } from "./layout";
import { CORNER_PANEL_WIDTH } from "./layout";

/** Row height the panel body uses — mirrored from metrics for the CSS side. */
export { cornerRowHeight, cornerRowReserve, CORNER_PANEL_WIDTH, RICH_ROW_BREAKPOINT };

export default function CornerPanel({
  title,
  corner,
  height,
  width = CORNER_PANEL_WIDTH,
  footer,
  tight = false,
  compact = false,
  children,
}: {
  title: string;
  /** Which screen corner to pin — controls the entrance direction. */
  corner: "left" | "right";
  /** Declared height in px, from planMenuLayout(). */
  height: number;
  /** Declared width in px. Narrower when stacked on a phone. */
  width?: number;
  /** Optional footer strip pinned to the panel floor (see .panel-footer). */
  footer?: ReactNode;
  /**
   * Rows use the 26px landscape height and the panel carries `data-tight`.
   *
   * The plan decides this, not the panel: only `planMenuLayout()` can see how
   * much height the window has. The panel just paints the flag.
   */
  tight?: boolean;
  /**
   * The panel carries `data-compact`: 3px gaps, 10px padding, an 18px header.
   *
   * Same contract as `tight` — the plan owns the decision, the panel paints the
   * flag. The values live in `.corner-panel[data-compact="1"]` because the
   * header and body sizes are currently Tailwind classes, and a class cannot be
   * overridden by a sibling class; an attribute wins on specificity without
   * `!important` for the padding, and the row height (which *is* inline) still
   * needs the one `!important` that `data-tight` already uses.
   */
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      data-panel={corner}
      data-tight={tight ? "1" : undefined}
      data-compact={compact ? "1" : undefined}
      style={{ height, width }}
      className={`corner-panel pointer-events-auto relative flex shrink-0 flex-col border-[3px] border-jade-700/90 bg-jade-950/92 hard-shadow ${
        corner === "left" ? "anim-corner-left" : "anim-corner-right"
      }`}
    >
      {/* four orange corner ticks */}
      <span className="pointer-events-none absolute -top-[3px] -left-[3px] h-2.5 w-2.5 border-t-[3px] border-l-[3px] border-tumeric-500" />
      <span className="pointer-events-none absolute -top-[3px] -right-[3px] h-2.5 w-2.5 border-t-[3px] border-r-[3px] border-tumeric-500" />
      <span className="pointer-events-none absolute -bottom-[3px] -left-[3px] h-2.5 w-2.5 border-b-[3px] border-l-[3px] border-tumeric-500" />
      <span className="pointer-events-none absolute -right-[3px] -bottom-[3px] h-2.5 w-2.5 border-b-[3px] border-r-[3px] border-tumeric-500" />

      <h2 className="panel-head flex h-[22px] shrink-0 items-center justify-between gap-2 border-b-2 border-jade-800 bg-gradient-to-r from-jade-900/80 via-jade-900/30 to-jade-900/80 px-3 font-display text-[10px] tracking-[0.34em] text-tumeric-400 uppercase">
        {title}
        <span aria-hidden="true" className="anim-flicker h-1.5 w-1.5 rounded-full bg-tumeric-400" />
      </h2>

      <div className="corner-panel-body flex min-h-0 flex-1 flex-col gap-[6px] overflow-hidden p-2">
        {/* the gap/padding override lives in index.css — see data-compact */}
        {children}
        {footer && <div className="panel-footer">{footer}</div>}
      </div>
    </section>
  );
}
