// import { prisma } from './prisma';
// import { DIFFICULTIES, PROBLEM_TYPES, PAGE_SIZE, TOPIC_ORDER } from './constants';
// import { attachInsights, insightSelect } from './subscription';

// // One fixed, shuffled order used everywhere a problem list or "next problem" is shown (list pages,
// // previous / next arrows, Problem List popup). It is not sorted by difficulty. Each problem's position comes
// // from a hash of its slug, so the order looks random but stays the same between page loads (pagination never
// // repeats or skips a problem), and adding a new problem does not reshuffle the existing ones.
// const SHUFFLE_SEED = 'buncho-v1';

// function shuffleKey(slug) {
//   let h = 2166136261; // FNV-1a
//   const str = `${SHUFFLE_SEED}:${slug}`;
//   for (let i = 0; i < str.length; i += 1) {
//     h ^= str.charCodeAt(i);
//     h = Math.imul(h, 16777619);
//   }
//   return h >>> 0;
// }

// /** Returns a copy of rows (each needs a slug) in the shared shuffled order. */
// function shuffled(rows) {
//   return rows
//     .map((r) => ({ r, k: shuffleKey(r.slug) }))
//     .sort((a, b) => a.k - b.k || (a.r.slug < b.r.slug ? -1 : 1))
//     .map((x) => x.r);
// }

// /** Allowed values for the Pro/Free and Solved/Not solved filters (also used by the filter bar). */
// export const ACCESS_FILTERS = ['pro', 'free'];
// export const STATUS_FILTERS = ['solved', 'unsolved'];

// /** Turns untrusted search params into a safe filter object. */
// export function parseFilters(sp = {}) {
//   const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
//   return {
//     q: str(sp.q, 100),
//     topic: str(sp.topic, 80),
//     difficulty: DIFFICULTIES.includes(sp.difficulty) ? sp.difficulty : '',
//     type: PROBLEM_TYPES.includes(sp.type) ? sp.type : '',
//     access: ACCESS_FILTERS.includes(sp.access) ? sp.access : '',
//     status: STATUS_FILTERS.includes(sp.status) ? sp.status : '',
//     page: Math.max(1, parseInt(sp.page, 10) || 1),
//   };
// }

// // userId is only needed for the solved / not solved filter; signed-out visitors have no progress, so it is ignored.
// export async function getProblems({ q, topic, difficulty, type, access, status, page, challenge, pro = false, userId = null }) {
//   const where = {
//     published: true,
//     ...(challenge && { isChallenge: true }),
//     ...(topic && { topic: { slug: topic } }),
//     ...(difficulty && { difficulty }),
//     ...(type && { type }),
//     ...(access === 'pro' && { proOnly: true }),
//     ...(access === 'free' && { proOnly: false }),
//     ...(userId && status === 'solved' && { progress: { some: { userId, status: 'COMPLETED' } } }),
//     ...(userId && status === 'unsolved' && { progress: { none: { userId, status: 'COMPLETED' } } }),
//     ...(q && {
//       OR: [
//         { title: { contains: q, mode: 'insensitive' } },
//         { description: { contains: q, mode: 'insensitive' } },
//         { subcategory: { contains: q, mode: 'insensitive' } },
//       ],
//     }),
//   };

//   // Shuffle every matching problem, then load full details for just the requested page
//   const matches = shuffled(await prisma.problem.findMany({ where, select: { id: true, slug: true } }));
//   const total = matches.length;
//   const pageIds = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((m) => m.id);

//   const rows = pageIds.length
//     ? await prisma.problem.findMany({
//         where: { id: { in: pageIds } },
//         select: {
//           id: true,
//           slug: true,
//           title: true,
//           difficulty: true,
//           type: true,
//           estimatedMinutes: true,
//           proOnly: true,
//           topic: { select: { name: true, slug: true } },
//           ...insightSelect(pro),
//         },
//       })
//     : [];
//   const byId = new Map(rows.map((r) => [r.id, r]));
//   const items = pageIds.map((id) => byId.get(id)).filter(Boolean);

//   return { items, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
// }

