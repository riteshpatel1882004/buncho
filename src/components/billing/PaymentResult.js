'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ctaBtn } from '@/components/jobs/ui';

const REDIRECT_SECONDS = 8; // after a successful payment
const POLL_EVERY_MS = 4000; // while the bank has not confirmed yet
const POLL_MAX = 8;

const COLORS = ['var(--accent)', 'var(--easy)', 'var(--medium)', '#f59e0b', '#38bdf8', '#f472b6'];
// Fixed numbers (no Math.random) so the server and the browser draw the same confetti.
const PIECES = Array.from({ length: 44 }, (_, i) => ({
  left: (i * 53) % 100,
  delay: (i % 11) * 0.09,
  dur: 2.4 + (i % 5) * 0.35,
  dx: ((i * 29) % 90) - 45,
  size: 6 + (i % 4) * 2,
  color: COLORS[i % COLORS.length],
  round: i % 3 === 0,
}));

const CSS = `
@keyframes pr-pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes pr-draw{to{stroke-dashoffset:0}}
@keyframes pr-ring{0%{transform:scale(.7);opacity:.5}100%{transform:scale(2.2);opacity:0}}
@keyframes pr-shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-9px)}30%{transform:translateX(8px)}45%{transform:translateX(-6px)}60%{transform:translateX(4px)}75%{transform:translateX(-2px)}}
@keyframes pr-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pr-fall{0%{transform:translate3d(0,-12vh,0) rotate(0);opacity:0}8%{opacity:1}100%{transform:translate3d(var(--dx),108vh,0) rotate(720deg);opacity:1}}
@keyframes pr-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes pr-spin{to{transform:rotate(360deg)}}
.pr-pop{animation:pr-pop .6s cubic-bezier(.2,.9,.3,1.3) both}
.pr-shake{animation:pr-shake .6s .25s ease-in-out both}
.pr-pulse{animation:pr-pulse 1.8s ease-in-out infinite}
.pr-spin{transform-origin:32px 32px;animation:pr-spin 1.1s linear infinite}
.pr-ring{animation:pr-ring 1.8s ease-out infinite}
.pr-draw{animation:pr-draw .55s .35s ease-out forwards}
.pr-up{animation:pr-up .5s ease-out both}
.pr-confetti{position:absolute;top:0;animation:pr-fall linear forwards;will-change:transform}
@media (prefers-reduced-motion:reduce){
  .pr-pop,.pr-shake,.pr-pulse,.pr-spin,.pr-ring,.pr-up{animation:none!important}
  .pr-draw{animation:none!important;stroke-dashoffset:0!important}
  .pr-confetti{display:none}
}
`;

const TONE = {
  paid: { text: 'text-go', soft: 'bg-go/15', ring: 'border-go/50' },
  failed: { text: 'text-hard', soft: 'bg-hard/15', ring: 'border-hard/50' },
  cancelled: { text: 'text-medium', soft: 'bg-medium/15', ring: 'border-medium/50' },
  pending: { text: 'text-medium', soft: 'bg-medium/15', ring: 'border-medium/50' },
};

function Icon({ state }) {
  const t = TONE[state];
  const circle = { cx: 32, cy: 32, r: 28, fill: 'none', stroke: 'currentColor', strokeWidth: 4, strokeLinecap: 'round' };
  return (
    <div className="relative mx-auto grid h-28 w-28 place-items-center">
      {state !== 'pending' && (
        <>
          <span aria-hidden="true" className={`pr-ring absolute inset-3 rounded-full border-2 ${t.ring}`} />
          <span aria-hidden="true" className={`pr-ring absolute inset-3 rounded-full border-2 ${t.ring}`} style={{ animationDelay: '.9s' }} />
        </>
      )}
      <span className={`pr-pop relative grid h-24 w-24 place-items-center rounded-full ${t.soft} ${t.text} ${state === 'failed' ? 'pr-shake' : ''} ${state === 'pending' ? 'pr-pulse' : ''}`}>
        <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
          {state === 'paid' && (
            <>
              <circle {...circle} className="pr-draw" style={{ strokeDasharray: 176, strokeDashoffset: 176 }} />
              <path d="M19 33l9 9 17-19" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="pr-draw" style={{ strokeDasharray: 50, strokeDashoffset: 50, animationDelay: '.75s' }} />
            </>
          )}
          {state === 'failed' && (
            <>
              <circle {...circle} className="pr-draw" style={{ strokeDasharray: 176, strokeDashoffset: 176 }} />
              <path d="M23 23l18 18" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="pr-draw" style={{ strokeDasharray: 26, strokeDashoffset: 26, animationDelay: '.7s' }} />
              <path d="M41 23L23 41" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="pr-draw" style={{ strokeDasharray: 26, strokeDashoffset: 26, animationDelay: '.85s' }} />
            </>
          )}
          {state === 'cancelled' && (
            <>
              <circle {...circle} className="pr-draw" style={{ strokeDasharray: 176, strokeDashoffset: 176 }} />
              <path d="M32 18v15l9 6" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="pr-draw" style={{ strokeDasharray: 34, strokeDashoffset: 34, animationDelay: '.75s' }} />
            </>
          )}
          {state === 'pending' && (
            <>
              <circle {...circle} strokeOpacity="0.2" />
              <circle {...circle} className="pr-spin" strokeDasharray="44 132" />
            </>
          )}
        </svg>
      </span>
    </div>
  );
}

