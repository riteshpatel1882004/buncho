import Link from 'next/link';
import DifficultyBadge from '@/components/DifficultyBadge';
import { Check } from '@/components/icons';
import { TYPE_LABEL } from '@/lib/constants';
import { InsightsInline } from '@/components/Insights';
import { TONE_SOFT, TONE_TEXT, toneOf } from './ui';

export const barColor = (s) => (s >= 70 ? 'bg-easy' : s >= 50 ? 'bg-medium' : 'bg-hard');

export function Bar({ value, label }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-line/60" role="progressbar" aria-valuenow={value ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={`h-full rounded-full ${barColor(value ?? 0)}`} style={{ width: `${value ?? 0}%` }} />
    </div>
  );
}

export function SkillRow({ skill }) {
  const gap = skill.bankCoverage === 0;
  const core = skill.importance === 'core';
  const tone = skill.score === null ? 'muted' : toneOf(skill.score);
  return (
    <li className="rounded-xl bg-surface-2/50 px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-sm font-medium leading-snug">{skill.label}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${core ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>
          {core ? 'Core' : 'Nice to have'}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {gap
          ? 'No questions in the bank yet'
          : skill.score === null
            ? `${skill.done}/${skill.inPlan} done · not assessed`
            : <><span className={`font-semibold ${TONE_TEXT[tone]}`}>{skill.score}</span>/100 · {skill.done}/{skill.inPlan} done</>}
      </p>
      {!gap && <div className="mt-2"><Bar value={skill.score ?? 0} label={`${skill.label} score`} /></div>}
    </li>
  );
}

export function PlanRow({ item, number, skillLabels, pro = false }) {
  const { problem: p } = item;
  const done = item.status === 'COMPLETED';
  const labels = item.skillKeys.map((k) => skillLabels[k] ?? k);
  return (
    <li>
      <Link
        href={`/problems/${p.slug}`}
        className="group flex items-start gap-3.5 rounded-xl border border-transparent px-3 py-3 transition-all hover:border-line hover:bg-surface-2/60"
      >
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center">
          {done ? (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-go text-go-ink"><Check width={14} height={14} strokeWidth={3} /><span className="sr-only">Completed</span></span>
          ) : item.status === 'ATTEMPTED' ? (
            <span className="h-5 w-5 rounded-full border-2 border-accent border-r-transparent"><span className="sr-only">Attempted</span></span>
          ) : (
            <span className="h-5 w-5 rounded-full border-2 border-line"><span className="sr-only">Not started</span></span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-snug group-hover:text-accent">
            <span className="mr-1.5 tabular-nums text-muted">{number}.</span>{p.title}
            {p.isChallenge && <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 align-middle text-[0.65rem] font-semibold text-accent">Challenge</span>}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {labels.slice(0, 2).map((l) => <span key={l} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[0.7rem] font-medium text-muted">{l}</span>)}
            {labels.length > 2 && <span className="text-[0.7rem] text-muted">+{labels.length - 2}</span>}
            <span className="text-xs text-muted">{TYPE_LABEL[p.type]} · {p.estimatedMinutes} min</span>
          </span>
          <InsightsInline pro={pro} problem={p} className="mt-1.5" />
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <DifficultyBadge difficulty={p.difficulty} />
          {item.score !== null && <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${TONE_SOFT[toneOf(item.score)]}`}>{item.score}/100</span>}
        </span>
      </Link>
    </li>
  );
}