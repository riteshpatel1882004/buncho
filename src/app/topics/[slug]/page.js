// import { Suspense } from 'react';
// import { notFound } from 'next/navigation';
// import { prisma } from '@/lib/prisma';
// import LibraryLayout from '@/components/LibraryLayout';
// import ProblemFilters from '@/components/ProblemFilters';
// import ProblemList from '@/components/ProblemList';
// import ActivityGrid from '@/components/ActivityGrid';
// import { ContinueCard, StatsCard } from '@/components/StatsCard';
// import { getProblems, getProgressMap, getTopics, getUserStats, parseFilters } from '@/lib/problems';
// import { getOrCreateUser } from '@/lib/user';
// import { getIsPro } from '@/lib/subscription';
// import JsonLd from '@/components/JsonLd';
// import { buildMetadata, collectionPageJsonLd, breadcrumbJsonLd, graph, hasActiveFilters, plainText, truncate } from '@/lib/seo';

// export async function generateMetadata({ params, searchParams }) {
//   const { slug } = await params;
//   const topic = await prisma.topic.findUnique({
//     where: { slug },
//     select: { name: true, description: true, _count: { select: { problems: { where: { published: true } } } } },
//   });
//   if (!topic) return { title: 'Topic not found', robots: { index: false, follow: false } };

//   const filters = parseFilters(await searchParams);
//   const n = topic._count.problems;
//   const intro = topic.description ? `${plainText(topic.description).replace(/[.\s]+$/, '')}. ` : '';
//   const description = truncate(
//     `${intro}${n} ${topic.name} interview ${n === 1 ? 'question' : 'questions'} with AI feedback and reference solutions. Answer out loud or in writing.`,
//     158,
//   );
//   const base = `/topics/${slug}`;

//   if (hasActiveFilters(filters, { ignoreTopic: true })) {
//     return buildMetadata({ title: `${topic.name} Interview Questions`, description, path: base, noindex: true });
//   }
//   return buildMetadata({
//     title: filters.page > 1 ? `${topic.name} Interview Questions (Page ${filters.page})` : `${topic.name} Interview Questions`,
//     description,
//     path: filters.page > 1 ? `${base}?page=${filters.page}` : base,
//     image: `${base}/opengraph-image`,
//     imageAlt: `${topic.name} interview questions on Buncho`,
//   });
// }

// export default async function TopicPage({ params, searchParams }) {
//   const { slug } = await params;
//   const topic = await prisma.topic.findUnique({ where: { slug } });
//   if (!topic) notFound();

//   const filters = { ...parseFilters(await searchParams), topic: slug };
//   const user = await getOrCreateUser();
//   const pro = user ? await getIsPro(user.id) : false;
//   const [allTopics, result, stats] = await Promise.all([getTopics(), getProblems({ ...filters, pro, userId: user?.id ?? null }), getUserStats(user?.id ?? null)]);
//   const statusMap = user ? await getProgressMap(user.id, result.items.map((p) => p.id)) : {};

//   const { page, topic: _t, ...rest } = filters;
//   const queryParams = Object.fromEntries(Object.entries(rest).filter(([, v]) => v));

//   const rail = (
//     <>
//       <StatsCard stats={stats} signedIn={Boolean(user)} />
//       <ContinueCard stats={stats} />
//       {user && <ActivityGrid stats={stats} />}
//     </>
//   );

//   const jsonLd = graph(
//     breadcrumbJsonLd([
//       { name: 'Home', path: '/' },
//       { name: 'Problems', path: '/problems' },
//       { name: topic.name, path: `/topics/${slug}` },
//     ]),
//     collectionPageJsonLd({
//       name: `${topic.name} interview questions`,
//       description: topic.description ? plainText(topic.description) : `${topic.name} interview questions`,
//       path: `/topics/${slug}`,
//       problems: result.items,
//       startAt: (result.page - 1) * result.items.length + 1,
//     }),
//   );

//   return (
//     <LibraryLayout topics={allTopics} rail={rail}>
//       <JsonLd data={jsonLd} />
//       <div className="space-y-5">
//         <header className="panel p-5">
//           <p className="text-xs font-semibold uppercase tracking-wide text-accent">Topic</p>
//           <h1 className="mt-1 text-2xl font-semibold tracking-tight">{topic.name} interview questions</h1>
//           {topic.description && <p className="mt-1 max-w-2xl text-sm text-muted">{topic.description}</p>}
//         </header>

//         <Suspense fallback={null}>
//           <ProblemFilters topics={allTopics} currentTopic={slug} signedIn={Boolean(user)} total={result.total} />
//         </Suspense>

