import { cache } from 'react';
import { prisma } from './prisma';
import { getUserStats } from './problems';
import { getIsPro } from './subscription';
import { normalizeUsername, validateUsername } from './username';
import { badgeList } from './badges';
import { CATEGORIES, categoryOf, topicCategoryWhere } from './categories';

/* ------------------------------------------------------------------ */
/* Public profile data. Everything here is safe to show to strangers:  */
/* no email, no private submissions and no Pro-only question content. */
/* The owner toggle (showStats) is applied here, so the page cannot     */
/* forget it.                                                           */
/* ------------------------------------------------------------------ */

export const LEVELS = [
  { key: 'rookie', name: 'Rookie', min: 0 },
  { key: 'practitioner', name: 'Practitioner', min: 5 },
  { key: 'specialist', name: 'Specialist', min: 15 },
  { key: 'expert', name: 'Expert', min: 40 },
  { key: 'master', name: 'Master', min: 100 },
];

export function getLevel(solved) {
  let i = 0;
  LEVELS.forEach((l, idx) => {
    if (solved >= l.min) i = idx;
  });
  const level = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  const progress = next ? (solved - level.min) / (next.min - level.min) : 1;
  return { ...level, index: i, next, progress, toNext: next ? next.min - solved : 0 };
}

// Badge definitions live in lib/badges.js (milestones + achievements, all computed from real activity).
export { badgeList };

/** "Priya Sharma" -> "Priya S." so full names are not exposed publicly. */
function displayName(name) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'A Buncho learner';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/**
 * Badge progress for the signed-in user's own dashboard. This is the owner's private view, so it
 * ignores the public-profile privacy toggles. Pass `stats` (from getUserStats) to avoid a second query.
 */
export async function getUserBadges(userId, { pro = false, stats } = {}) {
  const [s, hard, evals] = await Promise.all([
    stats ?? getUserStats(userId),
    prisma.problemProgress.count({ where: { userId, status: 'COMPLETED', problem: { published: true, difficulty: 'HARD' } } }),
    prisma.evaluation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { problemId: true, score: true } }),
  ]);

  const latest = new Map();
  for (const e of evals) if (!latest.has(e.problemId)) latest.set(e.problemId, e.score);
  const scores = [...latest.values()];
  const avgScore = scores.length ? Math.round(scores.reduce((sum, x) => sum + x, 0) / scores.length) : 0;

  const metrics = {
    solved: s.solved,
    streak: s.streak,
    hard,
    evals: scores.length,
    avgScore,
    activeDays: Object.keys(s.activeDays).length,
    pro,
  };
  return { metrics, badges: badgeList(metrics) };
}

/** One query by unique username. Cached per request so generateMetadata and the page share it. */
export const findProfileUser = cache(async (raw) => {
  const check = validateUsername(raw);
  if (!check.ok) return null;
  return prisma.user.findUnique({
    where: { username: normalizeUsername(raw) },
    select: {
      id: true,
      username: true,
      name: true,
      profileName: true,
      imageUrl: true,
      headline: true,
      bio: true,
      location: true,
      website: true,
      githubHandle: true,
      linkedinHandle: true,
      xHandle: true,
      profilePublic: true,
      showStats: true,
      profileViews: true,
      createdAt: true,
    },
  });
});

export const publicName = (u) => u.profileName || displayName(u.name);

/** Everything the profile page and the share image show. Cached per request. */
export const getProfileData = cache(async (user) => {
  const pro = await getIsPro(user.id);
  const base = { name: publicName(user), pro, stats: null, level: null, topics: [], categories: [], avgScore: null, evals: 0, badges: [] };

  const [stats, completed, evals, totals] = await Promise.all([
    user.showStats ? getUserStats(user.id) : null,
    user.showStats
      ? prisma.problemProgress.findMany({
          where: { userId: user.id, status: 'COMPLETED', problem: { published: true } },
          select: { problemId: true, problem: { select: { difficulty: true, topic: { select: { name: true, slug: true } } } } },
        })
      : [],
    user.showStats
      ? prisma.evaluation.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, select: { problemId: true, score: true } })
      : [],
    // Published questions per category (AI/ML, HR, SQL), to show "solved of total"
    user.showStats
      ? Promise.all(Object.keys(CATEGORIES).map((key) => prisma.problem.count({ where: { published: true, topic: topicCategoryWhere(key) } })))
      : [],
  ]);

  const out = { ...base };

  if (!stats) return out;

  // Latest AI score per problem
  const latest = new Map();
  for (const e of evals) if (!latest.has(e.problemId)) latest.set(e.problemId, e.score);
  const scores = [...latest.values()];
  const avgScore = scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : null;

  // Strength per topic: solved count, and the average AI score over solved problems that were evaluated
  const byTopic = new Map();
  // Same numbers one level up: per category (AI/ML, HR, SQL) instead of per sub-topic
  const byCategory = new Map(Object.keys(CATEGORIES).map((key, i) => [key, { key, solved: 0, sum: 0, n: 0, total: totals[i] ?? 0 }]));
  let hard = 0;
  completed.forEach((c) => {
    if (c.problem.difficulty === 'HARD') hard += 1;
    const t = c.problem.topic;
    const cat = byCategory.get(categoryOf(t.slug));
    cat.solved += 1;
    if (latest.has(c.problemId)) {
      cat.sum += latest.get(c.problemId);
      cat.n += 1;
    }
    const row = byTopic.get(t.slug) ?? { slug: t.slug, name: t.name, solved: 0, sum: 0, n: 0 };
    row.solved += 1;
    if (latest.has(c.problemId)) {
      row.sum += latest.get(c.problemId);
      row.n += 1;
    }
    byTopic.set(t.slug, row);
  });
  const topics = [...byTopic.values()]
    .map((t) => ({ slug: t.slug, name: t.name, solved: t.solved, avg: t.n ? Math.round(t.sum / t.n) : null }))
    .sort((a, b) => b.solved - a.solved || (b.avg ?? 0) - (a.avg ?? 0))
    .slice(0, 8);

  const categories = [...byCategory.values()].map((c) => ({
    key: c.key,
    label: CATEGORIES[c.key].label.trim(),
    solved: c.solved,
    total: c.total,
    avg: c.n ? Math.round(c.sum / c.n) : null, // null = no AI feedback yet (always the case for SQL)
  }));

  const metrics = {
    solved: stats.solved,
    streak: stats.streak,
    hard,
    evals: scores.length,
    avgScore: avgScore ?? 0,
    activeDays: Object.keys(stats.activeDays).length,
    pro,
  };

  return {
    ...out,
    stats,
    level: getLevel(stats.solved),
    topics,
    categories,
    avgScore,
    evals: scores.length,
    badges: badgeList(metrics),
  };
});