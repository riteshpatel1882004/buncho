import Link from 'next/link';

// Shared dashboard card: consistent padding, heading, optional hint and action link.
export default function Section({ id, title, hint, action, children, className = '' }) {
  return (
    <section aria-labelledby={id} className={`card p-5 sm:p-6 ${className}`}>
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={id} className="text-base font-semibold tracking-tight">{title}</h2>
          {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
        </div>
        {action && (
          <Link href={action.href} className="shrink-0 text-sm font-medium text-accent hover:underline">
            {action.label}
          </Link>
        )}
      </header>
      <div className="mt-4 sm:mt-5">{children}</div>
    </section>
  );
}

export const rowClass =
  'flex items-center justify-between gap-4 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-surface-2';

export function Empty({ children }) {
  return <p className="rounded-lg bg-surface-2/60 px-4 py-5 text-sm text-muted">{children}</p>;
}