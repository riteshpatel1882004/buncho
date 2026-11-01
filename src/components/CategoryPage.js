import { Suspense } from 'react';
import Link from 'next/link';
import ProblemFilters from '@/components/ProblemFilters';
import ProblemList from '@/components/ProblemList';
import ProblemsShell from '@/components/ProblemsShell';
import { ProgressCard } from '@/components/ProblemStats';
import PromoSection from '@/components/PromoSection';
import PacePlanner from '@/components/PacePlanner';
import { getCategoryCounts, getProblems, getProgressMap, getTopics, getUserStats, parseFilters } from '@/lib/problems';
import { CATEGORIES } from '@/lib/categories';
import { getOrCreateUser } from '@/lib/user';
import { getIsPro } from '@/lib/subscription';
import { getLiveAds } from '@/lib/ads';
import { Bookmark } from '@/components/icons';
import JsonLd from '@/components/JsonLd';
import { buildMetadata, collectionPageJsonLd, breadcrumbJsonLd, graph, hasActiveFilters } from '@/lib/seo';

const COPY = {
  ai: {
    metaTitle: 'AI, ML & GenAI Interview Questions',
    metaDescription:
      'Curated AI, ML and GenAI interview questions on LLMs, RAG, deep learning, MLOps and system design. Answer in your own words, then get AI feedback and a reference solution.',
    h1: 'AI, ML and GenAI interview questions',
    schemaName: 'AI, ML and GenAI interview questions',
  },
  hr: {
    metaTitle: 'HR Interview Questions for AI Engineers',
    metaDescription:
      'Behavioural and HR interview questions for AI engineering roles, with an expert answer for each. Practise your own answer, then get AI feedback.',
    h1: 'HR interview questions for AI engineers',
    schemaName: 'HR interview questions for AI engineering roles',
  },
};

/** generateMetadata for /problems, /problems/ai and /problems/hr */
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
  const pro = user ? await getIsPro(user.id) : false;
  const [topics, result, stats, ads, counts] = await Promise.all([
    category === 'ai' ? getTopics({ category }) : [],
    getProblems({ ...filters, category, pro, userId: user?.id ?? null }),
    getUserStats(user?.id ?? null, category),
    category === 'ai' ? getLiveAds() : {},
    getCategoryCounts(),
  ]);
  const statusMap = user ? await getProgressMap(user.id, result.items.map((p) => p.id)) : {};

  const { page, ...rest } = filters;
  const params = Object.fromEntries(Object.entries(rest).filter(([, v]) => v));

  const jsonLd = graph(
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Problems', path: '/problems' },
      ...(category === 'hr' ? [{ name: cat.label, path: cat.path }] : []),
    ]),
    collectionPageJsonLd({
      name: copy.schemaName,
      description: copy.metaDescription,
      path: cat.path,
      problems: result.items,
      startAt: (result.page - 1) * result.items.length + 1,
    }),
  );

  const navItems = ['ai', 'hr'].map((key) => ({
    key,
    label: CATEGORIES[key].label,
    href: CATEGORIES[key].path,
    count: counts[key],
    description: CATEGORIES[key].description,
  }));

  return (
    <ProblemsShell items={navItems}>
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

      <section aria-label="Your stats" className={`mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 ${category === 'ai' ? 'md:grid-cols-[2fr_3fr]' : ''}`}>
        <ProgressCard stats={stats} signedIn={Boolean(user)} />
        {category === 'ai' && <PromoSection ads={ads} />}
      </section>

      <div className="mt-6 sm:mt-8">
        <Suspense fallback={<div className="h-24" />}>
          <ProblemFilters
            topics={topics}
            category={category}
            signedIn={Boolean(user)}
            solved={user ? stats.solved : null}
            total={user ? stats.total : result.total}
          />
        </Suspense>
      </div>

      <div className="mt-4">
        <ProblemList result={result} statusMap={statusMap} basePath={cat.path} params={params} pro={pro} category={category} />
      </div>
    </ProblemsShell>
  );
}