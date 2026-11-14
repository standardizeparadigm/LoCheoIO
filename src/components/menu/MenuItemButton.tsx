/**
 * One row in a corner panel.
 *
 * The row has a declared height and clips its own text rather than growing.
 * That is the whole point: a panel's height must never depend on how long a
 * translation runs. German `Fortschritt und Einstellungen` and Thai
 * `ความคืบหน้าและการตั้งค่า` used to wrap to three lines and push the panel
 * open; now they truncate with an ellipsis and the full text stays available
 * in the `title` tooltip.
 *
 * Two densities:
 *   - compact (below 800px tall): label only, hint moved to `title`
 *   - rich    (800px and up):    label + hint line
 *
 * The measured heights live in `layout/metrics.ts` and are pinned by
 * `tests/menu-layout.test.ts`.
 */
import type { ReactNode } from "react";
import { MENU_ROW_HEIGHT, MENU_ROW_RICH_HEIGHT } from "./layout";

export default function MenuItemButton({
  icon,
  label,
  hint,
  onClick,
  disabled = false,
  variant = "ghost",
  trailing,
  shine = false,
  rich = false,
  compactIcon = false,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "brine" | "danger" | "ink";
  trailing?: ReactNode;
  /** v1.1.6: sweep a light band across the button (primary CTA). */
  shine?: boolean;
  /** Show the hint line under the label. False drops it to a tooltip. */
  rich?: boolean;
  /** Shrink the icon slot so a one-line row still looks balanced. */
  compactIcon?: boolean;
}) {
  const VARIANTS = {
    primary: "border-jade-950 bg-tumeric-500 text-jade-950 hover:bg-tumeric-400",
    brine: "border-jade-950 bg-brine-500 text-jade-950 hover:bg-brine-400",
    danger: "border-jade-950 bg-chili-500 text-clay-100 hover:bg-chili-400",
    ghost: "border-jade-600 bg-jade-900/70 text-clay-100 hover:bg-jade-800",
    ink: "border-jade-700 bg-jade-950/85 text-tumeric-400 hover:bg-jade-900",
  } as const;

  const height = rich ? MENU_ROW_RICH_HEIGHT : MENU_ROW_HEIGHT;
  const iconBox = compactIcon || !rich ? "h-6 w-6" : "h-7 w-7";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={!rich && hint ? hint : undefined}
      data-row={rich ? "rich" : "compact"}
      style={{ height }}
      className={`menu-row press hard-shadow-sm flex w-full shrink-0 items-center gap-2 overflow-hidden border-[3px] px-2 text-left transition-colors ${
        VARIANTS[variant]
      } ${shine ? "cta-shine " : ""}${disabled ? "cursor-not-allowed opacity-40 saturate-0" : ""}`}
    >
      <span className={`menu-row-icon flex ${iconBox} shrink-0 items-center justify-center`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="menu-row-label block truncate font-display text-[11px] leading-tight tracking-[0.14em]">
          {label}
        </span>
        {rich && hint && (
          <span className="mt-0.5 block truncate font-body text-[9px] leading-snug opacity-75">{hint}</span>
        )}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </button>
  );
}
