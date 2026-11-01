// SQL interview questions for AI / ML / data engineering roles.
// Each question has three markdown files in prisma/content/sql/:
//   <slug>.question.md      -> the Description tab (problem statement, tables, expected output)
//   <slug>.solution.md      -> the "All possible answers" section of the Answers & Optimization tab
//   <slug>.alternatives.md  -> the "Optimization" section of the Answers & Optimization tab (optional)
// To add a question: add an entry to `problems` below, add the .md files, then run `node --env-file=.env prisma/seed.js`.
// The topic slug 'sql' is also listed in SQL_TOPIC_SLUGS (lib/categories.js), which is what puts these questions
// under /problems/sql. SQL questions have no AI feedback.

const ROLES = { ai: 'AI Engineer', ml: 'ML Engineer', genai: 'GenAI Engineer', data: 'Data Engineer' };
const ALL_ROLES = [ROLES.ai, ROLES.ml, ROLES.genai, ROLES.data];

const topics = [
  {
    slug: 'sql',
    name: 'SQL Interview Questions',
    description: 'SQL questions for AI, ML and data roles, each with every possible answer and how to optimise it.',
  },
];

const problems = [
  {
    slug: 'sql-second-highest-salary',
    title: 'Find the second highest salary in each department',
    topic: 'sql', subcategory: 'Window functions and ranking', difficulty: 'MEDIUM', type: 'PRACTICAL', estimatedMinutes: 10,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'What should happen when two people share the highest salary?',
      'Think about ranking rows inside each department instead of across the whole table.',
    ],
    related: [],
  },
];

module.exports = { topics, problems };