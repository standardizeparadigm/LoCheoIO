/**
 * Modal — the focus-trapped dialog shell.
 *
 * Behaviour that the changelog, settings, leaderboard and quit dialogs all
 * share, implemented once:
 *   · Tab/Shift+Tab are trapped inside the panel (`useFocusTrap`)
 *   · Escape closes, and focus returns to whatever opened the dialog
 *   · the panel caps at 86vh so short windows scroll instead of clipping text
 *   · game hotkeys are swallowed at the capture phase by the caller's handler
 *
 * `wide` switches the max-width from the default to the two-column layouts
 * (settings, changelog). Renders a `<Panel>` inside a backdrop.
 *
 * Split out of `components/ui.tsx` in v1.1.7.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { useI18n } from "../../i18n/useI18n";
import { useFocusTrap } from "../../utils/useFocusTrap";
import { useAdaptive } from "../menu/adaptive/useAdaptive";
import { modalStyle } from "./modalPlan";
import { Panel } from "./panel";

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const { t } = useI18n();
  /*
   * The dialog's box comes from the window it opens in.
   *
   * It used to be two constants: `max-w-md` / `max-w-2xl` and `max-h-[86vh]`.
   * On a 390px phone `max-w-md` (448px) is wider than the screen, and `86vh`
   * ignores the on-screen keyboard — the settings footer scrolled out of reach.
   * `useAdaptive()` resolves both from the same box the rest of the screen uses,
   * and `planModal()` is the pure function underneath it.
   */
  const { modal } = useAdaptive(wide);
  const dialogStyle = modalStyle(modal);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
        return;
      }
      // Keep gameplay shortcuts from leaking through an open modal
      // (Enter=start, R=restart, P=pause, M=mute, Space=slam).
      // Native button activation still works — no preventDefault.
      const swallowCodes = ["Enter", "KeyP", "KeyR", "KeyM", "Space"];
      const swallowKeys = ["Enter", " ", "Spacebar"];
      if (swallowCodes.includes(e.code) || swallowKeys.includes(e.key)) {
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label={t("close.aria")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-jade-950/70 backdrop-blur-[2px]"
      />
      <Panel
        panelRef={panelRef}
        className="anim-pop relative flex flex-col"
        style={dialogStyle}
        data-modal-columns={modal.columns}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-jade-800 px-4 py-2.5">
          <h2
            className="font-display tracking-[0.22em] text-tumeric-400 uppercase"
            style={{ fontSize: modal.titleSize }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close.aria")}
            className="press flex h-8 w-8 items-center justify-center border-2 border-jade-700 bg-jade-900 text-brine-300 hard-shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {/* `game-scroll` opts this box into the styled thin scrollbar; the
            start screen deliberately uses `.menu-scroll` with no bar at all. */}
        <div
          className="game-scroll min-h-0 flex-1 overflow-y-auto"
          style={{ padding: modal.padding, fontSize: modal.bodySize }}
        >
          {children}
        </div>
      </Panel>
    </div>
  );
}
