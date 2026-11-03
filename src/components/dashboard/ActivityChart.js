'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

const DAY = 86400000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_TOPICS = 4; // topic chips shown in the hover card before "+N more"
const NO_TOPICS = {}; // stable reference so useMemo does not re-run on every render

// bucket = days per point (7 = one point per week)
const RANGES = [
  { id: '6m', label: '6 Months', long: 'last 6 months', days: 182, bucket: 7 },
  { id: '3m', label: '3 Months', long: 'last 3 months', days: 91, bucket: 7 },
  { id: '30d', label: '30 Days', long: 'last 30 days', days: 30, bucket: 1 },
  { id: '7d', label: '7 Days', long: 'last 7 days', days: 7, bucket: 1 },
];

const parse = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const keyOf = (ms) => new Date(ms).toISOString().slice(0, 10);
const fmt = (ms) => {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};
const fmtYear = (ms) => `${fmt(ms)}, ${new Date(ms).getUTCFullYear()}`;

function buildSeries(activeDays, dayTopics, todayKey, range) {
  const end = parse(todayKey);
  const n = Math.ceil(range.days / range.bucket);
  const dateAt = (j) => end - (range.days - 1 - j) * DAY; // j = 0 is the oldest day shown
  return Array.from({ length: n }, (_, i) => {
    const from = i * range.bucket;
    const to = Math.min(range.days - 1, from + range.bucket - 1);
    let value = 0;
    const counts = {};
    for (let j = from; j <= to; j += 1) {
      const key = keyOf(dateAt(j));
      value += activeDays[key] ?? 0;
      // dayTopics[key] is a list of topic names, one per solved problem
      for (const t of dayTopics[key] ?? []) counts[t] = (counts[t] ?? 0) + 1;
    }
    // Most-solved topic first, then alphabetical
    const topics = Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
    const start = dateAt(from);
    const last = dateAt(to);
    const single = from === to;
    return {
      value,
      topics,
      label: fmt(start),
      full: single ? fmt(start) : `${fmt(start)} – ${fmt(last)}`,
      // Used by the hover card
      eyebrow: single ? (last === end ? 'Today' : WEEKDAYS[new Date(start).getUTCDay()]) : last === end ? 'This week' : 'Week',
      dateLine: single ? fmtYear(start) : `${fmt(start)} – ${fmtYear(last)}`,
    };
  });
}

