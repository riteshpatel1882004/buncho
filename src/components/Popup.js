'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Close } from './icons';

/**
 * A button that opens a popup (native <dialog>, so Esc, focus and the backdrop work properly).
 * Phones get a bottom sheet, larger screens a centred dialog.
 * The content (children) can be server-rendered markup, or a function ({ close }) => node when it needs a "Done" button.
 * Pass `wide` for content that needs more room (for example a two-column layout).
 */
export default function Popup({ buttonLabel, buttonClassName = '', title, subtitle, wide = false, children }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const width = wide ? 'w-[min(calc(100vw-1.5rem),56rem)]' : 'w-[min(calc(100vw-1.5rem),36rem)]';

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Stop the page behind from scrolling while the popup is open
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const content = typeof children === 'function' ? children({ close: () => setOpen(false) }) : children;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={buttonClassName}>
        {buttonLabel}
      </button>

      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // The dialog has no padding, so a click that lands on it directly is a click on the backdrop
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className={`m-auto ${width} max-w-none rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm max-sm:mb-0 max-sm:mt-auto max-sm:w-full max-sm:rounded-b-none`}
      >
        <div className="flex max-h-[88dvh] flex-col">
          {/* Grab handle, phones only */}
          <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden" />
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 max-sm:pt-3">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 hover:bg-line"
            >
              <Close />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">{content}</div>
        </div>
      </dialog>
    </>
  );
}