'use client';

import { useEffect, useState } from 'react';

// Cycles through `words` inside a headline. All words share one grid cell, so the headline never changes size,
// and the first word is what the server renders (and what search engines and no-JS visitors see).
export default function RotatingWord({ words, interval = 2400 }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (words.length < 2) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  const prev = (i - 1 + words.length) % words.length;

  return (
    <span className="relative inline-grid whitespace-nowrap align-bottom text-accent">
      {words.map((w, k) => (
        <span
          key={w}
          aria-hidden={k !== i}
          style={{ gridArea: '1 / 1' }}
          className={`transition-all duration-500 ease-out ${
            k === i ? 'translate-y-0 opacity-100' : k === prev ? '-translate-y-3 opacity-0' : 'translate-y-3 opacity-0'
          }`}
        >
          {w}
        </span>
      ))}
      <span aria-hidden="true" className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-accent/40" />
    </span>
  );
}