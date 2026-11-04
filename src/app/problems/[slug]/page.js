import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { getIsPro } from '@/lib/subscription';
import { canAccessProblem, previewMarkdown } from '@/lib/pro-access';
import ProLock from '@/components/ProLock';
import { ProBadge } from '@/components/ProBadge';
import { InsightsPanel } from '@/components/Insights';
import { hashContent } from '@/lib/ai/evaluate';
import { DIFFICULTY_LABEL, TYPE_LABEL } from '@/lib/constants';
import Markdown from '@/components/Markdown';
import Hints from '@/components/Hints';
import DifficultyBadge from '@/components/DifficultyBadge';
import AnswerEditor from '@/components/AnswerEditor';
import BookmarkButton from '@/components/BookmarkButton';
import FeedbackView from '@/components/FeedbackView';
import FeedbackControls from '@/components/FeedbackControls';
import ProblemListPopup from '@/components/ProblemListPopup';
import { CompleteToggle, RevealButton } from '@/components/SolutionControls';
import ProblemTabs from '@/components/ProblemTabs';
import Workspace from '@/components/Workspace';
import Timer from '@/components/Timer';
import SqlProblem from '@/components/sql/SqlProblem';
import { getProblemNeighbors, getUpNext } from '@/lib/problems';
import { CATEGORIES, categoryOf, problemHref } from '@/lib/categories';
import JsonLd from '@/components/JsonLd';
import { buildMetadata, breadcrumbJsonLd, fitTitle, graph, plainText, problemJsonLd, truncate } from '@/lib/seo';

import { ChevronLeft, ChevronRight, Code, FileText, Flag, Flask, Lock } from '@/components/icons';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await prisma.problem.findFirst({
    where: { slug, published: true },
    select: { title: true, description: true, difficulty: true, isChallenge: true, estimatedMinutes: true, topic: { select: { name: true, slug: true } } },
  });
  if (!p) return { title: 'Problem not found', robots: { index: false, follow: false } };

  const cat = categoryOf(p.topic.slug);
  const label = cat === 'hr' ? 'HR interview question' : cat === 'sql' ? 'SQL interview question' : `${p.topic.name} interview question`;
  const kind = p.isChallenge ? 'production challenge' : label;
  const tail =
    cat === 'sql'
      ? ` Practice this ${DIFFICULTY_LABEL[p.difficulty].toLowerCase()} ${kind} with every possible answer and optimization tips.`
      : ` Practice this ${DIFFICULTY_LABEL[p.difficulty].toLowerCase()} ${kind} with AI feedback.`;
  const body = plainText(p.description);
  const description = truncate(body, Math.max(60, 158 - tail.length)).replace(/([^.!?\u2026])$/, '$1.') + tail;

  return buildMetadata({
    title: fitTitle(p.title, p.isChallenge ? 'Production challenge' : label),
    description,
    path: problemHref(slug, p.topic.slug),
    image: `/problems/${slug}/opengraph-image`,
    imageAlt: `${p.title} | Buncho`,
    type: 'article',
  });
}

const asArray = (v) => (Array.isArray(v) ? v : []);
// Four backticks so a log that contains ``` can't break out of the code block
const fence = (a) => `\`\`\`\`${a.kind === 'json' ? 'json' : 'text'}\n${a.content}\n\`\`\`\``;

