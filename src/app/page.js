import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import HeroDemo from '@/components/HeroDemo';
import Logo from '@/components/Logo';
import CountUp from '@/components/home/CountUp';
import RotatingWord from '@/components/home/RotatingWord';
import StickyCta from '@/components/home/StickyCta';
import { Book, Check, ChevronRight, Chat, Database, Mic, Tag, Users } from '@/components/icons';
import { getCategoryCounts, getCompanyCounts, getTopics, getTotalProblemCount } from '@/lib/problems';
import JsonLd from '@/components/JsonLd';
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, buildMetadata, graph, organizationJsonLd, websiteJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  absoluteTitle: `${SITE_NAME}: ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  path: '/',
});

const FAQ = [
  {
    q: 'What is Buncho?',
    a: 'Buncho is an interview practice platform for AI, machine learning and generative AI engineers. You answer real interview questions by speaking or typing, then compare your answer with a reference solution and AI feedback.',
  },
  {
    q: 'Which topics and question types are covered?',
    a: 'Topics include machine learning fundamentals, deep learning, generative AI and LLMs, RAG and vector databases, Python for AI and ML, and production AI engineering. Questions range from conceptual and practical exercises to debugging, system design and case studies.',
  },
  {
    q: 'Can I answer out loud instead of typing?',
    a: 'Yes. Use the microphone to dictate your answer, or type it. Explaining a long scenario out loud is closer to a real interview.',
  },
  {
    q: 'How does the AI feedback work?',
    a: 'After you submit an answer, it is scored against a rubric covering coverage, technical accuracy, reasoning depth and clarity. The reference solution unlocks at the same time so you can compare approaches.',
  },
  {
    q: 'Is Buncho free?',
    a: 'You can start practicing for free. Create a free account to save answers and track your streak and progress.',
  },
];

const STEPS = [
  { n: '1', title: 'Pick a problem', body: 'Browse by topic, difficulty or type from the problem list, or search for a concept.', time: 'About 1 min' },
  { n: '2', title: 'Answer it first', body: 'Use the two-pane workspace: the problem on the left, your spoken or written answer on the right.', time: '5 to 15 min' },
  { n: '3', title: 'Compare and learn', body: ' Unlock the expert solution and compare it with your answer, then mark the problem complete.', time: 'About 5 min' },
];

const FALLBACK_TOPICS = [
  'Machine learning',
  'Deep learning',
  'Generative AI and LLMs',
  'RAG and vector databases',
  'Python for AI and ML',
  'Production AI engineering',
];

const WAVE = [0.1, 0.45, 0.2, 0.6, 0.05, 0.5, 0.3, 0.7, 0.15, 0.55, 0.25, 0.4, 0.1, 0.65, 0.35, 0.2, 0.5, 0.05, 0.45, 0.3, 0.6, 0.15];

const RUBRIC = [
  ['Coverage', 30, 40],
  ['Accuracy', 26, 30],
  ['Reasoning', 13, 20],
  ['Clarity', 9, 10],
];

function SectionHeader({ title, body, action, id }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h2 id={id} className="text-[1.65rem] font-extrabold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h2>
        {body && <p className="mt-3 leading-relaxed text-muted sm:text-lg">{body}</p>}
      </div>
      {action}
    </div>
  );
}

function IconChip({ children }) {
  return <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent">{children}</span>;
}

export default async function LandingPage() {
  const { userId } = await auth();
  let topics = [];
  let companies = [];
  let allProblems = 0; // every published question: AI + HR + SQL + anything added later
  let categoryCounts = { ai: 0, hr: 0, sql: 0 };
  try {
    const [t, c, total, cats] = await Promise.all([getTopics(), getCompanyCounts(), getTotalProblemCount(), getCategoryCounts()]);
    topics = t;
    companies = c;
    allProblems = total;
    categoryCounts = cats;
  } catch {
    // The landing page should still render if the database is unreachable
  }
  // AI/ML problems only: used by the "Browse by topic" card, which counts the AI topics
  const totalProblems = topics.reduce((sum, t) => sum + t._count.problems, 0);

  const faqJsonLd = {
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  const companyCount = companies.length;
  // The strip under the hero shows real company names; falls back to topic names if no company data exists yet
  const marqueeNames = companies.length ? companies.slice(0, 16).map((c) => c.name) : topics.length ? topics.map((t) => t.name) : FALLBACK_TOPICS;
  const marqueeHalf = [...marqueeNames, ...marqueeNames];

  const primaryHref = userId ? '/problems' : '/register';
  const primaryLabel = userId ? 'Pick a problem' : 'Create free account';

  return (
    <>
      <JsonLd data={graph(organizationJsonLd(), websiteJsonLd(), faqJsonLd)} />

      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden">
        <div className="dot-grid" aria-hidden="true" />

        {/* minmax(0, ...) lets each column shrink to the screen, so nothing gets cut off on phones */}
        <div className="mx-auto grid w-full max-w-[96rem] grid-cols-[minmax(0,1fr)] items-center gap-8 px-4 pb-10 pt-6 sm:gap-10 sm:pb-12 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14 lg:pb-24 lg:pt-20">
          <div className="min-w-0">
            <Link
              href="/problems"
              className="rise group inline-flex max-w-full items-center gap-2.5 rounded-full border border-line bg-surface/80 py-1.5 pl-3 pr-3.5 text-xs font-medium text-muted backdrop-blur transition-colors hover:border-accent/50 hover:text-ink sm:text-sm"
              style={{ '--i': 0 }}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="truncate">
                <span className="font-semibold text-ink">{allProblems ? `${allProblems}+` : 'Hundreds of'}</span> questions across AI, SQL and HR
              </span>
              <ChevronRight width={14} height={14} className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>

            <h1
              className="rise mt-4 text-balance text-[2.1rem] font-extrabold leading-[1.08] tracking-tight sm:mt-5 sm:text-5xl lg:text-6xl"
              style={{ '--i': 1 }}
            >
              Practice <RotatingWord words={['AI engineering', 'machine learning', 'generative AI', 'SQL', 'HR round']} /> interview questions out loud.
            </h1>

            <p
              className="rise mt-4 max-w-xl text-[0.95rem] leading-relaxed text-muted sm:mt-5 sm:text-lg"
              style={{ '--i': 2 }}
            >
              Answer by voice or text, get a rubric score, then compare your thinking with an expert solution and with other learners.
            </p>

            <div className="rise mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row" style={{ '--i': 3 }}>
              <Link
                href="/problems"
                className="btn-sheen inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-7 font-semibold text-accent-ink shadow-lg shadow-accent/25 transition-transform active:scale-[0.98]"
              >
                Start practicing
                <ChevronRight width={18} height={18} />
              </Link>
              <Link
                href={userId ? '/dashboard' : '/register'}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-line bg-surface-2/60 px-7 font-semibold transition-colors active:scale-[0.98] hover:bg-surface-2"
              >
                {userId ? 'Open dashboard' : 'Create free account'}
              </Link>
            </div>

            {/* Phones: one neat row of three. Larger screens: a simple inline list. */}
            <ul
              className="rise mt-5 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-surface/60 py-3 text-center text-xs text-muted sm:flex sm:gap-x-5 sm:divide-x-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:py-0 sm:text-left sm:text-sm"
              style={{ '--i': 4 }}
            >
              {['Free to start', 'Voice and text', 'Expert solutions'].map((t) => (
                <li key={t} className="flex flex-col items-center gap-1 px-1 sm:flex-row sm:gap-1.5 sm:px-0">
                  <Check width={16} height={16} className="text-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rise min-w-0" style={{ '--i': 3 }}>
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* ---------- Companies strip ---------- */}
      <section className="mx-auto w-full max-w-[96rem] px-4" aria-label="Companies">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          {companies.length ? 'Questions reported from interviews at' : 'Topics you can practice'}
        </p>
        <div className="marquee mt-4 overflow-hidden" aria-hidden="true">
          <div className="marquee-mask">
            <div className="marquee-track">
              {[...marqueeNames, ...marqueeNames, ...marqueeNames, ...marqueeNames].map((name, i) => (
                <span key={i} className="mr-10 inline-flex items-center gap-10 whitespace-nowrap text-lg font-bold tracking-tight text-muted/80 sm:text-xl">
                  {name}
                  <span className="h-1 w-1 rounded-full bg-line" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="mx-auto mt-12 w-full max-w-[96rem] px-4" aria-label="Platform at a glance">
        {/* Every number comes from the database. `fallback` (shown with a "+") is only used if the database is unreachable.
            To add or swap a stat, edit this list. */}
        <dl className="grid grid-cols-3 gap-3 sm:gap-5">
          {[
            { label: 'Problems', value: allProblems, fallback: 100, Icon: Book },
            { label: 'Topics', value: topics.length, fallback: 10, Icon: Tag },
            { label: 'Companies', value: companyCount, fallback: 50, Icon: Users },
          ].map(({ label, value, fallback, Icon }) => (
            <div key={label} className="reveal">
              <div className="lift flex h-full flex-col items-center rounded-2xl border border-line bg-surface px-2 py-5 text-center sm:flex-row sm:justify-center sm:gap-5 sm:py-7 sm:text-left">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent sm:h-12 sm:w-12 sm:rounded-2xl">
                  <Icon width={20} height={20} />
                </span>
                <div className="mt-2 sm:mt-0">
                  <dd className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                    <CountUp value={value || fallback} suffix={value ? '' : '+'} />
                  </dd>
                  <dt className="text-xs text-muted sm:text-sm">{label}</dt>
                </div>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Tracks ---------- */}
      <section className="mx-auto w-full max-w-[96rem] px-4 pt-16 sm:pt-24" aria-labelledby="tracks">
        <SectionHeader
          id="tracks"
          title="Pick your track"
          body="Technical depth, SQL fluency and the people round. Practice each one the way it is actually asked."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {[
            { href: '/problems', title: 'AI and ML engineering', body: 'RAG, LLMs, deep learning, Python for AI and production systems.', count: categoryCounts.ai, Icon: Book },
            { href: '/problems/sql', title: 'SQL', body: 'Joins, window functions, subqueries and performance, with real company questions.', count: categoryCounts.sql, Icon: Database },
            { href: '/problems/hr', title: 'HR and behavioural', body: 'Tell me about yourself, conflict, leadership and the rest of the people round.', count: categoryCounts.hr, Icon: Users },
          ].map(({ href, title, body, count, Icon }) => (
            <div key={href} className="reveal">
              <Link
                href={href}
                className="lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-7"
              >
                {/* Solid accent bar that draws across the top on hover */}
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon width={22} height={22} />
                </span>
                <h3 className="mt-5 text-xl font-extrabold tracking-tight">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{body}</p>
                <div className="mt-6 flex items-end justify-between">
                  <p className="text-3xl font-extrabold tracking-tight">
                    <CountUp value={count} />
                    <span className="ml-1.5 text-sm font-medium text-muted">{count === 1 ? 'question' : 'questions'}</span>
                  </p>
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-ink">
                    <ChevronRight width={18} height={18} />
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto w-full max-w-[96rem] px-4 py-16 sm:py-24" aria-labelledby="features">
        <SectionHeader
          id="features"
          title="Everything you need to sound ready"
          body="Practice the way interviews actually happen: you talk, someone listens, and you find out what you missed."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {/* Speak */}
          <div className="reveal">
            <div className="lift h-full overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
              <IconChip>
                <Mic width={22} height={22} />
              </IconChip>
              <h3 className="mt-5 text-xl font-bold tracking-tight">Say it like you would in the room</h3>
              <p className="mt-2 leading-relaxed text-muted">
                Dictate with the microphone or type. Explaining a long scenario out loud is closer to a real interview.
              </p>
              <div className="mt-6 flex h-16 items-center gap-[3px] rounded-2xl bg-surface-2 px-4" aria-hidden="true">
                {WAVE.map((d, i) => (
                  <span key={i} className="wave-bar block h-9 w-[3px] flex-1 rounded-full bg-accent" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="reveal">
            <div className="lift h-full overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
              <IconChip>
                <Check width={22} height={22} />
              </IconChip>
              <h3 className="mt-5 text-xl font-bold tracking-tight">A rubric score, not a vague “good job”</h3>
              <p className="mt-2 leading-relaxed text-muted">
                Coverage, accuracy, reasoning and clarity are each scored, with clear tips on what to fix next.
              </p>
              <ul className="mt-6 space-y-3 rounded-2xl bg-surface-2 p-4" aria-hidden="true">
                {RUBRIC.map(([label, value, max]) => (
                  <li key={label}>
                    <div className="flex justify-between gap-3 text-xs font-medium">
                      <span>{label}</span>
                      <span className="tabular-nums text-muted">
                        {value}/{max}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                      <div className="grow-x h-full rounded-full bg-accent" style={{ width: `${(value / max) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Expert + community */}
          <div className="reveal">
            <div className="lift h-full overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
              <IconChip>
                <Users width={22} height={22} />
              </IconChip>
              <h3 className="mt-5 text-xl font-bold tracking-tight">Compare with the experts</h3>
              <p className="mt-2 leading-relaxed text-muted">
               Submitting your answer unlocks the expert solution, so you learn from the gap.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3" aria-hidden="true">
                <div className="rounded-2xl bg-surface-2 p-3">
                  <p className="text-xs font-semibold text-muted">Your answer</p>
                  <div className="mt-3 space-y-2">
                    <div className="h-1.5 w-full rounded-full bg-line" />
                    <div className="h-1.5 w-4/5 rounded-full bg-line" />
                    <div className="h-1.5 w-3/5 rounded-full bg-line" />
                  </div>
                </div>
                <div className="rounded-2xl border border-accent/30 bg-accent-soft p-3">
                  <p className="text-xs font-semibold text-accent">Expert solution</p>
                  <div className="mt-3 space-y-2">
                    <div className="h-1.5 w-full rounded-full bg-accent/40" />
                    <div className="h-1.5 w-full rounded-full bg-accent/40" />
                    <div className="h-1.5 w-4/5 rounded-full bg-accent/40" />
                    <div className="h-1.5 w-2/3 rounded-full bg-accent/40" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Follow-ups */}
          <div className="reveal">
            <div className="lift h-full overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
              <IconChip>
                <Chat width={22} height={22} />
              </IconChip>
              <h3 className="mt-5 text-xl font-bold tracking-tight">Be ready for the follow-ups</h3>
              <p className="mt-2 leading-relaxed text-muted">
                Good answers still get probed. Practice the follow-up questions an interviewer might ask next.
              </p>
              <div className="mt-6 space-y-2.5 text-sm" aria-hidden="true">
                <p className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2.5">
                  How would you measure the hallucination rate automatically?
                </p>
                <p className="ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-accent-ink">
                  I’d build a small labelled set and track groundedness over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="border-y border-line bg-surface-2/50" aria-labelledby="how">
        <div className="mx-auto w-full max-w-[96rem] px-4 py-16 sm:py-24">
          <SectionHeader
            id="how"
            title="Three steps, ten minutes a day"
            body="A simple loop that mirrors a real interview: think, answer, then check yourself against the best version."
          />

          <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
            {STEPS.map((s) => (
              <li key={s.n} className="reveal">
                <div className="lift panel relative flex h-full gap-4 overflow-hidden !rounded-2xl p-5 md:block md:p-6">
                  <span aria-hidden="true" className="pointer-events-none absolute -right-1 -top-4 select-none text-8xl font-extrabold leading-none text-line/50">
                    {s.n}
                  </span>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-base font-bold text-accent-ink shadow-md shadow-accent/30">
                    {s.n}
                  </span>
                  <div className="min-w-0 md:mt-5">
                    <h3 className="text-lg font-bold">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
                    <p className="mt-4 inline-flex rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted">{s.time}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Topics ---------- */}
      {topics.length > 0 && (
        <section className="border-b border-line" aria-labelledby="topics">
          <div className="mx-auto w-full max-w-[96rem] px-4 py-16 sm:py-24">
            <SectionHeader
              id="topics"
              title="Browse by topic"
              body="From RAG and vector databases to evaluation and deployment, pick the area you want to sharpen next."
              action={
                <Link
                  href="/problems"
                  className="hidden items-center gap-1 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft md:inline-flex"
                >
                  View all problems <ChevronRight width={16} height={16} />
                </Link>
              }
            />

            <p className="mt-4 flex items-center gap-1 text-xs font-medium text-muted md:hidden">
              Swipe to explore <ChevronRight width={14} height={14} />
            </p>

            {/* Swipeable row on phones, grid from tablet up */}
            <ul className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 md:mx-0 md:mt-10 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
              {topics.map((t, i) => {
                const count = t._count.problems;
                return (
                  <li key={t.id} className="w-[82%] max-w-sm shrink-0 snap-start md:w-auto md:max-w-none">
                    <Link
                      href={`/problems?topic=${t.slug}`}
                      data-tone={i % 6}
                      className="topic-card group flex h-full min-h-[16rem] flex-col p-5 active:scale-[0.98] sm:p-6"
                    >
                      {/* Big faded icon in the corner */}
                      <Tag
                        aria-hidden="true"
                        width={150}
                        height={150}
                        strokeWidth={1.2}
                        className="pointer-events-none absolute -bottom-8 -right-8 rotate-12 text-[color:var(--t)] opacity-[0.08] transition-transform duration-500 group-hover:rotate-[20deg] group-hover:scale-110"
                      />

                      <div className="flex items-start justify-between gap-3">
                        <span className="topic-icon grid h-12 w-12 place-items-center rounded-2xl">
                          <Tag width={22} height={22} />
                        </span>
                        <span className="topic-pill rounded-full px-3 py-1 text-xs font-bold">
                          {count} {count === 1 ? 'problem' : 'problems'}
                        </span>
                      </div>

                      <h3 className="mt-5 text-xl font-extrabold leading-snug tracking-tight">{t.name}</h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{t.description}</p>

                      <div className="mt-5 flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-[color:var(--t)]">Explore topic</span>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--t)] text-white shadow-md transition-transform duration-300 group-hover:translate-x-1">
                          <ChevronRight width={18} height={18} />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}

              {/* Last card: everything in one list */}
              <li className="w-[82%] max-w-sm shrink-0 snap-start md:w-auto md:max-w-none">
                <Link
                  href="/problems"
                  className="group flex h-full min-h-[16rem] flex-col items-start justify-between rounded-3xl border-2 border-dashed border-accent/40 bg-accent-soft/60 p-5 transition-colors hover:border-accent active:scale-[0.98] sm:p-6"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-ink">
                    <ChevronRight width={22} height={22} />
                  </span>
                  <div>
                    <p className="text-4xl font-extrabold tracking-tight">
                      {totalProblems}
                      <span className="text-accent">+</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      problems across {topics.length} topics. Filter by difficulty or question type.
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 font-semibold text-accent">
                      View all problems
                      <ChevronRight width={16} height={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        </section>
      )}

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto w-full max-w-[96rem] px-4 py-16 sm:py-24" aria-labelledby="faq">
        <SectionHeader id="faq" title="Questions about AI interview practice" />
        <div className="mt-8 max-w-3xl space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-line bg-surface px-5 py-4 transition-colors open:border-accent/40">
              <summary className="cursor-pointer list-none font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {f.q}
                  <ChevronRight width={18} height={18} className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-90" />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="mx-auto w-full max-w-[96rem] px-4 pb-20 pt-2">
        <div className="relative overflow-hidden rounded-3xl bg-[#34d67b] px-6 py-14 text-[#04140a] sm:px-14 sm:py-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'linear-gradient(#04140a 1px, transparent 1px), linear-gradient(90deg, #04140a 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage: 'linear-gradient(to left, black, transparent 70%)',
              WebkitMaskImage: 'linear-gradient(to left, black, transparent 70%)',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute right-10 top-1/2 hidden -translate-y-1/2 lg:block xl:right-16"
          >
            <div className="float drop-shadow-[0_20px_32px_rgba(4,20,10,0.25)]">
              <Logo size="xl" tone="dark" />
            </div>
          </div>

          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Start with one question today.</h2>
            <p className="mt-3 max-w-lg text-[#04140a]/75 sm:text-lg">
              It takes about ten minutes, and your first answer unlocks the expert solution.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={primaryHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#04140a] px-7 font-semibold text-[#34d67b] transition-transform active:scale-[0.98]"
              >
                {primaryLabel}
                <ChevronRight width={18} height={18} />
              </Link>
              <Link
                href="/problems"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#04140a]/30 px-7 font-semibold transition-colors hover:bg-[#04140a]/10"
              >
                Browse problems
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2 text-xs font-semibold sm:text-sm">
              {[`${allProblems ? `${allProblems}+` : 'Hundreds of'} questions`, 'AI, SQL and HR tracks', 'Free to start'].map((t) => (
                <li key={t} className="rounded-full border border-[#04140a]/25 px-3 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Phones only: appears after the hero, hides again near the page end */}
      <StickyCta href={primaryHref} label={primaryLabel} />
    </>
  );
}