// export async function getTopics({ challenge = false } = {}) {
//   const topics = await prisma.topic.findMany({
//     orderBy: { order: 'asc' },
//     include: { _count: { select: { problems: { where: { published: true, ...(challenge && { isChallenge: true }) } } } } },
//   });
//   // Your chosen order (TOPIC_ORDER in lib/constants.js) first; anything not listed there
//   // keeps its database order after them.
//   const rank = (slug) => {
//     const i = TOPIC_ORDER.indexOf(slug);
//     return i === -1 ? TOPIC_ORDER.length : i;
//   };
//   return topics
//     .map((t, i) => ({ t, i }))
//     .sort((a, b) => rank(a.t.slug) - rank(b.t.slug) || a.i - b.i)
//     .map(({ t }) => t);
// }

// /** Map of problemId -> 'COMPLETED' for the problems this user has solved (submitted an answer for). */
// export async function getProgressMap(userId, problemIds) {
//   if (!problemIds.length) return {};
//   const rows = await prisma.problemProgress.findMany({
//     where: { userId, status: 'COMPLETED', problemId: { in: problemIds } },
//     select: { problemId: true, status: true },
//   });
//   return Object.fromEntries(rows.map((r) => [r.problemId, r.status]));
// }

// /** Previous / next problem in the same order as the problem list. */
// export async function getProblemNeighbors(slug) {
//   const all = shuffled(await prisma.problem.findMany({ where: { published: true }, select: { slug: true } }));
//   const i = all.findIndex((p) => p.slug === slug);
//   return {
//     prev: i > 0 ? all[i - 1].slug : null,
//     next: i >= 0 && i < all.length - 1 ? all[i + 1].slug : null,
//     index: i + 1,
//     total: all.length,
//   };
// }

// /** YYYY-MM-DD for a date in India time, used to group practice activity by day. */
// export function dayKey(date) {
//   return new Intl.DateTimeFormat('en-CA', {
//     timeZone: 'Asia/Kolkata',
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//   }).format(date);
// }

// /**
//  * Progress numbers for the rings, bars and streak. Works signed out too
//  * (userId null): totals are filled in, everything personal stays at zero.
//  */
// export async function getUserStats(userId) {
//   const [totals, rows] = await Promise.all([
//     prisma.problem.groupBy({ by: ['difficulty'], where: { published: true }, _count: { _all: true } }),
//     userId
//       ? prisma.problemProgress.findMany({
//           where: { userId },
//           orderBy: { lastActivityAt: 'desc' },
//           select: {
//             status: true,
//             lastActivityAt: true,
//             problem: { select: { difficulty: true, published: true } },
//           },
//         })
//       : [],
//   ]);

//   const byDifficulty = { EASY: { solved: 0, total: 0 }, MEDIUM: { solved: 0, total: 0 }, HARD: { solved: 0, total: 0 } };
//   totals.forEach((t) => {
//     if (byDifficulty[t.difficulty]) byDifficulty[t.difficulty].total = t._count._all;
//   });

//   let solved = 0;
//   const activeDays = {};

//   rows.forEach((r) => {
//     if (r.status === 'COMPLETED' && r.problem.published) {
//       solved += 1;
//       if (byDifficulty[r.problem.difficulty]) byDifficulty[r.problem.difficulty].solved += 1;
//     }
//     if (r.lastActivityAt) {
//       const k = dayKey(r.lastActivityAt);
//       activeDays[k] = (activeDays[k] ?? 0) + 1;
//     }
//   });

//   // Streak: consecutive active days up to today (yesterday still counts if today is empty)
//   let streak = 0;
//   const now = Date.now();
//   const startOffset = activeDays[dayKey(new Date(now))] ? 0 : 1;
//   for (let i = startOffset; i < 400; i += 1) {
//     if (activeDays[dayKey(new Date(now - i * 86400000))]) streak += 1;
//     else break;
//   }

//   const total = Object.values(byDifficulty).reduce((s, d) => s + d.total, 0);
//   return { total, solved, byDifficulty, activeDays, streak };
// }

