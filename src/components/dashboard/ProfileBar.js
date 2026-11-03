'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { copy } from '@/components/profile/ShareProfile';

const base =
  'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40';
const ghost = `${base} text-muted hover:bg-surface-2 hover:text-ink`;
const outline = `${base} border border-line bg-surface text-ink hover:border-accent/60 hover:text-accent`;
const primary = `${base} bg-accent text-accent-ink shadow-sm hover:opacity-90`;

function Svg({ children, size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

/**
 * Desktop-only profile strip at the top of the dashboard.
 * Left: where the public profile lives. Right: copy / share, then edit and view.
 * Phones use <ProfileTiles /> instead.
 * stacked: narrow vertical card (url on top, 2x2 buttons below) for the left column.
 */
export default function ProfileBar({ username, url, name = 'my', stacked = false }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function'), []);
  useEffect(() => {
    if (!copied && !failed) return undefined;
    const t = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 2000);
    return () => clearTimeout(t);
  }, [copied, failed]);

  // Close the share menu on outside click / Escape
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    const onKey = (e) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const message = `Check out ${name === 'my' ? 'my' : `${name}'s`} AI interview practice profile on Buncho`;
  const enc = encodeURIComponent;
  const display = url.replace(/^https?:\/\//, '');

  async function onCopy() {
    const ok = await copy(url);
    setCopied(ok);
    setFailed(!ok);
  }
  async function onShare() {
    if (!canNative) {
      setMenu((m) => !m);
      return;
    }
    try {
      await navigator.share({ title: message, text: message, url });
    } catch {
      // The user closed the share sheet: nothing to do
    }
  }

  const item = 'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-surface-2';

  return (
    <div
      className={
        stacked
          ? 'flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-sm'
          : 'mb-5 hidden items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-3 py-2.5 shadow-sm lg:flex'
      }
    >
      {/* Where the profile lives */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Svg size={18}>
            <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
            <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
          </Svg>
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Your public profile</p>
          <p className="mt-0.5 truncate font-mono text-sm text-ink">{display}</p>
        </div>
      </div>

      {/* Actions */}
      <div className={stacked ? 'grid grid-cols-2 gap-1.5' : 'flex shrink-0 items-center gap-1.5'}>
        <button
          type="button"
          onClick={onCopy}
          className={`${stacked ? `${outline} w-full !gap-1.5 !px-2` : `${ghost} min-w-[7.5rem]`} ${copied ? '!bg-accent-soft !text-accent' : ''}`}
        >
          <Svg>{copied ? <path d="M20 6 9 17l-5-5" /> : (<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>)}</Svg>
          {copied ? 'Copied' : failed ? 'Copy failed' : 'Copy link'}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={onShare}
            aria-haspopup={canNative ? undefined : 'menu'}
            aria-expanded={canNative ? undefined : menu}
            className={stacked ? `${outline} w-full !gap-1.5 !px-2` : ghost}
          >
            <Svg>
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
              <path d="M16 6l-4-4-4 4M12 2v14" />
            </Svg>
            Share
          </button>
          {menu && !canNative && (
            <div role="menu" className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-line bg-surface p-1.5 shadow-xl shadow-black/10 dark:shadow-black/50">
              <a role="menuitem" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer" className={item}>LinkedIn</a>
              <a role="menuitem" href={`https://x.com/intent/post?text=${enc(message)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer" className={item}>X</a>
              <a role="menuitem" href={`https://wa.me/?text=${enc(`${message} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={item}>WhatsApp</a>
            </div>
          )}
        </div>

        {!stacked && <span aria-hidden="true" className="mx-1.5 h-6 w-px bg-line" />}

        <Link href="/settings/profile" className={stacked ? `${outline} w-full !gap-1.5 !px-2` : outline}>
          <Svg>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </Svg>
          Edit profile
        </Link>
        <Link href={`/user/${username}`} className={stacked ? `${primary} w-full !gap-1.5 !px-2` : primary}>
          View profile
          <Svg size={14}>
            <path d="M7 17 17 7" />
            <path d="M8 7h9v9" />
          </Svg>
        </Link>
      </div>

      <span role="status" aria-live="polite" className="sr-only">{copied ? 'Link copied' : ''}</span>
    </div>
  );
}