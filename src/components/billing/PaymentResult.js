'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ctaBtn } from '@/components/jobs/ui';

const REDIRECT_SECONDS = 8; // after a successful payment
const POLL_EVERY_MS = 4000; // while the bank has not confirmed yet
const POLL_MAX = 8;

const COLORS = ['var(--accent)', 'var(--easy)', 'var(--medium)', '#f59e0b', '#38bdf8', '#f472b6', '#a78bfa'];
// Fixed numbers (no Math.random) so the server and the browser draw exactly the same pieces.
const CONFETTI = Array.from({ length: 56 }, (_, i) => ({
  left: (i * 47) % 100,
  delay: (i % 13) * 0.08,
  dur: 2.6 + (i % 6) * 0.35,
  dx: ((i * 31) % 120) - 60,
  size: 6 + (i % 4) * 2,
  color: COLORS[i % COLORS.length],
  round: i % 3 === 0,
}));
const RAYS = Array.from({ length: 14 }, (_, i) => ({ angle: i * (360 / 14), color: COLORS[i % COLORS.length], delay: 0.55 + (i % 4) * 0.05, big: i % 2 === 0 }));
const SHARDS = Array.from({ length: 10 }, (_, i) => ({ angle: i * 36 + 12, delay: 0.5 + (i % 3) * 0.04 }));

const CSS = `
@keyframes pr-pop{0%{transform:scale(.3);opacity:0}55%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes pr-draw{to{stroke-dashoffset:0}}
@keyframes pr-ring{0%{transform:scale(.8);opacity:.55}100%{transform:scale(2.4);opacity:0}}
@keyframes pr-shake{0%,100%{transform:translateX(0) rotate(0)}15%{transform:translateX(-10px) rotate(-4deg)}30%{transform:translateX(9px) rotate(3deg)}45%{transform:translateX(-7px) rotate(-2deg)}60%{transform:translateX(5px) rotate(1deg)}75%{transform:translateX(-2px)}}
@keyframes pr-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes pr-card{from{opacity:0;transform:translateY(28px) scale(.96)}to{opacity:1;transform:none}}
@keyframes pr-fall{0%{transform:translate3d(0,-12vh,0) rotate(0);opacity:0}8%{opacity:1}100%{transform:translate3d(var(--dx),108vh,0) rotate(760deg);opacity:1}}
@keyframes pr-burst{0%{transform:translateY(-22px) scale(.3);opacity:0}20%{opacity:1}100%{transform:translateY(-84px) scale(1);opacity:0}}
@keyframes pr-shard{0%{transform:translateY(-26px) scale(.5);opacity:0}25%{opacity:.9}100%{transform:translateY(-70px) scale(.2);opacity:0}}
@keyframes pr-float{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(24px,-18px,0) scale(1.12)}}
@keyframes pr-glow{0%,100%{box-shadow:0 0 0 0 var(--glow)}50%{box-shadow:0 0 0 18px transparent}}
@keyframes pr-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes pr-spin{to{transform:rotate(360deg)}}
@keyframes pr-dot{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
@keyframes pr-shine{0%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
@keyframes pr-tilt{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
.pr-card{animation:pr-card .6s cubic-bezier(.2,.9,.3,1) both}
.pr-pop{animation:pr-pop .65s cubic-bezier(.2,.9,.3,1.3) both}
.pr-shake{animation:pr-shake .7s .3s ease-in-out both}
.pr-pulse{animation:pr-pulse 1.8s ease-in-out infinite}
.pr-glow{animation:pr-glow 2s ease-out .9s infinite}
.pr-tilt{animation:pr-tilt 2.4s ease-in-out infinite}
.pr-spin{transform-origin:32px 32px;animation:pr-spin 1.1s linear infinite}
.pr-ring{animation:pr-ring 2s ease-out infinite}
.pr-draw{animation:pr-draw .55s .35s ease-out forwards}
.pr-up{animation:pr-up .55s ease-out both}
.pr-float{animation:pr-float 9s ease-in-out infinite}
.pr-confetti{position:absolute;top:0;animation:pr-fall linear forwards;will-change:transform}
.pr-ray{animation:pr-burst .9s ease-out both}
.pr-shard{animation:pr-shard .8s ease-out both}
.pr-dot{animation:pr-dot 1.2s ease-in-out infinite}
.pr-shine::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.22) 50%,transparent 60%);transform:translateX(-130%);animation:pr-shine 1.4s .9s ease-out 1 both}
@media (prefers-reduced-motion:reduce){
  .pr-card,.pr-pop,.pr-shake,.pr-pulse,.pr-glow,.pr-tilt,.pr-spin,.pr-ring,.pr-up,.pr-float,.pr-ray,.pr-shard,.pr-dot{animation:none!important}
  .pr-draw{animation:none!important;stroke-dashoffset:0!important}
  .pr-confetti,.pr-shine::after{display:none}
}
`;

