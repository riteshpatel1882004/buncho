import SideLink from './SideLink';
import { Book, Database, Grid, Tag, Bookmark, Users } from './icons';

// Three-column shell used by topic pages:
// left navigation, main content, optional right rail (progress, streak).
export default function LibraryLayout({ topics = [], rail, children }) {
  return (
    <div className="mx-auto flex w-full max-w-[96rem] gap-5 px-4 py-4">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-[4.5rem] max-h-[calc(100dvh-5.5rem)] space-y-4 overflow-y-auto pr-1">
          <nav aria-label="Library" className="panel space-y-1 p-2">
            <SideLink href="/problems" exact icon={<Book width={18} height={18} />}>AI/ML problems</SideLink>
            <SideLink href="/problems/hr" icon={<Users width={18} height={18} />}>HR questions</SideLink>
            <SideLink href="/problems/sql" icon={<Database width={18} height={18} />}>SQL questions</SideLink>
            <SideLink href="/dashboard" icon={<Grid width={18} height={18} />}>Dashboard</SideLink>
            <SideLink href="/dashboard#saved" exact icon={<Bookmark width={18} height={18} />}>Saved for later</SideLink>
          </nav>

          {topics.length > 0 && (
            <nav aria-label="Topics" className="panel p-2">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">Topics</p>
              <div className="space-y-0.5">
                {topics.map((t) => (
                  <SideLink key={t.id} href={`/topics/${t.slug}`} count={t._count.problems} icon={<Tag width={16} height={16} />}>
                    {t.name}
                  </SideLink>
                ))}
              </div>
            </nav>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>

      {rail && (
        <aside className="hidden w-80 shrink-0 xl:block">
          <div className="sticky top-[4.5rem] space-y-4">{rail}</div>
        </aside>
      )}
    </div>
  );
}