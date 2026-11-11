'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

// What readers see: the saved document, with every table made easy to read and easy to resize.
//  - On load each column gets a sensible width (short columns keep the room they need, long text columns share the rest),
//    so no column is squeezed into one word per line.
//  - Drag the edge of a column header to make that column wider or narrower. Double-click the edge to fit it again.
//    Arrow keys work too when an edge is focused. The table scrolls sideways when it is wider than the page.
//  - Widths a reader chooses are remembered in this browser, per table.

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const MIN_AUTO = 112; // px, narrowest a column starts out
const MIN_DRAG = 56; // px, narrowest a reader can drag a column
const MAX_AUTO = 460; // px, a long text column starts at most this wide (it wraps)
const KEY = 'doc-tables-v1';

const sum = (a) => a.reduce((s, n) => s + n, 0);

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function writeSaved(id, widths) {
  try {
    const all = readSaved();
    if (widths) all[id] = widths;
    else delete all[id];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage blocked: the widths just are not remembered */
  }
}

function columnCount(table) {
  let max = 0;
  for (const row of table.rows) {
    let n = 0;
    for (const cell of row.cells) n += cell.colSpan || 1;
    max = Math.max(max, n);
  }
  return max;
}

// How wide each column wants to be if its text never wrapped
function measure(table) {
  const colgroup = table.querySelector('colgroup');
  colgroup?.remove();
  const prev = { l: table.style.tableLayout, w: table.style.width, m: table.style.minWidth, s: table.style.whiteSpace };
  table.style.tableLayout = 'auto';
  table.style.width = 'max-content';
  table.style.minWidth = '0';
  table.style.whiteSpace = 'nowrap';

  const widths = Array(columnCount(table)).fill(0);
  for (const row of table.rows) {
    let c = 0;
    for (const cell of row.cells) {
      const span = cell.colSpan || 1;
      if (span === 1) widths[c] = Math.max(widths[c], cell.getBoundingClientRect().width);
      c += span;
    }
  }

  table.style.tableLayout = prev.l;
  table.style.width = prev.w;
  table.style.minWidth = prev.m;
  table.style.whiteSpace = prev.s;
  if (colgroup) table.prepend(colgroup);
  return widths;
}

// Turns the wanted widths into real ones for the room available
function fit(natural, available) {
  const want = natural.map((w) => Math.min(MAX_AUTO, Math.max(MIN_AUTO, Math.ceil(w))));
  const total = sum(want);
  if (total <= available) {
    // Room to spare: share it out in proportion, so the table fills the page like a normal table
    const extra = available - total;
    return want.map((w) => Math.floor(w + (extra * w) / total));
  }
  // Too wide: short columns keep what they need, the long ones split what is left
  const out = Array(want.length).fill(MIN_AUTO);
  let left = available;
  let open = want.map((_, i) => i);
  while (open.length) {
    const share = left / open.length;
    const small = open.filter((i) => want[i] <= share);
    if (!small.length) {
      open.forEach((i) => {
        out[i] = Math.max(MIN_AUTO, Math.floor(share));
      });
      break;
    }
    small.forEach((i) => {
      out[i] = want[i];
      left -= want[i];
    });
    open = open.filter((i) => !small.includes(i));
  }
  return out;
}

function paint(table, widths) {
  let colgroup = table.querySelector('colgroup');
  if (!colgroup || colgroup.children.length !== widths.length) {
    colgroup?.remove();
    colgroup = document.createElement('colgroup');
    widths.forEach(() => colgroup.appendChild(document.createElement('col')));
    table.prepend(colgroup);
  }
  [...colgroup.children].forEach((col, i) => {
    col.style.width = `${widths[i]}px`;
    col.style.minWidth = '0';
  });
  table.style.tableLayout = 'fixed';
  table.style.minWidth = '0';
  table.style.width = `${sum(widths)}px`;
  table.dataset.fitted = '1';
}

