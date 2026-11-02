'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteJobTarget, regeneratePlan, startMock } from '@/app/job-actions';
import Spinner from '@/components/Spinner';

import { ctaBtn } from './ui';

const btn = 'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-50';

export function StartMockButton({ jobId, resume = false, disabledReason = null }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [upgrade, setUpgrade] = useState(false);
  const [pending, start] = useTransition();

  function go() {
    if (resume) return start(() => router.push(`/jobs/${jobId}/mock`));
    setError(null);
    start(async () => {
      const res = await startMock(jobId);
      if (!res.ok) {
        setUpgrade(res.code === 'UPGRADE');
        return setError(res.error);
      }
      router.push(`/jobs/${jobId}/mock`);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={pending || Boolean(disabledReason)}
        aria-busy={pending}
        className={`${ctaBtn} w-full`}
      >
        {pending && <Spinner size={14} />}
        {pending ? (resume ? 'Opening…' : 'Preparing…') : resume ? 'Resume mock assessment' : 'Start mock assessment'}
      </button>
      {(error || disabledReason) && <p role="alert" className="mt-2 text-xs text-hard">{error ?? disabledReason}</p>}
      {upgrade && <Link href="/pricing" className="mt-2 inline-block text-xs font-semibold text-accent hover:underline">See Buncho Pro</Link>}
    </div>
  );
}

export function ManageRole({ jobId }) {
  const router = useRouter();
  const [msg, setMsg] = useState(null);
  const [action, setAction] = useState(null); // 'refresh' | 'delete'
  const [pending, start] = useTransition();

  function regenerate() {
    setMsg(null);
    setAction('refresh');
    start(async () => {
      const res = await regeneratePlan(jobId);
      setMsg(res.ok ? 'Plan refreshed with the latest questions.' : res.error);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm('Delete this role and its plan? Your answers and progress on the questions are kept.')) return;
    setAction('delete');
    start(async () => {
      await deleteJobTarget(jobId);
      router.push('/jobs');
    });
  }

  const refreshing = pending && action === 'refresh';
  const deleting = pending && action === 'delete';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={regenerate} disabled={pending} aria-busy={refreshing} className={`${btn} border border-line bg-surface/80 backdrop-blur hover:border-muted`}>
        {refreshing && <Spinner size={14} />}
        {refreshing ? 'Refreshing…' : 'Refresh plan'}
      </button>
      <button type="button" onClick={remove} disabled={pending} aria-busy={deleting} className={`${btn} text-hard hover:bg-hard/10`}>
        {deleting && <Spinner size={14} />}
        {deleting ? 'Deleting…' : 'Delete role'}
      </button>
      {msg && <span role="status" className="text-xs text-muted">{msg}</span>}
    </div>
  );
}