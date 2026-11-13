import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { verifyAndSettle } from '@/lib/billing';
import { getSubscription } from '@/lib/subscription';
import { monthsLabel } from '@/lib/pricing';
import { formatMoney } from '@/lib/money';
import PaymentResult from '@/components/billing/PaymentResult';

export const metadata = { title: 'Payment status', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const dateFmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

export default async function BillingReturnPage({ searchParams }) {
  const user = await getOrCreateUser();
  if (!user) redirect('/login?redirect_url=%2Fpricing');

  const sp = await searchParams;
  const orderId = sp?.order_id;
  if (typeof orderId !== 'string' || !/^bnc_[a-z0-9]{20,40}$/.test(orderId)) redirect('/pricing');

  const owned = await prisma.payment.findFirst({ where: { orderId, userId: user.id }, select: { id: true } });
  if (!owned) redirect('/pricing');

  // Our checkout page adds ?payment_id=pay_... after a successful payment. It is only a hint: Razorpay is asked again.
  const rawPid = typeof sp?.payment_id === 'string' ? sp.payment_id : null;
  const paymentId = rawPid && /^[A-Za-z0-9_-]{5,64}$/.test(rawPid) ? rawPid : null;

  // ?cancelled=1 means the customer closed the payment window. ?reason= is the bank's message (shown as text only).
  const cancelled = sp?.cancelled === '1';
  const reason = typeof sp?.reason === 'string' ? sp.reason.replace(/[\u0000-\u001f]/g, ' ').slice(0, 140) : '';

  let result;
  try {
    result = await verifyAndSettle(orderId, paymentId);
  } catch (err) {
    console.error('[billing] return verification failed', orderId, err);
    result = 'pending';
  }

  let state;
  if (result === 'paid') state = 'paid';
  else if (result === 'pending') state = cancelled ? 'cancelled' : 'pending';
  else state = 'failed'; // 'failed' or 'unknown'

  // Read the row again: verifyAndSettle may have just filled in the method and the paid time.
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    select: { amountPaise: true, currency: true, periodMonths: true, bonusDays: true, paymentMethod: true, discountCode: true },
  });
  const sub = state === 'paid' ? await getSubscription(user.id) : null;

  const planText = payment
    ? `${monthsLabel(payment.periodMonths || 1)}${payment.bonusDays > 0 ? ` + ${payment.bonusDays} bonus days` : ''}`
    : null;

  return (
    <PaymentResult
      state={state}
      orderId={orderId}
      amountText={payment ? `${formatMoney(payment.amountPaise, payment.currency)} ${payment.currency}` : null}
      planText={planText}
      methodText={payment?.paymentMethod ?? null}
      code={payment?.discountCode ?? null}
      periodEndText={sub ? dateFmt(sub.currentPeriodEnd) : null}
      reason={reason}
      redirectTo="/dashboard"
      redirectLabel="Dashboard"
    />
  );
}