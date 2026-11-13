import Link from 'next/link';
import { notFound } from 'next/navigation';
import { generateHTML } from '@tiptap/html/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { isAdmin } from '@/lib/admin';
import { getIsPro } from '@/lib/subscription';
import { canAccessProblem } from '@/lib/pro-access';
import { CATEGORIES, categoryOf, problemHref } from '@/lib/categories';
import { continueNumbering, extractQuestions, findQuestion, isDoc, plainText, teaser } from '@/lib/docs/tree';
import { readSettings } from '@/lib/docs/store';
import { buildExtensions } from '@/lib/docs/extensions';
import { enhanceDocHtml } from '@/lib/docs/highlight';
import { buildMetadata, breadcrumbJsonLd, graph, problemJsonLd, truncate } from '@/lib/seo';
import { ProBadge } from '@/components/ProBadge';
import { ChevronLeft, ChevronRight, Lock } from '@/components/icons';
import JsonLd from '@/components/JsonLd';
import DocReadView from '@/components/docs/DocReadView';
import QuestionActions from '@/components/problems/QuestionActions';
import QuestionControls from '@/components/problems/QuestionControls';
import RailToggle from '@/components/problems/RailToggle';
import { InsightsPanel } from '@/components/Insights';
import DifficultyBadge from '@/components/DifficultyBadge';

// One question on its own page: the question (a Heading 2 of the document) and its answer (everything under it).
// Used by /problems/<id>, /problems/hr/<id> and /problems/sql/<id>.
// A Pro question shows only its title and a short teaser to free visitors. The answer is not even rendered on the
// server for them, so it cannot be read from the page source.
export const dynamic = 'force-dynamic';

async function load(slug) {
  const problem = await prisma.problem.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      slug: true,
      title: true,
      proOnly: true,
      difficulty: true,
      estimatedMinutes: true,
      roles: true,
      subcategory: true,
      isChallenge: true,
      createdAt: true,
      updatedAt: true,
      topic: { select: { slug: true, name: true, content: true, settings: true } },
    },
  });
  if (!problem || !isDoc(problem.topic.content)) return null;
  const found = findQuestion(problem.topic.content, slug);
  if (!found) return null;
  return { problem, found };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { robots: { index: false, follow: true } };
  const { problem, found } = data;
  const cat = categoryOf(problem.topic.slug);
  return buildMetadata({
    title: problem.title,
    description: truncate(teaser(found.body, 160) || `${CATEGORIES[cat].short} interview question on ${problem.topic.name}.`, 155),
    path: problemHref(problem.slug, problem.topic.slug),
    image: `/problems/${problem.slug}/opengraph-image`,
  });
}