const TONE = {
  paid: {
    glow: 'rgba(34,197,94,.45)',
    solid: 'bg-go text-go-ink',
    soft: 'bg-go/15',
    text: 'text-go',
    ring: 'border-go/50',
    head: 'from-go/25 via-accent/10 to-transparent',
    blobA: 'bg-go/25',
    blobB: 'bg-accent/20',
  },
  failed: {
    glow: 'rgba(239,68,68,.45)',
    solid: 'bg-hard text-white',
    soft: 'bg-hard/15',
    text: 'text-hard',
    ring: 'border-hard/50',
    head: 'from-hard/25 via-medium/10 to-transparent',
    blobA: 'bg-hard/20',
    blobB: 'bg-medium/15',
  },
  cancelled: {
    glow: 'rgba(245,158,11,.4)',
    solid: 'bg-medium text-white',
    soft: 'bg-medium/15',
    text: 'text-medium',
    ring: 'border-medium/50',
    head: 'from-medium/25 via-surface-2/40 to-transparent',
    blobA: 'bg-medium/20',
    blobB: 'bg-accent/10',
  },
  pending: {
    glow: 'rgba(245,158,11,.4)',
    solid: 'bg-medium text-white',
    soft: 'bg-medium/15',
    text: 'text-medium',
    ring: 'border-medium/50',
    head: 'from-medium/25 via-accent/10 to-transparent',
    blobA: 'bg-medium/20',
    blobB: 'bg-accent/15',
  },
};

const COPY = {
  paid: { badge: 'Payment successful', title: 'You’re on Buncho Pro', sub: 'Thank you! Everything is unlocked and ready for you.' },
  failed: { badge: 'Payment failed', title: 'That didn’t go through', sub: 'You have not been charged for this attempt. If money left your account, your bank refunds it automatically within a few working days.' },
  cancelled: { badge: 'Not completed', title: 'Payment not completed', sub: 'The payment window was closed before paying, so nothing was charged. Your upgrade is one tap away whenever you are ready.' },
  pending: { badge: 'Confirming', title: 'Confirming your payment', sub: 'We are waiting for your bank. UPI and card payments can take a minute. If money was deducted, Pro switches on by itself, so you do not need to pay again.' },
};

const PERKS = ['Pro-only questions', 'Unlimited mock tests', 'Multiple role plans', 'Company insights'];
const TIPS = ['Try UPI or a different card', 'Check the card is enabled for online payments', 'Pay in the other currency instead'];