function setup(root, tableId) {
  const wrappers = [...root.querySelectorAll('.tableWrapper')];
  const saved = readSaved();
  const cleanups = [];
  const tables = [];

  wrappers.forEach((wrap, index) => {
    const table = wrap.querySelector('table');
    if (!table || !table.rows.length) return;
    const id = `${tableId}:${index}`;
    const cols = columnCount(table);
    let widths = null;
    let custom = Array.isArray(saved[id]) && saved[id].length === cols;

    const available = () => Math.max(MIN_AUTO * 2, wrap.clientWidth - 2);
    const autoFit = () => fit(measure(table), available());
    widths = custom ? saved[id].map((w) => Math.max(MIN_DRAG, Number(w) || MIN_AUTO)) : autoFit();
    paint(table, widths);

    // One drag edge per column, on the first row
    let c = 0;
    for (const cell of table.rows[0].cells) {
      const span = cell.colSpan || 1;
      const idx = c + span - 1;
      c += span;
      if (span > 1) continue;

      const grip = document.createElement('span');
      grip.className = `doc-grip${idx === cols - 1 ? ' doc-grip-last' : ''}`;
      grip.setAttribute('role', 'separator');
      grip.setAttribute('aria-orientation', 'vertical');
      grip.setAttribute('aria-label', 'Resize column');
      grip.setAttribute('title', 'Drag to resize · double-click to fit');
      grip.tabIndex = 0;
      cell.appendChild(grip);

      const set = (w) => {
        widths[idx] = Math.max(MIN_DRAG, Math.round(w));
        paint(table, widths);
        custom = true;
      };

      grip.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        grip.setPointerCapture?.(e.pointerId);
        const startX = e.clientX;
        const startW = widths[idx];
        const prevCursor = document.body.style.cursor;
        const prevSelect = document.body.style.userSelect;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        grip.classList.add('is-active');

        const move = (ev) => set(startW + ev.clientX - startX);
        const up = () => {
          grip.removeEventListener('pointermove', move);
          grip.removeEventListener('pointerup', up);
          grip.removeEventListener('pointercancel', up);
          document.body.style.cursor = prevCursor;
          document.body.style.userSelect = prevSelect;
          grip.classList.remove('is-active');
          writeSaved(id, widths);
        };
        grip.addEventListener('pointermove', move);
        grip.addEventListener('pointerup', up);
        grip.addEventListener('pointercancel', up);
      });

      grip.addEventListener('dblclick', () => {
        custom = false;
        widths = autoFit();
        paint(table, widths);
        writeSaved(id, null);
      });

      grip.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const step = e.shiftKey ? 48 : 16;
        set(widths[idx] + (e.key === 'ArrowRight' ? step : -step));
        writeSaved(id, widths);
      });
    }

    tables.push({
      refit() {
        if (custom) return;
        widths = autoFit();
        paint(table, widths);
      },
    });
  });

  // Keep tables that nobody resized matched to the page when the window or the font changes
  let timer;
  const refit = () => {
    clearTimeout(timer);
    timer = setTimeout(() => tables.forEach((t) => t.refit()), 120);
  };
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(refit);
    ro.observe(root);
    cleanups.push(() => ro.disconnect());
  }
  document.fonts?.ready?.then(refit);
  cleanups.push(() => clearTimeout(timer));

  return () => {
    cleanups.forEach((fn) => fn());
    root.querySelectorAll('.doc-grip').forEach((g) => g.remove());
  };
}

export default function DocReadView({ slug, html, headingFont, textFont }) {
  const ref = useRef(null);

  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    root.querySelectorAll('.doc-grip').forEach((g) => g.remove()); // React strict mode runs this twice in development
    return setup(root, slug);
  }, [slug, html]);

  return <div ref={ref} className={`doc doc-read doc-h-${headingFont} doc-t-${textFont}`} dangerouslySetInnerHTML={{ __html: html }} />;
}