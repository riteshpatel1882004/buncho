'use client';

import { useState, useTransition } from 'react';
import { previewPrice, startCheckout } from '@/app/billing-actions';
import Spinner from '@/components/Spinner';
import { ctaBtn } from '@/components/jobs/ui';
import { formatMoney } from '@/lib/money';
import { payWithRazorpay } from '@/lib/razorpay-client';
import CurrencyDialog from './CurrencyDialog';

/**
 * price: rupees the buyer pays now in INR (site-wide offer already included).
 * priceUsdCents: the same in US cents, for "other currency". usdEnabled: false when paying in USD is switched off.
 * open: false when the admin paused upgrades.
 */
export default function CheckoutButton({ signedIn, label = 'Upgrade to Pro', price, priceUsdCents, usdEnabled = false, open = true }) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(null); // { code, inrRupees, usdCents, message }
  const [codeError, setCodeError] = useState(null);
  const [error, setError] = useState(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [payingWith, setPayingWith] = useState(null); // 'INR' | 'USD' | null
  const [pending, start] = useTransition();
  const [checking, startCheck] = useTransition();

  if (!signedIn) {
    return (
      <a href={`/login?redirect_url=${encodeURIComponent('/pricing')}`} className={`${ctaBtn} w-full`}>
        Log in to upgrade
      </a>
    );
  }

  if (!open) {
    return <p className="rounded-xl bg-surface/70 px-4 py-3 text-center text-sm text-muted">Upgrades are paused for a short while. Please check back soon.</p>;
  }

  function apply() {
    setCodeError(null);
    startCheck(async () => {
      try {
        const res = await previewPrice({ code });
        if (!res.ok) {
          setApplied(null);
          return setCodeError(res.error);
        }
        setApplied(res);
      } catch (err) {
        console.error(err);
        setApplied(null);
        setCodeError('Could not check that code right now. Please try again.');
      }
    });
  }

  function removeCode() {
    setApplied(null);
    setCode('');
    setCodeError(null);
  }

  function openChooser() {
    setError(null);
    setPayingWith(null);
    setChooserOpen(true);
  }

  function pay(currency) {
    setError(null);
    setPayingWith(currency);
    start(async () => {
      try {
        const res = await startCheckout({ code: applied ? applied.code : '', currency });
        if (!res.ok) {
          setPayingWith(null);
          return setError(res.error);
        }
        // Razorpay opens its own window on top of the page. The native <dialog> would sit above it, so close that first.
        setChooserOpen(false);
        const { paymentId } = await payWithRazorpay(res);
        // Paid. The return page asks Razorpay again before it switches Pro on.
        window.location.assign(`/billing/return?order_id=${res.orderId}${paymentId ? `&payment_id=${paymentId}` : ''}`);
      } catch (err) {
        // Catch everything here so a failure shows a message instead of crashing the whole page.
        if (!err?.dismissed) console.error(err);
        setPayingWith(null);
        // Closing the window is not an error. If a payment attempt failed before that, say why.
        setError(err?.dismissed ? err.message || null : err?.message || 'Could not open the payment window. Please try again.');
      }
    });
  }

  const busy = pending || Boolean(payingWith);
  const shownInr = applied ? applied.inrRupees : price;
  const shownUsd = applied ? applied.usdCents : priceUsdCents;
  const showUsd = usdEnabled && shownUsd != null; // dollars are offered only when switched on and priced

  return (
    <div className="space-y-3">
      {applied ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent-soft px-3.5 py-2.5 text-sm">
          <span className="font-medium text-accent">{applied.message}</span>
          <button type="button" onClick={removeCode} disabled={busy} className="text-xs font-semibold text-muted hover:text-ink">
            Remove
          </button>
        </div>
      ) : codeOpen ? (
        <div>
          <label htmlFor="promo-code" className="text-xs font-medium text-muted">Promo code</label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="promo-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (code.trim() && !checking) apply();
                }
              }}
              maxLength={24}
              autoComplete="off"
              placeholder="ENTER CODE"
              disabled={busy || checking}
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5 text-sm uppercase tracking-wider outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/70 focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={apply}
              disabled={busy || checking || !code.trim()}
              className="rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50"
            >
              {checking ? 'Checking…' : 'Apply'}
            </button>
          </div>
          {codeError && <p role="alert" className="mt-1.5 text-xs text-hard">{codeError}</p>}
        </div>
      ) : (
        <button type="button" onClick={() => setCodeOpen(true)} className="text-xs font-semibold text-accent hover:underline">
          Have a promo code?
        </button>
      )}

      <button type="button" onClick={openChooser} disabled={busy} aria-haspopup="dialog" className={`${ctaBtn} w-full`}>
        {busy && <Spinner size={14} />}
        {label}
        {shownInr != null && (
          <>
            {' · '}
            {formatMoney(shownInr * 100, 'INR')}
            {showUsd && <span className="font-medium opacity-70"> / {formatMoney(shownUsd, 'USD')}</span>}
          </>
        )}
      </button>

      {/* The two ways to pay, side by side, so it is clear that dollars work too */}
      <div className={`grid gap-2 text-left ${showUsd ? 'sm:grid-cols-2' : ''}`}>
        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/40 px-3 py-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-sm font-semibold text-accent">₹</span>
          <span className="min-w-0 text-xs leading-snug">
            <span className="block font-semibold text-ink">Pay in INR{shownInr != null && ` · ${formatMoney(shownInr * 100, 'INR')}`}</span>
            <span className="block text-muted">UPI, cards, net banking, wallets</span>
          </span>
        </div>
        {showUsd && (
          <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/40 px-3 py-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-sm font-semibold">$</span>
            <span className="min-w-0 text-xs leading-snug">
              <span className="block font-semibold text-ink">Pay in USD · {formatMoney(shownUsd, 'USD')}</span>
              <span className="block text-muted">International cards (Visa, Mastercard, Amex)</span>
            </span>
          </div>
        )}
      </div>
      <p className="flex items-center justify-center gap-1.5 text-center text-[0.7rem] text-muted">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        Secure payment by Razorpay
      </p>
      {error && !chooserOpen && <p role="alert" className="rounded-lg bg-hard/10 px-3 py-2 text-center text-sm font-medium text-hard">{error}</p>}

      <CurrencyDialog
        open={chooserOpen}
        onClose={() => !busy && setChooserOpen(false)}
        busyWith={payingWith}
        error={error}
        inrRupees={shownInr ?? 0}
        usdCents={shownUsd ?? 0}
        usdEnabled={usdEnabled && shownUsd != null}
        note={applied && !applied.message.includes('INR payments only') ? null : applied ? 'Your promo code only applies to INR payments.' : null}
        onPick={pay}
      />
    </div>
  );
}