'use client';

import { useEffect, useState } from 'react';
import Popup from './Popup';

const PRESETS = [1, 2, 3, 4, 5, 10];
const MIN_PER_DAY = 1;
const MAX_PER_DAY = 50;
const STORAGE_KEY = 'buncho-daily-target';

const clamp = (n) => Math.min(MAX_PER_DAY, Math.max(MIN_PER_DAY, n));
const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const formatDate = (d) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);

// Friendly length of time: 9 days, 5 wk 2 d, ~4.5 months
function duration(days) {
  if (days < 14) return null; // the big number already says it
  if (days < 60) {
    const w = Math.floor(days / 7);
    const d = days % 7;
    return d ? `${w} wk ${d} d` : `${w} weeks`;
  }
  return `~${(days / 30.4).toFixed(1).replace(/\.0$/, '')} months`;
}

/**
 * Pace planner: a slim bar (title + button) that opens the full planner in a popup.
 * Questions left divided by a daily target = days to finish.
 * State lives here, so the chosen target is kept while the popup is closed.
 */
export default function PacePlanner({ remaining, total, signedIn }) {
  const [perDay, setPerDay] = useState(4);
  const [today, setToday] = useState(null); // set after mount so server and browser markup match

  useEffect(() => {
    setToday(new Date());
    try {
      const saved = parseInt(localStorage.getItem(STORAGE_KEY) ?? '', 10);
      if (saved) setPerDay(clamp(saved));
    } catch {
      /* storage blocked: keep the default */
    }
  }, []);

  const choose = (n) => {
    const v = clamp(Number.isFinite(n) ? n : MIN_PER_DAY);
    setPerDay(v);
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      /* ignore */
    }
  };

  const left = signedIn ? remaining : total;
  if (!total) return null;

  if (left <= 0) {
    return (
      <section
        aria-label="Daily pace planner"
        className="rounded-2xl border border-line bg-gradient-to-br from-accent-soft to-surface px-4 py-3 sm:px-5"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Pace planner</p>
        <h2 className="text-base font-semibold">You have solved every question. Nothing left to plan.</h2>
      </section>
    );
  }

  const days = Math.ceil(left / perDay);
  const finish = today ? formatDate(addDays(today, days)) : null;
  const long = duration(days);
  const perWeek = perDay * 7;

  const body = (
    <div>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        {/* Left: custom target */}
        <div className="rounded-xl border border-line bg-surface-2/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="pace-range" className="text-sm font-medium">Your own target</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => choose(perDay - 1)}
                disabled={perDay <= MIN_PER_DAY}
                aria-label="One question less per day"
                className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface text-lg leading-none hover:bg-surface-2 disabled:opacity-40"
              >
                −
              </button>
              <span className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums">{perDay} / day</span>
              <button
                type="button"
                onClick={() => choose(perDay + 1)}
                disabled={perDay >= MAX_PER_DAY}
                aria-label="One question more per day"
                className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface text-lg leading-none hover:bg-surface-2 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
          <input
            id="pace-range"
            type="range"
            min={MIN_PER_DAY}
            max={MAX_PER_DAY}
            value={perDay}
            onChange={(e) => choose(parseInt(e.target.value, 10))}
            className="mt-3 w-full accent-accent"
          />
          <div className="mt-1 flex justify-between text-[0.7rem] text-muted tabular-nums">
            <span>{MIN_PER_DAY}</span>
            <span>{MAX_PER_DAY} per day</span>
          </div>
        </div>

        {/* Right: the answer */}
        <div className="rounded-2xl border border-accent/40 bg-surface p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            At {perDay} question{perDay === 1 ? '' : 's'} a day
          </p>
          <p className="mt-2 flex items-baseline justify-center gap-2">
            <span className="text-5xl font-semibold leading-none tracking-tight text-accent tabular-nums">
              {days.toLocaleString('en-IN')}
            </span>
            <span className="text-lg font-semibold">{days === 1 ? 'day' : 'days'}</span>
          </p>
          {long && <p className="mt-1 text-sm font-medium text-muted">{long} to finish everything</p>}

          <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-xs tabular-nums text-muted">
            {left} left ÷ {perDay} per day ={' '}
            <span className="font-semibold text-ink">{days} {days === 1 ? 'day' : 'days'}</span>
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-left">
            <div className="rounded-lg border border-line px-3 py-2">
              <p className="text-[0.7rem] uppercase tracking-wider text-muted">Done by</p>
              <p className="mt-0.5 min-h-[1.25rem] text-sm font-semibold">{finish ?? ''}</p>
            </div>
            <div className="rounded-lg border border-line px-3 py-2">
              <p className="text-[0.7rem] uppercase tracking-wider text-muted">Per week</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{perWeek} questions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick targets */}
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Compare quick targets</p>
        <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {PRESETS.map((n) => {
            const d = Math.ceil(left / n);
            const on = perDay === n;
            return (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => choose(n)}
                  aria-pressed={on}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    on ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface hover:border-muted hover:bg-surface-2'
                  }`}
                >
                  <span className="block text-sm font-semibold">{n} / day</span>
                  <span className={`mt-1 block text-xl font-semibold leading-none tabular-nums ${on ? '' : 'text-accent'}`}>
                    {d.toLocaleString('en-IN')} <span className="text-xs font-medium">{d === 1 ? 'day' : 'days'}</span>
                  </span>
                  <span className={`mt-1 block text-[0.7rem] ${on ? 'opacity-80' : 'text-muted'}`}>
                    {duration(d) ?? 'quick win'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

      return (
    <section
      aria-label="Daily pace planner"
      className="flex h-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 sm:px-5"
    >
      <div className="min-w-0">
        <p className="hidden text-xs font-semibold uppercase tracking-widest text-accent sm:block">Pace planner</p>
        <h2 className="text-sm font-semibold leading-snug tracking-tight sm:text-lg">How fast do you want to finish?</h2>
      </div>

      <Popup
        wide
        buttonLabel="Plan my pace"
        buttonClassName="h-10 shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink hover:opacity-90"
        title="Pace planner"
        subtitle={
          signedIn
            ? `You have ${left} questions left to solve. Pick a daily target.`
            : `The library has ${left} questions. Pick a daily target.`
        }
      >
        {body}
      </Popup>
    </section>
  );
}