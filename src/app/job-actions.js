'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { extractSkills, guessTitle } from '@/lib/jobs/extract';
import { buildPlan } from '@/lib/jobs/plan';
import { getEntitlements } from '@/lib/subscription';
import {
  FREE_MOCK_LIMIT, FREE_ROLE_LIMIT, JD_MAX_LENGTH, JD_MIN_LENGTH, MAX_ANSWER_LENGTH, MAX_JOB_TARGETS, MIN_ANSWER_LENGTH,
  MIN_SKILLS_REQUIRED, MOCK_MAX_MINUTES, MOCK_MIN_MINUTES, MOCK_MIN_QUESTIONS, MOCK_QUESTIONS,
} from '@/lib/constants';

async function requireUser() {
  const user = await getOrCreateUser();
  if (!user) throw new Error('You need to sign in first.');
  return user;
}

const clean = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const slimSkills = (skills) =>
  skills.map(({ key, label, importance, weight, mentions, evidence }) => ({ key, label, importance, weight, mentions, evidence }));

/* ---------- Roles ---------- */

export async function createJobTarget({ title, company, jdText }) {
  const user = await requireUser();

  // Free plan: one role. Checked first so nothing is analysed or stored for a refused request.
  const ent = await getEntitlements(user.id);
  if (!ent.roles.canAdd) {
    return {
      ok: false,
      code: 'UPGRADE',
      error: `The free plan includes ${FREE_ROLE_LIMIT} role preparation plan. Upgrade to Pro to add more roles.`,
    };
  }

  const text = String(jdText ?? '').replace(/\r\n/g, '\n').trim();
  if (text.length < JD_MIN_LENGTH) return { ok: false, error: 'Paste the full job description. This one is too short to read skills from.' };
  if (text.length > JD_MAX_LENGTH) return { ok: false, error: `Job descriptions can be up to ${JD_MAX_LENGTH.toLocaleString()} characters. Remove the company boilerplate and try again.` };

  const count = await prisma.jobTarget.count({ where: { userId: user.id } });
  if (count >= MAX_JOB_TARGETS) return { ok: false, error: `You can track up to ${MAX_JOB_TARGETS} roles. Delete one to add another.` };

  const skills = extractSkills(text);
  if (skills.length < MIN_SKILLS_REQUIRED) {
    return { ok: false, error: 'We could not find AI or ML skills in this text. Make sure you pasted the full description, including requirements.' };
  }

  const { items, coverage } = await buildPlan(skills, { pro: ent.isPro });
  if (!items.length) {
    return { ok: false, error: 'None of the skills in this job are covered by the question bank yet, so we could not build a plan.' };
  }

  const job = await prisma.jobTarget.create({
    data: {
      userId: user.id,
      title: clean(title, 120) || clean(guessTitle(text), 120) || 'Untitled role',
      company: clean(company, 80) || null,
      jdText: text,
      skills: slimSkills(skills),
      coverage,
      planItems: { create: items },
    },
    select: { id: true },
  });

  revalidatePath('/jobs');
  revalidatePath('/dashboard');
  return { ok: true, id: job.id };
}

/** Rebuilds the plan from the saved job description, for example after new questions were added to the bank. */
export async function regeneratePlan(jobId) {
  const user = await requireUser();
  const job = await prisma.jobTarget.findFirst({ where: { id: String(jobId), userId: user.id }, select: { id: true, jdText: true } });
  if (!job) return { ok: false, error: 'Role not found.' };

  const skills = extractSkills(job.jdText);
  const ent = await getEntitlements(user.id);
  const { items, coverage } = await buildPlan(skills, { pro: ent.isPro });
  if (!items.length) return { ok: false, error: 'No matching questions were found.' };

  await prisma.$transaction([
    prisma.jobPlanItem.deleteMany({ where: { jobId: job.id } }),
    prisma.jobTarget.update({
      where: { id: job.id },
      data: { skills: slimSkills(skills), coverage, planItems: { create: items } },
    }),
  ]);

  revalidatePath(`/jobs/${job.id}`);
  return { ok: true };
}

