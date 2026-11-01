'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Book, ChevronLeft, ChevronRight, Users } from './icons';

const KEY = 'buncho-problems-nav';
const ICONS = { ai: Book, hr: Users };

/**
 * Two-column shell for the question library.
 * Left (about 20%): the question types, AI problems and HR questions. It can be collapsed to a thin icon rail
 * and expanded again; the choice is remembered in this browser.
 * Right: the list for the selected type (children).
 * Below the lg breakpoint the left column becomes a row of tabs above the list.
 *
 * items: [{ key, label, href, count, description }]
 */
export default function ProblemsShell({ items, children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') setCollapsed(true);
    } catch {}
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }

  // AI problems live at /problems (and /problems/ai); HR questions at /problems/hr
  const isOn = (it) =>
    it.key === 'hr' ? pathname === '/problems/hr' || pathname.startsWith('/problems/hr/') : !(pathname === '/problems/hr' || pathname.startsWith('/problems/hr/'));

  return (
    <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 px-4 pb-16 pt-6 sm:px-6 lg:flex-row lg:gap-5">
      {/* Mobile and tablet: tabs */}
      <nav aria-label="Question type" className="flex gap-2 lg:hidden">
        {items.map((it) => {
          const on = isOn(it);
          return (
            <Link
              key={it.key}
              href={it.href}
              aria-current={on ? 'page' : undefined}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                on ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-muted hover:border-muted hover:text-ink'
              }`}
            >
              {it.label}
              <span className={`ml-2 text-xs font-medium ${on ? 'opacity-80' : 'text-muted'}`}>{it.count}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop: collapsible sidebar, 20% wide when open */}
      <aside
        aria-label="Question types"
        className={`hidden shrink-0 transition-[width] duration-200 lg:block ${
          collapsed ? 'w-12' : 'w-[20%] min-w-[12.5rem] max-w-[17rem]'
        }`}
      >
        <div className="panel sticky top-[4.5rem] p-2">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between pl-3'}`}>
            {!collapsed && <p className="text-xs font-semibold uppercase tracking-wide text-muted">Question bank</p>}
            <button
              type="button"
              onClick={toggle}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand question types' : 'Collapse question types'}
              title={collapsed ? 'Expand' : 'Collapse'}
              className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {collapsed ? <ChevronRight width={16} height={16} /> : <ChevronLeft width={16} height={16} />}
            </button>
          </div>

          <nav className="mt-1 space-y-1">
            {items.map((it) => {
              const on = isOn(it);
              const Icon = ICONS[it.key] ?? Book;
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  aria-current={on ? 'page' : undefined}
                  title={collapsed ? `${it.label} (${it.count})` : undefined}
                  className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
                    collapsed ? 'h-10 justify-center' : 'gap-3 px-3 py-2.5'
                  } ${on ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}
                >
                  <Icon width={18} height={18} className={on ? 'text-accent' : ''} />
                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{it.label}</span>
                        <span className="block truncate text-xs font-normal text-muted">{it.description}</span>
                      </span>
                      <span className="text-xs text-muted">{it.count}</span>
                    </>
                  )}
                  {collapsed && <span className="sr-only">{it.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}