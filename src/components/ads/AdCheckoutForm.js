'use client';

import { useState, useTransition } from 'react';
import { startAdCheckout } from '@/app/advertise/actions';
import AdCard from '@/components/ads/AdCard';
import Spinner from '@/components/Spinner';
import { payWithRazorpay } from '@/lib/razorpay-client';

const input =
  'w-full rounded-lg border border-line bg-surface-2/40 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted">{hint}</span>}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

// slot: "1" | "2". priceLabel: "$3". loginHref: where to send a signed-out visitor.
export default function AdCheckoutForm({ slot, priceLabel, defaultEmail = '', signedIn, loginHref }) {
  const [v, setV] = useState({ companyName: '', tagline: '', description: '', linkUrl: '', logoUrl: '', ctaLabel: 'Learn more', contactEmail: defaultEmail });
  const [error, setError] = useState(null);
  const [pending, start] = useTransition();
  const [redirecting, setRedirecting] = useState(false);

  const set = (key) => (e) => setV((s) => ({ ...s, [key]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const res = await startAdCheckout({ slot, ...v });
        if (!res.ok) return setError(res.error);
        setRedirecting(true);
        // Razorpay's window opens on top of this page. After paying, the return page asks Razorpay before it confirms the booking.
        const { paymentId } = await payWithRazorpay(res);
        window.location.assign(`/advertise/return?order=${res.orderId}${paymentId ? `&payment_id=${paymentId}` : ''}`);
      } catch (err) {
        if (!err?.dismissed) console.error(err);
        setRedirecting(false);
        // Closing the window is not an error. The booking stays unpaid, and pressing the button again starts a fresh payment.
        setError(err?.dismissed ? err.message || null : err?.message || 'Something went wrong. Please try again.');
      }
    });
  }

  const busy = pending || redirecting;
  const preview = {
    companyName: v.companyName || 'Your product',
    tagline: v.tagline || 'One line that makes engineers want to click',
    description: v.description,
    linkUrl: '#',
    logoUrl: /^https:\/\//i.test(v.logoUrl.trim()) ? v.logoUrl.trim() : '',
    ctaLabel: v.ctaLabel || 'Learn more',
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="space-y-4">
        <Field label="Product or company name">
          <input className={input} value={v.companyName} onChange={set('companyName')} maxLength={60} required />
        </Field>
        <Field label="Tagline" hint="up to 110 characters">
          <input className={input} value={v.tagline} onChange={set('tagline')} maxLength={110} required />
        </Field>
        <Field label="Extra line" hint="optional, up to 200 characters">
          <textarea className={`${input} min-h-20`} value={v.description} onChange={set('description')} maxLength={200} />
        </Field>
        <Field label="Link people go to" hint="https://">
          <input className={input} type="url" inputMode="url" placeholder="https://yourproduct.com" value={v.linkUrl} onChange={set('linkUrl')} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo link" hint="optional, https image">
            <input className={input} type="url" inputMode="url" placeholder="https://.../logo.png" value={v.logoUrl} onChange={set('logoUrl')} />
          </Field>
          <Field label="Button text">
            <input className={input} value={v.ctaLabel} onChange={set('ctaLabel')} maxLength={24} />
          </Field>
        </div>
        <Field label="Contact email" hint="for the receipt and any questions about your banner">
          <input className={input} type="email" value={v.contactEmail} onChange={set('contactEmail')} required />
        </Field>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Live preview</p>
          <div className="pointer-events-none mt-2" aria-hidden="true">
            <AdCard ad={preview} />
          </div>
        </div>

        {error && <p role="alert" className="rounded-xl bg-hard/10 px-4 py-3 text-sm font-medium text-hard">{error}</p>}

        {signedIn ? (
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {busy && <Spinner size={14} />}
            {redirecting ? 'Waiting for payment…' : pending ? 'Please wait…' : `Continue to payment · ${priceLabel} for 1 month`}
          </button>
        ) : (
          <a href={loginHref} className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink hover:opacity-90">
            Log in to continue
          </a>
        )}

        <p className="text-xs text-muted">
          You will pay in a secure Razorpay window, in US dollars (international cards work). We review every banner
          before it goes live, and it runs for 1 month from the day it is approved.
        </p>
      </div>
    </form>
  );
}