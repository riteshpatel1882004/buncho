'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import BadgeArt from '@/components/badges/BadgeArt';
import { sortEarned } from '@/lib/badges';

/* ------------------------------------------------------------------ */
/* Share Studio (dashboard). A gallery of achievement cards with live  */
/* thumbnails: unlocked ones can be downloaded / shared, upcoming ones */
/* are previewable but locked. Every card can be drawn in 12 designs,  */
/* any colour and 4 sizes (landscape, square, portrait, story).        */
/* The same SVG is the preview and the PNG, no external fonts/images.  */
/* ------------------------------------------------------------------ */

const FONT = "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif";

export const DESIGNS = [
  { id: 'aurora', label: 'Aurora', note: 'Glowing gradient' },
  { id: 'royal', label: 'Royal', note: 'Black and gold luxury' },
  { id: 'glass', label: 'Glass', note: 'Frosted glass panel' },
  { id: 'cosmic', label: 'Cosmic', note: 'Stars and planets' },
  { id: 'sunset', label: 'Sunset', note: 'Retro sun and waves' },
  { id: 'holo', label: 'Holo', note: 'Iridescent foil' },
  { id: 'neon', label: 'Neon', note: 'Cyber grid glow' },
  { id: 'blueprint', label: 'Blueprint', note: 'Technical drawing' },
  { id: 'terminal', label: 'Terminal', note: 'Hacker console' },
  { id: 'bold', label: 'Bold', note: 'Loud and solid' },
  { id: 'paper', label: 'Paper', note: 'Clean and light' },
  { id: 'minimal', label: 'Minimal', note: 'Quiet and sharp' },
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

/* hy = header y, fb = footer distance from the bottom, typ = title block y for the profile card */
const LAYOUT = {
  landscape: { label: 'Landscape', size: '1200 x 630', W: 1200, H: 630, vx: 300, vy: 318, vs: 1, tx: 610, ty: 215, typ: 215, anchor: 'start', wrapN: 30, maxLines: 3, tw: 540, hy: 56, fb: 100 },
  square: { label: 'Square', size: '1080 x 1080', W: 1080, H: 1080, vx: 540, vy: 410, vs: 1.05, tx: 540, ty: 740, typ: 690, anchor: 'middle', wrapN: 46, maxLines: 2, tw: 900, hy: 56, fb: 100 },
  portrait: { label: 'Portrait', size: '1080 x 1350', W: 1080, H: 1350, vx: 540, vy: 470, vs: 1.12, tx: 540, ty: 850, typ: 810, anchor: 'middle', wrapN: 44, maxLines: 3, tw: 900, hy: 56, fb: 100 },
  story: { label: 'Story', size: '1080 x 1920', W: 1080, H: 1920, vx: 540, vy: 790, vs: 1.3, tx: 540, ty: 1300, typ: 1260, anchor: 'middle', wrapN: 42, maxLines: 3, tw: 900, hy: 150, fb: 210 },
};

const PREVIEW_MAX_W = { landscape: undefined, square: '30rem', portrait: '26rem', story: '19rem' };

/* Level titles, by problems solved. */
const RANKS = [
  { at: 0, name: 'Newcomer' },
  { at: 10, name: 'Explorer' },
  { at: 25, name: 'Challenger' },
  { at: 50, name: 'Practitioner' },
  { at: 100, name: 'Specialist' },
  { at: 200, name: 'Expert' },
  { at: 350, name: 'Master' },
  { at: 500, name: 'Grandmaster' },
  { at: 600, name: 'Legend' },
];

function rankOf(solved) {
  let i = 0;
  RANKS.forEach((r, k) => {
    if (solved >= r.at) i = k;
  });
  const cur = RANKS[i];
  const nxt = RANKS[i + 1] ?? null;
  const frac = nxt ? (solved - cur.at) / (nxt.at - cur.at) : 1;
  return { i, cur, nxt, frac, toNext: nxt ? nxt.at - solved : 0 };
}

const scoreTier = (s) => (s >= 90 ? 'OUTSTANDING' : s >= 80 ? 'EXCELLENT' : s >= 65 ? 'STRONG' : s >= 50 ? 'RISING' : 'WARMING UP');

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

function rgb2hsl([r0, g0, b0]) {
  const r = r0 / 255;
  const g = g0 / 255;
  const b = b0 / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const dd = mx - mn;
  let h = 0;
  let s = 0;
  if (dd) {
    s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
    if (mx === r) h = (g - b) / dd + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / dd + 2;
    else h = (r - g) / dd + 4;
    h *= 60;
  }
  return [h, s, l];
}
function hsl2hex(h0, s, l) {
  const h = ((h0 % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  return rgb2hex([f(0) * 255, f(8) * 255, f(4) * 255]);
}
/** Rotate the hue of a colour (and optionally nudge saturation / lightness). */
const shift = (hex, deg, sMul = 1, lAdd = 0) => {
  const [h, s, l] = rgb2hsl(hex2rgb(hex));
  return hsl2hex(h + deg, Math.min(1, s * sMul), Math.max(0, Math.min(1, l + lAdd)));
};

/** Small seeded random generator so the starfield is the same on every render. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

const fit = (text, maxW, max, min = 40, cw = 0.56) => Math.max(min, Math.min(max, Math.floor(maxW / (String(text).length * cw))));

const hexPts = (r) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

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
  const common = { font: FONT, cw: 0.56, bgDir: [0, 0, 1, 1], a2: shift(color, 48), a3: shift(color, -52) };
  switch (design) {
    case 'paper':
      return {
        ...common,
        dark: false, bg: [mix('#ffffff', color, 0.04), mix('#ffffff', color, 0.15), mix('#ffffff', color, 0.32)],
        text: ink, soft: mix(ink, color, 0.3), hi: mix(color, '#000000', 0.2), track: 'rgba(11,18,32,0.10)', ringFill: 'rgba(255,255,255,0.6)',
        line: ink, lineO: 0.12, dot: ink, dotO: 0.1, inner: '#ffffff', onBrand: '#ffffff', brandA: mix(color, '#ffffff', 0.15), brandB: mix(color, '#000000', 0.2),
        pillFill: '#ffffff', pillO: 0.85, pillStroke: ink, glowO: 0.3, frame: ink, frameO: 0.14,
      };
    case 'neon':
      return {
        ...common,
        dark: true, bg: ['#02030a', mix('#02030a', color, 0.14), '#02030a'],
        text: '#ffffff', soft: mix(color, '#ffffff', 0.6), hi: mix(color, '#ffffff', 0.2), track: 'rgba(255,255,255,0.1)', ringFill: 'rgba(0,0,0,0.4)',
        line: color, lineO: 0.55, dot: color, dotO: 0, inner: '#05060f', onBrand: '#02030a', brandA: mix(color, '#ffffff', 0.35), brandB: color,
        pillFill: '#000000', pillO: 0.6, pillStroke: color, glowO: 0.55, frame: color, frameO: 0.9,
      };
    case 'bold':
      return {
        ...common,
        dark: true, bg: [mix(color, '#ffffff', 0.2), color, mix(color, '#000000', 0.5)],
        text: '#ffffff', soft: mix(color, '#ffffff', 0.88), hi: '#ffffff', track: 'rgba(0,0,0,0.22)', ringFill: 'rgba(0,0,0,0.22)',
        line: '#ffffff', lineO: 0.2, dot: '#ffffff', dotO: 0.08, inner: mix(color, '#000000', 0.45), onBrand: mix(color, '#000000', 0.6), brandA: '#ffffff', brandB: mix(color, '#ffffff', 0.6),
        pillFill: '#000000', pillO: 0.3, pillStroke: '#ffffff', glowO: 0.25, frame: '#ffffff', frameO: 0.25,
      };
    case 'minimal':
      return {
        ...common,
        dark: true, bg: ['#0b0d12', '#0b0d12', '#0b0d12'],
        text: '#f5f7fb', soft: '#9aa3b2', hi: color, track: 'rgba(255,255,255,0.08)', ringFill: 'rgba(255,255,255,0.03)',
        line: '#ffffff', lineO: 0.07, dot: '#ffffff', dotO: 0, inner: '#0b0d12', onBrand: '#06100a', brandA: mix(color, '#ffffff', 0.3), brandB: color,
        pillFill: '#000000', pillO: 0, pillStroke: '#ffffff', glowO: 0.2, frame: '#ffffff', frameO: 0.1,
      };
    case 'royal': {
      const gold = mix(color, '#ffe7a3', 0.64);
      return {
        ...common,
        font: SERIF,
        dark: true, bg: [mix('#0d0a06', color, 0.16), '#080706', mix('#0d0a06', color, 0.1)],
        text: '#fff6df', soft: mix('#eadbb4', color, 0.12), hi: gold, track: 'rgba(255,236,190,0.16)', ringFill: 'rgba(0,0,0,0.4)',
        line: gold, lineO: 0.55, dot: gold, dotO: 0.06, inner: '#0b0907', onBrand: '#1a1204', brandA: mix(color, '#fff0b8', 0.72), brandB: mix(color, '#a8741a', 0.42),
        pillFill: '#000000', pillO: 0.5, pillStroke: gold, glowO: 0.4, frame: gold, frameO: 0.9,
      };
    }
    case 'glass':
      return {
        ...common,
        dark: true, bg: [mix('#0b0d1e', color, 0.62), mix('#12102a', shift(color, 50), 0.36), mix('#070913', shift(color, -45), 0.42)],
        text: '#ffffff', soft: mix(color, '#ffffff', 0.82), hi: mix(color, '#ffffff', 0.55), track: 'rgba(255,255,255,0.2)', ringFill: 'rgba(255,255,255,0.09)',
        line: '#ffffff', lineO: 0.18, dot: '#ffffff', dotO: 0, inner: mix('#0b0d1e', color, 0.32), onBrand: '#07101a', brandA: mix(color, '#ffffff', 0.6), brandB: color,
        pillFill: '#ffffff', pillO: 0.12, pillStroke: '#ffffff', glowO: 0.5, frame: '#ffffff', frameO: 0.12,
      };
    case 'blueprint':
      return {
        ...common,
        dark: true, bg: [mix('#08224a', color, 0.14), mix('#0b2d63', color, 0.12), mix('#061a3b', color, 0.12)],
        text: '#f2f8ff', soft: mix('#a9c8ff', color, 0.15), hi: mix('#7fd6ff', color, 0.25), track: 'rgba(190,220,255,0.2)', ringFill: 'rgba(5,20,50,0.35)',
        line: '#cfe4ff', lineO: 0.4, dot: '#cfe4ff', dotO: 0, inner: '#082250', onBrand: '#06142b', brandA: '#e6f2ff', brandB: mix('#7fd6ff', color, 0.35),
        pillFill: '#000a1f', pillO: 0.4, pillStroke: '#cfe4ff', glowO: 0.3, frame: '#cfe4ff', frameO: 0.5,
      };
    case 'sunset':
      return {
        ...common,
        bgDir: [0, 0, 0, 1],
        dark: true, bg: [mix('#150a30', color, 0.12), mix('#7a1f5c', color, 0.34), mix('#ff8a3d', color, 0.22)],
        text: '#ffffff', soft: mix('#ffe3d0', color, 0.1), hi: mix(color, '#ffe0a8', 0.72), track: 'rgba(255,255,255,0.24)', ringFill: 'rgba(40,0,50,0.45)',
        line: '#ffffff', lineO: 0.3, dot: '#ffffff', dotO: 0, inner: '#2a0f3c', onBrand: '#2a0f3c', brandA: '#ffe3a8', brandB: mix(color, '#ff7a3d', 0.5),
        pillFill: '#1a0830', pillO: 0.4, pillStroke: '#ffffff', glowO: 0.35, frame: '#ffffff', frameO: 0.3,
      };
    case 'holo':
      return {
        ...common,
        dark: false, bg: [mix('#ffffff', shift(color, -70), 0.34), mix('#ffffff', shift(color, 10), 0.3), mix('#ffffff', shift(color, 100), 0.38)],
        text: '#10162b', soft: mix('#10162b', color, 0.35), hi: mix(color, '#000000', 0.25), track: 'rgba(16,22,43,0.1)', ringFill: 'rgba(255,255,255,0.55)',
        line: '#10162b', lineO: 0.13, dot: '#10162b', dotO: 0.05, inner: '#ffffff', onBrand: '#ffffff', brandA: shift(color, -40, 1, 0.04), brandB: shift(color, 60, 1, -0.05),
        pillFill: '#ffffff', pillO: 0.7, pillStroke: '#10162b', glowO: 0.3, frame: '#10162b', frameO: 0.16,
      };
    case 'cosmic':
      return {
        ...common,
        dark: true, bg: ['#05040f', mix('#0b0824', color, 0.2), '#030209'],
        text: '#ffffff', soft: mix(color, '#ffffff', 0.7), hi: mix(color, '#ffffff', 0.45), track: 'rgba(255,255,255,0.12)', ringFill: 'rgba(0,0,0,0.4)',
        line: mix(color, '#ffffff', 0.5), lineO: 0.3, dot: '#ffffff', dotO: 0, inner: '#07061a', onBrand: '#05040f', brandA: mix(color, '#ffffff', 0.45), brandB: shift(color, 38),
        pillFill: '#000000', pillO: 0.5, pillStroke: '#ffffff', glowO: 0.5, frame: mix(color, '#ffffff', 0.4), frameO: 0.3,
      };
    case 'terminal':
      return {
        ...common,
        font: MONO, cw: 0.62,
        dark: true, bg: [mix('#030705', color, 0.06), '#040806', '#020403'],
        text: mix(color, '#ffffff', 0.55), soft: mix(color, '#ffffff', 0.2), hi: color, track: 'rgba(255,255,255,0.08)', ringFill: 'rgba(0,0,0,0.5)',
        line: color, lineO: 0.35, dot: color, dotO: 0, inner: '#030805', onBrand: '#021006', brandA: mix(color, '#ffffff', 0.25), brandB: color,
        pillFill: '#000000', pillO: 0.6, pillStroke: color, glowO: 0.3, frame: color, frameO: 0.6,
      };
    default:
      return {
        ...common,
        dark: true, bg: [mix(base, color, 0.44), mix(base, color, 0.14), base],
        text: '#ffffff', soft: mix(color, '#ffffff', 0.78), hi: mix(color, '#ffffff', 0.4), track: 'rgba(255,255,255,0.12)', ringFill: 'rgba(0,0,0,0.25)',
        line: '#ffffff', lineO: 0.1, dot: '#ffffff', dotO: 0.14, inner: mix(base, color, 0.14), onBrand: '#06100a', brandA: mix(color, '#ffffff', 0.4), brandB: color,
        pillFill: '#000000', pillO: 0.38, pillStroke: '#ffffff', glowO: 0.6, frame: '#ffffff', frameO: 0.14,
      };
  }
}

/* ------------------------------- the card ------------------------------- */

export function ShareCard({ svgRef, type, fmt, color, design, d, featured, locked, thumb = false }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (k) => `${uid}${k}`;
  const url = (k) => `url(#${id(k)})`;
  const L = LAYOUT[fmt];
  const { W, H } = L;
  const p = palette(design, color);
  const F = p.font;
  const A = L.anchor;
  const centered = A === 'middle';
  const big = Math.max(W, H);
  const bigR = big * 0.4;
  const topBadge = d.earned[0] ?? null;
  const hasEarned = d.earned.length > 0;
  const score = d.avgScore ?? 0;

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
  } else if (type === 'rank') {
    eyebrow = `LEVEL ${d.rank.i + 1}`;
    title = d.rank.cur.name;
    sub = d.rank.nxt ? `${d.rank.toNext} more problem${d.rank.toNext === 1 ? '' : 's'} to reach ${d.rank.nxt.name}.` : 'The highest level on Buncho. Nothing left to climb.';
  } else if (type === 'progress') {
    eyebrow = 'QUESTION BANK';
    title = `${d.pct}% complete`;
    sub = `${d.solved} of ${d.total} AI, ML and GenAI interview problems conquered.`;
  } else if (type === 'roadmap') {
    eyebrow = 'MILESTONE ROADMAP';
    title = d.next ? `Next: ${d.next}` : 'Road complete';
    sub = d.next ? `${d.toNext} more problem${d.toNext === 1 ? '' : 's'} to go. ${d.solved} solved so far.` : `${d.solved} problems solved. Every milestone unlocked.`;
  } else if (type === 'score') {
    eyebrow = 'AI FEEDBACK';
    title = d.avgScore != null ? `${d.avgScore} average score` : 'AI scored answers';
    sub = 'Average AI score across my interview answers, judged problem by problem.';
  } else if (type === 'hard') {
    eyebrow = 'SUMMIT';
    title = `${d.hard} hard problem${d.hard === 1 ? '' : 's'}`;
    sub = d.hard < 5 ? `Taking on the toughest questions. ${5 - d.hard} more to earn Summit.` : 'Finishing the toughest AI interview questions on Buncho.';
  } else if (type === 'active') {
    eyebrow = 'CONSISTENCY';
    title = `${d.days} active day${d.days === 1 ? '' : 's'}`;
    sub = d.days < 20 ? `Showing up to practise. ${20 - d.days} more days to unlock Clockwork.` : 'Showing up again and again to practise AI interviews.';
  } else if (type === 'invite') {
    eyebrow = 'JOIN ME';
    title = 'Practise with me';
    sub = 'Real AI, ML and GenAI interview problems with instant AI feedback.';
  } else {
    eyebrow = 'AI INTERVIEW PROFILE';
    title = d.name;
  }
  const ty = type === 'profile' ? L.typ : L.ty;
  const titleFs = fit(title, L.tw, centered ? 104 : 88, type === 'profile' ? 40 : 44, p.cw);
  const titleY = ty + 28 + titleFs * 0.85;
  const subDy = design === 'royal' ? 26 : 0;
  const subLines = wrap(sub, L.wrapN, L.maxLines);
  const eyebrowText = design === 'terminal' ? `> ${eyebrow}` : eyebrow;

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
        <circle r={R} fill="none" stroke={url('ring')} strokeWidth="26" strokeLinecap="round" strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90)" />
        <text y="22" textAnchor="middle" fontFamily={F} fontWeight="800" fontSize={String(d.solved).length > 3 ? 104 : 126} fill={p.text}>{d.solved}</text>
        <text y="66" textAnchor="middle" fontFamily={F} fontWeight="600" fontSize="26" fill={p.soft} opacity="0.9">{`of ${d.total} problems`}</text>
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
          <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4 .2 1.2.8 2 1.8 2.2C10.5 8 11 5.5 12 3Z" fill={url('fire')} />
        </g>
        <text y="118" textAnchor="middle" fontFamily={F} fontWeight="800" fontSize="104" fill="#fff" stroke="rgba(120,20,0,0.55)" strokeWidth="7" paintOrder="stroke" strokeLinejoin="round">{d.streak}</text>
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
        <circle r="150" fill={url('ring')} />
        <circle r="136" fill={p.inner} />
        <text y="48" textAnchor="middle" fontFamily={F} fontWeight="800" fontSize="150" fill={p.text}>{d.name.charAt(0).toUpperCase()}</text>
        {topBadge && (
          <g transform="translate(62 62)">
            <circle cx="55" cy="55" r="62" fill={p.inner} />
            <BadgeArt badge={{ ...topBadge, earned: true }} size={110} animate={false} />
          </g>
        )}
      </g>
    );
  } else if (type === 'rank') {
    const R = 190;
    const C = 2 * Math.PI * R;
    visual = (
      <g>
        <circle r={R} fill="none" stroke={p.track} strokeWidth="14" />
        <circle r={R} fill="none" stroke={url('ring')} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${C * Math.max(0.02, d.rank.frac)} ${C}`} transform="rotate(-90)" />
        <polygon points={hexPts(146)} fill={p.inner} stroke={url('ring')} strokeWidth="10" strokeLinejoin="round" />
        <polygon points={hexPts(116)} fill="none" stroke={p.line} strokeOpacity="0.28" strokeWidth="2" strokeLinejoin="round" />
        <text y="-44" textAnchor="middle" fontFamily={F} fontWeight="800" fontSize="22" letterSpacing="7" fill={p.soft}>LEVEL</text>
        <text y="62" textAnchor="middle" fontFamily={F} fontWeight="800" fontSize="128" fill={p.text}>{d.rank.i + 1}</text>
        <Spark x={0} y={100} s={13} fill={p.hi} o={0.9} />
      </g>
    );
  } else if (type === 'progress') {
    const SEG = 48;
    const lit = d.solved > 0 ? Math.max(1, Math.round(SEG * Math.min(1, d.solved / Math.max(1, d.total)))) : 0;
    visual = (
      <g>
        {Array.from({ length: SEG }, (_, i) => (
          <rect key={i} x="-5" y="-200" width="10" height="46" rx="5" fill={i < lit ? url('ring') : p.track} transform={`rotate(${(i * 360) / SEG})`} />
        ))}
        <text y="30" textAnchor="middle" fontFamily={F} fontWeight="800" fontSize={d.pct > 99 ? 100 : 118} fill={p.text}>{`${d.pct}%`}</text>
        <text y="76" textAnchor="middle" fontFamily={F} fontWeight="600" fontSize="25" fill={p.soft} opacity="0.9">of the question bank</text>
      </g>
    );
  } else if (type === 'roadmap') {
    const ms = d.milestones;
    let firstUn = ms.findIndex((m) => !m.earned);
    if (firstUn < 0) firstUn = ms.length;
    const start = Math.max(0, Math.min(firstUn - 2, ms.length - 5));
    const win = ms.slice(start, start + 5);
    const bw = 54;
    const gap = 18;
    const total = win.length * bw + (win.length - 1) * gap;
    visual = (
      <g>
        {win.map((m, j) => {
          const g = start + j;
          const h = 70 + j * 40;
          const x = -total / 2 + j * (bw + gap);
          const prev = g > 0 ? ms[g - 1].n : 0;
          const frac = m.earned ? 1 : g === firstUn ? Math.max(0, Math.min(1, (d.solved - prev) / Math.max(1, m.n - prev))) : 0;
          const fh = frac > 0 ? Math.max(16, h * frac) : 0;
          return (
            <g key={m.n}>
              <rect x={x} y={96 - h} width={bw} height={h} rx="14" fill={p.track} />
              {fh > 0 && <rect x={x} y={96 - fh} width={bw} height={fh} rx="14" fill={url('ring')} />}
              <text x={x + bw / 2} y={132} textAnchor="middle" fontFamily={F} fontWeight="700" fontSize="22" fill={m.earned ? p.text : p.soft} opacity={m.earned ? 1 : 0.75}>{m.n}</text>
              {g === firstUn && <Spark x={x + bw / 2} y={96 - h - 28} s={15} fill={p.hi} o={0.95} />}
            </g>
          );
        })}
      </g>
    );
  } else if (type === 'score') {
    const R = 152;
    const C = 2 * Math.PI * R;
    const arc = C * 0.75;
    const frac = Math.max(0.02, Math.min(1, score / 100));
    visual = (
      <g>
        <circle r={R} fill={p.ringFill} />
        <circle r={R} fill="none" stroke={p.track} strokeWidth="26" strokeLinecap="round" strokeDasharray={`${arc} ${C}`} transform="rotate(135)" />
        <circle r={R} fill="none" stroke={url('ring')} strokeWidth="26" strokeLinecap="round" strokeDasharray={`${arc * frac} ${C}`} transform="rotate(135)" />
        <text y="26" textAnchor="middle" fontFamily={F} fontWeight="800" fontSize="128" fill={p.text}>{d.avgScore ?? '–'}</text>
        <text y="68" textAnchor="middle" fontFamily={F} fontWeight="600" fontSize="25" fill={p.soft} opacity="0.9">out of 100</text>
        <text y="150" textAnchor="middle" fontFamily={F} fontWeight="800" fontSize="21" letterSpacing="5" fill={p.hi}>{scoreTier(score)}</text>
      </g>
    );
  } else if (type === 'hard') {
    visual = (
      <g>
        <clipPath id={id('clipM')}>
          <circle r="196" />
        </clipPath>
        <circle r="196" fill={p.ringFill} />
        <g clipPath={url('clipM')}>
          <polygon points="-230,80 -135,-22 -72,42 -2,-66 92,44 152,-8 230,80 230,210 -230,210" fill={p.brandB} opacity="0.5" />
          <polygon points="-158,112 -10,-120 148,112" fill={url('ring')} />
          <polygon points="-10,-120 -54,-46 -31,-58 -10,-38 12,-58 36,-46" fill="#ffffff" opacity="0.93" />
          <polygon points="-10,-120 -54,-46 -31,-58 -10,-38" fill="#000000" opacity="0.08" />
          <rect x="-220" y="96" width="440" height="120" fill={p.inner} opacity="0.94" />
          <line x1="-10" y1="-120" x2="-10" y2="-162" stroke={p.text} strokeWidth="5" strokeLinecap="round" />
          <polygon points="-8,-162 30,-149 -8,-136" fill={p.hi} />
        </g>
        <circle r="196" fill="none" stroke={url('ring')} strokeWidth="7" />
        <text y="168" textAnchor="middle" fontFamily={F} fontWeight="800" fontSize="70" fill={p.text}>{d.hard}</text>
      </g>
    );
  } else if (type === 'active') {
    const cols = 7;
    const rows = 5;
    const cell = 36;
    const gap = 8;
    const w = cols * cell + (cols - 1) * gap;
    const h = rows * cell + (rows - 1) * gap;
    const n = Math.min(cols * rows, d.days);
    const lvl = [0.5, 0.7, 0.88, 1];
    visual = (
      <g>
        <rect x={-w / 2 - 24} y={-h / 2 - 24} width={w + 48} height={h + 48} rx="30" fill={p.ringFill} stroke={p.track} strokeWidth="2" />
        {Array.from({ length: cols * rows }, (_, k) => {
          const lit = k < n;
          return (
            <rect
              key={k}
              x={-w / 2 + (k % cols) * (cell + gap)}
              y={-h / 2 + Math.floor(k / cols) * (cell + gap)}
              width={cell}
              height={cell}
              rx="10"
              fill={lit ? url('ring') : p.track}
              opacity={lit ? lvl[(k * 13 + 5) % 4] : 1}
            />
          );
        })}
      </g>
    );
  } else if (type === 'invite') {
    visual = (
      <g>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4 - Math.PI / 8;
          return <circle key={i} cx={200 * Math.cos(a)} cy={200 * Math.sin(a)} r={i % 2 ? 13 : 21} fill={i % 2 ? p.soft : url('ring')} opacity={i % 2 ? 0.6 : 0.95} />;
        })}
        <circle r="134" fill={url('ring')} />
        <circle r="113" fill={p.inner} />
        <text y="46" textAnchor="middle" fontFamily={F} fontWeight="900" fontSize="132" fill={p.text}>B</text>
        <g transform="translate(88 88)">
          <circle r="42" fill={url('ring')} stroke={p.inner} strokeWidth="8" />
          <path d="M0 -18V18M-18 0H18" stroke={p.onBrand} strokeWidth="9" strokeLinecap="round" />
        </g>
      </g>
    );
  }

  const sparks = [
    [0.07, 0.2, 14], [0.46, 0.1, 10], [0.93, 0.14, 18], [0.55, 0.9, 12], [0.96, 0.62, 12], [0.04, 0.78, 10],
  ];
  const noSparks = ['minimal', 'blueprint', 'terminal', 'cosmic', 'glass'];

  /* decorations that need a little maths */
  const wedges =
    design === 'royal'
      ? Array.from({ length: 30 }, (_, i) => {
          const a1 = (i * 12 * Math.PI) / 180;
          const a2 = ((i * 12 + 6) * Math.PI) / 180;
          const R = 2400;
          return `${L.vx},${L.vy} ${L.vx + R * Math.cos(a1)},${L.vy + R * Math.sin(a1)} ${L.vx + R * Math.cos(a2)},${L.vy + R * Math.sin(a2)}`;
        })
      : [];
  const stars = (() => {
    if (design !== 'cosmic') return [];
    const r = rng(7919);
    return Array.from({ length: Math.round((W * H) / 7000) }, () => ({ x: r() * W, y: r() * H, s: 0.6 + r() * 1.7, o: 0.25 + r() * 0.7, big: r() > 0.96 }));
  })();
  const ticksX = design === 'blueprint' ? Array.from({ length: Math.floor((W - 120) / 30) + 1 }, (_, i) => 60 + i * 30) : [];
  const ticksY = design === 'blueprint' ? Array.from({ length: Math.floor((H - 120) / 30) + 1 }, (_, i) => 60 + i * 30) : [];
  const nameW = d.display.length * 12.6 + 48;
  const cursorX = A === 'middle' ? L.tx + (String(title).length * titleFs * 0.58) / 2 + 10 : L.tx + String(title).length * titleFs * 0.58 + 10;

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      {...(thumb ? { 'aria-hidden': 'true' } : { role: 'img', 'aria-label': `${d.name} share card` })}
      className="block h-auto w-full"
    >
      <defs>
        <linearGradient id={id('bg')} x1={p.bgDir[0]} y1={p.bgDir[1]} x2={p.bgDir[2]} y2={p.bgDir[3]}>
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
        <radialGradient id={id('glowA')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={p.a2} stopOpacity="0.55" />
          <stop offset="100%" stopColor={p.a2} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('glowB')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={p.a3} stopOpacity="0.5" />
          <stop offset="100%" stopColor={p.a3} stopOpacity="0" />
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
        <linearGradient id={id('sunG')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe27a" />
          <stop offset="50%" stopColor="#ff8a3d" />
          <stop offset="100%" stopColor={mix(color, '#ff2d7a', 0.5)} />
        </linearGradient>
        <linearGradient id={id('glassHi')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id('sphere')} cx="0.34" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="30%" stopColor={p.a2} stopOpacity="0.9" />
          <stop offset="100%" stopColor={p.a3} stopOpacity="0.95" />
        </radialGradient>
        <radialGradient id={id('planet')} cx="0.34" cy="0.3" r="0.85">
          <stop offset="0%" stopColor={mix(color, '#ffffff', 0.55)} />
          <stop offset="55%" stopColor={color} />
          <stop offset="100%" stopColor={mix(color, '#000000', 0.72)} />
        </radialGradient>
        <pattern id={id('dots')} width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill={p.dot} opacity={p.dotO} />
        </pattern>
        <pattern id={id('grid')} width="54" height="54" patternUnits="userSpaceOnUse">
          <path d="M54 0H0V54" fill="none" stroke={color} strokeOpacity="0.2" strokeWidth="1.2" />
        </pattern>
        <pattern id={id('stripes')} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="14" height="34" fill="#fff" opacity="0.07" />
        </pattern>
        <pattern id={id('bpMinor')} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#cfe4ff" strokeOpacity="0.09" strokeWidth="1" />
        </pattern>
        <pattern id={id('bpMajor')} width="120" height="120" patternUnits="userSpaceOnUse">
          <path d="M120 0H0V120" fill="none" stroke="#cfe4ff" strokeOpacity="0.2" strokeWidth="1.4" />
        </pattern>
        <pattern id={id('scan')} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="2" fill="#ffffff" opacity="0.035" />
        </pattern>
        <pattern id={id('foil')} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="1.6" height="9" fill="#10162b" opacity="0.045" />
        </pattern>
        <mask id={id('sunMask')}>
          <rect x="-300" y="-300" width="600" height="600" fill="#000" />
          <circle r="215" fill="#fff" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x="-300" y={26 + i * 33} width="600" height={4 + i * 4} fill="#000" />
          ))}
        </mask>
      </defs>

      {/* background, one per design */}
      <rect width={W} height={H} fill={url('bg')} />
      {design === 'aurora' && (
        <>
          <rect width={W} height={H} fill={url('dots')} />
          <circle cx={W} cy="0" r={bigR * 1.1} fill={url('corner')} />
          <circle cx="0" cy={H} r={bigR * 0.95} fill={url('glow')} opacity="0.55" />
          <path d={`M0 ${H * 0.72} C ${W * 0.3} ${H * 0.55}, ${W * 0.6} ${H * 0.95}, ${W} ${H * 0.7} L ${W} ${H} L 0 ${H} Z`} fill="#000" opacity="0.18" />
        </>
      )}
      {design === 'paper' && (
        <>
          <rect width={W} height={H} fill={url('dots')} />
          <circle cx={W * 0.92} cy={H * 0.05} r={bigR * 0.95} fill={color} opacity="0.16" />
          <circle cx={W * 0.02} cy={H * 0.98} r={bigR * 0.75} fill={color} opacity="0.14" />
        </>
      )}
      {design === 'neon' && (
        <>
          <rect width={W} height={H} fill={url('grid')} />
          <rect x="0" y={H * 0.55} width={W} height={H * 0.45} fill={url('horizon')} opacity="0.55" />
          <circle cx={W} cy="0" r={bigR * 1.05} fill={url('glow')} opacity="0.7" />
        </>
      )}
      {design === 'bold' && (
        <>
          <rect width={W} height={H} fill={url('stripes')} />
          <circle cx={W} cy="0" r={bigR * 1.05} fill="#fff" opacity="0.12" />
          <circle cx="0" cy={H} r={bigR * 0.8} fill="#fff" opacity="0.1" />
          <circle cx={W * 0.64} cy={H * 0.95} r={bigR * 0.42} fill="#000" opacity="0.1" />
        </>
      )}
      {design === 'royal' && (
        <>
          <rect width={W} height={H} fill={url('dots')} />
          {wedges.map((pts, i) => (
            <polygon key={i} points={pts} fill={p.hi} opacity="0.035" />
          ))}
          <circle cx={W} cy="0" r={bigR} fill={url('glow')} opacity="0.5" />
          <rect x="30" y="30" width={W - 60} height={H - 60} rx="20" fill="none" stroke={p.hi} strokeOpacity="0.4" strokeWidth="1.4" />
          {[[30, 30, 1, 1], [W - 30, 30, -1, 1], [30, H - 30, 1, -1], [W - 30, H - 30, -1, -1]].map(([x, y, sx, sy], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
              <path d="M0 58V0H58" fill="none" stroke={p.hi} strokeWidth="4" strokeLinecap="square" />
              <polygon points="0,-9 9,0 0,9 -9,0" fill={p.hi} />
              <circle cx="22" cy="22" r="3.4" fill={p.hi} opacity="0.8" />
            </g>
          ))}
        </>
      )}
      {design === 'glass' && (
        <>
          <circle cx={W * 0.12} cy={H * 0.1} r={bigR * 0.95} fill={url('glow')} opacity="0.9" />
          <circle cx={W * 0.9} cy={H * 0.78} r={bigR * 0.9} fill={url('glowA')} />
          <circle cx={W * 0.55} cy={H * 0.02} r={bigR * 0.7} fill={url('glowB')} />
          <circle cx={W * 0.9} cy={H * 0.16} r={big * 0.085} fill={url('sphere')} />
          <circle cx={W * 0.52} cy={H * 0.995} r={big * 0.055} fill={url('sphere')} />
          <rect x="34" y="34" width={W - 68} height={H - 68} rx="44" fill="#ffffff" fillOpacity="0.07" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="2" />
          <rect x="34" y="34" width={W - 68} height={H - 68} rx="44" fill={url('glassHi')} />
        </>
      )}
      {design === 'cosmic' && (
        <>
          <circle cx={W * 0.12} cy={H * 0.18} r={bigR * 1.1} fill={url('glowB')} />
          <circle cx={W * 0.82} cy={H * 0.82} r={bigR * 1.2} fill={url('glowA')} />
          <circle cx={W * 0.5} cy={H * 0.5} r={bigR * 1.3} fill={url('glow')} opacity="0.45" />
          {stars.map((s, i) => (s.big ? <Spark key={i} x={s.x} y={s.y} s={s.s * 5} fill="#fff" o={s.o} /> : <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o} />))}
          <g transform={`translate(${W - 215} ${H * (centered ? 0.12 : 0.17)}) rotate(-18)`}>
            <path d="M-170 0A170 40 0 0 1 170 0" fill="none" stroke={p.hi} strokeOpacity="0.55" strokeWidth="7" />
            <circle r="78" fill={url('planet')} />
            <path d="M-170 0A170 40 0 0 0 170 0" fill="none" stroke={p.hi} strokeOpacity="0.9" strokeWidth="7" />
          </g>
        </>
      )}
      {design === 'sunset' && (
        <>
          <path d={`M0 ${H * 0.84} L ${W * 0.12} ${H * 0.76} L ${W * 0.24} ${H * 0.83} L ${W * 0.4} ${H * 0.72} L ${W * 0.55} ${H * 0.82} L ${W * 0.7} ${H * 0.74} L ${W * 0.86} ${H * 0.83} L ${W} ${H * 0.77} L ${W} ${H} L 0 ${H} Z`} fill="#1a0830" opacity="0.55" />
          <path d={`M0 ${H * 0.9} C ${W * 0.2} ${H * 0.83}, ${W * 0.35} ${H * 0.97}, ${W * 0.55} ${H * 0.9} S ${W * 0.9} ${H * 0.84}, ${W} ${H * 0.9} L ${W} ${H} L 0 ${H} Z`} fill="#12061f" opacity="0.7" />
        </>
      )}
      {design === 'holo' && (
        <>
          <rect width={W} height={H} fill={url('foil')} />
          <circle cx={W * 0.9} cy={H * 0.08} r={bigR * 0.95} fill={shift(color, 80)} opacity="0.32" />
          <circle cx={W * 0.05} cy={H * 0.95} r={bigR * 0.85} fill={shift(color, -70)} opacity="0.3" />
          {[0.1, 0.34, 0.62].map((o, i) => (
            <polygon key={i} points={`${W * o},0 ${W * (o + 0.07 + i * 0.03)},0 ${W * (o - 0.2)},${H} ${W * (o - 0.27 - i * 0.03)},${H}`} fill="#ffffff" opacity={0.2 - i * 0.04} />
          ))}
        </>
      )}
      {design === 'blueprint' && (
        <>
          <rect width={W} height={H} fill={url('bpMinor')} />
          <rect width={W} height={H} fill={url('bpMajor')} />
          {ticksX.map((x, i) => (
            <line key={`x${x}`} x1={x} y1="14" x2={x} y2={i % 5 === 0 ? 30 : 22} stroke="#cfe4ff" strokeOpacity="0.4" strokeWidth="1.4" />
          ))}
          {ticksY.map((y, i) => (
            <line key={`y${y}`} x1="14" y1={y} x2={i % 5 === 0 ? 30 : 22} y2={y} stroke="#cfe4ff" strokeOpacity="0.4" strokeWidth="1.4" />
          ))}
          {[[44, 44, 1, 1], [W - 44, 44, -1, 1], [44, H - 44, 1, -1], [W - 44, H - 44, -1, -1]].map(([x, y, sx, sy], i) => (
            <path key={i} d="M0 36V0H36" transform={`translate(${x} ${y}) scale(${sx} ${sy})`} fill="none" stroke="#cfe4ff" strokeOpacity="0.7" strokeWidth="2.4" />
          ))}
          <line x1="0" y1={L.vy} x2={W} y2={L.vy} stroke="#cfe4ff" strokeOpacity="0.16" strokeWidth="1.4" strokeDasharray="14 10" />
          <line x1={L.vx} y1="0" x2={L.vx} y2={H} stroke="#cfe4ff" strokeOpacity="0.16" strokeWidth="1.4" strokeDasharray="14 10" />
          <text x={W - 62} y={L.hy + 18} textAnchor="end" fontFamily={MONO} fontSize="17" letterSpacing="3" fill="#cfe4ff" opacity="0.65">FIG. 01 · BUNCHO · REV A</text>
        </>
      )}
      {design === 'terminal' && (
        <>
          <rect width={W} height={H} fill={url('scan')} />
          <circle cx={W} cy={H} r={bigR} fill={url('glow')} opacity="0.5" />
          <rect x="20" y="20" width={W - 40} height="38" rx="12" fill="#ffffff" fillOpacity="0.06" />
          {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
            <circle key={c} cx={46 + i * 26} cy="39" r="7" fill={c} />
          ))}
          <text x={W / 2} y="45" textAnchor="middle" fontFamily={MONO} fontSize="17" fill={p.soft} opacity="0.7">{`${d.username || 'you'}@buncho: ~/profile`}</text>
        </>
      )}
      {!noSparks.includes(design) && sparks.map(([fx, fy, s], i) => <Spark key={i} x={W * fx} y={H * fy} s={s} fill={p.soft} o={p.dark ? 0.55 : 0.5} />)}
      {design === 'neon' && <rect x="14" y="14" width={W - 28} height={H - 28} rx="30" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="10" />}
      <rect x="14" y="14" width={W - 28} height={H - 28} rx="30" fill="none" stroke={p.frame} strokeOpacity={p.frameO} strokeWidth={design === 'neon' ? 3 : design === 'royal' ? 2.5 : 2} />

      {/* header: who */}
      <g transform={`translate(60 ${L.hy + (design === 'terminal' ? 16 : 0)})`}>
        <circle cx="26" cy="26" r="26" fill={url('ring')} />
        <text x="26" y="36" textAnchor="middle" fontFamily={F} fontWeight="800" fontSize="28" fill={p.onBrand}>{d.name.charAt(0).toUpperCase()}</text>
        <text x="68" y="24" fontFamily={F} fontWeight="700" fontSize="26" fill={p.text}>{d.name}</text>
        <text x="68" y="50" fontFamily={F} fontWeight="500" fontSize="20" fill={p.soft} opacity="0.85">{`@${d.username || 'you'}`}</text>
      </g>

      {/* the visual */}
      <g transform={`translate(${L.vx} ${L.vy}) scale(${L.vs})`}>
        <circle r="270" fill={url('glow')} />
        {design === 'sunset' && <circle r="215" fill={url('sunG')} mask={url('sunMask')} />}
        {design === 'cosmic' && <ellipse rx="300" ry="78" fill="none" stroke={p.hi} strokeOpacity="0.28" strokeWidth="2" strokeDasharray="4 12" transform="rotate(-18)" />}
        <circle r="228" fill="none" stroke={p.line} strokeOpacity={p.lineO} strokeWidth="2" strokeDasharray="3 11" />
        <circle r="262" fill="none" stroke={p.line} strokeOpacity={p.lineO * 0.6} strokeWidth={design === 'royal' ? 3 : 2} />
        {design === 'royal' && <circle r="276" fill="none" stroke={p.hi} strokeOpacity="0.28" strokeWidth="1.4" />}
        {design === 'holo' && <circle r="262" fill="none" stroke={p.brandB} strokeOpacity="0.5" strokeWidth="5" strokeDasharray="60 22" />}
        {visual}
      </g>

      {/* the words */}
      <text x={L.tx} y={ty} textAnchor={A} fontFamily={F} fontWeight="800" fontSize={design === 'terminal' ? 21 : 22} letterSpacing={design === 'royal' ? 7 : design === 'terminal' ? 3 : 5} fill={p.hi}>{eyebrowText}</text>
      <text x={L.tx} y={titleY} textAnchor={A} fontFamily={F} fontWeight={design === 'royal' ? '700' : '800'} fontSize={titleFs} fill={p.text}>{title}</text>
      {design === 'terminal' && <rect x={cursorX} y={titleY - titleFs * 0.78} width={titleFs * 0.46} height={titleFs * 0.9} fill={p.hi} opacity="0.85" />}
      {design === 'royal' && (
        <g transform={`translate(${A === 'middle' ? L.tx : L.tx + 90} ${titleY + 26})`} fill={p.hi}>
          <rect x="-90" y="-1" width="72" height="2" opacity="0.8" />
          <polygon points="0,-8 8,0 0,8 -8,0" />
          <rect x="18" y="-1" width="72" height="2" opacity="0.8" />
        </g>
      )}
      {type !== 'profile' &&
        subLines.map((line, i) => (
          <text key={i} x={L.tx} y={titleY + 50 + subDy + i * 38} textAnchor={A} fontFamily={F} fontWeight="500" fontSize="28" fill={p.soft} opacity="0.92">{line}</text>
        ))}
      {type === 'profile' &&
        stats.map((s, i) => {
          const x = centered ? W / 2 + (i - 1.5) * 235 : L.tx + (i % 2) * 270;
          const y = centered ? titleY + 95 + subDy : titleY + 62 + Math.floor(i / 2) * 100;
          return (
            <g key={s.l}>
              <text x={x} y={y} textAnchor={A} fontFamily={F} fontWeight="800" fontSize={centered ? 62 : 52} fill={p.text}>{s.v}</text>
              <text x={x} y={y + 32} textAnchor={A} fontFamily={F} fontWeight="600" fontSize="21" fill={p.soft} opacity="0.85">{s.l}</text>
            </g>
          );
        })}

      {/* footer: brand */}
      <g transform={`translate(60 ${H - L.fb})`}>
        <rect width="44" height="44" rx="12" fill={url('ring')} />
        <text x="22" y="32" textAnchor="middle" fontFamily={F} fontWeight="900" fontSize="28" fill={p.onBrand}>B</text>
        <text x="58" y="31" fontFamily={F} fontWeight="800" fontSize="30" fill={p.text}>Buncho</text>
      </g>
      <g transform={`translate(${W - 60} ${H - L.fb})`}>
        <rect x={-nameW} width={nameW} height="44" rx="22" fill={p.pillFill} fillOpacity={p.pillO} stroke={p.pillStroke} strokeOpacity="0.25" />
        <text x={-nameW / 2} y="30" textAnchor="middle" fontFamily={MONO} fontWeight="700" fontSize="21" fill={p.text}>{d.display}</text>
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
  // Story cards are tall: keep the PNG at a sane size on every device
  const k = Math.min(scale, 2400 / Math.max(w, h));
  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function captionFor(item, d, url) {
  const tail = `\n\nSee my profile: ${url}`;
  switch (item.type) {
    case 'solved': return `I've solved ${d.solved} AI interview problems on Buncho. Practising AI, ML and GenAI interviews the smart way.${tail}`;
    case 'badge': return `I just earned the ${item.badge.name} badge on Buncho for solving real AI interview problems.${tail}`;
    case 'streak': return `${d.streak} day practice streak on Buncho. Showing up every day for AI interviews.${tail}`;
    case 'collection': return `${d.earned.length} badges earned on Buncho so far. Building my AI interview skills one problem at a time.${tail}`;
    case 'rank': return `Level ${d.rank.i + 1}: ${d.rank.cur.name} on Buncho, with ${d.solved} AI interview problems solved.${tail}`;
    case 'progress': return `${d.pct}% of the Buncho AI interview question bank done. ${d.solved} of ${d.total} problems solved.${tail}`;
    case 'roadmap': return d.next ? `${d.solved} problems solved on Buncho and ${d.toNext} to go until ${d.next}.${tail}` : `Every milestone unlocked on Buncho with ${d.solved} problems solved.${tail}`;
    case 'score': return `My average AI score on Buncho is ${d.avgScore} out of 100 across my interview answers.${tail}`;
    case 'hard': return `${d.hard} hard AI interview problem${d.hard === 1 ? '' : 's'} solved on Buncho.${tail}`;
    case 'active': return `${d.days} days of AI interview practice on Buncho and counting.${tail}`;
    case 'invite': return `Come practise AI, ML and GenAI interview problems with me on Buncho.${tail}`;
    default: return `My AI interview prep on Buncho: ${d.solved} solved, ${d.streak} day streak.${tail}`;
  }
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
  lock: (<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  prev: <path d="m15 5-7 7 7 7" />,
  next: <path d="m9 5 7 7-7 7" />,
  shuffle: (<><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></>),
  expand: (<><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></>),
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
};

function Icon({ name, size = 18, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {ICON[name]}
    </svg>
  );
}

/* ------------------------------ small controls ------------------------------ */

/** Colour dots: profile colour, 8 swatches, any colour. `dark` = sits on the dark banner. */
function ColorRow({ color, setColor, defaultColor, dark = false }) {
  const on = dark ? 'border-white' : 'border-ink';
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button type="button" aria-label="Profile colour" title="Your profile colour" aria-pressed={color === defaultColor} onClick={() => setColor(defaultColor)} className={`h-8 w-8 rounded-full border-2 transition ${color === defaultColor ? `scale-110 ${on}` : 'border-transparent'}`} style={{ background: `conic-gradient(${defaultColor}, #fff 50%, ${defaultColor})` }} />
      {SWATCHES.map((s) => (
        <button key={s.hex} type="button" aria-label={s.name} title={s.name} aria-pressed={color === s.hex} onClick={() => setColor(s.hex)} className={`h-8 w-8 rounded-full border-2 transition ${color === s.hex ? `scale-110 ${on}` : 'border-transparent'}`} style={{ background: s.hex }} />
      ))}
      <label className={`relative grid h-8 w-8 cursor-pointer place-items-center overflow-hidden rounded-full border ${dark ? 'border-white/40' : 'border-line'}`} title="Pick any colour" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}>
        <span className="sr-only">Custom colour</span>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
    </div>
  );
}

