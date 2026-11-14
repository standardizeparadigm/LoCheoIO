/**
 * The scrolling ingredient strip along the bottom edge.
 *
 * Fixed height, one marquee line, and one footer line that shares the strip
 * rather than wrapping beneath it. In v1.1.7 the footer was a second block
 * inside the same `shrink-0` flex item, so it wrapped, the strip grew past
 * its allotted height, and the bottom edge sliced the copyright row in half
 * — visible in the report's screenshot as `V1.1.7 · AGPL-3.0 · STANDARDIZE
 * PARADIGM · 100% OFFLINE` cut through the middle of the glyphs.
 *
 * TICKER_HEIGHT (48px) is the whole strip: 26 for the marquee, 16 for the
 * footer, 6 padding. Nothing in here is allowed to grow.
 */
import type { MessageKey } from "../../../i18n/i18n";
import { useI18n } from "../../../i18n/useI18n";
import { tickerTone } from "./keys";

const TONE_CLASS = {
  tumeric: "text-tumeric-400",
  brine: "text-brine-300",
  chili: "text-chili-400",
} as const;

export function MenuTicker({
  keys,
  version,
}: {
  keys: readonly MessageKey[];
  version: string;
}) {
  const { t } = useI18n();

  return (
    <div
      data-ticker="menu"
      className="menu-ticker pointer-events-none relative h-12 shrink-0 overflow-hidden border-t-[3px] border-jade-800 bg-jade-950/92"
    >
      {/* one marquee line, 26px */}
      <div className="h-[26px] overflow-hidden pt-1.5">
        <div className="anim-marquee flex w-max gap-8">
          {[...keys, ...keys].map((key, i) => (
            <span
              key={i}
              className={`font-display text-[11px] tracking-[0.18em] whitespace-nowrap ${TONE_CLASS[tickerTone(i)]}`}
            >
              {t(key)} <span className="text-jade-700">◆</span>
            </span>
          ))}
        </div>
      </div>
      {/* one footer line, 16px — inline, never wrapped */}
      <div className="flex h-[16px] items-center justify-center gap-2 overflow-hidden px-2 font-body text-[8px] font-bold tracking-[0.22em] whitespace-nowrap text-jade-700 uppercase">
        <span>v{version}</span>
        <span aria-hidden="true">·</span>
        <span>AGPL-3.0</span>
        <span aria-hidden="true">·</span>
        <span>Standardize Paradigm</span>
        <span aria-hidden="true">·</span>
        <span>{t("footer.offline")}</span>
      </div>
    </div>
  );
}
