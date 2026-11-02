import { prisma } from '@/lib/prisma';
import { dayKey } from '@/lib/problems';

/**
 * Topics solved per day, for the Activity chart hover card.
 * Returns { 'YYYY-MM-DD': ['Prompt Engineering', 'Prompt Engineering', 'RAG'] }: one topic name per solved problem,
 * using the same India-time day key as stats.activeDays.
 *
 * A problem counts as solved when its ProblemProgress row is COMPLETED, and the day is its completedAt.
 * Only the last `days` days are loaded (the chart shows at most 182).
 */
export async function getDayTopics(userId, { days = 190 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.problemProgress.findMany({
    where: { userId, status: 'COMPLETED', completedAt: { gte: since } },
    select: {
      completedAt: true,
      problem: { select: { topic: { select: { name: true } } } },
    },
    orderBy: { completedAt: 'asc' },
  });

  const out = {};
  for (const r of rows) {
    if (!r.completedAt) continue;
    const key = dayKey(r.completedAt);
    (out[key] ??= []).push(r.problem?.topic?.name || 'Other');
  }
  return out;
}