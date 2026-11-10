'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { setCompleted } from '@/app/actions';
import { Check } from '@/components/icons';

// The round tick at the end of a question row. Signed-out visitors are sent to log in.
export default function RowCheck({ problemId, completed, signedIn }) {
  const [done, setDone] = useState(completed);
  const [pending, start] = useTransition();
  const style = `grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors ${
    done ? 'border-accent bg-accent text-accent-ink' : 'border-line text-transparent hover:border-muted hover:text-muted'
  }`;

  if (!signedIn || !problemId) {
    return (
      <Link href="/login" aria-label="Log in to track your progress" title="Log in to track your progress" className={style}>
        <Check width={14} height={14} />
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={done}
      aria-label={done ? 'Mark as not done' : 'Mark as done'}
      title={done ? 'Mark as not done' : 'Mark as done'}
      className={style}
      onClick={() => {
        const next = !done;
        setDone(next); // optimistic
        start(async () => {
          const res = await setCompleted(problemId, next);
          if (!res.ok) setDone(!next);
        });
      }}
    >
      <Check width={14} height={14} />
    </button>
  );
}