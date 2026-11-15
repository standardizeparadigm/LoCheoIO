/**
 * «Cách chơi» — the six rules and the control legend.
 *
 * In v1.1.7 this content was an accordion inside the hero column. Opening it
 * grew the hero by ~300px inside a 382px band, which pushed the wordmark off
 * the top of the screen and made the whole menu look broken while it was
 * open. The report says it plainly: "chuyển cách chơi vào mục game ở menu" —
 * move how-to-play into the GAME menu.
 *
 * So it is a modal now. Opening it cannot move anything else, which also
 * means it works identically at 720px and 1080px tall.
 *
 * The content itself is unchanged and comes from `howto/rules.ts`; the goal
 * sentence is a new key so the modal has a lead paragraph instead of starting
 * with rule 01.
 */
import { useI18n } from "../../i18n/useI18n";
import { tipIndexFor } from "../../game/daily";
import { Keycap, Modal } from "../ui";
import { HOW_TO_RULES, KEYBOARD_KEYS, HOW_TO_GOAL_KEY } from "./howto/rules";

const ACCENT_CLASS = {
  tumeric: "text-tumeric-400 border-tumeric-500/60",
  brine: "text-brine-300 border-brine-500/60",
  chili: "text-chili-400 border-chili-500/60",
} as const;

export default function HowToModal({ onClose, touchMode }: { onClose: () => void; touchMode: boolean }) {
  const { t } = useI18n();

  /*
   * ROUND 6: one rule carries a "today" marker.
   *
   * The deck used to rotate a rule daily and open this modal from it, which
   * meant the modal was the *complete* version of what the deck teased. The
   * deck is gone, so the rotation would have died with it — `tipIndexFor()`
   * would have had no caller at all.
   *
   * Rather than keep a function nobody calls, the rotation moves to where it
   * belongs: the full rules list marks which of the six is today's. That is
   * the same information the deck's third column carried, in a place with
   * room for it, and it is the only place the six are all visible at once.
   */
  const todayRule = tipIndexFor(Math.floor(Date.now() / 86_400_000));

  return (
    <Modal title={t("menu.howtoOpen")} onClose={onClose} wide>
      <p className="mb-4 border-l-[3px] border-tumeric-500 bg-jade-900/40 px-3 py-2 font-body text-xs leading-relaxed text-clay-100/85">
        {t(HOW_TO_GOAL_KEY)}
      </p>

      <ol className="grid gap-2.5 sm:grid-cols-2">
        {HOW_TO_RULES.map((r, i) => (
          <li
            key={r.id}
            data-today-rule={i === todayRule ? "true" : undefined}
            className={`flex gap-2.5 border-l-[3px] bg-jade-900/30 px-2.5 py-2 ${ACCENT_CLASS[r.accent]}`}
          >
            <span className="font-display text-lg leading-none tabular-nums">0{r.n}</span>
            <span className="min-w-0">
              <span className="block font-display text-[11px] tracking-[0.12em]">
                {t(r.titleKey)}
                {i === todayRule && (
                  <span className="ml-1.5 border border-tumeric-500/60 px-1 py-px align-middle font-body text-[8px] font-bold tracking-[0.2em] text-tumeric-400 uppercase">
                    {t("daily.rule")}
                  </span>
                )}
              </span>
              <span className="mt-0.5 block font-body text-[11px] leading-relaxed text-clay-100/70">
                {t(r.bodyKey)}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 border-t-2 border-dashed border-jade-800 pt-3">
        <p className="mb-2 font-display text-[10px] tracking-[0.28em] text-jade-500 uppercase">
          {t("keys.move")}
        </p>
        {touchMode ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-body text-[11px] font-bold tracking-wider text-clay-100/70">
            <span className="flex items-center gap-2">
              <span className="inline-block h-6 w-6 rounded-full border-2 border-tumeric-500 bg-tumeric-500/20" />
              {t("touch.drag")}
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block font-display text-tumeric-400">⤢</span>
              {t("touch.diagonal")}
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-6 w-6 rounded-full border-2 border-chili-500 bg-chili-500/30" />
              {t("touch.slam")}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="flex items-center gap-1.5 font-body text-[11px] font-bold tracking-wider text-clay-100/70">
              {t("keys.move")}{" "}
              {KEYBOARD_KEYS.map((k) => (
                <Keycap key={k}>{k}</Keycap>
              ))}{" "}
              / <Keycap wide>↑ ← ↓ →</Keycap>
            </span>
            <span className="flex items-center gap-1.5 font-body text-[11px] font-bold tracking-wider text-clay-100/70">
              {t("keys.slam")} <Keycap wide>SPACE</Keycap>
            </span>
            <span className="flex items-center gap-1.5 font-body text-[11px] font-bold tracking-wider text-clay-100/70">
              {t("keys.pause")} <Keycap>P</Keycap>
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}

