import { prisma } from './prisma';
import { addMonths } from './pricing';
import { inspectRazorpayOrder, methodLabel } from './razorpay';

/**
 * Pro payments. Everything goes through Razorpay: INR (UPI, cards, net banking, wallets) and other currencies (USD).
 * Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, NEXT_PUBLIC_APP_URL (see lib/razorpay.js).
 */
const compact = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== ''));

/**
 * Marks the payment paid and extends Pro. Only the call that flips it to PAID extends the subscription.
 * The length comes from the payment row (months + bonus days), so later price changes never affect it.
 * `details` are extra columns to save with it (payment id, method, payer email).
 */
async function grantPro(orderId, details = {}) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { orderId } });
    if (!payment) return { ok: false };

    const claimed = await tx.payment.updateMany({
      where: { orderId, status: { not: 'PAID' } },
      data: { status: 'PAID', paidAt: new Date(), ...compact(details) },
    });
    if (claimed.count === 0) return { ok: true, already: true };

    const now = new Date();
    const sub = await tx.subscription.findUnique({ where: { userId: payment.userId } });
    const from = sub && sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now; // paying early adds time on top
    const end = new Date(addMonths(from, payment.periodMonths || 1).getTime() + (payment.bonusDays || 0) * 86400000);
    await tx.subscription.upsert({
      where: { userId: payment.userId },
      update: { currentPeriodEnd: end, plan: payment.plan },
      create: { userId: payment.userId, plan: payment.plan, currentPeriodEnd: end },
    });

    if (payment.discountCode) {
      await tx.discountCode.updateMany({ where: { code: payment.discountCode }, data: { redeemedCount: { increment: 1 } } });
    }
    return { ok: true };
  });
}

/**
 * Asks Razorpay what happened to this order, then updates our records.
 * `hintPaymentId` is the Razorpay payment id when we already have one (checkout result or webhook). It is only a hint:
 * the answer always comes from Razorpay, looking at the payments of OUR order.
 * Returns 'paid' | 'pending' | 'failed' | 'unknown'.
 */
export async function verifyAndSettle(orderId, hintPaymentId = null) {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) return 'unknown';
  if (payment.status === 'PAID') return 'paid';

  // Payments made before the switch to Razorpay (Cashfree / Dodo) can no longer be checked from here.
  if (payment.provider !== 'RAZORPAY') return payment.status === 'FAILED' ? 'failed' : 'unknown';
  if (!payment.razorpayOrderId) return 'pending'; // the Razorpay order was never created

  const result = await inspectRazorpayOrder({
    razorpayOrderId: payment.razorpayOrderId,
    amount: payment.amountPaise,
    currency: payment.currency,
  });

  if (result.state === 'paid') {
    const p = result.payment;
    const res = await grantPro(orderId, {
      razorpayPaymentId: p.id ?? hintPaymentId,
      paymentMethod: methodLabel(p),
      payerEmail: p.email ?? null,
    });
    return res.ok ? 'paid' : 'unknown';
  }

  if (result.state === 'failed') {
    await prisma.payment.updateMany({ where: { orderId, status: 'PENDING' }, data: { status: 'FAILED' } });
    return 'failed';
  }
  return 'pending';
}