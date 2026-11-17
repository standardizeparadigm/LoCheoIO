import { APP_VERSION } from "../../version";
import { useI18n } from "../../i18n/useI18n";
import type { MessageKey } from "../../i18n/i18n";
import { Modal, JarLogo } from "../ui";
import { aboutFacts, aboutSections } from "./about";
import { AboutCrest } from "./about/AboutCrest";

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
 * ROUND 17 — the crest, and why the old ring looked frozen
 * -------------------------------------------------------
 * v1.1.6 drew one `.glow-ring` span behind the logo: a conic gradient masked to
 * a 7px band, rotated by a single `transform` animation. It has been replaced
 * by `<AboutCrest>` — three SVG orbits at 9s / 14s / 22s, two of them
 * counter-rotating — for the reasons documented at length in that file. In
 * short: one cue is no cue, and the frozen state of a masked conic gradient
 * looks like an unfinished drawing rather than a deliberate ornament.
 *
 * The rest of the panel is new too, and it is all gradient-led:
 *
 *   · `.about-hero`   — a four-layer plaque (warm pool, cool pool, chili glow,
 *                       jade fall) instead of a flat `#0b2b2b` box;
 *   · `.about-title`  — «LỌ» in clay, «CHÉO» in a gold→chili gradient that pans;
 *   · `.about-version`— the version as a hairline pill rather than loose text;
 *   · `.about-heading`— every section heading gets a gold pip and a fading rule,
 *                       which is what separates the sections now that the
 *                       dashed borders are gone.
 *
 * The `.about-card` panning border is gone from *this* panel: it fought the
 * plaque for the same 3px edge and made the crest look boxed in. `.about-card`
 * itself is untouched — other surfaces still use it.
 */
export default function AboutModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();

  return (
    <Modal title={t("about.title")} onClose={onClose}>
      {/* ---------------------------------------------------------- hero */}
      <div className="about-hero flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4" data-about-hero="crest">
        {/*
          The crest is a fixed square and the jar sits centred inside it. The
          jar is `relative` and the crest `absolute`, so the jar is never
          clipped by the SVG's view box — the two are independent boxes on
          purpose, which is exactly what the old single-element ring could not
          do.
        */}
        <div className="relative grid h-[84px] w-[84px] shrink-0 place-items-center sm:h-[96px] sm:w-[96px]">
          <AboutCrest className="absolute inset-0 h-full w-full" />
          <JarLogo className="anim-bob jar-glow relative h-[58px] w-auto sm:h-[66px]" />
        </div>

        <div className="min-w-0">
          <p className="about-title text-[20px] sm:text-[23px]">
            LỌ <span className="about-title-accent">CHÉO</span>
            <span className="about-version ml-2 inline-block translate-y-[-2px] rounded-[2px] px-1.5 py-0.5 align-middle font-body text-[9px] font-bold tracking-[0.16em]">
              v{APP_VERSION}
            </span>
          </p>
          <p className="mt-1.5 font-body text-[10px] font-bold tracking-[0.18em] text-brine-300 uppercase">
            {t("about.role")}
          </p>
          <span className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="h-[3px] w-6 rounded-full bg-gradient-to-r from-tumeric-500 to-chili-500" aria-hidden="true" />
            <span className="h-[3px] w-3 rounded-full bg-gradient-to-r from-brine-400 to-jade-600" aria-hidden="true" />
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------- sections */}
      {/*
        The sections, in order. «Giới thiệu» first — it is the paragraph that
        used to be the hero tagline, and it is what a new player actually needs
        to read. «Về dự án» and the thanks chip follow.

        The dashed rule is gone: `.about-heading::after` draws a gradient rule
        that fades to nothing, which separates two blocks without drawing a box
        around each one. `ruled` still decides whether a section gets the extra
        top margin — the data contract is unchanged, only the paint is.
      */}
      {aboutSections().map((section) => (
        <section key={section.key} className={section.ruled ? "mt-3.5" : "mt-3"}>
          <h3 className="about-heading font-body text-[10px] font-extrabold">
            {t(section.key)}
          </h3>
          {section.body.map((bodyKey) =>
            bodyKey === "about.thanks" ? (
              <p
                key={bodyKey}
                className="about-chip mt-2 border-2 border-tumeric-500/45 px-3 py-2 text-center font-body text-[10px] font-bold text-tumeric-400"
              >
                {t("about.thanks")}
              </p>
            ) : (
              <p key={bodyKey} className="about-copy mt-1.5 font-body text-[11px] leading-relaxed">
                {t(bodyKey as MessageKey)}
              </p>
            ),
          )}
        </section>
      ))}

      {/* ---------------------------------------------------------- facts */}
      <dl className="mt-3.5 space-y-1.5 border-t border-jade-800/80 pt-3 font-body text-[10px]">
        {aboutFacts().map((key) => (
          <div key={key} className="flex items-baseline gap-2">
            <dt className="shrink-0 text-jade-600" aria-hidden="true">
              ▸
            </dt>
            <dd className="about-copy break-all opacity-90">{t(key as MessageKey)}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
