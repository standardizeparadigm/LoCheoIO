/**
 * Panel — the bevelled container every screen sits in.
 *
 * One prop (`tone`) drives the border/glow pair; the hard 5px offset shadow
 * comes from `.hard-shadow` in index.css, so the depth is identical wherever
 * a panel appears. Prefer this over hand-rolling `border-2 border-jade-800`.
 *
 * Split out of `components/ui.tsx` in v1.1.7.
 */
import { CSSProperties, ReactNode, Ref } from "react";

export function Panel({
  children,
  className = "",
  tilt = 0,
  panelRef,
  style,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  tilt?: number;
  /** optional handle for the modal focus trap */
  panelRef?: Ref<HTMLDivElement>;
  /**
   * Inline declarations, merged with `tilt`.
   *
   * The modal shell needs `maxWidth` / `maxHeight` from `planModal()` at
   * runtime, and a Tailwind class cannot carry a computed number — the same
   * reason `Wordmark` uses an inline `fontSize`. `tilt` still wins for the
   * transform so a tilted panel cannot lose its rotation to a style object.
   */
  style?: CSSProperties;
  /** `data-*` attributes (`data-modal-columns`, probe hooks, …). */
  [key: `data-${string}`]: string | number | undefined;
}) {
  return (
    <div
      ref={panelRef}
      style={{ ...style, ...(tilt ? { transform: `rotate(${tilt}deg)` } : {}) }}
      {...rest}
      className={`relative border-[3px] border-jade-700/90 bg-jade-950/92 hard-shadow ${className}`}
    >
      <span className="pointer-events-none absolute -top-[3px] -left-[3px] h-3 w-3 border-t-[3px] border-l-[3px] border-tumeric-500" />
      <span className="pointer-events-none absolute -top-[3px] -right-[3px] h-3 w-3 border-t-[3px] border-r-[3px] border-tumeric-500" />
      <span className="pointer-events-none absolute -bottom-[3px] -left-[3px] h-3 w-3 border-b-[3px] border-l-[3px] border-tumeric-500" />
      <span className="pointer-events-none absolute -right-[3px] -bottom-[3px] h-3 w-3 border-r-[3px] border-b-[3px] border-tumeric-500" />
      {children}
    </div>
  );
}
