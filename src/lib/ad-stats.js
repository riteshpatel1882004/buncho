import { after } from 'next/server';
import { prisma } from './prisma';
import { AD_STATS } from './ads';

export const STATS_ROW_ID = 'ads';
export const COUNTRY_ROWS = 4; // country rows in the admin form

const REFRESH_AFTER_MS = 6 * 60 * 60 * 1000; // numbers older than this are refreshed on the next visit
const DAY_MS = 24 * 60 * 60 * 1000;
const ENDPOINT = 'https://api.vercel.com/v1/query/web-analytics/visits/aggregate';
const SHOWN_COUNTRIES = 3;

export const analyticsConfigured = () =>
  Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_ANALYTICS_PROJECT);

const num = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const sum = (rows, key) => rows.reduce((t, r) => t + num(r?.[key]), 0);
const growth = (now, before) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

export const compact = (v) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num(v));

const dateLabel = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** "IN" -> { name: "India", flag: "🇮🇳" } */
export function countryInfo(code) {
  const c = String(code ?? '').toUpperCase();
  let name = c;
  try {
    name = new Intl.DisplayNames(['en'], { type: 'region' }).of(c) || c;
  } catch {}
  const flag = /^[A-Z]{2}$/.test(c)
    ? String.fromCodePoint(...[...c].map((ch) => 127397 + ch.charCodeAt(0)))
    : '🌍';
  return { name, flag };
}

/* ---------- Vercel Web Analytics API ---------- */

async function query({ since, until, by, limit }) {
  // The aggregate endpoint answers 400 "missing required property `by`" without a grouping.
  if (!by) throw new Error('Google Analytics queries need a "by" grouping');

  const params = new URLSearchParams({
    projectId: process.env.VERCEL_ANALYTICS_PROJECT.trim(),
    since: since.toISOString(),
    until: until.toISOString(),
    by,
  });
  const team = process.env.VERCEL_ANALYTICS_TEAM?.trim();
  if (team) params.set(team.startsWith('team_') ? 'teamId' : 'slug', team);
  if (limit) params.set('limit', String(limit));

  const res = await fetch(`${ENDPOINT}?${params}`, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN.trim()}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Google Analytics answered ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const json = await res.json();
  const data = json?.data;
  return Array.isArray(data) ? data : data ? [data] : [];
}

const startOfTodayUtc = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Pulls fresh numbers from Vercel and stores them. Never throws.
 * A MANUAL row is left alone unless takeOver is true (the admin pressed "Fetch from Vercel now").
 */
