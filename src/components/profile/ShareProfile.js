'use client';

import { useEffect, useState } from 'react';

const btn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40';

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure contexts: fall back to a temporary textarea
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Share buttons for a public profile: copy link, native share sheet (phones), X, LinkedIn, WhatsApp.
 * owner: also shows the "README badge" copy button (a Markdown snippet for GitHub).
 * compact: only the copy and share buttons, for the dashboard header and the profile hero.
 */
export default function ShareProfile({ url, name = 'my', owner = false, compact = false }) {
  const [note, setNote] = useState('');
  const [canNative, setCanNative] = useState(false);

  useEffect(() => setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function'), []);
  useEffect(() => {
    if (!note) return undefined;
    const t = setTimeout(() => setNote(''), 2200);
    return () => clearTimeout(t);
  }, [note]);

  const message = `Check out ${name === 'my' ? 'my' : `${name}'s`} AI interview practice profile on Buncho`;
  const enc = encodeURIComponent;

  async function onCopy() {
    setNote((await copy(url)) ? 'Link copied' : 'Copy failed. Select the link manually.');
  }
  async function onNative() {
    try {
      await navigator.share({ title: message, text: message, url });
    } catch {
      // The user closed the share sheet: nothing to do
    }
  }
  async function onBadge() {
    const md = `[![Buncho profile](${url}/badge)](${url})`;
    setNote((await copy(md)) ? 'README badge copied' : 'Copy failed');
  }

  return (
    <div className={compact ? 'flex flex-wrap items-center gap-2' : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onCopy} className={btn}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
          Copy link
        </button>
        {canNative && (
          <button type="button" onClick={onNative} className={btn}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
              <path d="M16 6l-4-4-4 4M12 2v14" />
            </svg>
            Share
          </button>
        )}
        {!compact && (
          <>
            <a href={`https://x.com/intent/post?text=${enc(message)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer" className={btn}>X</a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer" className={btn}>LinkedIn</a>
            <a href={`https://wa.me/?text=${enc(`${message} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={btn}>WhatsApp</a>
          </>
        )}
        {owner && (
          <button type="button" onClick={onBadge} className={btn}>
            Copy README badge
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className={compact ? 'text-sm font-medium text-easy' : 'mt-2 min-h-5 text-sm font-medium text-easy'}>
        {note}
      </p>
    </div>
  );
}