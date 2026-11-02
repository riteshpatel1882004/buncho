// Loads interview insights into the Problem table.
//   node --env-file=.env prisma/seed-insights.js         reads prisma/insights.csv (not part of `prisma db seed`)
//   node --env-file=.env prisma/seed-insights.js --dry   prints what would change, writes nothing
//   node --env-file=.env prisma/seed-insights.js --demo  PLACEHOLDER values for local UI testing. Refuses to run in production.
//
// insights.csv columns (header required):   slug,frequency,companies
//   bias-variance-tradeoff,62,Google|Amazon|Flipkart
// frequency: whole number 0-100 (empty = no data). companies: names separated by | (empty = none).
// Only use values from real candidate reports.

const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Prisma 7 needs a driver adapter (same setup as prisma/seed.js)
neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const DEMO = args.includes('--demo');

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const [head, ...rows] = lines;
  if (!head || head.toLowerCase().replace(/\s/g, '') !== 'slug,frequency,companies') {
    throw new Error('insights.csv must start with the header: slug,frequency,companies');
  }
  return rows.map((line, i) => {
    const [slug, freq = '', companies = ''] = line.split(',').map((c) => c.trim());
    if (!slug) throw new Error(`Row ${i + 2}: missing slug`);
    let frequency = null;
    if (freq !== '') {
      frequency = Number(freq);
      if (!Number.isInteger(frequency) || frequency < 0 || frequency > 100) throw new Error(`Row ${i + 2} (${slug}): frequency must be a whole number from 0 to 100`);
    }
    const list = [...new Set(companies.split('|').map((c) => c.trim()).filter(Boolean))];
    return { slug, frequency, companies: list };
  });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set. Run with: node --env-file=.env prisma/seed-insights.js');

  let rows;
  if (DEMO) {
    if (process.env.NODE_ENV === 'production') throw new Error('--demo is for local development only.');
    const sample = ['Company A', 'Company B', 'Company C', 'Company D'];
    const all = await prisma.problem.findMany({ select: { slug: true }, orderBy: { slug: 'asc' } });
    rows = all.map((p, i) => ({ slug: p.slug, frequency: ((i * 17) % 90) + 5, companies: sample.slice(0, (i % 4) + 1) }));
    console.warn('DEMO DATA: placeholder values only. Do not use in production.');
  } else {
    rows = parseCsv(fs.readFileSync(path.join(__dirname, 'insights.csv'), 'utf8'));
  }

  const existing = new Set((await prisma.problem.findMany({ select: { slug: true } })).map((p) => p.slug));
  let updated = 0;
  const unknown = [];
  for (const r of rows) {
    if (!existing.has(r.slug)) {
      unknown.push(r.slug);
      continue;
    }
    if (!DRY) await prisma.problem.update({ where: { slug: r.slug }, data: { askedFrequency: r.frequency, askedByCompanies: r.companies } });
    updated += 1;
  }
  console.log(`${DRY ? 'Would update' : 'Updated'} ${updated} problems.`);
  if (unknown.length) console.warn(`Skipped ${unknown.length} unknown slugs: ${unknown.join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());