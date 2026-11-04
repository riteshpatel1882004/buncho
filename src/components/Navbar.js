import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import Logo from './Logo';
import NavLinks from './NavLinks';
import NavShell from './NavShell';
import ThemeToggle from './ThemeToggle';
import MobileMenu from './MobileMenu';
import MobileBottomNav from './MobileBottomNav';
import { ProBadge } from './ProBadge';
import { Search } from './icons';
import { getOrCreateUser } from '@/lib/user';
import { getIsPro } from '@/lib/subscription';
import { isAdmin } from '@/lib/admin';

export default async function Navbar() {
  const { userId } = await auth();
  const user = userId ? await getOrCreateUser() : null;
  const isPro = user ? await getIsPro(user.id) : false;
  const admin = Boolean(user) && isAdmin(user);

  const links = [
    { href: '/problems', label: 'Problems' },
    ...(userId
      ? [
          { href: '/jobs', label: 'Job prep' },
          { href: '/dashboard', label: 'Dashboard' },
        ]
      : []),
    { href: '/pricing', label: 'Pricing' },
    // Only admins ever get this link
    ...(admin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  // Phones: Problems, Dashboard, Pro and Account are in the bottom bar. The top hamburger holds the rest.
  const menuLinks = [
    { href: '/jobs', label: 'Job prep' },
    ...(admin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  // Used by the account sheet in the bottom bar
  const profile = userId ? { name: user?.name ?? null, email: user?.email ?? null, imageUrl: user?.imageUrl ?? null, username: user?.username ?? null } : null;
  const profileHref = user?.username ? `/user/${user.username}` : '/settings/profile';

  // Extra entries in the Clerk account menu (desktop)
  const profileMenu = (
    <UserButton.MenuItems>
      <UserButton.Link
        label={user?.username ? 'My public profile' : 'Claim your username'}
        href={profileHref}
        labelIcon={
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
          </svg>
        }
      />
    </UserButton.MenuItems>
  );

  // Pro members: a soft yellow tint that sits on the navbar colour (pale in light mode, faint gold in dark mode)
  const searchBox = isPro
    ? 'border border-amber-400/40 bg-amber-400/20 text-amber-950 placeholder:text-amber-900/60 focus:border-amber-500 focus:bg-amber-400/30 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-50 dark:placeholder:text-amber-200/60 dark:focus:border-amber-300/50 dark:focus:bg-amber-300/15'
    : 'bg-surface-2 placeholder:text-muted';
  const searchIcon = isPro ? 'text-amber-800 dark:text-amber-300' : 'text-muted';

  return (
    <>
      <NavShell premium={isPro}>
        <div className="flex h-full w-full items-center gap-2 px-3 sm:gap-4 sm:px-5">
          {/* Logo and PRO pill. On phones, if space runs out this group is clipped, never the buttons on the right. */}
          <div className="flex min-w-0 items-center gap-2 max-md:overflow-hidden sm:gap-3">
            <Link
              href="/"
              aria-label="Buncho home"
              className="shrink-0 origin-left transition-transform duration-300 group-data-[compact=true]/nav:scale-90"
            >
              <Logo />
            </Link>
            {isPro && (
              // The wrapper (not the badge itself) controls visibility, so nothing can override it
              <span className="flex shrink-0 items-center max-[339px]:hidden">
                <ProBadge />
              </span>
            )}
          </div>

          <NavLinks links={links} />

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <form action="/problems" role="search" className="relative hidden lg:block">
              <label htmlFor="nav-search" className="sr-only">Search problems</label>
              <Search width={16} height={16} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${searchIcon}`} />
              <input
                id="nav-search"
                name="q"
                type="search"
                placeholder="Search problems"
                className={`h-9 w-52 rounded-full pl-9 pr-3 text-sm outline-none transition-[width,background-color,border-color] duration-300 group-data-[compact=true]/nav:h-8 group-data-[compact=true]/nav:w-40 ${searchBox}`}
              />
            </form>

            <ThemeToggle premium={isPro} />

            {userId ? (
              // Tablets and desktops only. On phones the profile is in the bottom bar.
              isPro ? (
                <span className="hidden place-items-center rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 p-[2px] shadow-sm shadow-amber-500/40 md:grid">
                  <UserButton>{profileMenu}</UserButton>
                </span>
              ) : (
                <span className="hidden md:block">
                  <UserButton>{profileMenu}</UserButton>
                </span>
              )
            ) : (
              <>
                <Link href="/login" className="hidden px-3 py-2 text-sm font-medium text-muted hover:text-ink sm:block">
                  Log in
                </Link>
                <Link href="/register" className="hidden rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-ink hover:opacity-90 md:block">
                  Sign up
                </Link>
              </>
            )}

            <MobileMenu links={menuLinks} premium={isPro} />
          </div>
        </div>
      </NavShell>
      <MobileBottomNav signedIn={Boolean(userId)} isPro={isPro} profile={profile} />
    </>
  );
}