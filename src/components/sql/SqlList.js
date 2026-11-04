import Link from 'next/link';
import DifficultyBadge from '@/components/DifficultyBadge';
import { Pagination } from '@/components/ProblemList';
import { Companies, Frequency, InsightsInline } from '@/components/Insights';
import { ProBadge } from '@/components/ProBadge';
import { Check, ChevronRight, Lock } from '@/components/icons';
import { DIFFICULTY_LABEL, PAGE_SIZE } from '@/lib/constants';
import { problemHref } from '@/lib/categories';

// Left edge colour by difficulty
const EDGE = { EASY: 'border-l-easy', MEDIUM: 'border-l-medium', HARD: 'border-l-hard' };
const LEVEL = {
  EASY: { dot: 'bg-easy', text: 'text-easy' },
  MEDIUM: { dot: 'bg-medium', text: 'text-medium' },
  HARD: { dot: 'bg-hard', text: 'text-hard' },
};

// Columns follow the width of the list itself (container queries), like the AI list.
//   narrow (phones): status | title + meta line | chevron   (a stacked card row)
//   @2xl:            status | title | topic | asked % | companies | difficulty
//   @5xl:            same, with wider columns
const COLS =
  '@2xl:grid-cols-[1.5rem_minmax(0,1fr)_10rem_4.5rem_9rem_5rem] @5xl:grid-cols-[1.5rem_minmax(0,1fr)_13rem_5rem_12rem_5rem]';

function Status({ done }) {
  return done ? (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-go text-go-ink">
      <Check width={13} height={13} strokeWidth={3} />
      <span className="sr-only">Completed</span>
    </span>
  ) : (
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

/** The SQL question list: a table with Title, Topic, Asked %, Companies and Level columns. Same data and pagination as the other lists. */
export default function SqlList({ result, statusMap = {}, basePath, params, pro = false }) {
  const { items, page, totalPages } = result;

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center">
        <p className="text-base font-semibold">No SQL questions match these filters</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">Try a different keyword, or clear the filters to see every question.</p>
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
          <span>Topic</span>
          <span className="flex items-center gap-1">Asked {!pro && <Lock width={11} height={11} />}</span>
          <span className="flex items-center gap-1">Companies {!pro && <Lock width={11} height={11} />}</span>
          <span className="text-right">Level</span>
        </div>

        <ul className="divide-y divide-line">
          {items.map((p, i) => {
            const topicLabel = p.subcategory ?? p.topic.name;
            return (
              <li key={p.id}>
                <Link
                  href={problemHref(p.slug, p.topic.slug)}
                  className={`group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 active:bg-surface-2 @2xl:grid @2xl:items-center @2xl:gap-x-3 @2xl:border-l-[3px] ${EDGE[p.difficulty]} ${COLS}`}
                >
                  <span className="mt-0.5 @2xl:mt-0">
                    <Status done={statusMap[p.id] === 'COMPLETED'} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[15px] font-medium leading-snug group-hover:text-accent @2xl:line-clamp-1 @2xl:text-sm">
                      <span className="mr-1.5 tabular-nums text-muted">{offset + i + 1}.</span>
                      {p.title}
                      {p.proOnly && <ProBadge className="ml-2 align-middle" />}
                    </span>

                    {/* Phones and narrow lists: one tidy meta line under the title */}
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted @2xl:hidden">
                      <Level difficulty={p.difficulty} />
                      <Sep />
                      <span className="min-w-0 max-w-[12rem] truncate">{topicLabel}</span>
                    </span>

                    {/* Pro insights go under the title where the columns do not fit */}
                    {pro && <InsightsInline pro={pro} problem={p} className="mt-1.5 @2xl:hidden" />}
                  </span>

                  <ChevronRight width={16} height={16} className="mt-0.5 shrink-0 text-muted/60 @2xl:hidden" aria-hidden="true" />

                  <span className="hidden truncate text-xs text-muted @2xl:block">{topicLabel}</span>
                  <span className="hidden @2xl:block"><Frequency pro={pro} value={p.askedFrequency} /></span>
                  <span className="hidden min-w-0 @2xl:block"><Companies pro={pro} list={p.askedByCompanies} /></span>
                  <span className="hidden text-right @2xl:block">
                    <DifficultyBadge difficulty={p.difficulty} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <Pagination basePath={basePath} page={page} totalPages={totalPages} params={params} />
    </>
  );
}