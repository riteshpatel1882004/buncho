import { prisma } from '@/lib/prisma';
import { READINESS_FULL_CONFIDENCE } from '@/lib/constants';
import { insightSelect } from '@/lib/subscription';

const levelFor = (s) => (s >= 80 ? 'Strong' : s >= 65 ? 'Solid' : s >= 45 ? 'Developing' : 'Early');

/** Everything the role page needs: plan items with the user's status and score, per-skill progress, and role readiness. */
export async function getJobDetail(userId, jobId, { pro = false } = {}) {
  const job = await prisma.jobTarget.findFirst({
    where: { id: jobId, userId },
    include: {
      planItems: {
        orderBy: { priority: 'asc' },
        include: {
          problem: {
            select: { id: true, slug: true, title: true, difficulty: true, type: true, estimatedMinutes: true, isChallenge: true, published: true, topic: { select: { name: true } }, ...insightSelect(pro) },
          },
        },
      },
      mocks: { orderBy: { startedAt: 'desc' }, take: 5 },
    },
  });
  if (!job) return null;

  const items = job.planItems.filter((i) => i.problem.published);
  const ids = items.map((i) => i.problemId);

  const progress = ids.length
    ? await prisma.problemProgress.findMany({ where: { userId, status: 'COMPLETED', problemId: { in: ids } }, select: { problemId: true, status: true } })
    : [];
  const evals = []; // AI feedback was removed, so there are no scores
  const status = new Map(progress.map((p) => [p.problemId, p.status]));
  const latest = new Map();
  for (const e of evals) if (!latest.has(e.problemId)) latest.set(e.problemId, e);

  const plan = items.map((i) => ({
    id: i.id,
    problem: i.problem,
    skillKeys: i.skillKeys,
    reason: i.reason,
    status: status.get(i.problemId) ?? null,
    score: latest.get(i.problemId)?.score ?? null,
  }));

  const skills = (Array.isArray(job.skills) ? job.skills : []).map((s) => {
    const mine = plan.filter((p) => p.skillKeys.includes(s.key));
    const scored = mine.filter((p) => p.score !== null);
    const avg = scored.length ? scored.reduce((a, p) => a + p.score, 0) / scored.length : null;
    const need = Math.max(1, Math.min(mine.length, READINESS_FULL_CONFIDENCE));
    return {
      ...s,
      inPlan: mine.length,
      done: mine.filter((p) => p.status === 'COMPLETED').length,
      evaluated: scored.length,
      avg: avg === null ? null : Math.round(avg),
      // Same rule as the main readiness score: scaled down until enough answers back it up
      score: avg === null ? null : Math.round(avg * Math.min(1, scored.length / need)),
      bankCoverage: (job.coverage ?? {})[s.key] ?? 0,
    };
  });

  // Role readiness only counts skills the question bank can actually test
  const testable = skills.filter((s) => s.inPlan > 0);
  const weightSum = testable.reduce((a, s) => a + s.weight, 0);
  const evaluated = plan.filter((p) => p.score !== null).length;
  const score = evaluated && weightSum ? Math.round(testable.reduce((a, s) => a + s.weight * (s.score ?? 0), 0) / weightSum) : null;

  const completed = plan.filter((p) => p.status === 'COMPLETED').length;
  const next = plan.find((p) => p.status !== 'COMPLETED' && p.score === null) ?? plan.find((p) => p.status !== 'COMPLETED') ?? null;

  return {
    job,
    plan,
    skills,
    gaps: skills.filter((s) => s.bankCoverage === 0),
    mocks: job.mocks,
    summary: {
      total: plan.length,
      completed,
      evaluated,
      minutesLeft: plan.filter((p) => p.status !== 'COMPLETED').reduce((a, p) => a + p.problem.estimatedMinutes, 0),
      score,
      label: score === null ? 'Not assessed yet' : levelFor(score),
      provisional: evaluated < 5,
    },
    next,
  };
}

/** Lightweight list for /jobs and the dashboard card. */
export async function listJobs(userId) {
  const jobs = await prisma.jobTarget.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, company: true, createdAt: true, skills: true,
      planItems: { select: { problemId: true } },
      mocks: { where: { status: 'COMPLETED' }, orderBy: { completedAt: 'desc' }, take: 1, select: { score: true } },
    },
  });
  const ids = [...new Set(jobs.flatMap((j) => j.planItems.map((i) => i.problemId)))];
  const done = ids.length
    ? new Set((await prisma.problemProgress.findMany({ where: { userId, status: 'COMPLETED', problemId: { in: ids } }, select: { problemId: true } })).map((p) => p.problemId))
    : new Set();

  return jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    createdAt: j.createdAt,
    skillCount: Array.isArray(j.skills) ? j.skills.length : 0,
    total: j.planItems.length,
    completed: j.planItems.filter((i) => done.has(i.problemId)).length,
    lastMockScore: j.mocks[0]?.score ?? null,
  }));
}