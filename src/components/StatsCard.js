import Link from 'next/link';
import DifficultyBadge from './DifficultyBadge';

function Ring({ solved, total, size = 104 }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? Math.min(1, solved / total) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-2xl font-semibold leading-none">{solved}</p>
          <p className="mt-1 text-xs text-muted">of {total}</p>
          <p className="text-[0.7rem] font-medium text-easy">Solved</p>
        </div>
      </div>
    </div>
  );
}

const ROWS = [
  ['EASY', 'Easy', 'bg-easy'],
  ['MEDIUM', 'Med.', 'bg-medium'],
  ['HARD', 'Hard', 'bg-hard'],
];

export function StatsCard({ stats, signedIn, roomy = false }) {
  return (
    <section aria-label="Your progress" className={roomy ? 'card p-5 sm:p-6' : 'panel p-4'}>
      {roomy && <h2 className="mb-5 text-base font-semibold tracking-tight">Problems solved</h2>}
      <div className={`flex items-center ${roomy ? 'gap-6' : 'gap-4'}`}>
        <Ring solved={stats.solved} total={stats.total} size={roomy ? 116 : 104} />
        <ul className={`min-w-0 flex-1 ${roomy ? 'space-y-4' : 'space-y-2.5'}`}>
          {ROWS.map(([key, label, bar]) => {
            const d = stats.byDifficulty[key];
            const pct = d.total ? Math.round((d.solved / d.total) * 100) : 0;
            return (
              <li key={key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted">{d.solved}/{d.total}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {signedIn ? (
        <p className={`text-muted ${roomy ? 'mt-5 border-t border-line pt-4 text-sm' : 'mt-3 text-xs'}`}>
          {Math.max(0, stats.total - stats.solved)} left to solve
        </p>
      ) : (
        <Link href="/register" className="mt-4 block rounded-md bg-accent px-3 py-2 text-center text-sm font-semibold text-accent-ink hover:opacity-90">
          Sign up to track your progress
        </Link>
      )}
    </section>
  );
}

export function ContinueCard({ stats }) {
  if (!stats.last) return null;
  return (
    <section aria-label="Continue" className="panel p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pick up where you left off</p>
      <Link href={`/problems/${stats.last.slug}`} className="mt-2 block font-medium leading-snug hover:text-accent">
        {stats.last.title}
      </Link>
      <div className="mt-2">
        <DifficultyBadge difficulty={stats.last.difficulty} plain />
      </div>
    </section>
  );
}

export default StatsCard;