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
 * ROUND 17 (this release): the author card is now a gradient-cut glass panel —
 * a warm radial wash, a seven-stop panning border, a breathing halo behind the
 * jar, a gradient-text wordmark that breathes vertically, a pressed-turmeric
 * version pill and a fading underline beneath the role. The sheen gliding over
 * the card is the CTA shine, tuned down to 1/3 alpha.
 *
 * The ring around the logo is `.glow-ring`, whose keyframes only ever touch
 * `transform`; the wrapper owns the layout box. Positioning and animation must
 * never share a node again — see the comment inside the JSX.
 */
export default function AboutModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();

  return (
    <Modal title={t("about.title")} onClose={onClose}>
      {/* ===== author card ===== */}
      <div className="about-card relative flex items-center gap-4 overflow-hidden p-4 sm:gap-5 sm:p-5">
        {/*
          The positioning and the rotation live on DIFFERENT nodes.

          The ring used to carry `-translate-x-1/2 -translate-y-1/2` *and*
          `animation: lc-ring-rotate` on the same element. Tailwind v4 compiles
          those utilities to the `translate` property while the keyframes animate
          `transform` — two different properties whose composition order is easy
          to get wrong, and in the reported environment it rendered as a static
          arc pair parked off the jar's centre. The wrapper now owns the
          box, the ring fills it, and the keyframes are the only thing touching
          `transform`. Nothing to compose, nothing to fight.
        */}
        <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
          <span aria-hidden="true" className="about-halo" />
          <span aria-hidden="true" className="glow-ring absolute inset-0" />
          <JarLogo className="anim-bob jar-glow absolute inset-0 m-auto h-20 w-auto sm:h-[5.5rem]" />
        </div>
        <div className="min-w-0">
          <p className="about-name font-display text-2xl leading-none sm:text-3xl">Lọ Chéo</p>
          <span className="about-version mt-2">v{APP_VERSION}</span>
          <p className="mt-2.5 font-body text-[10px] font-bold uppercase leading-snug tracking-[0.16em] text-brine-300">
            {t("about.role")}
          </p>
          <span aria-hidden="true" className="about-role-bar" />
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
              ? "mt-4 border-t-2 border-dashed border-jade-800 pt-3"
              : "mt-4"
          }
        >
          <h3 className="about-heading">{t(section.key)}</h3>
          {section.body.map((bodyKey) =>
            bodyKey === "about.thanks" ? (
              <p
                key={bodyKey}
                className="about-chip mt-2 border-2 border-tumeric-500/40 px-3 py-2 text-center font-body text-[10px] font-bold text-tumeric-400"
              >
                {t("about.thanks")}
              </p>
            ) : (
              <p key={bodyKey} className="mt-1.5 font-body text-[11px] leading-relaxed text-clay-100/85">
                {t(bodyKey as MessageKey)}
              </p>
            ),
          )}
        </section>
      ))}

      <dl className="about-facts mt-4 space-y-1 border-t-2 border-dashed border-jade-800 pt-3">
        {aboutFacts().map((key) => (
          <div key={key} className="about-fact">
            <dt className="about-fact-gem" aria-hidden="true" />
            <dd className="break-all pt-[1px] leading-snug text-clay-100/75">{t(key as MessageKey)}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
