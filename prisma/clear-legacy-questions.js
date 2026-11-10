// One-time cleanup after moving to question documents.
// Deletes every question and topic that is NOT backed by a document (the old seeded ones), together with
// users' progress, bookmarks and answers for them. Tabs created in /docs are kept.
//
// Preview:  node --env-file=.env prisma/clear-legacy-questions.js
// Delete:   node --env-file=.env prisma/clear-legacy-questions.js --yes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const legacyTopics = await prisma.topic.findMany({ where: { content: null }, select: { id: true, slug: true } });
  const ids = legacyTopics.map((t) => t.id);
  const problems = await prisma.problem.count({ where: { topicId: { in: ids } } });
  console.log(`${legacyTopics.length} old topics with ${problems} questions are not backed by a document.`);

  if (!process.argv.includes('--yes')) {
    console.log('Nothing deleted. Run again with --yes to delete them.');
    return;
  }
  await prisma.$transaction([
    prisma.problem.deleteMany({ where: { topicId: { in: ids } } }),
    prisma.topic.deleteMany({ where: { id: { in: ids } } }),
  ]);
  console.log('Deleted.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());