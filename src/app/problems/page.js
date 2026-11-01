// import { Suspense } from 'react';
// import Link from 'next/link';
// import ProblemFilters from '@/components/ProblemFilters';
// import ProblemList from '@/components/ProblemList';
// import { ProgressCard } from '@/components/ProblemStats';
// import PromoSection from '@/components/PromoSection';
// import PacePlanner from '@/components/PacePlanner';
// import { getProblems, getProgressMap, getTopics, getUserStats, parseFilters } from '@/lib/problems';
// import { getOrCreateUser } from '@/lib/user';
// import { getIsPro } from '@/lib/subscription';
// import { getLiveAds } from '@/lib/ads';
// import { Bookmark } from '@/components/icons';
// import JsonLd from '@/components/JsonLd';
// import { buildMetadata, collectionPageJsonLd, breadcrumbJsonLd, graph, hasActiveFilters } from '@/lib/seo';
// import { ProBadge } from '@/components/ProBadge';

// const DESCRIPTION =
//   'Curated AI, ML and GenAI interview questions on LLMs, RAG, deep learning, MLOps and system design. Answer in your own words, then get AI feedback and a reference solution.';

// export async function generateMetadata({ searchParams }) {
//   const filters = parseFilters(await searchParams);
//   if (hasActiveFilters(filters)) {
//     // Search and filter combinations are thin duplicates of the main list
//     return buildMetadata({ title: 'AI & ML Interview Questions', description: DESCRIPTION, path: '/problems', noindex: true });
//   }
//   const page = filters.page;
//   return buildMetadata({
//     title: page > 1 ? `AI, ML & GenAI Interview Questions (Page ${page})` : 'AI, ML & GenAI Interview Questions',
//     description: DESCRIPTION,
//     path: page > 1 ? `/problems?page=${page}` : '/problems',
//   });
// }

// export default async function ProblemsPage({ searchParams }) {
//   const filters = parseFilters(await searchParams);
//   const user = await getOrCreateUser();
//   const pro = user ? await getIsPro(user.id) : false;
//   const [topics, result, stats, ads] = await Promise.all([
//     getTopics(),
//     getProblems({ ...filters, pro, userId: user?.id ?? null }),
//     getUserStats(user?.id ?? null),
//     getLiveAds(),
//   ]);
//   const statusMap = user ? await getProgressMap(user.id, result.items.map((p) => p.id)) : {};

//   const { page, ...rest } = filters;
//   const params = Object.fromEntries(Object.entries(rest).filter(([, v]) => v));

//   const jsonLd = graph(
//     breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Problems', path: '/problems' }]),
//     collectionPageJsonLd({
//       name: 'AI, ML and GenAI interview questions',
//       description: DESCRIPTION,
//       path: '/problems',
//       problems: result.items,
//       startAt: (result.page - 1) * result.items.length + 1,
//     }),
//   );

//   return (
//     <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
//       <JsonLd data={jsonLd} />
//       <header className="flex flex-wrap items-end justify-between gap-4">
//         <div>
//           <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
//             Practice library {pro && <ProBadge />}
//           </p>
//           <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">AI, ML and GenAI interview questions</h1>
//           <p className="mt-2 max-w-xl text-sm text-muted">
//             Curated AI, ML and GenAI interview questions. Answer in your own words, then get instant AI feedback.
//           </p>
//         </div>
//         {user && (
//           <Link
//             href="/dashboard#saved"
//             className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-muted"
//           >
//             <Bookmark width={16} height={16} /> Saved for later
//           </Link>
//         )}
//       </header>

//       <div className="mt-6">
//         <PacePlanner remaining={Math.max(0, stats.total - stats.solved)} total={stats.total} signedIn={Boolean(user)} />
//       </div>

//       <section aria-label="Your stats" className="mt-4 grid gap-4 md:grid-cols-[2fr_3fr]">
//         <ProgressCard stats={stats} signedIn={Boolean(user)} />
//         <PromoSection ads={ads} />
//       </section>

//       <div className="mt-8">
//         <Suspense fallback={<div className="h-24" />}>
//           <ProblemFilters topics={topics} signedIn={Boolean(user)} solved={user ? stats.solved : null} total={user ? stats.total : result.total} />
//         </Suspense>
//       </div>

//       <div className="mt-4">
//         <ProblemList result={result} statusMap={statusMap} basePath="/problems" params={params} pro={pro} />
//       </div>
//     </div>
//   );
// }


import CategoryPage, { categoryMetadata } from '@/components/CategoryPage';

export const generateMetadata = ({ searchParams }) => categoryMetadata('ai', searchParams);

export default function ProblemsPage({ searchParams }) {
  return <CategoryPage category="ai" searchParams={searchParams} />;
}