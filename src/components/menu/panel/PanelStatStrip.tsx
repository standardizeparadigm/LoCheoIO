/**
 * Renders a `PanelStat[]` as the strip pinned to a corner panel's floor.
 *
 * Deliberately dumb: it takes the stats and prints them. All the arithmetic
 * (clamping, formatting, which tier) happens in `stat.ts`, where it can be
 * tested without React.
 *
 * The strip is *not* a button. v1.1.8's report asked for something to fill
 * the empty space under the menu, not for another target to click, so this
 * carries `aria-hidden` — the numbers are already announced by the rows above
 * it (`16 thành tựu`, `9 chế độ`), and duplicating them into the a11y tree
 * would make the panel read its counts twice.
 */
import type { PanelStat } from "./stat";

export function PanelStatStrip({ stats }: { stats: readonly PanelStat[] }) {
  if (stats.length === 0) return null;
  return (
    <div data-panel-stat="" className="flex w-full items-center justify-between gap-2">
      {stats.map((s, i) => (
        <span key={i} className="flex items-center gap-1 tabular-nums">
          <span aria-hidden="true" className="text-tumeric-500">
            {s.label}
          </span>
          <span>{s.value}</span>
        </span>
      ))}
    </div>
  );
}
