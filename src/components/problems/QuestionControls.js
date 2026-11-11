'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Maximize, Restore } from '@/components/icons';

const KEY = 'q-focus';

// Focus mode (hides the outline, centres a larger reading column) and keyboard shortcuts:
// ← previous question, → next question, F toggle focus mode.
export default function QuestionControls({ prevHref, nextHref }) {
  const router = useRouter();
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') setFocus(true);
    } catch {
      /* storage blocked */
    }
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-focus', focus);
    return () => document.documentElement.removeAttribute('data-focus');
  }, [focus]);

  const toggle = () => {
    const next = !focus;
    setFocus(next);
    try {
      localStorage.setItem(KEY, next ? '1' : '0');
    } catch {
      /* storage blocked */
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowLeft' && prevHref) router.push(prevHref);
      else if (e.key === 'ArrowRight' && nextHref) router.push(nextHref);
      else if (e.key === 'f' || e.key === 'F') toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={focus}
      title="Focus mode (F)"
      className={`hidden h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors lg:inline-flex ${
        focus ? 'border-line bg-surface-2 text-ink' : 'border-line text-muted hover:bg-surface-2 hover:text-ink'
      }`}
    >
      {focus ? <Restore width={14} height={14} /> : <Maximize width={14} height={14} />}
      Focus
    </button>
  );
}