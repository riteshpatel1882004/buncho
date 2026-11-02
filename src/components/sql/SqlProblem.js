import Link from 'next/link';
import Markdown from '@/components/Markdown';
import Hints from '@/components/Hints';
import DifficultyBadge from '@/components/DifficultyBadge';
import BookmarkButton from '@/components/BookmarkButton';
import ProblemListPopup from '@/components/ProblemListPopup';
import ProLock from '@/components/ProLock';
import { ProBadge } from '@/components/ProBadge';
import { InsightsPanel } from '@/components/Insights';
import { CompleteToggle } from '@/components/SolutionControls';
import Timer from '@/components/Timer';
import SqlTabs from './SqlTabs';
import SqlCode from './SqlCode';
import { parseAnswers, parseIntro } from '@/lib/sql-answers';
import { problemHref } from '@/lib/categories';
import { ChevronLeft, ChevronRight, Code, Database, FileText, Flag, Lock } from '@/components/icons';

// SQL question page. There is no editor (nothing is executed).
// Large screens: two columns, the question on the left (it stays in view) and its answers on the right.
// Smaller screens: two tabs, Description and "Answers & Optimization".

// Level badge + left edge colour for each approach. Keys match the "<level> |" prefix in the answers markdown.
// New questions use "Basic" and "Optimized"; the older "Brute force" and "Better" levels still work.
const LEVELS = {
  basic: { badge: 'bg-accent-soft text-accent', edge: 'border-l-accent', node: 'border-accent text-accent' },
  'brute force': { badge: 'bg-hard/12 text-hard', edge: 'border-l-hard', node: 'border-hard text-hard' },
  better: { badge: 'bg-medium/12 text-medium', edge: 'border-l-medium', node: 'border-medium text-medium' },
  optimized: { badge: 'bg-easy/12 text-easy', edge: 'border-l-easy', node: 'border-easy text-easy' },
};
const levelOf = (l) => LEVELS[String(l ?? '').toLowerCase()] ?? { badge: 'bg-surface-2 text-muted', edge: 'border-l-line', node: 'border-line text-muted' };

const card = 'rounded-2xl border border-line bg-surface';
const label = 'text-xs font-semibold uppercase tracking-wider text-muted';
const pill = 'rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted';
const reportBtn =
  'inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-surface-2';
const arrow = 'grid h-9 w-9 place-items-center rounded-lg text-ink transition-colors hover:bg-surface';
const arrowOff = 'grid h-9 w-9 place-items-center rounded-lg text-muted opacity-40';

const Bolt = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);

