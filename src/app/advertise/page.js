import Link from 'next/link';
import { getOrCreateUser } from '@/lib/user';
import AdCheckoutForm from '@/components/ads/AdCheckoutForm';
import { AD_SLOTS, SLOT_KEYS, getSlotAvailability, slotFromParam, slotPriceCents, usd } from '@/lib/ads';
import { getAdStats } from '@/lib/ad-stats';

export const metadata = {
  title: 'Advertise on Buncho',
  description: 'Put your SaaS in front of AI and ML engineers who are preparing for interviews. Two banner columns, one month each.',
};
export const dynamic = 'force-dynamic';

const dateFmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const n = (v) => Number(v ?? 0).toLocaleString('en-US');

function Stat({ label, hint, value, growth }) {
  const hasGrowth = Number.isFinite(growth);
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
        {hasGrowth && (
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${growth >= 0 ? 'bg-go/15 text-go' : 'bg-hard/15 text-hard'}`}>
            {growth > 0 ? '+' : ''}{growth}%
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default async function AdvertisePage({ searchParams }) {
  const sp = await searchParams;
  const slot = slotFromParam(sp?.slot);
  const [user, availability, stats] = await Promise.all([
    getOrCreateUser(),
    getSlotAvailability(),
    getAdStats({ refresh: true }), // fills itself from Google Analytics when the stored numbers are old
  ]);

  const other = stats.countries.reduce((sum, c) => sum + c.share, 0);
  const rows = [...stats.countries, { name: 'Other countries', flag: '🌍', share: Math.max(0, 100 - other) }];

  const benefits = [
    ['The right audience', 'Visitors come to practise AI, ML and GenAI interview questions, so they are engineers who build with this stuff and care about tools.'],
    ...(stats.monthlyVisitorsGrowth > 0
      ? [['Traffic that is growing', `Monthly visitors are up ${stats.monthlyVisitorsGrowth}% on the previous 30 days, so a banner booked now is seen by more people each month.`]]
      : []),
    ['Top of the question library', 'Your banner sits at the top of /problems, above the question list, not in a footer nobody scrolls to.'],
    ['Simple and fair', 'One month, one flat price, no bidding and no contract. Every banner is checked by a person before it goes live.'],
  ];

  const loginHref = `/login?redirect_url=${encodeURIComponent(`/advertise${slot ? `?slot=${AD_SLOTS[slot].n}` : ''}`)}`;
  const state = slot ? availability[slot] : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:pt-14">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Advertise on Buncho</p>
      <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Put your SaaS in front of engineers who are learning AI right now
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
        Buncho helps people prepare for AI, ML and GenAI interviews. Here are our real numbers, so you can decide before you pay.
      </p>

      {/* Real numbers */}
      <section aria-labelledby="numbers-h" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="numbers-h" className="text-lg font-semibold">Our traffic</h2>
          <p className="text-xs text-muted">{stats.site} · {stats.periodLabel} · as of {stats.asOf} · Google Analytics</p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat label="Monthly visitors" hint="Unique visitors" value={n(stats.monthlyVisitors)} growth={stats.monthlyVisitorsGrowth} />
          <Stat label="Page views" hint="All pages" value={n(stats.pageViews)} growth={stats.pageViewsGrowth} />
          <Stat label="Daily visitors" hint="Average per day, last 7 days" value={n(stats.dailyVisitors)} growth={stats.dailyVisitorsGrowth} />
        </div>

        {rows.length > 1 && (
          <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
            <h3 className="text-sm font-semibold">Where our visitors are</h3>
            <ul className="mt-4 space-y-3">
              {rows.map((c) => (
                <li key={c.name}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2"><span aria-hidden="true">{c.flag}</span>{c.name}</span>
                    <span className="tabular-nums text-muted">
                      {c.share}%{c.visitors ? ` · ${n(c.visitors)} visitors · ${c.viewsLabel} views` : ''}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${c.share}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-2 text-xs text-muted">Traffic can go up or down from month to month. These are the numbers as they stand today.</p>
      </section>

      {/* Why it benefits */}
      <section aria-labelledby="why-h" className="mt-12">
        <h2 id="why-h" className="text-lg font-semibold">Why this is good for your SaaS</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {benefits.map(([title, text]) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Choose a column */}
      <section aria-labelledby="slot-h" className="mt-12" id="book">
        <h2 id="slot-h" className="text-lg font-semibold">Choose your column</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {SLOT_KEYS.map((key) => {
            const cfg = AD_SLOTS[key];
            const a = availability[key];
            const on = slot === key;
            const taken = a.state !== 'open';
            return (
              <li key={key}>
                <Link
                  href={`/advertise?slot=${cfg.n}#book`}
                  aria-current={on ? 'true' : undefined}
                  className={`block rounded-2xl border p-5 transition-colors ${on ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-muted'}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{cfg.label}</span>
                    <span className="text-2xl font-semibold tabular-nums">{usd(slotPriceCents(key))}<span className="text-sm font-normal text-muted"> / month</span></span>
                  </div>
                  <p className={`mt-2 text-sm ${taken ? 'text-medium' : 'text-muted'}`}>
                    {a.state === 'live' && `Booked until ${dateFmt(a.until)}`}
                    {a.state === 'review' && 'Booked, waiting for approval'}
                    {a.state === 'open' && 'Available now'}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>

        {slot && state?.state === 'open' && (
          <div className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <h3 className="font-semibold">Your banner details · {AD_SLOTS[slot].label}</h3>
            <div className="mt-5">
              <AdCheckoutForm
                key={slot}
                slot={String(AD_SLOTS[slot].n)}
                priceLabel={usd(slotPriceCents(slot))}
                defaultEmail={user?.email ?? ''}
                signedIn={Boolean(user)}
                loginHref={loginHref}
              />
            </div>
          </div>
        )}

        {slot && state?.state !== 'open' && (
          <p className="mt-6 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
            This column is not available right now. {state.state === 'live' ? `It is free again after ${dateFmt(state.until)}.` : 'Please check back soon or choose the other column.'}
          </p>
        )}

        {!slot && <p className="mt-6 text-sm text-muted">Pick a column above to fill in your banner and continue to payment.</p>}
      </section>

      <section aria-labelledby="how-h" className="mt-12">
        <h2 id="how-h" className="text-lg font-semibold">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['1. Pay securely', 'Fill in your banner and pay on Dodo Payments.'],
            ['2. We review it', 'A person checks your banner. If we cannot run it, you get a refund.'],
            ['3. It goes live', 'Your banner runs for 1 month from the day it is approved.'],
          ].map(([t, d]) => (
            <li key={t} className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}