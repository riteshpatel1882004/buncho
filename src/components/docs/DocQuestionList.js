import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CATEGORIES, problemHref, topicCategoryWhere } from '@/lib/categories';
import { getDocQuestions } from '@/lib/docs/store';
import { getIsPro } from '@/lib/subscription';
import { ProBadge } from '@/components/ProBadge';
import { Lock } from '@/components/icons';
import { Companies, Frequency, InsightsInline } from '@/components/Insights';
import DifficultyBadge from '@/components/DifficultyBadge';
import RowCheck from './RowCheck';

// The list on /problems, /problems/hr and /problems/sql. All three are identical: topics (the tabs of the
// document) with their questions one under another. A question links to its own page (the question and its answer).
export default async function DocQuestionList({ category, userId, admin }) {
  const topics = await getDocQuestions(category);
  const pro = userId ? await getIsPro(userId) : false; // free users see a lock on Pro questions (they can still open the page and read the teaser)
  const insights = pro || admin; // Company and Asked % are Pro insights: free users see a lock instead of the values

  // Problem rows only exist to carry progress; they mirror the document (see lib/docs/store.js)
  const [rows, doneRows] = await Promise.all([
    prisma.problem.findMany({ where: { published: true, topic: topicCategoryWhere(category) }, select: { id: true, slug: true } }),
    userId
      ? prisma.problemProgress.findMany({
          where: { userId, status: 'COMPLETED', problem: { topic: topicCategoryWhere(category) } },
          select: { problem: { select: { slug: true } } },
        })
      : [],
  ]);
  const idBySlug = new Map(rows.map((r) => [r.slug, r.id]));
  const done = new Set(doneRows.map((r) => r.problem.slug));

  if (topics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
        <p className="font-medium">No questions yet.</p>
        <p className="mt-1 text-sm text-muted">{CATEGORIES[category].label.trim()} questions are being added.</p>
        {admin && (
          <Link href={`/docs/${category}`} className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
            Write the first questions
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {topics.map((t) => (
          <a key={t.slug} href={`#topic-${t.slug}`} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium hover:border-muted">
            {t.name} <span className="text-muted">{t.questions.length}</span>
          </a>
        ))}
        {admin && (
          <Link href={`/docs/${category}`} className="ml-auto rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            Edit questions
          </Link>
        )}
      </div>

      <div className="space-y-5">
        {topics.map((t) => {
          const doneCount = t.questions.filter((q) => done.has(q.id)).length;
          return (
            <section key={t.slug} id={`topic-${t.slug}`} className="@container scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-surface">
              <header className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/60 px-4 py-3">
                <h2 className="font-semibold">
                  <Link href={`/docs/${category}/${t.slug}`} className="hover:text-accent">{t.name}</Link>
                </h2>
                <span className="text-xs text-muted">{userId ? `${doneCount} / ${t.questions.length} done` : `${t.questions.length} topic${t.questions.length === 1 ? '' : 's'}`}</span>
              </header>
              {/* Column names (wide lists only) */}
              <div className="hidden items-center gap-3 border-b border-line px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted @xl:flex">
                <span className="w-7 shrink-0" />
                <span className="min-w-0 flex-1">Question</span>
                <span className="w-44 shrink-0">Company</span>
                <span className="w-20 shrink-0">Asked</span>
                <span className="w-16 shrink-0">Level</span>
                <span className="w-7 shrink-0" />
              </div>
              <ol>
                {t.questions.map((q, i) => (
                  <li key={q.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0 hover:bg-surface-2/40">
                    <span className="w-7 shrink-0 text-right text-xs tabular-nums text-muted">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={problemHref(q.id, t.slug)} className="flex min-w-0 items-center gap-2 text-sm hover:text-accent">
                        <span className="min-w-0">{q.title}</span>
                        {q.pro && <ProBadge className="shrink-0" />}
                        {q.pro && !pro && !admin && <Lock width={13} height={13} className="shrink-0 text-muted" />}
                      </Link>
                      {/* Narrow lists: the level, and the two Pro values, go on one line under the title */}
                      {q.difficulty && <span className="mt-1 inline-block @xl:hidden"><DifficultyBadge difficulty={q.difficulty} plain /></span>}
                      {insights && <InsightsInline pro problem={{ askedByCompanies: q.companies, askedFrequency: q.asked }} className="mt-1 @xl:hidden" />}
                    </div>
                    <span className="hidden w-44 shrink-0 @xl:block"><Companies pro={insights} list={q.companies} /></span>
                    <span className="hidden w-20 shrink-0 @xl:block"><Frequency pro={insights} value={q.asked} bar={false} /></span>
                    <span className="hidden w-16 shrink-0 @xl:block">{q.difficulty ? <DifficultyBadge difficulty={q.difficulty} plain /> : <span className="text-xs text-muted">–</span>}</span>
                    <RowCheck problemId={idBySlug.get(q.id) ?? null} completed={done.has(q.id)} signedIn={Boolean(userId)} />
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}