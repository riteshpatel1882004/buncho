'use client';

import { useEffect, useId, useRef } from 'react';
import { Close } from '@/components/icons';
import Spinner from '@/components/Spinner';
import { formatMoney } from '@/lib/money';

/**
 * The "how do you want to pay?" popup (native <dialog>, so Esc, focus and the backdrop work properly).
 * Phones get a bottom sheet, larger screens a centred dialog.
 */
export default function CurrencyDialog({ open, onClose, busyWith, error, inrRupees, usdCents, usdEnabled, note, onPick }) {
  const ref = useRef(null);
  const titleId = useId();
  const busy = Boolean(busyWith);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const option =
    'flex w-full items-start gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line disabled:hover:bg-surface';

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => busy && e.preventDefault()}
      onClick={(e) => {
        // The dialog has no padding, so a click that lands on it directly is a click on the backdrop
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      className="m-auto w-[min(calc(100vw-1.5rem),30rem)] max-w-none rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm max-sm:mb-0 max-sm:mt-auto max-sm:w-full max-sm:rounded-b-none"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">How would you like to pay?</h2>
          <p className="mt-0.5 text-sm text-muted">Choose your currency. A secure Razorpay payment window will open.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 hover:bg-line disabled:opacity-50"
        >
          <Close />
        </button>
      </div>

      <div className="space-y-3 px-5 py-5">
        <button type="button" onClick={() => onPick('INR')} disabled={busy} className={option}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-lg font-semibold text-accent">₹</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">INR <span className="font-normal text-muted">(Indian currency)</span></span>
              <span className="flex items-center gap-2 font-semibold tabular-nums">
                {busyWith === 'INR' && <Spinner size={14} />}
                {formatMoney(inrRupees * 100, 'INR')}
              </span>
            </span>
            <span className="mt-0.5 block text-xs text-muted">UPI, cards, net banking and wallets. Secure payment by Razorpay.</span>
          </span>
        </button>

        <button type="button" onClick={() => onPick('USD')} disabled={busy || !usdEnabled} className={option}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg font-semibold">$</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">International <span className="font-normal text-muted">(other currency)</span></span>
              <span className="flex items-center gap-2 font-semibold tabular-nums">
                {busyWith === 'USD' && <Spinner size={14} />}
                {formatMoney(usdCents, 'USD')} <span className="text-xs font-medium text-muted">USD</span>
              </span>
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              {usdEnabled
                ? 'International cards, charged in US dollars. Secure payment by Razorpay.'
                : 'Not available right now. Please pay in INR.'}
            </span>
          </span>
        </button>

        {note && <p className="text-xs text-muted">{note}</p>}
        {error && <p role="alert" className="rounded-lg bg-hard/10 px-3 py-2 text-sm font-medium text-hard">{error}</p>}
        {busy && <p role="status" className="text-center text-xs text-muted">Opening the payment window…</p>}
      </div>
    </dialog>
  );
}