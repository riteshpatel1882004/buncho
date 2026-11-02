import Link from 'next/link';
import { ChevronLeft } from '@/components/icons';

// Shared building blocks for the job-preparation pages (server and client safe: no hooks).

export const toneOf = (s) => (s === null || s === undefined ? 'muted' : s >= 70 ? 'easy' : s >= 50 ? 'medium' : 'hard');
export const TONE_TEXT = { easy: 'text-easy', medium: 'text-medium', hard: 'text-hard', muted: 'text-muted' };
export const TONE_SOFT = { easy: 'bg-easy/15 text-easy', medium: 'bg-medium/15 text-medium', hard: 'bg-hard/15 text-hard', muted: 'bg-surface-2 text-muted' };
export const TONE_BAR = { easy: 'bg-easy', medium: 'bg-medium', hard: 'bg-hard', muted: 'bg-line' };
export const TONE_VAR = { easy: 'var(--easy)', medium: 'var(--medium)', hard: 'var(--hard)', muted: 'var(--line)' };

export const card = 'rounded-2xl border border-line bg-surface';
export const chip = 'rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted';
export const ctaBtn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink shadow-lg shadow-accent/25 transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-wait disabled:opacity-50 disabled:hover:translate-y-0';

const AVATARS = [
  ['--accent', '--easy'],
  ['--easy', '--accent'],
  ['--medium', '--accent'],
  ['--accent', '--medium'],
];

export function Avatar({ id, text, size = 56 }) {
  const n = [...String(id)].reduce((s, c) => s + c.charCodeAt(0), 0);
  const [a, b] = AVATARS[n % AVATARS.length];
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-2xl font-bold text-accent-ink shadow-md shadow-black/10"
      style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(135deg, var(${a}), var(${b}))` }}
    >
      {(text || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function BackLink({ href, children }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1 rounded-full py-1 pr-3 text-sm font-medium text-muted transition-colors hover:text-ink">
      <ChevronLeft width={16} height={16} className="transition-transform group-hover:-translate-x-0.5" /> {children}
    </Link>
  );
}

export function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-surface/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent backdrop-blur">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {children}
    </span>
  );
}

export function Gradient({ children }) {
  return (
    <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, var(--accent), var(--easy))' }}>
      {children}
    </span>
  );
}

// Gradient banner with a dot grid and soft glows, used at the top of every job-prep page
export function Hero({ children, className = '', ...rest }) {
  return (
    <section
      {...rest}
      className={`relative overflow-hidden rounded-3xl border border-line ${className}`}
      style={{ background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--surface) 62%)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom_left,black,transparent_70%)]"
        style={{ backgroundImage: 'radial-gradient(var(--line) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-easy/15 blur-3xl" />
      <div className="relative">{children}</div>
    </section>
  );
}

// Circular progress. value 0-100, colour is a CSS colour (e.g. var(--accent)), children are drawn in the middle.
export function Ring({ value = 0, size = 96, stroke = 9, color = 'var(--accent)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Stat({ label, value, hint, tone }) {
  return (
    <div className={`${card} px-4 py-3.5`}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums tracking-tight ${tone ? TONE_TEXT[tone] : ''}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}