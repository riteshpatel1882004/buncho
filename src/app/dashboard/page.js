import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import ReadinessCard from '@/components/ReadinessCard';
import { StatsCard } from '@/components/StatsCard';
import { getUserStats, dayKey } from '@/lib/problems';
import { getInsights } from '@/lib/insights';
import { getUserBadges, publicName } from '@/lib/profile';
import { profileTheme } from '@/lib/profile-theme';
import ShareCards from '@/components/profile/ShareCards';
import { attachInsights, getEntitlements } from '@/lib/subscription';
import PlanCard from '@/components/billing/PlanCard';
import ProBanner from '@/components/ProBanner';
import { listJobs } from '@/lib/jobs/progress';
import JobPrepCard from '@/components/jobs/JobPrepCard';
import ProfileTiles from '@/components/dashboard/ProfileTiles';
import Greeting from '@/components/dashboard/Greeting';
import SavedCard from '@/components/dashboard/SavedCard';
import ActivityChart from '@/components/dashboard/ActivityChart';
import StreakCalendar from '@/components/dashboard/StreakCalendar';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import MilestoneJourney from '@/components/badges/MilestoneJourney';
import ShareProfile from '@/components/profile/ShareProfile';
import { SITE_URL } from '@/lib/seo';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await getOrCreateUser();
  if (!user) redirect('/login');

  const ent = await getEntitlements(user.id);
  const pro = ent.isPro;

  // Stats are needed by both the dashboard and the badges, so fetch them once and share the promise
  const statsPromise = getUserStats(user.id);

  const [bookmarks, stats, insights, jobs, badgeData] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { problem: { select: { slug: true, title: true, difficulty: true } } },
    }),
    statsPromise,
    getInsights(user.id),
    listJobs(user.id),
    statsPromise.then((s) => getUserBadges(user.id, { pro, stats: s })),
  ]);

  const savedList = await attachInsights(bookmarks.map((b) => b.problem), pro);

  const firstName = user.name?.split(' ')[0];
  const todayKey = dayKey(new Date()); // YYYY-MM-DD in India time, same key format as stats.activeDays

  const avatarRing = pro
    ? 'rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 p-[3px] shadow-md shadow-amber-500/30'
    : 'rounded-full bg-gradient-to-br from-accent/60 to-accent/10 p-[3px]';

  // Every dashboard section. The left menu lists them, the right side shows the one that is clicked.
  const items = [
    {
      id: 'solved',
      label: 'Problems solved',
      icon: 'solved',
      summary: `${stats.solved}/${stats.total}`,
      content: <StatsCard stats={stats} signedIn roomy />,
    },
    {
      id: 'streak',
      label: 'Streak',
      icon: 'streak',
      summary: `${stats.streak}d`,
      content: <StreakCalendar activeDays={stats.activeDays} todayKey={todayKey} streak={stats.streak} />,
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: 'activity',
      content: <ActivityChart activeDays={stats.activeDays} todayKey={todayKey} />,
    },
    {
      id: 'jobs',
      label: 'Job preparation',
      icon: 'jobs',
      summary: jobs.length,
      content: <JobPrepCard jobs={jobs.slice(0, 3)} />,
    },
    {
      id: 'saved',
      label: 'Saved for later',
      icon: 'saved',
      summary: savedList.length,
      content: <SavedCard items={savedList} pro={pro} />,
    },
    {
      id: 'milestones',
      label: 'Your milestones',
      icon: 'milestones',
      content: <MilestoneJourney solved={stats.solved} badges={badgeData.badges} />,
    },
    {
      id: 'readiness',
      label: 'AI Engineering Readiness',
      icon: 'readiness',
      content: <ReadinessCard readiness={insights.readiness} competencies={insights.competencies} />,
    },
    // Pro members see their plan in the "Plan details" popup on the banner above
    ...(!pro
      ? [
          {
            id: 'plan',
            label: 'Your plan',
            icon: 'plan',
            content: <PlanCard ent={ent} />,
          },
        ]
      : []),
    {
      id: 'share',
      label: 'Share your achievements',
      icon: 'share',
      content: (
        <ShareCards
          name={publicName(user)}
          username={user.username ?? null}
          url={user.username ? `${SITE_URL}/user/${user.username}` : null}
          metrics={badgeData.metrics}
          badges={badgeData.badges}
          total={stats.total}
          defaultColor={profileTheme(user.username ?? user.name ?? 'buncho').a}
        />
      ),
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[84rem] overflow-x-clip px-4 py-5 sm:px-6 lg:px-8 lg:py-10">
      <div className="relative">
        {/* Public profile links + share, at the very top (or a prompt to claim a username) */}
        {user.username ? (
          <div className="mb-5 hidden flex-wrap items-center justify-between gap-x-4 gap-y-3 lg:flex">
            <p className="flex items-center gap-2 text-sm">
              <Link href={`/user/${user.username}`} className="font-semibold text-accent hover:underline">
                View public profile
              </Link>
              <span className="text-muted" aria-hidden="true">·</span>
              <Link href="/settings/profile" className="font-medium text-muted hover:text-ink">
                Edit
              </Link>
            </p>
            <ShareProfile url={`${SITE_URL}/user/${user.username}`} name={user.profileName || firstName || 'my'} compact />
          </div>
        ) : (
          <Link
            href="/settings/profile"
            className="group mb-5 flex items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent-soft px-5 py-4 transition hover:border-accent"
          >
            <span>
              <span className="block font-semibold">Claim your username and get a shareable profile</span>
              <span className="mt-0.5 block text-sm text-muted">Show your level, streak and badges at buncho.live/user/your-name.</span>
            </span>
            <span className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink group-hover:opacity-90">Claim it</span>
          </Link>
        )}

        {/* Header: greeting + Pro banner in ONE row (stacks on phones) */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex min-w-0 shrink-0 items-center gap-3.5 sm:gap-4">
            <span className={`shrink-0 ${avatarRing}`}>
              {user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt="" width={56} height={56} className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14" />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-xl font-semibold text-accent sm:h-14 sm:w-14">
                  {(user.name ?? '?').charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <Greeting name={firstName} pro={pro} />
          </div>

          {/* Phones: quick actions right under the greeting (desktop has the text links bar above) */}
          {user.username && (
            <ProfileTiles
              username={user.username}
              url={`${SITE_URL}/user/${user.username}`}
              name={user.profileName || firstName || 'my'}
            />
          )}

          {pro && <ProBanner periodEnd={ent.periodEnd} className="min-w-0 lg:flex-1" />}
        </header>

        {/* Left: menu with every section. Right: content of the clicked section. */}
        <DashboardTabs items={items} initial="solved" />
      </div>
    </div>
  );
}