import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { isAdmin } from '@/lib/admin';
import { CODE_CURRENCIES, OFFER_TYPES, USD_MIN_CENTS, describeDeal, getBillingSettings, monthsLabel } from '@/lib/pricing';
import { formatMoney } from '@/lib/money';
import PendingButton from '@/components/PendingButton';
import { createCode, deleteCode, saveSettings, toggleCode } from './actions';

export const metadata = { title: 'Pricing and offers' };
export const dynamic = 'force-dynamic';

const toInput = (d) =>
  d
    ? new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .format(d)
        .replace(' ', 'T')
    : '';

const fmt = (d) => (d ? d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : '—');
const dateOnly = (d) => d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });

const input =
  'w-full rounded-lg border border-line bg-surface-2/40 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15';
const label = 'text-xs font-medium text-muted';
const primary = 'rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink hover:opacity-90';
const neutral = 'rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-2';

const PAY_TABS = [
  { id: 'all', label: 'All', status: null },
  { id: 'paid', label: 'Paid', status: 'PAID' },
  { id: 'unpaid', label: 'Not paid', status: 'PENDING' },
  { id: 'failed', label: 'Failed', status: 'FAILED' },
];

const STATUS_BADGE = {
  PAID: ['Paid', 'bg-go/15 text-go'],
  PENDING: ['Not paid', 'bg-surface-2 text-muted'],
  FAILED: ['Failed', 'bg-hard/15 text-hard'],
};

const PROVIDER_LABEL = { RAZORPAY: 'Razorpay', CASHFREE: 'Cashfree', DODO: 'Dodo Payments' };

const SCOPE_STYLE = {
  BOTH: 'bg-accent-soft text-accent',
  INR: 'bg-medium/15 text-medium',
  USD: 'bg-surface-2 text-ink',
};

const idOf = (p) => (p.provider === 'DODO' ? p.dodoPaymentId : p.provider === 'CASHFREE' ? p.cfPaymentId : p.razorpayPaymentId);

function Card({ id, title, hint, children }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({ label: name, children }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-1.5 text-sm">
      <dt className="text-muted">{name}</dt>
      <dd className="min-w-0 break-all text-right font-medium">{children ?? '—'}</dd>
    </div>
  );
}

function TypeSelect({ name, defaultValue }) {
  return (
    <select name={name} defaultValue={defaultValue} className={input}>
      {Object.entries(OFFER_TYPES).map(([k, v]) => (
        <option key={k} value={k}>{v}</option>
      ))}
    </select>
  );
}

