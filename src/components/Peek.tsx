"use client";

import { X } from "@phosphor-icons/react";
import { type ReactNode, useId, useRef, useState } from "react";

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A short piece of text tucked behind a trigger. A click opens it as a card in
 * the middle of the screen — handwritten title, body, mono footer — that grows
 * out of the trigger and shrinks back into it on close, over a blurred page.
 *
 * Built on <dialog>, so focus, Esc and the top layer come from the browser, and
 * the text stays in the HTML for search engines while closed.
 */
export function Peek({
  label,
  ariaLabel,
  icon,
  title,
  footer,
  className,
  children,
}: {
  label?: ReactNode;
  ariaLabel?: string;
  icon?: ReactNode;
  title: string;
  footer?: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const id = useId();

  // Where the trigger sits relative to the card's resting place, so the card
  // can start (and end) there.
  function atTrigger() {
    const t = triggerRef.current?.getBoundingClientRect();
    const d = dialogRef.current?.getBoundingClientRect();
    if (!t || !d) return "scale(0.9)";
    const dx = t.left + t.width / 2 - (d.left + d.width / 2);
    const dy = t.top + t.height / 2 - (d.top + d.height / 2);
    return `translate(${dx}px, ${dy}px) scale(0.1)`;
  }

  function fadeBackdrop(d: HTMLDialogElement, from: number, to: number, duration: number) {
    try {
      d.animate([{ opacity: from }, { opacity: to }], {
        duration,
        pseudoElement: "::backdrop",
        fill: "forwards",
      });
    } catch {
      // ::backdrop animation unsupported — it just appears
    }
  }

  function show() {
    const d = dialogRef.current;
    if (!d || d.open) return;
    d.showModal();
    setOpen(true);
    document.documentElement.style.overflow = "hidden";
    fadeBackdrop(d, 0, 1, 400);
    if (reducedMotion()) {
      d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      return;
    }
    d.animate(
      [
        { transform: atTrigger(), opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      {
        duration: 560,
        easing: EASE_OUT,
      },
    );
    // The words arrive once the card has mostly opened.
    contentRef.current?.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 420, delay: 220, easing: EASE_OUT, fill: "backwards" },
    );
  }

  async function hide() {
    const d = dialogRef.current;
    if (!d?.open || closing.current) return;
    closing.current = true;
    fadeBackdrop(d, 1, 0, 280);
    const anim = reducedMotion()
      ? d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 })
      : d.animate(
          [
            { transform: "none", opacity: 1 },
            { transform: atTrigger(), opacity: 0 },
          ],
          {
            duration: 300,
            easing: EASE_IN,
          },
        );
    await anim.finished.catch(() => {});
    d.close();
    closing.current = false;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={show}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={className}
      >
        {icon}
        {label}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        onCancel={(e) => {
          // Esc: run the closing animation instead of vanishing.
          e.preventDefault();
          hide();
        }}
        onClose={() => {
          setOpen(false);
          document.documentElement.style.overflow = "";
        }}
        // The dialog has no padding of its own, so a click that lands on it
        // rather than on the card came from the backdrop.
        onClick={(e) => e.target === e.currentTarget && hide()}
        className="m-auto w-[min(30rem,calc(100vw-2rem))] overflow-visible rounded-2xl border border-hairline bg-bg p-0 text-left text-base font-normal text-wrap text-fg shadow-2xl shadow-black/40 backdrop:bg-bg/40 backdrop:backdrop-blur-[6px]"
      >
        <div className="relative p-6 sm:p-7">
          <button
            type="button"
            onClick={hide}
            aria-label="Close"
            className="absolute right-3 top-3 cursor-pointer rounded-full p-2 text-muted transition-colors hover:bg-hover-bg hover:text-fg"
          >
            <X weight="light" className="h-4 w-4" />
          </button>
          <div ref={contentRef}>
            <p id={`${id}-title`} className="pr-8 font-hand text-[28px] leading-none text-fg">
              {title}
            </p>
            <div className="mt-4 max-h-[60vh] overflow-y-auto text-sm leading-relaxed text-fg/80">
              {children}
            </div>
            {footer && (
              <p className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted">
                <span className="h-px w-3 bg-hairline" />
                {footer}
                <span className="h-px flex-1 bg-hairline" />
              </p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
