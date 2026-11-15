/**
 * The three-line catalogue summary under the INFO rows.
 *
 * See `summary.ts` for why this exists and why it is not the rejected
 * three-counter strip: different place, different job, no duplication of
 * anything the player has already read on this screen.
 */
import { useI18n } from "../../../i18n/useI18n";
import type { MessageKey } from "../../../i18n/i18n";
import type { SummaryLine } from "./summary";

export function PanelSummary({ lines }: { lines: readonly SummaryLine[] }) {
  const { t } = useI18n();

  return (
    /*
      No `mt-auto`. This component is the *last* block in INFO's body, and that
      body distributes with `space-between` (see `.corner-panel[data-panel=
      "right"] .corner-panel-body`). An auto top margin would ask for a second
      slice of the same leftover space — the footer would sit against the
      bottom edge with a gap above it, which is the v1.1.8 report's complaint
      reproduced 60px lower.

      The same reasoning already applies to `.panel-footer`; this one was
      missed because it predates that fix by one round.
    */
    <dl className="space-y-1 border-t-2 border-dashed border-jade-800 pt-2 font-body text-[9px]">
      {lines.map((line) => (
        <div key={line.key} className="flex items-baseline justify-between gap-2">
          <dt className="tracking-[0.16em] text-jade-500 uppercase">{t(line.key as MessageKey)}</dt>
          <dd className="font-display text-[11px] text-tumeric-400 tabular-nums">{line.count}</dd>
        </div>
      ))}
    </dl>
  );
}
