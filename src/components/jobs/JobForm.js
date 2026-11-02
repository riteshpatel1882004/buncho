'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createJobTarget } from '@/app/job-actions';
import { JD_MAX_LENGTH, JD_MIN_LENGTH } from '@/lib/constants';
import Spinner from '@/components/Spinner';
import { Check } from '@/components/icons';
import { card, ctaBtn } from './ui';

const field =
  'w-full rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15';

export default function JobForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jd, setJd] = useState('');
  const [error, setError] = useState(null);
  const [upgrade, setUpgrade] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createJobTarget({ title, company, jdText: jd });
      if (!res.ok) {
        setUpgrade(res.code === 'UPGRADE');
        return setError(res.error);
      }
      router.push(`/jobs/${res.id}`);
    });
  }

  const len = jd.trim().length;
  const short = len < JD_MIN_LENGTH;
  const fill = Math.min(100, Math.round((len / JD_MIN_LENGTH) * 100));

  return (
    <form onSubmit={submit} className={`${card} space-y-6 p-5 sm:p-7`}>
      <div>
        <h2 className="text-lg font-semibold">Role details</h2>
        <p className="mt-0.5 text-sm text-muted">Both fields are optional. We will name the role from the description if you leave them empty.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="job-title" className="text-sm font-medium">Role title <span className="font-normal text-muted">(optional)</span></label>
            <input id="job-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="GenAI Engineer Intern" className={`${field} mt-1.5`} />
          </div>
          <div>
            <label htmlFor="job-company" className="text-sm font-medium">Company <span className="font-normal text-muted">(optional)</span></label>
            <input id="job-company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={80} placeholder="Acme AI" className={`${field} mt-1.5`} />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between gap-3">
          <label htmlFor="job-jd" className="text-lg font-semibold">Job description</label>
          <span className="text-xs tabular-nums text-muted">{jd.length.toLocaleString()} / {JD_MAX_LENGTH.toLocaleString()}</span>
        </div>
        <textarea
          id="job-jd"
          value={jd}
          onChange={(e) => setJd(e.target.value.slice(0, JD_MAX_LENGTH))}
          rows={14}
          disabled={pending}
          placeholder="Paste the full job description here, including the responsibilities and requirements sections."
          className={`${field} mt-2.5 resize-y leading-relaxed disabled:opacity-60`}
        />

        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/60" aria-hidden="true">
            <div className={`h-full rounded-full transition-all duration-300 ${short ? 'bg-medium' : 'bg-accent'}`} style={{ width: `${fill}%` }} />
          </div>
          <p className={`flex items-center gap-1.5 text-xs font-medium ${short ? 'text-muted' : 'text-accent'}`} aria-live="polite">
            {short ? (
              len === 0 ? 'Paste at least a few lines' : `${JD_MIN_LENGTH - len} more characters needed`
            ) : (
              <><Check width={12} height={12} strokeWidth={3.5} /> Enough detail to analyse</>
            )}
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-hard/30 bg-hard/10 px-4 py-3 text-sm text-hard">
          {error}
          {upgrade && <> <Link href="/pricing" className="font-semibold underline">See Buncho Pro</Link></>}
        </p>
      )}

      {pending && (
        <div role="status" className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <Spinner size={18} className="text-accent" />
          <span>Analysing the role and building your plan. This can take a few seconds.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <button type="submit" disabled={pending || short} aria-busy={pending} className={ctaBtn}>
          {pending && <Spinner size={14} />}
          {pending ? 'Reading job description…' : 'Build my practice plan'}
        </button>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          Your job description stays private to your account.
        </p>
      </div>
    </form>
  );
}