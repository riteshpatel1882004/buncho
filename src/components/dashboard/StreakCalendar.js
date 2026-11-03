'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Flame } from '@/components/icons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const pad = (n) => String(n).padStart(2, '0');

function level(count) {
  if (count >= 4) return 'bg-accent text-accent-ink';
  if (count >= 2) return 'bg-accent/45';
  if (count === 1) return 'bg-accent/20';
  return '';
}

/**
 * Month calendar with the streak on top. Each day shows how many problems were solved;
 * days with activity are shaded, today is outlined.
 * activeDays: { 'YYYY-MM-DD': count }, todayKey: today's date in the same format (India time).
 */
export default function StreakCalendar({ activeDays, todayKey, streak, compact = false }) {
  const [ty, tm] = todayKey.split('-').map(Number);
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const atCurrent = view.y === ty && view.m === tm - 1;

  const shift = (delta) =>
    setView(({ y, m }) => {
      const t = y * 12 + m + delta;
      return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
    });

  const firstWeekday = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const prefix = `${view.y}-${pad(view.m + 1)}-`;

  let monthTotal = 0;
  let monthActive = 0;
  for (let d = 1; d <= daysInMonth; d += 1) {
    const c = activeDays[prefix + pad(d)] ?? 0;
    monthTotal += c;
    if (c) monthActive += 1;
  }

  return (
    <section aria-label="Streak calendar" className={compact ? 'card p-4' : 'card p-5 sm:p-6'}>
      {/* Streak */}
      <div className="flex items-center justify-center gap-2">
        <Flame width={18} height={18} className={streak ? 'text-orange-500' : 'text-muted'} />
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Streak</span>
        <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-orange-500">
          {streak} day{streak === 1 ? '' : 's'}
        </span>
      </div>

      {/* Month switcher */}
      <div className={`${compact ? 'mt-1.5' : 'mt-3'} flex items-center justify-between`}>
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ChevronLeft width={18} height={18} />
        </button>
        <h2 className={`${compact ? 'text-base' : 'text-lg'} font-semibold tracking-tight`}>
          {MONTHS[view.m]} {view.y}
        </h2>
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={atCurrent}
          aria-label="Next month"
          className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight width={18} height={18} />
        </button>
      </div>

      {/* Weekdays */}
      <div className={`${compact ? 'mt-2' : 'mt-4'} grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted`}>
        {WEEK.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      {/* Days */}
      <div className={`${compact ? 'mt-1' : 'mt-2'} grid grid-cols-7 gap-1`}>
        {cells.map((day, i) => {
          if (day === null) return <span key={`b${i}`} />;
          const key = prefix + pad(day);
          const count = activeDays[key] ?? 0;
          const isToday = key === todayKey;
          const future = key > todayKey;
          return (
            <div
              key={key}
              title={future ? key : `${key}: ${count} ${count === 1 ? 'problem' : 'problems'} solved`}
              className={`flex items-center justify-center ${compact ? 'h-7 flex-row gap-0.5 rounded-lg text-xs' : 'aspect-square flex-col rounded-xl text-sm'} font-semibold leading-none tabular-nums ${level(count)} ${
                future ? 'text-muted/40' : count >= 4 ? '' : count ? 'text-ink' : 'text-muted'
              } ${isToday ? 'ring-2 ring-orange-500' : ''}`}
            >
              <span>{day}</span>
              {count > 0 && <span className={`${compact ? '' : 'mt-0.5'} text-[0.6rem] font-bold opacity-80`}>{compact ? `·${count}` : count}</span>}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`${compact ? 'mt-2.5 pt-2.5' : 'mt-4 pt-4'} flex items-center justify-between border-t border-line text-xs text-muted`}>
        <span>
          <span className="font-semibold text-ink">{monthTotal}</span> problem{monthTotal === 1 ? '' : 's'} ·{' '}
          <span className="font-semibold text-ink">{monthActive}</span> active day{monthActive === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-1" aria-hidden="true">
          Less
          <i className="h-3 w-3 rounded-[4px] bg-surface-2" />
          <i className="h-3 w-3 rounded-[4px] bg-accent/20" />
          <i className="h-3 w-3 rounded-[4px] bg-accent/45" />
          <i className="h-3 w-3 rounded-[4px] bg-accent" />
          More
        </span>
      </div>
    </section>
  );
}