export default function SqlProblem({
  problem,
  slug,
  cat,
  neighbors,
  upNext,
  user,
  pro,
  locked,
  teaser,
  solution,
  progress,
  bookmarked,
  loginHref,
}) {
  const answers = !locked && solution ? parseAnswers(solution.content) : [];
  const intro = !locked && solution ? parseIntro(solution.content) : '';
  const hasBasic = answers.some((a) => /^basic$/i.test(a.level ?? ''));
  // Legend: only the levels this question actually uses
  const legend = [
    { key: 'basic', dot: 'bg-accent', text: 'Basic' },
    { key: 'brute force', dot: 'bg-hard', text: 'Brute force' },
    { key: 'better', dot: 'bg-medium', text: 'Better' },
    { key: 'optimized', dot: 'bg-easy', text: 'Optimized' },
  ].filter((l) => answers.some((a) => String(a.level ?? '').toLowerCase() === l.key));
  const completed = progress?.status === 'COMPLETED';

  const description = (
    <div className="space-y-4">
      {/* Pro only. For everyone else this renders a lock and the values are never read into the page. */}
      <InsightsPanel pro={pro} problem={pro ? { askedFrequency: problem.askedFrequency, askedByCompanies: problem.askedByCompanies } : null} />

      <section aria-label="Problem statement" className={`${card} p-5 sm:p-7`}>
        <h2 className={label}>Problem</h2>
        <div className="mt-4">
          <Markdown>{locked ? teaser.text : problem.description}</Markdown>
        </div>
        {locked && (
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-surface-2 px-4 py-3 text-sm text-muted">
            <Lock width={15} height={15} className="shrink-0" />
            <span>{teaser.truncated ? 'The rest of this question is for Pro members.' : 'Hints and answers are for Pro members.'}</span>
            <Link href="/pricing" className="font-semibold text-accent hover:underline">Unlock with Pro</Link>
          </p>
        )}
      </section>

      {!locked && problem.hints?.length > 0 && (
        <div className={`${card} p-5 sm:p-6`}>
          <Hints hints={problem.hints} />
        </div>
      )}

      {problem.related.length > 0 && (
        <section aria-label="Related questions" className={`${card} p-5 sm:p-6`}>
          <h2 className={label}>Related questions</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {problem.related.map((r) => (
              <li key={r.slug} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={problemHref(r.slug, r.topic.slug)} className="font-medium hover:text-accent">{r.title}</Link>
                <DifficultyBadge difficulty={r.difficulty} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted">Found a mistake in this question?</p>
        <Link href={`/report?type=problem&problem=${slug}&issue=incorrect-question`} className={reportBtn}>
          <Flag width={14} height={14} /> Report a problem
        </Link>
      </div>
    </div>
  );

  const answersPane = (
    <div>
      {locked ? (
        <ProLock compact signedIn={Boolean(user)} title="Answers and optimization are a Pro feature for this question" />
      ) : !solution ? (
        <p className={`${card} p-6 text-sm text-muted`}>No answers have been added for this problem yet.</p>
      ) : (
        <>
          {answers.length > 0 ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {answers.length} {answers.length === 1 ? 'way' : 'ways'} to solve it
                  </h2>
                  <p className="text-sm text-muted">{hasBasic ? 'A basic answer first, then the optimized one.' : 'Ordered from brute force to optimized.'}</p>
                </div>
                <ul className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted" aria-label="Legend">
                  {legend.map((l) => (
                    <li key={l.key} className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${l.dot}`} /> {l.text}</li>
                  ))}
                </ul>
              </div>

              {/* Short interview-ready points (text before the first "###" in the answers file) */}
              {intro && (
                <section aria-label="Quick answer" className={`${card} mt-5 p-4 sm:p-5`}>
                  <h3 className={label}>Quick answer</h3>
                  <div className="mt-3">
                    <Markdown>{intro}</Markdown>
                  </div>
                </section>
              )}

              <ol className="relative mt-5 space-y-5">
                {/* The line that joins the numbered nodes (wide screens) */}
                <span aria-hidden="true" className="absolute bottom-4 left-[1.1rem] top-4 hidden w-px bg-line sm:block lg:hidden" />
                {answers.map((a) => {
                  const lv = levelOf(a.level);
                  return (
                    <li key={a.n} className="relative sm:pl-14 lg:pl-0">
                      <span
                        aria-hidden="true"
                        className={`absolute left-0 top-3 hidden h-9 w-9 place-items-center rounded-full border-2 bg-surface text-sm font-semibold tabular-nums sm:grid lg:hidden ${lv.node}`}
                      >
                        {a.n}
                      </span>
                      <article className={`${card} border-l-4 p-4 sm:p-5 ${lv.edge}`}>
                        <header className="flex flex-wrap items-center gap-2.5">
                          <span className="grid h-6 min-w-6 place-items-center rounded-md bg-surface-2 px-1.5 text-xs font-semibold tabular-nums text-muted sm:hidden lg:grid">
                            {a.n}
                          </span>
                          {a.level && <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${lv.badge}`}>{a.level}</span>}
                          <h3 className="text-[15px] font-semibold leading-snug">{a.title}</h3>
                        </header>

                        {a.code && (
                          <div className="mt-3.5 min-w-0">
                            <SqlCode code={a.code} label={`answer-${a.n}.sql`} />
                          </div>
                        )}

                        {/* Short notes under the query: "Key: value" chips from the line after the code block */}
                        {a.chips.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {a.chips.map((c, i) => (
                              <li key={i} className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs leading-snug text-muted">
                                {c.key && <span className="font-semibold text-ink">{c.key}: </span>}
                                {c.value}
                              </li>
                            ))}
                          </ul>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : (
            // Older answer files without "### Level | Title" headings are shown as plain markdown
            <section className={`${card} p-5 sm:p-7`}>
              <Markdown>{solution.content}</Markdown>
            </section>
          )}

          {solution.alternatives && (
            <section aria-label="Optimization" className="mt-8 rounded-2xl border border-accent/30 bg-accent-soft/50 p-5 sm:p-7">
              <h2 className="flex items-center gap-2.5 text-base font-semibold">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-ink">
                  <Bolt />
                </span>
                Optimization
              </h2>
              <div className="mt-4">
                <Markdown>{solution.alternatives}</Markdown>
              </div>
            </section>
          )}

          <div className={`${card} mt-6 flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
            {user ? (
              <>
                <p className="text-sm text-muted">{completed ? 'Nice. This counts toward your streak.' : 'Done with this one? Mark it to keep your streak going.'}</p>
                <CompleteToggle problemId={problem.id} completed={completed} />
              </>
            ) : (
              <>
                <p className="text-sm text-muted">Log in to mark questions completed and keep your streak.</p>
                <Link href={loginHref} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:opacity-90">
                  Log in
                </Link>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-xs text-muted">Spotted a mistake in these answers?</p>
            <Link href={`/report?type=problem&problem=${slug}&issue=incorrect-solution`} className={reportBtn}>
              <Flag width={14} height={14} /> Report a problem
            </Link>
          </div>
        </>
      )}
    </div>
  );

  const tabs = [
    {
      id: 'description',
      label: 'Description',
      icon: <FileText width={16} height={16} />,
      content: description,
      // Two-column layout: keep the question on screen while the answers scroll
      splitClassName: 'lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1',
    },
    {
      id: 'answers',
      label: 'Answers & Optimization',
      icon: locked ? <Lock width={15} height={15} /> : <Code width={16} height={16} />,
      badge: answers.length > 0 ? answers.length : null,
      content: answersPane,
    },
  ];

  return (
    <div className="bg-canvas">
      <div className="mx-auto w-full max-w-[96rem] px-4 pb-20 pt-3 sm:px-6">
        {/* Top bar: problem list, previous / next, timer */}
        <div className="flex h-12 items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <ProblemListPopup items={upNext.items} remaining={upNext.remaining} signedIn={Boolean(user)} pro={pro} viewAllHref={cat.path} />
            {neighbors.prev ? (
              <Link href={`${cat.path}/${neighbors.prev}`} className={arrow} aria-label="Previous problem" title="Previous problem">
                <ChevronLeft width={18} height={18} />
              </Link>
            ) : (
              <span className={arrowOff} aria-hidden="true"><ChevronLeft width={18} height={18} /></span>
            )}
            {neighbors.next ? (
              <Link href={`${cat.path}/${neighbors.next}`} className={arrow} aria-label="Next problem" title="Next problem">
                <ChevronRight width={18} height={18} />
              </Link>
            ) : (
              <span className={arrowOff} aria-hidden="true"><ChevronRight width={18} height={18} /></span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-muted sm:block">{neighbors.index} of {neighbors.total}</p>
            <div className="rounded-lg border border-line bg-surface"><Timer /></div>
          </div>
        </div>

        {/* Header */}
        <header className="relative isolate mt-2 overflow-hidden rounded-3xl border border-line bg-surface px-5 py-6 sm:px-8 sm:py-8">
          <div className="dot-grid" aria-hidden="true" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted">
            <Link href={cat.path} className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent hover:opacity-80">
              <Database width={13} height={13} /> SQL
            </Link>
            <span aria-hidden="true">/</span>
            <span>{problem.subcategory ?? cat.label.trim()}</span>
          </nav>

          <h1 className="mt-4 max-w-3xl font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{problem.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={problem.difficulty} />
            <span className={pill}>{problem.estimatedMinutes} min</span>
            {problem.proOnly && <ProBadge />}
            {completed && <span className="rounded-full bg-easy/12 px-2.5 py-0.5 text-xs font-semibold text-easy">Completed</span>}
            <BookmarkButton problemId={problem.id} slug={slug} initial={bookmarked} signedIn={Boolean(user)} pill />
          </div>
        </header>

        <SqlTabs tabs={tabs} initial="description" split />
      </div>
    </div>
  );
}