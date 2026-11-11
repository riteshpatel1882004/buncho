import Link from 'next/link';
import { notFound } from 'next/navigation';
import { generateHTML } from '@tiptap/html/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { isAdmin } from '@/lib/admin';
import { getIsPro } from '@/lib/subscription';
import { canAccessProblem } from '@/lib/pro-access';
import { CATEGORIES, categoryOf, problemHref } from '@/lib/categories';
import { extractQuestions, findQuestion, isDoc, plainText, teaser } from '@/lib/docs/tree';
import { readSettings } from '@/lib/docs/store';
import { buildExtensions } from '@/lib/docs/extensions';
import { enhanceDocHtml } from '@/lib/docs/highlight';
import { buildMetadata, breadcrumbJsonLd, graph, problemJsonLd, truncate } from '@/lib/seo';
import { ProBadge } from '@/components/ProBadge';
import { ChevronLeft, ChevronRight, Lock } from '@/components/icons';
import JsonLd from '@/components/JsonLd';
import DocReadView from '@/components/docs/DocReadView';
import QuestionActions from '@/components/problems/QuestionActions';
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

  const [progress, bookmark] = user
    ? await Promise.all([
        prisma.problemProgress.findUnique({ where: { userId_problemId: { userId: user.id, problemId: problem.id } }, select: { status: true } }),
        prisma.bookmark.findUnique({ where: { userId_problemId: { userId: user.id, problemId: problem.id } }, select: { id: true } }),
      ])
    : [null, null];

  const html = open ? enhanceDocHtml(generateHTML({ type: 'doc', content: found.body.length ? found.body : [{ type: 'paragraph' }] }, buildExtensions())) : null;
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

  const nav = 'group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-muted';

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-6 sm:px-6">
      <JsonLd data={jsonLd} />

      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href={listPath} className="hover:text-ink">{CATEGORIES[category].label.trim()} questions</Link>
        <span aria-hidden="true">/</span>
        <Link href={`${listPath}#topic-${topic.slug}`} className="hover:text-ink">{topic.name}</Link>
      </nav>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-line bg-surface px-2.5 py-1 font-medium text-muted">{topic.name}</span>
          {questions[at]?.difficulty && <DifficultyBadge difficulty={questions[at].difficulty} />}
          {problem.proOnly && <ProBadge />}
          {at >= 0 && <span className="text-muted">Question {at + 1} of {questions.length}</span>}
        </div>
        <h1 className="mt-3 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">{problem.title}</h1>
      </header>

      {/* Company and Asked %: set by the admin in the docs editor, shown to Pro users (free users see the lock banner) */}
      <InsightsPanel
        pro={pro || isAdmin(user)}
        problem={{ askedByCompanies: questions[at]?.companies ?? [], askedFrequency: questions[at]?.asked ?? null }}
      />

      <div className="mt-5">
        <QuestionActions problemId={problem.id} completed={progress?.status === 'COMPLETED'} bookmarked={Boolean(bookmark)} signedIn={Boolean(user)} />
      </div>

      <article className="mt-8 min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-8">
        {open ? (
          hasAnswer ? (
            <DocReadView slug={`q-${problem.slug}`} html={html} headingFont={settings.headingFont} textFont={settings.textFont} />
          ) : (
            <p className="text-muted">The answer to this question is being written.</p>
          )
        ) : (
          <div>
            {hint && <p className="text-[1.0625rem] leading-relaxed text-muted">{hint}</p>}
            <div className="mt-6 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-6 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
                <Lock width={20} height={20} />
              </span>
              <p className="mt-3 font-semibold">This is a Pro question</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">Upgrade to Buncho Pro to read the full question and its answer.</p>
              <Link href="/pricing" className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink hover:opacity-90">
                See Pro plans
              </Link>
            </div>
          </div>
        )}
      </article>

      {(prev || next) && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {prev ? (
            <Link href={problemHref(prev.id, topic.slug)} className={nav}>
              <ChevronLeft width={18} height={18} className="shrink-0 text-muted group-hover:text-ink" />
              <span className="min-w-0">
                <span className="block text-xs text-muted">Previous</span>
                <span className="line-clamp-2 text-sm font-medium">{prev.title}</span>
              </span>
            </Link>
          ) : (
            <span className="hidden flex-1 sm:block" />
          )}
          {next ? (
            <Link href={problemHref(next.id, topic.slug)} className={`${nav} justify-end text-right`}>
              <span className="min-w-0">
                <span className="block text-xs text-muted">Next</span>
                <span className="line-clamp-2 text-sm font-medium">{next.title}</span>
              </span>
              <ChevronRight width={18} height={18} className="shrink-0 text-muted group-hover:text-ink" />
            </Link>
          ) : (
            <span className="hidden flex-1 sm:block" />
          )}
        </div>
      )}
    </main>
  );
}