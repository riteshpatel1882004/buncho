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
  const [applied, setApplied] = useState(null); // { code, appliesTo, inrRupees, listInrRupees, usdCents, listUsdCents, bonusDays, message }
  const [codeError, setCodeError] = useState(null);
  const [error, setError] = useState(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [payingWith, setPayingWith] = useState(null); // 'INR' | 'USD' | null
  const [confirming, setConfirming] = useState(null); // text shown on the full-screen overlay while we move to the result page
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

  function goToResult(orderId, extra = '') {
    setConfirming(extra.includes('cancelled') ? 'Checking your payment…' : 'Payment received. Confirming…');
    window.location.assign(`/billing/return?order_id=${orderId}${extra}`);
  }

  function pay(currency) {
    setError(null);
    setPayingWith(currency);
    start(async () => {
      let orderId = null;
      try {
        // A code limited to one currency is only sent for that currency. The other one is charged at the normal price.
        const useCode = applied && applied.appliesTo?.[currency] ? applied.code : '';
        const res = await startCheckout({ code: useCode, currency });
        if (!res.ok) {
          setPayingWith(null);
          return setError(res.error);
        }
        orderId = res.orderId;
        // Razorpay opens its own window on top of the page. The native <dialog> would sit above it, so close that first.
        setChooserOpen(false);
        const { paymentId } = await payWithRazorpay(res);
        // Paid. The result page asks Razorpay again before it switches Pro on, then shows the success animation.
        goToResult(orderId, paymentId ? `&payment_id=${encodeURIComponent(paymentId)}` : '');
      } catch (err) {
        // Catch everything here so a failure shows a message instead of crashing the whole page.
        if (!err?.dismissed) console.error(err);
        setPayingWith(null);
        if (err?.dismissed && orderId) {
          // The window was closed without paying (or the last attempt failed): show the "not paid / failed" screen.
          const why = err.message ? `&reason=${encodeURIComponent(err.message.slice(0, 140))}` : '';
          return goToResult(orderId, `&cancelled=1${why}`);
        }
        setError(err?.message || 'Could not open the payment window. Please try again.');
      }
    });
  }

  const busy = pending || Boolean(payingWith) || Boolean(confirming);
  const shownInr = applied ? applied.inrRupees : price;
  const shownUsd = applied ? applied.usdCents : priceUsdCents;
  const showUsd = usdEnabled && shownUsd != null; // dollars are offered only when switched on and priced
  const inrSaved = applied && applied.listInrRupees > applied.inrRupees ? (applied.listInrRupees - applied.inrRupees) * 100 : 0;
  const usdSaved = applied && applied.listUsdCents > applied.usdCents ? applied.listUsdCents - applied.usdCents : 0;

  let dialogNote = null;
  if (applied && applied.appliesTo) {
    if (applied.appliesTo.INR && !applied.appliesTo.USD) dialogNote = 'Your promo code only applies to INR payments. Paying in USD is charged at the normal price.';
    if (!applied.appliesTo.INR && applied.appliesTo.USD) dialogNote = 'Your promo code only applies to USD payments. Paying in INR is charged at the normal price.';
  }

  return (
    <div className="space-y-3">
      <style>{`
        @keyframes cb-pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
        @keyframes cb-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        @keyframes cb-fade{from{opacity:0}to{opacity:1}}
        @keyframes cb-spin{to{transform:rotate(360deg)}}
        @keyframes cb-shine{0%{transform:translateX(-120%)}60%,100%{transform:translateX(120%)}}
        .cb-pop{animation:cb-pop .4s cubic-bezier(.2,.9,.3,1.3) both}
        .cb-in{animation:cb-in .3s ease-out both}
        .cb-shine::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.28) 50%,transparent 65%);transform:translateX(-120%);animation:cb-shine 3.2s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.cb-pop,.cb-in{animation:none}.cb-shine::after{display:none}}
      `}</style>

      {applied ? (
        <div className="cb-in rounded-xl border border-accent/40 bg-accent-soft px-3.5 py-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="flex items-start gap-2 font-medium text-accent">
              <span className="cb-pop mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
              </span>
              {applied.message}
            </span>
            <button type="button" onClick={removeCode} disabled={busy} className="shrink-0 text-xs font-semibold text-muted hover:text-ink">
              Remove
            </button>
          </div>
          {(inrSaved > 0 || usdSaved > 0 || applied.bonusDays > 0) && (
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 pl-7 text-xs text-ink/80 tabular-nums">
              {inrSaved > 0 && <span>You save {formatMoney(inrSaved, 'INR')} in INR</span>}
              {usdSaved > 0 && showUsd && <span>You save {formatMoney(usdSaved, 'USD')} in USD</span>}
              {applied.bonusDays > 0 && <span>+ {applied.bonusDays} bonus days free</span>}
            </p>
          )}
        </div>
      ) : codeOpen ? (
        <div className="cb-in">
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
              autoFocus
              placeholder="ENTER CODE"
              disabled={busy || checking}
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5 text-sm uppercase tracking-wider outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/70 focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={apply}
              disabled={busy || checking || !code.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 text-sm font-semibold transition hover:bg-surface-2 disabled:opacity-50"
            >
              {checking && <Spinner size={12} />}
              {checking ? 'Checking' : 'Apply'}
            </button>
          </div>
          {codeError && <p role="alert" className="cb-in mt-1.5 text-xs text-hard">{codeError}</p>}
        </div>
      ) : (
        <button type="button" onClick={() => setCodeOpen(true)} className="text-xs font-semibold text-accent hover:underline">
          Have a promo code?
        </button>
      )}

      <button type="button" onClick={openChooser} disabled={busy} aria-haspopup="dialog" className={`${ctaBtn} cb-shine relative w-full overflow-hidden`}>
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
      {error && !chooserOpen && <p role="alert" className="cb-in rounded-lg bg-hard/10 px-3 py-2 text-center text-sm font-medium text-hard">{error}</p>}

      <CurrencyDialog
        open={chooserOpen}
        onClose={() => !busy && setChooserOpen(false)}
        busyWith={payingWith}
        error={error}
        inrRupees={shownInr ?? 0}
        usdCents={shownUsd ?? 0}
        listInrRupees={applied ? applied.listInrRupees : shownInr ?? 0}
        listUsdCents={applied ? applied.listUsdCents : shownUsd ?? 0}
        usdEnabled={usdEnabled && shownUsd != null}
        note={dialogNote}
        onPick={pay}
      />

      {/* Shown while the browser moves to the result page, so the screen never looks frozen after paying or closing the window */}
      {confirming && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-[70] grid place-items-center bg-black/60 backdrop-blur-sm" style={{ animation: 'cb-fade .2s ease-out both' }}>
          <div className="cb-pop mx-4 w-full max-w-xs rounded-3xl border border-line bg-surface p-7 text-center shadow-2xl">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent">
              <Spinner size={28} />
            </span>
            <p className="mt-4 text-base font-semibold">{confirming}</p>
            <p className="mt-1 text-xs text-muted">Please do not close this page.</p>
          </div>
        </div>
      )}
    </div>
  );
}