function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="pr-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            borderRadius: p.round ? '999px' : '2px',
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            '--dx': `${p.dx}px`,
          }}
        />
      ))}
    </div>
  );
}

const COPY = {
  paid: { title: 'Payment successful!', sub: 'Welcome to Buncho Pro. Everything is unlocked.' },
  failed: { title: 'Payment failed', sub: 'You have not been charged for this attempt. If money left your account, your bank refunds it automatically within a few working days.' },
  cancelled: { title: 'Payment not completed', sub: 'The payment window was closed before paying, so nothing was charged. You can try again whenever you like.' },
  pending: { title: 'Confirming your payment…', sub: 'We are waiting for your bank. UPI and card payments can take a minute. If money was deducted, Pro switches on by itself. You do not need to pay again.' },
};

/**
 * The page people land on after the Razorpay window closes.
 * state: 'paid' | 'failed' | 'cancelled' (window closed, not paid) | 'pending' (bank has not confirmed yet).
 * The server already asked Razorpay what happened, this only draws it.
 */
export default function PaymentResult({ state, orderId, periodEndText, amountText, planText, methodText, code, reason, redirectTo = '/jobs', redirectLabel = 'job prep' }) {
  const router = useRouter();
  const [left, setLeft] = useState(REDIRECT_SECONDS);
  const [stay, setStay] = useState(false);
  const tries = useRef(0);
  const copy = COPY[state] ?? COPY.failed;

  // Success: count down, then go on to the app.
  useEffect(() => {
    if (state !== 'paid' || stay) return;
    if (left <= 0) {
      router.push(redirectTo);
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [state, stay, left, router, redirectTo]);

  // Waiting for the bank: ask the server again every few seconds (a few times), it re-checks with Razorpay.
  useEffect(() => {
    if (state !== 'pending') return;
    const t = setInterval(() => {
      tries.current += 1;
      if (tries.current > POLL_MAX) return clearInterval(t);
      router.refresh();
    }, POLL_EVERY_MS);
    return () => clearInterval(t);
  }, [state, router]);

  const ghost = 'inline-flex items-center justify-center rounded-full border border-line px-5 py-3 text-sm font-semibold transition hover:border-muted hover:bg-surface-2';
  const rows = [
    ['Amount', amountText],
    ['Plan', planText],
    ['Method', methodText],
    ['Promo code', code],
    ['Pro active until', state === 'paid' ? periodEndText : null],
    ['Order', orderId ? `${orderId.slice(0, 12)}…` : null],
  ].filter(([, v]) => v);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-14 text-center sm:px-6 sm:py-20">
      <style>{CSS}</style>
      {state === 'paid' && <Confetti />}

      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-8 shadow-xl shadow-black/5 sm:p-10">
        <div aria-hidden="true" className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl ${TONE[state]?.soft ?? ''}`} />
        <div className="relative">
          <Icon state={state} />

          <h1 role="status" className="pr-up mt-6 text-2xl font-semibold tracking-tight sm:text-3xl" style={{ animationDelay: '.5s' }}>{copy.title}</h1>
          <p className="pr-up mx-auto mt-2 max-w-sm text-sm text-muted" style={{ animationDelay: '.65s' }}>{copy.sub}</p>
          {state === 'failed' && reason && (
            <p className="pr-up mx-auto mt-3 max-w-sm rounded-lg bg-hard/10 px-3 py-2 text-xs font-medium text-hard" style={{ animationDelay: '.75s' }}>{reason}</p>
          )}

          {rows.length > 0 && state !== 'cancelled' && (
            <dl className="pr-up mx-auto mt-6 max-w-sm divide-y divide-line rounded-2xl border border-line bg-surface-2/40 px-4 text-left text-sm" style={{ animationDelay: '.8s' }}>
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="min-w-0 truncate text-right font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {state === 'paid' && (
            <div className="pr-up mx-auto mt-6 max-w-sm" style={{ animationDelay: '.95s' }}>
              {!stay ? (
                <>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={REDIRECT_SECONDS} aria-valuenow={REDIRECT_SECONDS - left}>
                    <div className="h-full rounded-full bg-go transition-[width] duration-1000 ease-linear" style={{ width: `${((REDIRECT_SECONDS - left) / REDIRECT_SECONDS) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Taking you to {redirectLabel} in {left}s.{' '}
                    <button type="button" onClick={() => setStay(true)} className="font-semibold text-accent hover:underline">Stay here</button>
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted">Okay, you can head on whenever you are ready.</p>
              )}
            </div>
          )}

          <div className="pr-up mt-7 flex flex-wrap justify-center gap-3" style={{ animationDelay: '1.05s' }}>
            {state === 'paid' && (
              <>
                <Link href={redirectTo} className={ctaBtn}>Go to {redirectLabel}</Link>
                <Link href="/problems" className={ghost}>Browse questions</Link>
              </>
            )}
            {state === 'pending' && (
              <>
                <button type="button" onClick={() => router.refresh()} className={ctaBtn}>Check again</button>
                <Link href="/pricing" className={ghost}>Back to pricing</Link>
              </>
            )}
            {(state === 'failed' || state === 'cancelled') && (
              <>
                <Link href="/pricing" className={ctaBtn}>Try again</Link>
                <Link href="/problems" className={ghost}>Maybe later</Link>
              </>
            )}
          </div>

          {state === 'failed' && (
            <p className="mt-5 text-xs text-muted">Tip: if your bank declined it, try another method like UPI, a different card, or pay in the other currency.</p>
          )}
        </div>
      </div>
    </div>
  );
}