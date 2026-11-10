/* ------------------------------------------------------------------ */
/* Badges. Everything is computed from real activity, nothing is       */
/* stored, so a badge can never drift from the numbers behind it.      */
/* Pure data and helpers: safe to import in server and client code.    */
/* ------------------------------------------------------------------ */

const ROMAN = ['I', 'II', 'III'];

/**
 * Milestone families. A family with 3 thresholds is ONE badge design earned at 3 levels (1, 2, 3 stars),
 * named "<name> I / II / III". A family with a single threshold is its own one-off badge (no stars).
 * Every family has its own shape, colour, icon and animation (fx).
 */
const FAMILIES = [
  { name: 'Debut', at: [10], tier: 'emerald', shape: 'circle', glyph: 'neuron' },
  { name: 'Breeze', at: [25, 50, 100], tier: 'sapphire', shape: 'hexagon', glyph: 'perceptron' },
  { name: 'Climber', at: [150, 200, 250], tier: 'amethyst', shape: 'shield', glyph: 'attention' },
  { name: 'Thunder', at: [300, 350, 400], tier: 'ember', shape: 'octagon', glyph: 'agent' },
  { name: 'Champion', at: [450, 500, 550], tier: 'gold', shape: 'diamond', glyph: 'eye' },
  { name: 'Immortal', at: [600], tier: 'ruby', shape: 'seal', glyph: 'singularity' },
];

/** Problem-count milestones, in order. */
export const MILESTONES = FAMILIES.flatMap((f) => f.at);

const MILESTONE_BADGES = FAMILIES.flatMap((f, fi) =>
  f.at.map((n, j) => {
    const multi = f.at.length > 1;
    return {
      id: `solved-${n}`,
      kind: 'milestone',
      threshold: n,
      family: f.name.toLowerCase(),
      stars: multi ? j + 1 : 0,
      name: multi ? `${f.name} ${ROMAN[j]}` : f.name,
      desc: `Solved ${n} problems`,
      tier: f.tier,
      shape: f.shape,
      glyph: f.glyph,
      fx: fi,
      test: (m) => m.solved >= n,
    };
  }),
);

// fx continues after the milestone families so every design gets its own animation combination.
const ACHIEVEMENT_BADGES = [
  { id: 'first', name: 'Ignition', desc: 'Solved your first problem', tier: 'emerald', shape: 'circle', glyph: 'spark', test: (m) => m.solved >= 1 },
  { id: 'streak7', name: 'Blaze', desc: 'Reached a 7 day streak', tier: 'ember', shape: 'hexagon', glyph: 'flame', test: (m) => m.streak >= 7 },
  { id: 'streak30', name: 'Inferno', desc: 'Reached a 30 day streak', tier: 'ruby', shape: 'burst', glyph: 'inferno', test: (m) => m.streak >= 30 },
  { id: 'hard', name: 'Summit', desc: 'Solved 5 hard problems', tier: 'sapphire', shape: 'diamond', glyph: 'peak', test: (m) => m.hard >= 5 },
  { id: 'regular', name: 'Clockwork', desc: 'Practised on 20 different days', tier: 'silver', shape: 'hexagon', glyph: 'calendar', test: (m) => m.activeDays >= 20 },
  { id: 'pro', name: 'Patron', desc: 'Supports Buncho with Pro', tier: 'gold', shape: 'shield', glyph: 'crown', test: (m) => m.pro },
].map((b, i) => ({ kind: 'achievement', ...b, fx: FAMILIES.length + i }));

const ALL = [...MILESTONE_BADGES, ...ACHIEVEMENT_BADGES];

/** Every badge with an `earned` flag. m = { solved, streak, hard, helpful, shared, activeDays, pro } */
export const badgeList = (m) => ALL.map(({ test, ...b }) => ({ ...b, earned: Boolean(test(m)) }));

/** Earned badges, most impressive first: highest milestone, then the achievements. */
export function sortEarned(badges) {
  const earned = badges.filter((b) => b.earned);
  return [
    ...earned.filter((b) => b.kind === 'milestone').sort((a, b) => b.threshold - a.threshold),
    ...earned.filter((b) => b.kind === 'achievement'),
  ];
}

/**
 * Where the user is on the milestone path.
 * reached: milestones unlocked, next: the next one (or null), fraction: progress between the last and next one (0..1),
 * line: how far along the connecting line the progress bar should reach (0..1, first to last medal).
 */
export function milestoneProgress(solved) {
  const n = MILESTONES.length;
  const reached = MILESTONES.filter((t) => solved >= t).length;
  if (reached >= n) return { reached, next: null, prev: MILESTONES[n - 1], fraction: 1, toNext: 0, line: 1 };
  const prev = reached === 0 ? 0 : MILESTONES[reached - 1];
  const nextT = MILESTONES[reached];
  const fraction = Math.max(0, Math.min(1, (solved - prev) / (nextT - prev)));
  const line = reached === 0 ? 0 : (reached - 1 + fraction) / (n - 1);
  return { reached, next: MILESTONE_BADGES[reached], prev, fraction, toNext: nextT - solved, line };
}