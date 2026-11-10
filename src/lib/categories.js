// The question library has three categories:
//   ai  -> /problems      (/problems/ai shows the same list)
//   hr  -> /problems/hr
//   sql -> /problems/sql
// All three work the same way: the admin writes one document per category at /docs/<category>, each tab of it is a
// topic, and every Heading 2 is a question. A topic belongs to HR when its slug is "hr" or starts with "hr-", to SQL
// when it is "sql" or starts with "sql-", and to AI otherwise (the doc code makes sure AI slugs never look like HR/SQL).
const hasPrefix = (slug, p) => slug === p || String(slug ?? '').startsWith(`${p}-`);

export const CATEGORIES = {
  ai: {
    key: 'ai',
    label: 'AI/ML ',
    short: 'AI',
    path: '/problems',
    title: 'AI, ML and GenAI interview questions',
    description: 'Technical questions on LLMs, RAG, deep learning, MLOps and system design.',
  },
  hr: {
    key: 'hr',
    label: 'HR ',
    short: 'HR',
    path: '/problems/hr',
    title: 'HR interview questions for AI engineers',
    description: 'Behavioural and HR questions to practise your own answers.',
  },
  sql: {
    key: 'sql',
    label: 'SQL ',
    short: 'SQL',
    path: '/problems/sql',
    title: 'SQL interview questions for AI engineers',
    description: 'SQL questions for AI, ML and data roles to practise on your own.',
  },
};

export const isHrTopic = (topicSlug) => hasPrefix(topicSlug, 'hr');
export const isSqlTopic = (topicSlug) => hasPrefix(topicSlug, 'sql');
export const categoryOf = (topicSlug) => (isHrTopic(topicSlug) ? 'hr' : isSqlTopic(topicSlug) ? 'sql' : 'ai');

/** Prisma filter for `topic` that keeps only one category. 'all' (or anything else) means no filter. */
export function topicCategoryWhere(category) {
  const is = (p) => ({ OR: [{ slug: p }, { slug: { startsWith: `${p}-` } }] });
  if (category === 'hr') return is('hr');
  if (category === 'sql') return is('sql');
  if (category === 'ai') return { NOT: [is('hr'), is('sql')] };
  return undefined;
}

/** The document tab for a topic, e.g. /docs/ai/python-basics */
export const docHref = (topicSlug) => `/docs/${categoryOf(topicSlug)}/${topicSlug}`;

/** Page URL for one question: its place in the document. A question's slug is its heading anchor. */
export const problemHref = (slug, topicSlug) => `${docHref(topicSlug)}#${slug}`;