import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getOrCreateUser } from '@/lib/user';
import { isAdmin } from '@/lib/admin';
import { CATEGORIES } from '@/lib/categories';
import { getTabs, getTabsForAdmin } from '@/lib/docs/store';
import DocTabs from '@/components/docs/DocTabs';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: true } };

// /docs/ai opens the first tab. With no tabs yet, admins can create the first one here.
export default async function DocCategoryPage({ params }) {
  const { category } = await params;
  if (!CATEGORIES[category]) notFound();

  const admin = isAdmin(await getOrCreateUser());
  const tabs = admin ? await getTabsForAdmin(category) : await getTabs(category);
  if (tabs.length) redirect(`/docs/${category}/${tabs[0].slug}`);

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside>
        <DocTabs category={category} tabs={[]} activeSlug={null} admin={admin} />
      </aside>
      <section>
        <h1 className="text-2xl font-bold">{CATEGORIES[category].title}</h1>
        <p className="mt-3 text-muted">
          {admin ? 'No topics yet. Use “New tab…” to create the first one, then write its questions as Heading 2s.' : 'Questions are coming soon.'}
        </p>
        <Link href={CATEGORIES[category].path} className="mt-4 inline-block text-sm text-accent hover:underline">Back to the list</Link>
      </section>
    </main>
  );
}