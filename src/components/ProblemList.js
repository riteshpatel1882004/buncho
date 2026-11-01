import Link from 'next/link';
import DifficultyBadge from './DifficultyBadge';
import { DIFFICULTY_LABEL, PAGE_SIZE, TYPE_LABEL } from '@/lib/constants';
import { Check, ChevronLeft, ChevronRight, Lock } from './icons';
import { Companies, Frequency, InsightsInline } from './Insights';
import { ProBadge } from './ProBadge';
import { problemHref } from '@/lib/categories';

const EDGE = { EASY: 'border-l-easy', MEDIUM: 'border-l-medium', HARD: 'border-l-hard' };
const LEVEL = {
  EASY: { dot: 'bg-easy', text: 'text-easy' },
  MEDIUM: { dot: 'bg-medium', text: 'text-medium' },
  HARD: { dot: 'bg-hard', text: 'text-hard' },
};
// Columns follow the width of the list itself (container queries), not the screen, because the list sits in
// different layouts (beside the sidebar on /problems/ai and /problems/hr, beside a sidebar and a rail on topic pages).
//   narrow (phones): status | title + meta line | chevron   (a stacked card row)
//   @2xl:    status | title | topic | type | time | difficulty
//   @5xl:    status | title | topic | type | time | asked % | companies | difficulty
const COLS =
  '@2xl:grid-cols-[1.5rem_minmax(0,1fr)_11rem_7rem_4.5rem_5.5rem] @5xl:grid-cols-[1.5rem_minmax(0,1fr)_9rem_6.5rem_4rem_5.5rem_11rem_5rem]';

function StatusMark({ status }) {
  if (status === 'COMPLETED') {
    return (
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-go text-go-ink">
        <Check width={13} height={13} strokeWidth={3} />
        <span className="sr-only">Completed</span>
      </span>
    );
  }
  if (status === 'ATTEMPTED') {
    return (
      <span className="grid h-5 w-5 shrink-0 place-items-center">
        <span className="h-4 w-4 rounded-full border-2 border-accent border-r-transparent" />
        <span className="sr-only">Attempted</span>
      </span>
    );
  }
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center">
      <span className="h-4 w-4 rounded-full border-2 border-line" />
      <span className="sr-only">Not started</span>
    </span>
  );
}

