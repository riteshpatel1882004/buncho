const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient, Prisma } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const base = require('./seed-data');
const hr = require('./seed-hr'); // HR interview questions, content in prisma/content/hr/
const sql = require('./seed-sql'); // SQL interview questions, content in prisma/content/sql/

// HR and SQL topics and questions are appended after the AI ones, so existing positions do not change.
const topics = [...base.topics, ...hr.topics, ...sql.topics];
const problems = [...base.problems, ...hr.problems, ...sql.problems];

// Prisma 7 needs a driver adapter (same setup as src/lib/prisma.js)
neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

// Usage:
//   node --env-file=.env prisma/seed.js                  -> incremental: only new or changed problems are written
//   node --env-file=.env prisma/seed.js --force          -> rewrite every problem
//   node --env-file=.env prisma/seed.js --only=slug-a,slug-b  -> only these slugs (still skips if unchanged, unless --force)
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const onlyArg = args.find((a) => a.startsWith('--only='));
let ONLY = onlyArg ? new Set(onlyArg.slice(7).split(',').map((s) => s.trim()).filter(Boolean)) : null;

// Batches (for slow or unstable connections):
//   node --env-file=.env prisma/seed.js --batch=1            -> problems 1-150 (in seed order)
//   node --env-file=.env prisma/seed.js --batch=2 --size=100 -> problems 101-200, 100 per batch
// Only that batch is read from and written to the database. Run batch 1, 2, 3 ... until it says "last batch".
const batchArg = args.find((a) => a.startsWith('--batch='));
const sizeArg = args.find((a) => a.startsWith('--size='));
const BATCH = batchArg ? Number(batchArg.slice(8)) : null;
const BATCH_SIZE = sizeArg ? Number(sizeArg.slice(7)) : 150;
if (BATCH !== null) {
  if (!Number.isInteger(BATCH) || BATCH < 1 || !Number.isInteger(BATCH_SIZE) || BATCH_SIZE < 1) {
    console.error('Use --batch=<1,2,3...> and optionally --size=<problems per batch>.');
    process.exit(1);
  }
  const slice = problems.slice((BATCH - 1) * BATCH_SIZE, BATCH * BATCH_SIZE).map((p) => p.slug);
  const totalBatches = Math.ceil(problems.length / BATCH_SIZE);
  if (!slice.length) {
    console.log(`Nothing in batch ${BATCH}. There are only ${totalBatches} batches, so all are done.`);
    process.exit(0);
  }
  console.log(`Batch ${BATCH} of ${totalBatches}: problems ${(BATCH - 1) * BATCH_SIZE + 1}-${(BATCH - 1) * BATCH_SIZE + slice.length} of ${problems.length}${BATCH >= totalBatches ? ' (last batch)' : ''}`);
  ONLY = ONLY ? new Set(slice.filter((s) => ONLY.has(s))) : new Set(slice);
}

// Neon can drop a connection (cold start, idle timeout, flaky network). Retry those a few times.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function retry(fn, tries = 5) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = String(e?.message || e);
      const transient = /Connection terminated|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket|WebSocket|timeout|ECONNREFUSED/i.test(msg);
      if (!transient || i >= tries) throw e;
      console.warn(`Connection problem (${msg.split('\n')[0]}). Retry ${i}/${tries - 1}...`);
      await sleep(1500 * i);
    }
  }
}

// Files live in prisma/content/<topic-slug>/<slug>.<kind>.md
// If the question has a subcategory, prisma/content/<topic-slug>/<subcategory-folder>/<slug>.<kind>.md is checked first
// (e.g. content/sql/joins-and-set-operations/). The folder name is the subcategory in lowercase with dashes.
// For backward compatibility, a flat prisma/content/<slug>.<kind>.md is used if the topic folder copy does not exist.
const subFolder = (p) => (p.subcategory ? p.subcategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null);
const file = (p, kind) => {
  const sub = subFolder(p);
  if (sub) {
    const inSub = path.join(__dirname, 'content', p.topic, sub, `${p.slug}.${kind}.md`);
    if (fs.existsSync(inSub)) return inSub;
  }
  const inTopic = path.join(__dirname, 'content', p.topic, `${p.slug}.${kind}.md`);
  if (fs.existsSync(inTopic)) return inTopic;
  const flat = path.join(__dirname, 'content', `${p.slug}.${kind}.md`);
  return fs.existsSync(flat) ? flat : inTopic;
};
const read = (p, kind) => fs.readFileSync(file(p, kind), 'utf8').trim();
const readOptional = (p, kind) => (fs.existsSync(file(p, kind)) ? read(p, kind) : null);

