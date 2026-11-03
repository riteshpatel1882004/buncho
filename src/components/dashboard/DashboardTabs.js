'use client';

import { useEffect, useRef, useState } from 'react';

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
 * Desktop: left = (optional header cards) + menu with every section, right = content of the clicked section.
 *          The left column stays fixed (sticky) while the page scrolls; only the right column moves.
 *          Both columns are stretched to the same height.
 * Phone:   menu (summary + tile grid). Tapping a tile opens that section as a bottom-sheet popup.
 *
 * items: [{ id, label, icon, hint?, summary?, content }]  (content is server-rendered JSX from page.js)
 * top: header content (greeting, profile links)
 * mobileTop: phone-only summary card shown above the tiles
 * sidebarTop: desktop-only content shown in the left column ABOVE the Dashboard menu (when given, `top` is phone-only)
 * item.mobileOnly: (optional) item is only a phone tile / popup, hidden from the desktop menu and panels
 */
export default function DashboardTabs({ items, initial, top, mobileTop, sidebarTop }) {
  const [active, setActive] = useState(initial ?? items[0]?.id);
  const [popupOpen, setPopupOpen] = useState(false); // phone popup only, ignored on desktop
  const pushedRef = useRef(false); // true when opening the popup added a history entry

  // Follow the URL hash (/dashboard#saved) on load and on the browser/Android back button
  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.replace('#', '');
      if (id && items.some((i) => i.id === id)) {
        setActive(id);
        setPopupOpen(true);
      } else {
        setPopupOpen(false);
      }
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [items]);

  // Lock page scroll behind the popup (phones only) and close it with the Escape key
  useEffect(() => {
    if (!popupOpen) return undefined;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    const previous = document.body.style.overflow;
    if (!isDesktop) document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popupOpen]);

  function select(id) {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    setActive(id);
    setPopupOpen(true);
    try {
      if (isDesktop) {
        window.history.replaceState(null, '', `#${id}`);
      } else {
        // Phones get a history entry so the system back button closes the popup
        window.history.pushState(null, '', `#${id}`);
        pushedRef.current = true;
      }
    } catch {
      // Hash update is optional
    }
  }

  function close() {
    if (pushedRef.current) {
      // popstate listener above closes the popup
      pushedRef.current = false;
      window.history.back();
      return;
    }
    setPopupOpen(false);
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      // Hash update is optional
    }
  }

  const activeItem = items.find((i) => i.id === active) ?? items[0];

  return (
    <>
      <style>{`
        @keyframes dash-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes dash-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .dash-sheet { animation: dash-sheet-up 260ms cubic-bezier(0.22, 1, 0.36, 1); }
        .dash-backdrop { animation: dash-fade-in 200ms ease-out; }
        @media (min-width: 1024px) { .dash-sheet, .dash-backdrop { animation: none; } }
        @media (prefers-reduced-motion: reduce) { .dash-sheet, .dash-backdrop { animation: none; } }
      `}</style>

      {/* Header block: greeting, profile links, Pro banner (phones only when sidebarTop is used) */}
      <div className={sidebarTop ? 'lg:hidden' : ''}>{top}</div>

      {/* Phone-only summary card */}
      <div className="mt-5 lg:hidden">{mobileTop}</div>

      {/* items-stretch: the right column is as tall as the row (the taller of the two columns) */}
      <div className={`mt-5 grid gap-4 ${sidebarTop ? 'lg:mt-0' : 'lg:mt-8'} lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-stretch lg:gap-6 xl:grid-cols-[18.5rem_minmax(0,1fr)]`}>
        {/* LEFT COLUMN: sticky on desktop, so it stays in place while the page scrolls.
            If the screen is shorter than the column, it scrolls inside itself (scrollbar hidden). */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:-m-1 lg:flex lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:gap-4 lg:self-start lg:overflow-y-auto lg:p-1 lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
          {sidebarTop && <div className="hidden space-y-3 lg:block">{sidebarTop}</div>}

          <nav
            aria-label="Dashboard sections"
            className="min-w-0 lg:rounded-3xl lg:border lg:border-line lg:bg-surface lg:p-3 lg:shadow-sm"
          >
            {/* Phone: tile grid, each tile opens a popup */}
            <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted lg:hidden">Explore</p>
            <div className="grid grid-cols-2 gap-3 lg:hidden">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item.id)}
                  aria-label={item.label}
                  aria-haspopup="dialog"
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
              {items.filter((item) => !item.mobileOnly).map((item) => {
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
        </div>

        {/* RIGHT SECTION: content of the selected item.
            Desktop: a normal column that is as tall as the row (and scrolls with the page if its content is longer).
            Phone: the same element becomes a full-screen overlay with a bottom sheet. */}
        <div className={popupOpen ? 'fixed inset-0 z-50 flex items-end lg:static lg:z-auto lg:block lg:h-full' : 'hidden lg:block lg:h-full'}>
          {/* Phone: dimmed backdrop, tap to close */}
          <button
            type="button"
            onClick={close}
            aria-label="Close popup"
            tabIndex={-1}
            className="dash-backdrop absolute inset-0 cursor-default bg-black/55 backdrop-blur-[2px] lg:hidden"
          />

          <div className="dash-sheet relative flex max-h-[88vh] w-full min-w-0 flex-col overflow-hidden rounded-t-3xl border-t border-line bg-bg shadow-2xl lg:h-full lg:max-h-none lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none">
            {/* Phone: grab handle + title + close */}
            <div className="shrink-0 border-b border-line px-4 pb-3 pt-2.5 lg:hidden">
              <span aria-hidden="true" className="mx-auto mb-2.5 block h-1.5 w-10 rounded-full bg-line" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TONES[activeItem?.icon] ?? 'bg-accent-soft text-accent'}`}>
                    <Icon name={activeItem?.icon} />
                  </span>
                  <h2 className="truncate text-base font-semibold tracking-tight">{activeItem?.label}</h2>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink transition active:scale-95"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Panels stay mounted (keeps chart range, calendar month etc.); only the active one is visible */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-8 pt-4 lg:h-full lg:overflow-visible lg:p-0">
              {items.map((item) => (
                <div
                  key={item.id}
                  id={`panel-${item.id}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${item.id}`}
                  hidden={item.id !== active}
                  className={`min-w-0 lg:h-full ${item.mobileOnly ? 'lg:hidden' : ''}`}
                >
                  {item.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}