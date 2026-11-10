'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createTab, deleteTab, moveTab, renameTab } from '@/app/docs-actions';

const act = 'grid h-6 w-6 place-items-center rounded text-xs text-muted hover:bg-surface hover:text-ink disabled:opacity-40';

// Left column of a question document: one link per tab (topic). Admins also get "New tab…" and per-tab controls.
export default function DocTabs({ category, tabs, activeSlug, admin }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  const run = (fn, after) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) return setError(res.error);
      after?.(res);
      router.refresh();
    });

  return (
    <nav aria-label="Topics" className="text-sm">
      <ul className="space-y-0.5">
        {tabs.map((t, i) => {
          const active = t.slug === activeSlug;
          return (
            <li key={t.slug} className={`group flex items-center rounded-lg ${active ? 'bg-surface-2 font-medium' : 'hover:bg-surface-2/60'}`}>
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
                    onClick={() => {
                      if (!window.confirm(`Delete the tab "${t.name}" with all its questions? Users' progress on them is deleted too. This cannot be undone.`)) return;
                      run(() => deleteTab(t.slug), () => {
                        if (active) router.push(`/docs/${category}`);
                      });
                    }}
                  >
                    🗑
                  </button>
                </span>
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
    </nav>
  );
}