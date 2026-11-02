import { prisma } from '@/lib/prisma';
import { dayKey } from '@/lib/problems';

/**
 * Topics solved per day, for the Activity chart hover card.
 * Returns { 'YYYY-MM-DD': ['Arrays', 'Arrays', 'Graphs'] } (one topic name per solved problem),
 * using the same India-time day key as stats.activeDays.
 *
 * IMPORTANT: the model and field names below are ASSUMED, because the Prisma schema was not shared.
 * Change them to match your schema:
 *   prisma.solve      -> the model that records a solved problem (maybe prisma.submission / prisma.progress)
 *   solvedAt          -> the date the problem was solved
 *   problem.topic     -> the topic / category name on the problem
 */
export async function getDayTopics(userId, { days = 190 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.solve.findMany({
    where: { userId, solvedAt: { gte: since } },
    select: { solvedAt: true, problem: { select: { topic: true } } },
    orderBy: { solvedAt: 'asc' },
  });

  const out = {};
  for (const r of rows) {
    const key = dayKey(r.solvedAt);
    (out[key] ??= []).push(r.problem?.topic || 'Other');
  }
  return out;
}