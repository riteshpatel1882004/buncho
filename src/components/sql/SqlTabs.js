'use client';

import { useState } from 'react';

// Segmented tab switch for the SQL question page: Description | Answers & Optimization.
// Both panes are rendered on the server and passed in, so switching tabs never refetches anything.
// tabs: [{ id, label, splitLabel?, icon, badge?, content, splitClassName? }]
//
// split: on large screens (lg and up) the tab bar is hidden and the panes sit side by side, question (tabs[0]) on the
// left and answers (tabs[1]) on the right. Each column has Minimize and Maximize buttons:
//   - Maximize one column -> the other shrinks to a slim rail you can click to bring it back.
//   - Minimize one column -> same thing, the other one gets the space.
//   - Restore -> both columns side by side again.
// Below lg it is the normal tab switch. splitClassName styles one pane in the side-by-side layout
// (the question pane uses it to stay in view while the answers scroll).

const GRID = {
  both: 'lg:grid-cols-2',
  left: 'lg:grid-cols-[minmax(0,1fr)_3rem]', // question maximized, answers minimized
  right: 'lg:grid-cols-[3rem_minmax(0,1fr)]', // answers maximized, question minimized
};

const iconProps = { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const MaximizeIcon = () => (
  <svg {...iconProps}>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);
const MinimizeIcon = () => (
  <svg {...iconProps}>
    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
  </svg>
);
const RestoreIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M12 4v16" />
  </svg>
);

const ctl = 'inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink';

export default function SqlTabs({ tabs, initial, split = false }) {
  const [active, setActive] = useState(initial ?? tabs[0].id);
  const [view, setView] = useState('both'); // 'both' or the id of the maximized column (large screens only)

  function onKeyDown(e) {
    const i = tabs.findIndex((t) => t.id === active);
    if (e.key === 'ArrowRight') setActive(tabs[(i + 1) % tabs.length].id);
    else if (e.key === 'ArrowLeft') setActive(tabs[(i - 1 + tabs.length) % tabs.length].id);
  }

  const mode = view === 'both' ? 'both' : view === tabs[0].id ? 'left' : 'right';

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

      <div className={split ? `lg:mt-4 lg:grid lg:items-start lg:gap-4 ${GRID[mode]}` : ''}>
        {tabs.map((t, i) => {
          const label = t.splitLabel ?? t.label;
          const other = tabs[i === 0 ? 1 : 0];
          const maximized = view === t.id;
          const minimized = split && view !== 'both' && !maximized;

          return (
            <div
              key={t.id}
              role="tabpanel"
              id={`sql-pane-${t.id}`}
              aria-labelledby={`sql-tab-${t.id}`}
              className={`mt-1 ${t.id === active ? '' : 'hidden'} ${split ? `min-w-0 lg:mt-0 lg:block ${t.splitClassName ?? ''}` : ''}`}
            >
              {/* Minimized: a slim rail that brings the column back */}
              {split && minimized && (
                <button
                  type="button"
                  onClick={() => setView('both')}
                  aria-label={`Show ${label} again`}
                  title={`Show ${label}`}
                  className="hidden min-h-48 w-full flex-col items-center gap-3 rounded-2xl border border-line bg-surface py-4 text-muted transition-colors hover:border-accent/50 hover:text-ink lg:flex"
                >
                  <RestoreIcon />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ writingMode: 'vertical-rl' }}>
                    {label}
                  </span>
                </button>
              )}

              {/* Column header with the minimize / maximize controls (large screens) */}
              {split && !minimized && (
                <div className="mb-2 hidden items-center justify-between gap-2 lg:flex">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</h2>
                  <div className="flex items-center gap-0.5">
                    {maximized ? (
                      <button type="button" onClick={() => setView('both')} className={ctl} aria-label={`Restore both columns`}>
                        <RestoreIcon /> Restore
                      </button>
                    ) : (
                      <>
                        <button type="button" onClick={() => setView(other.id)} className={ctl} aria-label={`Minimize ${label}`}>
                          <MinimizeIcon /> Minimize
                        </button>
                        <button type="button" onClick={() => setView(t.id)} className={ctl} aria-label={`Maximize ${label}`}>
                          <MaximizeIcon /> Maximize
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className={minimized ? 'lg:hidden' : ''}>{t.content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}