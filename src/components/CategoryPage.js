import Link from 'next/link';
import DocQuestionList from '@/components/docs/DocQuestionList';
import ProblemsShell from '@/components/ProblemsShell';
import { ProgressCard } from '@/components/ProblemStats';
import PromoSection from '@/components/PromoSection';
import PacePlanner from '@/components/PacePlanner';
import { getCategoryCounts, getUserStats, parseFilters } from '@/lib/problems';
import { isAdmin } from '@/lib/admin';
import { CATEGORIES } from '@/lib/categories';
import { getOrCreateUser } from '@/lib/user';
import { getLiveAds } from '@/lib/ads';
import { Bookmark } from '@/components/icons';
import JsonLd from '@/components/JsonLd';
import { buildMetadata, collectionPageJsonLd, breadcrumbJsonLd, graph, hasActiveFilters } from '@/lib/seo';

const COPY = {
  ai: {
    metaTitle: 'AI, ML & GenAI Interview Questions',
    metaDescription:
      'Curated AI, ML and GenAI interview questions on LLMs, RAG, deep learning, MLOps and system design. Read the question and practise your answer in your own words.',
    h1: 'AI, ML and GenAI interview questions',
    schemaName: 'AI, ML and GenAI interview questions',
  },
  hr: {
    metaTitle: 'HR Interview Questions for AI Engineers',
    metaDescription:
      'Behavioural and HR interview questions for AI engineering roles, Practise your own answer to each one.',
    h1: 'HR interview questions for AI engineers',
    schemaName: 'HR interview questions for AI engineering roles',
  },
  sql: {
    metaTitle: 'SQL Interview Questions for AI Engineers',
    metaDescription:
      'SQL interview questions for AI, ML and data roles. Read the problem and write your own query.',
    h1: 'SQL interview questions for AI engineers',
    schemaName: 'SQL interview questions for AI and data engineering roles',
  },
};

/** generateMetadata for /problems, /problems/ai, /problems/hr and /problems/sql */
export async function categoryMetadata(category, searchParams) {
  const copy = COPY[category];
  const path = CATEGORIES[category].path;
  const filters = parseFilters(await searchParams);
  if (hasActiveFilters(filters)) {
    return buildMetadata({ title: copy.metaTitle, description: copy.metaDescription, path, noindex: true });
  }
  const page = filters.page;
  return buildMetadata({
    title: page > 1 ? `${copy.metaTitle} (Page ${page})` : copy.metaTitle,
    description: copy.metaDescription,
    path: page > 1 ? `${path}?page=${page}` : path,
  });
}

/** The full list page for one category: sidebar shell + pace/saved row + stats + filters + list. */
export default async function CategoryPage({ category, searchParams }) {
  const copy = COPY[category];
  const cat = CATEGORIES[category];
  const filters = parseFilters(await searchParams);
  const user = await getOrCreateUser();
  const [stats, ads, counts] = await Promise.all([
    getUserStats(user?.id ?? null, category),
    getLiveAds(), // the sponsor banners show on every category (AI/ML, HR and SQL)
    getCategoryCounts(),
  ]);
  const params = {};
  const result = { items: [], page: 1, total: stats.total };

  const jsonLd = graph(
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Problems', path: '/problems' },
      ...(category !== 'ai' ? [{ name: cat.label.trim(), path: cat.path }] : []),
    ]),
    collectionPageJsonLd({
      name: copy.schemaName,
      description: copy.metaDescription,
      path: cat.path,
      problems: result.items,
      startAt: (result.page - 1) * result.items.length + 1,
    }),
  );

  const navItems = ['ai', 'hr', 'sql'].map((key) => ({
    key,
    label: CATEGORIES[key].label,
    href: CATEGORIES[key].path,
    count: counts[key],
    description: CATEGORIES[key].description,
  }));

  return (
    <ProblemsShell items={navItems} params={params}>
      <JsonLd data={jsonLd} />

      {/* Not shown on screen, but kept so the page still has its H1 for search engines and screen readers */}
      <h1 className="sr-only">{copy.h1}</h1>

      {/* Pace planner with the Saved shortcut beside it */}
      <div className="flex items-stretch gap-2.5">
        <div className="min-w-0 flex-1">
          <PacePlanner remaining={Math.max(0, stats.total - stats.solved)} total={stats.total} signedIn={Boolean(user)} />
        </div>
        {user && (
          <Link
            href="/dashboard#saved"
            aria-label="Saved for later"
            title="Saved for later"
            className="flex w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-sm font-medium transition-colors hover:border-muted sm:w-auto sm:gap-2 sm:px-4"
          >
            <Bookmark width={18} height={18} />
            <span className="hidden sm:inline">Saved for later</span>
          </Link>
        )}
      </div>

      <section aria-label="Your stats" className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 md:grid-cols-[2fr_3fr]">
        <ProgressCard stats={stats} signedIn={Boolean(user)} />
        <PromoSection ads={ads} />
      </section>

      <div className="mt-6 sm:mt-8">
        <DocQuestionList category={category} userId={user?.id ?? null} admin={isAdmin(user)} />
      </div>
    </ProblemsShell>
  );
}