// Difficulty as a coloured dot + word, used in the phone meta line
function Level({ difficulty }) {
  const l = LEVEL[difficulty];
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${l.text}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${l.dot}`} />
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}

const Sep = () => <span aria-hidden="true" className="h-[3px] w-[3px] shrink-0 rounded-full bg-muted/60" />;

export function ProblemRow({ problem, status, number, pro = false, category = 'ai' }) {
  const hr = category === 'hr';
  // HR questions have one topic, so the column shows their group (subcategory) instead
  const topicLabel = hr ? problem.subcategory ?? problem.topic.name : problem.topic.name;
  const typeLabel = hr ? 'Behavioural' : TYPE_LABEL[problem.type];
  return (
    <li>
      <Link
        href={problemHref(problem.slug, problem.topic.slug)}
        className={`group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 active:bg-surface-2 @2xl:grid @2xl:items-center @2xl:gap-x-3 @2xl:border-l-[3px] ${EDGE[problem.difficulty]} ${COLS}`}
      >
        <span className="mt-0.5 @2xl:mt-0">
          <StatusMark status={status} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[15px] font-medium leading-snug group-hover:text-accent @2xl:line-clamp-1 @2xl:text-sm">
            <span className="mr-1.5 tabular-nums text-muted">{number}.</span>
            {problem.title}
            {problem.proOnly && <ProBadge className="ml-2 align-middle" />}
          </span>

          {/* Phones and narrow lists: one tidy meta line under the title */}
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted @2xl:hidden">
            <Level difficulty={problem.difficulty} />
            <Sep />
            <span className="min-w-0 max-w-[11rem] truncate">{topicLabel}</span>
            <Sep />
            <span className="tabular-nums">{problem.estimatedMinutes} min</span>
          </span>

          {/* Pro insights go under the title where the columns do not fit. Free users get one banner above the list instead of a lock on every row. */}
          {pro && <InsightsInline pro={pro} problem={problem} className="mt-1.5 @5xl:hidden" />}
        </span>

        <ChevronRight width={16} height={16} className="mt-0.5 shrink-0 text-muted/60 @2xl:hidden" aria-hidden="true" />

        <span className="hidden truncate text-xs text-muted @2xl:block">{topicLabel}</span>
        <span className="hidden truncate text-xs text-muted @2xl:block">{typeLabel}</span>
        <span className="hidden text-xs tabular-nums text-muted @2xl:block">{problem.estimatedMinutes} min</span>
        <span className="hidden @5xl:block"><Frequency pro={pro} value={problem.askedFrequency} /></span>
        <span className="hidden min-w-0 @5xl:block"><Companies pro={pro} list={problem.askedByCompanies} /></span>
        <span className="hidden text-right @2xl:block">
          <DifficultyBadge difficulty={problem.difficulty} />
        </span>
      </Link>
    </li>
  );
}

export function Pagination({ basePath, page, totalPages, params }) {
  if (totalPages <= 1) return null;
  const href = (p) => {
    const sp = new URLSearchParams(params);
    sp.set('page', String(p));
    return `${basePath}?${sp.toString()}`;
  };
  const btn = 'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-medium transition-colors';
  const on = `${btn} text-ink hover:border-muted active:bg-surface-2`;
  const off = `${btn} pointer-events-none text-muted opacity-40`;
  return (
    <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className={on} aria-label="Previous page">
          <ChevronLeft width={18} height={18} /> <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span className={off} aria-hidden="true">
          <ChevronLeft width={18} height={18} /> <span className="hidden sm:inline">Previous</span>
        </span>
      )}
      <p className="text-sm text-muted">
        Page <span className="font-semibold tabular-nums text-ink">{page}</span> of {totalPages}
      </p>
      {page < totalPages ? (
        <Link href={href(page + 1)} className={on} aria-label="Next page">
          <span className="hidden sm:inline">Next</span> <ChevronRight width={18} height={18} />
        </Link>
      ) : (
        <span className={off} aria-hidden="true">
          <span className="hidden sm:inline">Next</span> <ChevronRight width={18} height={18} />
        </span>
      )}
    </nav>
  );
}

export default function ProblemList({ result, statusMap = {}, basePath, params, pro = false, category = 'ai' }) {
  const { items, page, totalPages } = result;

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center">
        <p className="text-base font-semibold">No problems match these filters</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">Try a different keyword, or clear the filters to see every problem.</p>
        <Link href={basePath} className="mt-5 inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink hover:opacity-90">
          Clear filters
        </Link>
      </div>
    );
  }

  const offset = (page - 1) * PAGE_SIZE;

  return (
    <>
      {!pro && (
        <Link
          href="/pricing"
          className="mb-3 flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-3.5 py-3 text-[13px] transition-colors hover:border-accent sm:text-sm"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent"><Lock width={16} height={16} /></span>
          <span className="min-w-0 flex-1 leading-snug">
            <span className="font-semibold">See how often each question is asked, and which companies asked it.</span>
            <span className="ml-1 hidden text-muted sm:inline">Part of Buncho Pro.</span>
          </span>
          <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">Unlock</span>
        </Link>
      )}
      <div className="@container overflow-hidden rounded-2xl border border-line bg-surface">
        <div
          className={`hidden gap-x-3 border-b border-l-[3px] border-line border-l-transparent bg-surface-2/60 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted @2xl:grid ${COLS}`}
          aria-hidden="true"
        >
          <span />
          <span>Title</span>
          <span>{category === 'hr' ? 'Group' : 'Topic'}</span>
          <span>Type</span>
          <span>Time</span>
          <span className="hidden items-center gap-1 @5xl:flex">Asked {!pro && <Lock width={11} height={11} />}</span>
          <span className="hidden items-center gap-1 @5xl:flex">Companies {!pro && <Lock width={11} height={11} />}</span>
          <span className="text-right">Level</span>
        </div>
        <ul className="divide-y divide-line">
          {items.map((p, i) => (
            <ProblemRow key={p.id} problem={p} status={statusMap[p.id]} number={offset + i + 1} pro={pro} category={category} />
          ))}
        </ul>
      </div>
      <Pagination basePath={basePath} page={page} totalPages={totalPages} params={params} />
    </>
  );
}