'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DIFFICULTIES, DIFFICULTY_LABEL, PROBLEM_TYPES, TYPE_LABEL } from '@/lib/constants';
import { Close, Search } from './icons';
import Popup from './Popup';

const selectCls =
  'h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-muted focus:border-muted';
const DOT = { EASY: 'bg-easy', MEDIUM: 'bg-medium', HARD: 'bg-hard' };

const chipCls = (on, big = false) =>
  `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors active:scale-[0.97] ${
    big ? 'h-10 px-4 text-sm' : 'h-9 px-3.5 text-[13px] sm:text-sm'
  } ${on ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-muted hover:border-muted hover:text-ink'}`;
const countCls = (on) => `text-xs font-semibold tabular-nums ${on ? 'opacity-70' : 'text-accent'}`;

function SlidersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

// One group of tap-friendly options inside the phone filter sheet. Tapping the active option clears it.
function ChipGroup({ label, value, options, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" aria-pressed={on} onClick={() => onChange(on ? '' : o.value)} className={chipCls(on, true)}>
              {o.dot && <span className={`h-2 w-2 rounded-full ${o.dot}`} />}
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Topic chips + search + filters.
 * Phones: search box with a "Filters" button that opens a bottom sheet, removable chips for what is active.
 * md and up: search plus inline selects.
 * On /problems the topic chips filter in place (?topic=<slug>), so a link like /problems?topic=python-for-ai-ml works.
 * category 'hr': no topic chips and no type filter (every question in it shares one topic and type).
 * category 'sql': topic chips come from `subcategories` ([{ name, count }], filter param `sub`), plus the type filter
 * (Conceptual = explain questions, Practical = write-a-query questions).
 * solved: number | null. When null, only the problem count is shown.
 */
export default function ProblemFilters({ topics = [], subcategories = [], signedIn = false, solved = null, total = 0, category = 'ai' }) {
  const single = category === 'hr' || category === 'sql'; // no chips built from the Topic table
  const noType = category === 'hr';
  const useSubs = category === 'sql' && subcategories.length > 0;
  const subTotal = subcategories.reduce((sum, s) => sum + s.count, 0);
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const allCount = topics.reduce((sum, t) => sum + (t._count?.problems ?? 0), 0);

  const update = useCallback(
    (patch) => {
      const params = new URLSearchParams(sp.toString());
      Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
      params.delete('page');
      const qs = params.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [sp, pathname, router],
  );

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if ((sp.get('q') ?? '') !== q.trim()) update({ q: q.trim() });
    }, 350);
    return () => clearTimeout(t);
  }, [q, sp, update]);

  const difficulty = sp.get('difficulty') ?? '';
  const type = sp.get('type') ?? '';
  const access = sp.get('access') ?? '';
  const status = sp.get('status') ?? '';
  const sub = sp.get('sub') ?? '';
  const activeTopic = sp.get('topic') ?? '';
  const hasFilters = Boolean(sp.get('q') || difficulty || type || access || status || sub || sp.get('topic'));

  const active = [
    difficulty && { key: 'difficulty', label: DIFFICULTY_LABEL[difficulty] },
    !noType && type && { key: 'type', label: TYPE_LABEL[type] },
    access && { key: 'access', label: access === 'pro' ? 'Pro only' : 'Free only' },
    status && { key: 'status', label: status === 'solved' ? 'Solved' : 'Not solved' },
  ].filter(Boolean);

  const clearAll = () => {
    setQ('');
    startTransition(() => router.replace(pathname, { scroll: false }));
  };

  const summary =
    solved !== null ? (
      <>
        <span className="font-semibold text-ink">{solved}</span>/{total} solved
      </>
    ) : (
      <>
        <span className="font-semibold text-ink">{total}</span> {total === 1 ? 'problem' : 'problems'}
      </>
    );

  return (
    <div className="space-y-3" aria-busy={pending}>
      {/* Topic chips (AI problems only: HR and SQL questions each share one topic) */}
      {!single && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Topic">
          <button type="button" aria-pressed={!activeTopic} onClick={() => update({ topic: '' })} className={chipCls(!activeTopic)}>
            All topics <span className={countCls(!activeTopic)}>{allCount}</span>
          </button>
          {topics.map((t) => (
            <button key={t.slug} type="button" aria-pressed={activeTopic === t.slug} onClick={() => update({ topic: t.slug })} className={chipCls(activeTopic === t.slug)}>
              {t.name} <span className={countCls(activeTopic === t.slug)}>{t._count?.problems ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      {/* SQL topic chips: one per subcategory, filter in place with ?sub= */}
      {useSubs && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Topic">
          <button type="button" aria-pressed={!sub} onClick={() => update({ sub: '' })} className={chipCls(!sub)}>
            All topics <span className={countCls(!sub)}>{subTotal}</span>
          </button>
          {subcategories.map((s) => (
            <button key={s.name} type="button" aria-pressed={sub === s.name} onClick={() => update({ sub: s.name })} className={chipCls(sub === s.name)}>
              {s.name} <span className={countCls(sub === s.name)}>{s.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-0 flex-1 md:min-w-52 md:max-w-sm md:flex-none lg:flex-1">
          <label htmlFor="search" className="sr-only">Search problems</label>
          <Search width={16} height={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          {/* 16px on phones: anything smaller makes iOS zoom the page when the box is focused */}
          <input
            id="search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={category === 'hr' ? 'Search HR questions' : category === 'sql' ? 'Search SQL questions' : 'Search questions'}
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-base outline-none transition-colors placeholder:text-muted hover:border-muted focus:border-muted md:h-10 md:text-sm"
          />
        </div>

        {/* Phones: filter sheet */}
        <div className="md:hidden">
          <Popup
            title="Filters"
            buttonClassName="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm font-medium transition-colors hover:border-muted"
            buttonLabel={
              <>
                <SlidersIcon />
                Filters
                {active.length > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[0.7rem] font-semibold text-accent-ink">{active.length}</span>
                )}
              </>
            }
          >
            {({ close }) => (
              <div className="space-y-5">
                <ChipGroup
                  label="Difficulty"
                  value={difficulty}
                  onChange={(v) => update({ difficulty: v })}
                  options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABEL[d], dot: DOT[d] }))}
                />
                {!noType && (
                  <ChipGroup
                    label="Type"
                    value={type}
                    onChange={(v) => update({ type: v })}
                    options={PROBLEM_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
                  />
                )}
                <ChipGroup
                  label="Access"
                  value={access}
                  onChange={(v) => update({ access: v })}
                  options={[
                    { value: 'free', label: 'Free' },
                    { value: 'pro', label: 'Pro' },
                  ]}
                />
                {signedIn && (
                  <ChipGroup
                    label="Progress"
                    value={status}
                    onChange={(v) => update({ status: v })}
                    options={[
                      { value: 'unsolved', label: 'Not solved' },
                      { value: 'solved', label: 'Solved' },
                    ]}
                  />
                )}
                <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-line bg-surface px-5 pt-3">
                  <button
                    type="button"
                    onClick={() => update({ difficulty: '', type: '', access: '', status: '' })}
                    disabled={active.length === 0}
                    className="h-11 flex-1 rounded-xl border border-line text-sm font-semibold transition-colors hover:bg-surface-2 disabled:opacity-40"
                  >
                    Reset
                  </button>
                  <button type="button" onClick={close} className="h-11 flex-[2] rounded-xl bg-accent text-sm font-semibold text-accent-ink hover:opacity-90">
                    Show results
                  </button>
                </div>
              </div>
            )}
          </Popup>
        </div>

        {/* md and up: inline selects */}
        <div className="hidden flex-1 flex-wrap items-center gap-2.5 md:flex">
          <label htmlFor="difficulty" className="sr-only">Difficulty</label>
          <select id="difficulty" value={difficulty} onChange={(e) => update({ difficulty: e.target.value })} className={selectCls}>
            <option value="">Difficulty</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>
            ))}
          </select>

          {!noType && (
            <>
              <label htmlFor="type" className="sr-only">Problem type</label>
              <select id="type" value={type} onChange={(e) => update({ type: e.target.value })} className={selectCls}>
                <option value="">All types</option>
                {PROBLEM_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
            </>
          )}

          <label htmlFor="access" className="sr-only">Pro or free</label>
          <select id="access" value={access} onChange={(e) => update({ access: e.target.value })} className={selectCls}>
            <option value="">Pro &amp; Free</option>
            <option value="pro">Pro only</option>
            <option value="free">Free only</option>
          </select>

          {signedIn && (
            <>
              <label htmlFor="status" className="sr-only">Progress</label>
              <select id="status" value={status} onChange={(e) => update({ status: e.target.value })} className={selectCls}>
                <option value="">Solved &amp; Not solved</option>
                <option value="solved">Solved</option>
                <option value="unsolved">Not solved</option>
              </select>
            </>
          )}

          {hasFilters && (
            <button type="button" onClick={clearAll} className="px-2 text-sm font-medium text-accent hover:underline">
              Clear
            </button>
          )}

          <p className="ml-auto text-sm text-muted">{summary}</p>
        </div>
      </div>

      {/* Phones: result count, clear, and removable chips for the active filters */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <p className="text-sm text-muted">{summary}</p>
        {hasFilters && (
          <button type="button" onClick={clearAll} className="-my-2 py-2 text-sm font-semibold text-accent">
            Clear all
          </button>
        )}
      </div>
      {active.length > 0 && (
        <div className="flex flex-wrap gap-1.5 md:hidden">
          {active.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => update({ [a.key]: '' })}
              aria-label={`Remove filter ${a.label}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-soft pl-3 pr-2 text-xs font-semibold text-accent"
            >
              {a.label}
              <Close width={12} height={12} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}