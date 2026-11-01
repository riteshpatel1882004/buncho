import Link from 'next/link';
import AdCard from '@/components/ads/AdCard';
import { AD_SLOTS, SLOT_KEYS, slotPriceCents, usd } from '@/lib/ads';
import { getAdStats } from '@/lib/ad-stats';

function EmptySlot({ slot, visitors }) {
  const { n } = AD_SLOTS[slot];
  return (
    <Link
      href={`/advertise?slot=${n}`}
      className="group flex h-full flex-col justify-between rounded-2xl border border-dashed border-accent/40 bg-gradient-to-br from-accent-soft to-surface p-4 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lg hover:shadow-accent/5 sm:min-h-44 sm:p-5"
    >
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-accent">Your banner here</p>
        <h3 className="mt-2.5 text-base font-semibold leading-snug sm:mt-3">Promote your SaaS</h3>
        <p className="mt-1 line-clamp-3 text-xs text-muted">
          Reach {visitors.toLocaleString('en-US')}+ AI and ML engineers every month, right at the top of our question library.
        </p>
      </div>
      <span className="mt-3 inline-flex w-fit items-center rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink group-hover:opacity-90 sm:mt-4">
        {usd(slotPriceCents(slot))} / month <span aria-hidden="true" className="ml-1">→</span>
      </span>
    </Link>
  );
}

// The sponsor section on /problems. A live banner fills a slot, an empty slot invites advertisers.
// Phones: the slots sit in a swipeable row so they never push the list far down. From sm up: two columns.
export default async function PromoSection({ ads = {} }) {
  const { monthlyVisitors } = await getAdStats(); // stored numbers only, never calls Vercel from this page
  return (
    <section aria-label="Sponsored" className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface-2/40 p-3 sm:p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3 sm:mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Sponsored</p>
        <Link href="/advertise" className="text-xs font-semibold text-accent hover:underline">
          Why advertise with us?
        </Link>
      </div>
      <div className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-0.5 sm:mx-0 sm:grid sm:flex-1 sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
        {SLOT_KEYS.map((slot) => (
          <div key={slot} className="w-[82%] shrink-0 snap-start sm:w-auto">
            {ads[slot] ? <AdCard ad={ads[slot]} /> : <EmptySlot slot={slot} visitors={monthlyVisitors} />}
          </div>
        ))}
      </div>
    </section>
  );
}