export async function deleteJobTarget(jobId) {
  const user = await requireUser();
  await prisma.jobTarget.deleteMany({ where: { id: String(jobId), userId: user.id } });
  revalidatePath('/jobs');
  revalidatePath('/dashboard');
  return { ok: true };
}

/* ---------- Mock assessment ---------- */

/**
 * Picks questions from the role's plan: one per important skill first, preferring questions the user has
 * not answered yet (a mock should not be a recall test). Production challenges are practised on their own.
 */
export async function startMock(jobId) {
  const user = await requireUser();
  const job = await prisma.jobTarget.findFirst({
    where: { id: String(jobId), userId: user.id },
    select: {
      id: true, skills: true,
      planItems: {
        orderBy: { priority: 'asc' },
        select: { problemId: true, skillKeys: true, problem: { select: { difficulty: true, estimatedMinutes: true, isChallenge: true, published: true, proOnly: true } } },
      },
    },
  });
  if (!job) return { ok: false, error: 'Role not found.' };

  // Free users never get Pro-only questions in a mock (the mock page shows the full question text)
  const ent = await getEntitlements(user.id);
  const eligible = job.planItems.filter((i) => i.problem.published && !i.problem.isChallenge && (ent.isPro || !i.problem.proOnly));
  if (eligible.length < MOCK_MIN_QUESTIONS) {
    return { ok: false, error: `The mock needs at least ${MOCK_MIN_QUESTIONS} written questions in your plan. Refresh the plan after more questions are added.` };
  }

  const answered = new Set(
    (await prisma.submission.findMany({ where: { userId: user.id, problemId: { in: eligible.map((i) => i.problemId) } }, select: { problemId: true } })).map((s) => s.problemId),
  );
  const pool = [...eligible].sort((a, b) => Number(answered.has(a.problemId)) - Number(answered.has(b.problemId)));

  const skills = [...(Array.isArray(job.skills) ? job.skills : [])].sort((a, b) => b.weight - a.weight);
  const picked = [];
  const used = new Set();
  for (let pass = 0; pass < MOCK_QUESTIONS && picked.length < MOCK_QUESTIONS; pass += 1) {
    for (const s of skills) {
      if (picked.length >= MOCK_QUESTIONS) break;
      const hit = pool.find((i) => !used.has(i.problemId) && i.skillKeys.includes(s.key));
      if (hit) {
        used.add(hit.problemId);
        picked.push(hit);
      }
    }
  }
  for (const i of pool) {
    if (picked.length >= MOCK_QUESTIONS) break;
    if (!used.has(i.problemId)) {
      used.add(i.problemId);
      picked.push(i);
    }
  }

  const minutes = picked.reduce((a, i) => a + i.problem.estimatedMinutes, 0);
  const durationMinutes = Math.min(MOCK_MAX_MINUTES, Math.max(MOCK_MIN_MINUTES, Math.round(minutes / 5) * 5));

  // Only one open mock per role. For a free user that open mock IS their one attempt, so it is resumed, not replaced.
  const upgrade = {
    ok: false,
    code: 'UPGRADE',
    error: `You have used your ${FREE_MOCK_LIMIT} free mock assessment. Upgrade to Pro for unlimited attempts.`,
  };
  if (!ent.isPro) {
    const open = await prisma.mockAssessment.findFirst({
      where: { jobId: job.id, userId: user.id, status: 'IN_PROGRESS' },
      select: { id: true },
    });
    if (open) return { ok: true, id: open.id };
  }

  const mock = await prisma.$transaction(async (tx) => {
    // The counter lives on the user and only goes up, so deleting a role cannot hand back the free attempt.
    // For free users the increment is conditional, which makes the check atomic (two tabs cannot both pass).
    if (ent.isPro) {
      await tx.user.update({ where: { id: user.id }, data: { mockAttemptsUsed: { increment: 1 } } });
    } else {
      const claimed = await tx.user.updateMany({
        where: { id: user.id, mockAttemptsUsed: { lt: FREE_MOCK_LIMIT } },
        data: { mockAttemptsUsed: { increment: 1 } },
      });
      if (claimed.count === 0) return null;
    }
    await tx.mockAssessment.deleteMany({ where: { jobId: job.id, userId: user.id, status: 'IN_PROGRESS' } });
    return tx.mockAssessment.create({
      data: { jobId: job.id, userId: user.id, problemIds: picked.map((i) => i.problemId), durationMinutes },
      select: { id: true },
    });
  });
  if (!mock) return upgrade;

  revalidatePath(`/jobs/${job.id}`);
  return { ok: true, id: mock.id };
}

