'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { isAdmin } from '@/lib/admin';
import { CATEGORIES, categoryOf } from '@/lib/categories';
import { EMPTY_DOC, ensureHeadingIds, isDoc } from '@/lib/docs/tree';
import { makeTabSlug, readSettings, syncQuestions } from '@/lib/docs/store';

const MAX_DOC_BYTES = 4_000_000; // images pasted as data URLs count too

// Every action here is admin-only. The check is repeated on the server for each call, so hiding the buttons is not
// what protects the documents.
async function requireAdmin() {
  const user = await getOrCreateUser();
  if (!isAdmin(user)) throw new Error('Only admins can edit the question documents.');
  return user;
}

function refreshAll(category, slug) {
  revalidatePath('/problems');
  revalidatePath('/problems/hr');
  revalidatePath('/problems/sql');
  revalidatePath(`/docs/${category}`);
  if (slug) revalidatePath(`/docs/${category}/${slug}`);
  revalidatePath('/dashboard');
}

const fail = (error) => ({ ok: false, error });

export async function createTab(category, name) {
  try {
    await requireAdmin();
    if (!CATEGORIES[category]) return fail('Unknown category.');
    const title = String(name ?? '').trim().slice(0, 60);
    if (!title) return fail('Give the tab a name.');
    const slug = await makeTabSlug(category, title);
    const last = await prisma.topic.aggregate({ _max: { order: true } });
    await prisma.topic.create({
      data: { slug, name: title, description: '', order: (last._max.order ?? 0) + 1, content: EMPTY_DOC, settings: {} },
    });
    refreshAll(category, slug);
    return { ok: true, slug };
  } catch (e) {
    return fail(e.message);
  }
}

export async function renameTab(slug, name) {
  try {
    await requireAdmin();
    const title = String(name ?? '').trim().slice(0, 60);
    if (!title) return fail('Give the tab a name.');
    await prisma.topic.update({ where: { slug }, data: { name: title } });
    refreshAll(categoryOf(slug), slug);
    return { ok: true };
  } catch (e) {
    return fail(e.message);
  }
}

/** Deletes a tab with all its questions (and users' progress on them). */
export async function deleteTab(slug) {
  try {
    await requireAdmin();
    const topic = await prisma.topic.findUnique({ where: { slug }, select: { id: true } });
    if (!topic) return { ok: true };
    await prisma.$transaction([prisma.problem.deleteMany({ where: { topicId: topic.id } }), prisma.topic.delete({ where: { id: topic.id } })]);
    refreshAll(categoryOf(slug), slug);
    return { ok: true };
  } catch (e) {
    return fail(e.message);
  }
}

/** Swaps a tab with its neighbour. direction: -1 (up) or 1 (down). */
export async function moveTab(slug, direction) {
  try {
    await requireAdmin();
    const category = categoryOf(slug);
    const { getTabsForAdmin } = await import('@/lib/docs/store');
    const tabs = await getTabsForAdmin(category);
    const i = tabs.findIndex((t) => t.slug === slug);
    const j = i + (direction < 0 ? -1 : 1);
    if (i < 0 || j < 0 || j >= tabs.length) return { ok: true };
    const next = [...tabs];
    [next[i], next[j]] = [next[j], next[i]];
    await prisma.$transaction(next.map((t, idx) => prisma.topic.update({ where: { id: t.id }, data: { order: idx + 1 } })));
    refreshAll(category, slug);
    return { ok: true };
  } catch (e) {
    return fail(e.message);
  }
}

/** Saves the document of one tab, then mirrors its questions into the database. */
export async function saveTab(slug, doc, settings) {
  try {
    await requireAdmin();
    if (!isDoc(doc)) return fail('That document could not be read.');
    if (JSON.stringify(doc).length > MAX_DOC_BYTES) return fail('This tab is too large. Use smaller images or split it into two tabs.');
    const topic = await prisma.topic.findUnique({ where: { slug }, select: { id: true } });
    if (!topic) return fail('This tab no longer exists.');

    const clean = ensureHeadingIds(doc);
    await prisma.topic.update({ where: { id: topic.id }, data: { content: clean, settings: readSettings(settings) } });
    const count = await syncQuestions(topic.id, clean);
    refreshAll(categoryOf(slug), slug);
    return { ok: true, questions: count };
  } catch (e) {
    return fail(e.message);
  }
}