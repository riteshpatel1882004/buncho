'use client';

import { useState } from 'react';

// Segmented tab switch for the SQL question page: Description | Answers & Optimization.
// Both panes are rendered on the server and passed in, so switching tabs never refetches anything.
// tabs: [{ id, label, icon, badge?, content, splitClassName? }]
// split: on large screens (lg and up) the tab bar is hidden and the panes sit side by side, question on the left and
// answers on the right. Below lg it is the normal tab switch. splitClassName styles one pane in that layout
// (the question pane uses it to stay in view while the answers scroll).
export default function SqlTabs({ tabs, initial, split = false }) {
  const [active, setActive] = useState(initial ?? tabs[0].id);

  function onKeyDown(e) {
    const i = tabs.findIndex((t) => t.id === active);
    if (e.key === 'ArrowRight') setActive(tabs[(i + 1) % tabs.length].id);
    else if (e.key === 'ArrowLeft') setActive(tabs[(i - 1 + tabs.length) % tabs.length].id);
  }

  return (
    <div>
      <div className={`sticky top-16 z-20 -mx-4 bg-canvas/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 ${split ? 'lg:hidden' : ''}`}>
        <div
          role="tablist"
          aria-label="Question sections"
          onKeyDown={onKeyDown}
          className="no-scrollbar inline-flex max-w-full overflow-x-auto rounded-xl border border-line bg-surface-2 p-1"
        >
          {tabs.map((t) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`sql-tab-${t.id}`}
                aria-selected={on}
                aria-controls={`sql-pane-${t.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(t.id)}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${
                  on ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                <span className={on ? 'text-accent' : ''}>{t.icon}</span>
                {t.label}
                {t.badge != null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[0.7rem] font-semibold tabular-nums ${
                      on ? 'bg-accent-soft text-accent' : 'bg-line/60 text-muted'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={split ? 'lg:mt-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6' : ''}>
        {tabs.map((t) => (
          <div
            key={t.id}
            role="tabpanel"
            id={`sql-pane-${t.id}`}
            aria-labelledby={`sql-tab-${t.id}`}
            className={`mt-1 ${t.id === active ? '' : 'hidden'} ${split ? `min-w-0 lg:mt-0 lg:block ${t.splitClassName ?? ''}` : ''}`}
          >
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}