import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { settleAdPayment } from '@/lib/ad-payments';
import { Check } from '@/components/icons';

export const metadata = { title: 'Banner payment', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdReturnPage({ searchParams }) {
  const user = await getOrCreateUser();
  if (!user) redirect('/login?redirect_url=%2Fadvertise');

  const sp = await searchParams;
  const orderId = sp?.order;
  if (typeof orderId !== 'string' || !/^ad_[a-z0-9]{20,40}$/.test(orderId)) redirect('/advertise');

  const booking = await prisma.adBooking.findFirst({ where: { orderId, userId: user.id }, select: { id: true } });
  if (!booking) redirect('/advertise');

  // Our checkout form adds ?payment_id=pay_... after a successful payment. It is only a hint: Razorpay is asked again.
  const rawPid = typeof sp?.payment_id === 'string' ? sp.payment_id : null;
  const paymentId = rawPid && /^[A-Za-z0-9_-]{5,64}$/.test(rawPid) ? rawPid : null;

  let state;
  try {
    state = await settleAdPayment(orderId, paymentId);
  } catch (err) {
    console.error('[ads] return verification failed', orderId, err);
    state = 'pending';
  }

  const shell = 'mx-auto w-full max-w-lg px-4 py-20 text-center sm:px-6';
  const box = 'rounded-3xl border border-line bg-surface p-8 sm:p-10';
  const btn = 'inline-flex items-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-ink hover:opacity-90';
  const ghost = 'inline-flex items-center rounded-full border border-line px-5 py-3 text-sm font-semibold hover:border-muted';

  if (state === 'paid') {
    return (
      <div className={shell}>
        <div className={box}>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-go text-go-ink"><Check width={28} height={28} strokeWidth={3} /></span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Payment received</h1>
          <p className="mt-2 text-sm text-muted">
            Thank you. Your banner is now waiting for approval. Once it is approved it goes live in the Sponsored section on the
            problems page, and runs for 1 month from that day.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/problems" className={btn}>Go to problems</Link>
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
            We are waiting for the payment provider to confirm. This usually takes a few seconds. If you have already paid, do not pay again.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/advertise/return?order=${orderId}${paymentId ? `&payment_id=${paymentId}` : ''}`} className={btn}>Check again</Link>
            <Link href="/advertise" className={ghost}>Back</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className={box}>
        <h1 className="text-2xl font-semibold tracking-tight">Payment not completed</h1>
        <p className="mt-2 text-sm text-muted">We did not receive a payment for this banner. You have not been charged. You can try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/advertise#book" className={btn}>Try again</Link>
        </div>
      </div>
    </div>
  );
}