/** Saves the mock answers as the user's submissions (each answered question counts as solved). */
export async function submitMock(mockId, answers) {
  const user = await requireUser();
  const mock = await prisma.mockAssessment.findFirst({ where: { id: String(mockId), userId: user.id }, select: { id: true, status: true, problemIds: true } });
  if (!mock) return { ok: false, error: 'Mock not found.' };
  if (mock.status !== 'IN_PROGRESS') return { ok: false, error: 'This mock is already finished.' };

  const saved = [];
  for (const problemId of mock.problemIds) {
    const text = String(answers?.[problemId] ?? '').trim().slice(0, MAX_ANSWER_LENGTH);
    if (text.length < MIN_ANSWER_LENGTH) continue;
    const key = { userId_problemId: { userId: user.id, problemId } };
    await prisma.$transaction([
      prisma.submission.upsert({ where: key, update: { content: text }, create: { userId: user.id, problemId, content: text } }),
      prisma.problemProgress.upsert({
        where: key,
        update: { status: 'COMPLETED', completedAt: new Date(), lastActivityAt: new Date() },
        create: { userId: user.id, problemId, status: 'COMPLETED', completedAt: new Date() },
      }),
    ]);
    saved.push(problemId);
  }

  revalidatePath('/dashboard');
  return { ok: true, saved };
}

/** Finishes the mock. Without AI feedback there is no score: each question is recorded as answered or skipped. */
export async function completeMock(mockId) {
  const user = await requireUser();
  const mock = await prisma.mockAssessment.findFirst({ where: { id: String(mockId), userId: user.id } });
  if (!mock) return { ok: false, error: 'Mock not found.' };
  if (mock.status === 'COMPLETED') return { ok: true };

  const [problems, submissions, planItems] = await Promise.all([
    prisma.problem.findMany({ where: { id: { in: mock.problemIds } }, select: { id: true, title: true } }),
    prisma.submission.findMany({ where: { userId: user.id, problemId: { in: mock.problemIds }, updatedAt: { gte: mock.startedAt } }, select: { id: true, problemId: true, content: true } }),
    prisma.jobPlanItem.findMany({ where: { jobId: mock.jobId, problemId: { in: mock.problemIds } }, select: { problemId: true, skillKeys: true } }),
  ]);
  const subBy = new Map(submissions.map((s) => [s.problemId, s]));
  const titleBy = new Map(problems.map((p) => [p.id, p.title]));
  const skillsBy = new Map(planItems.map((p) => [p.problemId, p.skillKeys]));

  const questions = [];
  for (const problemId of mock.problemIds) {
    const sub = subBy.get(problemId);
    const state = sub ? 'answered' : 'skipped';
    questions.push({ problemId, title: titleBy.get(problemId) ?? 'Question', skillKeys: skillsBy.get(problemId) ?? [], score: null, state });
  }

  const partial = false;
  const score = null;

  await prisma.mockAssessment.update({
    where: { id: mock.id },
    data: { status: 'COMPLETED', completedAt: new Date(), score, results: { questions, partial } },
  });

  revalidatePath(`/jobs/${mock.jobId}`);
  revalidatePath('/dashboard');
  return { ok: true };
}