function DesignSwatch({ id: did, color, className = '' }) {
  const pp = palette(did, color);
  let extra;
  if (did === 'neon' || did === 'blueprint') extra = `repeating-linear-gradient(0deg, ${did === 'neon' ? `${color}33` : 'rgba(207,228,255,.22)'} 0 1px, transparent 1px 8px), repeating-linear-gradient(90deg, ${did === 'neon' ? `${color}33` : 'rgba(207,228,255,.22)'} 0 1px, transparent 1px 8px)`;
  else if (did === 'bold') extra = 'repeating-linear-gradient(135deg, rgba(255,255,255,.14) 0 4px, transparent 4px 9px)';
  else if (did === 'terminal') extra = 'repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0 1px, transparent 1px 4px)';
  else if (did === 'royal') extra = `repeating-conic-gradient(from 0deg at 50% 50%, ${pp.hi}22 0 6deg, transparent 6deg 12deg)`;
  else if (did === 'sunset') extra = 'radial-gradient(circle at 50% 62%, #ffd36a 0 26%, transparent 27%)';
  else if (did === 'cosmic') extra = 'radial-gradient(circle at 78% 28%, #fff 0 1.5px, transparent 2px), radial-gradient(circle at 22% 66%, #fff 0 1px, transparent 1.5px), radial-gradient(circle at 56% 80%, #fff 0 1px, transparent 1.5px)';
  else if (did === 'glass') extra = 'linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0) 60%)';
  else if (did === 'holo') extra = 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,.55) 45%, transparent 60%)';
  return (
    <span className={`block overflow-hidden ${className}`} style={{ background: `linear-gradient(${did === 'sunset' ? 180 : 135}deg, ${pp.bg[0]}, ${pp.bg[1]}, ${pp.bg[2]})` }}>
      <span className="block h-full w-full" style={{ background: extra }} />
    </span>
  );
}

