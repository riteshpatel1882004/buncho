import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import Logo from './Logo';
import { ChevronRight } from './icons';

const COLUMNS = [
  {
    title: 'Practice',
    links: [
      { href: '/problems', label: 'All problems' },
      { href: '/problems?difficulty=EASY', label: 'Easy warm-ups' },
      { href: '/problems?difficulty=HARD', label: 'Hard challenges' },
      { href: '/problems?type=SYSTEM_DESIGN', label: 'System design' },
    ],
  },
  {
    title: 'Your space',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/dashboard#saved', label: 'Saved problems' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/report', label: 'Report a problem' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/register', label: 'Create free account' },
      { href: '/login', label: 'Log in' },
    ],
  },
];

export default async function Footer() {
  const { userId } = await auth();
  const year = new Date().getFullYear();
  // Logged-in users already have an account, so the Account column is only for visitors
  const columns = userId ? COLUMNS.filter((c) => c.title !== 'Account') : COLUMNS;
  return (
    <footer className="site-footer mt-6 border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-[96rem] px-4 pt-14">
        <div className={`grid gap-10 ${userId ? 'md:grid-cols-[1.5fr_repeat(2,1fr)]' : 'md:grid-cols-[1.5fr_repeat(3,1fr)]'}`}>
          <div>
            <Link href="/" aria-label="Buncho home" className="inline-block">
              <Logo />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Practice for AI, ML and GenAI engineering interviews. Answer out loud or in writing, every day.
            </p>
            <Link
              href="/problems"
              className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:opacity-90"
            >
              Start practicing <ChevronRight width={16} height={16} />
            </Link>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted transition-colors hover:text-accent">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-line py-6 text-sm text-muted sm:flex-row sm:items-center">
          <p>&copy; {year} Buncho. Built for engineers preparing for AI roles.</p>
          <a href="#main" className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-ink">
            Back to top <span aria-hidden="true">&uarr;</span>
          </a>
        </div>
      </div>
    </footer>
  );
}