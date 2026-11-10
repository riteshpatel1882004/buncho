'use client';

import { useEffect, useState } from 'react';
import { Mic } from './icons';

// Decorative preview of the problem workspace: the question on the left, dictation and submit on the right.
const SCRIPT =
  'I’d start by finding where it fails. First I’d log the retrieved chunks for the bad answers and check whether the right evidence was retrieved at all. If it was, the problem is in generation, so I’d tighten the prompt to answer only from the context.';
const WORDS = SCRIPT.split(' ');

// The newest words are shown dimmed, like the interim results a browser's speech recognition returns
const INTERIM = 3;

const BARS = [0.1, 0.35, 0.2, 0.5, 0.05, 0.4, 0.25, 0.45, 0.15, 0.3];

export default function HeroDemo() {
  // phase: 'typing' -> 'typed' -> 'saving' -> 'saved' -> (loops)
  const [phase, setPhase] = useState('typing');
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Respect reduced-motion: show the finished state, no animation
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(WORDS.length);
      setPhase('saved');
      return;
    }

    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    const restart = () => {
      setCount(0);
      setPhase('typing');
      later(() => type(0), 900);
    };

    const save = () => {
      setPhase('saving');
      later(() => {
        setPhase('saved');
        later(restart, 4500);
      }, 900);
    };

    const type = (n) => {
      if (n < WORDS.length) {
        setPhase('typing');
        setCount(n + 1);
        const word = WORDS[n];
        // Longer breaths after punctuation, uneven pace otherwise, like real speech
        const delay = /[.,]$/.test(word) ? 450 + Math.random() * 250 : 150 + Math.random() * 180;
        later(() => type(n + 1), delay);
      } else {
        setPhase('typed');
        later(save, 1300);
      }
    };

    later(() => type(0), 800);
    return () => timers.forEach(clearTimeout);
  }, []);

  const listening = phase === 'typing';
  const saved = phase === 'saved';

  const finalEnd = listening ? Math.max(0, count - INTERIM) : count;
  const finalText = WORDS.slice(0, finalEnd).join(' ');
  const interimText = WORDS.slice(finalEnd, count).join(' ');

  return (
    <div className="relative min-w-0" aria-hidden="true">
      <div className="panel select-none overflow-hidden !rounded-2xl shadow-2xl shadow-black/20">
        <div className="flex h-9 items-center gap-2 border-b border-line bg-surface-2 px-3 text-xs">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-hard" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-medium" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-easy" />
          <span className="ml-3 min-w-0 truncate text-muted">buncho / problems / reduce-rag-hallucinations</span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-2">
          {/* Left: the problem description */}
          <div className="min-w-0 p-4">
            <div className="flex gap-4 border-b border-line pb-0 text-xs font-medium">
              <span className="border-b-2 border-ink pb-2 text-ink">Description</span>
            </div>

            <p className="mt-4 text-base font-semibold leading-snug">How would you reduce hallucinations in a RAG application?</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-medium/12 px-2.5 py-0.5 font-semibold text-medium">Medium</span>
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-muted">RAG and Vector Databases</span>
            </div>
            <p className="mt-3 hidden text-sm leading-relaxed text-muted sm:block">
              Your support bot answers confidently, but sometimes with facts that are not in your documents. Walk through how you would find the cause and fix it.
            </p>
          </div>

          {/* Right: the answer editor */}
          <div className="min-w-0 border-t border-line sm:border-l sm:border-t-0">
            <div className="flex h-9 items-center gap-2 border-b border-line bg-surface-2 px-4 text-xs font-medium">
              <span className="text-go">&lt;/&gt;</span> Answer
            </div>

            {/* Fixed minimum height so the card doesn't jump while the text grows */}
            <div className="min-h-[10.5rem] break-words p-4 font-mono text-[0.78rem] leading-relaxed sm:min-h-[12.5rem] sm:text-[0.8rem]">
              {finalText}
              {finalText && interimText ? ' ' : ''}
              <span className="text-muted">{interimText}</span>
              {listening && <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse bg-accent" />}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
              <span className="flex min-w-0 items-center gap-3">
                {listening ? (
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-hard px-3 py-1.5 text-xs font-semibold text-white">
                    <span className="h-2 w-2 rounded-full bg-white" /> Stop
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink">
                    <Mic width={13} height={13} /> Dictate
                  </span>
                )}
                {listening && (
                  <span className="flex h-5 items-center gap-[3px]">
                    {BARS.map((d, i) => (
                      <span key={i} className="wave-bar block h-4 w-[3px] rounded-full bg-hard" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </span>
                )}
                {phase === 'saving' && <span className="animate-pulse truncate text-xs text-muted">Saving…</span>}
                {saved && <span className="truncate text-xs font-medium text-easy">Answer saved</span>}
              </span>

              <span
                className={`shrink-0 rounded-lg bg-go px-4 py-1.5 text-xs font-semibold text-go-ink transition-opacity ${
                  phase === 'saving' ? 'animate-pulse' : ''
                } ${saved ? 'opacity-50' : ''}`}
              >
                {phase === 'saving' ? 'Saving…' : saved ? 'Saved' : 'Submit'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}