// Order-insensitive deep comparison (Postgres jsonb does not keep object key order).
const norm = (v) => (v === Prisma.DbNull || v === undefined ? null : v);
const stable = (v) => {
  v = norm(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
};
const same = (a, b) => stable(a) === stable(b);

async function main() {
  // Topics: one read, write only what changed.
  const dbTopics = new Map((await retry(() => prisma.topic.findMany())).map((t) => [t.slug, t]));
  const topicIds = {};
  for (const [order, t] of topics.entries()) {
    const cur = dbTopics.get(t.slug);
    if (cur && cur.name === t.name && cur.description === t.description && cur.order === order) {
      topicIds[t.slug] = cur.id;
      continue;
    }
    const row = await retry(() => prisma.topic.upsert({
      where: { slug: t.slug },
      update: { name: t.name, description: t.description, order },
      create: { ...t, order },
    }));
    topicIds[t.slug] = row.id;
  }

  // Load everything that exists once (a single query) instead of one upsert per problem.
  // With --only / --batch only those slugs are read, so the query stays small.
  const dbRows = await retry(() => prisma.problem.findMany({
    where: ONLY ? { slug: { in: [...ONLY] } } : undefined,
    include: { expertSolution: true, related: { select: { slug: true } } },
  }));
  const dbBySlug = new Map(dbRows.map((r) => [r.slug, r]));

  const created = [];
  const updated = [];
  const unchanged = [];
  const skipped = [];

  for (const [position, p] of problems.entries()) {
    if (ONLY && !ONLY.has(p.slug)) continue;

    const missing = ['question', 'solution'].filter((kind) => !fs.existsSync(file(p, kind)));
    if (missing.length) {
      skipped.push(`${p.slug}: missing ${missing.map((k) => `content/${p.topic}/${p.slug}.${k}.md`).join(', ')}`);
      continue;
    }

    // proOnly is always written (true or false), so removing the flag in seed-data.js makes the question free again.
    const { topic, related, challenge, allowDirectReveal = false, proOnly = false, ...rest } = p;
    const data = {
      ...rest,
      allowDirectReveal,
      proOnly,
      description: read(p, 'question'),
      topicId: topicIds[topic],
      position,
      // Phase 5: production challenge fields
      isChallenge: Boolean(challenge),
      steps: challenge?.steps ?? Prisma.DbNull,
      rubric: challenge?.rubric ?? Prisma.DbNull,
      scenarioData: challenge?.assets ?? Prisma.DbNull,
    };
    const content = read(p, 'solution');
    const alternatives = readOptional(p, 'alternatives');

    const cur = dbBySlug.get(p.slug);
    if (!FORCE && cur) {
      const problemSame = Object.keys(data).every((k) => same(data[k], cur[k]));
      const solutionSame =
        cur.expertSolution && cur.expertSolution.content === content && (cur.expertSolution.alternatives ?? null) === alternatives;
      if (problemSame && solutionSame) {
        unchanged.push(p.slug);
        continue;
      }
    }

    const problem = await retry(() => prisma.problem.upsert({ where: { slug: p.slug }, update: data, create: data }));
    await retry(() => prisma.expertSolution.upsert({
      where: { problemId: problem.id },
      update: { content, alternatives },
      create: { problemId: problem.id, content, alternatives },
    }));
    (cur ? updated : created).push(p.slug);
  }

  // Related links. Links to problems that don't exist yet are ignored.
  // Runs for every problem, but only writes when the desired links differ from what is stored,
  // so adding a new question also fixes older questions that already pointed at it.
  const existing = new Set((await retry(() => prisma.problem.findMany({ select: { slug: true } }))).map((x) => x.slug));
  const fresh = await retry(() => prisma.problem.findMany({
    where: ONLY ? { slug: { in: [...ONLY] } } : undefined,
    select: { slug: true, related: { select: { slug: true } } },
  }));
  const currentRelated = new Map(fresh.map((x) => [x.slug, x.related.map((r) => r.slug).sort().join('|')]));
  let linksChanged = 0;
  for (const p of problems) {
    if (!existing.has(p.slug)) continue;
    if (ONLY && !ONLY.has(p.slug)) continue;
    const wanted = [...new Set(p.related.filter((slug) => existing.has(slug)))];
    if (wanted.slice().sort().join('|') === currentRelated.get(p.slug)) continue;
    await retry(() => prisma.problem.update({
      where: { slug: p.slug },
      data: { related: { set: wanted.map((slug) => ({ slug })) } },
    }));
    linksChanged++;
  }

  console.log(`Pro-only questions in seed-data: ${problems.filter((x) => x.proOnly).length}`);
  console.log(
    `Problems in seed-data: ${problems.length} | new: ${created.length} | updated: ${updated.length} | unchanged (skipped): ${unchanged.length} | topics: ${topics.length} | related links updated: ${linksChanged}`,
  );
  if (created.length) console.log('New:', created.join(', '));
  if (updated.length) console.log('Updated:', updated.join(', '));
  if (skipped.length) {
    console.warn('\nSkipped (add these files to prisma/content/<topic>/, then run the seed again):');
    skipped.forEach((s) => console.warn(`  - ${s}`));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());