/* --------------------------------- the UI --------------------------------- */

export default function ShareCards({ name, username, url, metrics, badges, total, defaultColor }) {
  const [active, setActive] = useState(null); // index into items, or null when the popup is closed
  const [design, setDesign] = useState('aurora');
  const [fmt, setFmt] = useState('landscape');
  const [color, setColor] = useState(defaultColor);
  const [tab, setTab] = useState('all');
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
  const solved = metrics.solved;
  const d = {
    name,
    username,
    solved,
    total,
    pct: total ? Math.min(100, Math.round((solved / total) * 100)) : 0,
    streak: metrics.streak,
    avgScore: metrics.evals ? metrics.avgScore : null,
    hard: metrics.hard ?? 0,
    days: metrics.activeDays,
    earned,
    sample: badges.filter((b) => b.kind === 'milestone').slice(0, 6),
    milestones: badges
      .filter((b) => b.kind === 'milestone')
      .map((b) => ({ n: b.threshold, name: b.name, earned: b.earned }))
      .sort((a, b) => a.n - b.n),
    rank: rankOf(solved),
    next: next?.name ?? null,
    toNext: next ? Math.max(0, next.threshold - solved) : 0,
    display: url ? url.replace(/^https?:\/\//, '') : 'buncho.live',
  };

  /* every card in the gallery: general cards first, then one per badge */
  const items = [
    { key: 'solved', type: 'solved', label: 'Problems solved', locked: solved < 1, hint: 'Solve your first problem' },
    { key: 'streak', type: 'streak', label: 'Day streak', locked: metrics.streak < 1, hint: 'Practise today to start a streak' },
    { key: 'rank', type: 'rank', label: `Level ${d.rank.i + 1}: ${d.rank.cur.name}`, locked: solved < 10, hint: `Solve ${Math.max(0, 10 - solved)} more to reach Explorer` },
    { key: 'collection', type: 'collection', label: 'Badge collection', locked: earned.length < 1, hint: 'Earn your first badge' },
    { key: 'profile', type: 'profile', label: 'Profile summary', locked: solved < 1, hint: 'Solve your first problem' },
    { key: 'progress', type: 'progress', label: 'Question bank progress', locked: solved < 1, hint: 'Solve your first problem' },
    { key: 'roadmap', type: 'roadmap', label: 'Milestone roadmap', locked: solved < 1, hint: 'Solve your first problem' },
    { key: 'score', type: 'score', label: 'Average AI score', locked: metrics.evals < 1, hint: 'Get your first AI-scored answer' },
    { key: 'hard', type: 'hard', label: 'Hard problems', locked: d.hard < 1, hint: 'Solve a hard problem' },
    { key: 'active', type: 'active', label: 'Active days', locked: metrics.activeDays < 1, hint: 'Practise today' },
    { key: 'invite', type: 'invite', label: 'Invite friends', locked: false, hint: '' },
    ...earned.map((b) => ({ key: b.id, type: 'badge', label: b.name, badge: b, locked: false, hint: '' })),
    ...badges.filter((b) => !b.earned).map((b) => ({ key: b.id, type: 'badge', label: b.name, badge: b, locked: true, hint: hintFor(b, metrics) })),
  ];
  const counts = {
    all: items.length,
    stats: items.filter((i) => i.type !== 'badge').length,
    badges: items.filter((i) => i.type === 'badge').length,
    locked: items.filter((i) => i.locked).length,
  };
  const shown = items.filter((i) => (tab === 'stats' ? i.type !== 'badge' : tab === 'badges' ? i.type === 'badge' : tab === 'locked' ? i.locked : true));
  const unlocked = shown.filter((i) => !i.locked);
  const upcoming = shown.filter((i) => i.locked);
  const unlockedAll = items.filter((i) => !i.locked).length;
  const item = active != null ? items[active] : null;
  const canShare = Boolean(username) && item && !item.locked;
  const L = LAYOUT[fmt];
  const dName = DESIGNS.find((x) => x.id === design) ?? DESIGNS[0];
  const fileName = item ? `buncho-${username || 'card'}-${item.key}-${design}-${fmt}.png` : 'buncho-card.png';
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
  const surprise = () => {
    setDesign(DESIGNS[Math.floor(Math.random() * DESIGNS.length)].id);
    setColor(SWATCHES[Math.floor(Math.random() * SWATCHES.length)].hex);
  };

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

  const bannerBg = `radial-gradient(60% 150% at 0% 0%, ${mix(color, '#ffffff', 0.1)}66 0%, transparent 62%), radial-gradient(50% 130% at 100% 0%, ${shift(color, 50)}55 0%, transparent 62%), linear-gradient(135deg, ${mix('#05070d', color, 0.38)}, ${mix('#05070d', color, 0.12)})`;

  const tile = (it) => {
    const idx = items.indexOf(it);
    return (
      <li key={it.key}>
        <button
          type="button"
          onClick={() => setActive(idx)}
          aria-label={`${it.label}${it.locked ? ', locked' : ''}: open preview`}
          className="group relative block w-full overflow-hidden rounded-2xl border border-line bg-surface-2/40 text-left transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
        >
          <div className="relative overflow-hidden">
            <div className="transition duration-300 group-hover:scale-[1.03]" style={it.locked ? { filter: 'grayscale(0.9) brightness(0.62)' } : undefined}>
              <ShareCard thumb type={it.type} fmt="landscape" color={color} design={design} d={d} featured={it.badge} locked={it.locked} />
            </div>
            {it.locked && (
              <span className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/75 py-1 pl-1.5 pr-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow backdrop-blur">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20"><Icon name="lock" size={11} /></span>
                Locked
              </span>
            )}
            <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition duration-200 group-hover:bg-black/25 group-hover:opacity-100">
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-black shadow-lg">
                <Icon name="expand" size={14} />
                Preview
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 px-3.5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{it.label}</p>
              <p className="truncate text-xs text-muted">{it.locked ? it.hint : 'Preview, download and share'}</p>
            </div>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-muted ring-1 ring-line transition group-hover:bg-accent group-hover:text-accent-ink group-hover:ring-transparent">
              <Icon name="next" size={14} />
            </span>
          </div>
        </button>
      </li>
    );
  };

  const tabs = [
    { id: 'all', label: 'All cards' },
    { id: 'stats', label: 'Stats' },
    { id: 'badges', label: 'Badges' },
    { id: 'locked', label: 'Locked' },
  ];
  const grid = 'mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3';

  return (
    <section aria-labelledby="share-h" className="card overflow-hidden p-0">
      {/* style studio banner: its colours follow the colour you pick */}
      <div className="relative overflow-hidden px-5 pb-5 pt-5 text-white sm:px-6 sm:pt-6" style={{ background: bannerBg }}>
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl" style={{ background: color }} aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/70">
              <Icon name="sparkle" size={14} />
              Share studio
            </p>
            <h2 id="share-h" className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Share your achievements</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/75">
              {items.length} cards in {DESIGNS.length} designs, any colour, 4 sizes. Every thumbnail below follows the style you pick here. Locked cards show what is coming next.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">{unlockedAll} unlocked · {counts.locked} locked</span>
            <button type="button" onClick={surprise} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-black shadow transition hover:scale-105">
              <Icon name="shuffle" size={14} />
              Surprise me
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/60">Design · {dName.label} <span className="font-medium normal-case tracking-normal text-white/50">({dName.note})</span></p>
          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
            {DESIGNS.map((x) => (
              <button
                key={x.id}
                type="button"
                aria-pressed={design === x.id}
                onClick={() => setDesign(x.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-xs font-semibold transition ${design === x.id ? 'border-white bg-white text-black shadow-lg' : 'border-white/25 bg-white/10 text-white hover:bg-white/20'}`}
              >
                <DesignSwatch id={x.id} color={color} className="h-6 w-6 rounded-full ring-1 ring-black/10" />
                {x.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/60">Colour</p>
          <div className="mt-2">
            <ColorRow color={color} setColor={setColor} defaultColor={defaultColor} dark />
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {!username && (
          <p className="mb-5 rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-sm">
            Claim a username to share cards, so they can carry your profile link.{' '}
            <Link href="/settings/profile" className="font-semibold underline underline-offset-2">Claim username</Link>
          </p>
        )}

        <div role="tablist" aria-label="Card filter" className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${tab === t.id ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface hover:border-accent/60'}`}
            >
              {t.label}
              <span className={`ml-1.5 ${tab === t.id ? 'opacity-80' : 'text-muted'}`}>{counts[t.id]}</span>
            </button>
          ))}
        </div>

        {tab !== 'locked' && (
          <>
            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Your cards</h3>
            {unlocked.length ? (
              <ul className={grid}>{unlocked.map(tile)}</ul>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                {tab === 'badges' ? 'Earn your first badge to unlock a badge card.' : 'Solve your first problem to unlock your first card.'}
              </p>
            )}
          </>
        )}

        <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-muted">{tab === 'locked' ? 'Locked cards' : 'Upcoming (locked)'}</h3>
        {upcoming.length ? (
          <ul className={grid}>{upcoming.map(tile)}</ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Everything here is unlocked. Legendary.</p>
        )}
      </div>

      {/* popup */}
      <dialog
        ref={dialogRef}
        onClose={() => setActive(null)}
        onClick={(e) => e.target === dialogRef.current && setActive(null)}
        onKeyDown={(e) => {
          if (e.target instanceof HTMLInputElement) return;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            step(-1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            step(1);
          }
        }}
        aria-label="Card preview"
        className="m-auto max-h-[94dvh] w-[min(calc(100vw-1rem),68rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/75"
      >
        {item && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <button type="button" onClick={() => step(-1)} aria-label="Previous card" className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-accent"><Icon name="prev" /></button>
                <button type="button" onClick={() => step(1)} aria-label="Next card" className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-accent"><Icon name="next" /></button>
                <div className="ml-1 min-w-0">
                  <h3 className="truncate text-base font-semibold">{item.label}</h3>
                  <p className="text-xs text-muted">{item.locked ? `Locked · ${item.hint}` : 'Unlocked'} · {dName.label} · {L.label}</p>
                </div>
              </div>
              <button type="button" onClick={() => setActive(null)} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line hover:border-accent"><Icon name="close" /></button>
            </div>

            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              {/* preview */}
              <div className="min-w-0">
                <div className="relative mx-auto overflow-hidden rounded-2xl border border-line shadow-2xl" style={{ maxWidth: PREVIEW_MAX_W[fmt] }}>
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
                <p className="mt-2 text-center text-xs text-muted">{L.size} px · PNG at 2x · use the arrow keys to browse cards</p>
              </div>

              {/* controls */}
              <div className="space-y-5">
                <fieldset>
                  <legend className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
                    <span>Design</span>
                    <button type="button" onClick={surprise} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[0.68rem] font-semibold normal-case tracking-normal transition hover:border-accent hover:text-accent">
                      <Icon name="shuffle" size={12} />
                      Surprise me
                    </button>
                  </legend>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {DESIGNS.map((x) => (
                      <button key={x.id} type="button" aria-pressed={design === x.id} onClick={() => setDesign(x.id)} title={x.note} className="group text-center">
                        <DesignSwatch id={x.id} color={color} className={`h-12 rounded-lg border-2 transition ${design === x.id ? 'border-accent ring-2 ring-accent/30' : 'border-line group-hover:border-accent/60'}`} />
                        <span className={`mt-1 block truncate text-[0.68rem] font-semibold ${design === x.id ? 'text-accent' : 'text-muted'}`}>{x.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-xs font-semibold uppercase tracking-wider text-muted">Colour</legend>
                  <div className="mt-2">
                    <ColorRow color={color} setColor={setColor} defaultColor={defaultColor} />
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-xs font-semibold uppercase tracking-wider text-muted">Size</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.entries(LAYOUT).map(([k, v]) => (
                      <button key={k} type="button" aria-pressed={fmt === k} onClick={() => setFmt(k)} className={`rounded-xl border px-3 py-2 text-left transition ${fmt === k ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent/60'}`}>
                        <span className="block text-sm font-semibold">{v.label}</span>
                        <span className="block text-[0.68rem] text-muted">{v.size}</span>
                      </button>
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