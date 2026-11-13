import crypto from 'node:crypto';

/**
 * Razorpay over REST (no extra dependency). One gateway for everything: Pro payments in INR and in other currencies (USD),
 * and sponsor banners (USD). Amounts are always in the smallest unit (paise for INR, cents for USD), exactly as Razorpay wants.
 *
 * Env:
 *   RAZORPAY_KEY_ID          rzp_test_... or rzp_live_... (the key id is public, it is handed to the checkout window)
 *   RAZORPAY_KEY_SECRET      the secret of that key (server only)
 *   RAZORPAY_WEBHOOK_SECRET  the secret you type when you add the webhook in the Razorpay dashboard
 *   RAZORPAY_INTERNATIONAL   optional. Set to "false" to hide the "Other currency" option (for example while
 *                            International Payments is not yet activated on your Razorpay account)
 *   NEXT_PUBLIC_APP_URL
 *
 * Test and live mode are decided by the key itself (rzp_test_ / rzp_live_). There is no separate sandbox URL.
 */
const BASE = 'https://api.razorpay.com/v1';

export const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID || '';

/** True when the keys are set, so payments can start at all. */
export const razorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

/** True when paying in another currency (USD) is offered. It needs International Payments switched on in your Razorpay account. */
export const razorpayInternational = () => razorpayConfigured() && String(process.env.RAZORPAY_INTERNATIONAL ?? '').toLowerCase() !== 'false';

export const razorpayMode = () => (razorpayKeyId().startsWith('rzp_live_') ? 'live' : 'test');

function auth() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
}

async function rzp(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: auth() },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[razorpay] request failed', path, res.status, body?.error ?? body);
    const err = new Error(body?.error?.description || 'The payment provider returned an error.');
    err.status = res.status;
    throw err;
  }
  return body;
}

/**
 * Creates the Razorpay order the checkout window pays against. `receipt` is our own order id (max 40 characters) and
 * `amount` is in paise / cents. Returns the order, whose `id` ("order_...") goes to the browser.
 */
export function createRazorpayOrder({ receipt, amount, currency, notes }) {
  return rzp('/orders', {
    method: 'POST',
    body: JSON.stringify({ amount, currency, receipt, notes: notes ?? {} }),
  });
}

/**
 * Asks Razorpay what happened to an order. Nothing the browser or a webhook says is trusted for status or amount.
 * Returns { state, payment? }: state is 'paid' | 'pending' | 'failed'. `payment` is the Razorpay payment that paid
 * (or the failed one). A payment that was only authorised (not captured yet) is captured here, so no customer is
 * charged without getting Pro.
 */
export async function inspectRazorpayOrder({ razorpayOrderId, amount, currency }) {
  const id = encodeURIComponent(razorpayOrderId);
  const [order, list] = await Promise.all([rzp(`/orders/${id}`), rzp(`/orders/${id}/payments`)]);

  // We created this order with the price fixed on our server. If it does not match our record, something is wrong.
  if (Number(order.amount) !== amount || order.currency !== currency) {
    console.error('[razorpay] order does not match our record', razorpayOrderId, order.amount, order.currency);
    return { state: 'failed' };
  }

  const items = Array.isArray(list?.items) ? list.items : [];
  let paid = items.find((p) => p.status === 'captured');

  if (!paid) {
    const authorized = items.find((p) => p.status === 'authorized');
    if (authorized) {
      try {
        paid = await rzp(`/payments/${encodeURIComponent(authorized.id)}/capture`, {
          method: 'POST',
          body: JSON.stringify({ amount, currency }),
        });
      } catch (err) {
        // Most likely it was captured a moment ago by automatic capture. Read it again before giving up.
        const again = await rzp(`/payments/${encodeURIComponent(authorized.id)}`).catch(() => null);
        if (again?.status === 'captured') paid = again;
        else console.error('[razorpay] could not capture', authorized.id, err?.message);
      }
    }
  }

  if (paid) {
    if (Number(paid.amount) < amount || paid.currency !== currency) {
      console.error('[razorpay] amount mismatch', razorpayOrderId, paid.amount, paid.currency);
      return { state: 'failed' };
    }
    return { state: 'paid', payment: paid };
  }

  // Every attempt so far failed. The customer can still retry inside the same checkout window, and a later success
  // simply flips the record to PAID, so showing "failed" here is safe.
  if (items.length && items.every((p) => p.status === 'failed')) return { state: 'failed', payment: items[0] };
  return { state: 'pending' };
}

/**
 * The checkout window returns razorpay_payment_id + razorpay_signature. The signature is
 * HMAC-SHA256(`${order_id}|${payment_id}`, key secret) as hex. `razorpayOrderId` must come from OUR record, never from the browser.
 * (We also re-read the payment from Razorpay, which is the stronger check. This is here for callers that want the cheap one.)
 */
export function verifyCheckoutSignature({ razorpayOrderId, paymentId, signature }) {
  if (!razorpayOrderId || !paymentId || !signature) return false;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_SECRET.');
  const expected = crypto.createHmac('sha256', secret).update(`${razorpayOrderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, String(signature));
}

/** Webhooks: X-Razorpay-Signature = HMAC-SHA256(raw body, webhook secret) as hex. The raw, unparsed body must be used. */
export function verifyRazorpayWebhook(rawBody, signature) {
  if (!signature) return false;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('Set RAZORPAY_WEBHOOK_SECRET.');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, String(signature));
}

function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** What we store as "method": UPI, CARD, NETBANKING, WALLET... */
export const methodLabel = (payment) => (payment?.method ? String(payment.method).toUpperCase() : null);