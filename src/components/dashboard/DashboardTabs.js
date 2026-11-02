'use client';

import { useEffect, useState } from 'react';

// Small inline icons so this file has no dependency on the shared icon set
const ICONS = {
  solved: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16 9.8" />
    </>
  ),
  streak: <path d="M12 3c1 3-2 4.5-2 7.5a2.5 2.5 0 0 0 5 0c0-1-.4-1.8-1-2.5 3 1.2 5 4 5 7a7 7 0 0 1-14 0c0-4 3-6 4-9.5.5.6 1.5 1.4 3-2.5z" />,
  activity: <path d="M3 17l5-6 4 4 8-10M3 21h18" />,
  jobs: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  saved: <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />,
  milestones: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14L7 21l5-3 5 3-1.5-7" />
    </>
  ),
  readiness: (
    <>
      <path d="M12 3a9 9 0 1 0 9 9" />
      <path d="M12 12l5-5M12 7v5h5" />
    </>
  ),
  plan: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  share: (
    <>
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4M12 2v14" />
    </>
  ),
};

// Colour of the icon chip on the phone tiles
const TONES = {
  solved: 'bg-emerald-500/12 text-emerald-500',
  streak: 'bg-orange-500/12 text-orange-500',
  activity: 'bg-sky-500/12 text-sky-500',
  jobs: 'bg-violet-500/12 text-violet-500',
  saved: 'bg-amber-500/12 text-amber-500',
  milestones: 'bg-pink-500/12 text-pink-500',
  readiness: 'bg-teal-500/12 text-teal-500',
  plan: 'bg-yellow-500/12 text-yellow-600',
  share: 'bg-indigo-500/12 text-indigo-500',
};

function Icon({ name, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] ?? ICONS.solved}
    </svg>
  );
}

/**
 * Two-section dashboard.
 *
 * Desktop: left = menu with every section, right = content of the clicked section.
 * Phone:   menu screen (summary + tile grid), tapping a tile opens that section full screen with a back button.
 *
 * items: [{ id, label, icon, hint?, summary?, content }]  (content is server-rendered JSX from page.js)
 * top: header content (shown on desktop always, on phones only on the menu screen)
 * mobileTop: phone-only summary card shown on the menu screen
 */
export default function DashboardTabs({ items, initial, top, mobileTop }) {
  const [active, setActive] = useState(initial ?? items[0]?.id);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Follow the URL hash (/dashboard#saved) on load and on the browser/Android back button
  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.replace('#', '');
      if (id && items.some((i) => i.id === id)) {
        setActive(id);
        setMobileOpen(true);
      } else {
        setMobileOpen(false);
      }
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [items]);

  function select(id) {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    setActive(id);
    setMobileOpen(true);
    try {
      // Phones get a history entry so the system back button returns to the menu
      window.history[isDesktop ? 'replaceState' : 'pushState'](null, '', `#${id}`);
    } catch {
      // Hash update is optional
    }
    if (!isDesktop) window.scrollTo({ top: 0 });
  }

  function back() {
    setMobileOpen(false);
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      // Hash update is optional
    }
    window.scrollTo({ top: 0 });
  }

  const activeItem = items.find((i) => i.id === active) ?? items[0];

  return (
    <>
      {/* Header block: always on desktop, only on the phone menu screen */}
      <div className={mobileOpen ? 'hidden lg:block' : ''}>{top}</div>

      {/* Phone-only summary card, only on the menu screen */}
      <div className={mobileOpen ? 'hidden' : 'mt-5 lg:hidden'}>{mobileTop}</div>

      <div className="mt-5 grid gap-4 lg:mt-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[18.5rem_minmax(0,1fr)]">
        {/* LEFT SECTION: menu */}
        <nav
          aria-label="Dashboard sections"
          className={`min-w-0 lg:sticky lg:top-24 lg:rounded-3xl lg:border lg:border-line lg:bg-surface lg:p-3 lg:shadow-sm ${
            mobileOpen ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Phone: tile grid */}
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted lg:hidden">Explore</p>
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => select(item.id)}
                aria-label={item.label}
                className="group flex min-h-[7.25rem] flex-col justify-between rounded-2xl border border-line bg-surface p-3.5 text-left shadow-sm transition active:scale-[0.97] [&:last-child:nth-child(odd)]:col-span-2"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${TONES[item.icon] ?? 'bg-accent-soft text-accent'}`}>
                    <Icon name={item.icon} size={20} />
                  </span>
                  {item.summary != null && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold tabular-nums text-ink">
                      {item.summary}
                    </span>
                  )}
                </span>
                <span className="mt-3 block">
                  <span className="block text-[0.95rem] font-semibold leading-tight tracking-tight">{item.label}</span>
                  {item.hint && <span className="mt-1 block text-xs text-muted">{item.hint}</span>}
                </span>
              </button>
            ))}
          </div>

          {/* Desktop: vertical menu */}
          <p className="hidden px-3 pb-2 pt-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted lg:block">
            Dashboard
          </p>
          <div role="tablist" aria-orientation="vertical" className="hidden lg:flex lg:flex-col lg:gap-1">
            {items.map((item) => {
              const on = item.id === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={on}
                  aria-controls={`panel-${item.id}`}
                  onClick={() => select(item.id)}
                  className={`group flex w-full items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left text-sm font-semibold transition-colors ${
                    on ? 'border-accent/40 bg-accent-soft text-accent' : 'border-transparent text-ink hover:bg-surface-2'
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${
                      on ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted group-hover:text-ink'
                    }`}
                  >
                    <Icon name={item.icon} />
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">{item.label}</span>
                  {item.summary != null && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        on ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-muted'
                      }`}
                    >
                      {item.summary}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* RIGHT SECTION: content of the selected item */}
        <div className={`min-w-0 ${mobileOpen ? 'block' : 'hidden lg:block'}`}>
          {/* Phone: back bar */}
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={back}
              aria-label="Back to dashboard"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface shadow-sm transition active:scale-95"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">Dashboard</p>
              <h2 className="truncate text-lg font-semibold leading-tight tracking-tight">{activeItem?.label}</h2>
            </div>
          </div>

          {/* All panels stay mounted (keeps chart range, calendar month etc.); only the active one is visible */}
          {items.map((item) => (
            <div
              key={item.id}
              id={`panel-${item.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${item.id}`}
              hidden={item.id !== active}
              className="min-w-0"
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}