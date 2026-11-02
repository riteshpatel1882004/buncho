'use client';

import { useRef, useState } from 'react';

// Segmented tab switch for the SQL question page: Description | Answers & Optimization.
// Both panes are rendered on the server and passed in, so switching tabs never refetches anything.
// tabs: [{ id, label, splitLabel?, icon, badge?, content }]
//
// split: on large screens (lg and up) the tab bar is hidden and the two panes sit in one
// horizontally scrollable row (scroll-snap). Each pane is ~65% wide, so you always see a peek
// of the other one. Scroll / swipe / drag left or right to move between the question and the answers,
// or use the arrow button in each column header to jump to the other pane.
// Each pane scrolls vertically on its own, so the question stays in view while you read the answers.
// Below lg it is the normal tab switch.

const iconProps = { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const ArrowLeftIcon = () => (
  <svg {...iconProps}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg {...iconProps}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const ctl = 'inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink';

export default function SqlTabs({ tabs, initial, split = false }) {
  const [active, setActive] = useState(initial ?? tabs[0].id);
  const scrollerRef = useRef(null);
  const paneRefs = useRef([]);

  function onKeyDown(e) {
    const i = tabs.findIndex((t) => t.id === active);
    if (e.key === 'ArrowRight') setActive(tabs[(i + 1) % tabs.length].id);
    else if (e.key === 'ArrowLeft') setActive(tabs[(i - 1 + tabs.length) % tabs.length].id);
  }

  // Large screens: smoothly scroll the row so the chosen pane is at the left edge (clamped at the end)
  function scrollToPane(index) {
    const scroller = scrollerRef.current;
    const pane = paneRefs.current[index];
    if (!scroller || !pane) return;
    scroller.scrollTo({ left: index === 0 ? 0 : pane.offsetLeft, behavior: 'smooth' });
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

      {/* On lg+ this is the horizontal scroller. It has a fixed height so each pane scrolls vertically inside it. */}
      <div
        ref={scrollerRef}
        className={
          split
            ? 'lg:relative lg:mt-4 lg:flex lg:h-[calc(100vh-9rem)] lg:snap-x lg:snap-mandatory lg:gap-4 lg:overflow-x-auto lg:overflow-y-hidden lg:scroll-smooth lg:pb-2'
            : ''
        }
      >
        {tabs.map((t, i) => {
          const label = t.splitLabel ?? t.label;
          const other = tabs[i === 0 ? 1 : 0];
          const otherLabel = other.splitLabel ?? other.label;
          const goesRight = i === 0;

          return (
            <div
              key={t.id}
              ref={(el) => (paneRefs.current[i] = el)}
              role="tabpanel"
              id={`sql-pane-${t.id}`}
              aria-labelledby={`sql-tab-${t.id}`}
              className={`mt-1 ${t.id === active ? '' : 'hidden'} ${
                split ? 'min-w-0 lg:mt-0 lg:block lg:h-full lg:w-[65%] lg:shrink-0 lg:snap-start lg:overflow-y-auto lg:pr-1' : ''
              }`}
            >
              {/* Column header (large screens): title + button that scrolls to the other pane */}
              {split && (
                <div className="sticky top-0 z-10 mb-2 hidden items-center justify-between gap-2 bg-canvas py-1 lg:flex">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</h2>
                  <button
                    type="button"
                    onClick={() => scrollToPane(i === 0 ? 1 : 0)}
                    className={ctl}
                    aria-label={`Scroll to ${otherLabel}`}
                  >
                    {goesRight ? (
                      <>
                        {otherLabel} <ArrowRightIcon />
                      </>
                    ) : (
                      <>
                        <ArrowLeftIcon /> {otherLabel}
                      </>
                    )}
                  </button>
                </div>
              )}

              <div>{t.content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}