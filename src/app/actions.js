// 'use server';

// import { revalidatePath } from 'next/cache';
// import { prisma } from '@/lib/prisma';
// import { getOrCreateUser } from '@/lib/user';
// import { MAX_ANSWER_LENGTH, MIN_ANSWER_LENGTH } from '@/lib/constants';
// import { assertProblemAccess } from '@/lib/pro-access';

// async function requireUser() {
//   const user = await getOrCreateUser();
//   if (!user) throw new Error('You need to sign in first.');
//   return user;
// }

// async function getProblemStub(problemId) {
//   if (typeof problemId !== 'string') return null;
//   return prisma.problem.findFirst({
//     where: { id: problemId, published: true },
//     select: { id: true, slug: true, allowDirectReveal: true, proOnly: true },
//   });
// }

// function refresh(slug) {
//   revalidatePath(`/problems/${slug}`);
//   revalidatePath('/dashboard');
// }

// /** Saves (or edits) the user's private answer, unlocks the expert solution and marks the problem solved. */
// export async function saveSubmission(problemId, content) {
//   const user = await requireUser();
//   const problem = await getProblemStub(problemId);
//   if (!problem) return { ok: false, error: 'This problem no longer exists.' };
//   const locked = await assertProblemAccess(problem, user.id);
//   if (locked) return locked;

//   const text = String(content ?? '').trim();
//   if (text.length < MIN_ANSWER_LENGTH) {
//     return { ok: false, error: `Write at least ${MIN_ANSWER_LENGTH} characters before saving.` };
//   }
//   if (text.length > MAX_ANSWER_LENGTH) {
//     return { ok: false, error: `Answers can be up to ${MAX_ANSWER_LENGTH.toLocaleString()} characters.` };
//   }

//   const key = { userId_problemId: { userId: user.id, problemId: problem.id } };
//   await prisma.$transaction([
//     prisma.submission.upsert({
//       where: key,
//       update: { content: text },
//       create: { userId: user.id, problemId: problem.id, content: text },
//     }),
//     // Submitting an answer is what counts as solving a problem. There is no "in progress" state.
//     prisma.problemProgress.upsert({
//       where: key,
//       update: { status: 'COMPLETED', completedAt: new Date(), lastActivityAt: new Date() },
//       create: { userId: user.id, problemId: problem.id, status: 'COMPLETED', completedAt: new Date() },
//     }),
//   ]);

//   refresh(problem.slug);
//   return { ok: true };
// }

// /**
//  * Reveals the expert solution. Allowed after a submission, or directly when the problem permits it.
//  * A row created here only remembers that the solution was viewed. It is stored as ATTEMPTED, but ATTEMPTED
//  * is never shown to the user (only COMPLETED counts), so viewing a solution does not make a problem "in progress".
//  */
// export async function revealSolution(problemId) {
//   const user = await requireUser();
//   const problem = await getProblemStub(problemId);
//   if (!problem) return { ok: false, error: 'This problem no longer exists.' };
//   const locked = await assertProblemAccess(problem, user.id);
//   if (locked) return locked;

//   const key = { userId_problemId: { userId: user.id, problemId: problem.id } };
//   if (!problem.allowDirectReveal) {
//     const submission = await prisma.submission.findUnique({ where: key, select: { id: true } });
//     if (!submission) return { ok: false, error: 'Submit an attempt to unlock this solution.' };
//   }

//   await prisma.problemProgress.upsert({
//     where: key,
//     update: { solutionRevealed: true, lastActivityAt: new Date() },
//     create: { userId: user.id, problemId: problem.id, status: 'ATTEMPTED', solutionRevealed: true },
//   });

//   refresh(problem.slug);
//   return { ok: true };
// }

// /** Marks a problem solved, or clears the solved mark. Requires a submission or a revealed solution. */
// export async function setCompleted(problemId, completed) {
//   const user = await requireUser();
//   const problem = await getProblemStub(problemId);
//   if (!problem) return { ok: false, error: 'This problem no longer exists.' };
//   const locked = await assertProblemAccess(problem, user.id);
//   if (locked) return locked;

//   const key = { userId_problemId: { userId: user.id, problemId: problem.id } };
//   const [progress, submission] = await Promise.all([
//     prisma.problemProgress.findUnique({ where: key }),
//     prisma.submission.findUnique({ where: key, select: { id: true } }),
//   ]);
//   if (!progress || !(progress.solutionRevealed || submission)) {
//     return { ok: false, error: 'Attempt the problem before marking it completed.' };
//   }

//   await prisma.problemProgress.update({
//     where: key,
//     data: completed
//       ? { status: 'COMPLETED', completedAt: new Date(), lastActivityAt: new Date() }
//       : { status: 'ATTEMPTED', completedAt: null, lastActivityAt: new Date() },
//   });

//   refresh(problem.slug);
//   return { ok: true };
// }

// export async function toggleBookmark(problemId) {
//   const user = await requireUser();
//   const problem = await getProblemStub(problemId);
//   if (!problem) return { ok: false, error: 'This problem no longer exists.' };

//   const key = { userId_problemId: { userId: user.id, problemId: problem.id } };
//   const existing = await prisma.bookmark.findUnique({ where: key, select: { id: true } });

//   if (existing) {
//     await prisma.bookmark.delete({ where: key });
//   } else {
//     await prisma.bookmark.create({ data: { userId: user.id, problemId: problem.id } });
//   }

