import Link from 'next/link';
import { Bar } from './Parts';
import Section, { Empty } from '@/components/dashboard/Section';

export default function JobPrepCard({ jobs }) {
  return (
    <Section
      id="jobs-h"
      title="Job preparation"
      action={{ href: '/jobs', label: jobs.length ? 'All roles' : 'Get started' }}
    >
      {jobs.length ? (
        <ul className="space-y-5">
          {jobs.map((j) => {
            const pct = j.total ? Math.round((j.completed / j.total) * 100) : 0;
            return (
              <li key={j.id}>
                <Link href={`/jobs/${j.id}`} className="flex items-baseline justify-between gap-3 text-sm hover:text-accent">
                  <span className="min-w-0 truncate font-medium">{j.title}{j.company && <span className="font-normal text-muted"> · {j.company}</span>}</span>
                  <span className="shrink-0 text-xs text-muted">{j.completed}/{j.total}</span>
                </Link>
                <div className="mt-2"><Bar value={pct} label={`${j.title} plan progress`} /></div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty>Applying to a specific role? Paste the job description and get a practice plan built from the question bank.</Empty>
      )}
    </Section>
  );
}