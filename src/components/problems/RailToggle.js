'use client';

import { useEffect, useRef, useState } from 'react';

const KEY = 'q-rail';
const WIDTH_KEY = 'q-rail-w';
const MIN = 208; // px
const MAX = 520; // px
const DEFAULT = 272; // px, same as the 17rem fallback in the page grid

const clamp = (n) => Math.min(MAX, Math.max(MIN, Math.round(n)));
const apply = (px) => document.documentElement.style.setProperty('--q-rail-w', `${px}px`);

// Brings the current question to the middle of the outline
function centerCurrent() {
  const current = document.querySelector('[data-q-current]');
  const scroller = document.querySelector('.q-rail-scroll');
  if (current && scroller) scroller.scrollTop = current.offsetTop - scroller.clientHeight / 2 + current.clientHeight / 2;
}

// Left outline controls:
//  - collapse / expand button (shortcut: B)
//  - drag handle on the right edge to resize (double-click resets, arrow keys work when focused)
// Both choices are remembered in this browser.
export default function RailToggle() {
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT);
  const widthRef = useRef(DEFAULT);
  const handleRef = useRef(null);

  const commit = (px, save = true) => {
    const w = clamp(px);
    widthRef.current = w;
    setWidth(w);
    apply(w);
    if (save) {
      try {
        localStorage.setItem(WIDTH_KEY, String(w));
      } catch {
        /* storage blocked */
      }
    }
  };

  // Restore saved choices
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') setCollapsed(true);
      const saved = Number(localStorage.getItem(WIDTH_KEY));
      if (saved) commit(saved, false);
    } catch {
      /* storage blocked */
    }
    return () => document.documentElement.style.removeProperty('--q-rail-w');
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (collapsed) root.setAttribute('data-rail', 'collapsed');
    else {
      root.removeAttribute('data-rail');
      requestAnimationFrame(centerCurrent);
    }
    return () => root.removeAttribute('data-rail');
  }, [collapsed]);

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(KEY, next ? '1' : '0');
      } catch {
        /* storage blocked */
      }
      return next;
    });

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'b' || e.key === 'B') toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const el = handleRef.current;
    el.setPointerCapture?.(e.pointerId);
    const startX = e.clientX;
    const startW = widthRef.current;
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    el.classList.add('is-active');

    const move = (ev) => commit(startW + ev.clientX - startX, false);
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
      el.classList.remove('is-active');
      commit(widthRef.current, true);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  const reset = () => {
    widthRef.current = DEFAULT;
    setWidth(DEFAULT);
    document.documentElement.style.removeProperty('--q-rail-w');
    try {
      localStorage.removeItem(WIDTH_KEY);
    } catch {
      /* storage blocked */
    }
  };

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const step = e.shiftKey ? 48 : 16;
    commit(widthRef.current + (e.key === 'ArrowRight' ? step : -step));
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={collapsed}
        aria-label={collapsed ? 'Show question list' : 'Hide question list'}
        title={collapsed ? 'Show question list (B)' : 'Hide question list (B)'}
        className="absolute right-0 top-0 grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
          {collapsed ? <path d="M13.5 9.5l2.5 2.5-2.5 2.5" /> : <path d="M16 9.5L13.5 12l2.5 2.5" />}
        </svg>
      </button>

      <div
        ref={handleRef}
        className="q-rail-handle absolute -right-[1.625rem] top-0 h-[calc(100vh-8rem)] w-3 cursor-col-resize touch-none"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize question list"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={width}
        title="Drag to resize · double-click to reset"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onDoubleClick={reset}
        onKeyDown={onKeyDown}
      />
    </>
  );
}