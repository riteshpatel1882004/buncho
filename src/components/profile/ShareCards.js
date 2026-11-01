'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import BadgeArt from '@/components/badges/BadgeArt';
import { sortEarned } from '@/lib/badges';

/* ------------------------------------------------------------------ */
/* Share cards (dashboard). A gallery of achievement cards: unlocked   */
/* ones can be downloaded / shared, upcoming ones are previewable but  */
/* locked. Each card can be drawn in 5 designs, any colour, 2 sizes.   */
/* The same SVG is the preview and the PNG, no external fonts/images.  */
/* ------------------------------------------------------------------ */

const FONT = "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export const DESIGNS = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'paper', label: 'Paper' },
  { id: 'neon', label: 'Neon' },
  { id: 'bold', label: 'Bold' },
  { id: 'minimal', label: 'Minimal' },
];

const SWATCHES = [
  { name: 'Emerald', hex: '#12b76a' },
  { name: 'Sapphire', hex: '#2e7cf6' },
  { name: 'Amethyst', hex: '#9b5de5' },
  { name: 'Ember', hex: '#ff7a1a' },
  { name: 'Ruby', hex: '#f43f5e' },
  { name: 'Gold', hex: '#f5b301' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Pink', hex: '#ec4899' },
];

const LAYOUT = {
  landscape: { label: 'Landscape', size: '1200 x 630', W: 1200, H: 630, vx: 300, vy: 318, vs: 1, tx: 610, ty: 215, anchor: 'start', wrapN: 30, maxLines: 3, tw: 540 },
  square: { label: 'Square', size: '1080 x 1080', W: 1080, H: 1080, vx: 540, vy: 410, vs: 1.05, tx: 540, ty: 740, anchor: 'middle', wrapN: 46, maxLines: 2, tw: 900 },
};

/* ------------------------------ helpers ------------------------------ */

const hex2rgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgb2hex = (c) => `#${c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => {
  const A = hex2rgb(a);
  const B = hex2rgb(b);
  return rgb2hex(A.map((v, i) => v + (B[i] - v) * t));
};

function wrap(str, n, max) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (cur && `${cur} ${w}`.length > n) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  if (lines.length > max) {
    lines.length = max;
    lines[max - 1] = `${lines[max - 1].replace(/\s*\S*$/, '')}…`;
  }
  return lines;
}

const fit = (text, maxW, max, min = 40) => Math.max(min, Math.min(max, Math.floor(maxW / (String(text).length * 0.56))));

function Spark({ x, y, s, fill, o = 0.8 }) {
  const k = s * 0.22;
  return (
    <polygon
      opacity={o}
      fill={fill}
      points={`${x},${y - s} ${x + k},${y - k} ${x + s},${y} ${x + k},${y + k} ${x},${y + s} ${x - k},${y + k} ${x - s},${y} ${x - k},${y - k}`}
    />
  );
}

/** Colours for each design, derived from the one colour the user picked. */
export function palette(design, color) {
  const base = '#05070d';
  const ink = '#0b1220';
  switch (design) {
    case 'paper':
      return {
        dark: false, bg: [mix('#ffffff', color, 0.04), mix('#ffffff', color, 0.15), mix('#ffffff', color, 0.32)],
        text: ink, soft: mix(ink, color, 0.3), hi: mix(color, '#000000', 0.2), track: 'rgba(11,18,32,0.10)', ringFill: 'rgba(255,255,255,0.6)',
        line: ink, lineO: 0.12, dot: ink, dotO: 0.1, inner: '#ffffff', onBrand: '#ffffff', brandA: mix(color, '#ffffff', 0.15), brandB: mix(color, '#000000', 0.2),
        pillFill: '#ffffff', pillO: 0.85, pillStroke: ink, glowO: 0.3, frame: ink, frameO: 0.14,
      };
    case 'neon':
      return {
        dark: true, bg: ['#02030a', mix('#02030a', color, 0.14), '#02030a'],
        text: '#ffffff', soft: mix(color, '#ffffff', 0.6), hi: mix(color, '#ffffff', 0.2), track: 'rgba(255,255,255,0.1)', ringFill: 'rgba(0,0,0,0.4)',
        line: color, lineO: 0.55, dot: color, dotO: 0, inner: '#05060f', onBrand: '#02030a', brandA: mix(color, '#ffffff', 0.35), brandB: color,
        pillFill: '#000000', pillO: 0.6, pillStroke: color, glowO: 0.55, frame: color, frameO: 0.9,
      };
    case 'bold':
      return {
        dark: true, bg: [mix(color, '#ffffff', 0.2), color, mix(color, '#000000', 0.5)],
        text: '#ffffff', soft: mix(color, '#ffffff', 0.88), hi: '#ffffff', track: 'rgba(0,0,0,0.22)', ringFill: 'rgba(0,0,0,0.22)',
        line: '#ffffff', lineO: 0.2, dot: '#ffffff', dotO: 0.08, inner: mix(color, '#000000', 0.45), onBrand: mix(color, '#000000', 0.6), brandA: '#ffffff', brandB: mix(color, '#ffffff', 0.6),
        pillFill: '#000000', pillO: 0.3, pillStroke: '#ffffff', glowO: 0.25, frame: '#ffffff', frameO: 0.25,
      };
    case 'minimal':
      return {
        dark: true, bg: ['#0b0d12', '#0b0d12', '#0b0d12'],
        text: '#f5f7fb', soft: '#9aa3b2', hi: color, track: 'rgba(255,255,255,0.08)', ringFill: 'rgba(255,255,255,0.03)',
        line: '#ffffff', lineO: 0.07, dot: '#ffffff', dotO: 0, inner: '#0b0d12', onBrand: '#06100a', brandA: mix(color, '#ffffff', 0.3), brandB: color,
        pillFill: '#000000', pillO: 0, pillStroke: '#ffffff', glowO: 0.2, frame: '#ffffff', frameO: 0.1,
      };
    default:
      return {
        dark: true, bg: [mix(base, color, 0.44), mix(base, color, 0.14), base],
        text: '#ffffff', soft: mix(color, '#ffffff', 0.78), hi: mix(color, '#ffffff', 0.4), track: 'rgba(255,255,255,0.12)', ringFill: 'rgba(0,0,0,0.25)',
        line: '#ffffff', lineO: 0.1, dot: '#ffffff', dotO: 0.14, inner: mix(base, color, 0.14), onBrand: '#06100a', brandA: mix(color, '#ffffff', 0.4), brandB: color,
        pillFill: '#000000', pillO: 0.38, pillStroke: '#ffffff', glowO: 0.6, frame: '#ffffff', frameO: 0.14,
      };
  }
}

/* ------------------------------- the card ------------------------------- */

export function ShareCard({ svgRef, type, fmt, color, design, d, featured, locked }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (k) => `${uid}${k}`;
  const L = LAYOUT[fmt];
  const { W, H } = L;
  const p = palette(design, color);
  const A = L.anchor;
  const isSquare = fmt === 'square';
  const topBadge = d.earned[0] ?? null;
  const hasEarned = d.earned.length > 0;

  /* ----- text for each card type ----- */
  let eyebrow = '';
  let title = '';
  let sub = '';
  if (type === 'solved') {
    eyebrow = 'ACHIEVEMENT';
    title = 'Problems solved';
    sub = d.next ? `${d.solved} of ${d.total} problems. Only ${d.toNext} more to unlock ${d.next}.` : `${d.solved} of ${d.total} problems. Every milestone unlocked.`;
  } else if (type === 'badge' && featured) {
    eyebrow = locked ? 'UP NEXT' : 'BADGE EARNED';
    title = featured.name;
    sub = `${featured.stars > 0 ? `Level ${featured.stars} of 3. ` : ''}${featured.desc}.`;
  } else if (type === 'streak') {
    eyebrow = d.streak ? 'ON FIRE' : 'GETTING STARTED';
    title = d.streak ? `${d.streak} day streak` : 'Streak starts today';
    sub = 'Practising AI, ML and GenAI interview questions every single day.';
  } else if (type === 'collection') {
    eyebrow = 'BADGE COLLECTION';
    title = `${d.earned.length} badge${d.earned.length === 1 ? '' : 's'}`;
    sub = topBadge ? `Top badge: ${topBadge.name}. Earned by solving real AI interview problems.` : 'Earned by solving real AI interview problems.';
  } else {
    eyebrow = 'AI INTERVIEW PROFILE';
    title = d.name;
  }
  const ty = type === 'profile' && isSquare ? 690 : L.ty;
  const titleFs = fit(title, L.tw, isSquare ? 104 : 88, type === 'profile' ? 40 : 44);
  const titleY = ty + 28 + titleFs * 0.85;
  const subLines = wrap(sub, L.wrapN, L.maxLines);

  const stats = [
    { v: d.solved, l: 'Solved' },
    { v: d.streak, l: 'Day streak' },
    { v: d.avgScore ?? '–', l: 'Avg AI score' },
    { v: d.days, l: 'Days active' },
  ];

  /* ----- the big visual ----- */
  let visual = null;
  if (type === 'solved') {
    const R = 150;
    const C = 2 * Math.PI * R;
    const frac = Math.max(0.035, Math.min(1, d.solved / Math.max(1, d.total)));
    visual = (
      <g>
        <circle r={R} fill={p.ringFill} stroke={p.track} strokeWidth="26" />
        <circle r={R} fill="none" stroke={`url(#${id('ring')})`} strokeWidth="26" strokeLinecap="round" strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90)" />
        <text y="22" textAnchor="middle" fontFamily={FONT} fontWeight="800" fontSize={String(d.solved).length > 3 ? 104 : 126} fill={p.text}>{d.solved}</text>
        <text y="66" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="26" fill={p.soft} opacity="0.9">{`of ${d.total} problems`}</text>
      </g>
    );
  } else if (type === 'badge' && featured) {
    visual = (
      <g transform="translate(-175 -175)">
        <BadgeArt badge={{ ...featured, earned: !locked }} size={350} animate={false} />
      </g>
    );
  } else if (type === 'streak') {
    visual = (
      <g>
        <g transform="translate(0 -10) scale(17) translate(-12 -10.5)">
          <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4 .2 1.2.8 2 1.8 2.2C10.5 8 11 5.5 12 3Z" fill={`url(#${id('fire')})`} />
        </g>
        <text y="118" textAnchor="middle" fontFamily={FONT} fontWeight="800" fontSize="104" fill="#fff" stroke="rgba(120,20,0,0.55)" strokeWidth="7" paintOrder="stroke" strokeLinejoin="round">{d.streak}</text>
      </g>
    );
  } else if (type === 'collection') {
    const list = (hasEarned ? d.earned : d.sample).slice(0, 6);
    const per = list.length > 3 ? Math.ceil(list.length / 2) : list.length;
    const rows = [list.slice(0, per), list.slice(per)].filter((r) => r.length);
    const S = 150;
    const gap = 22;
    const totalH = rows.length * S + (rows.length - 1) * gap;
    visual = (
      <g>
        {rows.map((r, ri) => {
          const rw = r.length * S + (r.length - 1) * gap;
          return r.map((b, i) => (
            <g key={b.id} transform={`translate(${-rw / 2 + i * (S + gap)} ${-totalH / 2 + ri * (S + gap)})`}>
              <BadgeArt badge={{ ...b, earned: hasEarned }} size={S} animate={false} />
            </g>
          ));
        })}
      </g>
    );
  } else if (type === 'profile') {
    visual = (
      <g>
        <circle r="150" fill={`url(#${id('ring')})`} />
        <circle r="136" fill={p.inner} />
        <text y="48" textAnchor="middle" fontFamily={FONT} fontWeight="800" fontSize="150" fill={p.text}>{d.name.charAt(0).toUpperCase()}</text>
        {topBadge && (
          <g transform="translate(62 62)">
            <circle cx="55" cy="55" r="62" fill={p.inner} />
            <BadgeArt badge={{ ...topBadge, earned: true }} size={110} animate={false} />
          </g>
        )}
      </g>
    );
  }

  const sparks = [
    [0.07, 0.2, 14], [0.46, 0.1, 10], [0.93, 0.14, 18], [0.55, 0.9, 12], [0.96, 0.62, 12], [0.04, 0.78, 10],
  ];

  return (
    <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${d.name} share card`} className="block h-auto w-full">
      <defs>
        <linearGradient id={id('bg')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.bg[0]} />
          <stop offset="55%" stopColor={p.bg[1]} />
          <stop offset="100%" stopColor={p.bg[2]} />
        </linearGradient>
        <radialGradient id={id('glow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={color} stopOpacity={p.glowO} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('corner')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={p.hi} stopOpacity="0.38" />
          <stop offset="100%" stopColor={p.hi} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('ring')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.brandA} />
          <stop offset="100%" stopColor={p.brandB} />
        </linearGradient>
        <linearGradient id={id('fire')} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#ffd84d" />
          <stop offset="55%" stopColor="#ff8a1f" />
          <stop offset="100%" stopColor="#e5361b" />
        </linearGradient>
        <linearGradient id={id('horizon')} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <pattern id={id('dots')} width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill={p.dot} opacity={p.dotO} />
        </pattern>
        <pattern id={id('grid')} width="54" height="54" patternUnits="userSpaceOnUse">
          <path d="M54 0H0V54" fill="none" stroke={color} strokeOpacity="0.2" strokeWidth="1.2" />
        </pattern>
        <pattern id={id('stripes')} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="14" height="34" fill="#fff" opacity="0.07" />
        </pattern>
      </defs>

      {/* background, one per design */}
      <rect width={W} height={H} fill={`url(#${id('bg')})`} />
      {design === 'aurora' && (
        <>
          <rect width={W} height={H} fill={`url(#${id('dots')})`} />
          <circle cx={W} cy="0" r={isSquare ? 560 : 440} fill={`url(#${id('corner')})`} />
          <circle cx="0" cy={H} r={isSquare ? 480 : 380} fill={`url(#${id('glow')})`} opacity="0.55" />
          <path d={`M0 ${H * 0.72} C ${W * 0.3} ${H * 0.55}, ${W * 0.6} ${H * 0.95}, ${W} ${H * 0.7} L ${W} ${H} L 0 ${H} Z`} fill="#000" opacity="0.18" />
        </>
      )}
      {design === 'paper' && (
        <>
          <rect width={W} height={H} fill={`url(#${id('dots')})`} />
          <circle cx={W * 0.92} cy={H * 0.05} r={isSquare ? 460 : 380} fill={color} opacity="0.16" />
          <circle cx={W * 0.02} cy={H * 0.98} r={isSquare ? 400 : 300} fill={color} opacity="0.14" />
        </>
      )}
      {design === 'neon' && (
        <>
          <rect width={W} height={H} fill={`url(#${id('grid')})`} />
          <rect x="0" y={H * 0.55} width={W} height={H * 0.45} fill={`url(#${id('horizon')})`} opacity="0.55" />
          <circle cx={W} cy="0" r={isSquare ? 520 : 420} fill={`url(#${id('glow')})`} opacity="0.7" />
        </>
      )}
      {design === 'bold' && (
        <>
          <rect width={W} height={H} fill={`url(#${id('stripes')})`} />
          <circle cx={W} cy="0" r={isSquare ? 520 : 400} fill="#fff" opacity="0.12" />
          <circle cx="0" cy={H} r={isSquare ? 420 : 320} fill="#fff" opacity="0.1" />
          <circle cx={W * 0.64} cy={H * 0.95} r={isSquare ? 200 : 170} fill="#000" opacity="0.1" />
        </>
      )}
      {design !== 'minimal' &&
        sparks.map(([fx, fy, s], i) => <Spark key={i} x={W * fx} y={H * fy} s={s} fill={p.soft} o={p.dark ? 0.55 : 0.5} />)}
      {design === 'neon' && <rect x="14" y="14" width={W - 28} height={H - 28} rx="30" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="10" />}
      <rect x="14" y="14" width={W - 28} height={H - 28} rx="30" fill="none" stroke={p.frame} strokeOpacity={p.frameO} strokeWidth={design === 'neon' ? 3 : 2} />

      {/* header: who */}
      <g transform="translate(60 56)">
        <circle cx="26" cy="26" r="26" fill={`url(#${id('ring')})`} />
        <text x="26" y="36" textAnchor="middle" fontFamily={FONT} fontWeight="800" fontSize="28" fill={p.onBrand}>{d.name.charAt(0).toUpperCase()}</text>
        <text x="68" y="24" fontFamily={FONT} fontWeight="700" fontSize="26" fill={p.text}>{d.name}</text>
        <text x="68" y="50" fontFamily={FONT} fontWeight="500" fontSize="20" fill={p.soft} opacity="0.85">{`@${d.username || 'you'}`}</text>
      </g>

      {/* the visual */}
      <g transform={`translate(${L.vx} ${L.vy}) scale(${L.vs})`}>
        <circle r="270" fill={`url(#${id('glow')})`} />
        <circle r="228" fill="none" stroke={p.line} strokeOpacity={p.lineO} strokeWidth="2" strokeDasharray="3 11" />
        <circle r="262" fill="none" stroke={p.line} strokeOpacity={p.lineO * 0.6} strokeWidth="2" />
        {visual}
      </g>

      {/* the words */}
      <text x={L.tx} y={ty} textAnchor={A} fontFamily={FONT} fontWeight="800" fontSize="22" letterSpacing="5" fill={p.hi}>{eyebrow}</text>
      <text x={L.tx} y={titleY} textAnchor={A} fontFamily={FONT} fontWeight="800" fontSize={titleFs} fill={p.text}>{title}</text>
      {type !== 'profile' &&
        subLines.map((line, i) => (
          <text key={i} x={L.tx} y={titleY + 50 + i * 38} textAnchor={A} fontFamily={FONT} fontWeight="500" fontSize="28" fill={p.soft} opacity="0.92">{line}</text>
        ))}
      {type === 'profile' &&
        stats.map((s, i) => {
          const x = isSquare ? 540 + (i - 1.5) * 235 : L.tx + (i % 2) * 270;
          const y = isSquare ? titleY + 95 : titleY + 62 + Math.floor(i / 2) * 100;
          return (
            <g key={s.l}>
              <text x={x} y={y} textAnchor={A} fontFamily={FONT} fontWeight="800" fontSize={isSquare ? 62 : 52} fill={p.text}>{s.v}</text>
              <text x={x} y={y + 32} textAnchor={A} fontFamily={FONT} fontWeight="600" fontSize="21" fill={p.soft} opacity="0.85">{s.l}</text>
            </g>
          );
        })}

      {/* footer: brand */}
      <g transform={`translate(60 ${H - 100})`}>
        <rect width="44" height="44" rx="12" fill={`url(#${id('ring')})`} />
        <text x="22" y="32" textAnchor="middle" fontFamily={FONT} fontWeight="900" fontSize="28" fill={p.onBrand}>B</text>
        <text x="58" y="31" fontFamily={FONT} fontWeight="800" fontSize="30" fill={p.text}>Buncho</text>
      </g>
      <g transform={`translate(${W - 60} ${H - 100})`}>
        <rect x={-(d.display.length * 12.6 + 48)} width={d.display.length * 12.6 + 48} height="44" rx="22" fill={p.pillFill} fillOpacity={p.pillO} stroke={p.pillStroke} strokeOpacity="0.25" />
        <text x={-(d.display.length * 12.6 + 48) / 2} y="30" textAnchor="middle" fontFamily={MONO} fontWeight="700" fontSize="21" fill={p.text}>{d.display}</text>
      </g>
    </svg>
  );
}

