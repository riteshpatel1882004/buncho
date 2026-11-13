import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { verifyAndSettle } from '@/lib/billing';
import { getSubscription } from '@/lib/subscription';
import { ctaBtn } from '@/components/jobs/ui';
import { Check } from '@/components/icons';

export const metadata = { title: 'Payment status', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const dateFmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

export default async function BillingReturnPage({ searchParams }) {
  const user = await getOrCreateUser();
  if (!user) redirect('/login?redirect_url=%2Fpricing');

  const sp = await searchParams;
  const orderId = sp?.order_id;
  if (typeof orderId !== 'string' || !/^bnc_[a-z0-9]{20,40}$/.test(orderId)) redirect('/pricing');

  const payment = await prisma.payment.findFirst({ where: { orderId, userId: user.id }, select: { id: true } });
  if (!payment) redirect('/pricing');

  // Our checkout page adds ?payment_id=pay_... after a successful payment. It is only a hint: Razorpay is asked again.
  const rawPid = typeof sp?.payment_id === 'string' ? sp.payment_id : null;
  const paymentId = rawPid && /^[A-Za-z0-9_-]{5,64}$/.test(rawPid) ? rawPid : null;

  let state;
  try {
    state = await verifyAndSettle(orderId, paymentId);
  } catch (err) {
    console.error('[billing] return verification failed', orderId, err);
    state = 'pending';
  }
  const sub = state === 'paid' ? await getSubscription(user.id) : null;

  const shell = 'mx-auto w-full max-w-lg px-4 py-20 text-center sm:px-6';
  const box = 'rounded-3xl border border-line bg-surface p-8 sm:p-10';
  const ghost = 'inline-flex items-center rounded-full border border-line px-5 py-3 text-sm font-semibold hover:border-muted';

  if (state === 'paid') {
    return (
      <div className={shell}>
        <div className={box}>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-go text-go-ink"><Check width={28} height={28} strokeWidth={3} /></span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">You&rsquo;re on Buncho Pro</h1>
          <p className="mt-2 text-sm text-muted">
            Payment received.{sub && <> Pro is active until <span className="font-semibold text-ink">{dateFmt(sub.currentPeriodEnd)}</span>.</>}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/jobs" className={ctaBtn}>Go to job prep</Link>
            <Link href="/problems" className={ghost}>Browse questions</Link>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'pending') {
    return (
      <div className={shell}>
        <div className={box}>
          <h1 className="text-2xl font-semibold tracking-tight">Confirming your payment</h1>
          <p className="mt-2 text-sm text-muted">
            We have not received confirmation yet. UPI and card payments can take a minute. If money was deducted, Pro switches on automatically as soon as it is confirmed. You do not need to pay again.
          </p>
          <p className="mt-2 text-sm text-muted">If you closed the payment page without paying, nothing was charged and you can start again from the pricing page.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/billing/return?order_id=${orderId}${paymentId ? `&payment_id=${paymentId}` : ''}`} className={ctaBtn}>Check again</Link>
            <Link href="/pricing" className={ghost}>Back to pricing</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className={box}>
        <h1 className="text-2xl font-semibold tracking-tight">Payment did not go through</h1>
        <p className="mt-2 text-sm text-muted">You have not been charged for this attempt. If money left your account, your bank refunds it automatically within a few working days.</p>
        <div className="mt-6"><Link href="/pricing" className={ctaBtn}>Try again</Link></div>
      </div>
    </div>
  );
}