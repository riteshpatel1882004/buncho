import Link from 'next/link';
import DifficultyBadge from './DifficultyBadge';
import Section, { Empty, rowClass } from './dashboard/Section';
import { InsightsInline } from './Insights';

export function Recommended({ items }) {
  return (
    <Section id="recommended" title="Recommended for you" hint="Picked from the areas where you need the most practice.">
      {items.length ? (
        <ul className="-mx-3 space-y-1">
          {items.map((p) => (
            <li key={p.slug}>
              <Link href={`/problems/${p.slug}`} className={rowClass}>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="truncate">{p.title}</span>
                    {p.isChallenge && <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] font-semibold text-accent">Challenge</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">{p.reason}</span>
                </span>
                <DifficultyBadge difficulty={p.difficulty} plain />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>You&rsquo;ve started every available problem. New ones are added regularly.</Empty>
      )}
    </Section>
  );
}

export function RevisionQueue({ items, pro = false }) {
  return (
    <Section id="revision" title="Revision queue" hint="Answers due for another look. Lower scores come back sooner.">
      {items.length ? (
        <ul className="-mx-3 space-y-1">
          {items.map((p) => (
            <li key={p.slug}>
              <Link href={`/problems/${p.slug}`} className={rowClass}>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    Scored {p.score}/100 · answered {p.answeredDaysAgo === 0 ? 'today' : `${p.answeredDaysAgo}d ago`}
                  </span>
                  <InsightsInline pro={pro} problem={p} className="mt-0.5" />
                </span>
                <span className="shrink-0 text-xs font-semibold text-accent">Revise</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Nothing is due. Answers you submit will show up here when it&rsquo;s time to revise them.</Empty>
      )}
    </Section>
  );
}

export function WeakTopics({ items }) {
  return (
    <Section id="weak" title="Focus areas" hint="Topics with the lowest scores, and topics you haven't started.">
      {items.length ? (
        <ul className="space-y-5">
          {items.map((t) => (
            <li key={t.slug}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/problems?topic=${t.slug}`} className="font-medium hover:text-accent">{t.name}</Link>
                <span className="shrink-0 text-xs text-muted">
                  {t.reason === 'low' ? `Avg ${t.avg}/100 · ${t.evaluated} ${t.evaluated === 1 ? 'answer' : 'answers'}` : 'Not started'}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-hard" style={{ width: `${t.avg ?? 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No weak areas right now. Keep practising across topics.</Empty>
      )}
    </Section>
  );
}