/**
 * ScoreBoard — the TOP-8 table.
 *
 * Rows come from `game/storage` and are already normalised (8 max, finite
 * numbers, truncated names); this component never trusts the input shape and
 * re-checks each row before drawing it. `highlight` marks the row the player
 * just posted so the game-over screen can point at it.
 *
 * Split out of `components/ui.tsx` in v1.1.7.
 */
import type { ScoreEntry } from "../../game/storage";
import { fmtNum } from "../../i18n/i18n";
import { useI18n } from "../../i18n/useI18n";

const MEDALS = ["text-tumeric-400", "text-brine-300", "text-chili-400"];

export function ScoreBoard({
  entries,
  highlightId,
  rows = 8,
  title,
}: {
  entries: ScoreEntry[];
  highlightId?: string | null;
  rows?: number;
  title?: string;
}) {
  const { t, lang } = useI18n();
  // subscribed to `lang` so fmtNum output refreshes with the UI
  const heading = title ?? t("scoreboard.title");
  const numberFmt = (n: number) => fmtNum(n, lang);
  const list = entries.slice(0, rows);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b-2 border-jade-800 px-3 py-2">
        <h3 className="font-display text-[11px] tracking-[0.12em] text-tumeric-400">{heading}</h3>
        <span className="font-body text-[9px] font-bold tracking-[0.18em] text-jade-500">
          {t("scoreboard.top", { n: list.length })}
        </span>
      </div>
      <ol className="flex-1 divide-y divide-jade-800/70 overflow-y-auto">
        {list.length === 0 && (
          <li className="px-3 py-6 text-center font-body text-xs text-jade-500">{t("scoreboard.empty")}</li>
        )}
        {list.map((e, i) => {
          const hot = highlightId === e.id;
          return (
            <li
              key={e.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 transition-colors ${
                hot ? "anim-ring bg-tumeric-500/25" : i % 2 ? "bg-jade-900/25" : "bg-transparent"
              }`}
            >
              <span className={`w-6 shrink-0 font-display text-sm ${MEDALS[i] ?? "text-jade-500"}`}>{i + 1}</span>
              <span
                className={`min-w-0 flex-1 clip-safe font-body text-xs font-bold tracking-wide ${
                  hot ? "text-tumeric-400" : "text-clay-100"
                }`}
              >
                {e.name}
              </span>
              <span className="hidden shrink-0 font-body text-[9px] tracking-[0.14em] text-jade-500 sm:block">
                {t("scoreboard.row", { level: e.level, jars: e.jars })}
              </span>
              <span className="w-16 shrink-0 text-right font-display text-sm text-brine-300 tabular-nums">
                {numberFmt(e.score)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