//         <ProblemList result={result} statusMap={statusMap} basePath={`/topics/${slug}`} params={queryParams} pro={pro} />
//       </div>
//     </LibraryLayout>
//   );
// }


import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import LibraryLayout from '@/components/LibraryLayout';
import ProblemFilters from '@/components/ProblemFilters';
import ProblemList from '@/components/ProblemList';
import ActivityGrid from '@/components/ActivityGrid';
import { ContinueCard, StatsCard } from '@/components/StatsCard';
import { isHrTopic, isSqlTopic } from '@/lib/categories';
import { getProblems, getProgressMap, getTopics, getUserStats, parseFilters } from '@/lib/problems';
import { getOrCreateUser } from '@/lib/user';
import { getIsPro } from '@/lib/subscription';
import JsonLd from '@/components/JsonLd';
import { buildMetadata, collectionPageJsonLd, breadcrumbJsonLd, graph, hasActiveFilters, plainText, truncate } from '@/lib/seo';

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const topic = await prisma.topic.findUnique({
    where: { slug },
    select: { name: true, description: true, _count: { select: { problems: { where: { published: true } } } } },
  });
  if (!topic) return { title: 'Topic not found', robots: { index: false, follow: false } };

  const filters = parseFilters(await searchParams);
  const n = topic._count.problems;
  const intro = topic.description ? `${plainText(topic.description).replace(/[.\s]+$/, '')}. ` : '';
  const description = truncate(
    `${intro}${n} ${topic.name} interview ${n === 1 ? 'question' : 'questions'} with AI feedback and reference solutions. Answer out loud or in writing.`,
    158,
  );
  const base = `/topics/${slug}`;

  if (hasActiveFilters(filters, { ignoreTopic: true })) {
    return buildMetadata({ title: `${topic.name} Interview Questions`, description, path: base, noindex: true });
  }
  return buildMetadata({
    title: filters.page > 1 ? `${topic.name} Interview Questions (Page ${filters.page})` : `${topic.name} Interview Questions`,
    description,
    path: filters.page > 1 ? `${base}?page=${filters.page}` : base,
    image: `${base}/opengraph-image`,
    imageAlt: `${topic.name} interview questions on Buncho`,
  });
}

export default async function TopicPage({ params, searchParams }) {
  const { slug } = await params;
  const topic = await prisma.topic.findUnique({ where: { slug } });
  if (!topic) notFound();
  // HR questions have their own list under /problems/hr
  if (isHrTopic(slug)) redirect('/problems/hr');
  // SQL questions have their own list under /problems/sql
  if (isSqlTopic(slug)) redirect('/problems/sql');

  const filters = { ...parseFilters(await searchParams), topic: slug };
  const user = await getOrCreateUser();
  const pro = user ? await getIsPro(user.id) : false;
  const [allTopics, result, stats] = await Promise.all([getTopics(), getProblems({ ...filters, pro, userId: user?.id ?? null }), getUserStats(user?.id ?? null)]);
  const statusMap = user ? await getProgressMap(user.id, result.items.map((p) => p.id)) : {};

  const { page, topic: _t, ...rest } = filters;
  const queryParams = Object.fromEntries(Object.entries(rest).filter(([, v]) => v));

  const rail = (
    <>
      <StatsCard stats={stats} signedIn={Boolean(user)} />
      <ContinueCard stats={stats} />
      {user && <ActivityGrid stats={stats} />}
    </>
  );

  const jsonLd = graph(
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Problems', path: '/problems' },
      { name: topic.name, path: `/topics/${slug}` },
    ]),
    collectionPageJsonLd({
      name: `${topic.name} interview questions`,
      description: topic.description ? plainText(topic.description) : `${topic.name} interview questions`,
      path: `/topics/${slug}`,
      problems: result.items,
      startAt: (result.page - 1) * result.items.length + 1,
    }),
  );

  return (
    <LibraryLayout topics={allTopics} rail={rail}>
      <JsonLd data={jsonLd} />
      <div className="space-y-5">
        <header className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Topic</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{topic.name} interview questions</h1>
          {topic.description && <p className="mt-1 max-w-2xl text-sm text-muted">{topic.description}</p>}
        </header>

        <Suspense fallback={null}>
          <ProblemFilters topics={allTopics} currentTopic={slug} signedIn={Boolean(user)} total={result.total} />
        </Suspense>

        <ProblemList result={result} statusMap={statusMap} basePath={`/topics/${slug}`} params={queryParams} pro={pro} />
      </div>
    </LibraryLayout>
  );
}