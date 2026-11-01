import Link from 'next/link';
import AdCard from '@/components/ads/AdCard';
import { AD_SLOTS, SLOT_KEYS, slotPriceCents, usd } from '@/lib/ads';
import { getAdStats } from '@/lib/ad-stats';

function EmptySlot({ slot, visitors }) {
  const { n } = AD_SLOTS[slot];
  const count = visitors.toLocaleString('en-US');
  return (
    <Link
      href={`/advertise?slot=${n}`}
      className="group flex h-full flex-col justify-between rounded-2xl border border-dashed border-accent/40 bg-gradient-to-br from-accent-soft to-surface p-3 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lg hover:shadow-accent/5 sm:min-h-44 sm:p-5"
    >
      <div>
        <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-accent sm:text-[0.65rem]">Your banner here</p>
        <h3 className="mt-2 text-sm font-semibold leading-snug sm:mt-3 sm:text-base">Promote your SaaS</h3>
        <p className="mt-1 text-xs leading-snug text-muted">
          <span className="sm:hidden">Reach {count}+ AI engineers monthly.</span>
          <span className="hidden sm:inline">
            Reach {count}+ AI and ML engineers every month, right at the top of our question library.
          </span>
        </p>
      </div>
      <span className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-ink group-hover:opacity-90 sm:mt-4 sm:w-fit sm:px-3.5 sm:text-sm">
        {usd(slotPriceCents(slot))} / month <span aria-hidden="true" className="ml-1">→</span>
      </span>
    </Link>
  );
}

// The sponsor section on /problems. A live banner fills a slot, an empty slot invites advertisers.
// Always two equal columns (50 / 50), on phones too.
export default async function PromoSection({ ads = {} }) {
  const { monthlyVisitors } = await getAdStats(); // stored numbers only, never calls Vercel from this page
  return (
    <section aria-label="Sponsored" className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface-2/40 p-3 sm:p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3 sm:mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Sponsored</p>
        <Link href="/advertise" className="text-xs font-semibold text-accent hover:underline">
          <span className="sm:hidden">Advertise here</span>
          <span className="hidden sm:inline">Why advertise with us?</span>
        </Link>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2.5 sm:gap-3">
        {SLOT_KEYS.map((slot) =>
          ads[slot] ? <AdCard key={slot} ad={ads[slot]} /> : <EmptySlot key={slot} slot={slot} visitors={monthlyVisitors} />,
        )}
      </div>
    </section>
  );
}