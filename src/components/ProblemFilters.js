// 'use client';

// import Link from 'next/link';
// import { useCallback, useEffect, useState, useTransition } from 'react';
// import { usePathname, useRouter, useSearchParams } from 'next/navigation';
// import { DIFFICULTIES, DIFFICULTY_LABEL, PROBLEM_TYPES, TYPE_LABEL } from '@/lib/constants';
// import { Search } from './icons';

// const selectCls =
//   'h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-muted focus:border-muted';
// const countCls = (on) =>
//   `ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${on ? 'bg-bg/20 text-bg' : 'bg-surface-2 text-accent'}`;
// const pillCls = (on) =>
//   `shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
//     on ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-muted hover:border-muted hover:text-ink'
//   }`;

// /**
//  * Topic pills + search + difficulty/type selects.
//  * On /problems the pills filter in place. On a topic page (currentTopic is set) they are links to the other topics.
//  * solved: number | null. When null, only the problem count is shown.
//  */
// export default function ProblemFilters({ topics = [], currentTopic, signedIn = false, solved = null, total = 0 }) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const sp = useSearchParams();
//   const [pending, startTransition] = useTransition();
//   const [q, setQ] = useState(sp.get('q') ?? '');
//   const onTopicPage = currentTopic !== undefined;
//   const allCount = topics.reduce((sum, t) => sum + (t._count?.problems ?? 0), 0);

//   const update = useCallback(
//     (patch) => {
//       const params = new URLSearchParams(sp.toString());
//       Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
//       params.delete('page');
//       const qs = params.toString();
//       startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
//     },
//     [sp, pathname, router],
//   );

//   // Debounced search
//   useEffect(() => {
//     const t = setTimeout(() => {
//       if ((sp.get('q') ?? '') !== q.trim()) update({ q: q.trim() });
//     }, 350);
//     return () => clearTimeout(t);
//   }, [q, sp, update]);

//   const difficulty = sp.get('difficulty') ?? '';
//   const activeTopic = onTopicPage ? currentTopic : sp.get('topic') ?? '';
//   const hasFilters = Boolean(sp.get('q') || difficulty || sp.get('type') || sp.get('access') || sp.get('status') || (!onTopicPage && sp.get('topic')));

//   return (
//     <div className="space-y-4" aria-busy={pending}>
//       {/* Topic pills */}
//       <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Topic">
//         {onTopicPage ? (
//           <>
//             <Link href="/problems" className={pillCls(false)}>
//               All topics<span className={countCls(false)}>{allCount}</span>
//             </Link>
//             {topics.map((t) => (
//               <Link key={t.slug} href={`/topics/${t.slug}`} aria-current={t.slug === activeTopic ? 'page' : undefined} className={pillCls(t.slug === activeTopic)}>
//                 {t.name}
//                 <span className={countCls(t.slug === activeTopic)}>{t._count?.problems ?? 0}</span>
//               </Link>
//             ))}
//           </>
//         ) : (
//           <>
//             <button type="button" aria-pressed={!activeTopic} onClick={() => update({ topic: '' })} className={pillCls(!activeTopic)}>
//               All topics<span className={countCls(!activeTopic)}>{allCount}</span>
//             </button>
//             {topics.map((t) => (
//               <button key={t.slug} type="button" aria-pressed={activeTopic === t.slug} onClick={() => update({ topic: t.slug })} className={pillCls(activeTopic === t.slug)}>
//                 {t.name}
//                 <span className={countCls(activeTopic === t.slug)}>{t._count?.problems ?? 0}</span>
//               </button>
//             ))}
//           </>
//         )}
//       </div>

//       {/* Search, selects, count */}
//       <div className="flex flex-wrap items-center gap-2.5">
//         <div className="relative min-w-52 flex-1 sm:max-w-sm">
//           <label htmlFor="search" className="sr-only">Search problems</label>
//           <Search width={16} height={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
//           <input
//             id="search"
//             type="search"
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//             placeholder="Search questions"
//             className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted hover:border-muted focus:border-muted"
//           />
//         </div>

//         <label htmlFor="difficulty" className="sr-only">Difficulty</label>
//         <select id="difficulty" value={difficulty} onChange={(e) => update({ difficulty: e.target.value })} className={selectCls}>
//           <option value="">Difficulty</option>
//           {DIFFICULTIES.map((d) => (
//             <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>
//           ))}
//         </select>

//         <label htmlFor="type" className="sr-only">Problem type</label>
//         <select id="type" value={sp.get('type') ?? ''} onChange={(e) => update({ type: e.target.value })} className={selectCls}>
//           <option value="">All types</option>
//           {PROBLEM_TYPES.map((t) => (
//             <option key={t} value={t}>{TYPE_LABEL[t]}</option>
//           ))}
//         </select>

//         <label htmlFor="access" className="sr-only">Pro or free</label>
//         <select id="access" value={sp.get('access') ?? ''} onChange={(e) => update({ access: e.target.value })} className={selectCls}>
//           <option value="">Pro &amp; Free</option>
//           <option value="pro">Pro only</option>
//           <option value="free">Free only</option>
//         </select>

//         {signedIn && (
//           <>
//             <label htmlFor="status" className="sr-only">Progress</label>
//             <select id="status" value={sp.get('status') ?? ''} onChange={(e) => update({ status: e.target.value })} className={selectCls}>
//               <option value="">Solved &amp; Not solved</option>
//               <option value="solved">Solved</option>
//               <option value="unsolved">Not solved</option>
//             </select>
//           </>
//         )}

