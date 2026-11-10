import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getOrCreateUser } from '@/lib/user';
import { getJobDetail } from '@/lib/jobs/progress';
import { getEntitlements } from '@/lib/subscription';
import { Bar, PlanRow, SkillRow } from '@/components/jobs/Parts';
import { ManageRole, StartMockButton } from '@/components/jobs/JobActions';
import { Avatar, BackLink, Hero, Ring, Stat, TONE_SOFT, card, chip, ctaBtn, toneOf } from '@/components/jobs/ui';
import { ChevronRight, Flask, Lock } from '@/components/icons';
import { FREE_MOCK_LIMIT, MOCK_MIN_QUESTIONS } from '@/lib/constants';
import { getProPriceInr } from '@/lib/pricing';

export const metadata = { title: 'Role preparation' };

export default async function JobPage({ params }) {
  const user = await getOrCreateUser();
  if (!user) redirect('/login');
  const { id } = await params;
  const ent = await getEntitlements(user.id);
  const proPrice = await getProPriceInr();
  const pro = ent.isPro;
  const data = await getJobDetail(user.id, id, { pro });
  if (!data) notFound();

  const { job, plan, skills, gaps, mocks, summary, next } = data;
  const skillLabels = Object.fromEntries(skills.map((s) => [s.key, s.label]));
  const pct = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0;
  const open = mocks.find((m) => m.status === 'IN_PROGRESS');
  const finished = mocks.filter((m) => m.status === 'COMPLETED');
  const typed = plan.filter((p) => !p.problem.isChallenge).length;
  const scores = finished.map((m) => m.score).filter((s) => s !== null);
  const best = scores.length ? Math.max(...scores) : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6">
      <BackLink href="/jobs">Job preparation</BackLink>

      {/* Hero */}
      <Hero className="mt-3" aria-labelledby="role-h1">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <Avatar id={job.id} text={job.company || job.title} size={64} />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Role preparation</p>
              <h1 id="role-h1" className="mt-1.5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{job.title}</h1>
              {job.company && <p className="mt-1 text-base text-muted">{job.company}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={chip}>{skills.length} skills</span>
                <span className={chip}>{summary.total} questions</span>
                <span className={chip}>about {summary.minutesLeft} min left</span>
              </div>
              <div className="mt-5"><ManageRole jobId={job.id} /></div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-5 rounded-2xl border border-line bg-surface/80 p-4 pr-6 backdrop-blur">
            <Ring value={pct} size={92} stroke={9}>
              <span className="text-xl font-semibold tabular-nums">{pct}%</span>
            </Ring>
            <div>
              <p className="text-sm font-semibold">Plan progress</p>
              <p className="mt-0.5 text-sm text-muted">{summary.completed} of {summary.total} completed</p>
            </div>
          </div>
        </div>
      </Hero>

      {/* Key numbers */}
      <section aria-label="Overview" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={`${card} px-4 py-3.5`}>
          <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted">
            Role readiness
            {summary.provisional && summary.score !== null && <span className="rounded-full bg-medium/15 px-2 py-0.5 text-[0.65rem] font-semibold text-medium">Early estimate</span>}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
            {summary.score ?? '—'}
            {summary.score !== null && <span className="text-sm font-normal text-muted">/100</span>}
          </p>
          <p className="mt-0.5 text-xs text-muted">{summary.label}</p>
        </div>
        <Stat label="Completed" value={`${summary.completed}/${summary.total}`} hint="plan questions" />
        <Stat label="Time left" value={`${summary.minutesLeft} min`} hint="to finish the plan" />
        <Stat label="Best mock score" value={best === null ? '–' : `${best}/100`} hint={best === null ? 'no mock taken yet' : `${finished.length} mock${finished.length === 1 ? '' : 's'} taken`} tone={best === null ? undefined : toneOf(best)} />
      </section>

      {/* Up next */}
      {next && (
        <Link
          href={`/problems/${next.problem.slug}`}
          className="group relative mt-5 flex items-center gap-4 overflow-hidden rounded-2xl border border-accent/40 p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/10"
          style={{ background: 'linear-gradient(110deg, var(--accent-soft), var(--surface) 70%)' }}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink shadow-lg shadow-accent/30">
            <ChevronRight width={22} height={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-widest text-accent">Up next</span>
            <span className="mt-0.5 block truncate text-base font-semibold group-hover:text-accent">{next.problem.title}</span>
            <span className="block truncate text-xs text-muted">{next.reason}</span>
          </span>
          <span className="hidden shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink sm:block">Start question</span>
        </Link>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section aria-labelledby="plan-h" className={`${card} p-5 sm:p-6`}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="plan-h" className="text-xl font-semibold tracking-tight">Practice plan</h2>
                <p className="mt-0.5 text-xs text-muted">Ordered from the skills this job asks for most, easier questions first.</p>
              </div>
              <span className="text-xs font-medium tabular-nums text-muted">{summary.completed}/{summary.total} done</span>
            </div>
            <div className="mt-4"><Bar value={pct} label="Plan completion" /></div>
            <ol className="-mx-2 mt-4 space-y-1">
              {plan.map((item, i) => <PlanRow key={item.id} item={item} number={i + 1} skillLabels={skillLabels} pro={pro} />)}
            </ol>
          </section>

          <details className={`${card} group p-5 text-sm`}>
            <summary className="cursor-pointer list-none font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                How is role readiness calculated?
                <span className="text-muted transition-transform group-open:rotate-90"><ChevronRight width={16} height={16} /></span>
              </span>
            </summary>
            <p className="mt-3 text-muted">
              It is the weighted average of your skill scores, where each skill score comes from your latest answers to plan questions for that skill. Core skills weigh three times more than nice-to-haves, and a skill is scaled down until you have answered a few questions for it. Skills the question bank cannot test yet are left out. It is a practice indicator, not a prediction of interview results.
            </p>
          </details>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20">
          <section
            aria-labelledby="mock-h"
            className="relative overflow-hidden rounded-2xl border border-accent/40 p-5 sm:p-6"
            style={{ background: 'linear-gradient(160deg, var(--accent-soft), var(--surface) 65%)' }}
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/20 blur-2xl" />
            <div className="relative">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-ink shadow-md shadow-accent/30"><Flask width={22} height={22} /></span>
              <h2 id="mock-h" className="mt-4 text-lg font-semibold">Mock assessment</h2>
              <p className="mt-1.5 text-sm text-muted">
                A timed set of questions across this job&rsquo;s main skills, scored on completion at the end. It uses questions you haven&rsquo;t answered yet when possible. If it picks one you already answered, your new answer replaces the old one.
              </p>
              {open || ent.mocks.canStart ? (
                <>
                  <div className="mt-5">
                    <StartMockButton
                      jobId={job.id}
                      resume={Boolean(open)}
                      disabledReason={typed < MOCK_MIN_QUESTIONS ? `Needs at least ${MOCK_MIN_QUESTIONS} written questions in the plan.` : null}
                    />
                  </div>
                  {open && <p className="mt-2 text-center text-xs font-medium text-accent">You have a mock in progress.</p>}
                  {!pro && !open && (
                    <p className="mt-2 text-center text-xs text-muted">
                      {FREE_MOCK_LIMIT} free attempt included for your account.
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-accent/40 bg-surface/60 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold"><Lock width={15} height={15} /> Free mock assessment used</p>
                  <p className="mt-1.5 text-xs text-muted">
                    Your result stays free to review. With Pro you can retake after practising your weak skills and watch your score move.
                  </p>
                  <Link href="/pricing" className={`${ctaBtn} mt-4 w-full`}>Unlock unlimited mocks · ₹{proPrice}</Link>
                </div>
              )}

              {finished.length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">Past attempts</p>
                  <ul className="mt-2 space-y-1">
                    {finished.map((m) => (
                      <li key={m.id}>
                        <Link href={`/jobs/${job.id}/mock/${m.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-surface/80">
                          <span className="text-muted">{m.completedAt?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${TONE_SOFT[toneOf(m.score)]}`}>{m.score !== null ? `${m.score}/100` : 'No score'}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="skills-h" className={`${card} p-5 sm:p-6`}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="skills-h" className="text-lg font-semibold">Skills in this job</h2>
              <span className="text-xs text-muted">{skills.length}</span>
            </div>
            <ul className="mt-4 space-y-2.5">{skills.map((s) => <SkillRow key={s.key} skill={s} />)}</ul>
            {gaps.length > 0 && (
              <p className="mt-4 rounded-xl border border-dashed border-line bg-surface-2/50 p-3.5 text-xs text-muted">
                <span className="font-semibold text-ink">Not covered yet:</span> {gaps.map((g) => g.label).join(', ')}. The question bank has no matching questions for these, so they are not part of your plan or readiness score.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}