/* ----------------------------- export + share ----------------------------- */

async function toPng(svgEl, w, h, scale = 2) {
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  const xml = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  });
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function captionFor(item, d, url) {
  const tail = `\n\nSee my profile: ${url}`;
  if (item.type === 'solved') return `I've solved ${d.solved} AI interview problems on Buncho. Practising AI, ML and GenAI interviews the smart way.${tail}`;
  if (item.type === 'badge') return `I just earned the ${item.badge.name} badge on Buncho for solving real AI interview problems.${tail}`;
  if (item.type === 'streak') return `${d.streak} day practice streak on Buncho. Showing up every day for AI interviews.${tail}`;
  if (item.type === 'collection') return `${d.earned.length} badges earned on Buncho so far. Building my AI interview skills one problem at a time.${tail}`;
  return `My AI interview prep on Buncho: ${d.solved} solved, ${d.streak} day streak.${tail}`;
}

/** What is still missing for a badge, in plain words. */
function hintFor(b, m) {
  if (b.kind === 'milestone') {
    const n = Math.max(0, b.threshold - m.solved);
    return `${n} more solve${n === 1 ? '' : 's'}`;
  }
  switch (b.id) {
    case 'first': return 'Solve your first problem';
    case 'streak7': return `Reach a 7 day streak (now ${m.streak})`;
    case 'streak30': return `Reach a 30 day streak (now ${m.streak})`;
    case 'hard': return `${Math.max(0, 5 - m.hard)} more hard problems`;
    case 'scholar': return m.evals < 5 ? `${5 - m.evals} more AI-scored answers` : 'Raise your average AI score to 80+';
    case 'regular': return `${Math.max(0, 20 - m.activeDays)} more practice days`;
    case 'pro': return 'Upgrade to Pro';
    default: return b.desc;
  }
}

