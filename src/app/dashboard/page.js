import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import ReadinessCard from '@/components/ReadinessCard';
import { StatsCard } from '@/components/StatsCard';
import { getUserStats, dayKey } from '@/lib/problems';
import { getDayTopics } from '@/lib/day-topics';
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
import MobileHero from '@/components/dashboard/MobileHero';
import MilestoneJourney from '@/components/badges/MilestoneJourney';
import ProfileBar from '@/components/dashboard/ProfileBar';
import { SITE_URL } from '@/lib/seo';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await getOrCreateUser();
  if (!user) redirect('/login');

  const ent = await getEntitlements(user.id);
  const pro = ent.isPro;

  // Stats are needed by both the dashboard and the badges, so fetch them once and share the promise
  const statsPromise = getUserStats(user.id);

  const [bookmarks, stats, insights, jobs, badgeData, dayTopics] = await Promise.all([
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
    // Topics solved per day, shown in the Activity chart hover card
    getDayTopics(user.id),
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
      id: 'progress',
      label: 'Progress',
      icon: 'solved',
      hint: 'Solved, streak, activity',
      summary: `${stats.solved}/${stats.total}`,
      content: (
        <div className="space-y-4">
          {/* Row 1: Problems solved + Streak calendar, equal column widths (stacked on phones) */}
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
            <div className="min-w-0 [&>*]:h-full">
              <StatsCard stats={stats} signedIn compact />
            </div>
            <div className="min-w-0 [&>*]:h-full">
              <StreakCalendar activeDays={stats.activeDays} todayKey={todayKey} streak={stats.streak} compact />
            </div>
          </div>

          {/* Row 2: Activity, full width */}
          <div className="min-w-0">
            <ActivityChart activeDays={stats.activeDays} dayTopics={dayTopics} todayKey={todayKey} compact />
          </div>
        </div>
      ),
    },
    {
      id: 'jobs',
      label: 'Job preparation',
      icon: 'jobs',
      hint: 'Role-wise prep',
      summary: jobs.length,
      content: <JobPrepCard jobs={jobs.slice(0, 3)} />,
    },
    {
      id: 'saved',
      label: 'Saved for later',
      icon: 'saved',
      hint: 'Revisit anytime',
      summary: savedList.length,
      content: <SavedCard items={savedList} pro={pro} />,
    },
    {
      id: 'milestones',
      label: 'Your milestones',
      icon: 'milestones',
      hint: 'Badges and levels',
      content: <MilestoneJourney solved={stats.solved} badges={badgeData.badges} />,
    },
    {
      id: 'readiness',
      label: 'AI Engineering Readiness',
      icon: 'readiness',
      hint: 'Skill breakdown',
      content: <ReadinessCard readiness={insights.readiness} competencies={insights.competencies} />,
    },
    // Pro members see their plan in the "Plan details" popup on the banner above
    ...(!pro
      ? [
          {
            id: 'plan',
            label: 'Your plan',
            icon: 'plan',
            hint: 'Upgrade options',
            content: <PlanCard ent={ent} />,
          },
        ]
      : []),
    {
      id: 'share',
      label: 'Share your achievements',
      icon: 'share',
      hint: 'Cards and profile',
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

  // Everything above the menu: profile links / claim banner + greeting header
  const top = (
    <>
      {/* Public profile bar at the very top (or a prompt to claim a username) */}
      {user.username ? (
        <ProfileBar
          username={user.username}
          url={`${SITE_URL}/user/${user.username}`}
          name={user.profileName || firstName || 'my'}
        />
      ) : (
        <Link
          href="/settings/profile"
          className="group mb-5 flex items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent-soft px-4 py-3.5 transition hover:border-accent sm:px-5 sm:py-4"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold sm:text-base">Claim your username</span>
            <span className="mt-0.5 block text-xs text-muted sm:text-sm">Get a shareable profile at buncho.live/user/your-name.</span>
          </span>
          <span className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink group-hover:opacity-90">Claim</span>
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

        {/* Phones: quick actions right under the greeting (desktop has the profile bar above) */}
        {user.username && (
          <ProfileTiles
            username={user.username}
            url={`${SITE_URL}/user/${user.username}`}
            name={user.profileName || firstName || 'my'}
          />
        )}

        {pro && <ProBanner periodEnd={ent.periodEnd} className="min-w-0 lg:flex-1" />}
      </header>
    </>
  );

  return (
    <div className="relative mx-auto w-full max-w-[84rem] overflow-x-clip px-4 py-5 sm:px-6 lg:px-8 lg:py-10">
      <div className="relative">
        <DashboardTabs
          items={items}
          initial="progress"
          top={top}
          mobileTop={
            <MobileHero
              solved={stats.solved}
              total={stats.total}
              streak={stats.streak}
              saved={savedList.length}
            />
          }
        />
      </div>
    </div>
  );
}