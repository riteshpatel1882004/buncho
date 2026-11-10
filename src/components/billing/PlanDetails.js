import Link from 'next/link';
import { ProBadge } from '@/components/ProBadge';
import { Check } from '@/components/icons';

const PERKS = [
  'Pro-only system design and case study questions',
  'Multiple role preparation plans',
  'Unlimited mock assessment attempts while subscribed',
  'Assessment history and score comparisons',
  'Company-wise question insights',
  'Question frequency data',
  'Advanced preparation and revision features',
];

const dateFmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

export default function PlanDetails({ periodEnd }) {
  const end = new Date(periodEnd);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-50 to-white p-4 dark:from-[#2d230a] dark:to-[#1f1b12]">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            Buncho Pro <ProBadge />
          </p>
          <p className="mt-1 text-sm text-muted">
            Active until <span className="font-semibold text-ink">{dateFmt(end)}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-3xl font-semibold leading-none tabular-nums text-amber-600 dark:text-amber-400">{daysLeft}</p>
          <p className="mt-1 text-xs text-muted">day{daysLeft === 1 ? '' : 's'} left</p>
        </div>
      </div>

      <p className="text-sm text-muted">
        Pro does not renew by itself. When you pay again, the new time is added on top of what you have left, so you never lose a day.
      </p>

      <ul className="space-y-2.5">
        {PERKS.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <Check width={10} height={10} strokeWidth={3.5} />
            </span>
            {p}
          </li>
        ))}
      </ul>

      <Link
        href="/pricing"
        className="flex w-full items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 px-5 py-3 text-sm font-bold text-amber-950 shadow-md shadow-amber-500/30 transition hover:opacity-95"
      >
        Extend Pro
      </Link>
    </div>
  );
}