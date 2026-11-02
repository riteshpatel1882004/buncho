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
  plan: (
    <>
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    </>
  ),
  share: (
    <>
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4M12 2v14" />
    </>
  ),
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] ?? ICONS.solved}
    </svg>
  );
}

/**
 * Two-section dashboard.
 * Left: a menu with every dashboard section. Right: the content of the section that was clicked.
 * items: [{ id, label, icon, summary?, content }]  (content is server-rendered JSX passed in from page.js)
 */
export default function DashboardTabs({ items, initial }) {
  const [active, setActive] = useState(initial ?? items[0]?.id);

  // Open the section named in the URL hash (e.g. /dashboard#saved) after load
  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    if (id && items.some((i) => i.id === id)) setActive(id);
  }, [items]);

  function select(id) {
    setActive(id);
    try {
      window.history.replaceState(null, '', `#${id}`);
    } catch {
      // Hash update is optional
    }
  }

  return (
    <div className="mt-5 grid gap-4 lg:mt-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[18.5rem_minmax(0,1fr)]">
      {/* LEFT SECTION: menu */}
      <nav
        aria-label="Dashboard sections"
        className="min-w-0 rounded-3xl border border-line bg-surface p-2 shadow-sm lg:sticky lg:top-24 lg:p-3"
      >
        <p className="hidden px-3 pb-2 pt-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted lg:block">
          Dashboard
        </p>
        <div role="tablist" aria-orientation="vertical" className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
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
                className={`group flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-2xl border px-3.5 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full lg:whitespace-normal lg:py-3 ${
                  on
                    ? 'border-accent/40 bg-accent-soft text-accent'
                    : 'border-transparent text-ink hover:bg-surface-2'
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
                    className={`hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums lg:inline ${
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

      {/* RIGHT SECTION: content of the selected item (all panels stay mounted, only the active one is visible) */}
      <div className="min-w-0">
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
  );
}