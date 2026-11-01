'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { copy } from '@/components/profile/ShareProfile';

const tile =
  'group flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface px-1 py-3 text-center text-xs font-semibold shadow-sm transition active:scale-[0.97] hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40';
const chip =
  'grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-ink transition-colors group-hover:bg-accent-soft group-hover:text-accent';

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

/**
 * Phone-only quick actions: public profile, edit, copy link, share (native share sheet, or WhatsApp
 * when the browser has none). Desktop keeps the text links + ShareProfile buttons.
 */
export default function ProfileTiles({ username, url, name = 'my' }) {
  const [note, setNote] = useState('');
  const [canNative, setCanNative] = useState(false);

  useEffect(() => setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function'), []);
  useEffect(() => {
    if (!note) return undefined;
    const t = setTimeout(() => setNote(''), 2200);
    return () => clearTimeout(t);
  }, [note]);

  const message = `Check out ${name === 'my' ? 'my' : `${name}'s`} AI interview practice profile on Buncho`;

  async function onCopy() {
    setNote((await copy(url)) ? 'Link copied' : 'Copy failed. Select the link manually.');
  }
  async function onShare() {
    try {
      await navigator.share({ title: message, text: message, url });
    } catch {
      // The user closed the share sheet: nothing to do
    }
  }

  return (
    <div className="lg:hidden">
      <div className="grid grid-cols-4 gap-2.5">
        <Link href={`/user/${username}`} className={tile}>
          <span className={chip}>
            <Icon>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
            </Icon>
          </span>
          Profile
        </Link>
        <Link href="/settings/profile" className={tile}>
          <span className={chip}>
            <Icon>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </Icon>
          </span>
          Edit
        </Link>
        <button type="button" onClick={onCopy} className={tile}>
          <span className={chip}>
            <Icon>
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </Icon>
          </span>
          Copy link
        </button>
        {canNative ? (
          <button type="button" onClick={onShare} className={tile}>
            <span className={chip}>
              <Icon>
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                <path d="M16 6l-4-4-4 4M12 2v14" />
              </Icon>
            </span>
            Share
          </button>
        ) : (
          <a href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={tile}>
            <span className={chip}>
              <Icon>
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                <path d="M16 6l-4-4-4 4M12 2v14" />
              </Icon>
            </span>
            Share
          </a>
        )}
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg shadow-lg transition-opacity duration-200 ${note ? 'opacity-100' : 'opacity-0'}`}
      >
        {note}
      </p>
    </div>
  );
}