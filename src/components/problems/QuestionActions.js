'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { setCompleted, toggleBookmark } from '@/app/actions';
import { Bookmark, Check } from '@/components/icons';

// "Mark as done" and "Save for later" on a question page. Signed-out visitors are sent to log in.
export default function QuestionActions({ problemId, completed, bookmarked, signedIn }) {
  const [done, setDone] = useState(completed);
  const [saved, setSaved] = useState(bookmarked);
  const [pending, start] = useTransition();
  const [error, setError] = useState(null);

  const base = 'inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors disabled:opacity-60';

  if (!signedIn) {
    return (
      <div className="flex flex-wrap gap-2">
        <Link href="/login" className={`${base} border-line bg-surface hover:border-muted`}>
          <Check width={16} height={16} /> Log in to track progress
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          aria-pressed={done}
          onClick={() => {
            const next = !done;
            setDone(next);
            setError(null);
            start(async () => {
              const res = await setCompleted(problemId, next);
              if (!res.ok) {
                setDone(!next);
                setError(res.error);
              }
            });
          }}
          className={`${base} ${done ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface hover:border-muted'}`}
        >
          <Check width={16} height={16} /> {done ? 'Done' : 'Mark as done'}
        </button>
        <button
          type="button"
          disabled={pending}
          aria-pressed={saved}
          onClick={() => {
            const next = !saved;
            setSaved(next);
            setError(null);
            start(async () => {
              const res = await toggleBookmark(problemId);
              if (!res.ok) {
                setSaved(!next);
                setError(res.error);
              }
            });
          }}
          className={`${base} ${saved ? 'border-accent/50 bg-accent-soft text-accent' : 'border-line bg-surface hover:border-muted'}`}
        >
          <Bookmark width={16} height={16} filled={saved} /> {saved ? 'Saved' : 'Save for later'}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-hard">{error}</p>}
    </div>
  );
}