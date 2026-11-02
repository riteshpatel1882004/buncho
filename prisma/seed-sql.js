// SQL interview questions for AI / ML / data engineering roles.
// Each question has three markdown files in prisma/content/sql/:
//   <slug>.question.md      -> the left column of the question page (problem statement, tables, expected output)
//   <slug>.solution.md      -> the right column (Answers & Optimization). See lib/sql-answers.js for the format:
//                              optional short "quick answer" bullets, then "### Basic | ..." and "### Optimized | ..." blocks.
//                              Pure theory questions have no "###" blocks and are shown as plain markdown.
//   <slug>.alternatives.md  -> an extra "Optimization" section under the answers (optional)
// To add a question: add an entry to `problems` below, add the .md files, then run `node --env-file=.env prisma/seed.js`.
// `subcategory` is the topic chip on /problems/sql. Questions with the same subcategory are grouped under one chip, and the
// chips follow the order of the first question of each subcategory in the list below.
// `type`: CONCEPTUAL = "explain" questions, PRACTICAL = "write a query" questions (the Type filter on /problems/sql).
// `proOnly: true` makes the question open only for Buncho Pro members (free users see a teaser). Remove it to make the question free again.
// The topic slug 'sql' is also listed in SQL_TOPIC_SLUGS (lib/categories.js), which is what puts these questions
// under /problems/sql. SQL questions have no AI feedback.
// "Asked %" and "Companies" for each question come from prisma/insights.csv (node prisma/seed-insights.js).

const ROLES = { ai: 'AI Engineer', ml: 'ML Engineer', genai: 'GenAI Engineer', data: 'Data Engineer' };
const ALL_ROLES = [ROLES.ai, ROLES.ml, ROLES.genai, ROLES.data];

const topics = [
  {
    slug: 'sql',
    name: 'SQL Interview Questions',
    description: 'SQL questions for AI, ML and data roles, each with a basic and an optimized answer.',
  },
];

