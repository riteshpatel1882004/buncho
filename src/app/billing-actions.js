'use server';

import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { createRazorpayOrder, razorpayConfigured, razorpayInternational, razorpayKeyId, razorpayMode } from '@/lib/razorpay';
import { PRO_PLAN_ID } from '@/lib/constants';
import { getQuote, monthsLabel } from '@/lib/pricing';


const asCurrency = (c) => (c === 'USD' ? 'USD' : 'INR');

/**
 * Checks a promo code and returns the price the buyer would pay in each currency. Nothing is created.
 * A code can be limited by the admin to INR or USD, so the answer says where it applies (appliesTo).
 */
export async function previewPrice({ code } = {}) {
  try {
    const user = await getOrCreateUser();
    if (!user) return { ok: false, error: 'Log in to use a promo code.' };

    const [inr, usd] = await Promise.all([
      getQuote({ userId: user.id, code, currency: 'INR' }),
      getQuote({ userId: user.id, code, currency: 'USD' }),
    ]);
    const inrOn = inr.source === 'code';
    const usdOn = usd.source === 'code';

    if (!inrOn && !usdOn) {
      // Prefer "not valid / expired / used" over "wrong currency" when both are reported.
      const worst = [inr, usd].find((q) => q.error && q.errorKind !== 'currency') ?? inr;
      return { ok: false, error: worst.error || 'Enter a promo code.' };
    }

    const winner = inrOn ? inr : usd;
    const scope = inrOn && usdOn ? '' : inrOn ? ' (INR payments only)' : ' (USD payments only)';
    return {
      ok: true,
      code: winner.code,
      appliesTo: { INR: inrOn, USD: usdOn },
      inrRupees: Math.round(inr.finalPaise / 100),
      listInrRupees: Math.round(inr.listPaise / 100),
      usdCents: usd.finalPaise,
      listUsdCents: usd.listPaise,
      bonusDays: winner.bonusDays,
      message: `${winner.code} applied: ${winner.dealLabel}${scope}`,
    };
  } catch (err) {
    console.error('[billing] previewPrice failed', err);
    return { ok: false, error: 'Could not check that code right now. Please try again.' };
  }
}

/**
 * Creates the payment record and the Razorpay order (INR or USD, the same flow for both).
 * Returns { ok, provider: 'RAZORPAY', orderId, razorpayOrderId, keyId, amount, currency, name, description, prefill, mode }:
 * the browser opens Razorpay's checkout window with it, then goes to /billing/return?order_id=... (see CheckoutButton).
 */
export async function startCheckout({ code, currency } = {}) {
  // Never let an error escape: an uncaught throw in a server action replaces the whole page with "This page couldn't load".
  try {
    const user = await getOrCreateUser();
    if (!user) return { ok: false, error: 'Log in to upgrade.', code: 'AUTH' };

    if (!razorpayConfigured()) return { ok: false, error: 'Payments are not available right now. Please try again later.' };

    const cur = asCurrency(currency);
    if (cur === 'USD' && !razorpayInternational()) {
      return { ok: false, error: 'Paying in other currencies is not available right now. Please pay in INR.' };
    }

    const q = await getQuote({ userId: user.id, code, currency: cur });
    if (!q.settings.checkoutOpen) return { ok: false, error: 'Upgrades are paused right now. Please try again later.' };
    if (q.error) return { ok: false, error: q.error };


    const orderId = `bnc_${crypto.randomUUID().replace(/-/g, '')}`;
    await prisma.payment.create({
      data: {
        orderId,
        userId: user.id,
        plan: PRO_PLAN_ID,
        provider: 'RAZORPAY',
        currency: cur,
        amountPaise: q.finalPaise,
        listPaise: q.listPaise,
        discountPaise: q.discountPaise,
        discountCode: q.source === 'code' ? q.code : null,
        bonusDays: q.bonusDays,
        periodMonths: q.months,
      },
    });

    try {
      const order = await createRazorpayOrder({
        receipt: orderId,
        amount: q.finalPaise,
        currency: cur,
        notes: { order_id: orderId, kind: 'pro', user_id: user.id, plan: PRO_PLAN_ID },
      });
      if (!order?.id) throw new Error('No order returned.');
      await prisma.payment.update({ where: { orderId }, data: { razorpayOrderId: order.id } });

      return {
        ok: true,
        provider: 'RAZORPAY',
        orderId,
        razorpayOrderId: order.id,
        keyId: razorpayKeyId(),
        amount: q.finalPaise,
        currency: cur,
        name: q.settings.proName,
        description: monthsLabel(q.months),
        prefill: { ...(user.name && { name: String(user.name).slice(0, 100) }), ...(user.email && { email: user.email }) },
        mode: razorpayMode(),
      };
    } catch (err) {
      console.error('[billing] could not create order', err);
      await prisma.payment.update({ where: { orderId }, data: { status: 'FAILED' } }).catch(() => {});
      return { ok: false, error: 'We could not start the payment. Please try again.' };
    }
  } catch (err) {
    console.error('[billing] startCheckout failed', err?.code, err);
    return { ok: false, error: 'Payments are temporarily unavailable. Please try again in a few minutes.' };
  }
}