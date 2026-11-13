'use client';

import { useEffect, useId, useRef } from 'react';
import { Close } from '@/components/icons';
import Spinner from '@/components/Spinner';
import { formatMoney } from '@/lib/money';

/**
 * The "how do you want to pay?" popup (native <dialog>, so Esc, focus and the backdrop work properly).
 * Phones get a bottom sheet, larger screens a centred dialog.
 * list* are the prices before a promo code, so the saving can be shown. appliesTo says where the code works.
 */
export default function CurrencyDialog({ open, onClose, busyWith, error, inrRupees, usdCents, listInrRupees, listUsdCents, usdEnabled, note, onPick }) {
  const ref = useRef(null);
  const titleId = useId();
  const busy = Boolean(busyWith);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const inrSaved = listInrRupees > inrRupees ? (listInrRupees - inrRupees) * 100 : 0;
  const usdSaved = listUsdCents > usdCents ? listUsdCents - usdCents : 0;

  const option =
    'group relative flex w-full items-start gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft hover:shadow-lg hover:shadow-accent/10 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:border-line disabled:hover:bg-surface disabled:hover:shadow-none';

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
      className="cd-dialog m-auto w-[min(calc(100vw-1.5rem),30rem)] max-w-none rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm max-sm:mb-0 max-sm:mt-auto max-sm:w-full max-sm:rounded-b-none"
    >
      <style>{`
        @keyframes cd-in{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
        @keyframes cd-fade{from{opacity:0}to{opacity:1}}
        .cd-dialog[open]{animation:cd-in .26s cubic-bezier(.2,.9,.3,1) both}
        .cd-dialog[open]::backdrop{animation:cd-fade .26s ease-out both}
        @media (prefers-reduced-motion:reduce){.cd-dialog[open],.cd-dialog[open]::backdrop{animation:none}}
      `}</style>

      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">How would you like to pay?</h2>
          <p className="mt-0.5 text-sm text-muted">Pick your currency. A secure Razorpay window opens next.</p>
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
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-lg font-semibold text-accent transition-transform group-hover:scale-110">₹</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">INR <span className="font-normal text-muted">(Indian rupees)</span></span>
              <span className="flex items-center gap-2 font-semibold tabular-nums">
                {busyWith === 'INR' && <Spinner size={14} />}
                {inrSaved > 0 && <span className="text-xs font-medium text-muted line-through">{formatMoney(listInrRupees * 100, 'INR')}</span>}
                {formatMoney(inrRupees * 100, 'INR')}
              </span>
            </span>
            <span className="mt-0.5 block text-xs text-muted">UPI, cards, net banking and wallets.</span>
            {inrSaved > 0 && (
              <span className="mt-2 inline-block rounded-full bg-go/15 px-2 py-0.5 text-[0.7rem] font-semibold text-go">You save {formatMoney(inrSaved, 'INR')}</span>
            )}
          </span>
        </button>

        <button type="button" onClick={() => onPick('USD')} disabled={busy || !usdEnabled} className={option}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg font-semibold transition-transform group-hover:scale-110">$</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">International <span className="font-normal text-muted">(US dollars)</span></span>
              <span className="flex items-center gap-2 font-semibold tabular-nums">
                {busyWith === 'USD' && <Spinner size={14} />}
                {usdSaved > 0 && <span className="text-xs font-medium text-muted line-through">{formatMoney(listUsdCents, 'USD')}</span>}
                {formatMoney(usdCents, 'USD')}
              </span>
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              {usdEnabled ? 'International cards (Visa, Mastercard, Amex), charged in USD.' : 'Not available right now. Please pay in INR.'}
            </span>
            {usdEnabled && usdSaved > 0 && (
              <span className="mt-2 inline-block rounded-full bg-go/15 px-2 py-0.5 text-[0.7rem] font-semibold text-go">You save {formatMoney(usdSaved, 'USD')}</span>
            )}
          </span>
        </button>

        {note && <p className="rounded-lg bg-surface-2/60 px-3 py-2 text-xs text-muted">{note}</p>}
        {error && <p role="alert" className="rounded-lg bg-hard/10 px-3 py-2 text-sm font-medium text-hard">{error}</p>}
        {busy && <p role="status" className="text-center text-xs text-muted">Opening the payment window…</p>}

        <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[0.7rem] text-muted">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          256-bit secure checkout. We never see your card details.
        </p>
      </div>
    </dialog>
  );
}