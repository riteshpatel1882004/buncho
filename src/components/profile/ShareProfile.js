'use client';

import { useEffect, useState } from 'react';

const base =
  'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3.5 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40';
const btn = `${base} border-line bg-surface text-ink hover:border-accent/60 hover:bg-accent-soft/60 hover:text-accent`;

export async function copy(text) {
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

function Svg({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const CopyIcon = () => (
  <Svg>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </Svg>
);
const CheckIcon = () => (
  <Svg>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);
const ShareIcon = () => (
  <Svg>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <path d="M16 6l-4-4-4 4M12 2v14" />
  </Svg>
);

/**
 * Share buttons for a public profile: copy link, native share sheet (phones / some desktops), X, LinkedIn, WhatsApp.
 * owner: also shows the "README badge" copy button (a Markdown snippet for GitHub).
 * compact: only the copy and share buttons, for the profile hero.
 * Feedback happens inside the button ("Copied" with a tick), so nothing jumps around the layout.
 */
export default function ShareProfile({ url, name = 'my', owner = false, compact = false }) {
  const [done, setDone] = useState(null); // 'link' | 'badge' | 'fail' | null
  const [canNative, setCanNative] = useState(false);

  useEffect(() => setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function'), []);
  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(() => setDone(null), 2000);
    return () => clearTimeout(t);
  }, [done]);

  const message = `Check out ${name === 'my' ? 'my' : `${name}'s`} AI interview practice profile on Buncho`;
  const enc = encodeURIComponent;

  async function onCopy() {
    setDone((await copy(url)) ? 'link' : 'fail');
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
    setDone((await copy(md)) ? 'badge' : 'fail');
  }

  const copied = done === 'link';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onCopy} className={`${btn} min-w-[7.5rem] ${copied ? '!border-accent/60 !bg-accent-soft !text-accent' : ''}`}>
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? 'Copied' : done === 'fail' ? 'Copy failed' : 'Copy link'}
      </button>

      {canNative && (
        <button type="button" onClick={onNative} className={btn}>
          <ShareIcon />
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
          {done === 'badge' ? <CheckIcon /> : null}
          {done === 'badge' ? 'Badge copied' : 'Copy README badge'}
        </button>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {done === 'link' ? 'Link copied' : done === 'badge' ? 'README badge copied' : done === 'fail' ? 'Copy failed' : ''}
      </span>
    </div>
  );
}