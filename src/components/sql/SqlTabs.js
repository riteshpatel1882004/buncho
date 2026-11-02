'use client';

import { useEffect, useRef, useState } from 'react';

// Segmented tab switch for the SQL question page: Description | Answers & Optimization.
// Both panes are rendered on the server and passed in, so switching tabs never refetches anything.
// tabs: [{ id, label, splitLabel?, icon, badge?, content }]
//
// split: on large screens (lg and up) the tab bar is hidden and the panes sit side by side with a
// draggable divider between them. Drag it to make the question or the answers wider or narrower.
//   - Double-click the divider to reset to 50 / 50.
//   - Focus the divider and use the left / right arrow keys (Home resets).
//   - The width you choose is remembered in this browser.
// Each pane scrolls vertically on its own, so the question stays in view while you read the answers.
// Below lg it is the normal tab switch.

const MIN = 25; // smallest width (%) either pane can shrink to
const MAX = 75;
const DEFAULT = 50;
const STORAGE_KEY = 'sql-split-left';

const clamp = (n) => Math.min(MAX, Math.max(MIN, n));

export default function SqlTabs({ tabs, initial, split = false }) {
  const [active, setActive] = useState(initial ?? tabs[0].id);
  const [left, setLeft] = useState(DEFAULT); // width of the left pane, in %
  const [dragging, setDragging] = useState(false);
  const wrapRef = useRef(null);

  // Restore the saved width after mount (avoids a hydration mismatch)
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEY));
      if (saved) setLeft(clamp(saved));
    } catch {}
  }, []);

  function save(value) {
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.round(value * 10) / 10));
    } catch {}
  }

  function onKeyDown(e) {
    const i = tabs.findIndex((t) => t.id === active);
    if (e.key === 'ArrowRight') setActive(tabs[(i + 1) % tabs.length].id);
    else if (e.key === 'ArrowLeft') setActive(tabs[(i - 1 + tabs.length) % tabs.length].id);
  }

  // ---- Divider: drag, double-click and keyboard ----
  function onPointerDown(e) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function onPointerMove(e) {
    if (!dragging || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setLeft(clamp(((e.clientX - rect.left) / rect.width) * 100));
  }
  function onPointerUp(e) {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
    save(left);
  }
  function reset() {
    setLeft(DEFAULT);
    save(DEFAULT);
  }
  function onDividerKey(e) {
    let next = null;
    if (e.key === 'ArrowLeft') next = clamp(left - 3);
    else if (e.key === 'ArrowRight') next = clamp(left + 3);
    else if (e.key === 'Home') next = DEFAULT;
    if (next == null) return;
    e.preventDefault();
    setLeft(next);
    save(next);
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

      {/* lg+: grid of [left pane | divider | right pane]. Fixed height so each pane scrolls inside it. */}
      <div
        ref={wrapRef}
        style={{ '--left': `${left}%` }}
        className={
          split
            ? `lg:sticky lg:top-20 lg:mt-4 lg:grid lg:h-[calc(100vh-6rem)] lg:grid-cols-[minmax(0,var(--left))_1rem_minmax(0,1fr)] lg:items-stretch ${
                dragging ? 'lg:select-none' : ''
              }`
            : ''
        }
      >
        {tabs.map((t, i) => {
          const label = t.splitLabel ?? t.label;

          return (
            <div key={t.id} className="contents">
              <div
                role="tabpanel"
                id={`sql-pane-${t.id}`}
                aria-labelledby={`sql-tab-${t.id}`}
                className={`mt-1 ${t.id === active ? '' : 'hidden'} ${
                  split ? 'min-w-0 lg:mt-0 lg:block lg:h-full lg:overflow-y-auto lg:pr-1' : ''
                }`}
              >
                {split && (
                  <div className="sticky top-0 z-10 mb-2 hidden bg-canvas py-1 lg:block">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</h2>
                  </div>
                )}
                <div>{t.content}</div>
              </div>

              {/* Divider sits between the two panes (large screens only) */}
              {split && i === 0 && (
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize question and answers"
                  aria-valuemin={MIN}
                  aria-valuemax={MAX}
                  aria-valuenow={Math.round(left)}
                  tabIndex={0}
                  title="Drag to resize. Double-click to reset."
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onDoubleClick={reset}
                  onKeyDown={onDividerKey}
                  className="group hidden cursor-col-resize touch-none items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent lg:flex"
                >
                  <span
                    className={`h-full w-px transition-colors ${dragging ? 'bg-accent' : 'bg-line group-hover:bg-accent/60'}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`absolute grid h-10 w-3 place-items-center rounded-full border bg-surface transition-colors ${
                      dragging ? 'border-accent' : 'border-line group-hover:border-accent/60'
                    }`}
                    aria-hidden="true"
                  >
                    <span className="h-4 w-px bg-muted" />
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}