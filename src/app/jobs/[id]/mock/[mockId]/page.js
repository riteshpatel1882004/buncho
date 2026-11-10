import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { getSkill } from '@/lib/jobs/skills';
import { attachInsights, getIsPro } from '@/lib/subscription';
import { InsightsInline } from '@/components/Insights';
import { getProPriceInr } from '@/lib/pricing';
import { Bar } from '@/components/jobs/Parts';
import { BackLink, Eyebrow, Hero, Ring, Stat, TONE_SOFT, TONE_TEXT, TONE_VAR, card, ctaBtn, toneOf } from '@/components/jobs/ui';
import { ChevronRight, Lock } from '@/components/icons';

export const metadata = { title: 'Mock assessment results' };

const STATE = { answered: 'Answered', skipped: 'Not answered' };

export default async function MockResultPage({ params }) {
  const user = await getOrCreateUser();
  if (!user) redirect('/login');
  const { id, mockId } = await params;

  const mock = await prisma.mockAssessment.findFirst({
    where: { id: mockId, jobId: id, userId: user.id },
    include: { job: { select: { title: true } } },
  });
  if (!mock) notFound();
  if (mock.status !== 'COMPLETED' || !mock.results) redirect(`/jobs/${id}/mock`);

  const previous = await prisma.mockAssessment.findFirst({
    where: { jobId: id, userId: user.id, status: 'COMPLETED', completedAt: { lt: mock.completedAt }, score: { not: null } },
    orderBy: { completedAt: 'desc' },
    select: { score: true },
  });

  const { questions } = mock.results;
  const pro = await getIsPro(user.id);
  const proPrice = await getProPriceInr();
  const problemRows = await attachInsights(
    await prisma.problem.findMany({ where: { id: { in: mock.problemIds } }, select: { id: true, slug: true } }),
    pro,
  );
  const slugs = Object.fromEntries(problemRows.map((p) => [p.id, p.slug]));
  const insightsBy = Object.fromEntries(problemRows.map((p) => [p.id, p]));

  // Per-skill averages from the questions that were scored
  const bySkill = new Map();
  questions.filter((q) => q.score !== null).forEach((q) => q.skillKeys.forEach((k) => {
    const e = bySkill.get(k) ?? { sum: 0, n: 0 };
    e.sum += q.score;
    e.n += 1;
    bySkill.set(k, e);
  }));
  const skills = [...bySkill.entries()].map(([k, e]) => ({ key: k, label: getSkill(k)?.label ?? k, avg: Math.round(e.sum / e.n) })).sort((a, b) => a.avg - b.avg);

  const tone = toneOf(mock.score);
  const verdict = mock.score === null ? 'Assessment submitted' : mock.score >= 70 ? 'Strong result' : mock.score >= 50 ? 'Solid start' : 'Room to grow';
  const delta = previous && mock.score !== null ? mock.score - previous.score : null;
  const answeredCount = questions.filter((q) => q.state !== 'skipped').length;
  const strongest = skills.length ? skills[skills.length - 1] : null;
  const weakest = skills.length ? skills[0] : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6">
      <BackLink href={`/jobs/${id}`}>{mock.job.title}</BackLink>

      {/* Score hero */}
      <Hero className="mt-3" aria-labelledby="result-h1">
        <div className="flex flex-col items-center gap-8 p-6 text-center sm:p-10 md:flex-row md:text-left">
          <Ring value={mock.score ?? 0} size={176} stroke={14} color={TONE_VAR[tone]}>
            <span>
              <span className="block text-5xl font-semibold leading-none tabular-nums">{mock.score ?? '—'}</span>
              {mock.score !== null && <span className="mt-1 block text-sm text-muted">out of 100</span>}
            </span>
          </Ring>
          <div className="min-w-0 flex-1">
            <Eyebrow>Mock assessment results</Eyebrow>
            <h1 id="result-h1" className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${TONE_TEXT[tone]}`}>{verdict}</h1>
            {delta !== null && (
              <p className="mt-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${delta > 0 ? TONE_SOFT.easy : delta < 0 ? TONE_SOFT.hard : TONE_SOFT.muted}`}>
                  {delta === 0 ? 'Same as' : delta > 0 ? `▲ Up ${delta} from` : `▼ Down ${-delta} from`} your previous mock ({previous.score}/100)
                </span>
              </p>
            )}
            <p className="mt-3 max-w-xl text-xs text-muted">Your answers are saved privately. Open any question below to review or improve your answer.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link href={`/jobs/${id}`} className={ctaBtn}>Back to practice plan</Link>
            </div>
          </div>
        </div>
      </Hero>

      {/* Highlights */}
      <section aria-label="Highlights" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Questions answered" value={`${answeredCount}/${questions.length}`} hint={answeredCount === questions.length ? 'every question attempted' : 'some left unanswered'} />
        <Stat label="Skills assessed" value={skills.length} hint="from scored answers" />
        <Stat label="Strongest skill" value={strongest ? `${strongest.avg}/100` : '–'} hint={strongest?.label} tone={strongest ? toneOf(strongest.avg) : undefined} />
        <Stat label="Focus next" value={weakest ? `${weakest.avg}/100` : '–'} hint={weakest?.label} tone={weakest ? toneOf(weakest.avg) : undefined} />
      </section>

      {/* The result above is complete and free. This only explains what another attempt would add. */}
      {!pro && (
        <section
          aria-labelledby="again-h"
          className="relative mt-5 overflow-hidden rounded-2xl border border-accent/40 p-5 sm:p-6"
          style={{ background: 'linear-gradient(135deg, var(--accent-soft), var(--surface) 70%)' }}
        >
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 id="again-h" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Lock width={16} height={16} className="text-accent" /> Ready to improve this score?
              </h2>
              <p className="mt-1.5 max-w-xl text-sm text-muted">
                {weakest && skills.length > 1
                  ? <>Your weakest area was <span className="font-semibold text-ink">{weakest.label}</span> ({weakest.avg}/100). </>
                  : null}
                Practise it, retake the mock, and Buncho will show how much you improved. Your free mock assessment is used, so another attempt needs Pro. Everything on this page stays yours either way.
              </p>
            </div>
            <Link href="/pricing" className={`${ctaBtn} shrink-0`}>Unlock unlimited mocks · ₹{proPrice}</Link>
          </div>
        </section>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {skills.length > 0 && (
          <section aria-labelledby="skills-h" className={`${card} p-5 sm:p-6`}>
            <h2 id="skills-h" className="text-xl font-semibold tracking-tight">By skill</h2>
            <p className="text-xs text-muted">Weakest first.</p>
            <ul className="mt-5 space-y-4">
              {skills.map((s, i) => (
                <li key={s.key}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <span className="truncate">{s.label}</span>
                      {i === 0 && skills.length > 1 && <span className="shrink-0 rounded-full bg-hard/12 px-2 py-0.5 text-[0.65rem] font-semibold text-hard">Focus here</span>}
                    </span>
                    <span className={`shrink-0 font-semibold tabular-nums ${TONE_TEXT[toneOf(s.avg)]}`}>{s.avg}<span className="font-normal text-muted">/100</span></span>
                  </div>
                  <div className="mt-2"><Bar value={s.avg} label={`${s.label} score`} /></div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="questions-h" className={`${card} p-5 sm:p-6 ${skills.length === 0 ? 'lg:col-span-2' : ''}`}>
          <h2 id="questions-h" className="text-xl font-semibold tracking-tight">Questions</h2>
          <p className="text-xs text-muted">Open a question to review or improve your answer.</p>
          <ul className="-mx-2 mt-4 space-y-1">
            {questions.map((q, i) => {
              const t = toneOf(q.score);
              return (
                <li key={q.problemId}>
                  <Link href={`/problems/${slugs[q.problemId] ?? ''}`} className="group flex items-center gap-3.5 rounded-xl border border-transparent px-3 py-3 transition-all hover:border-line hover:bg-surface-2/60">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-semibold tabular-nums ${TONE_SOFT[t]}`}>{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium group-hover:text-accent">{q.title}</span>
                      <span className="block truncate text-xs text-muted">{STATE[q.state] ?? 'Review your answer'}</span>
                      <InsightsInline pro={pro} problem={insightsBy[q.problemId]} className="mt-1" />
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {q.score !== null ? (
                        <span className={`rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ${TONE_SOFT[t]}`}>{q.score}/100</span>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                      <ChevronRight width={16} height={16} className="text-muted transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}