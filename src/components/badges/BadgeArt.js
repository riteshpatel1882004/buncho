import { useId } from 'react';

// Colour tiers: light = rim highlight, mid = main metal, dark = shadow, text = glyph colour.
const TIERS = {
  bronze: { light: '#f8c995', mid: '#cd7f32', dark: '#6e3b12', text: '#fff1e0' },
  silver: { light: '#ffffff', mid: '#aab4c3', dark: '#566174', text: '#ffffff' },
  gold: { light: '#fff0a8', mid: '#f5b301', dark: '#7d4f00', text: '#fff9dc' },
  emerald: { light: '#9af7c9', mid: '#12b76a', dark: '#04472a', text: '#e6fff3' },
  sapphire: { light: '#a8d4ff', mid: '#2e7cf6', dark: '#0c2a70', text: '#eaf4ff' },
  amethyst: { light: '#e6c2ff', mid: '#9b5de5', dark: '#34156e', text: '#f7ecff' },
  ruby: { light: '#ffb8c6', mid: '#f43f5e', dark: '#6f0d27', text: '#fff0f3' },
  ember: { light: '#ffd6a8', mid: '#ff7a1a', dark: '#7d2900', text: '#fff3e6' },
};
const LOCKED = { light: '#8b9198', mid: '#5f656b', dark: '#33373b', text: '#c4c9ce' };

// Every earned badge is animated IN PLACE: it never moves up, down, left or right (no float, sway, drift,
// swing or scale). Glow effect (6) x overlay effect (4) = 24 unique combinations, picked from badge.fx
// (set in lib/badges.js). The glow effects only change light (glow + brightness), never position.
const MOTIONS = ['ignition', 'blaze', 'glow', 'shimmer', 'halo', 'flare'];
const OVERLAYS = ['sweep', 'orbit', 'radar', 'twinkle'];

// Fixed spots where small sparkles twinkle (they stay where they are, only their light changes).
const TWINKLE = [
  { x: 30, y: 30, r: 2, t: 0 },
  { x: 72, y: 36, r: 1.6, t: 700 },
  { x: 38, y: 74, r: 1.5, t: 1400 },
  { x: 68, y: 70, r: 1.9, t: 2100 },
];
const ORBIT = [
  { a: 0, r: 2.6 },
  { a: 120, r: 2 },
  { a: 240, r: 1.5 },
];

