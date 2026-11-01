import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { evaluateAnswer, hashContent } from '@/lib/ai/evaluate';
import { AiUnavailableError } from '@/lib/ai/providers';
import { AI_EVAL_LIMIT_PER_DAY, AI_EVAL_LIMIT_PER_HOUR } from '@/lib/constants';
import { assertProblemAccess } from '@/lib/pro-access';
import { isSqlTopic } from '@/lib/categories';

export const runtime = 'nodejs';
export const maxDuration = 60; // fallbacks can take a while; raise/lower to match your Vercel plan

const reply = (body, status = 200) => NextResponse.json(body, { status });

export async function POST(req) {
  const user = await getOrCreateUser();
  if (!user) return reply({ ok: false, error: 'You need to sign in first.' }, 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return reply({ ok: false, error: 'Invalid request.' }, 400);
  }
  const problemId = typeof body?.problemId === 'string' ? body.problemId.slice(0, 60) : '';
  if (!problemId) return reply({ ok: false, error: 'Invalid request.' }, 400);

  // The answer is always read from the database, never from the request body.
  const submission = await prisma.submission.findUnique({
    where: { userId_problemId: { userId: user.id, problemId } },
    include: {
      problem: {
        select: {
          title: true,
          description: true,
          type: true,
          difficulty: true,
          published: true,
          proOnly: true,
          steps: true,
          rubric: true,
          scenarioData: true,
          topic: { select: { name: true, slug: true } },
          expertSolution: { select: { content: true } },
        },
      },
    },
  });
  if (!submission || !submission.problem.published) {
    return reply({ ok: false, error: 'Save an answer first.' }, 404);
  }

  // SQL questions are answered with "All possible answers + optimization", not AI feedback
  if (isSqlTopic(submission.problem.topic.slug)) {
    return reply({ ok: false, error: 'AI feedback is not available for SQL questions.' }, 400);
  }

  // Pro questions: AI feedback needs an active subscription (checked here, not only in the UI).
  const denied = await assertProblemAccess(submission.problem, user.id);
  if (denied) return reply({ ...denied, code: 'UPGRADE' }, 403);

  // Same answer already evaluated: reuse it, no model call, no quota used.
  const hash = hashContent(submission.content);
  const existing = await prisma.evaluation.findFirst({
    where: { submissionId: submission.id, contentHash: hash },
    select: { id: true },
  });
  if (existing) return reply({ ok: true, cached: true });

  // Per-user rate limit to control cost
  const now = Date.now();
  const recent = await prisma.evaluation.findMany({
    where: { userId: user.id, createdAt: { gte: new Date(now - 24 * 3600 * 1000) } },
    select: { createdAt: true },
  });
  const lastHour = recent.filter((r) => r.createdAt.getTime() > now - 3600 * 1000).length;
  if (lastHour >= AI_EVAL_LIMIT_PER_HOUR || recent.length >= AI_EVAL_LIMIT_PER_DAY) {
    return reply({ ok: false, error: 'you have reached the AI feedback limit for now. Try again later.' }, 429);
  }

  try {
    const result = await evaluateAnswer({
      problem: submission.problem,
      referenceAnswer: submission.problem.expertSolution?.content ?? '',
      answer: submission.content,
    });

    await prisma.evaluation.create({
      data: {
        submissionId: submission.id,
        userId: user.id,
        problemId,
        contentHash: hash,
        score: result.value.score,
        scores: result.value.scores,
        feedback: result.value.feedback,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        fallbacks: result.fallbacks,
      },
    });

    revalidatePath('/dashboard'); // readiness, weak topics and revision queue depend on evaluations
    return reply({ ok: true });
  } catch (err) {
    console.error('[ai] evaluation failed', err instanceof AiUnavailableError ? err.failures : err);
    if (err instanceof AiUnavailableError) {
      return reply({ ok: false, error: 'AI feedback is busy right now. Try again in a minute.' }, 503);
    }
    return reply({ ok: false, error: 'Something went wrong while generating feedback.' }, 500);
  }
}