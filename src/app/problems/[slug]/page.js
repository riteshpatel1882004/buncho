import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { problemHref } from '@/lib/categories';

// Questions now live inside the documents (/docs/<category>/<tab>#<question>). Old links to /problems/<slug>,
// /problems/hr/<slug> and /problems/sql/<slug> forward to the question's place in its document.
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: true } };

export default async function ProblemRedirect({ params }) {
  const { slug } = await params;
  const problem = await prisma.problem.findFirst({ where: { slug, published: true }, select: { slug: true, topic: { select: { slug: true } } } });
  if (!problem) notFound();
  redirect(problemHref(problem.slug, problem.topic.slug));
}