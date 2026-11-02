import Link from 'next/link';
import DifficultyBadge from '@/components/DifficultyBadge';
import { Pagination } from '@/components/ProblemList';
import { InsightsInline } from '@/components/Insights';
import { ProBadge } from '@/components/ProBadge';
import { Check, ChevronRight, Lock } from '@/components/icons';
import { PAGE_SIZE } from '@/lib/constants';
import { problemHref } from '@/lib/categories';

// Left edge colour by difficulty
const BAR = { EASY: 'bg-easy', MEDIUM: 'bg-medium', HARD: 'bg-hard' };

function Status({ done }) {
  return done ? (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-go text-go-ink">
      <Check width={14} height={14} strokeWidth={3} />
      <span className="sr-only">Completed</span>
    </span>
  ) : (
    <span className="grid h-6 w-6 shrink-0 place-items-center">
      <span className="h-5 w-5 rounded-full border-2 border-line" />
      <span className="sr-only">Not started</span>
    </span>
  );
}

/** The SQL question list: one card per question. Same data and pagination as the other lists, different look. */
export default function SqlList({ result, statusMap = {}, basePath, params, pro = false }) {
  const { items, page, totalPages } = result;

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-line bg-surface px-6 py-14 text-center">
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

      <ul className="grid gap-3">
        {items.map((p, i) => (
          <li key={p.id}>
            <Link
              href={problemHref(p.slug, p.topic.slug)}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-surface p-4 pl-5 transition-all hover:border-accent/50 hover:shadow-[0_14px_34px_-20px_color-mix(in_srgb,var(--accent)_60%,transparent)] sm:gap-5 sm:p-5 sm:pl-6 motion-safe:hover:-translate-y-0.5"
            >
              <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${BAR[p.difficulty]}`} />

              <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-2 font-mono text-sm font-semibold tabular-nums text-muted transition-colors group-hover:bg-accent-soft group-hover:text-accent sm:grid">
                {String(offset + i + 1).padStart(2, '0')}
              </span>

              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[15px] font-semibold leading-snug group-hover:text-accent sm:text-base">
                  <span className="mr-1.5 font-mono text-xs tabular-nums text-muted sm:hidden">{offset + i + 1}.</span>
                  {p.title}
                  {p.proOnly && <ProBadge className="ml-2 align-middle" />}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-muted">
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 font-medium">{p.subcategory ?? p.topic.name}</span>
                  <span className="tabular-nums">{p.estimatedMinutes} min</span>
                  <span className="sm:hidden"><DifficultyBadge difficulty={p.difficulty} /></span>
                </span>
                {pro && <InsightsInline pro={pro} problem={p} className="mt-2" />}
              </span>

              <span className="hidden shrink-0 sm:block"><DifficultyBadge difficulty={p.difficulty} /></span>
              <Status done={statusMap[p.id] === 'COMPLETED'} />
              <ChevronRight width={18} height={18} className="hidden shrink-0 text-muted/60 transition-transform group-hover:translate-x-0.5 group-hover:text-accent sm:block" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <Pagination basePath={basePath} page={page} totalPages={totalPages} params={params} />
    </>
  );
}