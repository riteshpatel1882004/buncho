'use server';

import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { isAdmin } from '@/lib/admin';
import { AD_PERIOD_MONTHS, AD_SLOTS } from '@/lib/ads';
import { COUNTRY_ROWS, STATS_ROW_ID, syncAdStats } from '@/lib/ad-stats';
import { addMonths } from '@/lib/pricing';

/* Every export is a public endpoint, so each one re-checks admin rights on the server. */

async function requireAdmin() {
  const user = await getOrCreateUser();
  if (!isAdmin(user)) notFound();
}

const go = (tab, kind, msg) => redirect(`/admin/ads?tab=${tab}&${kind}=${encodeURIComponent(msg)}`);
const idOf = (formData) => String(formData.get('id') ?? '').slice(0, 40);
const noteOf = (formData) => String(formData.get('adminNote') ?? '').trim().slice(0, 1000);

function refresh() {
  revalidatePath('/admin/ads');
  revalidatePath('/admin');
  revalidatePath('/problems');
}

function refreshStats() {
  revalidatePath('/admin/ads');
  revalidatePath('/advertise');
  revalidatePath('/problems');
}

/** PAID -> APPROVED. The banner goes live now and runs for one month. */
export async function approveAd(formData) {
  await requireAdmin();
  const id = idOf(formData);
  const ad = await prisma.adBooking.findUnique({ where: { id } });
  if (!ad || ad.status !== 'PAID') return go('awaiting', 'error', 'That booking is not waiting for approval any more.');

  const now = new Date();
  const clash = await prisma.adBooking.findFirst({
    where: { slot: ad.slot, status: 'APPROVED', endsAt: { gt: now }, id: { not: id } },
    select: { companyName: true, endsAt: true },
  });
  if (clash) {
    return go('awaiting', 'error', `${AD_SLOTS[ad.slot].label} is already live with ${clash.companyName}. End that banner first, or reject this one and refund it.`);
  }

  await prisma.adBooking.updateMany({
    where: { id, status: 'PAID' },
    data: {
      status: 'APPROVED',
      reviewedAt: now,
      startsAt: now,
      endsAt: addMonths(now, ad.periodMonths || AD_PERIOD_MONTHS),
      adminNote: noteOf(formData) || null,
    },
  });
  refresh();
  return go('live', 'ok', `${ad.companyName} is now live in ${AD_SLOTS[ad.slot].label}.`);
}

/** PAID -> REJECTED. Refund the payment by hand in the Dodo dashboard. */
export async function rejectAd(formData) {
  await requireAdmin();
  const id = idOf(formData);
  const ad = await prisma.adBooking.findUnique({ where: { id }, select: { status: true, companyName: true } });
  if (!ad || ad.status !== 'PAID') return go('awaiting', 'error', 'That booking is not waiting for approval any more.');

  await prisma.adBooking.updateMany({
    where: { id, status: 'PAID' },
    data: { status: 'REJECTED', reviewedAt: new Date(), adminNote: noteOf(formData) || null },
  });
  refresh();
  return go('awaiting', 'ok', `${ad.companyName} was rejected. Remember to refund the payment in the Dodo dashboard.`);
}

/** Ends a live banner right now. */
export async function endAd(formData) {
  await requireAdmin();
  const id = idOf(formData);
  const ad = await prisma.adBooking.findUnique({ where: { id }, select: { status: true, companyName: true } });
  if (!ad || ad.status !== 'APPROVED') return go('live', 'error', 'That banner is not live.');

  await prisma.adBooking.updateMany({ where: { id, status: 'APPROVED' }, data: { status: 'ENDED', endsAt: new Date() } });
  refresh();
  return go('past', 'ok', `${ad.companyName} was taken down.`);
}

/* ---------- Traffic numbers shown on /advertise ---------- */

/** A whole number from the form. Blank means null when nullable, otherwise 0. */
function int(formData, key, { min = 0, max = 1_000_000_000, nullable = false } = {}) {
  const raw = String(formData.get(key) ?? '').trim().replace(/,/g, '');
  const v = Math.round(Number(raw));
  if (raw === '' || !Number.isFinite(v)) return nullable ? null : 0;
  return Math.min(max, Math.max(min, v));
}

/** Fetches fresh numbers from Google Analytics and turns automatic updates back on. */
export async function syncAdStatsNow() {
  await requireAdmin();
  const result = await syncAdStats({ takeOver: true });
  refreshStats();
  if (!result.ok) return go('traffic', 'error', `Could not fetch from Vercel. ${result.error}`);
  return go('traffic', 'ok', 'Numbers updated from Google Analytics. Automatic updates are on.');
}

/** Saves numbers typed by the admin. This switches to manual mode, so automatic updates stop overwriting them. */
export async function saveAdStats(formData) {
  await requireAdmin();

  const countries = [];
  for (let i = 0; i < COUNTRY_ROWS; i += 1) {
    const code = String(formData.get(`code${i}`) ?? '').trim().toUpperCase();
    if (!code) continue;
    if (!/^[A-Z]{2}$/.test(code)) return go('traffic', 'error', `"${code}" is not a 2-letter country code (for example IN, US, GB).`);
    countries.push({
      code,
      share: int(formData, `share${i}`, { max: 100 }),
      visitors: int(formData, `visitors${i}`),
      views: int(formData, `views${i}`),
    });
  }
  if (countries.reduce((t, c) => t + c.share, 0) > 100) return go('traffic', 'error', 'The country shares add up to more than 100%.');

  const growth = { min: -100, max: 100_000, nullable: true };
  const data = {
    mode: 'MANUAL',
    monthlyVisitors: int(formData, 'monthlyVisitors'),
    monthlyVisitorsGrowth: int(formData, 'monthlyVisitorsGrowth', growth),
    pageViews: int(formData, 'pageViews'),
    pageViewsGrowth: int(formData, 'pageViewsGrowth', growth),
    dailyVisitors: int(formData, 'dailyVisitors'),
    dailyVisitorsGrowth: int(formData, 'dailyVisitorsGrowth', growth),
    periodLabel: String(formData.get('periodLabel') ?? '').trim().slice(0, 40) || 'Last 30 days',
    countries,
    asOf: new Date(),
    syncError: null,
  };

  await prisma.siteStats.upsert({ where: { id: STATS_ROW_ID }, create: { id: STATS_ROW_ID, ...data }, update: data });
  refreshStats();
  return go('traffic', 'ok', 'Saved. These numbers are now shown on /advertise, and automatic updates are paused.');
}