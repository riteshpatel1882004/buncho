'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { isAdmin } from '@/lib/admin';
import { CODE_CURRENCIES, OFFER_TYPES, normalizeCode } from '@/lib/pricing';

/* Every export is a public endpoint, so each one re-checks admin rights on the server. */

async function requireAdmin() {
  const user = await getOrCreateUser();
  if (!isAdmin(user)) redirect('/');
}

const back = (kind, msg) => redirect(`/admin/billing?${kind}=${encodeURIComponent(msg)}`);
const int = (formData, key) => Number.parseInt(String(formData.get(key) ?? '').trim(), 10);
const text = (formData, key, max) => String(formData.get(key) ?? '').trim().slice(0, max);

/** "2026-11-30T23:59" typed in India time -> Date. null when empty, undefined when invalid. */
function parseIst(value) {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const d = new Date(`${s}:00+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function checkDeal(type, value, priceInr) {
  if (!OFFER_TYPES[type]) return 'Choose an offer type.';
  if (!Number.isInteger(value) || value < 1) return 'The offer value must be a whole number of 1 or more.';
  if (type === 'PERCENT_OFF' && value > 99) return 'Percent off must be between 1 and 99.';
  if (type === 'FLAT_OFF' && value >= priceInr) return 'A flat discount must be less than the price.';
  if (type === 'EXTRA_DAYS' && value > 365) return 'Bonus days cannot be more than 365.';
  return null;
}

function refreshEverywhere() {
  revalidatePath('/', 'layout');
}

export async function saveSettings(formData) {
  await requireAdmin();

  const proName = text(formData, 'proName', 40);
  const priceInr = int(formData, 'priceInr');
  const priceUsdCents = Math.round(Number(String(formData.get('priceUsd') ?? '').trim()) * 100);
  const periodMonths = int(formData, 'periodMonths');
  const checkoutOpen = formData.get('checkoutOpen') === 'on';
  const offerOn = formData.get('offerOn') === 'on';
  const offerLabel = text(formData, 'offerLabel', 60);
  const offerType = String(formData.get('offerType') ?? 'PERCENT_OFF');
  const offerValue = int(formData, 'offerValue') || 0;
  const offerEndsAt = parseIst(formData.get('offerEndsAt'));

  if (proName.length < 2) back('error', 'Give the plan a name (at least 2 characters).');
  if (!Number.isInteger(priceInr) || priceInr < 1 || priceInr > 100000) back('error', 'Price must be a whole number from ₹1 to ₹100000.');
  if (!Number.isInteger(priceUsdCents) || priceUsdCents < 100 || priceUsdCents > 100000) back('error', 'The USD price must be from $1 to $1000.');
  if (!Number.isInteger(periodMonths) || periodMonths < 1 || periodMonths > 24) back('error', 'Period must be 1 to 24 months.');
  if (offerEndsAt === undefined) back('error', 'The offer end date is not valid.');
  if (offerOn) {
    const problem = checkDeal(offerType, offerValue, priceInr);
    if (problem) back('error', problem);
  }

  const data = {
    proName,
    priceInr,
    priceUsdCents,
    periodMonths,
    checkoutOpen,
    offerOn,
    offerLabel: offerLabel || null,
    offerType: OFFER_TYPES[offerType] ? offerType : 'PERCENT_OFF',
    offerValue: offerValue > 0 ? offerValue : 0,
    offerEndsAt,
  };

  let failed = false;
  try {
    await prisma.billingSettings.upsert({ where: { id: 'default' }, update: data, create: { id: 'default', ...data } });
  } catch (err) {
    console.error('[admin billing] save settings failed', err);
    failed = true;
  }
  if (failed) back('error', 'Could not save. Did you run `npx prisma db push`?');

  refreshEverywhere();
  back('saved', 'Pricing settings saved.');
}

export async function createCode(formData) {
  await requireAdmin();

  const code = normalizeCode(formData.get('code'));
  const type = String(formData.get('type') ?? '');
  const value = int(formData, 'value');
  const currenciesRaw = String(formData.get('currencies') ?? 'BOTH');
  const currencies = CODE_CURRENCIES[currenciesRaw] ? currenciesRaw : 'BOTH'; // BOTH | INR | USD
  const startsAt = parseIst(formData.get('startsAt'));
  const expiresAt = parseIst(formData.get('expiresAt'));
  const maxRaw = String(formData.get('maxRedemptions') ?? '').trim();
  const maxRedemptions = maxRaw ? Number.parseInt(maxRaw, 10) : null;
  const perUserLimit = int(formData, 'perUserLimit') || 1;
  const note = text(formData, 'note', 120);

  const settings = await prisma.billingSettings.findUnique({ where: { id: 'default' } }).catch(() => null);
  const priceInr = settings?.priceInr ?? 99;

  if (code.length < 3) back('error', 'A code needs at least 3 letters or numbers.');
  const problem = checkDeal(type, value, priceInr);
  if (problem) back('error', problem);
  if (type === 'FLAT_OFF' && currencies !== 'INR') back('error', 'A flat ₹ off code can only work for INR. Set "Works for" to INR payments only, or use Percent off.');
  if (startsAt === undefined || expiresAt === undefined) back('error', 'A date is not valid.');
  if (startsAt && expiresAt && expiresAt <= startsAt) back('error', 'The end date must be after the start date.');
  if (maxRedemptions !== null && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)) back('error', 'Max uses must be 1 or more, or empty for unlimited.');
  if (perUserLimit < 1 || perUserLimit > 100) back('error', 'Uses per person must be 1 to 100.');

  let message = null;
  try {
    await prisma.discountCode.create({
      data: { code, type, value, currencies, startsAt, expiresAt, maxRedemptions, perUserLimit, note: note || null },
    });
  } catch (err) {
    message = err?.code === 'P2002' ? 'That code already exists.' : 'Could not create the code.';
    if (err?.code !== 'P2002') console.error('[admin billing] create code failed', err);
  }
  if (message) back('error', message);

  refreshEverywhere();
  back('saved', `Code ${code} created.`);
}

export async function toggleCode(formData) {
  await requireAdmin();
  const id = text(formData, 'id', 40);
  const row = await prisma.discountCode.findUnique({ where: { id } });
  if (!row) back('error', 'Code not found.');
  await prisma.discountCode.update({ where: { id }, data: { active: !row.active } });
  refreshEverywhere();
  back('saved', `${row.code} is now ${row.active ? 'off' : 'on'}.`);
}

export async function deleteCode(formData) {
  await requireAdmin();
  const id = text(formData, 'id', 40);
  const row = await prisma.discountCode.findUnique({ where: { id } });
  if (!row) back('error', 'Code not found.');
  await prisma.discountCode.delete({ where: { id } });
  refreshEverywhere();
  back('saved', `${row.code} deleted.`);
}