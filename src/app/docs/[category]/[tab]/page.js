import Link from 'next/link';
import { notFound } from 'next/navigation';
import { generateHTML } from '@tiptap/html/server';
import { getOrCreateUser } from '@/lib/user';
import { isAdmin } from '@/lib/admin';
import { CATEGORIES, categoryOf } from '@/lib/categories';
import { getTab, getTabs, getTabsForAdmin, readSettings } from '@/lib/docs/store';
import { EMPTY_DOC, ensureHeadingIds, extractQuestions, isDoc } from '@/lib/docs/tree';
import { buildExtensions } from '@/lib/docs/extensions';
import DocTabs from '@/components/docs/DocTabs';
import DocEditor from '@/components/docs/DocEditor';
import DocLayout from '@/components/docs/DocLayout';
import { enhanceDocHtml } from '@/lib/docs/highlight';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { category, tab: slug } = await params;
  const tab = CATEGORIES[category] ? await getTab(slug) : null;
  if (!tab || categoryOf(slug) !== category) return {};
  return buildMetadata({
    title: `${tab.name} interview questions`,
    description: `${CATEGORIES[category].short} interview questions on ${tab.name}.`,
    path: `/docs/${category}/${slug}`,
  });
}

export default async function DocTabPage({ params }) {
  const { category, tab: slug } = await params;
  if (!CATEGORIES[category]) notFound();

  const [tab, user] = await Promise.all([getTab(slug), getOrCreateUser()]);
  if (!tab || categoryOf(slug) !== category) notFound();
  const admin = isAdmin(user);
  if (!admin && !isDoc(tab.content)) notFound();

  const tabs = admin ? await getTabsForAdmin(category) : await getTabs(category);
  const settings = readSettings(tab.settings);
  const doc = isDoc(tab.content) ? ensureHeadingIds(tab.content) : EMPTY_DOC;
  const count = extractQuestions(doc).length;
  const html = admin ? null : enhanceDocHtml(generateHTML(doc, buildExtensions()));

  return (
    <DocLayout
      wide={settings.wide}
      aside={
        <>
          <Link href={CATEGORIES[category].path} className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
            ← {CATEGORIES[category].label.trim()} questions
          </Link>
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted">Topics</p>
          <DocTabs category={category} tabs={tabs} activeSlug={slug} admin={admin} />
        </>
      }
    >
      <article className="min-w-0 pb-24">
        {admin ? (
          // key: switching tabs must start a fresh editor. The title row lives inside the editor so it can stay pinned with the toolbar.
          <DocEditor key={slug} slug={slug} title={tab.name} initialCount={count} initialContent={doc} initialSettings={settings} />
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="text-sm font-medium text-muted">
                {tab.name} <span className="font-normal">· {count} question{count === 1 ? '' : 's'}</span>
              </h1>
            </div>
            <div className={`doc doc-h-${settings.headingFont} doc-t-${settings.textFont}`} dangerouslySetInnerHTML={{ __html: html }} />
          </>
        )}
      </article>
    </DocLayout>
  );
}