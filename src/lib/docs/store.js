import { prisma } from '@/lib/prisma';
import { topicCategoryWhere } from '@/lib/categories';
import { extractQuestions } from './tree';

const PREFIX = { ai: '', hr: 'hr-', sql: 'sql-' };

export const DEFAULT_SETTINGS = { headingFont: 'serif', textFont: 'sans', wide: false };

export function readSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    headingFont: s.headingFont === 'sans' ? 'sans' : 'serif',
    textFont: s.textFont === 'serif' ? 'serif' : 'sans',
    wide: Boolean(s.wide),
  };
}

const slugify = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'tab';

/** A free slug for a new tab: hr-/sql- prefix for those categories, and AI slugs can never look like HR/SQL ones. */
export async function makeTabSlug(category, name) {
  let base = slugify(name);
  if (category === 'ai' && (base === 'hr' || base === 'sql' || base.startsWith('hr-') || base.startsWith('sql-'))) base = `ai-${base}`;
  const root = `${PREFIX[category]}${base}`;
  let slug = root;
  for (let i = 2; await prisma.topic.findUnique({ where: { slug }, select: { id: true } }); i += 1) slug = `${root}-${i}`;
  return slug;
}

/** Tabs of one category, in order (no content, so it is cheap). */
export function getTabs(category) {
  return prisma.topic.findMany({
    where: { ...topicCategoryWhere(category), content: { not: null } },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: { id: true, slug: true, name: true },
  });
}

/** Admin view: also includes tabs that were created but never saved. */
export function getTabsForAdmin(category) {
  return prisma.topic.findMany({
    where: topicCategoryWhere(category),
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: { id: true, slug: true, name: true },
  });
}

export function getTab(slug) {
  return prisma.topic.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, content: true, settings: true, updatedAt: true },
  });
}

/** Every question of a category, grouped by tab, read from the documents. Used by the /problems lists. */
export async function getDocQuestions(category) {
  const topics = await prisma.topic.findMany({
    where: { ...topicCategoryWhere(category), content: { not: null } },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: { id: true, slug: true, name: true, content: true },
  });
  return topics
    .map((t) => ({ id: t.id, slug: t.slug, name: t.name, questions: extractQuestions(t.content) }))
    .filter((t) => t.questions.length > 0);
}

/**
 * Mirrors the questions (Heading 2s) of a saved tab into Problem rows, so progress, streaks, bookmarks and
 * stats keep working. A question's slug is its heading id. Questions that were removed from the document are
 * deleted together with their progress (cascade). A Heading 2 marked Pro in the editor becomes proOnly here.
 */
export async function syncQuestions(topicId, doc) {
  const questions = extractQuestions(doc);
  const slugs = questions.map((q) => q.id);

  await prisma.$transaction(async (tx) => {
    await tx.problem.deleteMany({ where: { topicId, slug: { notIn: slugs } } });
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      await tx.problem.upsert({
        where: { slug: q.id },
        update: { title: q.title.slice(0, 300), topicId, position: i, published: true, proOnly: q.pro },
        create: {
          slug: q.id,
          title: q.title.slice(0, 300),
          topicId,
          position: i,
          difficulty: 'MEDIUM',
          type: 'CONCEPTUAL',
          published: true,
          proOnly: q.pro,
        },
      });
    }
  }, { timeout: 60000, maxWait: 20000 });

  return questions.length;
}