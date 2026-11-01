import Popup from '@/components/Popup';
import BadgeArt from './BadgeArt';
import ScrollToCurrent from './ScrollToCurrent';
import { milestoneProgress } from '@/lib/badges';

const COL = 5.75; // rem per milestone column
const MEDAL = 64; // px

function BadgeTile({ badge, solved }) {
  const left = badge.kind === 'milestone' ? badge.threshold - solved : 0;
  return (
    <li className={`flex items-center gap-3 rounded-2xl border p-3 ${badge.earned ? 'border-line bg-surface-2/60' : 'border-dashed border-line'}`}>
      <span className="shrink-0">
        <BadgeArt badge={badge} size={56} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{badge.name}</span>
        <span className="block text-xs leading-snug text-muted">{badge.desc}</span>
        <span className={`mt-1 block text-[0.7rem] font-semibold uppercase tracking-wider ${badge.earned ? 'text-accent' : 'text-muted'}`}>
          {badge.earned ? 'Unlocked' : left > 0 ? `${left} more to go` : 'Locked'}
        </span>
      </span>
    </li>
  );
}

/**
 * Animated milestone path at the top of the dashboard: one medal per problem milestone (10, 25, 50 ... 600).
 * The line fills up to the user's progress, earned medals pop in one after another with a slow light sweep,
 * and the next medal shows a progress ring that draws itself. Everything is CSS, so it works as a server component.
 */
export default function MilestoneJourney({ solved, badges, title = 'Your milestones', publicView = false }) {
  const milestones = badges.filter((b) => b.kind === 'milestone');
  const achievements = badges.filter((b) => b.kind === 'achievement');
  const earnedCount = badges.filter((b) => b.earned).length;
  const earnedAchievements = achievements.filter((b) => b.earned);
  const p = milestoneProgress(solved);
  const n = milestones.length;
  const currentIdx = Math.min(p.reached, n - 1); // the next medal, or the last one when everything is unlocked
  const step = 1400 / Math.max(1, p.reached);

  const RING_R = 46;
  const RING_C = 2 * Math.PI * RING_R;

  const headline = publicView
    ? p.next
      ? `${solved} solved. Next milestone: ${p.next.name} at ${p.next.threshold} problems.`
      : 'Every milestone unlocked. Legendary.'
    : p.next
    ? solved === 0
      ? 'Solve your first problem to light up the path.'
      : `${solved} solved. ${p.toNext} more to unlock ${p.next.name} (${p.next.threshold}).`
    : 'Every milestone unlocked. Legendary.';

  return (
    <section aria-labelledby="journey-h" className="card relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="journey-h" className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted">{headline}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            {earnedCount} of {badges.length} badges
          </span>
          <Popup
            wide
            title="All badges"
            subtitle={`${earnedCount} of ${badges.length} unlocked`}
            buttonLabel="All badges"
            buttonClassName="rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Problem milestones</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {milestones.map((b) => (
                <BadgeTile key={b.id} badge={b} solved={solved} />
              ))}
            </ul>
            <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-muted">Achievements</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {achievements.map((b) => (
                <BadgeTile key={b.id} badge={b} solved={solved} />
              ))}
            </ul>
          </Popup>
        </div>
      </div>

      {/* The path */}
      <ScrollToCurrent className="no-scrollbar relative -mx-2 mt-6 overflow-x-auto px-2 pb-3 pt-2">
        <ol className="relative flex" style={{ width: `${n * COL}rem`, minWidth: '100%' }}>
          {/* track + animated fill */}
          <div
            aria-hidden="true"
            className="absolute h-1.5 -translate-y-1/2 rounded-full bg-surface-2"
            style={{ left: `${COL / 2}rem`, right: `${COL / 2}rem`, top: MEDAL / 2 + 6 }}
          >
            <div
              className="track-fill h-full rounded-full bg-gradient-to-r from-accent/70 to-accent"
              style={{ '--w': `${(p.line * 100).toFixed(2)}%`, width: `${(p.line * 100).toFixed(2)}%` }}
            />
          </div>

          {milestones.map((b, i) => {
            const isNext = !b.earned && i === p.reached;
            const isCurrent = i === currentIdx;
            const delay = Math.round(250 + i * step);
            return (
              <li key={b.id} data-current={isCurrent ? 'true' : undefined} className="relative z-10 flex shrink-0 flex-col items-center" style={{ width: `${COL}rem` }}>
                <div className="relative grid place-items-center" style={{ width: MEDAL + 12, height: MEDAL + 12 }}>
                  {isNext && (
                    <>
                      <span aria-hidden="true" className="glow-spin absolute inset-1 rounded-full blur-md" />
                      <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                        <circle cx="50" cy="50" r={RING_R} fill="none" stroke="var(--line)" strokeWidth="4" />
                        <circle
                          cx="50"
                          cy="50"
                          r={RING_R}
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          className="ring-draw"
                          strokeDasharray={RING_C}
                          strokeDashoffset={RING_C * (1 - p.fraction)}
                          style={{ '--c': RING_C, '--o': RING_C * (1 - p.fraction) }}
                        />
                      </svg>
                    </>
                  )}
                  {b.earned ? (
                    <span className="badge-pop block" style={{ '--d': `${delay}ms` }}>
                      <BadgeArt badge={b} size={MEDAL} animate delay={delay} />
                    </span>
                  ) : (
                    <span className="block">
                      <BadgeArt badge={b} size={isNext ? MEDAL - 4 : MEDAL - 10} />
                    </span>
                  )}
                </div>
                <span className={`mt-2 max-w-full truncate px-1 text-xs font-semibold ${b.earned || isNext ? '' : 'text-muted'}`}>{b.name}</span>
                <span className="text-[0.7rem] tabular-nums text-muted">{isNext ? `${solved}/${b.threshold}` : `${b.threshold} solved`}</span>
              </li>
            );
          })}
        </ol>
      </ScrollToCurrent>

      {/* Achievements earned so far */}
      <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Achievements</p>
        {earnedAchievements.length ? (
          earnedAchievements.map((b) => (
            <span key={b.id} title={b.desc} className="flex items-center gap-2 rounded-full border border-line bg-surface-2/60 py-1 pl-1 pr-3 text-sm font-semibold">
              <BadgeArt badge={b} size={30} />
              {b.name}
            </span>
          ))
        ) : (
          <span className="text-sm text-muted">Streaks, hard problems and practice days unlock more badges.</span>
        )}
      </div>
    </section>
  );
}