export async function syncAdStats({ takeOver = false } = {}) {
  if (!analyticsConfigured()) {
    return { ok: false, error: 'Add VERCEL_API_TOKEN and VERCEL_ANALYTICS_PROJECT to your environment variables first.' };
  }
  const existing = await prisma.siteStats.findUnique({ where: { id: STATS_ROW_ID } }).catch(() => null);
  if (existing?.mode === 'MANUAL' && !takeOver) return { ok: true, skipped: true };

  try {
    const end = startOfTodayUtc(); // full days only, today is still incomplete
    const ago = (days) => new Date(end.getTime() - days * DAY_MS);

    // Vercel's aggregate endpoint requires `by` on every request, so the 30 day totals are summed from the
    // per-country rows (anything beyond the limit is grouped into an "Others" row, so the sum is still the full total).
    const [days, countryRows, previous] = await Promise.all([
      query({ since: ago(14), until: end, by: 'day' }),
      query({ since: ago(30), until: end, by: 'country', limit: 10 }),
      // The previous 30 days may fall outside your plan's reporting window, so a failure here only hides the badge.
      query({ since: ago(60), until: new Date(ago(30).getTime() - 1), by: 'country', limit: 10 }).catch(() => null),
    ]);

    const inRange = (r, from, to) => {
      const t = new Date(r.timestamp).getTime();
      return t >= from.getTime() && t < to.getTime();
    };
    const lastWeek = days.filter((r) => inRange(r, ago(7), end));
    const weekBefore = days.filter((r) => inRange(r, ago(14), ago(7)));
    const dailyNow = sum(lastWeek, 'visitors') / 7;
    const dailyBefore = sum(weekBefore, 'visitors') / 7;

    const monthlyNow = sum(countryRows, 'visitors');
    const viewsNow = sum(countryRows, 'pageviews');

    const countries = countryRows
      .filter((r) => /^[A-Za-z]{2}$/.test(String(r.country ?? '')))
      .sort((a, b) => num(b.visitors) - num(a.visitors))
      .slice(0, SHOWN_COUNTRIES)
      .map((r) => ({
        code: String(r.country).toUpperCase(),
        share: monthlyNow > 0 ? Math.min(100, Math.round((num(r.visitors) / monthlyNow) * 100)) : 0,
        visitors: Math.round(num(r.visitors)),
        views: Math.round(num(r.pageviews)),
      }));

    const data = {
      mode: 'AUTO',
      monthlyVisitors: Math.round(monthlyNow),
      monthlyVisitorsGrowth: previous ? growth(monthlyNow, sum(previous, 'visitors')) : null,
      pageViews: Math.round(viewsNow),
      pageViewsGrowth: previous ? growth(viewsNow, sum(previous, 'pageviews')) : null,
      dailyVisitors: Math.round(dailyNow),
      dailyVisitorsGrowth: growth(dailyNow, dailyBefore),
      countries,
      periodLabel: 'Last 30 days',
      asOf: new Date(),
      syncError: null,
    };
    await prisma.siteStats.upsert({ where: { id: STATS_ROW_ID }, create: { id: STATS_ROW_ID, ...data }, update: data });
    return { ok: true };
  } catch (err) {
    const message = String(err?.message ?? err).slice(0, 300);
    console.error('[ad-stats] sync failed', err);
    try {
      // Saving the error also moves updatedAt, so a broken setup is retried every few hours, not on every visit.
      await prisma.siteStats.upsert({
        where: { id: STATS_ROW_ID },
        create: {
          id: STATS_ROW_ID,
          monthlyVisitors: AD_STATS.monthlyVisitors,
          monthlyVisitorsGrowth: AD_STATS.monthlyVisitorsGrowth,
          pageViews: AD_STATS.pageViews,
          pageViewsGrowth: AD_STATS.pageViewsGrowth,
          dailyVisitors: AD_STATS.dailyVisitors,
          dailyVisitorsGrowth: AD_STATS.dailyVisitorsGrowth,
          countries: AD_STATS.countries,
          periodLabel: AD_STATS.periodLabel,
          syncError: message,
        },
        update: { syncError: message },
      });
    } catch {}
    return { ok: false, error: message };
  }
}

/* ---------- Reading ---------- */

function toStats(row) {
  const src = row ?? AD_STATS;
  const countries = (Array.isArray(src.countries) ? src.countries : []).map((c) => ({
    code: String(c.code ?? '').toUpperCase(),
    ...countryInfo(c.code),
    share: num(c.share),
    visitors: num(c.visitors),
    views: num(c.views),
    viewsLabel: compact(c.views),
  }));
  return {
    site: AD_STATS.site,
    mode: row?.mode ?? 'AUTO',
    periodLabel: src.periodLabel || AD_STATS.periodLabel,
    asOf: row?.asOf ? dateLabel(row.asOf) : AD_STATS.asOf,
    updatedAt: row?.updatedAt ?? null,
    syncError: row?.syncError ?? null,
    monthlyVisitors: num(src.monthlyVisitors),
    monthlyVisitorsGrowth: src.monthlyVisitorsGrowth ?? null,
    pageViews: num(src.pageViews),
    pageViewsGrowth: src.pageViewsGrowth ?? null,
    dailyVisitors: num(src.dailyVisitors),
    dailyVisitorsGrowth: src.dailyVisitorsGrowth ?? null,
    countries,
  };
}

/**
 * The numbers for /advertise, /problems and the admin page. Never throws; falls back to AD_STATS in lib/ads.js.
 * refresh: true (only /advertise) also tops the numbers up from Vercel when they are older than 6 hours.
 */
export async function getAdStats({ refresh = false } = {}) {
  let row = null;
  try {
    row = await prisma.siteStats.findUnique({ where: { id: STATS_ROW_ID } });
  } catch (err) {
    console.error('[ad-stats] could not read stats', err);
  }

  if (refresh && row?.mode !== 'MANUAL' && analyticsConfigured()) {
    const stale = !row || Date.now() - row.updatedAt.getTime() > REFRESH_AFTER_MS;
    if (stale) {
      if (!row) {
        await syncAdStats(); // the very first fetch: wait for it so the page shows real numbers
        row = await prisma.siteStats.findUnique({ where: { id: STATS_ROW_ID } }).catch(() => null);
      } else {
        after(() => syncAdStats()); // later refreshes happen after the response, so nobody waits
      }
    }
  }
  return toStats(row);
}