/* --------------------------------- icons --------------------------------- */

const ICON = {
  solved: (<><circle cx="12" cy="12" r="8" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></>),
  streak: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4 .2 1.2.8 2 1.8 2.2C10.5 8 11 5.5 12 3Z" />,
  collection: <path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Zm0 2H4v1a3 3 0 0 0 3 3m10-4h3v1a3 3 0 0 1-3 3" />,
  profile: (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  lock: (<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  prev: <path d="m15 5-7 7 7 7" />,
  next: <path d="m9 5 7 7-7 7" />,
};

function Icon({ name, size = 18, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {ICON[name]}
    </svg>
  );
}

/* --------------------------------- the UI --------------------------------- */

export default function ShareCards({ name, username, url, metrics, badges, total, defaultColor }) {
  const [active, setActive] = useState(null); // index into items, or null when the popup is closed
  const [design, setDesign] = useState('aurora');
  const [fmt, setFmt] = useState('landscape');
  const [color, setColor] = useState(defaultColor);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const svgRef = useRef(null);
  const dialogRef = useRef(null);

  // Remember the choices on this device (best effort)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('buncho-share-style') ?? '{}');
      if (saved.design && DESIGNS.some((x) => x.id === saved.design)) setDesign(saved.design);
      if (saved.fmt && LAYOUT[saved.fmt]) setFmt(saved.fmt);
      if (/^#[0-9a-f]{6}$/i.test(saved.color ?? '')) setColor(saved.color);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('buncho-share-style', JSON.stringify({ design, fmt, color }));
    } catch {}
  }, [design, fmt, color]);

  const earned = sortEarned(badges);
  const next = badges.find((b) => b.kind === 'milestone' && !b.earned) ?? null;
  const d = {
    name,
    username,
    solved: metrics.solved,
    total,
    streak: metrics.streak,
    avgScore: metrics.evals ? metrics.avgScore : null,
    days: metrics.activeDays,
    earned,
    sample: badges.filter((b) => b.kind === 'milestone').slice(0, 6),
    next: next?.name ?? null,
    toNext: next ? Math.max(0, next.threshold - metrics.solved) : 0,
    display: url ? url.replace(/^https?:\/\//, '') : 'buncho.live',
  };

  /* every card in the gallery: general cards first, then one per badge */
  const items = [
    { key: 'solved', type: 'solved', label: 'Problems solved', locked: metrics.solved < 1, hint: 'Solve your first problem' },
    { key: 'streak', type: 'streak', label: 'Day streak', locked: metrics.streak < 1, hint: 'Practise today to start a streak' },
    { key: 'collection', type: 'collection', label: 'Badge collection', locked: earned.length < 1, hint: 'Earn your first badge' },
    { key: 'profile', type: 'profile', label: 'Profile summary', locked: metrics.solved < 1, hint: 'Solve your first problem' },
    ...earned.map((b) => ({ key: b.id, type: 'badge', label: b.name, badge: b, locked: false, hint: '' })),
    ...badges.filter((b) => !b.earned).map((b) => ({ key: b.id, type: 'badge', label: b.name, badge: b, locked: true, hint: hintFor(b, metrics) })),
  ];
  const unlocked = items.filter((i) => !i.locked);
  const upcoming = items.filter((i) => i.locked);
  const item = active != null ? items[active] : null;
  const canShare = Boolean(username) && item && !item.locked;
  const L = LAYOUT[fmt];
  const fileName = item ? `buncho-${username || 'card'}-${item.key}-${fmt}.png` : 'buncho-card.png';
  const caption = item && url ? captionFor(item, d, url) : '';

  // Open / close the native dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (active != null && !dialog.open) dialog.showModal();
    if (active == null && dialog.open) dialog.close();
    if (active == null) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  const step = (dir) => setActive((i) => (i == null ? i : (i + dir + items.length) % items.length));
  const flash = (msg) => {
    setNote(msg);
    setTimeout(() => setNote(''), 3500);
  };
  const makeBlob = () => toPng(svgRef.current, L.W, L.H, 2);

  async function download() {
    setBusy('download');
    try {
      const blob = await makeBlob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      flash('Card downloaded');
    } catch {
      flash('Could not create the image. Try another browser.');
    }
    setBusy('');
  }

  async function nativeShare() {
    setBusy('share');
    try {
      const blob = await makeBlob();
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
      } else if (navigator.share) {
        await navigator.share({ text: caption, url });
        flash('Shared the link. Download the card to attach the image.');
      } else {
        flash('Sharing is not supported here. Download the card or use a button below.');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') flash('Could not open the share sheet.');
    }
    setBusy('');
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      flash('Caption copied');
    } catch {
      flash('Copy failed. Select the text and copy manually.');
    }
  }

  const enc = encodeURIComponent;
  const links = url
    ? [
        { label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(caption.replace(`\n\nSee my profile: ${url}`, ''))}&url=${enc(url)}` },
        { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
        { label: 'WhatsApp', href: `https://wa.me/?text=${enc(caption)}` },
      ]
    : [];

  const btn = 'rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line disabled:hover:text-inherit';

  const tile = (it) => {
    const idx = items.indexOf(it);
    return (
      <li key={it.key}>
        <button
          type="button"
          onClick={() => setActive(idx)}
          className={`group relative flex w-full flex-col items-center rounded-2xl border p-3 text-center transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md ${it.locked ? 'border-dashed border-line bg-surface-2/40' : 'border-line bg-surface-2/60'}`}
        >
          <span className="grid h-16 w-16 place-items-center">
            {it.type === 'badge' ? (
              <BadgeArt badge={it.badge} size={60} animate={false} earned={!it.locked} />
            ) : (
              <span className={`grid h-14 w-14 place-items-center rounded-2xl ${it.locked ? 'bg-surface-2 text-muted' : 'bg-accent-soft text-accent'}`}>
                <Icon name={it.type} size={26} />
              </span>
            )}
          </span>
          <span className="mt-2 line-clamp-1 text-xs font-semibold">{it.label}</span>
          <span className="mt-0.5 line-clamp-1 text-[0.68rem] text-muted">{it.locked ? it.hint : 'Preview and share'}</span>
          {it.locked && (
            <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-surface text-muted ring-1 ring-line">
              <Icon name="lock" size={12} />
            </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <section aria-labelledby="share-h" className="card overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="share-h" className="text-lg font-semibold tracking-tight">Share your achievements</h2>
          <p className="mt-1 text-sm text-muted">Pick a card, choose one of 5 designs and any colour, then download or post it. Locked cards show what is coming next.</p>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">{unlocked.length} unlocked · {upcoming.length} upcoming</span>
      </div>

      {!username && (
        <p className="mt-4 rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-sm">
          Claim a username to share cards, so they can carry your profile link.{' '}
          <Link href="/settings/profile" className="font-semibold underline underline-offset-2">Claim username</Link>
        </p>
      )}

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Your cards</h3>
      {unlocked.length ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {unlocked.map(tile)}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">Solve your first problem to unlock your first card.</p>
      )}

      <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-muted">Upcoming (locked)</h3>
      {upcoming.length ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {upcoming.map(tile)}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">Everything is unlocked. Legendary.</p>
      )}

      {/* popup */}
      <dialog
        ref={dialogRef}
        onClose={() => setActive(null)}
        onClick={(e) => e.target === dialogRef.current && setActive(null)}
        aria-label="Card preview"
        className="m-auto max-h-[94dvh] w-[min(calc(100vw-1rem),66rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/70"
      >
        {item && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <button type="button" onClick={() => step(-1)} aria-label="Previous card" className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-accent"><Icon name="prev" /></button>
                <button type="button" onClick={() => step(1)} aria-label="Next card" className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-accent"><Icon name="next" /></button>
                <div className="ml-1 min-w-0">
                  <h3 className="truncate text-base font-semibold">{item.label}</h3>
                  <p className="text-xs text-muted">{item.locked ? `Locked · ${item.hint}` : 'Unlocked'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setActive(null)} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line hover:border-accent"><Icon name="close" /></button>
            </div>

            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
              {/* preview */}
              <div className="min-w-0">
                <div className="relative mx-auto overflow-hidden rounded-2xl border border-line shadow-lg" style={{ maxWidth: fmt === 'square' ? '30rem' : undefined }}>
                  <div style={item.locked ? { filter: 'grayscale(0.85) brightness(0.7)' } : undefined}>
                    <ShareCard svgRef={svgRef} type={item.type} fmt={fmt} color={color} design={design} d={d} featured={item.badge} locked={item.locked} />
                  </div>
                  {item.locked && (
                    <div className="absolute right-3 top-3 flex max-w-[80%] items-center gap-2 rounded-full bg-black/75 py-1.5 pl-2 pr-3.5 text-white shadow-lg backdrop-blur">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20"><Icon name="lock" size={13} /></span>
                      <span className="truncate text-xs font-bold uppercase tracking-wider">Locked<span className="ml-1.5 font-medium normal-case tracking-normal text-white/80">· {item.hint}</span></span>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-center text-xs text-muted">{L.size} px · PNG at 2x</p>
              </div>

              {/* controls */}
              <div className="space-y-5">
                <fieldset>
                  <legend className="text-xs font-semibold uppercase tracking-wider text-muted">Design</legend>
                  <div className="mt-2 grid grid-cols-5 gap-2 lg:grid-cols-5">
                    {DESIGNS.map((x) => {
                      const pp = palette(x.id, color);
                      return (
                        <button key={x.id} type="button" aria-pressed={design === x.id} onClick={() => setDesign(x.id)} className="group text-center">
                          <span
                            className={`block h-12 rounded-lg border-2 transition ${design === x.id ? 'border-accent ring-2 ring-accent/30' : 'border-line group-hover:border-accent/60'}`}
                            style={{ background: `linear-gradient(135deg, ${pp.bg[0]}, ${pp.bg[1]}, ${pp.bg[2]})` }}
                          >
                            <span className="block h-full w-full rounded-md" style={{ background: x.id === 'neon' ? `repeating-linear-gradient(0deg, ${color}33 0 1px, transparent 1px 8px), repeating-linear-gradient(90deg, ${color}33 0 1px, transparent 1px 8px)` : x.id === 'bold' ? 'repeating-linear-gradient(135deg, rgba(255,255,255,.12) 0 4px, transparent 4px 9px)' : undefined }} />
                          </span>
                          <span className={`mt-1 block text-[0.7rem] font-semibold ${design === x.id ? 'text-accent' : 'text-muted'}`}>{x.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-xs font-semibold uppercase tracking-wider text-muted">Colour</legend>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    <button type="button" aria-label="Profile colour" title="Your profile colour" aria-pressed={color === defaultColor} onClick={() => setColor(defaultColor)} className={`h-8 w-8 rounded-full border-2 transition ${color === defaultColor ? 'scale-110 border-ink' : 'border-transparent'}`} style={{ background: `conic-gradient(${defaultColor}, #fff 50%, ${defaultColor})` }} />
                    {SWATCHES.map((s) => (
                      <button key={s.hex} type="button" aria-label={s.name} title={s.name} aria-pressed={color === s.hex} onClick={() => setColor(s.hex)} className={`h-8 w-8 rounded-full border-2 transition ${color === s.hex ? 'scale-110 border-ink' : 'border-transparent'}`} style={{ background: s.hex }} />
                    ))}
                    <label className="relative grid h-8 w-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-line" title="Pick any colour" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}>
                      <span className="sr-only">Custom colour</span>
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-xs font-semibold uppercase tracking-wider text-muted">Size</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.entries(LAYOUT).map(([k, v]) => (
                      <button key={k} type="button" aria-pressed={fmt === k} onClick={() => setFmt(k)} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${fmt === k ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent/60'}`}>{v.label}</button>
                    ))}
                  </div>
                </fieldset>

                <div className="space-y-2.5">
                  {item.locked && (
                    <p className="flex items-start gap-2 rounded-xl border border-dashed border-line bg-surface-2/50 px-3 py-2.5 text-xs text-muted">
                      <Icon name="lock" size={14} className="mt-0.5 shrink-0" />
                      <span>This card is a preview. Downloading and sharing unlock when you earn it: {item.hint.toLowerCase()}.</span>
                    </p>
                  )}
                  <button type="button" onClick={download} disabled={!canShare || Boolean(busy)} className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45">
                    {busy === 'download' ? 'Creating image...' : item.locked ? 'Locked' : 'Download card (PNG)'}
                  </button>
                  <button type="button" onClick={nativeShare} disabled={!canShare || Boolean(busy)} className={`${btn} w-full`}>{busy === 'share' ? 'Opening...' : 'Share card'}</button>
                  <div className="grid grid-cols-3 gap-2">
                    {['X', 'LinkedIn', 'WhatsApp'].map((label) => {
                      const l = links.find((x) => x.label === label);
                      return canShare && l ? (
                        <a key={label} href={l.href} target="_blank" rel="noopener noreferrer" className={`${btn} !px-2 text-center`}>{label}</a>
                      ) : (
                        <span key={label} aria-disabled="true" className={`${btn} !px-2 cursor-not-allowed text-center opacity-50`}>{label}</span>
                      );
                    })}
                  </div>
                  <button type="button" onClick={copyCaption} disabled={!canShare} className={`${btn} w-full`}>Copy caption</button>
                  <p role="status" aria-live="polite" className="min-h-5 text-center text-xs font-medium text-accent">{note}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}