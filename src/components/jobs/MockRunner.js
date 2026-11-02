'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeMock, submitMock } from '@/app/job-actions';
import { requestFeedback } from '@/lib/ai-client';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { MAX_ANSWER_LENGTH, MIN_ANSWER_LENGTH } from '@/lib/constants';
import DifficultyBadge from '@/components/DifficultyBadge';
import Spinner from '@/components/Spinner';
import { Check, ChevronLeft, ChevronRight, Flask, Mic, Stop } from '@/components/icons';
import { card, chip, ctaBtn } from './ui';

const two = (n) => String(n).padStart(2, '0');
const fmt = (s) => `${two(Math.floor(s / 60))}:${two(s % 60)}`;

// questions: [{ id, title, difficulty, topic, minutes, body }]  (body is the question Markdown, rendered on the server)
export default function MockRunner({ mockId, jobId, endsAt, questions }) {
  const router = useRouter();
  const storageKey = `buncho-mock-${mockId}`;
  const end = new Date(endsAt).getTime();

  const [answers, setAnswers] = useState({});
  const [active, setActive] = useState(0);
  const [left, setLeft] = useState(() => Math.max(0, Math.round((end - Date.now()) / 1000)));
  const [phase, setPhase] = useState('writing'); // writing | saving | evaluating | error
  const [progress, setProgress] = useState('');
  const [ev, setEv] = useState({ i: 0, n: 0 });
  const [error, setError] = useState(null);

  const answersRef = useRef(answers);
  const activeRef = useRef(0);
  const busyRef = useRef(false);
  answersRef.current = answers;
  activeRef.current = active;

  // Restore a draft if the page was refreshed
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setAnswers(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {}
  }, [answers, storageKey]);

  const setAnswer = (id, value) => setAnswers((a) => ({ ...a, [id]: value.slice(0, MAX_ANSWER_LENGTH) }));

  const appendSpeech = useCallback(
    (chunk) => {
      const id = questions[activeRef.current]?.id;
      if (!id) return;
      setAnswers((a) => {
        const base = (a[id] ?? '').replace(/\s+$/, '');
        return { ...a, [id]: `${base ? `${base} ` : ''}${chunk}`.slice(0, MAX_ANSWER_LENGTH) };
      });
    },
    [questions],
  );
  const { supported, listening, interim, error: voiceError, start: startVoice, stop: stopVoice } = useSpeechRecognition({ lang: 'en-IN', onFinalText: appendSpeech });

  const finish = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    stopVoice();

    setPhase('saving');
    setProgress('Saving your answers…');
    const saved = await submitMock(mockId, answersRef.current).catch(() => ({ ok: false, error: 'Could not save your answers. Check your connection.' }));
    if (!saved.ok) {
      setError(saved.error);
      setPhase('error');
      busyRef.current = false;
      return;
    }

    setPhase('evaluating');
    for (let i = 0; i < saved.saved.length; i += 1) {
      setEv({ i: i + 1, n: saved.saved.length });
      setProgress(`Getting AI feedback ${i + 1} of ${saved.saved.length}…`);
      await requestFeedback(saved.saved[i]); // a failure is reported on the results page
    }

    await completeMock(mockId);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    router.push(`/jobs/${jobId}/mock/${mockId}`);
  }, [jobId, mockId, router, stopVoice, storageKey]);

  // Countdown. When time runs out the answers are submitted automatically.
  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) finish();
    }, 1000);
    return () => clearInterval(t);
  }, [end, finish]);

  function confirmFinish() {
    const blank = questions.filter((q) => (answers[q.id] ?? '').trim().length < MIN_ANSWER_LENGTH).length;
    const msg = blank
      ? `${blank} ${blank === 1 ? 'question has' : 'questions have'} no answer and will score 0. Submit anyway?`
      : 'Submit your answers for AI feedback? You cannot change them afterwards.';
    if (window.confirm(msg)) finish();
  }

  const q = questions[active];
  const busy = phase === 'saving' || phase === 'evaluating';
  const low = left <= 300;
  const isFilled = (id) => (answers[id] ?? '').trim().length >= MIN_ANSWER_LENGTH;
  const answered = questions.filter((x) => isFilled(x.id)).length;
  const pct = questions.length ? Math.round((answered / questions.length) * 100) : 0;
  const len = (answers[q.id] ?? '').length;
  const evalPct = phase === 'evaluating' && ev.n ? Math.round((ev.i / ev.n) * 100) : phase === 'saving' ? 8 : 0;

  const navBtn = 'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-muted disabled:opacity-40 disabled:hover:border-line';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-5 sm:px-6">
      {/* Top bar: title, progress, timer */}
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-line bg-surface/90 px-4 py-3 shadow-md shadow-black/5 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent"><Flask width={18} height={18} /></span>
          <div>
            <p className="text-sm font-semibold leading-tight">Mock assessment</p>
            <p className="text-xs text-muted">{answered} of {questions.length} answered</p>
          </div>
        </div>
        <div className="hidden min-w-24 flex-1 sm:block" aria-hidden="true">
          <div className="h-2 overflow-hidden rounded-full bg-line/60">
            <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <p
          role="timer"
          aria-label="Time remaining"
          className={`ml-auto rounded-xl px-4 py-1.5 text-xl font-semibold tabular-nums ${low ? 'animate-pulse bg-hard/15 text-hard' : 'bg-accent-soft text-accent'}`}
        >
          {fmt(left)}
        </p>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        {/* Question navigator */}
        <nav aria-label="Questions" className={`${card} p-4 lg:sticky lg:top-40`}>
          <p className="hidden text-xs font-semibold uppercase tracking-widest text-muted lg:block">Questions</p>
          <div role="tablist" aria-label="Questions" className="no-scrollbar flex gap-2 overflow-x-auto lg:mt-3 lg:flex-wrap lg:overflow-visible">
            {questions.map((x, i) => {
              const filled = isFilled(x.id);
              const on = i === active;
              return (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-label={`Question ${i + 1}${filled ? ', answered' : ''}`}
                  onClick={() => setActive(i)}
                  className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-semibold transition ${
                    on
                      ? 'bg-accent text-accent-ink shadow-md shadow-accent/30'
                      : filled
                        ? 'border border-accent/40 bg-accent-soft text-accent'
                        : 'border border-line bg-surface-2/60 hover:border-muted'
                  }`}
                >
                  {i + 1}
                  {filled && !on && <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-accent text-accent-ink"><Check width={10} height={10} strokeWidth={3.5} /></span>}
                </button>
              );
            })}
          </div>
          <ul className="mt-4 hidden space-y-1.5 text-xs text-muted lg:block">
            <li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-accent" /> Current</li>
            <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-accent/40 bg-accent-soft" /> Answered</li>
            <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-line bg-surface-2" /> Not answered</li>
          </ul>
          <p className="mt-4 hidden border-t border-line pt-3 text-xs text-muted lg:block">Your draft is saved on this device as you type.</p>
        </nav>

        <div className="min-w-0 space-y-5">
          {/* Question */}
          <section className={`${card} p-5 sm:p-7`} aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">Question {active + 1} of {questions.length}</span>
              <DifficultyBadge difficulty={q.difficulty} />
              <span className={chip}>{q.topic}</span>
              <span className={chip}>about {q.minutes} min</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{q.title}</h2>
            <div className="mt-5 border-t border-line pt-5">{q.body}</div>
          </section>

          {/* Answer */}
          <section className={`${card} overflow-hidden focus-within:border-accent/60`}>
            <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface-2/50 px-4 py-2.5">
              <span className="text-sm font-semibold">Your answer</span>
              {supported ? (
                <button
                  type="button"
                  onClick={listening ? stopVoice : startVoice}
                  aria-pressed={listening}
                  disabled={busy}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${listening ? 'bg-hard text-white' : 'border border-line bg-surface hover:border-muted'}`}
                >
                  {listening ? <Stop width={14} height={14} /> : <Mic width={14} height={14} />}
                  {listening ? 'Stop dictating' : 'Dictate'}
                </button>
              ) : (
                <p className="text-sm text-muted">Voice input isn&rsquo;t available in this browser.</p>
              )}
              <span className="ml-auto text-xs tabular-nums text-muted">{len.toLocaleString()} / {MAX_ANSWER_LENGTH.toLocaleString()}</span>
            </div>
            <label htmlFor={`mock-answer-${q.id}`} className="sr-only">Your answer to question {active + 1}</label>
            <textarea
              id={`mock-answer-${q.id}`}
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              disabled={busy}
              spellCheck="true"
              placeholder="Answer as you would in the interview. Explain your reasoning, not just the conclusion."
              className="block min-h-72 w-full resize-y bg-transparent px-4 py-4 font-mono text-[0.85rem] leading-relaxed outline-none placeholder:text-muted/70"
            />
            {listening && interim && <p className="border-t border-line px-4 py-2 text-xs italic text-muted">{interim}</p>}
            {voiceError && <p role="alert" className="border-t border-line px-4 py-2 text-xs text-hard">{voiceError}</p>}
          </section>

          {/* Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button type="button" disabled={active === 0 || busy} onClick={() => setActive(active - 1)} className={navBtn}>
                <ChevronLeft width={16} height={16} /> Previous
              </button>
              <button type="button" disabled={active === questions.length - 1 || busy} onClick={() => setActive(active + 1)} className={navBtn}>
                Next <ChevronRight width={16} height={16} />
              </button>
            </div>
            <button type="button" onClick={confirmFinish} disabled={busy} className={ctaBtn}>
              Submit assessment
            </button>
          </div>

          {error && <p role="alert" className="rounded-xl border border-hard/30 bg-hard/10 px-4 py-3 text-sm text-hard">{error} Your answers are still on this page, so you can try again.</p>}
        </div>
      </div>

      {/* Full-screen state while answers are saved and evaluated */}
      {busy && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-50 grid place-items-center bg-bg/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 text-center shadow-2xl">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent"><Spinner size={28} /></span>
            <h2 className="mt-5 text-lg font-semibold">{phase === 'saving' ? 'Saving your answers' : 'Evaluating your answers'}</h2>
            <p className="mt-1 text-sm text-muted">{progress}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-line/60" aria-hidden="true">
              <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${evalPct}%` }} />
            </div>
            <p className="mt-4 text-xs text-muted">Please keep this page open. You will see your results automatically.</p>
          </div>
        </div>
      )}
    </div>
  );
}