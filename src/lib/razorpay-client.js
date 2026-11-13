// Browser only. Opens Razorpay's checkout window for an order our server created, shared by the Pro button and the banner form.
// Nothing here is trusted for "was it paid": after success the page goes to a return page, which asks Razorpay itself.

const SDK = 'https://checkout.razorpay.com/v1/checkout.js';
const THEME = '#158f47'; // the site's accent colour

function loadSdk() {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SDK}"]`);
    const done = () => (window.Razorpay ? resolve() : reject(new Error('Could not load the payment window. Check your connection and try again.')));
    if (existing) {
      existing.addEventListener('load', done);
      existing.addEventListener('error', done);
      return;
    }
    const s = document.createElement('script');
    s.src = SDK;
    s.async = true;
    s.onload = done;
    s.onerror = () => reject(new Error('Could not load the payment window. Check your connection and try again.'));
    document.head.appendChild(s);
  });
}

/**
 * session: what the server action returned ({ keyId, razorpayOrderId, amount, currency, name, description, prefill }).
 * Resolves { paymentId } when the customer pays. Rejects with an Error when the window cannot open; the error has
 * `dismissed: true` when the customer simply closed the window (then `message` may carry the last failure reason).
 */
export async function payWithRazorpay(session) {
  await loadSdk();
  return new Promise((resolve, reject) => {
    let lastFailure = '';
    const rzp = new window.Razorpay({
      key: session.keyId,
      order_id: session.razorpayOrderId,
      amount: session.amount,
      currency: session.currency,
      name: session.name || 'Buncho',
      description: session.description || '',
      prefill: session.prefill || {},
      theme: { color: THEME },
      retry: { enabled: true },
      handler: (res) => resolve({ paymentId: res?.razorpay_payment_id || null }),
      modal: {
        confirm_close: true,
        ondismiss: () => {
          const err = new Error(lastFailure || '');
          err.dismissed = true;
          reject(err);
        },
      },
    });
    // A failed attempt does not close the window: the customer can try another method. Remember why, in case they give up.
    rzp.on('payment.failed', (res) => {
      lastFailure = res?.error?.description || 'The payment did not go through.';
    });
    rzp.open();
  });
}