//   refresh(problem.slug);
//   return { ok: true, bookmarked: !existing };
// }




'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { MAX_ANSWER_LENGTH, MIN_ANSWER_LENGTH } from '@/lib/constants';
import { assertProblemAccess } from '@/lib/pro-access';

async function requireUser() {
  const user = await getOrCreateUser();
  if (!user) throw new Error('You need to sign in first.');
  return user;
}

async function getProblemStub(problemId) {
  if (typeof problemId !== 'string') return null;
  return prisma.problem.findFirst({
    where: { id: problemId, published: true },
    select: { id: true, slug: true, allowDirectReveal: true, proOnly: true },
  });
}

function refresh(slug) {
  revalidatePath(`/problems/${slug}`);
  revalidatePath(`/problems/hr/${slug}`); // HR questions open under /problems/hr/
  revalidatePath(`/problems/sql/${slug}`); // SQL questions open under /problems/sql/
  revalidatePath('/dashboard');
}

/** Saves (or edits) the user's private answer, unlocks the expert solution and marks the problem solved. */
export async function saveSubmission(problemId, content) {
  const user = await requireUser();
  const problem = await getProblemStub(problemId);
  if (!problem) return { ok: false, error: 'This problem no longer exists.' };
  const locked = await assertProblemAccess(problem, user.id);
  if (locked) return locked;

  const text = String(content ?? '').trim();
  if (text.length < MIN_ANSWER_LENGTH) {
    return { ok: false, error: `Write at least ${MIN_ANSWER_LENGTH} characters before saving.` };
  }
  if (text.length > MAX_ANSWER_LENGTH) {
    return { ok: false, error: `Answers can be up to ${MAX_ANSWER_LENGTH.toLocaleString()} characters.` };
  }

  const key = { userId_problemId: { userId: user.id, problemId: problem.id } };
  await prisma.$transaction([
    prisma.submission.upsert({
      where: key,
      update: { content: text },
      create: { userId: user.id, problemId: problem.id, content: text },
    }),
    // Submitting an answer is what counts as solving a problem. There is no "in progress" state.
    prisma.problemProgress.upsert({
      where: key,
      update: { status: 'COMPLETED', completedAt: new Date(), lastActivityAt: new Date() },
      create: { userId: user.id, problemId: problem.id, status: 'COMPLETED', completedAt: new Date() },
    }),
  ]);

  refresh(problem.slug);
  return { ok: true };
}

/**
 * Reveals the expert solution. Allowed after a submission, or directly when the problem permits it.
 * A row created here only remembers that the solution was viewed. It is stored as ATTEMPTED, but ATTEMPTED
 * is never shown to the user (only COMPLETED counts), so viewing a solution does not make a problem "in progress".
 */
export async function revealSolution(problemId) {
  const user = await requireUser();
  const problem = await getProblemStub(problemId);
  if (!problem) return { ok: false, error: 'This problem no longer exists.' };
  const locked = await assertProblemAccess(problem, user.id);
  if (locked) return locked;

  const key = { userId_problemId: { userId: user.id, problemId: problem.id } };
  if (!problem.allowDirectReveal) {
    const submission = await prisma.submission.findUnique({ where: key, select: { id: true } });
    if (!submission) return { ok: false, error: 'Submit an attempt to unlock this solution.' };
  }

  await prisma.problemProgress.upsert({
    where: key,
    update: { solutionRevealed: true, lastActivityAt: new Date() },
    create: { userId: user.id, problemId: problem.id, status: 'ATTEMPTED', solutionRevealed: true },
  });

  refresh(problem.slug);
  return { ok: true };
}

/** Marks a problem solved, or clears the solved mark. Requires a submission or a revealed solution. */
export async function setCompleted(problemId, completed) {
  const user = await requireUser();
  const problem = await getProblemStub(problemId);
  if (!problem) return { ok: false, error: 'This problem no longer exists.' };
  const locked = await assertProblemAccess(problem, user.id);
  if (locked) return locked;

  const key = { userId_problemId: { userId: user.id, problemId: problem.id } };
  const [progress, submission] = await Promise.all([
    prisma.problemProgress.findUnique({ where: key }),
    prisma.submission.findUnique({ where: key, select: { id: true } }),
  ]);
  if (!progress || !(progress.solutionRevealed || submission)) {
    return { ok: false, error: 'Attempt the problem before marking it completed.' };
  }

  await prisma.problemProgress.update({
    where: key,
    data: completed
      ? { status: 'COMPLETED', completedAt: new Date(), lastActivityAt: new Date() }
      : { status: 'ATTEMPTED', completedAt: null, lastActivityAt: new Date() },
  });

  refresh(problem.slug);
  return { ok: true };
}

export async function toggleBookmark(problemId) {
  const user = await requireUser();
  const problem = await getProblemStub(problemId);
  if (!problem) return { ok: false, error: 'This problem no longer exists.' };

  const key = { userId_problemId: { userId: user.id, problemId: problem.id } };
  const existing = await prisma.bookmark.findUnique({ where: key, select: { id: true } });

  if (existing) {
    await prisma.bookmark.delete({ where: key });
  } else {
    await prisma.bookmark.create({ data: { userId: user.id, problemId: problem.id } });
  }

  refresh(problem.slug);
  return { ok: true, bookmarked: !existing };
}