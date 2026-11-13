import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAndSettle } from '@/lib/billing';
import { settleAdPayment } from '@/lib/ad-payments';
import { verifyRazorpayWebhook } from '@/lib/razorpay';

export const runtime = 'nodejs';

// Events we act on. payment.authorized matters when your Razorpay account captures payments by hand: we capture it here.
const EVENTS = new Set(['payment.captured', 'payment.authorized', 'payment.failed', 'order.paid']);

/**
 * Razorpay dashboard > Settings > Webhooks > Add: https://<your-domain>/api/billing/webhook, the secret you put in
 * RAZORPAY_WEBHOOK_SECRET, and the events payment.authorized, payment.captured, payment.failed and order.paid.
 * One endpoint serves Buncho Pro ("bnc_..." orders) and sponsor banners ("ad_..." orders).
 * The payload is never trusted for amount or status: the order and its payments are re-fetched from Razorpay first.
 */
export async function POST(req) {
  const raw = await req.text(); // the signature covers the exact raw body

  let valid = false;
  try {
    valid = verifyRazorpayWebhook(raw, req.headers.get('x-razorpay-signature'));
  } catch (err) {
    console.error('[razorpay] webhook could not be verified', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (!valid) return NextResponse.json({ ok: false }, { status: 400 });

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (!EVENTS.has(event?.event)) return NextResponse.json({ ok: true });

  const payment = event?.payload?.payment?.entity;
  const order = event?.payload?.order?.entity;
  const razorpayOrderId = payment?.order_id ?? order?.id;
  if (typeof razorpayOrderId !== 'string') return NextResponse.json({ ok: true }); // a payment that is not tied to one of our orders

  try {
    const pro = await prisma.payment.findUnique({ where: { razorpayOrderId }, select: { orderId: true } });
    if (pro) {
      await verifyAndSettle(pro.orderId, payment?.id ?? null);
    } else {
      const ad = await prisma.adBooking.findUnique({ where: { razorpayOrderId }, select: { orderId: true } });
      if (ad) await settleAdPayment(ad.orderId, payment?.id ?? null);
    }
  } catch (err) {
    console.error('[razorpay] webhook settle failed', razorpayOrderId, err);
    return NextResponse.json({ ok: false }, { status: 500 }); // non-2xx makes Razorpay retry
  }
  return NextResponse.json({ ok: true });
}