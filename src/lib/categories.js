// The question library has two categories:
//   ai -> /problems/ai   (every topic except the ones listed below)
//   hr -> /problems/hr   (behavioural / HR questions, content in prisma/content/hr/)
// A topic belongs to HR when its slug is in HR_TOPIC_SLUGS. To add another HR-style topic, add its slug here.
export const HR_TOPIC_SLUGS = ['hr'];

export const CATEGORIES = {
  ai: {
    key: 'ai',
    label: 'AI problems',
    short: 'AI',
    path: '/problems/ai',
    title: 'AI, ML and GenAI interview questions',
    description: 'Technical questions on LLMs, RAG, deep learning, MLOps and system design.',
  },
  hr: {
    key: 'hr',
    label: 'HR questions',
    short: 'HR',
    path: '/problems/hr',
    title: 'HR interview questions for AI engineers',
    description: 'Behavioural and HR questions, each with an expert answer you can learn from.',
  },
};

export const isHrTopic = (topicSlug) => HR_TOPIC_SLUGS.includes(topicSlug);
export const categoryOf = (topicSlug) => (isHrTopic(topicSlug) ? 'hr' : 'ai');

/** Prisma filter for `topic` that keeps only one category. 'all' (or anything else) means no filter. */
export function topicCategoryWhere(category) {
  if (category === 'hr') return { slug: { in: HR_TOPIC_SLUGS } };
  if (category === 'ai') return { slug: { notIn: HR_TOPIC_SLUGS } };
  return undefined;
}

/** Page URL for one question. HR questions open under /problems/hr/<slug>, AI ones stay at /problems/<slug>. */
export const problemHref = (slug, topicSlug) => (isHrTopic(topicSlug) ? `/problems/hr/${slug}` : `/problems/${slug}`);