// /**
//  * Next unsolved problems after the current one (wrapping around), for the Problem List popup.
//  * Signed-out visitors just get the next problems in order.
//  */
// export async function getUpNext({ userId, currentSlug, limit = 20, pro = false }) {
//   const all = shuffled(
//     await prisma.problem.findMany({ where: { published: true }, select: { id: true, slug: true, title: true, difficulty: true, proOnly: true } }),
//   );
//   const status = userId ? await getProgressMap(userId, all.map((p) => p.id)) : {};

//   const i = all.findIndex((p) => p.slug === currentSlug);
//   const rotated = i >= 0 ? [...all.slice(i + 1), ...all.slice(0, i)] : all;
//   const unsolved = rotated.filter((p) => status[p.id] !== 'COMPLETED');

//   const items = await attachInsights(
//     unsolved.slice(0, limit).map((p) => ({ slug: p.slug, title: p.title, difficulty: p.difficulty, proOnly: p.proOnly })),
//     pro,
//   );
//   return { items, remaining: unsolved.length };
// }


import { prisma } from './prisma';
import { DIFFICULTIES, PROBLEM_TYPES, PAGE_SIZE, TOPIC_ORDER } from './constants';
import { attachInsights, insightSelect } from './subscription';
import { topicCategoryWhere, categoryOf } from './categories';

// One fixed, shuffled order used everywhere a problem list or "next problem" is shown (list pages,
// previous / next arrows, Problem List popup). It is not sorted by difficulty. Each problem's position comes
// from a hash of its slug, so the order looks random but stays the same between page loads (pagination never
// repeats or skips a problem), and adding a new problem does not reshuffle the existing ones.
const SHUFFLE_SEED = 'buncho-v1';

