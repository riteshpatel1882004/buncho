import Link from 'next/link';
import { Lock } from './icons';

// Frequency % and companies are Pro only. Free users see a lock; the values are never selected for them.
// Pass `linkLock` only where the lock is NOT already inside another link.

const LOCK_TITLE = 'Unlock with Buncho Pro';

export function LockMark({ linkLock = false, label = null, className = '' }) {
  const body = (
    <>
      <Lock width={12} height={12} />
      {label ? <span>{label}</span> : <span className="sr-only">Pro feature</span>}
    </>
  );
  const cls = `inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[0.7rem] font-semibold text-muted ${className}`;
  return linkLock ? (
    <Link href="/pricing" title={LOCK_TITLE} className={`${cls} transition-colors hover:text-accent`}>{body}</Link>
  ) : (
    <span title={LOCK_TITLE} className={cls}>{body}</span>
  );
}

export function Frequency({ pro, value, linkLock = false, bar = true }) {
  if (!pro) return <LockMark linkLock={linkLock} />;
  if (value === null || value === undefined) return <span className="text-xs text-muted" title="No data yet">–</span>;
  return (
    <span className="inline-flex items-center gap-2" title={`Asked in about ${value}% of reported interviews`}>
      <span className="text-xs font-semibold tabular-nums">{value}%</span>
      {bar && (
        <span aria-hidden="true" className="hidden h-1 w-8 overflow-hidden rounded-full bg-line/70 @5xl:block">
          <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
        </span>
      )}
    </span>
  );
}

export function Companies({ pro, list, max = 2, linkLock = false }) {
  if (!pro) return <LockMark linkLock={linkLock} />;
  const names = Array.isArray(list) ? list : [];
  if (!names.length) return <span className="text-xs text-muted" title="No data yet">–</span>;
  return (
    <span className="flex min-w-0 items-center gap-1" title={names.join(', ')}>
      {names.slice(0, max).map((n) => (
        <span key={n} className="truncate rounded-md bg-surface-2 px-1.5 py-0.5 text-[0.7rem] font-medium">{n}</span>
      ))}
      {names.length > max && <span className="shrink-0 text-[0.7rem] text-muted">+{names.length - max}</span>}
    </span>
  );
}

/** One compact line for lists without room for columns. */
export function InsightsInline({ pro, problem, linkLock = false, className = '' }) {
  if (!pro) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-muted ${className}`}>
        <LockMark linkLock={linkLock} label="Asked %" />
        <LockMark linkLock={linkLock} label="Companies" />
      </span>
    );
  }
  const names = problem?.askedByCompanies ?? [];
  const f = problem?.askedFrequency;
  if ((f === null || f === undefined) && !names.length) return null;
  return (
    <span className={`flex min-w-0 items-center gap-1.5 text-xs text-muted ${className}`}>
      {f !== null && f !== undefined && <span className="shrink-0 font-semibold text-ink">{f}% asked</span>}
      {names.length > 0 && (
        <span className="truncate">{f !== null && f !== undefined && '· '}{names.slice(0, 3).join(', ')}{names.length > 3 ? ` +${names.length - 3}` : ''}</span>
      )}
    </span>
  );
}

/** Chips for the top of a problem page: "42% asked [bar]  Google  Amazon". Rendered inside a flex row. */
export function InsightsPanel({ pro, problem }) {
  const names = problem?.askedByCompanies ?? [];
  const f = problem?.askedFrequency;
  const hasF = f !== null && f !== undefined;

  if (!pro) {
    return (
      <Link
        href="/pricing"
        title={LOCK_TITLE}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Lock width={12} height={12} /> Unlock asked % and companies
      </Link>
    );
  }

  if (!hasF && !names.length) return null;

  return (
    <>
      {hasF && (
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-xs" title={`Asked in about ${f}% of reported interviews`}>
          <span className="font-semibold tabular-nums">{f}%</span>
          <span className="text-muted">asked</span>
          <span aria-hidden="true" className="h-1 w-8 overflow-hidden rounded-full bg-line">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, f))}%` }} />
          </span>
        </span>
      )}
      {names.map((n) => (
        <span key={n} className="rounded-full border border-line px-3 py-1 text-xs font-medium">{n}</span>
      ))}
    </>
  );
}