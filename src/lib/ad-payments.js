import { prisma } from './prisma';
import { inspectRazorpayOrder, methodLabel } from './razorpay';

/**
 * Asks Razorpay what happened to this booking's payment, then updates our record.
 * Returns 'paid' | 'pending' | 'failed' | 'unknown'.
 * Nothing in a webhook or return URL is trusted: the payments of OUR Razorpay order are fetched from Razorpay, and the
 * amount and currency must match what we stored when the order was created.
 * `paymentId` is only a hint (kept so callers can pass what they have).
 */
export async function settleAdPayment(orderId, paymentId = null) {
  const booking = await prisma.adBooking.findUnique({ where: { orderId } });
  if (!booking) return 'unknown';
  if (['PAID', 'APPROVED', 'REJECTED', 'ENDED'].includes(booking.status)) return 'paid';
  if (booking.status === 'FAILED') return 'failed';

  if (!booking.razorpayOrderId) return 'pending'; // the buyer has not reached the payment step (or the order was never created)

  const result = await inspectRazorpayOrder({
    razorpayOrderId: booking.razorpayOrderId,
    amount: booking.amountCents,
    currency: booking.currency,
  });

  if (result.state === 'paid') {
    const p = result.payment;
    await prisma.adBooking.updateMany({
      where: { orderId, status: 'PENDING_PAYMENT' },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        razorpayPaymentId: p.id ?? paymentId,
        paymentMethod: methodLabel(p),
        payerEmail: p.email ?? null,
      },
    });
    return 'paid';
  }

  if (result.state === 'failed') return 'failed';
  return 'pending';
}