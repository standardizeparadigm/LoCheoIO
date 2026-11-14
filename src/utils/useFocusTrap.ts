import { useEffect, type RefObject } from "react";

/**
 * Everything the browser itself would put in the Tab order.
 *
 * Two entries are easy to forget and both are in this app:
 *
 *   · `[contenteditable]` — a rich-text field is focusable with no `tabindex`
 *     and no tag name the list would otherwise catch;
 *   · `a[href]` is included but `a` without `href` is not, which is correct
 *     and worth stating: a link with no destination is not a tab stop, and
 *     trapping Tab on one would strand the user.
 *
 * `[tabindex]:not([tabindex='-1'])` comes last on purpose. It overlaps the
 * four tag rules, and `querySelectorAll` returns document order rather than
 * selector order, so overlap costs nothing — but it must stay last so that a
 * future reader adding a rule sees the catch-all at the bottom.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Modal focus containment (v1.1.6 a11y pass).
 *
 * Before this hook, Tab could walk out of an open modal into the canvas and
 * the corner panels behind it — screen-reader users lost the dialog. The hook:
 *   1. remembers the element that had focus,
 *   2. moves focus inside the container on mount,
 *   3. wraps Tab / Shift+Tab around the container,
 *   4. restores the previous focus on unmount.
 *
 * It is intentionally dependency-free (no focus-trap package) and inert on
 * the server: without a DOM it just returns.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const previous = (typeof document !== "undefined" ? document.activeElement : null) as HTMLElement | null;

    const nodes = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // move focus in — first control, or the container itself
    const first = nodes()[0] ?? container;
    first.focus?.({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = nodes();
      /*
       * Empty list: let the browser have the Tab.
       *
       * This used to `preventDefault()` and return, on the reasoning that
       * "there is nowhere to go inside the container, so stop". But the
       * container is not the only thing on the page: the modal renders a close
       * ✕, a backdrop button and a scroll box, and every one of them is
       * filtered out when it is not visible — a tall settings dialog scrolled
       * to the bottom, a panel whose only control is `display: none`. In those
       * states Tab did nothing at all, and the keyboard user had no way out of
       * the dialog except Escape, which the dialog never mentions in the a11y
       * tree.
       *
       * Native Tab at least moves focus, and the next Tab re-evaluates the
       * list once something is visible again.
       */
      if (list.length === 0) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      const current = document.activeElement;
      if (!e.shiftKey && current === lastEl) {
        e.preventDefault();
        firstEl.focus();
      } else if (e.shiftKey && (current === firstEl || current === container)) {
        e.preventDefault();
        lastEl.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      /*
       * `previous` is captured at mount, and the element that opened the modal
       * is often gone by the time it closes — «Chơi tiếp» disables itself the
       * moment the snapshot is consumed, so the button is still in the
       * document but no longer focusable. `focus()` on a detached or disabled
       * element is a silent no-op: no throw, no console warning, focus snaps
       * to `<body>`, and the next Tab starts from the top of the document
       * instead of from the menu row the player was on.
       *
       * `isConnected` catches the detached case. The disabled case is caught
       * by checking `disabled` directly, because a disabled element is still
       * connected and still accepts a `focus()` call that does nothing.
       */
      const target = previous;
      const usable =
        target != null &&
        target.isConnected &&
        !(target as HTMLButtonElement).disabled &&
        typeof target.focus === "function";
      if (usable) target.focus({ preventScroll: true });
    };
  }, [ref, active]);
}
