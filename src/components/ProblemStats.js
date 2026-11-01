import Link from 'next/link';
import { Flame } from './icons';

const ROWS = [
  ['EASY', 'Easy', 'bg-easy'],
  ['MEDIUM', 'Medium', 'bg-medium'],
  ['HARD', 'Hard', 'bg-hard'],
];

// The ring scales with CSS (96px on phones, 128px from sm up); the SVG itself always draws in a 128 box.
function Ring({ solved, total }) {
  const size = 128;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? Math.min(1, solved / total) : 0;
  return (
    <div className="relative h-24 w-24 shrink-0 sm:h-32 sm:w-32">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--easy)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent)' }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-2xl font-semibold leading-none tabular-nums sm:text-3xl">{solved}</p>
          <p className="mt-1 text-[0.7rem] text-muted sm:mt-1.5 sm:text-xs">of {total}</p>
          <p className="hidden text-[0.7rem] font-semibold text-easy sm:block">Solved</p>
        </div>
      </div>
    </div>
  );
}

export function ProgressCard({ stats, signedIn }) {
  const pct = stats.total ? Math.round((stats.solved / stats.total) * 100) : 0;
  const streak = stats.streak ?? 0;
  const left = Math.max(0, stats.total - stats.solved);

  return (
    <section aria-label="Your progress" className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="flex items-center gap-4 sm:gap-6">
        <Ring solved={stats.solved} total={stats.total} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">Your progress</h2>
            <span className="text-xs tabular-nums text-muted">{pct}% done</span>
          </div>

          {signedIn && (
            <p
              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold sm:text-xs ${
                streak > 0 ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'
              }`}
            >
              <Flame width={13} height={13} />
              {streak > 0 ? `${streak} day${streak === 1 ? '' : 's'} streak` : 'Solve one today to start a streak'}
            </p>
          )}

          <ul className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3.5">
            {ROWS.map(([key, label, bar]) => {
              const d = stats.byDifficulty[key];
              const w = d.total ? Math.round((d.solved / d.total) * 100) : 0;
              return (
                <li key={key} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-2.5 text-[13px] sm:text-sm">
                  <span className="font-medium">{label}</span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2 sm:h-2">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${w}%` }} />
                  </div>
                  <span className="min-w-[2.75rem] text-right tabular-nums text-muted">
                    {d.solved}/{d.total}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {signedIn ? (
        <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-accent" /> {left} left to solve
        </p>
      ) : (
        <Link
          href="/register"
          className="mt-4 block rounded-xl bg-accent px-3 py-3 text-center text-sm font-semibold text-accent-ink hover:opacity-90"
        >
          Sign up to track your progress
        </Link>
      )}
    </section>
  );
}