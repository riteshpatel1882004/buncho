import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/seo';
import { docHref } from '@/lib/categories';

// Rebuilt at most once an hour, so new problems show up without hitting the database on every crawl.
export const revalidate = 3600;

// Bump these when the legal text actually changes, so lastModified stays truthful.
const TERMS_UPDATED = new Date('2026-10-22');
const PRIVACY_UPDATED = new Date('2026-10-22');

export default async function sitemap() {
  const now = new Date();
  const entries = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/problems`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/problems/hr`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/problems/sql`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/terms`, lastModified: TERMS_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: PRIVACY_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const [problems, profiles] = await Promise.all([
      // One entry per document tab (a question is an anchor inside its tab, so it has no URL of its own)
      prisma.topic.findMany({
        where: { content: { not: null } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      // Public profiles with at least one solved problem (empty profiles are noindex, so keep them out)
      prisma.user.findMany({
        where: { username: { not: null }, profilePublic: true, showStats: true, progress: { some: { status: 'COMPLETED' } } },
        select: { username: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5000,
      }),
    ]);

    profiles.forEach((u) => {
      entries.push({ url: `${SITE_URL}/user/${u.username}`, lastModified: u.updatedAt, changeFrequency: 'weekly', priority: 0.4 });
    });

    problems.forEach((t) => {
      entries.push({ url: `${SITE_URL}${docHref(t.slug)}`, lastModified: t.updatedAt, changeFrequency: 'weekly', priority: 0.7 });
    });
  } catch (err) {
    // If the database is unreachable the static pages are still returned instead of failing the build
    console.error('[sitemap] could not load problems', err);
  }

  return entries;
}