//         {hasFilters && (
//           <button
//             type="button"
//             onClick={() => {
//               setQ('');
//               startTransition(() => router.replace(pathname, { scroll: false }));
//             }}
//             className="px-2 text-sm font-medium text-accent hover:underline"
//           >
//             Clear
//           </button>
//         )}

//         <p className="ml-auto text-sm text-muted">
//           {solved !== null ? (
//             <>
//               <span className="font-semibold text-ink">{solved}</span>/{total} solved
//             </>
//           ) : (
//             <>
//               <span className="font-semibold text-ink">{total}</span> {total === 1 ? 'problem' : 'problems'}
//             </>
//           )}
//         </p>
//       </div>
//     </div>
//   );
// }



'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DIFFICULTIES, DIFFICULTY_LABEL, PROBLEM_TYPES, TYPE_LABEL } from '@/lib/constants';
import { Search } from './icons';

const selectCls =
  'h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors hover:border-muted focus:border-muted';
const countCls = (on) =>
  `ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${on ? 'bg-bg/20 text-bg' : 'bg-surface-2 text-accent'}`;
const pillCls = (on) =>
  `shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
    on ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-muted hover:border-muted hover:text-ink'
  }`;

/**
 * Topic pills + search + difficulty/type selects.
 * On /problems/ai the pills filter in place. On a topic page (currentTopic is set) they are links to the other topics.
 * category 'hr': no topic pills and no type select (every HR question shares one topic and type).
 * solved: number | null. When null, only the problem count is shown.
 */
export default function ProblemFilters({ topics = [], currentTopic, signedIn = false, solved = null, total = 0, category = 'ai' }) {
  const hr = category === 'hr';
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const onTopicPage = currentTopic !== undefined;
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
  const activeTopic = onTopicPage ? currentTopic : sp.get('topic') ?? '';
  const hasFilters = Boolean(sp.get('q') || difficulty || sp.get('type') || sp.get('access') || sp.get('status') || (!onTopicPage && sp.get('topic')));

  return (
    <div className="space-y-4" aria-busy={pending}>
      {/* Topic pills (AI problems only: HR questions all share one topic) */}
      {!hr && (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Topic">
          {onTopicPage ? (
            <>
              <Link href="/problems" className={pillCls(false)}>
                All topics<span className={countCls(false)}>{allCount}</span>
              </Link>
              {topics.map((t) => (
                <Link key={t.slug} href={`/topics/${t.slug}`} aria-current={t.slug === activeTopic ? 'page' : undefined} className={pillCls(t.slug === activeTopic)}>
                  {t.name}
                  <span className={countCls(t.slug === activeTopic)}>{t._count?.problems ?? 0}</span>
                </Link>
              ))}
            </>
          ) : (
            <>
              <button type="button" aria-pressed={!activeTopic} onClick={() => update({ topic: '' })} className={pillCls(!activeTopic)}>
                All topics<span className={countCls(!activeTopic)}>{allCount}</span>
              </button>
              {topics.map((t) => (
                <button key={t.slug} type="button" aria-pressed={activeTopic === t.slug} onClick={() => update({ topic: t.slug })} className={pillCls(activeTopic === t.slug)}>
                  {t.name}
                  <span className={countCls(activeTopic === t.slug)}>{t._count?.problems ?? 0}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Search, selects, count */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-52 flex-1 sm:max-w-sm">
          <label htmlFor="search" className="sr-only">Search problems</label>
          <Search width={16} height={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={hr ? 'Search HR questions' : 'Search questions'}
            className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted hover:border-muted focus:border-muted"
          />
        </div>

        <label htmlFor="difficulty" className="sr-only">Difficulty</label>
        <select id="difficulty" value={difficulty} onChange={(e) => update({ difficulty: e.target.value })} className={selectCls}>
          <option value="">Difficulty</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>
          ))}
        </select>

        {!hr && (
          <>
            <label htmlFor="type" className="sr-only">Problem type</label>
            <select id="type" value={sp.get('type') ?? ''} onChange={(e) => update({ type: e.target.value })} className={selectCls}>
              <option value="">All types</option>
              {PROBLEM_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
          </>
        )}

        <label htmlFor="access" className="sr-only">Pro or free</label>
        <select id="access" value={sp.get('access') ?? ''} onChange={(e) => update({ access: e.target.value })} className={selectCls}>
          <option value="">Pro &amp; Free</option>
          <option value="pro">Pro only</option>
          <option value="free">Free only</option>
        </select>

        {signedIn && (
          <>
            <label htmlFor="status" className="sr-only">Progress</label>
            <select id="status" value={sp.get('status') ?? ''} onChange={(e) => update({ status: e.target.value })} className={selectCls}>
              <option value="">Solved &amp; Not solved</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Not solved</option>
            </select>
          </>
        )}

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="px-2 text-sm font-medium text-accent hover:underline"
          >
            Clear
          </button>
        )}

        <p className="ml-auto text-sm text-muted">
          {solved !== null ? (
            <>
              <span className="font-semibold text-ink">{solved}</span>/{total} solved
            </>
          ) : (
            <>
              <span className="font-semibold text-ink">{total}</span> {total === 1 ? 'problem' : 'problems'}
            </>
          )}
        </p>
      </div>
    </div>
  );
}