function shuffleKey(slug) {
  let h = 2166136261; // FNV-1a
  const str = `${SHUFFLE_SEED}:${slug}`;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Returns a copy of rows (each needs a slug) in the shared shuffled order. */
function shuffled(rows) {
  return rows
    .map((r) => ({ r, k: shuffleKey(r.slug) }))
    .sort((a, b) => a.k - b.k || (a.r.slug < b.r.slug ? -1 : 1))
    .map((x) => x.r);
}

/** Allowed values for the Pro/Free and Solved/Not solved filters (also used by the filter bar). */
export const ACCESS_FILTERS = ['pro', 'free'];
export const STATUS_FILTERS = ['solved', 'unsolved'];

/** Company-wise insights are a Pro feature. Set to false to let free users use the sidebar company filter too. */
export const COMPANY_FILTER_PRO_ONLY = true;

/** Turns untrusted search params into a safe filter object. */
export function parseFilters(sp = {}) {
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  return {
    q: str(sp.q, 100),
    topic: str(sp.topic, 80),
    sub: str(sp.sub, 80), // SQL topic chip (the question's subcategory)
    company: str(sp.company, 80), // company filter in the sidebar (Pro)
    difficulty: DIFFICULTIES.includes(sp.difficulty) ? sp.difficulty : '',
    type: PROBLEM_TYPES.includes(sp.type) ? sp.type : '',
    access: ACCESS_FILTERS.includes(sp.access) ? sp.access : '',
    status: STATUS_FILTERS.includes(sp.status) ? sp.status : '',
    page: Math.max(1, parseInt(sp.page, 10) || 1),
  };
}

// userId is only needed for the solved / not solved filter; signed-out visitors have no progress, so it is ignored.
// category: 'ai' (default, every non-HR / non-SQL topic) | 'hr' | 'sql' | 'all'
export async function getProblems({ q, topic, sub, company, difficulty, type, access, status, page, challenge, category = 'ai', pro = false, userId = null }) {
  const topicFilters = [topic && { slug: topic }, topicCategoryWhere(category)].filter(Boolean);
  const where = {
    published: true,
    ...(challenge && { isChallenge: true }),
    ...(topicFilters.length && { topic: { AND: topicFilters } }),
    ...(sub && { subcategory: sub }),
    // Company data is a Pro insight, so the filter only applies for Pro users (see COMPANY_FILTER_PRO_ONLY)
    ...(company && (pro || !COMPANY_FILTER_PRO_ONLY) && { askedByCompanies: { has: company } }),
    ...(difficulty && { difficulty }),
    ...(type && { type }),
    ...(access === 'pro' && { proOnly: true }),
    ...(access === 'free' && { proOnly: false }),
    ...(userId && status === 'solved' && { progress: { some: { userId, status: 'COMPLETED' } } }),
    ...(userId && status === 'unsolved' && { progress: { none: { userId, status: 'COMPLETED' } } }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { subcategory: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  // Shuffle every matching problem, then load full details for just the requested page
  const matches = shuffled(await prisma.problem.findMany({ where, select: { id: true, slug: true } }));
  const total = matches.length;
  const pageIds = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((m) => m.id);

  const rows = pageIds.length
    ? await prisma.problem.findMany({
        where: { id: { in: pageIds } },
        select: {
          id: true,
          slug: true,
          title: true,
          difficulty: true,
          type: true,
          estimatedMinutes: true,
          proOnly: true,
          subcategory: true,
          topic: { select: { name: true, slug: true } },
          ...insightSelect(pro),
        },
      })
    : [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const items = pageIds.map((id) => byId.get(id)).filter(Boolean);

  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getTopics({ challenge = false, category = 'ai' } = {}) {
  const topics = await prisma.topic.findMany({
    where: topicCategoryWhere(category),
    orderBy: { order: 'asc' },
    include: { _count: { select: { problems: { where: { published: true, ...(challenge && { isChallenge: true }) } } } } },
  });
  // Your chosen order (TOPIC_ORDER in lib/constants.js) first; anything not listed there
  // keeps its database order after them.
  const rank = (slug) => {
    const i = TOPIC_ORDER.indexOf(slug);
    return i === -1 ? TOPIC_ORDER.length : i;
  };
  return topics
    .map((t, i) => ({ t, i }))
    .sort((a, b) => rank(a.t.slug) - rank(b.t.slug) || a.i - b.i)
    .map(({ t }) => t);
}

/**
 * Topic chips for the SQL list: one per subcategory, with the number of published questions.
 * Chips follow the order of the first question of each subcategory in prisma/seed-sql.js (its `position`).
 */
export async function getSubcategories({ category = 'sql' } = {}) {
  const rows = await prisma.problem.groupBy({
    by: ['subcategory'],
    where: { published: true, subcategory: { not: null }, topic: topicCategoryWhere(category) },
    _count: { _all: true },
    _min: { position: true },
  });
  return rows
    .map((r) => ({ name: r.subcategory, count: r._count._all, order: r._min.position ?? 0 }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** Published question counts per category, for the sidebar on /problems. */
export async function getCategoryCounts() {
  const [ai, hr, sql] = await Promise.all(
    ['ai', 'hr', 'sql'].map((c) => prisma.problem.count({ where: { published: true, topic: topicCategoryWhere(c) } })),
  );
  return { ai, hr, sql };
}

/**
 * Sidebar company filter: every company asked in this category, with how many published
 * questions it asked, most questions first. askedByCompanies is a String[] so the counting is done here.
 */
export async function getCompanyCounts({ category = 'ai' } = {}) {
  const rows = await prisma.problem.findMany({
    where: { published: true, topic: topicCategoryWhere(category) },
    select: { askedByCompanies: true },
  });
  const counts = new Map();
  rows.forEach((r) => {
    new Set((r.askedByCompanies ?? []).map((c) => c.trim()).filter(Boolean)).forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Map of problemId -> 'COMPLETED' for the problems this user has solved (submitted an answer for). */
export async function getProgressMap(userId, problemIds) {
  if (!problemIds.length) return {};
  const rows = await prisma.problemProgress.findMany({
    where: { userId, status: 'COMPLETED', problemId: { in: problemIds } },
    select: { problemId: true, status: true },
  });
  return Object.fromEntries(rows.map((r) => [r.problemId, r.status]));
}

/** Previous / next problem in the same order as the problem list (within one category). */
export async function getProblemNeighbors(slug, category = 'ai') {
  const all = shuffled(
    await prisma.problem.findMany({ where: { published: true, topic: topicCategoryWhere(category) }, select: { slug: true } }),
  );
  const i = all.findIndex((p) => p.slug === slug);
  return {
    prev: i > 0 ? all[i - 1].slug : null,
    next: i >= 0 && i < all.length - 1 ? all[i + 1].slug : null,
    index: i + 1,
    total: all.length,
  };
}

/** YYYY-MM-DD for a date in India time, used to group practice activity by day. */
export function dayKey(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Progress numbers for the rings, bars and streak. Works signed out too
 * (userId null): totals are filled in, everything personal stays at zero.
 */
// category: 'all' (default, used by the dashboard and profiles) | 'ai' | 'hr' | 'sql'
export async function getUserStats(userId, category = 'all') {
  const topic = topicCategoryWhere(category);
  const [totals, rows] = await Promise.all([
    prisma.problem.groupBy({ by: ['difficulty'], where: { published: true, ...(topic && { topic }) }, _count: { _all: true } }),
    // Rows from EVERY category are read on purpose: the streak and activity days are shared by the AI/ML, HR and SQL
    // pages. Only the solved counts below are limited to `category`.
    userId
      ? prisma.problemProgress.findMany({
          where: { userId },
          orderBy: { lastActivityAt: 'desc' },
          select: {
            status: true,
            lastActivityAt: true,
            problem: { select: { difficulty: true, published: true, topic: { select: { slug: true } } } },
          },
        })
      : [],
  ]);

  const byDifficulty = { EASY: { solved: 0, total: 0 }, MEDIUM: { solved: 0, total: 0 }, HARD: { solved: 0, total: 0 } };
  totals.forEach((t) => {
    if (byDifficulty[t.difficulty]) byDifficulty[t.difficulty].total = t._count._all;
  });

  let solved = 0;
  const activeDays = {};

  rows.forEach((r) => {
    const inCategory = category === 'all' || categoryOf(r.problem.topic.slug) === category;
    if (inCategory && r.status === 'COMPLETED' && r.problem.published) {
      solved += 1;
      if (byDifficulty[r.problem.difficulty]) byDifficulty[r.problem.difficulty].solved += 1;
    }
    // Any activity in any category keeps the shared streak alive
    if (r.lastActivityAt) {
      const k = dayKey(r.lastActivityAt);
      activeDays[k] = (activeDays[k] ?? 0) + 1;
    }
  });

  // Streak: consecutive active days up to today (yesterday still counts if today is empty)
  let streak = 0;
  const now = Date.now();
  const startOffset = activeDays[dayKey(new Date(now))] ? 0 : 1;
  for (let i = startOffset; i < 400; i += 1) {
    if (activeDays[dayKey(new Date(now - i * 86400000))]) streak += 1;
    else break;
  }

  const total = Object.values(byDifficulty).reduce((s, d) => s + d.total, 0);
  return { total, solved, byDifficulty, activeDays, streak };
}

/**
 * Next unsolved problems after the current one (wrapping around), for the Problem List popup.
 * Signed-out visitors just get the next problems in order.
 */
export async function getUpNext({ userId, currentSlug, limit = 20, pro = false, category = 'ai' }) {
  const all = shuffled(
    await prisma.problem.findMany({
      where: { published: true, topic: topicCategoryWhere(category) },
      select: { id: true, slug: true, title: true, difficulty: true, proOnly: true, topic: { select: { slug: true } } },
    }),
  );
  const status = userId ? await getProgressMap(userId, all.map((p) => p.id)) : {};

  const i = all.findIndex((p) => p.slug === currentSlug);
  const rotated = i >= 0 ? [...all.slice(i + 1), ...all.slice(0, i)] : all;
  const unsolved = rotated.filter((p) => status[p.id] !== 'COMPLETED');

  const items = await attachInsights(
    unsolved.slice(0, limit).map((p) => ({ slug: p.slug, topicSlug: p.topic.slug, title: p.title, difficulty: p.difficulty, proOnly: p.proOnly })),
    pro,
  );
  return { items, remaining: unsolved.length };
}