// Smooth curve through the points with flat tangents at each point, so it never dips below the data.
function smoothPath(pts) {
  if (!pts.length) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    const mx = (a.x + b.x) / 2;
    d += ` C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
  }
  return d;
}

// Full size: PAD.t is empty headroom above the highest gridline, so the (taller) hover card always fits above the point.
const DIM_FULL = { W: 640, H: 430, PAD: { l: 34, r: 14, t: 190, b: 30 } };
// Compact: a wide, flat chart; the hover card sits beside the point instead of above it.
const DIM_COMPACT = { W: 960, H: 210, PAD: { l: 34, r: 14, t: 14, b: 26 } };

/**
 * Line graph of problems solved over time (7 days, 30 days, 3 months, 6 months).
 * activeDays: { 'YYYY-MM-DD': count }, todayKey: today in the same format (India time).
 * dayTopics (optional): { 'YYYY-MM-DD': ['Arrays', 'Arrays', 'Dynamic Programming'] }, one topic name per solved problem.
 */
export default function ActivityChart({ activeDays, dayTopics = NO_TOPICS, todayKey, title = 'Activity', color = 'var(--accent)', compact = false }) {
  const base = compact ? DIM_COMPACT : DIM_FULL;
  const { W, PAD } = base;

  // Compact: when the card is stretched taller than the chart's natural height (desktop dashboard,
  // both columns equal height), grow the chart to fill it. The viewBox follows the real box shape,
  // so nothing gets squashed.
  const boxRef = useRef(null);
  const [boxH, setBoxH] = useState(0);
  useEffect(() => {
    if (!compact || !boxRef.current) return undefined;
    const el = boxRef.current;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBoxH(r.width > 0 ? Math.round((W * r.height) / r.width) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [compact, W]);
  const H = compact ? Math.max(base.H, Math.min(boxH, 700)) : base.H;

  const gradId = `area-${useId().replace(/:/g, '')}`;
  const [rangeId, setRangeId] = useState('7d');
  const [hover, setHover] = useState(null);
  const range = RANGES.find((r) => r.id === rangeId);

  const series = useMemo(() => buildSeries(activeDays, dayTopics, todayKey, range), [activeDays, dayTopics, todayKey, range]);
  const total = series.reduce((a, s) => a + s.value, 0);
  const max = Math.max(0, ...series.map((s) => s.value));
  const yMax = max <= 4 ? 4 : Math.ceil(max / 4) * 4;

  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const slot = innerW / series.length;
  const labelStep = Math.ceil(series.length / 7);
  const baseline = PAD.t + innerH;
  const y = (v) => baseline - (v / yMax) * innerH;
  const x = (i) => PAD.l + slot * i + slot / 2;

  const pts = series.map((s, i) => ({ x: x(i), y: y(s.value) }));
  const line = smoothPath(pts);
  const area = pts.length ? `${line} L${pts[pts.length - 1].x},${baseline} L${pts[0].x},${baseline} Z` : '';
  const showDots = series.length <= 31;
  const active = hover !== null ? series[hover] : null;

  // Hover card position (percent of the chart box, which matches the SVG viewBox).
  // Full size: the card is placed ABOVE the point. Compact: it sits BESIDE the point.
  const tipLeft = hover !== null ? (pts[hover].x / W) * 100 : 0;
  const tipTopRaw = hover !== null ? (pts[hover].y / H) * 100 : 0;
  const tipTop = compact ? Math.min(70, Math.max(30, tipTopRaw)) : tipTopRaw;
  const tipShiftX = tipLeft < 16 ? '-12%' : tipLeft > 84 ? '-88%' : '-50%';
  const tipTransform = compact
    ? `translate(${tipLeft > 50 ? 'calc(-100% - 16px)' : '16px'}, -50%)` // beside the dot
    : `translate(${tipShiftX}, calc(-100% - 20px))`; // above the dot

  const unit = range.bucket === 1 ? 'day' : 'week';
  const prev = hover !== null && hover > 0 ? series[hover - 1] : null;
  const diff = active && prev ? active.value - prev.value : null;

  const shownTopics = active ? active.topics.slice(0, MAX_TOPICS) : [];
  const extraTopics = active ? Math.max(0, active.topics.length - MAX_TOPICS) : 0;

  return (
    <section aria-label={title} className={compact ? 'card flex flex-col p-4' : 'card p-4 sm:p-6'}>
      <div className={`flex flex-col ${compact ? 'gap-2 sm:flex-row sm:items-center sm:justify-between' : 'gap-4 sm:flex-row sm:items-start sm:justify-between'}`}>
        <div className="min-w-0">
          <div className={compact ? 'flex flex-wrap items-baseline gap-x-2' : ''}>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className={`${compact ? '' : 'mt-1'} text-sm text-muted`}>Total of {range.long}</p>
          </div>
          <p className={`${compact ? 'mt-1' : 'mt-3'} flex items-baseline gap-2`}>
            <span className={`${compact ? 'text-2xl' : 'text-4xl'} font-semibold tabular-nums tracking-tight`} style={{ color }}>
              {active ? active.value : total}
            </span>
            <span className="text-sm text-muted">
              {active ? `${active.value === 1 ? 'problem' : 'problems'} · ${active.full}` : total === 1 ? 'problem solved' : 'problems solved'}
            </span>
          </p>
        </div>

        <div role="tablist" aria-label="Time range" className="grid w-full shrink-0 grid-cols-4 self-start rounded-xl border border-line bg-surface-2/60 p-1 sm:flex sm:w-auto">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={r.id === rangeId}
              onClick={() => {
                setRangeId(r.id);
                setHover(null);
              }}
              className={`whitespace-nowrap rounded-lg px-1 py-2 text-center text-xs font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-sm ${
                r.id === rangeId ? 'bg-accent text-accent-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={boxRef}
        className={`relative ${compact ? 'mt-2 flex-1' : 'mt-4 sm:mt-5'}`}
        style={compact ? { aspectRatio: `${DIM_COMPACT.W} / ${DIM_COMPACT.H}` } : undefined}
        onMouseLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={compact ? 'absolute inset-0 h-full w-full' : 'h-auto w-full'}
          role="img"
          aria-label={`Line graph: ${total} problems solved in the ${range.long}`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid + y labels */}
          {[0, 1, 2, 3, 4].map((t) => {
            const v = (yMax / 4) * t;
            return (
              <g key={t}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="var(--line)"
                  strokeWidth={t === 0 ? 1.5 : 1}
                  strokeDasharray={t === 0 ? undefined : '3 5'}
                />
                <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
                  {v}
                </text>
              </g>
            );
          })}

          {/* x labels */}
          {series.map((s, i) =>
            i % labelStep === 0 ? (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">
                {s.label}
              </text>
            ) : null,
          )}

          {/* area + line */}
          {total > 0 && <path d={area} fill={`url(#${gradId})`} />}
          <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* hover guide */}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={baseline} stroke={color} strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 4" />
          )}

          {/* dots */}
          {series.map((s, i) => {
            const isActive = hover === i;
            if (!showDots && !isActive) return null;
            return (
              <g key={i}>
                {isActive && <circle cx={x(i)} cy={y(s.value)} r="12" fill={color} fillOpacity="0.16" />}
                <circle
                  cx={x(i)}
                  cy={y(s.value)}
                  r={isActive ? 6 : series.length > 14 ? 2.5 : 4}
                  fill={isActive ? color : 'var(--surface)'}
                  stroke={color}
                  strokeWidth={isActive ? 3 : 2}
                />
              </g>
            );
          })}

          {/* full-height hit areas for hover / touch (include the headroom above the chart) */}
          {series.map((s, i) => (
            <rect
              key={i}
              x={PAD.l + slot * i}
              y={0}
              width={slot}
              height={H - PAD.b}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onTouchStart={() => setHover(i)}
            />
          ))}
        </svg>

        {/* Hover card (replaces the browser's plain black tooltip) */}
        {active && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 w-max min-w-[10.5rem] max-w-[16rem] rounded-xl border border-line bg-surface/95 px-3.5 py-3 shadow-xl shadow-black/10 backdrop-blur-md dark:shadow-black/50"
            style={{
              left: `${tipLeft}%`,
              top: `${tipTop}%`,
              transform: tipTransform,
              transition: 'left 120ms ease-out, top 120ms ease-out',
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{active.eyebrow}</span>
              <span className="text-[11px] font-medium text-muted">{active.dateLine}</span>
            </div>

            <div className="mt-2 flex items-center gap-2.5">
              <span aria-hidden="true" className="h-8 w-1 shrink-0 rounded-full" style={{ background: color }} />
              <div className="leading-tight">
                <p className="text-2xl font-semibold tabular-nums tracking-tight">{active.value}</p>
                <p className="text-xs text-muted">{active.value === 1 ? 'problem solved' : 'problems solved'}</p>
              </div>
            </div>

            {/* Topics solved on this day / week */}
            {shownTopics.length > 0 && (
              <div className="mt-2.5 border-t border-line pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Topics solved</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {shownTopics.map((t) => (
                    <li
                      key={t.name}
                      className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent"
                    >
                      {t.name}
                      {t.count > 1 && <span className="tabular-nums opacity-70">×{t.count}</span>}
                    </li>
                  ))}
                  {extraTopics > 0 && (
                    <li className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
                      +{extraTopics} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {diff !== null && (
              <p className="mt-2.5 border-t border-line pt-2 text-xs font-medium" style={{ color: diff > 0 ? color : 'var(--muted)' }}>
                {diff > 0 ? `▲ ${diff} more` : diff < 0 ? `▼ ${Math.abs(diff)} fewer` : 'No change'} than previous {unit}
              </p>
            )}
          </div>
        )}

        {total === 0 && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center pb-8 text-sm text-muted">
            No activity in this period yet.
          </p>
        )}
      </div>
    </section>
  );
}