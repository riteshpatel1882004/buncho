// Answers written in the code editor are stored as Markdown: the code goes inside one fenced block
// (```python ... ```), so it is readable by the AI evaluator and renders with syntax colours everywhere else.

export const CODE_LANGUAGES = [{ id: 'python', label: 'Python', comment: '# ' }];

export const DEFAULT_LANGUAGE = 'python';
export const LANGUAGE_KEY = 'buncho-answer-language';

const BY_ID = Object.fromEntries(CODE_LANGUAGES.map((l) => [l.id, l]));
const ALIASES = { py: 'python', python: 'python', js: 'javascript', javascript: 'javascript', ts: 'javascript', sql: 'sql' };

// Languages the editor can be fixed to for one kind of question (SQL questions) without showing them in the language picker
const FIXED_COMMENTS = { sql: '-- ' };

export const isLanguage = (id) => Boolean(BY_ID[id]);
export const commentPrefix = (id) => BY_ID[id]?.comment ?? FIXED_COMMENTS[id] ?? '';

/** Code editor text -> stored answer. Markdown mode is stored as it is. */
export function wrapCode(text, lang) {
  const code = String(text ?? '').replace(/\s+$/, '');
  if (!code.trim()) return '';
  if (lang === 'markdown') return code;
  const longestRun = Math.max(2, ...(code.match(/`+/g) ?? []).map((m) => m.length));
  const fence = '`'.repeat(longestRun + 1);
  return `${fence}${lang}\n${code}\n${fence}`;
}

/** Stored answer -> { lang, code } when it is one fenced code block, otherwise null. */
export function unwrapCode(content) {
  const text = String(content ?? '').trim();
  const m = text.match(/^(`{3,})([\w+-]*)[ \t]*\n([\s\S]*?)\n\1[ \t]*$/);
  if (!m) return null;
  const lang = ALIASES[m[2].toLowerCase()];
  return lang ? { lang, code: m[3] } : null;
}