import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { findProfileUser, getProfileData, publicName } from '@/lib/profile';
import { profileTheme } from '@/lib/profile-theme';
import { sortEarned, milestoneProgress } from '@/lib/badges';
import { absoluteUrl, buildMetadata, graph, truncate } from '@/lib/seo';
import ActivityChart from '@/components/dashboard/ActivityChart';
import { dayKey } from '@/lib/problems';
import JsonLd from '@/components/JsonLd';
import { Crown } from '@/components/ProBadge';
import StatTile from '@/components/dashboard/StatTile';
import BadgeGrid from '@/components/profile/BadgeGrid';
import BadgeArt from '@/components/badges/BadgeArt';
import ShareProfile from '@/components/profile/ShareProfile';
import SkillRadar from '@/components/profile/SkillRadar';

const formatDate = (d) => d.toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' });

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|slack|embed|headless/i;

// Main colour of each badge tier (same palette as BadgeArt), used to tint the badge chip and card.
const TIER_COLOR = {
  bronze: '#cd7f32',
  silver: '#aab4c3',
  gold: '#f5b301',
  emerald: '#12b76a',
  sapphire: '#2e7cf6',
  amethyst: '#9b5de5',
  ruby: '#f43f5e',
  ember: '#ff7a1a',
};

export async function generateMetadata({ params }) {
  const { username } = await params;
  const user = await findProfileUser(username);
  if (!user) return { title: 'Profile not found', robots: { index: false, follow: false } };

  const name = publicName(user);
  const path = `/user/${user.username}`;
  // The profile is only worth indexing when it is public and has something on it
  const data = user.profilePublic ? await getProfileData(user) : null;
  const solved = data?.stats?.solved ?? 0;
  const worthIndexing = Boolean(user.profilePublic && solved > 0);

  const description = truncate(
    user.headline
      ? `${user.headline}. ${solved ? `${solved} AI interview problems solved on Buncho.` : 'Practising AI interviews on Buncho.'}`
      : `${name} (@${user.username}) is practising AI, ML and GenAI interview questions on Buncho${solved ? `, with ${solved} problems solved` : ''}.`,
    155,
  );

  return buildMetadata({
    title: `${name} (@${user.username})`,
    description,
    path,
    image: `${path}/opengraph-image`,
    imageAlt: `${name}'s Buncho profile`,
    type: 'profile',
    noindex: !worthIndexing,
  });
}

/* ---------------------------- small pieces ---------------------------- */

const ICONS = {
  pin: <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  calendar: <path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />,
  globe: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.4 3.7-5.4 3.7-9S14.5 5.4 12 3m0 18c-2.5-2.4-3.7-5.4-3.7-9S9.5 5.4 12 3M3.5 9h17m-17 6h17" />,
  github: <path d="M9 19c-4 1.3-4-2-6-2.5m12 4.5v-3.2a2.8 2.8 0 0 0-.8-2.2c2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6 0C6.5 2.9 5.5 3.2 5.5 3.2a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.1 9.6c0 4.6 2.8 5.7 5.5 6a2.8 2.8 0 0 0-.8 2.2V21" />,
  linkedin: <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2V9Zm2-6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />,
  x: <path d="M4 4l16 16M20 4 4 20" />,
  fire: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4 .2 1.2.8 2 1.8 2.2C10.5 8 11 5.5 12 3Z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  spark: <path d="M12 3v4m0 10v4M3 12h4m10 0h4m-14.5-6.5 2.8 2.8m5.4 5.4 2.8 2.8m0-11-2.8 2.8m-5.4 5.4-2.8 2.8" />,
  days: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
};

function Icon({ name, size = 16, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ICONS[name]}
    </svg>
  );
}

function linkIcon(label) {
  if (label === 'GitHub') return 'github';
  if (label === 'LinkedIn') return 'linkedin';
  if (label === 'X') return 'x';
  return 'globe';
}

