'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createTab, deleteTab, moveTab, renameTab } from '@/app/docs-actions';
import ConfirmDialog from './ConfirmDialog';

const act = 'grid h-6 w-6 place-items-center rounded text-xs text-muted hover:bg-surface hover:text-ink disabled:opacity-40';

const sameOutline = (a, b) => a.length === b.length && a.every((q, i) => q.id === b[i].id && q.title === b[i].title && Boolean(q.pro) === Boolean(b[i].pro));

// The Heading 2s as they are in the editor right now (so the list follows what the admin types)
function readEditorOutline() {
  return [...document.querySelectorAll('.doc .ProseMirror h2[id]')]
    .map((el) => {
      const copy = el.cloneNode(true);
      copy.querySelectorAll('.doc-pro-btn').forEach((b) => b.remove()); // the "Make Pro" button is not part of the title
      return { id: el.id, title: copy.textContent.trim(), pro: el.getAttribute('data-pro') === 'true' };
    })
    .filter((q) => q.title);
}

// Left column of a question document: one link per tab (topic). The open topic lists its sub-topics (the Heading 2s of
// the document) underneath, and the one you are reading is highlighted. Admins also get "New tab…" and per-tab controls.
export default function DocTabs({ category, tabs, activeSlug, admin, outline = [] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null); // the tab waiting for confirmation
  const [items, setItems] = useState(outline); // sub-topics of the open topic
  const [current, setCurrent] = useState(null); // id of the sub-topic being read

  const run = (fn, after) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) return setError(res.error);
      after?.(res);
      router.refresh();
    });

  // New page or new data from the server
  useEffect(() => {
    setItems(outline);
  }, [outline, activeSlug]);

  // Admin: follow the editor while typing (new, renamed, removed or Pro-marked Heading 2s show up here)
  useEffect(() => {
    if (!admin || !activeSlug) return undefined;
    let timer;
    const sync = () => {
      if (!document.querySelector('.doc .ProseMirror')) return; // the editor is not on the page yet
      const next = readEditorOutline();
      setItems((prev) => (sameOutline(prev, next) ? prev : next));
    };
    const obs = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(sync, 250);
    });
    obs.observe(document.querySelector('main') || document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-pro'] });
    return () => {
      obs.disconnect();
      clearTimeout(timer);
    };
  }, [admin, activeSlug]);

  // Highlight the sub-topic that is at the top of the screen while scrolling
  useEffect(() => {
    if (!activeSlug || !items.length) {
      setCurrent(null);
      return undefined;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      let cur = null;
      for (const q of items) {
        const el = document.getElementById(q.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 140) cur = q.id;
        else break;
      }
      setCurrent((prev) => (prev === cur ? prev : cur));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items, activeSlug]);

  // Keep the highlighted sub-topic visible inside the (scrollable) left column
  useEffect(() => {
    const el = document.querySelector('[data-sub-active="true"]');
    const box = el?.closest('aside');
    if (!el || !box) return;
    const a = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < a.top + 8) box.scrollTop -= a.top + 8 - r.top;
    else if (r.bottom > a.bottom - 8) box.scrollTop += r.bottom - a.bottom + 8;
  }, [current]);

  return (
    <nav aria-label="Topics" className="text-sm">
      <ul className="space-y-0.5">
        {tabs.map((t, i) => {
          const active = t.slug === activeSlug;
          return (
            <li key={t.slug}>
              <div className={`group flex items-center rounded-lg ${active ? 'bg-surface-2 font-medium' : 'hover:bg-surface-2/60'}`}>
                <Link href={`/docs/${category}/${t.slug}`} className="min-w-0 flex-1 truncate px-3 py-2">
                  {t.name}
                </Link>
                {admin && (
                  <span className="flex shrink-0 items-center pr-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button type="button" className={act} disabled={pending || i === 0} aria-label={`Move ${t.name} up`} onClick={() => run(() => moveTab(t.slug, -1))}>↑</button>
                    <button type="button" className={act} disabled={pending || i === tabs.length - 1} aria-label={`Move ${t.name} down`} onClick={() => run(() => moveTab(t.slug, 1))}>↓</button>
                    <button
                      type="button"
                      className={act}
                      disabled={pending}
                      aria-label={`Rename ${t.name}`}
                      onClick={() => {
                        const next = window.prompt('Rename tab', t.name);
                        if (next && next.trim() && next.trim() !== t.name) run(() => renameTab(t.slug, next));
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className={`${act} hover:!text-hard`}
                      disabled={pending}
                      aria-label={`Delete ${t.name}`}
                      onClick={() => setToDelete(t)}
                    >
                      🗑
                    </button>
                  </span>
                )}
              </div>

              {/* Sub-topics of the open topic */}
              {active && items.length > 0 && (
                <div className="mb-1.5 ml-4 mt-1 border-l border-line">
                  <p className="px-3 pb-1 pt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    {items.length} topic{items.length === 1 ? '' : 's'}
                  </p>
                  <ul className="max-h-72 overflow-y-auto md:max-h-none">
                    {items.map((q) => {
                      const on = q.id === current;
                      return (
                        <li key={q.id}>
                          <a
                            href={`#${q.id}`}
                            data-sub-active={on ? 'true' : undefined}
                            aria-current={on ? 'location' : undefined}
                            title={q.title}
                            onClick={() => setCurrent(q.id)}
                            className={`-ml-px flex items-start gap-1.5 border-l-2 py-1 pl-3 pr-2 text-[13px] leading-snug transition-colors ${
                              on ? 'border-accent font-medium text-ink' : 'border-transparent text-muted hover:border-line hover:text-ink'
                            }`}
                          >
                            <span className="line-clamp-2 min-w-0 flex-1">{q.title}</span>
                            {q.pro && <span className="mt-px shrink-0 rounded bg-amber-400/90 px-1 text-[9px] font-extrabold uppercase leading-4 text-amber-950">Pro</span>}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {admin &&
        (adding ? (
          <form
            className="mt-2 flex gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => createTab(category, name), (res) => {
                setAdding(false);
                setName('');
                router.push(`/docs/${category}/${res.slug}`);
              });
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Tab name"
              aria-label="New tab name"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-accent"
            />
            <button type="submit" disabled={pending || !name.trim()} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink disabled:opacity-40">Add</button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-2">Cancel</button>
          </form>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-muted hover:bg-surface-2 hover:text-ink">
            <span aria-hidden="true">+</span> New tab…
          </button>
        ))}

      {error && <p role="alert" className="mt-2 px-1 text-xs text-hard">{error}</p>}

      <ConfirmDialog
        open={Boolean(toDelete)}
        busy={pending}
        title={toDelete ? `Delete the tab "${toDelete.name}"?` : ''}
        message="This deletes the tab with all its questions. Users' progress on them is deleted too. This cannot be undone."
        confirmLabel="Delete tab"
        onCancel={() => !pending && setToDelete(null)}
        onConfirm={() => {
          const t = toDelete;
          run(() => deleteTab(t.slug), () => {
            setToDelete(null);
            if (t.slug === activeSlug) router.push(`/docs/${category}`);
          });
        }}
      />
    </nav>
  );
}