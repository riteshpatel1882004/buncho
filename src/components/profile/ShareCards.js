'use client';

import { useId, useRef, useState } from 'react';
import BadgeArt from '@/components/badges/BadgeArt';

/* ------------------------------------------------------------------ */
/* Share cards: 5 card types x any colour x 2 sizes, drawn as one SVG. */
/* The same SVG is the live preview and the PNG you download or share. */
/* No external fonts or images, so the canvas export is never blocked. */
/* ------------------------------------------------------------------ */

const FONT = "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

export const CARD_TYPES = [
  { id: 'solved', label: 'Problems solved', desc: 'Progress ring' },
  { id: 'badge', label: 'Badge earned', desc: 'Any badge, any level' },
  { id: 'streak', label: 'Day streak', desc: 'Flame counter' },
  { id: 'collection', label: 'Badge collection', desc: 'Your best badges' },
  { id: 'profile', label: 'Profile summary', desc: 'All key stats' },
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

/* ------------------------------- the card ------------------------------- */

export function ShareCard({ svgRef, type, fmt, color, d }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (k) => `${uid}${k}`;
  const L = LAYOUT[fmt];
  const { W, H } = L;
  const base = '#05070d';
  const bg1 = mix(base, color, 0.14);
  const bg2 = mix(base, color, 0.44);
  const hi = mix(color, '#ffffff', 0.4);
  const soft = mix(color, '#ffffff', 0.78);
  const A = L.anchor;
  const isSquare = fmt === 'square';

  const topBadge = d.earned[0] ?? null;
  const featured = d.earned.find((b) => b.id === d.badgeId) ?? topBadge;

  /* ----- text for each card type ----- */
  let eyebrow = '';
  let title = '';
  let sub = '';
  if (type === 'solved') {
    eyebrow = 'ACHIEVEMENT';
    title = 'Problems solved';
    sub = d.next ? `${d.solved} of ${d.total} problems. Only ${d.toNext} more to unlock ${d.next}.` : `${d.solved} of ${d.total} problems. Every milestone unlocked.`;
  } else if (type === 'badge' && featured) {
    eyebrow = 'BADGE EARNED';
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

  /* ----- the big visual in the middle of the left (or top) ----- */
  let visual = null;
  if (type === 'solved') {
    const R = 150;
    const C = 2 * Math.PI * R;
    const frac = Math.max(0.035, Math.min(1, d.solved / Math.max(1, d.total)));
    visual = (
      <g>
        <circle r={R} fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.12)" strokeWidth="26" />
        <circle r={R} fill="none" stroke={`url(#${id('ring')})`} strokeWidth="26" strokeLinecap="round" strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90)" />
        <text y="22" textAnchor="middle" fontFamily={FONT} fontWeight="800" fontSize={String(d.solved).length > 3 ? 104 : 126} fill="#fff">{d.solved}</text>
        <text y="66" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="26" fill={soft} opacity="0.85">{`of ${d.total} problems`}</text>
      </g>
    );
  } else if (type === 'badge' && featured) {
    visual = (
      <g>
        <g transform="translate(-175 -175)">
          <BadgeArt badge={{ ...featured, earned: true }} size={350} animate={false} />
        </g>
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
    const list = d.earned.slice(0, 6);
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
              <BadgeArt badge={{ ...b, earned: true }} size={S} animate={false} />
            </g>
          ));
        })}
      </g>
    );
  } else if (type === 'profile') {
    visual = (
      <g>
        <circle r="150" fill={`url(#${id('ring')})`} />
        <circle r="136" fill={bg1} />
        <text y="48" textAnchor="middle" fontFamily={FONT} fontWeight="800" fontSize="150" fill="#fff">{d.name.charAt(0).toUpperCase()}</text>
        {topBadge && (
          <g transform="translate(62 62)">
            <circle cx="55" cy="55" r="62" fill={bg1} />
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
          <stop offset="0%" stopColor={bg2} />
          <stop offset="55%" stopColor={bg1} />
          <stop offset="100%" stopColor={base} />
        </linearGradient>
        <radialGradient id={id('glow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('corner')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={hi} stopOpacity="0.38" />
          <stop offset="100%" stopColor={hi} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('ring')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={hi} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <linearGradient id={id('fire')} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#ffd84d" />
          <stop offset="55%" stopColor="#ff8a1f" />
          <stop offset="100%" stopColor="#e5361b" />
        </linearGradient>
        <linearGradient id={id('brand')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={hi} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <pattern id={id('dots')} width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill="#fff" opacity="0.14" />
        </pattern>
      </defs>

      {/* background */}
      <rect width={W} height={H} fill={`url(#${id('bg')})`} />
      <rect width={W} height={H} fill={`url(#${id('dots')})`} />
      <circle cx={W} cy="0" r={isSquare ? 560 : 440} fill={`url(#${id('corner')})`} />
      <circle cx="0" cy={H} r={isSquare ? 480 : 380} fill={`url(#${id('glow')})`} opacity="0.55" />
      <path d={`M0 ${H * 0.72} C ${W * 0.3} ${H * 0.55}, ${W * 0.6} ${H * 0.95}, ${W} ${H * 0.7} L ${W} ${H} L 0 ${H} Z`} fill="#000" opacity="0.18" />
      {sparks.map(([fx, fy, s], i) => (
        <Spark key={i} x={W * fx} y={H * fy} s={s} fill={soft} o={0.55} />
      ))}
      <rect x="14" y="14" width={W - 28} height={H - 28} rx="30" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="2" />

      {/* header: who */}
      <g transform="translate(60 56)">
        <circle cx="26" cy="26" r="26" fill={`url(#${id('brand')})`} />
        <text x="26" y="36" textAnchor="middle" fontFamily={FONT} fontWeight="800" fontSize="28" fill="#06100a">{d.name.charAt(0).toUpperCase()}</text>
        <text x="68" y="24" fontFamily={FONT} fontWeight="700" fontSize="26" fill="#fff">{d.name}</text>
        <text x="68" y="50" fontFamily={FONT} fontWeight="500" fontSize="20" fill={soft} opacity="0.8">{`@${d.username}`}</text>
      </g>

      {/* the visual */}
      <g transform={`translate(${L.vx} ${L.vy}) scale(${L.vs})`}>
        <circle r="270" fill={`url(#${id('glow')})`} />
        <circle r="228" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="2" strokeDasharray="3 11" />
        <circle r="262" fill="none" stroke="#fff" strokeOpacity="0.06" strokeWidth="2" />
        {visual}
      </g>

      {/* the words */}
      <text x={L.tx} y={ty} textAnchor={A} fontFamily={FONT} fontWeight="800" fontSize="22" letterSpacing="5" fill={hi}>{eyebrow}</text>
      <text x={L.tx} y={titleY} textAnchor={A} fontFamily={FONT} fontWeight="800" fontSize={titleFs} fill="#fff">{title}</text>
      {type !== 'profile' &&
        subLines.map((line, i) => (
          <text key={i} x={L.tx} y={titleY + 50 + i * 38} textAnchor={A} fontFamily={FONT} fontWeight="500" fontSize="28" fill={soft} opacity="0.88">{line}</text>
        ))}
      {type === 'profile' &&
        stats.map((s, i) => {
          const x = isSquare ? 540 + (i - 1.5) * 235 : L.tx + (i % 2) * 270;
          const y = isSquare ? titleY + 95 : titleY + 62 + Math.floor(i / 2) * 100;
          return (
            <g key={s.l}>
              <text x={x} y={y} textAnchor={A} fontFamily={FONT} fontWeight="800" fontSize={isSquare ? 62 : 52} fill="#fff">{s.v}</text>
              <text x={x} y={y + 32} textAnchor={A} fontFamily={FONT} fontWeight="600" fontSize="21" fill={soft} opacity="0.8">{s.l}</text>
            </g>
          );
        })}

      {/* footer: brand */}
      <g transform={`translate(60 ${H - 100})`}>
        <rect width="44" height="44" rx="12" fill={`url(#${id('brand')})`} />
        <text x="22" y="32" textAnchor="middle" fontFamily={FONT} fontWeight="900" fontSize="28" fill="#06100a">B</text>
        <text x="58" y="31" fontFamily={FONT} fontWeight="800" fontSize="30" fill="#fff">Buncho</text>
      </g>
      <g transform={`translate(${W - 60} ${H - 100})`}>
        <rect x={-(d.display.length * 12.6 + 48)} width={d.display.length * 12.6 + 48} height="44" rx="22" fill="#000" fillOpacity="0.38" stroke="#fff" strokeOpacity="0.22" />
        <text x={-(d.display.length * 12.6 + 48) / 2} y="30" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" fontWeight="700" fontSize="21" fill="#fff">{d.display}</text>
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

function captionFor(type, d, url, featured) {
  const tail = `\n\nSee my profile: ${url}`;
  if (type === 'solved') return `I've solved ${d.solved} AI interview problems on Buncho. Practising AI, ML and GenAI interviews the smart way.${tail}`;
  if (type === 'badge' && featured) return `I just earned the ${featured.name} badge on Buncho for solving real AI interview problems.${tail}`;
  if (type === 'streak') return `${d.streak} day practice streak on Buncho. Showing up every day for AI interviews.${tail}`;
  if (type === 'collection') return `${d.earned.length} badges earned on Buncho so far. Building my AI interview skills one problem at a time.${tail}`;
  return `My AI interview prep on Buncho: ${d.solved} solved, ${d.streak} day streak.${tail}`;
}

/* --------------------------------- the UI --------------------------------- */

export default function ShareCards({ name, username, url, solved, total, streak, avgScore, days, earned, next, toNext, defaultColor }) {
  const [type, setType] = useState('solved');
  const [fmt, setFmt] = useState('landscape');
  const [color, setColor] = useState(defaultColor);
  const [badgeId, setBadgeId] = useState(earned[0]?.id ?? null);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const svgRef = useRef(null);

  const display = url.replace(/^https?:\/\//, '');
  const d = { name, username, solved, total, streak, avgScore, days, earned, next, toNext, badgeId, display };
  const featured = earned.find((b) => b.id === badgeId) ?? earned[0] ?? null;
  const L = LAYOUT[fmt];
  const needsBadge = (t) => (t === 'badge' || t === 'collection') && !earned.length;
  const caption = captionFor(type, d, url, featured);
  const fileName = `buncho-${username}-${type}-${fmt}.png`;

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
  const links = [
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(caption.replace(`\n\nSee my profile: ${url}`, ''))}&url=${enc(url)}` },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: 'WhatsApp', href: `https://wa.me/?text=${enc(caption)}` },
  ];

  const btn = 'rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent disabled:opacity-50';

  return (
    <section aria-labelledby="share-h" className="card overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="share-h" className="text-lg font-semibold tracking-tight">Share your achievements</h2>
          <p className="mt-1 text-sm text-muted">Pick a card, choose a colour, then download it or post it. Every card carries your link.</p>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">{display}</span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* live preview */}
        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-line shadow-lg" style={{ maxWidth: fmt === 'square' ? '30rem' : undefined, marginInline: fmt === 'square' ? 'auto' : undefined }}>
            <ShareCard svgRef={svgRef} type={needsBadge(type) ? 'solved' : type} fmt={fmt} color={color} d={d} />
          </div>
          <p className="mt-2 text-center text-xs text-muted">{L.size} px · PNG at 2x for sharp posts</p>
        </div>

        {/* controls */}
        <div className="space-y-5">
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted">Card type</legend>
            <div className="mt-2 grid gap-2">
              {CARD_TYPES.map((t) => {
                const off = needsBadge(t.id);
                const on = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={off}
                    aria-pressed={on}
                    onClick={() => setType(t.id)}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${on ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent/60'}`}
                  >
                    <span className="font-semibold">{t.label}</span>
                    <span className="text-xs text-muted">{off ? 'Earn a badge first' : t.desc}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {type === 'badge' && earned.length > 0 && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Which badge</span>
              <select value={badgeId ?? ''} onChange={(e) => setBadgeId(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-medium">
                {earned.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}{b.stars > 0 ? ` (level ${b.stars})` : ''}</option>
                ))}
              </select>
            </label>
          )}

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted">Colour</legend>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                aria-label="Profile colour"
                aria-pressed={color === defaultColor}
                onClick={() => setColor(defaultColor)}
                className={`h-8 w-8 rounded-full border-2 transition ${color === defaultColor ? 'border-ink scale-110' : 'border-transparent'}`}
                style={{ background: `conic-gradient(${defaultColor}, #fff 50%, ${defaultColor})` }}
                title="Your profile colour"
              />
              {SWATCHES.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  aria-label={s.name}
                  aria-pressed={color === s.hex}
                  title={s.name}
                  onClick={() => setColor(s.hex)}
                  className={`h-8 w-8 rounded-full border-2 transition ${color === s.hex ? 'scale-110 border-ink' : 'border-transparent'}`}
                  style={{ background: s.hex }}
                />
              ))}
              <label className="relative grid h-8 w-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-line text-xs font-bold" title="Pick any colour" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}>
                <span className="sr-only">Custom colour</span>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted">Size</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(LAYOUT).map(([k, v]) => (
                <button key={k} type="button" aria-pressed={fmt === k} onClick={() => setFmt(k)} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${fmt === k ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent/60'}`}>
                  {v.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2.5">
            <button type="button" onClick={download} disabled={Boolean(busy)} className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink shadow-sm transition hover:opacity-90 disabled:opacity-60">
              {busy === 'download' ? 'Creating image...' : 'Download card (PNG)'}
            </button>
            <button type="button" onClick={nativeShare} disabled={Boolean(busy)} className={`${btn} w-full`}>
              {busy === 'share' ? 'Opening...' : 'Share card'}
            </button>
            <div className="grid grid-cols-3 gap-2">
              {links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={`${btn} text-center !px-2`}>{l.label}</a>
              ))}
            </div>
            <button type="button" onClick={copyCaption} className={`${btn} w-full`}>Copy caption</button>
            <p role="status" aria-live="polite" className="min-h-5 text-center text-xs font-medium text-accent">{note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}