import { APP_VERSION } from "../../version";
import { useI18n } from "../../i18n/useI18n";
import type { MessageKey } from "../../i18n/i18n";
import { Modal, JarLogo } from "../ui";
import { aboutFacts, aboutSections } from "./about";

/**
 * The «GIỚI THIỆU» modal — what the game is, who made it, how to reach them.
 *
 * ROUND 5: this modal absorbed the tagline that used to sit in the hero.
 *
 * The hero is a fixed-height band whose height is decided by the chrome, so a
 * three-line paragraph there was costing the wordmark ~75px — on a 1290×720
 * window that was the difference between a whole `LỌ` and a clipped one. The
 * paragraph was not the problem; its *address* was. It explains the game,
 * which is exactly what an about panel is for, so it moved here and became the
 * first section a reader sees.
 *
 * Layout is data now (`menu/about/sections.ts`) rather than JSX: the section
 * list is unit tested, so a translation that forgets to supply a heading fails
 * a test instead of shipping a modal with an empty block.
 *
 * v1.1.6 styling, unchanged: perpetually panning gradient border
 * (`.about-card`), a rotating glow ring around the logo (`.glow-ring`), and a
 * gradient thanks chip.
 */
export default function AboutModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();

  return (
    <Modal title={t("about.title")} onClose={onClose}>
      <div className="about-card relative flex items-start gap-4 overflow-hidden p-4">
        <div className="relative shrink-0">
          <span aria-hidden="true" className="glow-ring absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2" />
          <JarLogo className="anim-bob jar-glow relative h-20 w-auto" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg leading-none text-clay-100">
            Lọ <span className="text-tumeric-400">Chéo</span>
            <span className="ml-2 align-middle font-body text-[10px] font-bold tracking-[0.2em] text-jade-500">
              v{APP_VERSION}
            </span>
          </p>
          <p className="mt-1 font-body text-[10px] font-bold uppercase tracking-[0.18em] text-brine-300">
            {t("about.role")}
          </p>
        </div>
      </div>

      {/*
        The sections, in order. «Giới thiệu» first — it is the paragraph that
        used to be the hero tagline, and it is what a new player actually needs
        to read. «Về dự án» and the thanks chip follow.
      */}
      {aboutSections().map((section) => (
        <section
          key={section.key}
          className={
            section.ruled
              ? "mt-3 border-t-2 border-dashed border-jade-800 pt-3"
              : "mt-3"
          }
        >
          <h3 className="font-body text-[10px] font-extrabold tracking-[0.24em] text-tumeric-400/90 uppercase">
            {t(section.key)}
          </h3>
          {section.body.map((bodyKey) =>
            bodyKey === "about.thanks" ? (
              <p
                key={bodyKey}
                className="about-chip mt-2 border-2 border-tumeric-500/40 px-3 py-2 text-center font-body text-[10px] font-bold text-tumeric-400"
              >
                {t("about.thanks")}
              </p>
            ) : (
              <p key={bodyKey} className="mt-1.5 font-body text-[11px] leading-relaxed text-clay-100/80">
                {t(bodyKey as MessageKey)}
              </p>
            ),
          )}
        </section>
      ))}

      <dl className="mt-3 space-y-1.5 border-t-2 border-dashed border-jade-800 pt-3 font-body text-[10px]">
        {aboutFacts().map((key) => (
          <div key={key} className="flex items-baseline gap-2">
            <dt className="shrink-0 text-jade-600" aria-hidden="true">▸</dt>
            <dd className="break-all text-clay-100/75">{t(key as MessageKey)}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
