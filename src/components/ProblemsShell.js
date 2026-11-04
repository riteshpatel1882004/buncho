'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Book, Check, ChevronLeft, ChevronRight, Database, Lock, Search, Tag, Users } from './icons';
import { ProBadge } from './ProBadge';

const KEY = 'buncho-problems-nav';
const WIDTH_KEY = 'buncho-problems-nav-width';
const MIN_WIDTH = 200; // px, narrowest the sidebar can be dragged
const MAX_WIDTH = 420; // px, widest
const DEFAULT_WIDTH = 256; // px
const clampWidth = (w) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));
const ICONS = { ai: Book, hr: Users, sql: Database };

/**
 * Two-column shell for the question library.
 * Left: the question types, AI problems, HR questions and SQL questions. The user can drag its right edge to make it narrower
 * or wider (double-click the edge to reset), or collapse it to a thin icon rail with the arrow button. Both choices are
 * remembered in this browser.
 * Right: the list for the selected type (children).
 * Below the lg breakpoint the left column becomes a segmented switch above the list.
 *
 * Below the question types (expanded sidebar only) there is a "Filter by company" list: each company with the number of
 * questions it has asked in this category. Picking one adds ?company=<name> to the URL, so the list, pagination and the
 * existing filters keep working. Company data is a Pro insight, so free users see a locked card instead.
 *
 * items: [{ key, label, href, count, description }]
 * companies: [{ name, count }] (most questions first), companyLocked: show the Pro lock instead of the list,
 * params: the active filters from the URL (used to keep them when a company is picked)
 */
const COMPANIES_COLLAPSED = 8; // companies shown before "Show more"

function CompanyFilter({ companies, locked, params, pathname }) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const active = params?.company || '';

  // Link that keeps the other filters, swaps the company and goes back to page 1
  const hrefFor = (name) => {
    const sp = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v && k !== 'company' && k !== 'page') sp.set(k, String(v));
    });
    if (name) sp.set('company', name);
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  if (locked) {
    return (
      <div className="mt-2 border-t border-line pt-3">
        <Link
          href="/pricing"
          className="flex items-center gap-3 rounded-lg border border-dashed border-line bg-surface-2/50 px-3 py-2.5 text-sm transition-colors hover:border-accent"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <Lock width={16} height={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 font-semibold">
              Filter by company <ProBadge />
            </span>
            <span className="block text-xs font-normal text-muted">See which companies asked what.</span>
          </span>
        </Link>
      </div>
    );
  }

  // A company typed into the URL that is not in this category still shows up, so it can be cleared
  const list = active && !companies.some((c) => c.name === active) ? [{ name: active, count: 0 }, ...companies] : companies;
  if (!list.length) return null;

  const q = query.trim().toLowerCase();
  const matches = q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
  const visible = q || showAll ? matches : matches.slice(0, COMPANIES_COLLAPSED);
  const hidden = matches.length - visible.length;

  return (
    <div className="mt-2 flex min-h-0 flex-1 flex-col border-t border-line pt-3" role="group" aria-label="Filter by company">
      <div className="flex items-center justify-between pl-3 pr-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          <Tag width={13} height={13} /> Companies
        </p>
        {active && (
          <Link href={hrefFor('')} scroll={false} className="rounded-md px-2 py-1 text-xs font-semibold text-accent hover:underline">
            Clear
          </Link>
        )}
      </div>
      <p className="px-3 pb-1 pt-0.5 text-xs text-muted">Questions each company has asked</p>

      {list.length > COMPANIES_COLLAPSED && (
        <div className="relative mx-1 mb-1">
          <Search width={14} height={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies"
            aria-label="Search companies"
            className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
      )}

      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {visible.map((c) => {
          const on = c.name === active;
          return (
            <li key={c.name}>
              <Link
                href={hrefFor(on ? '' : c.name)}
                scroll={false}
                aria-current={on ? 'true' : undefined}
                title={`${c.name}: ${c.count} ${c.count === 1 ? 'question' : 'questions'}`}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  on ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                {on ? <Check width={14} height={14} className="shrink-0 text-accent" /> : null}
                <span className="shrink-0 text-xs tabular-nums text-muted">{c.count}</span>
              </Link>
            </li>
          );
        })}
        {q && matches.length === 0 && <li className="px-3 py-2 text-sm text-muted">No company matches.</li>}
      </ul>

      {hidden > 0 && (
        <button type="button" onClick={() => setShowAll(true)} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-accent hover:underline">
          Show {hidden} more
        </button>
      )}
      {showAll && !q && matches.length > COMPANIES_COLLAPSED && (
        <button type="button" onClick={() => setShowAll(false)} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted hover:text-ink">
          Show fewer
        </button>
      )}
    </div>
  );
}

export default function ProblemsShell({ items, companies = [], companyLocked = false, params = {}, children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [dragging, setDragging] = useState(false);
  const activeRef = useRef(null); // the active pill in the phone switch

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') setCollapsed(true);
      const saved = Number(localStorage.getItem(WIDTH_KEY));
      if (saved) setWidth(clampWidth(saved));
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

  // Drag the right edge to resize. Pointer events cover mouse, pen and touch; the width is saved when the drag ends.
  function startResize(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    let latest = startW;
    setDragging(true);
    const onMove = (ev) => {
      latest = clampWidth(startW + ev.clientX - startX);
      setWidth(latest);
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      try {
        localStorage.setItem(WIDTH_KEY, String(latest));
      } catch {}
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function resetWidth() {
    setWidth(DEFAULT_WIDTH);
    try {
      localStorage.removeItem(WIDTH_KEY);
    } catch {}
  }

  // Arrow keys resize too, so the handle works without a mouse
  function onHandleKey(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = clampWidth(width + (e.key === 'ArrowRight' ? 16 : -16));
    setWidth(next);
    try {
      localStorage.setItem(WIDTH_KEY, String(next));
    } catch {}
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

      {/* Desktop: sidebar the user can collapse or drag to any width between MIN_WIDTH and MAX_WIDTH */}
      <aside
        aria-label="Question types"
        style={{ width: collapsed ? 48 : width }}
        className={`relative hidden shrink-0 lg:block ${dragging ? '' : 'transition-[width] duration-200'}`}
      >
        <div className="panel sticky top-[4.5rem] flex max-h-[calc(100dvh-5.5rem)] flex-col overflow-y-auto p-2">
          <div className={`flex shrink-0 items-center ${collapsed ? 'justify-center' : 'justify-between pl-3'}`}>
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

          <nav className="mt-1 shrink-0 space-y-1">
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

          {!collapsed && <CompanyFilter companies={companies} locked={companyLocked} params={params} pathname={pathname} />}
        </div>

        {/* Drag handle on the right edge (only when expanded) */}
        {!collapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
            aria-valuenow={width}
            tabIndex={0}
            title="Drag to resize, double-click to reset"
            onPointerDown={startResize}
            onDoubleClick={resetWidth}
            onKeyDown={onHandleKey}
            className="group absolute -right-3 top-0 z-10 flex h-full w-3 cursor-col-resize touch-none justify-center outline-none"
          >
            <span className={`h-full w-0.5 rounded-full transition-colors group-hover:bg-accent/60 group-focus-visible:bg-accent ${dragging ? 'bg-accent' : 'bg-transparent'}`} />
          </div>
        )}
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}