'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Book, ChevronLeft, ChevronRight, Database, Users } from './icons';

const KEY = 'buncho-problems-nav';
const ICONS = { ai: Book, hr: Users, sql: Database };

/**
 * Two-column shell for the question library.
 * Left (about 20%): the question types, AI problems, HR questions and SQL questions. It can be collapsed to a thin icon rail
 * and expanded again; the choice is remembered in this browser.
 * Right: the list for the selected type (children).
 * Below the lg breakpoint the left column becomes a segmented switch above the list.
 *
 * items: [{ key, label, href, count, description }]
 */
export default function ProblemsShell({ items, children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const activeRef = useRef(null); // the active pill in the phone switch

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') setCollapsed(true);
    } catch {}
  }, []);

  // Keep the active pill visible when the row is wider than the screen
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [pathname]);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }

  // AI problems live at /problems (and /problems/ai); HR questions at /problems/hr; SQL questions at /problems/sql
  const under = (base) => pathname === base || pathname.startsWith(`${base}/`);
  const section = under('/problems/hr') ? 'hr' : under('/problems/sql') ? 'sql' : 'ai';
  const isOn = (it) => it.key === section;

  return (
    <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 px-4 pb-16 pt-4 sm:px-6 sm:pt-6 lg:flex-row lg:gap-5">
      {/* Mobile and tablet: scrollable pills. Every item keeps its full label, so more links can be added later
          and the row just scrolls sideways instead of squeezing them. The active pill scrolls into view. */}
      <div className="relative -mx-4 sm:-mx-6 lg:hidden">
        <nav
          aria-label="Question type"
          className="no-scrollbar flex snap-x gap-2 overflow-x-auto scroll-smooth px-4 py-1 sm:px-6"
        >
          {items.map((it) => {
            const on = isOn(it);
            const Icon = ICONS[it.key] ?? Book;
            return (
              <Link
                key={it.key}
                ref={on ? activeRef : undefined}
                href={it.href}
                aria-current={on ? 'page' : undefined}
                className={`flex h-11 shrink-0 snap-start items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors active:scale-[0.97] ${
                  on
                    ? 'border-accent/50 bg-accent-soft text-ink shadow-sm'
                    : 'border-line bg-surface text-muted hover:border-muted hover:text-ink'
                }`}
              >
                <Icon width={16} height={16} className={`shrink-0 ${on ? 'text-accent' : ''}`} />
                <span className="whitespace-nowrap">{it.label.trim()}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.7rem] font-semibold tabular-nums ${
                    on ? 'bg-accent/15 text-accent' : 'bg-line/60 text-muted'
                  }`}
                >
                  {it.count}
                </span>
              </Link>
            );
          })}
          {/* Spacer so the last pill can scroll clear of the edge fade */}
          <span aria-hidden="true" className="w-4 shrink-0" />
        </nav>
        {/* Soft fade on the right edge hints that the row scrolls */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-canvas to-transparent" />
      </div>

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