export default async function AdminBillingPage({ searchParams }) {
  const user = await getOrCreateUser();
  if (!isAdmin(user)) notFound(); // don't reveal that the page exists

  const sp = await searchParams;
  const saved = typeof sp.saved === 'string' ? sp.saved : null;
  const error = typeof sp.error === 'string' ? sp.error : null;
  const payTab = PAY_TABS.find((t) => t.id === sp.pay) ?? PAY_TABS[0];

  const settings = await getBillingSettings(); // has its own fallback to defaults

  let codes = [];
  let payments = [];
  let paidCount = 0;
  let revenueRows = [];
  let statusRows = [];
  let activePro = 0;
  let dbProblem = null;

  // If the database is behind schema.prisma (missing tables or columns) show a notice instead of crashing the page.
  try {
    [codes, payments, paidCount, revenueRows, activePro, statusRows] = await Promise.all([
      prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.payment.findMany({
        where: payTab.status ? { status: payTab.status } : {},
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true, _count: { select: { payments: true } } } },
        },
      }),
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.payment.groupBy({ by: ['currency'], where: { status: 'PAID' }, _sum: { amountPaise: true } }),
      prisma.subscription.count({ where: { currentPeriodEnd: { gt: new Date() } } }),
      prisma.payment.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
  } catch (err) {
    console.error('[admin billing] could not load billing data', err?.code, err);
    dbProblem = err?.code ? `Prisma error ${err.code}` : 'Database error';
  }

  const countBy = Object.fromEntries(statusRows.map((r) => [r.status, r._count._all]));
  const tabCounts = {
    all: statusRows.reduce((s, r) => s + r._count._all, 0),
    paid: countBy.PAID ?? 0,
    unpaid: countBy.PENDING ?? 0,
    failed: countBy.FAILED ?? 0,
  };
  const revenueText = revenueRows.length
    ? revenueRows.map((r) => formatMoney(r._sum.amountPaise ?? 0, r.currency)).join(' + ')
    : formatMoney(0, 'INR');

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pricing and offers</h1>
          <p className="mt-1 text-sm text-muted">Change the Pro price, run offers and create promo codes. Changes go live on /pricing straight away.</p>
        </div>
        <Link href="/pricing" className="text-sm font-semibold text-accent underline underline-offset-4">View pricing page</Link>
      </div>

      {dbProblem && (
        <p role="alert" className="mt-5 rounded-xl border border-hard/40 bg-hard/10 px-4 py-3 text-sm font-medium text-hard">
          The database is out of date ({dbProblem}). Run <code>npx prisma db push</code> against the production DATABASE_URL and DIRECT_URL, make sure the build runs <code>prisma generate</code>, then redeploy.
        </p>
      )}
      {saved && <p role="status" className="mt-5 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm font-medium text-accent">{saved}</p>}
      {error && <p role="alert" className="mt-5 rounded-xl border border-hard/40 bg-hard/10 px-4 py-3 text-sm font-medium text-hard">{error}</p>}

      <dl className="mt-6 grid grid-cols-3 gap-3">
        {[
          ['Active Pro users', activePro],
          ['Paid orders', paidCount],
          ['Revenue', revenueText],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 space-y-8">
        {/* Recent payments */}
        <Card id="recent-payments" title="Recent payments" hint="Pro payments (INR and USD through Razorpay), newest first. Shows the last 50 in the selected tab.">
          <nav aria-label="Payment lists" className="flex gap-1 overflow-x-auto border-b border-line">
            {PAY_TABS.map((t) => {
              const on = payTab.id === t.id;
              const count = tabCounts[t.id];
              return (
                <Link
                  key={t.id}
                  href={`/admin/billing?pay=${t.id}#recent-payments`}
                  aria-current={on ? 'page' : undefined}
                  className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${on ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'}`}
                >
                  {t.label}
                  {count > 0 && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.7rem] font-bold tabular-nums text-muted">{count}</span>}
                </Link>
              );
            })}
          </nav>

          {payments.length ? (
            <ul className="mt-5 space-y-5">
              {payments.map((p) => {
                const [statusLabel, statusStyle] = STATUS_BADGE[p.status] ?? [p.status, 'bg-surface-2 text-muted'];
                const providerLabel = PROVIDER_LABEL[p.provider] ?? p.provider;
                const paymentId = idOf(p);
                return (
                  <li key={p.id} className="rounded-2xl border border-line bg-surface-2/30 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}>{statusLabel}</span>
                        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">{providerLabel}</span>
                        <span className="text-sm font-semibold tabular-nums">{formatMoney(p.amountPaise, p.currency)}</span>
                      </div>
                      <span className="text-xs text-muted">Created {fmt(p.createdAt)}</span>
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Customer</p>
                        <dl className="mt-2 divide-y divide-line">
                          <Row label="Name">{p.user?.name}</Row>
                          <Row label="Account email">{p.user?.email}</Row>
                          <Row label="Joined Buncho">{p.user ? dateOnly(p.user.createdAt) : null}</Row>
                          <Row label="Total orders">{p.user?._count.payments}</Row>
                          <Row label="User ID">{p.user?.id}</Row>
                        </dl>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Payment ({providerLabel})</p>
                        <dl className="mt-2 divide-y divide-line">
                          <Row label="Amount">{formatMoney(p.amountPaise, p.currency)} {p.currency}</Row>
                          <Row label="Plan">
                            {monthsLabel(p.periodMonths)}{p.bonusDays > 0 ? ` + ${p.bonusDays} bonus days` : ''}
                          </Row>
                          {(p.discountPaise > 0 || p.discountCode) && (
                            <Row label="Discount">
                              {p.discountPaise > 0 ? `${formatMoney(p.discountPaise, p.currency)} off` : 'Bonus days'}
                              {p.discountCode ? ` (${p.discountCode})` : ''}
                            </Row>
                          )}
                          <Row label="Paid at">{p.paidAt ? fmt(p.paidAt) : null}</Row>
                          <Row label="Payment ID">{paymentId}</Row>
                          <Row label="Method">{p.paymentMethod}</Row>
                          <Row label="Payer email">{p.payerEmail}</Row>
                          <Row label="Order ID">{p.orderId}</Row>
                        </dl>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 rounded-lg bg-surface-2/60 px-4 py-5 text-sm text-muted">Nothing here yet.</p>
          )}
        </Card>
        
        {/* Price and site-wide offer */}
        <Card title="Pro price and site-wide offer" hint={`The offer applies to everyone automatically. A promo code replaces it (they do not stack). After any discount the lowest price is ₹1 for INR and $${(USD_MIN_CENTS / 100).toFixed(2)} for USD. Flat ₹ offers apply to INR payments only.`}>
          <form action={saveSettings} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label htmlFor="proName" className={label}>Plan name</label>
                <input id="proName" name="proName" defaultValue={settings.proName} maxLength={40} required className={`${input} mt-1.5`} />
              </div>
              <div>
                <label htmlFor="priceInr" className={label}>Price in INR (₹)</label>
                <input id="priceInr" name="priceInr" type="number" min={1} max={100000} defaultValue={settings.priceInr} required className={`${input} mt-1.5`} />
              </div>
              <div>
                <label htmlFor="priceUsd" className={label}>Price in other currency (USD $)</label>
                <input id="priceUsd" name="priceUsd" type="number" min={1} max={1000} step="0.01" defaultValue={(settings.priceUsdCents / 100).toFixed(2)} required className={`${input} mt-1.5`} />
              </div>
              <div>
                <label htmlFor="periodMonths" className={label}>Length (months)</label>
                <input id="periodMonths" name="periodMonths" type="number" min={1} max={24} defaultValue={settings.periodMonths} required className={`${input} mt-1.5`} />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" name="checkoutOpen" defaultChecked={settings.checkoutOpen} className="h-4 w-4 accent-accent" />
              Upgrades open (untick to pause all new payments)
            </label>

            <div className="rounded-xl border border-line p-4">
              <label className="flex items-center gap-2.5 text-sm font-semibold">
                <input type="checkbox" name="offerOn" defaultChecked={settings.offerOn} className="h-4 w-4 accent-accent" />
                Site-wide offer is on
              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2">
                  <label htmlFor="offerLabel" className={label}>Badge text on the pricing page (optional)</label>
                  <input id="offerLabel" name="offerLabel" defaultValue={settings.offerLabel} maxLength={60} placeholder="Diwali offer: 30% off" className={`${input} mt-1.5`} />
                </div>
                <div>
                  <label htmlFor="offerType" className={label}>Offer type</label>
                  <div className="mt-1.5"><TypeSelect name="offerType" defaultValue={settings.offerType} /></div>
                </div>
                <div>
                  <label htmlFor="offerValue" className={label}>Value</label>
                  <input id="offerValue" name="offerValue" type="number" min={0} defaultValue={settings.offerValue || ''} className={`${input} mt-1.5`} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="offerEndsAt" className={label}>Ends (India time, empty = no end)</label>
                  <input id="offerEndsAt" name="offerEndsAt" type="datetime-local" defaultValue={toInput(settings.offerEndsAt)} className={`${input} mt-1.5`} />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">Value means: percent for “Percent off” (1 to 99), rupees for “Flat ₹ off”, days for “Bonus days free”.</p>
            </div>

            <PendingButton className={primary} pendingLabel="Saving…">Save settings</PendingButton>
          </form>
        </Card>

        {/* Promo codes */}
        <Card title="Promo codes" hint="Buyers type these on the pricing page. The discount is applied before payment. Choose whether a code works for INR payments, USD payments or both. Flat ₹ codes work in INR only.">
          <form action={createCode} className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="code" className={label}>Code</label>
              <input id="code" name="code" required minLength={3} maxLength={24} placeholder="WELCOME20" className={`${input} mt-1.5 uppercase`} />
            </div>
            <div>
              <label htmlFor="type" className={label}>Type</label>
              <div className="mt-1.5"><TypeSelect name="type" defaultValue="PERCENT_OFF" /></div>
            </div>
            <div>
              <label htmlFor="value" className={label}>Value</label>
              <input id="value" name="value" type="number" min={1} required className={`${input} mt-1.5`} />
            </div>
            <div>
              <label htmlFor="currencies" className={label}>Works for</label>
              <select id="currencies" name="currencies" defaultValue="BOTH" className={`${input} mt-1.5`}>
                {Object.entries(CODE_CURRENCIES).map(([k, v]) => (
                  <option key={k} value={k}>{k === 'BOTH' ? `Both (${v})` : `${v.replace(' only', '')} payments only`}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="perUserLimit" className={label}>Uses per person</label>
              <input id="perUserLimit" name="perUserLimit" type="number" min={1} max={100} defaultValue={1} className={`${input} mt-1.5`} />
            </div>
            <div>
              <label htmlFor="maxRedemptions" className={label}>Max total uses (empty = unlimited)</label>
              <input id="maxRedemptions" name="maxRedemptions" type="number" min={1} className={`${input} mt-1.5`} />
            </div>
            <div>
              <label htmlFor="startsAt" className={label}>Starts (India time)</label>
              <input id="startsAt" name="startsAt" type="datetime-local" className={`${input} mt-1.5`} />
            </div>
            <div>
              <label htmlFor="expiresAt" className={label}>Expires (India time)</label>
              <input id="expiresAt" name="expiresAt" type="datetime-local" className={`${input} mt-1.5`} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="note" className={label}>Note for you (optional)</label>
              <input id="note" name="note" maxLength={120} className={`${input} mt-1.5`} />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <PendingButton className={primary} pendingLabel="Creating…">Create code</PendingButton>
            </div>
          </form>

          {codes.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Code</th>
                    <th className="py-2 pr-3 font-medium">Deal and currency</th>
                    <th className="py-2 pr-3 font-medium">Used</th>
                    <th className="py-2 pr-3 font-medium">Valid</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id} className="border-t border-line align-top">
                      <td className="py-3 pr-3">
                        <p className="font-semibold tracking-wide">{c.code}</p>
                        {c.note && <p className="text-xs text-muted">{c.note}</p>}
                      </td>
                      <td className="py-3 pr-3">
                        {describeDeal(c.type, c.value)}
                        <p className="mt-1">
                          <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${SCOPE_STYLE[c.currencies ?? 'BOTH'] ?? SCOPE_STYLE.BOTH}`}>
                            {CODE_CURRENCIES[c.currencies ?? 'BOTH'] ?? CODE_CURRENCIES.BOTH}
                          </span>
                        </p>
                      </td>
                      <td className="py-3 pr-3 tabular-nums">
                        {c.redeemedCount}{c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ''}
                        <p className="text-xs text-muted">{c.perUserLimit} per person</p>
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted">
                        {c.startsAt ? `From ${fmt(c.startsAt)}` : 'From now'}
                        <br />
                        {c.expiresAt ? `Until ${fmt(c.expiresAt)}` : 'No end date'}
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.active ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>
                          {c.active ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <form action={toggleCode}>
                            <input type="hidden" name="id" value={c.id} />
                            <PendingButton className={neutral}>{c.active ? 'Turn off' : 'Turn on'}</PendingButton>
                          </form>
                          <form action={deleteCode}>
                            <input type="hidden" name="id" value={c.id} />
                            <PendingButton className={`${neutral} text-hard`}>Delete</PendingButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 rounded-lg bg-surface-2/60 px-4 py-5 text-sm text-muted">No promo codes yet.</p>
          )}
        </Card>

        
      </div>
    </div>
  );
}