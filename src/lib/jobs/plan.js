// import { prisma } from '@/lib/prisma';
// import { getSkill } from './skills';
// import { PLAN_SIZE, PLAN_MAX_PER_SKILL, RELEVANCE_THRESHOLD } from '@/lib/constants';

// const DIFF_ORDER = { EASY: 0, MEDIUM: 1, HARD: 2 };
// const lc = (s) => String(s ?? '').toLowerCase();

// /** How relevant one question is to one skill (0 = not at all). Title and subcategory hits count more than description hits. */
// function relevance(skill, p) {
//   const title = lc(p.title);
//   const sub = lc(p.subcategory);
//   const desc = lc(p.description);
//   let score = 0;
//   for (const t of new Set([...skill.terms, ...skill.aliases].map((x) => x.toLowerCase()))) {
//     if (title.includes(t)) score += 4;
//     else if (sub.includes(t)) score += 3;
//     else if (desc.includes(t)) score += 1;
//   }
//   // The topic only nudges the score, so a topic match without any text match is never enough
//   if (score > 0 && skill.topics.includes(p.topic.slug)) score += 2;
//   return score;
// }

// /**
//  * Builds a practice plan from questions that already exist in the reviewed bank.
//  * Returns { items, coverage, minutes }.
//  *  - items: [{ problemId, skillKeys, priority, reason }] in the order they should be practised
//  *  - coverage: { [skillKey]: number of matching questions in the whole bank }, so gaps are shown honestly
//  */
// export async function buildPlan(skills, { pro = false } = {}) {
//   const problems = await prisma.problem.findMany({
//     // Pro-only questions are only planned for Pro users, so a free plan never links to a locked question
//     where: { published: true, ...(pro ? {} : { proOnly: false }) },
//     select: {
//       id: true, title: true, subcategory: true, description: true, difficulty: true, estimatedMinutes: true,
//       topic: { select: { slug: true } },
//     },
//   });

//   const ranked = new Map(); // skillKey -> [{ p, score }]
//   const coverage = {};
//   for (const s of skills) {
//     const def = getSkill(s.key);
//     if (!def) continue;
//     const list = problems
//       .map((p) => ({ p, score: relevance(def, p) }))
//       .filter((x) => x.score >= RELEVANCE_THRESHOLD)
//       .sort((a, b) => b.score - a.score || DIFF_ORDER[a.p.difficulty] - DIFF_ORDER[b.p.difficulty]);
//     ranked.set(s.key, list);
//     coverage[s.key] = list.length;
//   }

//   // Each skill gets a share of the plan proportional to its weight (at least 1 if it has any question)
//   const covered = skills.filter((s) => (coverage[s.key] ?? 0) > 0);
//   const totalWeight = covered.reduce((a, s) => a + s.weight, 0) || 1;
//   const chosen = new Map(); // problemId -> { problem, skillKeys, bestScore, weight }

//   const take = (skillKey, weight, limit) => {
//     let added = 0;
//     for (const { p, score } of ranked.get(skillKey) ?? []) {
//       if (added >= limit) break;
//       const hit = chosen.get(p.id);
//       if (hit) {
//         // A question that serves several required skills is more valuable, and costs no extra time
//         if (!hit.skillKeys.includes(skillKey)) hit.skillKeys.push(skillKey);
//         hit.weight += weight;
//         continue;
//       }
//       chosen.set(p.id, { problem: p, skillKeys: [skillKey], bestScore: score, weight });
//       added += 1;
//     }
//   };

//   for (const s of covered) {
//     const quota = Math.min(PLAN_MAX_PER_SKILL, Math.max(1, Math.round((PLAN_SIZE * s.weight) / totalWeight)));
//     take(s.key, s.weight, quota);
//   }

//   // Fill any remaining room with the next best questions for the heaviest skills
//   for (const s of [...covered].sort((a, b) => b.weight - a.weight)) {
//     if (chosen.size >= PLAN_SIZE) break;
//     take(s.key, s.weight, 1);
//   }

//   const skillWeight = Object.fromEntries(skills.map((s) => [s.key, s.weight]));
//   const labelOf = (k) => getSkill(k)?.label ?? k;

//   const items = [...chosen.values()]
//     .sort((a, b) => b.weight - a.weight || DIFF_ORDER[a.problem.difficulty] - DIFF_ORDER[b.problem.difficulty])
//     .slice(0, PLAN_SIZE)
//     // Within the final list: core skills first, then easier to harder, so the plan feels like a progression
//     .sort((a, b) => {
//       const ka = Math.max(...a.skillKeys.map((k) => skillWeight[k] ?? 0));
//       const kb = Math.max(...b.skillKeys.map((k) => skillWeight[k] ?? 0));
//       return (kb >= 3 ? 1 : 0) - (ka >= 3 ? 1 : 0) || DIFF_ORDER[a.problem.difficulty] - DIFF_ORDER[b.problem.difficulty] || kb - ka;
//     })
//     .map((c, i) => ({
//       problemId: c.problem.id,
//       skillKeys: c.skillKeys,
//       priority: i,
//       reason: `Covers ${c.skillKeys.map(labelOf).join(', ')}`,
//     }));

//   const minutes = items.reduce((a, it) => a + (problems.find((p) => p.id === it.problemId)?.estimatedMinutes ?? 10), 0);
//   return { items, coverage, minutes };
// }