// `via` is the URL the page was opened from: 'ai' for /problems/<slug>, 'hr' for /problems/hr/<slug>, 'sql' for /problems/sql/<slug> (set by that route's wrapper).
export default async function ProblemPage({ params, via = 'ai' }) {
  const { slug } = await params;

  const problem = await prisma.problem.findFirst({
    where: { slug, published: true },
    include: {
      topic: true,
      related: { where: { published: true }, select: { slug: true, title: true, difficulty: true, topic: { select: { slug: true } } } },
    },
  });
  if (!problem) notFound();

  // One canonical URL per question: HR questions live under /problems/hr/, SQL under /problems/sql/, everything else under /problems/
  const category = categoryOf(problem.topic.slug);
  const cat = CATEGORIES[category];
  const selfHref = problemHref(slug, problem.topic.slug);
  if (via !== category) redirect(selfHref);
  const base = cat.path;
  const isSql = category === 'sql'; // SQL has its own page (components/sql/SqlProblem): no editor, no AI feedback
  const grouped = category !== 'ai'; // HR and SQL questions are listed by group (subcategory), not by topic

  const user = await getOrCreateUser();
  const [neighbors, pro] = await Promise.all([getProblemNeighbors(slug, category), user ? getIsPro(user.id) : false]);

  // Pro-only question and no active Pro plan: only a short preview of the question is used below. The full text, hints,
  // steps, scenario data and reference answer are never read into the page.
  const locked = !canAccessProblem(problem, pro);
  const teaser = locked ? previewMarkdown(problem.description) : null;
  const steps = locked ? [] : asArray(problem.steps);
  const rubric = locked ? [] : asArray(problem.rubric);
  const scenarioData = locked ? [] : asArray(problem.scenarioData);
  const upNext = await getUpNext({ userId: user?.id ?? null, currentSlug: slug, pro, category });

  let progress = null;
  let submission = null;
  let evaluation = null;
  let bookmarked = false;

  if (user) {
    const key = { userId_problemId: { userId: user.id, problemId: problem.id } };
    const [pr, sub, bm] = await Promise.all([
      prisma.problemProgress.findUnique({ where: key }),
      prisma.submission.findUnique({ where: key }),
      prisma.bookmark.findUnique({ where: key }),
    ]);
    progress = pr;
    submission = sub;
    bookmarked = Boolean(bm);

    // Latest AI feedback for this user's answer
    if (sub) {
      evaluation = await prisma.evaluation.findFirst({
        where: { submissionId: sub.id },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  // The reference answer is only queried once the user has earned access,
  // so it never reaches the browser of someone who hasn't unlocked it.
  // SQL has no editor to unlock them with, so its answers are open unless the question is Pro-only.
  const unlocked = isSql ? !locked : Boolean(user && !locked && (submission || progress?.solutionRevealed));
  const solution = unlocked ? await prisma.expertSolution.findUnique({ where: { problemId: problem.id } }) : null;

  // True when the user edited their answer after the feedback was generated
  const stale = Boolean(evaluation && submission && evaluation.contentHash !== hashContent(submission.content));

  const loginHref = `/login?redirect_url=${encodeURIComponent(selfHref)}`;

  const jsonLd = graph(
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Problems', path: '/problems' },
      grouped
        ? { name: cat.label.trim(), path: cat.path }
        : { name: problem.topic.name, path: `/problems?topic=${problem.topic.slug}` },
      { name: problem.title, path: selfHref },
    ]),
    problemJsonLd(locked ? { ...problem, description: teaser.text } : problem),
  );

  if (isSql) {
    return (
      <>
        <JsonLd data={jsonLd} />
        <SqlProblem
          problem={problem}
          slug={slug}
          cat={cat}
          neighbors={neighbors}
          upNext={upNext}
          user={user}
          pro={pro}
          locked={locked}
          teaser={teaser}
          solution={solution}
          progress={progress}
          bookmarked={bookmarked}
          loginHref={loginHref}
        />
      </>
    );
  }

  const pill = 'rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted';
  const sectionTitle = 'cursor-pointer list-none text-sm font-semibold marker:hidden [&::-webkit-details-marker]:hidden';
  const reportBtn = 'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-surface-2';

  const description = (
    <article>
      <h1 className="text-xl font-semibold leading-snug tracking-tight">{problem.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={problem.difficulty} />
        {problem.isChallenge && (
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">Production challenge</span>
        )}
        <Link href={grouped ? cat.path : `/problems?topic=${problem.topic.slug}`} className={`${pill} hover:text-ink`}>
          {grouped ? problem.subcategory ?? cat.label : problem.topic.name}
        </Link>
        <span className={pill}>{category === 'hr' ? 'Behavioural' : TYPE_LABEL[problem.type]}</span>
        <span className={pill}>{problem.estimatedMinutes} min</span>
        {problem.proOnly && <ProBadge />}
        <BookmarkButton problemId={problem.id} slug={slug} initial={bookmarked} signedIn={Boolean(user)} pill />
        {progress?.status === 'COMPLETED' && <span className="rounded-full bg-easy/12 px-2.5 py-0.5 text-xs font-semibold text-easy">Completed</span>}
      </div>

      {/* Pro only. For everyone else this renders a lock and the values are never read into the page. */}
      <InsightsPanel pro={pro} problem={pro ? { askedFrequency: problem.askedFrequency, askedByCompanies: problem.askedByCompanies } : null} />

      <section aria-label="Problem statement" className="mt-5">
        <Markdown>{locked ? teaser.text : problem.description}</Markdown>
        {locked && (
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-surface-2 px-4 py-3 text-sm text-muted">
            <Lock width={15} height={15} className="shrink-0" />
            <span>
              {teaser.truncated ? 'The rest of this question is for Pro members.' : 'Hints, AI feedback and the reference answer are for Pro members.'}
            </span>
            <Link href="/pricing" className="font-semibold text-accent hover:underline">Unlock with Pro</Link>
          </p>
        )}
      </section>

      {scenarioData.length > 0 && (
        <section aria-label="Scenario data" className="mt-6">
          <h2 className="text-sm font-semibold">Scenario data</h2>
          <p className="mt-1 text-xs text-muted">Logs and configuration from the incident. Use them as evidence in your answer.</p>
          <div className="mt-3 space-y-3">
            {scenarioData.map((a, i) => (
              <details key={i} open={i === 0} className="rounded-lg border border-line bg-surface">
                <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium">{a.title}</summary>
                <div className="overflow-x-auto border-t border-line px-1 py-1">
                  <Markdown>{fence(a)}</Markdown>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <section aria-label="How to answer" className="mt-6">
          <h2 className="text-sm font-semibold">How to answer</h2>
          <p className="mt-1 text-xs text-muted">Write your answer in {steps.length} steps in the editor on the right.</p>
          <ol className="mt-3 space-y-2 text-sm">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold">{i + 1}</span>
                <span>
                  <span className="font-medium">{s.title}.</span> <span className="text-muted">{s.prompt}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!locked && (
        <div className="mt-6">
          <Hints hints={problem.hints} />
        </div>
      )}

      <div className="mt-6 divide-y divide-line border-y border-line">
        {problem.related.length > 0 && (
          <details className="py-3">
            <summary className={sectionTitle}>{problem.isChallenge ? 'Related challenges' : 'Related questions'}</summary>
            <ul className="mt-3 space-y-2 text-sm">
              {problem.related.map((r) => (
                <li key={r.slug} className="flex items-center justify-between gap-3">
                  <Link href={problemHref(r.slug, r.topic.slug)} className="hover:text-accent">{r.title}</Link>
                  <DifficultyBadge difficulty={r.difficulty} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* Report a mistake in this question */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs text-muted">Found a mistake in this question?</p>
        <Link href={`/report?type=problem&problem=${slug}&issue=incorrect-question`} className={reportBtn}>
          <Flag width={14} height={14} /> Report a problem
        </Link>
      </div>
    </article>
  );

  const feedbackPane = (
    <section aria-labelledby="feedback-heading">
      <h2 id="feedback-heading" className="text-lg font-semibold">AI feedback</h2>

      {locked ? (
        <div className="mt-4">
          <ProLock compact signedIn={Boolean(user)} title="AI feedback is a Pro feature for this question" />
        </div>
      ) : !unlocked ? (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-lg bg-surface-2 px-5 py-6">
          <p className="flex items-center gap-2 font-medium">
            <Lock width={18} height={18} /> Locked until you attempt this problem
          </p>
          <p className="text-sm text-muted">
            {user
              ? 'Submit your answer on the right to get personalised AI feedback.'
              : 'Log in and submit an answer to get personalised AI feedback.'}
          </p>
          {user && problem.allowDirectReveal && <RevealButton problemId={problem.id} />}
        </div>
      ) : (
        <div className="mt-4">
          {submission ? (
            evaluation ? (
              <>
                {stale && (
                  <div className="mb-4 rounded-lg bg-surface-2 px-4 py-3 text-sm">
                    <p>You changed your answer after this feedback was generated.</p>
                    <div className="mt-2">
                      <FeedbackControls problemId={problem.id} label="Re-evaluate my answer" />
                    </div>
                  </div>
                )}
                <FeedbackView
                  rubric={rubric}
                  evaluation={{
                    score: evaluation.score,
                    scores: evaluation.scores,
                    feedback: evaluation.feedback,
                    model: evaluation.model,
                    createdAt: evaluation.createdAt.toISOString(),
                  }}
                />
              </>
            ) : (
              <div className="rounded-lg bg-surface-2 px-5 py-5">
                <p className="text-sm">Your answer is saved but has no AI feedback yet.</p>
                <div className="mt-3">
                  <FeedbackControls problemId={problem.id} label="Get AI feedback" />
                </div>
              </div>
            )
          ) : (
            <p className="text-sm text-muted">
              You opened the reference answer without submitting. Submit your own answer to get personalised AI feedback.
            </p>
          )}

          <details className="mt-8 border-t border-line pt-4" open={!submission}>
            <summary className={sectionTitle}>Reference answer</summary>
            {solution ? (
              <div className="mt-4">
                <p className="mb-4 text-sm text-muted">
                  The AI uses this as a guide. It has not been reviewed by a human expert, so check important details against other sources.
                </p>
                <Markdown>{solution.content}</Markdown>
                {solution.alternatives && (
                  <div className="mt-6 border-t border-line pt-4">
                    <h3 className="text-sm font-semibold">Alternative approaches and trade-offs</h3>
                    <div className="mt-3">
                      <Markdown>{solution.alternatives}</Markdown>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No reference answer has been added for this problem yet.</p>
            )}
            {/* Report a mistake in the reference answer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="text-xs text-muted">Spotted a mistake in this answer?</p>
              <Link href={`/report?type=problem&problem=${slug}&issue=incorrect-solution`} className={reportBtn}>
                <Flag width={14} height={14} /> Report a problem
              </Link>
            </div>
          </details>

          <div className="mt-6 border-t border-line pt-5">
            <CompleteToggle problemId={problem.id} completed={progress?.status === 'COMPLETED'} />
          </div>
        </div>
      )}
    </section>
  );

  const tabs = [
    { id: 'description', label: 'Description', icon: <FileText width={16} height={16} />, content: description },
    { id: 'feedback', label: 'AI Feedback', icon: unlocked ? <Flask width={16} height={16} /> : <Lock width={15} height={15} />, content: feedbackPane },
  ];

  const arrow = 'grid h-8 w-8 place-items-center rounded-md text-ink transition-colors hover:bg-surface';
  const arrowOff = 'grid h-8 w-8 place-items-center rounded-md text-muted opacity-40';


  return (
    <div data-workspace className="flex flex-col bg-canvas px-2 pb-2 lg:h-[calc(100dvh-4rem)]">
      <JsonLd data={jsonLd} />
      {/* Top bar: problem list popup, previous / next, timer */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <ProblemListPopup items={upNext.items} remaining={upNext.remaining} signedIn={Boolean(user)} pro={pro} viewAllHref={cat.path} />
          {neighbors.prev ? (
            <Link href={`${base}/${neighbors.prev}`} className={arrow} aria-label="Previous problem" title="Previous problem">
              <ChevronLeft width={18} height={18} />
            </Link>
          ) : (
            <span className={arrowOff} aria-hidden="true"><ChevronLeft width={18} height={18} /></span>
          )}
          {neighbors.next ? (
            <Link href={`${base}/${neighbors.next}`} className={arrow} aria-label="Next problem" title="Next problem">
              <ChevronRight width={18} height={18} />
            </Link>
          ) : (
            <span className={arrowOff} aria-hidden="true"><ChevronRight width={18} height={18} /></span>
          )}
        </div>
        <Timer />
        <p className="hidden w-40 text-right text-xs text-muted sm:block">
          {neighbors.index} of {neighbors.total}
        </p>
      </div>

      <Workspace
        leftLabel="Problem"
        rightLabel="Answer"
        left={
          <>
            <nav aria-label="Breadcrumb" className="sr-only">
              <Link href="/problems">Problems</Link> /{' '}
              <Link href={grouped ? cat.path : `/problems?topic=${problem.topic.slug}`}>{grouped ? cat.label : problem.topic.name}</Link>
            </nav>
            <ProblemTabs tabs={tabs} initial="description" />
          </>
        }
        right={
          <>
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-line bg-surface-2 pl-4 pr-20 text-sm font-medium">
              <Code width={16} height={16} className="text-go" /> Answer
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {locked ? (
                <div className="p-4">
                  <ProLock signedIn={Boolean(user)} />
                </div>
              ) : user ? (
                <AnswerEditor
                  problemId={problem.id}
                  initialContent={submission?.content ?? ''}
                  hasSubmission={Boolean(submission)}
                  steps={steps.length ? steps : null}
                  language={null}
                  aiFeedback
                />
              ) : (
                <div className="flex min-h-[26rem] flex-[1_0_auto] flex-col">
                  <div className="flex-1 px-4 py-3 font-mono text-[0.85rem] text-muted/70">
                    Write your answer here. Your answer is private to you.
                  </div>
                  <div className="shrink-0 border-t border-line bg-surface-2 px-4 py-3 text-sm">
                    You need to{' '}
                    <Link href={loginHref} className="font-semibold text-accent hover:underline">log in</Link>
                    {' / '}
                    <Link href="/register" className="font-semibold text-accent hover:underline">sign up</Link>
                    {' '}to submit an answer and get AI feedback.
                  </div>
                </div>
              )}
            </div>
          </>
        }
      />
    </div>
  );
}