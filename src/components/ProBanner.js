import Link from 'next/link';
import { Crown, ProBadge } from './ProBadge';
import { ChevronRight } from './icons';
import Popup from './Popup';
import PlanDetails from './billing/PlanDetails';

const dateFmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

const SURFACE =
  'border border-amber-400/60 bg-gradient-to-br from-amber-50 via-amber-100/70 to-white shadow-lg shadow-amber-500/10 dark:border-amber-400/40 dark:from-[#2d230a] dark:via-[#241c0a] dark:to-[#1d1a14]';

/**
 * Compact premium strip for active Pro users. Sits next to the greeting on desktop.
 * Phones: title + PRO badge only; tapping opens the plan details popup (the perk list lives there).
 */
export default function ProBanner({ periodEnd, className = '' }) {
  const end = new Date(periodEnd);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
  const soon = daysLeft <= 5;

  return (
    <div className={className}>
      {/* Phones */}
      <div className="md:hidden">
        <Popup
          title="Your plan"
          subtitle="Buncho Pro"
          buttonLabel={
            <>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-amber-950 shadow-md shadow-amber-500/30">
                <Crown width={22} height={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-base font-semibold leading-snug tracking-tight">Buncho Pro</span>
                  <ProBadge />
                </span>
                <span className="mt-0.5 block text-sm text-muted">
                  Active ·{' '}
                  <span className={soon ? 'font-semibold text-medium' : 'font-medium text-ink'}>
                    {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                  </span>
                </span>
              </span>
              <ChevronRight width={20} height={20} className="shrink-0 text-muted" />
            </>
          }
          buttonClassName={`flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left ${SURFACE}`}
        >
          <PlanDetails periodEnd={periodEnd} />
        </Popup>
      </div>

      {/* Tablets and desktops: one compact row */}
      <section aria-label="Buncho Pro" className={`relative hidden overflow-hidden rounded-2xl px-5 py-4 md:block ${SURFACE}`}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-amber-950 shadow-md shadow-amber-500/30">
              <Crown width={22} height={22} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">You&rsquo;re on Buncho Pro</h2>
                <ProBadge />
              </div>
              <p className="mt-0.5 text-sm text-muted">
                Active until <span className="font-semibold text-ink">{dateFmt(end)}</span> ·{' '}
                <span className={soon ? 'font-semibold text-medium' : ''}>
                  {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                </span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Popup
              title="Your plan"
              subtitle="Buncho Pro"
              buttonLabel="Plan details"
              buttonClassName="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-amber-500/50 bg-white/60 px-4 py-2 text-sm font-semibold transition hover:bg-white dark:bg-black/20 dark:hover:bg-black/30"
            >
              <PlanDetails periodEnd={periodEnd} />
            </Popup>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 px-4 py-2 text-sm font-bold text-amber-950 shadow-md shadow-amber-500/30 transition hover:-translate-y-0.5 hover:opacity-95"
            >
              {soon ? 'Renew now' : 'Extend Pro'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}