function Icon({ state }) {
  const t = TONE[state];
  const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <div className="relative mx-auto grid h-36 w-36 place-items-center">
      {state === 'paid' &&
        RAYS.map((r, i) => (
          <span key={i} aria-hidden="true" className="absolute inset-0 grid place-items-center" style={{ transform: `rotate(${r.angle}deg)` }}>
            <span className="pr-ray block rounded-full" style={{ width: r.big ? 9 : 6, height: r.big ? 9 : 6, background: r.color, animationDelay: `${r.delay}s` }} />
          </span>
        ))}
      {state === 'failed' &&
        SHARDS.map((r, i) => (
          <span key={i} aria-hidden="true" className="absolute inset-0 grid place-items-center" style={{ transform: `rotate(${r.angle}deg)` }}>
            <span className="pr-shard block h-3 w-[3px] rounded-full bg-hard" style={{ animationDelay: `${r.delay}s` }} />
          </span>
        ))}
      {state !== 'pending' && (
        <>
          <span aria-hidden="true" className={`pr-ring absolute inset-6 rounded-full border-2 ${t.ring}`} />
          <span aria-hidden="true" className={`pr-ring absolute inset-6 rounded-full border-2 ${t.ring}`} style={{ animationDelay: '1s' }} />
        </>
      )}
      <span
        className={`pr-pop ${state === 'paid' ? 'pr-glow' : ''} ${state === 'failed' ? 'pr-shake' : ''} ${state === 'pending' ? 'pr-pulse' : ''} relative grid h-24 w-24 place-items-center rounded-full shadow-xl ${state === 'pending' ? t.soft + ' ' + t.text : t.solid}`}
        style={{ '--glow': t.glow }}
      >
        <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
          {state === 'paid' && (
            <path d="M17 33l10 10 20-22" {...stroke} strokeWidth="6" className="pr-draw" style={{ strokeDasharray: 56, strokeDashoffset: 56 }} />
          )}
          {state === 'failed' && (
            <>
              <path d="M20 20l24 24" {...stroke} strokeWidth="6" className="pr-draw" style={{ strokeDasharray: 34, strokeDashoffset: 34 }} />
              <path d="M44 20L20 44" {...stroke} strokeWidth="6" className="pr-draw" style={{ strokeDasharray: 34, strokeDashoffset: 34, animationDelay: '.55s' }} />
            </>
          )}
          {state === 'cancelled' && (
            <>
              <circle cx="32" cy="32" r="22" {...stroke} strokeWidth="5" className="pr-draw" style={{ strokeDasharray: 140, strokeDashoffset: 140 }} />
              <path d="M32 20v13l8 5" {...stroke} strokeWidth="5" className="pr-draw" style={{ strokeDasharray: 30, strokeDashoffset: 30, animationDelay: '.7s' }} />
            </>
          )}
          {state === 'pending' && (
            <>
              <circle cx="32" cy="32" r="24" {...stroke} strokeWidth="5" strokeOpacity="0.2" />
              <circle cx="32" cy="32" r="24" {...stroke} strokeWidth="5" className="pr-spin" strokeDasharray="42 140" />
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
      {CONFETTI.map((p, i) => (
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

/** pending only: Payment sent -> Bank confirming -> Pro unlocked */
function Steps() {
  const steps = [
    ['Payment sent', 'done'],
    ['Bank confirming', 'now'],
    ['Pro unlocked', 'next'],
  ];
  return (
    <ol className="pr-up mx-auto mt-7 flex max-w-xs items-start justify-between" style={{ animationDelay: '.7s' }}>
      {steps.map(([name, st], i) => (
        <li key={name} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-3 h-0.5 w-full ${st === 'next' ? 'bg-line' : 'bg-medium/60'}`} />}
          <span className={`relative z-10 grid h-6 w-6 place-items-center rounded-full text-[0.65rem] font-bold ${st === 'done' ? 'bg-go text-go-ink' : st === 'now' ? 'bg-medium text-white pr-pulse' : 'border border-line bg-surface text-muted'}`}>
            {st === 'done' ? '✓' : i + 1}
          </span>
          <span className={`mt-1.5 text-[0.7rem] font-medium ${st === 'next' ? 'text-muted' : 'text-ink'}`}>{name}</span>
        </li>
      ))}
    </ol>
  );
}

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
  const t = TONE[state] ?? TONE.failed;

  // Success: count down, then go on to the app.
  useEffect(() => {
    if (state !== 'paid' || stay) return;
    if (left <= 0) {
      router.push(redirectTo);
      return;
    }
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [state, stay, left, router, redirectTo]);

  // Waiting for the bank: ask the server again every few seconds (a few times), it re-checks with Razorpay.
  useEffect(() => {
    if (state !== 'pending') return;
    const id = setInterval(() => {
      tries.current += 1;
      if (tries.current > POLL_MAX) return clearInterval(id);
      router.refresh();
    }, POLL_EVERY_MS);
    return () => clearInterval(id);
  }, [state, router]);

  const ghost = 'inline-flex items-center justify-center rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-muted hover:bg-surface-2';
  const rows = [
    ['Amount', amountText],
    ['Plan', planText],
    ['Method', methodText],
    ['Promo code', code],
    ['Pro active until', state === 'paid' ? periodEndText : null],
    ['Order', orderId ? `${orderId.slice(0, 12)}…` : null],
  ].filter(([, v]) => v);
  const showReceipt = rows.length > 0 && (state === 'paid' || state === 'failed' || state === 'pending');
  const ringC = 2 * Math.PI * 11;

  return (
    <div className="relative isolate grid min-h-[calc(100vh-6rem)] place-items-center overflow-hidden px-4 py-12 sm:px-6">
      <style>{CSS}</style>
      {state === 'paid' && <Confetti />}

      {/* soft drifting colour blobs behind the card */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <span className={`pr-float absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl ${t.blobA}`} />
        <span className={`pr-float absolute -right-20 bottom-0 h-80 w-80 rounded-full blur-3xl ${t.blobB}`} style={{ animationDelay: '-4s' }} />
      </div>

      <div className="pr-card relative w-full max-w-md overflow-hidden rounded-[2rem] border border-line bg-surface/90 shadow-2xl shadow-black/10 backdrop-blur">
        {/* coloured header with the big animated icon */}
        <div className={`pr-shine relative overflow-hidden bg-gradient-to-b px-6 pb-4 pt-8 ${t.head}`}>
          <span className={`pr-up inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${t.soft} ${t.text}`} style={{ animationDelay: '.2s' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {copy.badge}
          </span>
          <div className="mt-2">
            <Icon state={state} />
          </div>
        </div>

        <div className="px-6 pb-8 text-center sm:px-8">
          <h1 role="status" className={`pr-up text-2xl font-bold tracking-tight sm:text-3xl ${state === 'paid' ? 'bg-gradient-to-r from-go to-accent bg-clip-text text-transparent' : ''}`} style={{ animationDelay: '.55s' }}>
            {copy.title}
          </h1>
          <p className="pr-up mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted" style={{ animationDelay: '.7s' }}>{copy.sub}</p>

          {state === 'failed' && reason && (
            <p className="pr-up mx-auto mt-4 max-w-sm rounded-xl border border-hard/30 bg-hard/10 px-3 py-2 text-xs font-medium text-hard" style={{ animationDelay: '.8s' }}>{reason}</p>
          )}

          {state === 'paid' && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {PERKS.map((p, i) => (
                <span key={p} className="pr-pop inline-flex items-center gap-1 rounded-full bg-go/12 px-2.5 py-1 text-[0.72rem] font-semibold text-go" style={{ animationDelay: `${0.9 + i * 0.12}s`, background: 'color-mix(in srgb, var(--go) 14%, transparent)' }}>
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                  {p}
                </span>
              ))}
            </div>
          )}

          {state === 'pending' && <Steps />}

          {state === 'failed' && (
            <ul className="pr-up mx-auto mt-5 max-w-xs space-y-1.5 text-left text-xs text-muted" style={{ animationDelay: '.9s' }}>
              {TIPS.map((tip) => (
                <li key={tip} className="flex items-center gap-2">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-medium/20 text-[0.6rem] font-bold text-medium">!</span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ticket-style receipt: dashed tear line with notches */}
        {showReceipt && (
          <div className="relative">
            <span aria-hidden="true" className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-line bg-bg" />
            <span aria-hidden="true" className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-line bg-bg" />
            <div className="mx-6 border-t-2 border-dashed border-line" />
            <dl className="px-6 pb-2 pt-3 text-sm sm:px-8">
              {rows.map(([k, v], i) => (
                <div key={k} className="pr-up flex items-center justify-between gap-4 py-1.5" style={{ animationDelay: `${1 + i * 0.09}s` }}>
                  <dt className="text-muted">{k}</dt>
                  <dd className={`min-w-0 truncate text-right font-semibold tabular-nums ${k === 'Amount' ? 'text-base' : ''}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* actions */}
        <div className="px-6 pb-8 pt-4 text-center sm:px-8">
          {state === 'paid' && (
            <div className="pr-up mx-auto mb-4 flex max-w-xs items-center justify-center gap-3" style={{ animationDelay: '1.3s' }}>
              {!stay ? (
                <>
                  <svg viewBox="0 0 28 28" width="30" height="30" aria-hidden="true" className="shrink-0 -rotate-90">
                    <circle cx="14" cy="14" r="11" fill="none" stroke="var(--line)" strokeWidth="3" />
                    <circle cx="14" cy="14" r="11" fill="none" stroke="var(--go)" strokeWidth="3" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC * (left / REDIRECT_SECONDS)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <p className="text-left text-xs text-muted" role="timer">
                    Taking you to {redirectLabel} in <span className="font-semibold tabular-nums text-ink">{left}s</span>
                    <button type="button" onClick={() => setStay(true)} className="ml-2 font-semibold text-accent hover:underline">Stay here</button>
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted">Okay, you can head on whenever you are ready.</p>
              )}
            </div>
          )}

          <div className="pr-up flex flex-wrap justify-center gap-3" style={{ animationDelay: '1.4s' }}>
            {state === 'paid' && (
              <>
                <Link href={redirectTo} className={ctaBtn}>Go to {redirectLabel} →</Link>
                <Link href="/problems" className={ghost}>Browse questions</Link>
              </>
            )}
            {state === 'pending' && (
              <>
                <button type="button" onClick={() => router.refresh()} className={ctaBtn}>
                  Check again
                  <span className="ml-1 inline-flex gap-0.5" aria-hidden="true">
                    {[0, 1, 2].map((d) => <span key={d} className="pr-dot h-1 w-1 rounded-full bg-current" style={{ animationDelay: `${d * 0.15}s` }} />)}
                  </span>
                </button>
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

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[0.7rem] text-muted">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            Secured by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}