function burst(n, outer, inner) {
  const pts = [];
  for (let i = 0; i < n * 2; i += 1) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

// 5-point star centred on (cx, cy).
function starPoints(cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / 5 - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

const SHAPES = {
  circle: { circle: true },
  hexagon: { points: '50,4 90,27 90,73 50,96 10,73 10,27' },
  shield: { path: 'M50 4 L90 17 V50 C90 73 71 89 50 97 C29 89 10 73 10 50 V17 Z' },
  octagon: { points: '32,5 68,5 95,32 95,68 68,95 32,95 5,68 5,32' },
  diamond: { points: '50,2 96,50 50,98 4,50' },
  burst: { points: burst(12, 48, 39) },
  seal: { points: burst(20, 48, 43.5) },
};

function Shape({ shape, ...props }) {
  const s = SHAPES[shape] ?? SHAPES.circle;
  if (s.circle) return <circle cx="50" cy="50" r="45" {...props} />;
  if (s.points) return <polygon points={s.points} strokeLinejoin="round" {...props} />;
  return <path d={s.path} strokeLinejoin="round" {...props} />;
}

// Small line icons (24x24 grid) drawn in the middle of the badges.
const GLYPHS = {
  // --- milestone families ---
  neuron: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <circle cx="5" cy="6" r="1.7" />
      <circle cx="19" cy="6" r="1.7" />
      <circle cx="5" cy="18" r="1.7" />
      <circle cx="19" cy="18" r="1.7" />
      <path d="M6.4 7.2l3.8 3.4M17.6 7.2l-3.8 3.4M6.4 16.8l3.8-3.4M17.6 16.8l-3.8-3.4" />
    </>
  ),
  perceptron: (
    <>
      <circle cx="5" cy="6" r="1.6" />
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="5" cy="18" r="1.6" />
      <circle cx="15" cy="12" r="3" />
      <path d="M6.5 6.8l6 3.8M6.7 12h5.3M6.5 17.2l6-3.8M18 12h4" />
    </>
  ),
  attention: (
    <>
      <circle cx="5" cy="5" r="1.6" />
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="19" cy="5" r="1.6" />
      <circle cx="5" cy="19" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
      <circle cx="19" cy="19" r="1.6" />
      <path d="M5 6.8v10.4M12 6.8v10.4M19 6.8v10.4M5.9 6.3l5.2 11.4M12.9 6.3l5.2 11.4M18.1 6.3l-5.2 11.4" />
    </>
  ),
  agent: (
    <>
      <rect x="4.5" y="8" width="15" height="11.5" rx="3" />
      <path d="M12 8V4.5M9.5 13h.01M14.5 13h.01M9 16.5h6" />
      <circle cx="12" cy="3.4" r="1.1" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  singularity: (
    <path
      fill="none"
      d="M12 12a1.5 1.5 0 0 1 3 0a3.5 3.5 0 0 1-7 0a5.5 5.5 0 0 1 11 0a7.5 7.5 0 0 1-15 0"
    />
  ),
  // --- achievements ---
  spark: <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />,
  flame: <path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />,
  inferno: (
    <>
      <path d="M12 2c1.2 3.4 6 5.6 6 11.5a6 6 0 0 1-12 0c0-2.2 1.1-3.6 2.4-4.8 0 2.2 1.1 3.3 2.2 3.3 0-3.4-1.2-5.6 1.4-10z" />
      <path d="M12 21.5a2.8 2.8 0 0 0 2.8-2.8c0-1.7-1.4-2.5-2.8-4.2-1.4 1.7-2.8 2.5-2.8 4.2a2.8 2.8 0 0 0 2.8 2.8z" />
    </>
  ),
  peak: (
    <>
      <path d="M2 20l7-12 4 6 2.5-3.5L22 20z" />
      <path d="M9 8V3.5l4 1.5-4 1.5" />
    </>
  ),
  cap: (
    <>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11.5V16c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.5" />
      <path d="M22 9v6" />
    </>
  ),
  heart: <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 18h2M14 18h2" />
    </>
  ),
  crown: <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5zM5.4 20.5h13.2" />,
};

// x positions of the star row for 1, 2 and 3 stars.
const STAR_X = { 1: [50], 2: [42, 58], 3: [34, 50, 66] };

/**
 * One badge, drawn as SVG.
 * Milestones show a family icon and 0-3 stars (the level), achievements show an icon.
 * earned=false renders a dim grey version with no motion.
 * Earned badges are always animated (animate defaults to true): each design has its own in-place glow effect
 * (Ignition, Blaze, ...) plus its own overlay effect. The badge itself never changes position.
 * The pop-in is still done by the wrapper with the .badge-pop class. Works in server and client components.
 */
export default function BadgeArt({ badge, size = 72, earned = badge.earned, animate = true, delay = 0, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const pal = earned ? (TIERS[badge.tier] ?? TIERS.bronze) : LOCKED;
  const id = (k) => `${uid}${k}`;

  const stars = badge.kind === 'milestone' ? Math.min(3, badge.stars ?? 0) : 0;

  const animated = Boolean(earned && animate);
  const fx = Number.isFinite(badge.fx) ? badge.fx : 0;
  const motion = MOTIONS[fx % MOTIONS.length];
  const overlay = OVERLAYS[Math.floor(fx / MOTIONS.length) % OVERLAYS.length];
  // Negative delay = every design starts at a different point of its loop, so they never move in lockstep.
  const phase = -((fx * 370) % 3000);

  // Milestone glyph sits a little higher when there is a star row under it.
  const gScale = 1.7;
  const gCy = stars ? 42 : 50;
  const gx = 50 - 12 * gScale;
  const gy = gCy - 12 * gScale;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`${badge.name}${earned ? '' : ' (locked)'}`}
      className={`${className} ${animated ? `bm-${motion}` : ''}`.trim()}
      style={{
        '--d': `${delay}ms`,
        '--p': `${phase}ms`,
        '--glow': pal.mid,
        // Animated badges get their glow from the .bm-* class (so it can pulse); static ones keep a fixed shadow.
        filter: earned && !animated ? `drop-shadow(0 5px 8px ${pal.mid}59)` : undefined,
        opacity: earned ? 1 : 0.55,
      }}
    >
      <defs>
        <linearGradient id={id('o')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={pal.light} />
          <stop offset="45%" stopColor={pal.mid} />
          <stop offset="100%" stopColor={pal.dark} />
        </linearGradient>
        <linearGradient id={id('i')} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={pal.dark} />
          <stop offset="100%" stopColor={pal.mid} />
        </linearGradient>
        <radialGradient id={id('g')} cx="0.3" cy="0.15" r="0.75">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('s')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('r')} gradientUnits="userSpaceOnUse" x1="50" y1="50" x2="135" y2="50">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.6" />
        </linearGradient>
        <clipPath id={id('c')}>
          <Shape shape={badge.shape} />
        </clipPath>
      </defs>

      {/* rim */}
      <Shape shape={badge.shape} fill={`url(#${id('o')})`} stroke={`url(#${id('o')})`} strokeWidth="3" />

      {/* inner face */}
      <g transform="translate(50 50) scale(0.8) translate(-50 -50)">
        <Shape shape={badge.shape} fill={`url(#${id('i')})`} stroke={pal.light} strokeOpacity="0.55" strokeWidth="1.8" />
      </g>

      {/* centre icon */}
      {badge.kind === 'milestone' ? (
        <g
          transform={`translate(${gx} ${gy}) scale(${gScale})`}
          fill={pal.text}
          fillOpacity="0.22"
          stroke={pal.text}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {GLYPHS[badge.glyph]}
        </g>
      ) : (
        <g
          transform="translate(27 27) scale(1.95)"
          fill={pal.text}
          fillOpacity="0.22"
          stroke={pal.text}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {GLYPHS[badge.glyph]}
        </g>
      )}

      {/* level stars (milestone families only: 1, 2 or 3) */}
      {stars > 0 &&
        STAR_X[stars].map((x) => (
          <polygon
            key={x}
            points={starPoints(x, 71, 6.4, 2.7)}
            fill={earned ? '#ffd84d' : pal.text}
            stroke={earned ? '#5b3a00' : pal.dark}
            strokeOpacity="0.7"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
        ))}

      {/* gloss + overlay effect, clipped to the badge outline */}
      <g clipPath={`url(#${id('c')})`}>
        <ellipse cx="36" cy="24" rx="34" ry="20" transform="rotate(-28 36 24)" fill={`url(#${id('g')})`} opacity="0.55" />

        {animated && overlay === 'sweep' && (
          <rect className="bo-sweep" x="0" y="-10" width="22" height="120" fill={`url(#${id('s')})`} />
        )}

        {animated && overlay === 'radar' && (
          <polygon className="bo-radar" points="50,50 135,28 135,72" fill={`url(#${id('r')})`} />
        )}

        {animated &&
          overlay === 'twinkle' &&
          TWINKLE.map((p) => (
            <circle
              key={`${p.x}-${p.y}`}
              className="bo-twinkle"
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={pal.text}
              style={{ animationDelay: `calc(var(--p, 0ms) - ${p.t}ms)`, transformOrigin: `${p.x}px ${p.y}px` }}
            />
          ))}
      </g>

      {/* sparkles circling the rim (not clipped, so they orbit the outside edge) */}
      {animated && overlay === 'orbit' && (
        <g className="bo-orbit">
          {ORBIT.map((o) => {
            const a = (o.a * Math.PI) / 180;
            const cx = 50 + 47 * Math.cos(a);
            const cy = 50 + 47 * Math.sin(a);
            return (
              <g key={o.a}>
                <circle cx={cx} cy={cy} r={o.r + 1.6} fill={pal.light} fillOpacity="0.45" />
                <circle cx={cx} cy={cy} r={o.r} fill="#fff" />
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}