function Pill({ href, icon, children, external = true }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium transition hover:-translate-y-px hover:border-accent hover:text-accent"
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </a>
  );
}

/** Chip shown under the username: the highest badge the user has earned right now. */
function BadgeChip({ badge, fallback }) {
  if (!badge) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-line px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
        <span className="h-2 w-2 rounded-full bg-muted/50" />
        {fallback ? 'No badge yet' : 'Badge locked'}
      </span>
    );
  }
  const color = TIER_COLOR[badge.tier] ?? TIER_COLOR.bronze;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border py-0.5 pl-1 pr-3.5 text-xs font-bold uppercase tracking-wider"
      style={{
        color: 'var(--ink)',
        borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
        background: `linear-gradient(135deg, color-mix(in srgb, ${color} 22%, transparent), color-mix(in srgb, ${color} 6%, transparent))`,
      }}
      title={`Current badge: ${badge.name}. ${badge.desc}`}
    >
      <BadgeArt badge={badge} size={28} animate={false} />
      <span>
        <span className="mr-1.5 font-semibold opacity-60">Badge</span>
        {badge.name}
      </span>
    </span>
  );
}

/** Sidebar card: the current badge, large, with progress to the next milestone badge. */
function CurrentBadgeCard({ badge, progress, solved }) {
  const shown = badge ?? progress.next;
  if (!shown) return null;
  const color = TIER_COLOR[shown.tier] ?? TIER_COLOR.bronze;
  const earned = Boolean(badge);
  const pct = Math.round(progress.fraction * 100);

  return (
    <section aria-label="Current badge" className="card relative overflow-hidden p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-10 h-48"
        style={{ background: `radial-gradient(60% 70% at 50% 0%, color-mix(in srgb, ${color} 30%, transparent), transparent 70%)` }}
      />
      <p className="relative text-xs font-medium uppercase tracking-wider text-muted">Current badge</p>

      <div className="relative mt-4 flex flex-col items-center text-center">
        <BadgeArt badge={shown} size={112} earned={earned} />
        <p className="mt-3 text-xl font-semibold tracking-tight">{earned ? shown.name : `Next: ${shown.name}`}</p>
        <p className="mt-0.5 text-sm text-muted">{earned ? shown.desc : `Solve ${shown.threshold} problems to earn it`}</p>
        {earned && shown.stars > 0 && (
          <span
            className="mt-2 rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider"
            style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
          >
            Level {shown.stars} of 3
          </span>
        )}
      </div>

      <div className="relative mt-5 border-t border-line pt-4">
        {progress.next && earned ? (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">Next: {progress.next.name}</span>
              <span className="tabular-nums text-muted">{solved}/{progress.next.threshold}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to the next badge">
              <div className="h-full rounded-full" style={{ width: `${Math.max(4, pct)}%`, background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 55%, white))` }} />
            </div>
            <p className="mt-2 text-xs text-muted">
              {progress.toNext} more solve{progress.toNext === 1 ? '' : 's'} to unlock it.
            </p>
          </>
        ) : progress.next ? (
          <p className="text-sm text-muted">{progress.toNext} more solve{progress.toNext === 1 ? '' : 's'} to unlock your first milestone badge.</p>
        ) : (
          <p className="text-sm text-muted">Every milestone badge unlocked with {solved} solved.</p>
        )}
      </div>
    </section>
  );
}

/* ------------------------------- page --------------------------------- */

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  const user = await findProfileUser(username);
  if (!user) notFound();

  const viewer = await getOrCreateUser();
  const isOwner = Boolean(viewer && viewer.id === user.id);
  // A private profile looks like a missing one to everybody except its owner
  if (!user.profilePublic && !isOwner) notFound();

  const data = await getProfileData(user);
  const theme = profileTheme(user.username);
  const url = absoluteUrl(`/user/${user.username}`);
  const name = data.name;

  // Count the visit after the response is sent, and skip the owner and obvious bots
  if (!isOwner) {
    const ua = (await headers()).get('user-agent') ?? '';
    if (ua && !BOT.test(ua)) {
      after(async () => {
        try {
          await prisma.$executeRaw`UPDATE "User" SET "profileViews" = "profileViews" + 1 WHERE "id" = ${user.id}`;
        } catch (err) {
          console.error('[profile] view count failed', err);
        }
      });
    }
  }

  const { stats } = data;
  // The user's current badge = the highest badge they have earned (milestones first, then achievements).
  const currentBadge = stats ? (sortEarned(data.badges)[0] ?? null) : null;
  const badgeProgress = stats ? milestoneProgress(stats.solved) : null;

  const links = [
    user.website && { href: user.website, label: user.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') },
    user.githubHandle && { href: `https://github.com/${user.githubHandle}`, label: 'GitHub' },
    user.linkedinHandle && { href: `https://www.linkedin.com/in/${user.linkedinHandle}`, label: 'LinkedIn' },
    user.xHandle && { href: `https://x.com/${user.xHandle}`, label: 'X' },
  ].filter(Boolean);

  const evaluatedTopics = data.topics.filter((t) => t.avg != null);
  const showRadar = evaluatedTopics.length >= 3;
  const maxSolved = Math.max(1, ...data.topics.map((t) => t.solved));
  const hasAnything = Boolean(stats);

  const ring = data.pro ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600' : '';

  return (
    <div className="mx-auto w-full max-w-[66rem] px-4 pb-20 pt-4 sm:px-6">
      <JsonLd
        data={graph({
          '@type': 'ProfilePage',
          '@id': `${url}#page`,
          url,
          name: `${name} (@${user.username})`,
          mainEntity: {
            '@type': 'Person',
            name,
            alternateName: user.username,
            url,
            ...(user.headline && { description: user.headline }),
            ...(user.imageUrl && { image: user.imageUrl }),
            ...(links.length && { sameAs: links.map((l) => l.href) }),
          },
        })}
      />

      {!user.profilePublic && isOwner && (
        <p role="status" className="mb-4 rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-sm">
          Only you can see this page, because your profile is set to private.{' '}
          <Link href="/settings/profile" className="font-semibold underline underline-offset-2">Make it public</Link>
        </p>
      )}

      {/* Hero: banner colours are derived from the username, so every profile looks different */}
      <header className="card overflow-hidden !p-0">
        <div className="relative h-36 overflow-hidden sm:h-52" style={{ background: theme.banner }}>
          <div aria-hidden="true" className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
          <div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/45 to-transparent" />
          {data.pro && (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-300/30 backdrop-blur">
              <Crown width={12} height={12} /> Pro member
            </span>
          )}
        </div>

        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <span
              className={`relative -mt-14 inline-block w-fit rounded-full p-1 shadow-xl sm:-mt-16 ${ring}`}
              style={data.pro ? undefined : { background: `linear-gradient(135deg, ${theme.a}, ${theme.c})` }}
            >
              {user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt={`${name}'s avatar`} width={128} height={128} className="h-28 w-28 rounded-full border-4 border-[var(--surface)] object-cover sm:h-32 sm:w-32" />
              ) : (
                <span className="grid h-28 w-28 place-items-center rounded-full border-4 border-[var(--surface)] bg-accent-soft text-4xl font-bold text-accent sm:h-32 sm:w-32">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </span>

            <div className="flex flex-wrap items-center gap-2 sm:pb-1">
              {isOwner && (
                <Link href="/settings/profile" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink shadow-sm transition hover:opacity-90">
                  Edit profile
                </Link>
              )}
              <ShareProfile url={url} name={name} compact owner={isOwner} />
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-mono text-base text-muted">@{user.username}</span>
              {stats && <BadgeChip badge={currentBadge} fallback />}
            </div>

            {user.headline && <p className="mt-4 text-lg font-medium leading-snug">{user.headline}</p>}
            {user.bio && <p className="mt-2 max-w-2xl whitespace-pre-line text-[0.95rem] leading-relaxed text-muted">{user.bio}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2.5 text-sm text-muted">
              {user.location && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="pin" size={15} /> {user.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar" size={15} /> Joined {formatDate(user.createdAt)}
              </span>
            </div>

            {links.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {links.map((l) => (
                  <Pill key={l.href} href={l.href} icon={linkIcon(l.label)}>{l.label}</Pill>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Key numbers */}
      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile label="Solved" value={stats.solved} sub={`of ${stats.total} problems`} accent icon={<Icon name="check" size={16} />} />
          <StatTile label="Day streak" value={stats.streak} sub={stats.streak ? 'Practising daily' : 'Starts with one day'} icon={<Icon name="fire" size={16} />} />
          <StatTile label="Avg AI score" value={data.avgScore ?? '–'} sub={data.avgScore != null ? `over ${data.evals} answer${data.evals === 1 ? '' : 's'}` : 'No AI feedback yet'} icon={<Icon name="spark" size={16} />} />
          <StatTile label="Days practised" value={Object.keys(stats.activeDays).length} sub="different days with activity" icon={<Icon name="days" size={16} />} />
        </div>
      )}

      {hasAnything ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          {/* On mobile the badge comes first, it is the headline of the profile */}
          <aside className="order-first min-w-0 space-y-6 lg:order-last">
            {badgeProgress && <CurrentBadgeCard badge={currentBadge} progress={badgeProgress} solved={stats.solved} />}
            <BadgeGrid badges={data.badges} showLocked={isOwner} />
            {isOwner && (
              <section className="card flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">Only visible to you</p>
                  <p className="mt-1 text-sm text-muted">Profile views</p>
                </div>
                <p className="text-3xl font-semibold tabular-nums">{user.profileViews}</p>
              </section>
            )}
          </aside>

          <div className="min-w-0 space-y-6">
            <section aria-labelledby="skills-h" className="card p-5 sm:p-6">
              <h2 id="skills-h" className="text-base font-semibold tracking-tight">{showRadar ? 'Skill map' : 'Topics practised'}</h2>
              <p className="mt-1 text-sm text-muted">
                {showRadar ? 'Average AI feedback score per topic, from solved problems.' : 'Solved problems per topic.'}
              </p>
              {data.topics.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">No solved problems yet.</p>
              ) : showRadar ? (
                <div className="mt-4">
                  <SkillRadar topics={evaluatedTopics} color={theme.a} />
                </div>
              ) : (
                <ul className="mt-5 space-y-4">
                  {data.topics.map((t) => (
                    <li key={t.slug}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">{t.name}</span>
                        <span className="shrink-0 tabular-nums text-muted">{t.solved} solved</span>
                      </div>
                      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(6, (t.solved / maxSolved) * 100)}%`, background: `linear-gradient(90deg, ${theme.a}, ${theme.c})` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <ActivityChart
              title="Practice activity"
              activeDays={stats.activeDays}
              todayKey={dayKey(new Date())}
              color={theme.a}
            />
          </div>
        </div>
      ) : (
        <p className="card mt-6 p-8 text-center text-sm text-muted">{name} keeps the details private for now.</p>
      )}

      {/* Call to action */}
      {!isOwner && (
        <section className="relative mt-10 overflow-hidden rounded-3xl p-6 text-white sm:p-10" style={{ background: theme.banner }}>
          <div aria-hidden="true" className="absolute inset-0 bg-black/40" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Build your own AI interview profile</h2>
              <p className="mt-1.5 max-w-xl text-sm text-white/85">Practise real AI, ML and GenAI interview questions, get AI feedback, earn badges and share your progress with a link like this one.</p>
            </div>
            <Link href={viewer ? '/settings/profile' : '/register'} className="shrink-0 rounded-full bg-white px-6 py-3 text-center text-sm font-bold text-black shadow-lg transition hover:-translate-y-px hover:opacity-95">
              {viewer ? 'Claim your username' : 'Start free'}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}