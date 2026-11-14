/**
 * Today's challenge, as one line in the INFO panel.
 *
 * Round 6 moved this out of the hero: the deck that carried it was three
 * columns of prose inside a band that could not hold them. The challenge is a
 * number and a mode name, so it survives the move intact — see
 * `summary.ts#challengeLine`.
 */
import { useI18n } from "../../../i18n/useI18n";
import type { MessageKey } from "../../../i18n/i18n";
import { fmtNum } from "../../../i18n/i18n";
import type { ChallengeLine } from "./summary";

export function PanelChallenge({ line }: { line: ChallengeLine }) {
  const { t, lang } = useI18n();

  return (
    <div className="mt-2 border-t-2 border-dashed border-jade-800 pt-2 font-body text-[9px]">
      <p className="tracking-[0.16em] text-jade-500 uppercase">{t("daily.challenge")}</p>
      <p className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="truncate font-body text-[10px] font-semibold text-clay-100/80">
          {t(line.modeKey as MessageKey)}
        </span>
        <b className="shrink-0 font-display text-[11px] text-tumeric-400 tabular-nums">
          {fmtNum(line.target, lang)}
        </b>
      </p>
    </div>
  );
}
