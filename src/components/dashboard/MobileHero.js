import { Flame, Bookmark, Grid } from '@/components/icons';

const CELLS = [
  { key: 'streak', label: 'Streak', tone: 'bg-orange-500/12 text-orange-500', Icon: Flame },
  { key: 'saved', label: 'Saved', tone: 'bg-sky-500/12 text-sky-500', Icon: Bookmark },
  { key: 'left', label: 'To go', tone: 'bg-violet-500/12 text-violet-500', Icon: Grid },
];

/**
 * Phone-only summary card at the top of the dashboard: one big number, a progress bar and three
 * quick stats. From lg up the four stat tiles are shown instead, so this renders nothing there.
 */
export default function MobileHero({ solved, total, streak, saved }) {
  const pct = total ? Math.round((solved / total) * 100) : 0;
  const bar = solved > 0 ? Math.max(pct, 2) : 0;
  const values = { streak, saved, left: Math.max(0, total - solved) };

  return (
    <section aria-label="Progress summary" className="hero-card p-5 lg:hidden">
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">Your progress</p>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold tabular-nums text-accent">{pct}% complete</span>
      </div>

      <p className="relative mt-3 flex items-baseline gap-2">
        <span className="text-5xl font-semibold leading-none tabular-nums tracking-tight">{solved}</span>
        <span className="text-sm text-muted">of {total} problems solved</span>
      </p>

      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Question bank completion"
        className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-line/70"
      >
        <div className="h-full rounded-full bg-gradient-to-r from-easy to-accent" style={{ width: `${bar}%` }} />
      </div>

      <dl className="relative mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface-2/50">
        {CELLS.map(({ key, label, tone, Icon }) => (
          <div key={key} className="flex flex-col items-center px-2 py-3.5 text-center">
            <span className={`grid h-8 w-8 place-items-center rounded-xl ${tone}`}>
              <Icon width={16} height={16} />
            </span>
            <dd className="mt-2 text-xl font-semibold leading-none tabular-nums">{values[key]}</dd>
            <dt className="mt-1 text-[0.7rem] font-medium uppercase tracking-wider text-muted">{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}