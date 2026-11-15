import { ACHIEVEMENTS, type AchievementDef } from "../game/achievements";
import { useI18n } from "../i18n/useI18n";
import type { MessageKey } from "../i18n/i18n";

const TONE: Record<AchievementDef["tone"], string> = {
  gold: "border-tumeric-500/70 bg-tumeric-500/15 text-tumeric-400",
  brine: "border-brine-500/70 bg-brine-500/15 text-brine-400",
  chili: "border-chili-500/70 bg-chili-500/15 text-chili-400",
  jade: "border-jade-600/80 bg-jade-600/15 text-jade-500",
};

/**
 * Achievement wall — locked badges render dimmed with a question glyph,
 * unlocked ones glow in their tone. `justUnlocked` ids pop with an animation.
 */
export default function AchievementsPanel({
  unlocked,
  justUnlocked = [],
}: {
  unlocked: string[];
  justUnlocked?: string[];
}) {
  const { t } = useI18n();
  const have = new Set(unlocked);
  const fresh = new Set(justUnlocked);
  const got = ACHIEVEMENTS.filter((a) => have.has(a.id)).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <span className="font-body text-[10px] font-extrabold tracking-[0.3em] text-jade-500 uppercase">
          {t("ach.title")}
        </span>
        <span className="font-display text-[11px] tracking-[0.14em] text-tumeric-400 tabular-nums">
          {got}/{ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-jade-900">
        <div
          className="h-full rounded-full bg-gradient-to-r from-tumeric-500 via-brine-400 to-jade-500 transition-all duration-500"
          style={{ width: `${(got / ACHIEVEMENTS.length) * 100}%` }}
        />
      </div>
      <ul className="mt-2 grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const owned = have.has(a.id);
          const pop = fresh.has(a.id);
          return (
            <li
              key={a.id}
              title={owned ? t(`ach.${a.id}.desc` as MessageKey) : "???"}
              className={`flex items-center gap-2 border-2 px-2 py-1.5 ${
                owned ? TONE[a.tone] : "border-jade-800/80 bg-jade-950/60 text-jade-700"
              } ${pop ? "anim-badge-pop" : ""}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-display text-[8px] tracking-tight ${
                  owned ? "border-current" : "border-jade-800"
                }`}
              >
                {owned ? a.glyph : "?"}
              </span>
              <span className="min-w-0">
                <span className="block clip-safe font-body text-[9px] font-extrabold tracking-[0.08em]">
                  {owned ? t(`ach.${a.id}.name` as MessageKey) : t("ach.locked")}
                </span>
                <span className="block font-body text-[8px] leading-snug text-clay-100/45">
                  {owned ? t(`ach.${a.id}.desc` as MessageKey) : t("ach.hint")}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