const problems = [
  {
    slug: 'sql-join-types',
    title: 'What are the different types of SQL JOINs, and what does each one return?',
    topic: 'sql', subcategory: 'Joins and set operations', difficulty: 'EASY', type: 'CONCEPTUAL', estimatedMinutes: 5,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'Which rows survive when one side has no match?',
      'Count the rows for each join using the sample data.',
    ],
    related: ['sql-inner-join-matching-rows', 'sql-union-vs-union-all'],
  },
  {
    slug: 'sql-inner-join-matching-rows',
    title: 'Write a query that joins two tables and returns only the rows with matching keys',
    topic: 'sql', subcategory: 'Joins and set operations', difficulty: 'EASY', type: 'PRACTICAL', estimatedMinutes: 4,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'Which join drops customers with no orders?',
      'Do you need every column, or only a few?',
    ],
    related: ['sql-join-types'],
  },
  {
    slug: 'sql-union-vs-union-all',
    title: 'How do you merge two result sets in SQL without duplicates?',
    topic: 'sql', subcategory: 'Joins and set operations', difficulty: 'EASY', type: 'PRACTICAL', estimatedMinutes: 4,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'What does the database do to remove duplicates?',
      'When can duplicates never happen?',
    ],
    related: ['sql-join-types'],
  },
  {
    slug: 'sql-where-vs-having',
    title: 'What is the difference between WHERE and HAVING?',
    topic: 'sql', subcategory: 'Filtering and aggregation', difficulty: 'EASY', type: 'CONCEPTUAL', estimatedMinutes: 5,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'Which clause runs before GROUP BY?',
      'Can a condition on a raw column go in HAVING? Should it?',
    ],
    related: ['sql-group-by', 'sql-aggregate-functions'],
  },
  {
    slug: 'sql-distinct-values',
    title: 'How do you select distinct values from a column?',
    topic: 'sql', subcategory: 'Filtering and aggregation', difficulty: 'EASY', type: 'PRACTICAL', estimatedMinutes: 3,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'What does COUNT(DISTINCT col) do with NULLs?',
      'Is ORDER BY needed for the count?',
    ],
    related: ['sql-group-by'],
  },
  {
    slug: 'sql-group-by',
    title: 'What does GROUP BY do in a SQL query?',
    topic: 'sql', subcategory: 'Filtering and aggregation', difficulty: 'EASY', type: 'CONCEPTUAL', estimatedMinutes: 6,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'Which columns may appear in SELECT?',
      'What would give you subtotals in one query?',
    ],
    related: ['sql-where-vs-having', 'sql-aggregate-functions'],
  },
  {
    slug: 'sql-aggregate-functions',
    title: 'How do you aggregate data in SQL with COUNT, SUM, AVG, MAX and MIN?',
    topic: 'sql', subcategory: 'Filtering and aggregation', difficulty: 'EASY', type: 'PRACTICAL', estimatedMinutes: 5,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'How do COUNT(*) and COUNT(col) treat NULLs?',
      'Can all five metrics come from one scan?',
    ],
    related: ['sql-group-by', 'sql-where-vs-having'],
  },
  {
    slug: 'sql-subquery-use-cases',
    title: 'What is a subquery, and what are its typical use cases?',
    topic: 'sql', subcategory: 'Subqueries', difficulty: 'MEDIUM', type: 'CONCEPTUAL', estimatedMinutes: 8,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'Does the inner query need a value from the outer row?',
      'What goes wrong with NOT IN when the subquery returns a NULL?',
    ],
    related: ['sql-optimize-slow-query', 'sql-inner-join-matching-rows'],
  },
  {
    slug: 'sql-indexes-and-ml',
    title: 'What are database indexes and how do they relate to machine learning work?',
    topic: 'sql', subcategory: 'Performance and indexing', difficulty: 'MEDIUM', type: 'CONCEPTUAL', estimatedMinutes: 5,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'What does an index cost on writes?',
      'Which index would you use for embedding similarity search?',
    ],
    related: ['sql-optimize-slow-query'],
  },
  {
    slug: 'sql-optimize-slow-query',
    title: 'How would you optimize a SQL query that runs slowly?',
    topic: 'sql', subcategory: 'Performance and indexing', difficulty: 'MEDIUM', type: 'CONCEPTUAL', estimatedMinutes: 6,
    roles: ALL_ROLES, allowDirectReveal: true, proOnly: true,
    hints: [
      'What do you check before changing anything?',
      'Why does a function on an indexed column hurt?',
    ],
    related: ['sql-indexes-and-ml', 'sql-subquery-use-cases'],
  },
  {
    slug: 'sql-handle-missing-values',
    title: 'How do you handle missing values in a SQL dataset?',
    topic: 'sql', subcategory: 'Data cleaning and reshaping', difficulty: 'MEDIUM', type: 'PRACTICAL', estimatedMinutes: 8,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'Why does age = NULL never match a row?',
      'What extra column helps a model after you fill a gap?',
    ],
    related: ['sql-window-functions-for-ml'],
  },
  {
    slug: 'sql-pivot-rows-to-columns',
    title: 'Write a SQL query to pivot a table, turning rows into columns',
    topic: 'sql', subcategory: 'Data cleaning and reshaping', difficulty: 'MEDIUM', type: 'PRACTICAL', estimatedMinutes: 8,
    roles: ALL_ROLES, allowDirectReveal: true, proOnly: true,
    hints: [
      'Which aggregate combines with CASE to pick one product?',
      'What if the list of products is not known in advance?',
    ],
    related: ['sql-handle-missing-values'],
  },
  {
    slug: 'sql-second-highest-salary',
    title: 'Find the second highest salary in each department',
    topic: 'sql', subcategory: 'Window functions and ranking', difficulty: 'MEDIUM', type: 'PRACTICAL', estimatedMinutes: 10,
    roles: ALL_ROLES, allowDirectReveal: true, proOnly: true,
    hints: [
      'What should happen when two people share the highest salary?',
      'Think about ranking rows inside each department instead of across the whole table.',
    ],
    related: [],
  },
  {
    slug: 'sql-window-functions-for-ml',
    title: 'What are SQL window functions, and how do you use them for ML feature engineering?',
    topic: 'sql', subcategory: 'Window functions and ranking', difficulty: 'MEDIUM', type: 'PRACTICAL', estimatedMinutes: 10,
    roles: ALL_ROLES, allowDirectReveal: true, proOnly: true,
    hints: [
      'How is a window function different from GROUP BY?',
      'Which frame keeps the current row out of a rolling feature?',
    ],
    related: ['sql-time-features-for-ml', 'sql-second-highest-salary'],
  },
  {
    slug: 'sql-normalization-for-ml',
    title: 'Why does normalization matter in SQL, and how does it affect ML models?',
    topic: 'sql', subcategory: 'SQL for machine learning', difficulty: 'MEDIUM', type: 'CONCEPTUAL', estimatedMinutes: 5,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'Normalization means two different things here. Which two?',
      'On which data should the scaler statistics be computed?',
    ],
    related: ['sql-window-functions-for-ml'],
  },
  {
    slug: 'sql-time-features-for-ml',
    title: 'How do you extract time-based features from a datetime field for an ML model?',
    topic: 'sql', subcategory: 'SQL for machine learning', difficulty: 'MEDIUM', type: 'PRACTICAL', estimatedMinutes: 10,
    roles: ALL_ROLES, allowDirectReveal: true,
    hints: [
      'Why is a raw hour number a poor feature for 23:00 versus 00:00?',
      'Which window function gives the previous event time?',
    ],
    related: ['sql-window-functions-for-ml', 'sql-normalization-for-ml'],
  },
];

module.exports = { topics, problems };