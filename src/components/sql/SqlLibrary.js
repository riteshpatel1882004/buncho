import { Suspense } from 'react';
import Link from 'next/link';
import ProblemFilters from '@/components/ProblemFilters';
import ProblemsShell from '@/components/ProblemsShell';
import { ProgressCard } from '@/components/ProblemStats';
import PromoSection from '@/components/PromoSection';
import JsonLd from '@/components/JsonLd';
import SqlCode from './SqlCode';
import SqlList from './SqlList';
import { getCategoryCounts, getProblems, getProgressMap, getUserStats, parseFilters } from '@/lib/problems';
import { CATEGORIES } from '@/lib/categories';
import { getOrCreateUser } from '@/lib/user';
import { getIsPro } from '@/lib/subscription';
import { getLiveAds } from '@/lib/ads';
import { Bookmark, Database } from '@/components/icons';
import { breadcrumbJsonLd, collectionPageJsonLd, graph } from '@/lib/seo';

const CATEGORY = 'sql';
const H1 = 'SQL interview questions for AI engineers';
const SCHEMA_NAME = 'SQL interview questions for AI and data engineering roles';
const SCHEMA_DESCRIPTION =
  'SQL interview questions for AI, ML and data roles. Read the problem, then see every possible answer from brute force to optimized.';

// Decorative snippet in the hero (not a real question)
const HERO_SQL = `-- 1. Make it correct
-- 2. Make it fast
SELECT approach, time_complexity
FROM   solutions
ORDER  BY time_complexity;`;

/**
 * /problems/sql. A fresh layout for SQL: hero banner, the shared progress card (streak included) + sponsor row,
 * filters, and a card list. The sidebar shell is the same as the other categories so people can still switch.
 */
export default async function SqlLibrary({ searchParams }) {
  const cat = CATEGORIES[CATEGORY];
  const filters = parseFilters(await searchParams);
  const user = await getOrCreateUser();
  const pro = user ? await getIsPro(user.id) : false;
  const [result, stats, ads, counts] = await Promise.all([
    getProblems({ ...filters, category: CATEGORY, pro, userId: user?.id ?? null }),
    getUserStats(user?.id ?? null, CATEGORY), // solved counts are SQL only; the streak is shared by every category
    getLiveAds(),
    getCategoryCounts(),
  ]);
  const statusMap = user ? await getProgressMap(user.id, result.items.map((p) => p.id)) : {};

  const { page, ...rest } = filters;
  const params = Object.fromEntries(Object.entries(rest).filter(([, v]) => v));

  const jsonLd = graph(
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Problems', path: '/problems' },
      { name: cat.label.trim(), path: cat.path },
    ]),
    collectionPageJsonLd({
      name: SCHEMA_NAME,
      description: SCHEMA_DESCRIPTION,
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
    <ProblemsShell items={navItems}>
      <JsonLd data={jsonLd} />
      <h1 className="sr-only">{H1}</h1>

      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="dot-grid" aria-hidden="true" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-28 -z-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="grid items-center gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              <Database width={14} height={14} /> SQL playbook
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Write the query. <span className="text-accent">Then make it fast.</span>
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
              Interview-style SQL for AI, ML and data roles. Every question lists each approach from brute force to optimized, with indexing and tuning notes.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
              <li className="rounded-full border border-line bg-surface px-3 py-1.5">{counts.sql} {counts.sql === 1 ? 'question' : 'questions'}</li>
              <li className="rounded-full border border-line bg-surface px-3 py-1.5">Brute force → Optimized</li>
              <li className="rounded-full border border-line bg-surface px-3 py-1.5">Copy-ready queries</li>
            </ul>
            {user && (
              <Link
                href="/dashboard#saved"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium transition-colors hover:border-muted"
              >
                <Bookmark width={16} height={16} /> Saved for later
              </Link>
            )}
          </div>
          <div className="hidden lg:block">
            <SqlCode code={HERO_SQL} label="interview.sql" copyable={false} />
          </div>
        </div>
      </section>

      {/* Progress (shared streak) + sponsors */}
      <section aria-label="Your stats" className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 md:grid-cols-[2fr_3fr]">
        <ProgressCard stats={stats} signedIn={Boolean(user)} />
        <PromoSection ads={ads} />
      </section>

      <div className="mt-6 sm:mt-8">
        <Suspense fallback={<div className="h-24" />}>
          <ProblemFilters
            topics={[]}
            category={CATEGORY}
            signedIn={Boolean(user)}
            solved={user ? stats.solved : null}
            total={user ? stats.total : result.total}
          />
        </Suspense>
      </div>

      <div className="mt-4">
        <SqlList result={result} statusMap={statusMap} basePath={cat.path} params={params} pro={pro} />
      </div>
    </ProblemsShell>
  );
}