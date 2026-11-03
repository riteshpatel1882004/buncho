'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Close, Menu } from './icons';

const GOLD = 'border border-amber-400/40 bg-amber-400/20 text-amber-800 hover:bg-amber-400/30 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-300';

// Hamburger in the top navbar (phones only). Holds the pages that are not in the bottom bar, such as Job prep and Admin.
// links: [{ href, label }]
// premium: gold hamburger for Pro members
export default function MobileMenu({ links, premium = false }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  if (!links?.length) return null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className={`grid h-9 w-9 place-items-center rounded-full transition ${premium ? GOLD : 'bg-surface-2'}`}
      >
        {open ? <Close /> : <Menu />}
      </button>

      {open && (
        <nav
          id="mobile-nav"
          className="absolute inset-x-0 top-full mt-2 rounded-3xl border border-line bg-surface px-6 py-3 shadow-lg"
        >
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block py-3 text-lg font-medium">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}