import { Suspense } from 'react';
import ProblemFilters from '@/components/ProblemFilters';
import ProblemList from '@/components/ProblemList';
import { getProblems, getProgressMap, getTopics, parseFilters } from '@/lib/problems';
import { getOrCreateUser } from '@/lib/user';
import { getIsPro } from '@/lib/subscription';
import JsonLd from '@/components/JsonLd';
import { buildMetadata, collectionPageJsonLd, breadcrumbJsonLd, graph, hasActiveFilters } from '@/lib/seo';

const DESCRIPTION =
  'Realistic production AI incidents with logs and data. Diagnose the failure, explain your decisions step by step.';

export async function generateMetadata({ searchParams }) {
  const filters = parseFilters(await searchParams);
  if (hasActiveFilters(filters)) {
    return buildMetadata({ title: 'Production AI Engineering Challenges', description: DESCRIPTION, path: '/challenges', noindex: true });
  }
  return buildMetadata({
    title: filters.page > 1 ? `Production AI Engineering Challenges (Page ${filters.page})` : 'Production AI Engineering Challenges',
    description: DESCRIPTION,
    path: filters.page > 1 ? `/challenges?page=${filters.page}` : '/challenges',
  });
}

export default async function ChallengesPage({ searchParams }) {
  const filters = { ...parseFilters(await searchParams), challenge: true };
  const user = await getOrCreateUser();
  const pro = user ? await getIsPro(user.id) : false;
  const [topics, result] = await Promise.all([getTopics({ challenge: true }), getProblems({ ...filters, pro, userId: user?.id ?? null })]);
  const statusMap = user ? await getProgressMap(user.id, result.items.map((p) => p.id)) : {};

  const { page, challenge, ...rest } = filters;
  const params = Object.fromEntries(Object.entries(rest).filter(([, v]) => v));

  const jsonLd = graph(
    breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Challenges', path: '/challenges' }]),
    collectionPageJsonLd({
      name: 'Production AI engineering challenges',
      description: DESCRIPTION,
      path: '/challenges',
      problems: result.items,
      startAt: (result.page - 1) * result.items.length + 1,
    }),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <JsonLd data={jsonLd} />
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Production AI engineering</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Production AI engineering challenges</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Realistic incidents with logs and data. Diagnose the failure, explain your decisions step by step.
          These test practical reasoning, not memorisation.
        </p>
      </header>

      <div className="mt-8">
        <Suspense fallback={<div className="h-24" />}>
          <ProblemFilters topics={topics} signedIn={Boolean(user)} total={result.total} />
        </Suspense>
      </div>

      <div className="mt-4">
        <ProblemList result={result} statusMap={statusMap} basePath="/challenges" params={params} pro={pro} />
      </div>
    </div>
  );
}