export default async function QuestionPage({ params }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { problem, found } = data;
  const { topic } = problem;

  const user = await getOrCreateUser();
  const pro = user ? await getIsPro(user.id) : false;
  const open = canAccessProblem(problem, pro) || isAdmin(user);

  const category = categoryOf(topic.slug);
  const listPath = CATEGORIES[category].path;
  const settings = readSettings(topic.settings);

  // Neighbours inside the same topic
  const questions = extractQuestions(topic.content);
  const at = questions.findIndex((q) => q.id === slug);
  const prev = at > 0 ? questions[at - 1] : null;
  const next = at >= 0 && at < questions.length - 1 ? questions[at + 1] : null;
  const percent = at >= 0 && questions.length ? ((at + 1) / questions.length) * 100 : 0;
  const prevHref = prev ? problemHref(prev.id, topic.slug) : null;
  const nextHref = next ? problemHref(next.id, topic.slug) : null;
  const pad = (n) => String(n).padStart(2, '0');

  const [progress, bookmark] = user
    ? await Promise.all([
        prisma.problemProgress.findUnique({ where: { userId_problemId: { userId: user.id, problemId: problem.id } }, select: { status: true } }),
        prisma.bookmark.findUnique({ where: { userId_problemId: { userId: user.id, problemId: problem.id } }, select: { id: true } }),
      ])
    : [null, null];

  const html = open ? enhanceDocHtml(generateHTML({ type: 'doc', content: found.body.length ? continueNumbering(found.body) : [{ type: 'paragraph' }] }, buildExtensions())) : null;
  const hint = open ? '' : teaser(found.body);
  const hasAnswer = found.body.some((n) => plainText(n).trim() || n.type !== 'paragraph');

  const jsonLd = graph(
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Problems', path: '/problems' },
      ...(category !== 'ai' ? [{ name: CATEGORIES[category].label.trim(), path: listPath }] : []),
      { name: problem.title, path: problemHref(problem.slug, topic.slug) },
    ]),
    problemJsonLd({ ...problem, description: teaser(found.body, 300) }),
  );

  const difficulty = questions[at]?.difficulty;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <JsonLd data={jsonLd} />

     <div className="q-grid grid gap-x-10 lg:grid-cols-[var(--q-rail-w,17rem)_minmax(0,1fr)]">
        {/* Outline of the topic: where you are, jump anywhere. Collapsible with the button or the B key. */}
        <aside className="q-rail hidden lg:block" aria-label="Questions in this topic">
          <div className="sticky top-24">
            <RailToggle />
            <div className="q-rail-body">
              <Link href={listPath} className="inline-flex items-center gap-1 pr-9 text-xs text-muted transition-colors hover:text-ink">
                <ChevronLeft width={14} height={14} /> {CATEGORIES[category].label.trim()} questions
              </Link>
              <p className="mt-3 text-sm font-semibold">{topic.name}</p>
              <p className="mt-0.5 text-xs text-muted">{questions.length} questions</p>

              <div className="q-rail-scroll relative mt-4 max-h-[calc(100vh-13rem)] overflow-y-auto pr-2">
                <ol className="space-y-0.5">
                  {questions.map((q, i) => {
                    const current = i === at;
                    return (
                      <li key={q.id}>
                        <Link
                          href={problemHref(q.id, topic.slug)}
                          aria-current={current ? 'page' : undefined}
                          data-q-current={current ? '' : undefined}
                          className={`flex gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] leading-snug transition-colors ${
                            current ? 'bg-surface-2 font-medium text-ink' : 'text-muted hover:bg-surface-2/60 hover:text-ink'
                          }`}
                        >
                          <span className="w-5 shrink-0 pt-px text-right font-mono text-[0.7rem] tabular-nums opacity-70">{pad(i + 1)}</span>
                          <span className="line-clamp-2">{q.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </aside>

        <div className="q-main min-w-0 w-full">
          {/* Mobile breadcrumb (the outline takes over on large screens) */}
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted lg:hidden">
            <Link href={listPath} className="hover:text-ink">{CATEGORIES[category].label.trim()} questions</Link>
            <span aria-hidden="true">/</span>
            <Link href={`${listPath}#topic-${topic.slug}`} className="truncate hover:text-ink">{topic.name}</Link>
          </nav>

          <header className="relative overflow-hidden rounded-2xl border border-line bg-surface px-5 pb-5 pt-4 sm:px-6">
            <div className="flex items-center gap-2.5 text-xs">
              {at >= 0 && <span className="font-mono font-bold tracking-widest text-accent">Q{pad(at + 1)}</span>}
              <span className="truncate text-muted">{topic.name}</span>
              {at >= 0 && <span className="ml-auto shrink-0 tabular-nums text-muted">{at + 1} of {questions.length}</span>}
            </div>

            <h1 className="mt-2 text-balance text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{problem.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {difficulty && <DifficultyBadge difficulty={difficulty} />}
              {problem.proOnly && <ProBadge />}
              {/* Company and Asked %: set by the admin in the docs editor, shown to Pro users (free users see a lock chip) */}
              <InsightsPanel
                pro={pro || isAdmin(user)}
                problem={{ askedByCompanies: questions[at]?.companies ?? [], askedFrequency: questions[at]?.asked ?? null }}
              />
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <QuestionActions problemId={problem.id} completed={progress?.status === 'COMPLETED'} bookmarked={Boolean(bookmark)} signedIn={Boolean(user)} />
                <QuestionControls prevHref={prevHref} nextHref={nextHref} />
              </div>
            </div>

            {at >= 0 && (
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-line/60" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={at + 1} aria-label="Position in this topic">
                <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
              </div>
            )}
          </header>

          <article className="q-read q-answer mt-5 min-w-0">
            {open ? (
              hasAnswer ? (
                <DocReadView slug={`q-${problem.slug}`} html={html} headingFont={settings.headingFont} textFont={settings.textFont} />
              ) : (
                <p className="text-muted">The answer to this question is being written.</p>
              )
            ) : (
              <div className="text-center">
                {hint && <p className="mx-auto max-w-xl text-left leading-relaxed text-muted">{hint}</p>}
                <div className="mx-auto mt-6 max-w-md rounded-2xl bg-surface-2 px-6 py-7">
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-surface text-muted">
                    <Lock width={18} height={18} />
                  </span>
                  <p className="mt-3 font-semibold">This is a Pro question</p>
                  <p className="mt-1 text-sm text-muted">Upgrade to Buncho Pro to read the full answer.</p>
                  <Link href="/pricing" className="mt-4 inline-flex h-9 items-center rounded-full bg-ink px-5 text-sm font-semibold text-bg transition-opacity hover:opacity-90">
                    See Pro plans
                  </Link>
                </div>
              </div>
            )}
          </article>

          {(prev || next) && (
            <nav aria-label="Question navigation" className="mt-5 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link href={prevHref} className="group min-w-0 rounded-xl border border-line bg-surface p-3.5 transition-colors hover:bg-surface-2">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <ChevronLeft width={14} height={14} /> Previous
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm font-medium">{prev.title}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next ? (
                <Link href={nextHref} className="group min-w-0 rounded-xl border border-line bg-surface p-3.5 transition-colors hover:bg-surface-2 sm:text-right">
                  <span className="flex items-center gap-1 text-xs text-muted sm:justify-end">
                    Next <ChevronRight width={14} height={14} />
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm font-medium">{next.title}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
            </nav>
          )}

          <p className="mt-5 hidden text-center text-xs text-muted lg:block">
            <kbd className="rounded border border-line px-1 font-mono">←</kbd> <kbd className="rounded border border-line px-1 font-mono">→</kbd> questions
            <span className="mx-2 opacity-40">·</span>
            <kbd className="rounded border border-line px-1 font-mono">B</kbd> sidebar
            <span className="mx-2 opacity-40">·</span>
            <kbd className="rounded border border-line px-1 font-mono">F</kbd> focus
          </p>
        </div>
      </div>
    </main>
  );
}