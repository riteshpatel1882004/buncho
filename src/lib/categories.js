// The question library has three categories:
//   ai  -> /problems      (every topic except the ones listed below; /problems/ai shows the same list)
//   hr  -> /problems/hr   (behavioural / HR questions, content in prisma/content/hr/)
//   sql -> /problems/sql  (SQL questions: description + all possible answers and optimisation, no AI feedback,
//                          content in prisma/content/sql/)
// A topic belongs to HR when its slug is in HR_TOPIC_SLUGS, and to SQL when it is in SQL_TOPIC_SLUGS.
// To add another HR-style or SQL-style topic, add its slug to the matching list.
export const HR_TOPIC_SLUGS = ['hr'];
export const SQL_TOPIC_SLUGS = ['sql'];
// Everything that is not an AI/ML topic (used to keep the AI list, job plans and mocks free of HR and SQL questions)
export const NON_AI_TOPIC_SLUGS = [...HR_TOPIC_SLUGS, ...SQL_TOPIC_SLUGS];

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
    description: 'Behavioural and HR questions, each with an expert answer you can learn from.',
  },
  sql: {
    key: 'sql',
    label: 'SQL ',
    short: 'SQL',
    path: '/problems/sql',
    title: 'SQL interview questions for AI engineers',
    description: 'SQL questions with every possible answer and how to optimise each one.',
  },
};

export const isHrTopic = (topicSlug) => HR_TOPIC_SLUGS.includes(topicSlug);
export const isSqlTopic = (topicSlug) => SQL_TOPIC_SLUGS.includes(topicSlug);
export const categoryOf = (topicSlug) => (isHrTopic(topicSlug) ? 'hr' : isSqlTopic(topicSlug) ? 'sql' : 'ai');

/** Prisma filter for `topic` that keeps only one category. 'all' (or anything else) means no filter. */
export function topicCategoryWhere(category) {
  if (category === 'hr') return { slug: { in: HR_TOPIC_SLUGS } };
  if (category === 'sql') return { slug: { in: SQL_TOPIC_SLUGS } };
  if (category === 'ai') return { slug: { notIn: NON_AI_TOPIC_SLUGS } };
  return undefined;
}

/** Page URL for one question. HR questions open under /problems/hr/<slug>, SQL ones under /problems/sql/<slug>, AI ones stay at /problems/<slug>. */
export const problemHref = (slug, topicSlug) => `${CATEGORIES[categoryOf(topicSlug)].path}/${slug}`;