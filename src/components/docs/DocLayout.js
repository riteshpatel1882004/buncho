'use client';

import { useEffect, useRef, useState } from 'react';

const KEY = 'docs-layout-v1';
const SIDE_MIN = 160;
const SIDE_MAX = 520;
const SIDE_DEFAULT = 240;
const CONTENT_MIN = 420;
const CONTENT_MAX = 2400;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const caret = (dir) => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
  </svg>
);

/**
 * Two resizable columns for a question document.
 *  - Left: the Topics list. Drag its right edge to make it wider or narrower, or collapse it with the arrow button.
 *  - Right: the document. Drag its right edge to make the writing area narrower or wider.
 * Double-click a drag handle to go back to the default. Sizes are remembered in this browser.
 */
export default function DocLayout({ aside, children, wide = false }) {
  const [side, setSide] = useState(SIDE_DEFAULT);
  const [content, setContent] = useState(null); // px, or null = the default width
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (typeof saved.side === 'number') setSide(clamp(saved.side, SIDE_MIN, SIDE_MAX));
      if (typeof saved.content === 'number') setContent(clamp(saved.content, CONTENT_MIN, CONTENT_MAX));
      if (saved.collapsed) setCollapsed(true);
    } catch {
      /* storage blocked: just use the defaults */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ side, content, collapsed }));
    } catch {
      /* ignore */
    }
  }, [ready, side, content, collapsed]);

  function startDrag(e, kind) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startSide = side;
    const startWidth = contentRef.current?.getBoundingClientRect().width ?? 800;
    const prevSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const move = (ev) => {
      const dx = ev.clientX - startX;
      if (kind === 'side') setSide(clamp(startSide + dx, SIDE_MIN, SIDE_MAX));
      else setContent(clamp(startWidth + dx * 2, CONTENT_MIN, CONTENT_MAX)); // the column is centred, so each edge moves half
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.body.style.userSelect = prevSelect;
      document.body.style.cursor = prevCursor;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  const keyResize = (kind) => (e) => {
    const step = e.shiftKey ? 48 : 16;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const d = e.key === 'ArrowRight' ? step : -step;
    if (kind === 'side') setSide((s) => clamp(s + d, SIDE_MIN, SIDE_MAX));
    else setContent((c) => clamp((c ?? contentRef.current?.getBoundingClientRect().width ?? 800) + d * 2, CONTENT_MIN, CONTENT_MAX));
  };

  const hint = 'Drag to resize · double-click to reset';

  return (
    <main className="mx-auto flex w-full max-w-[110rem] flex-col gap-6 px-4 py-6 md:flex-row md:gap-0" style={{ '--doc-side': `${side}px` }}>
      {/* Left column */}
      <aside className={`md:sticky md:top-[4.75rem] md:w-[var(--doc-side)] md:shrink-0 md:self-start ${collapsed ? 'md:hidden' : ''}`}>{aside}</aside>

      {/* Handle between the columns */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize the topics column"
        tabIndex={0}
        title={hint}
        onPointerDown={(e) => !collapsed && startDrag(e, 'side')}
        onDoubleClick={() => setSide(SIDE_DEFAULT)}
        onKeyDown={keyResize('side')}
        className={`group relative hidden w-4 shrink-0 self-stretch md:block ${collapsed ? 'cursor-default' : 'cursor-col-resize'}`}
      >
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line transition-all group-hover:w-0.5 group-hover:bg-accent group-focus-visible:w-0.5 group-focus-visible:bg-accent" />
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Show topics' : 'Hide topics'}
          title={collapsed ? 'Show topics' : 'Hide topics'}
          className="sticky top-28 z-10 mx-auto mt-2 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-muted shadow-sm hover:text-ink"
        >
          {caret(collapsed ? 'right' : 'left')}
        </button>
      </div>

      {/* Right column */}
      <div className="min-w-0 flex-1 md:pl-2">
        <div
          ref={contentRef}
          className="relative mx-auto w-full"
          style={{ maxWidth: content ? `${content}px` : wide ? undefined : '48rem' }}
        >
          {children}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize the document width"
            tabIndex={0}
            title={hint}
            onPointerDown={(e) => startDrag(e, 'content')}
            onDoubleClick={() => setContent(null)}
            onKeyDown={keyResize('content')}
            className="group absolute -right-4 inset-y-0 hidden w-4 cursor-col-resize md:block"
          >
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-all group-hover:w-0.5 group-hover:bg-accent group-focus-visible:w-0.5 group-focus-visible:bg-accent" />
          </div>
        </div>
      </div>
    </main>
  );
}