import Popup from './Popup';

function Ring({ score, size = 136 }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score === null ? 0 : Math.min(1, score / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="readiness-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--easy)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent)' }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#readiness-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-3xl font-semibold leading-none tabular-nums">{score ?? '—'}</p>
          <p className="mt-1.5 text-xs text-muted">out of 100</p>
        </div>
      </div>
    </div>
  );
}

const barColor = (s) => (s >= 70 ? 'bg-easy' : s >= 50 ? 'bg-medium' : 'bg-hard');

function TopicScores({ competencies, className }) {
  return (
    <ul className={className}>
      {competencies.map((c) => (
        <li key={c.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{c.name}</span>
            <span className="shrink-0 text-xs text-muted">
              {c.score === null ? 'Not assessed' : <><span className="font-semibold text-ink">{c.score}</span>/100</>}
            </span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuenow={c.score ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${c.name} score`}
          >
            <div className={`h-full rounded-full ${barColor(c.score ?? 0)}`} style={{ width: `${c.score ?? 0}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted">{c.evaluated}/{c.total} answered</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * The card shows only the score ring and summary. Topic scores and the "how is this calculated"
 * notes live in a popup, on every screen size.
 */
export default function ReadinessCard({ readiness, competencies }) {
  const { score, label, provisional, assessed, totalCompetencies, evaluatedProblems } = readiness;

  return (
    <section aria-labelledby="readiness-h" className="card p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="readiness-h" className="text-base font-semibold tracking-tight">AI Engineering Readiness</h2>
        {provisional && score !== null && (
          <span className="rounded-full bg-medium/12 px-2.5 py-0.5 text-xs font-semibold text-medium">Early estimate</span>
        )}
      </div>

      <div className="mt-5 flex flex-col items-center gap-5 text-center sm:mt-6 sm:flex-row sm:gap-8 sm:text-left">
        <Ring score={score} />
        <div className="min-w-0">
          <p className="text-2xl font-semibold tracking-tight">{label}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            {score === null
              ? 'Answer a question and get AI feedback to start building your score.'
              : `Based on ${evaluatedProblems} AI-evaluated ${evaluatedProblems === 1 ? 'answer' : 'answers'} across ${assessed} of ${totalCompetencies} topics.`}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <Popup
          title="Readiness breakdown"
          subtitle={`${assessed} of ${totalCompetencies} topics assessed`}
          buttonLabel={
            <>
              <span>View topic scores</span>
              <span className="text-xs font-normal text-muted">{assessed}/{totalCompetencies} assessed</span>
            </>
          }
          buttonClassName="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm font-semibold transition-colors hover:bg-surface-2"
        >
          <TopicScores competencies={competencies} className="space-y-6" />

          <div className="mt-8 border-t border-line pt-5 text-sm">
            <h3 className="font-semibold">How is this calculated?</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
              <li>Each topic score is the average AI feedback score of your latest answers in that topic.</li>
              <li>It is scaled down until you have answered at least 3 questions in that topic, so one lucky answer does not count in full.</li>
              <li>
                The readiness score is the weighted average of the topic scores (
                {competencies.map((c) => `${c.name} ${c.weight}%`).join(', ')}). Topics you haven&rsquo;t answered count as 0.
              </li>
              <li>It is an early estimate until you have several answers evaluated. It is a practice indicator, not a prediction or guarantee of interview results.</li>
            </ul>
          </div>
        </Popup>
      </div>
    </section>
  );
}