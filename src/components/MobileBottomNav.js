'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { Code, Grid } from './icons';
import { ProBadge } from './ProBadge';

const ICON = { width: 22, height: 22 };
const sheetRow = 'block w-full rounded-xl px-3 py-3 text-left text-base font-medium hover:bg-surface-2';

function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

// Phone-only bottom navigation bar (hidden from the md breakpoint up, where the top navbar links take over).
// Tabs: Problems, Dashboard, Pro (gold badge), Account.
// signedIn / isPro come from the server navbar. profile: { name, email, imageUrl } or null.
// profile.username (optional) adds a "Public profile" row to the account sheet.
export default function MobileBottomNav({ signedIn = false, isPro = false, profile = null }) {
  const pathname = usePathname();
  const { openUserProfile, signOut } = useClerk();
  const [open, setOpen] = useState(false);

  // Close the account sheet after any navigation, and on Escape
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isOn = (href, match = []) => [href, ...match].some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const activeColor = isPro ? 'text-amber-700 dark:text-amber-300' : 'text-accent';
  const tabBase = 'relative flex flex-1 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium leading-4 transition-colors active:bg-surface-2/60';
  const slot = 'grid h-6 w-full place-items-center';
  const barLook = isPro
    ? 'border-amber-400/50 bg-gradient-to-r from-amber-50/95 via-yellow-100/95 to-amber-50/95 dark:border-amber-400/40 dark:from-[#2b210a]/95 dark:via-[#3b2d08]/95 dark:to-[#2b210a]/95'
    : 'border-line bg-surface/95';
  const indicator = <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-current" />;

  const problemsOn = isOn('/problems', ['/topics']);
  const dashboardOn = isOn('/dashboard');
  const proOn = isOn('/pricing');
  const accountOn = open;

  return (
    <>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
          />
          <div
            id="mobile-account-sheet"
            role="dialog"
            aria-label="Account"
            style={{ bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
            className="fixed inset-x-3 z-[45] rounded-3xl border border-line bg-surface p-3 shadow-2xl md:hidden"
          >
            {signedIn ? (
              <>
                <div className="flex items-center gap-3 border-b border-line px-2 pb-3 pt-1">
                  <span className={`shrink-0 ${isPro ? 'rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 p-[2px]' : ''}`}>
                    {profile?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.imageUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-base font-semibold text-accent">
                        {(profile?.name ?? profile?.email ?? '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold leading-tight">{profile?.name ?? 'Your account'}</p>
                    {profile?.email && <p className="truncate text-xs text-muted">{profile.email}</p>}
                  </div>
                </div>
                <ul className="pt-2">
                  <li>
                    <Link href={profile?.username ? `/user/${profile.username}` : '/settings/profile'} className={sheetRow}>
                      {profile?.username ? 'My public profile' : 'Claim your username'}
                    </Link>
                  </li>
                  {profile?.username && (
                    <li>
                      <Link href="/settings/profile" className={sheetRow}>
                        Edit profile
                      </Link>
                    </li>
                  )}
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        openUserProfile();
                      }}
                      className={sheetRow}
                    >
                      Manage account
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => signOut({ redirectUrl: '/' })} className={`${sheetRow} text-muted`}>
                      Sign out
                    </button>
                  </li>
                </ul>
              </>
            ) : (
              <div className="space-y-2 p-1">
                <p className="px-2 pt-1 text-sm text-muted">Log in to save progress, get AI feedback and track your streak.</p>
                <Link href="/login" className="flex h-11 items-center justify-center rounded-xl border border-line text-base font-semibold hover:bg-surface-2">
                  Log in
                </Link>
                <Link href="/register" className="flex h-11 items-center justify-center rounded-xl bg-accent text-base font-semibold text-accent-ink hover:opacity-90">
                  Create free account
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      <nav
        aria-label="Primary"
        className={`fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] md:hidden ${barLook}`}
      >
        <div className="flex h-[var(--bottom-nav-h)] items-stretch">
          {/* 1. Problems */}
          <Link href="/problems" aria-current={problemsOn ? 'page' : undefined} className={`${tabBase} ${problemsOn ? activeColor : 'text-muted'}`}>
            {problemsOn && indicator}
            <span className={slot}><Code {...ICON} /></span>
            <span>Problems</span>
          </Link>

          {/* 2. Dashboard (visitors who are not logged in are sent to the login page) */}
          <Link href="/dashboard" aria-current={dashboardOn ? 'page' : undefined} className={`${tabBase} ${dashboardOn ? activeColor : 'text-muted'}`}>
            {dashboardOn && indicator}
            <span className={slot}><Grid {...ICON} /></span>
            <span>Dashboard</span>
          </Link>

          {/* 3. Pro: the gold PRO pill, same as the navbar badge, with a label like the other tabs */}
          <Link href="/pricing" aria-current={proOn ? 'page' : undefined} className={`${tabBase} ${proOn ? activeColor : 'text-muted'}`}>
            {proOn && indicator}
            <span className={slot}>
              <ProBadge className={proOn ? 'ring-2 ring-amber-500/60' : ''} />
            </span>
            <span>Buncho Pro</span>
          </Link>

          {/* 4. Account */}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-account-sheet"
            onClick={() => setOpen((v) => !v)}
            className={`${tabBase} ${accountOn ? activeColor : 'text-muted'}`}
          >
            {accountOn && indicator}
            <span className={slot}>
              {signedIn && profile?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.imageUrl} alt="" width={24} height={24} className={`h-6 w-6 rounded-full object-cover ${accountOn ? 'ring-2 ring-current' : ''}`} />
              ) : (
                <UserIcon {...ICON} />
              )}
            </span>
            <span>{signedIn ? 'Account' : 'Log in'}</span>
          </button>
        </div>
      </nav>
    </>
  );
}