import { prisma } from '@/lib/prisma';
import { getSkill } from './skills';
import { NON_AI_TOPIC_SLUGS } from '@/lib/categories';
import { PLAN_SIZE, PLAN_MAX_PER_SKILL, RELEVANCE_THRESHOLD } from '@/lib/constants';

const DIFF_ORDER = { EASY: 0, MEDIUM: 1, HARD: 2 };
const lc = (s) => String(s ?? '').toLowerCase();

/** How relevant one question is to one skill (0 = not at all). Title and subcategory hits count more than description hits. */
function relevance(skill, p) {
  const title = lc(p.title);
  const sub = lc(p.subcategory);
  const desc = lc(p.description);
  let score = 0;
  for (const t of new Set([...skill.terms, ...skill.aliases].map((x) => x.toLowerCase()))) {
    if (title.includes(t)) score += 4;
    else if (sub.includes(t)) score += 3;
    else if (desc.includes(t)) score += 1;
  }
  // The topic only nudges the score, so a topic match without any text match is never enough
  if (score > 0 && skill.topics.includes(p.topic.slug)) score += 2;
  return score;
}

/**
 * Builds a practice plan from questions that already exist in the reviewed bank.
 * Returns { items, coverage, minutes }.
 *  - items: [{ problemId, skillKeys, priority, reason }] in the order they should be practised
 *  - coverage: { [skillKey]: number of matching questions in the whole bank }, so gaps are shown honestly
 */
export async function buildPlan(skills, { pro = false } = {}) {
  const problems = await prisma.problem.findMany({
    // Pro-only questions are only planned for Pro users, so a free plan never links to a locked question.
    // HR and SQL questions are never planned against a job description (mocks are graded by AI, SQL questions have no AI feedback).
    where: { published: true, topic: { slug: { notIn: NON_AI_TOPIC_SLUGS } }, ...(pro ? {} : { proOnly: false }) },
    select: {
      id: true, title: true, subcategory: true, description: true, difficulty: true, estimatedMinutes: true,
      topic: { select: { slug: true } },
    },
  });

  const ranked = new Map(); // skillKey -> [{ p, score }]
  const coverage = {};
  for (const s of skills) {
    const def = getSkill(s.key);
    if (!def) continue;
    const list = problems
      .map((p) => ({ p, score: relevance(def, p) }))
      .filter((x) => x.score >= RELEVANCE_THRESHOLD)
      .sort((a, b) => b.score - a.score || DIFF_ORDER[a.p.difficulty] - DIFF_ORDER[b.p.difficulty]);
    ranked.set(s.key, list);
    coverage[s.key] = list.length;
  }

  // Each skill gets a share of the plan proportional to its weight (at least 1 if it has any question)
  const covered = skills.filter((s) => (coverage[s.key] ?? 0) > 0);
  const totalWeight = covered.reduce((a, s) => a + s.weight, 0) || 1;
  const chosen = new Map(); // problemId -> { problem, skillKeys, bestScore, weight }

  const take = (skillKey, weight, limit) => {
    let added = 0;
    for (const { p, score } of ranked.get(skillKey) ?? []) {
      if (added >= limit) break;
      const hit = chosen.get(p.id);
      if (hit) {
        // A question that serves several required skills is more valuable, and costs no extra time
        if (!hit.skillKeys.includes(skillKey)) hit.skillKeys.push(skillKey);
        hit.weight += weight;
        continue;
      }
      chosen.set(p.id, { problem: p, skillKeys: [skillKey], bestScore: score, weight });
      added += 1;
    }
  };

  for (const s of covered) {
    const quota = Math.min(PLAN_MAX_PER_SKILL, Math.max(1, Math.round((PLAN_SIZE * s.weight) / totalWeight)));
    take(s.key, s.weight, quota);
  }

  // Fill any remaining room with the next best questions for the heaviest skills
  for (const s of [...covered].sort((a, b) => b.weight - a.weight)) {
    if (chosen.size >= PLAN_SIZE) break;
    take(s.key, s.weight, 1);
  }

  const skillWeight = Object.fromEntries(skills.map((s) => [s.key, s.weight]));
  const labelOf = (k) => getSkill(k)?.label ?? k;

  const items = [...chosen.values()]
    .sort((a, b) => b.weight - a.weight || DIFF_ORDER[a.problem.difficulty] - DIFF_ORDER[b.problem.difficulty])
    .slice(0, PLAN_SIZE)
    // Within the final list: core skills first, then easier to harder, so the plan feels like a progression
    .sort((a, b) => {
      const ka = Math.max(...a.skillKeys.map((k) => skillWeight[k] ?? 0));
      const kb = Math.max(...b.skillKeys.map((k) => skillWeight[k] ?? 0));
      return (kb >= 3 ? 1 : 0) - (ka >= 3 ? 1 : 0) || DIFF_ORDER[a.problem.difficulty] - DIFF_ORDER[b.problem.difficulty] || kb - ka;
    })
    .map((c, i) => ({
      problemId: c.problem.id,
      skillKeys: c.skillKeys,
      priority: i,
      reason: `Covers ${c.skillKeys.map(labelOf).join(', ')}`,
    }));

  const minutes = items.reduce((a, it) => a + (problems.find((p) => p.id === it.problemId)?.estimatedMinutes ?? 10), 0);
  return { items, coverage, minutes };
}