// Radar chart of the percent solved per category. Pure SVG, rendered on the server, themed with CSS variables.
// topics: [{ slug, name, avg }]. avg is 0-100 (percent solved); null keeps the axis at the centre and labels it N/A.

const SIZE = 340; // a little padding around the 320 chart so labels never get clipped
const C = SIZE / 2;
const R = 100;

const point = (i, n, value) => {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const r = (R * value) / 100;
  return [C + r * Math.cos(angle), C + r * Math.sin(angle)];
};

const short = (s) => (s.length > 14 ? `${s.slice(0, 13).trim()}…` : s);

export default function SkillRadar({ topics, color }) {
  const data = topics.slice(0, 7);
  const val = (t) => t.avg ?? 0;
  const n = data.length;
  const poly = data.map((t, i) => point(i, n, val(t)).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Percent solved by category: ${data.map((t) => `${t.name} ${t.avg ?? 0}%`).join(', ')}`} className="mx-auto w-full max-w-[22rem] overflow-visible">
      <defs>
        <radialGradient id="radar-fill" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0.15" />
        </radialGradient>
      </defs>
      {[25, 50, 75, 100].map((ring) => (
        <polygon key={ring} points={data.map((_, i) => point(i, n, ring).join(',')).join(' ')} fill="none" stroke="var(--line)" strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, n, 100);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" />;
      })}
      <polygon points={poly} fill="url(#radar-fill)" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((t, i) => {
        const [x, y] = point(i, n, val(t));
        const [lx, ly] = point(i, n, 128);
        const anchor = lx < C - 8 ? 'end' : lx > C + 8 ? 'start' : 'middle';
        return (
          <g key={t.slug}>
            <circle cx={x} cy={y} r="4.5" fill={t.avg == null ? 'var(--surface)' : color} stroke={t.avg == null ? 'var(--muted)' : 'var(--surface)'} strokeWidth="2" />
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize="11" fontWeight="600" fill="var(--ink)">
              {short(t.name)}
            </text>
            <text x={lx} y={ly + 13} textAnchor={anchor} dominantBaseline="middle" fontSize="10.5" fill="var(--muted)">
              {t.avg == null ? 'N/A' : `${t.avg}%`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}