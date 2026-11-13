// Pure helpers for the document JSON. No imports, so they work anywhere (server actions, pages, scripts).

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

/** Short id for a heading anchor. Starts with a letter so it is a valid HTML id. */
export function newId() {
  let s = 'q';
  for (let i = 0; i < 9; i += 1) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

export function plainText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map(plainText).join('');
}

/** Gives every heading a unique id (keeps existing ones). Returns a new document, does not mutate. */
export function ensureHeadingIds(doc) {
  const seen = new Set();
  const walk = (node) => {
    if (!node || typeof node !== 'object') return node;
    let next = node;
    if (node.type === 'heading') {
      let id = node.attrs?.id;
      if (!id || seen.has(id)) id = newId();
      seen.add(id);
      next = { ...node, attrs: { ...node.attrs, id } };
    }
    if (next.content) next = { ...next, content: next.content.map(walk) };
    return next;
  };
  return walk(doc);
}

/** "Google, Amazon,  Google" -> ['Google', 'Amazon']. At most 10 names of up to 40 characters. */
export function parseCompanies(value) {
  const seen = new Set();
  const out = [];
  for (const part of String(value ?? '').split(/[,\n;]/)) {
    const name = part.trim().replace(/\s+/g, ' ').slice(0, 40);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length === 10) break;
  }
  return out;
}

/** "How often is this asked" as a whole percent from 0 to 100, or null when it is not set. */
export function cleanAsked(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
}

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

/** 'EASY' | 'MEDIUM' | 'HARD', or null when the admin has not set a level. */
export function cleanDifficulty(value) {
  const v = String(value ?? '').toUpperCase();
  return DIFFICULTIES.includes(v) ? v : null;
}

/** The questions in a document: every Heading 2, in order. */
export function extractQuestions(doc) {
  const out = [];
  const walk = (node) => {
    if (!node) return;
    if (node.type === 'heading' && node.attrs?.level === 2 && node.attrs?.id) {
      const title = plainText(node).trim();
      if (title) {
        out.push({
          id: node.attrs.id,
          title,
          pro: Boolean(node.attrs?.pro),
          companies: parseCompanies(node.attrs?.company),
          asked: cleanAsked(node.attrs?.asked),
          difficulty: cleanDifficulty(node.attrs?.difficulty),
        });
      }
    }
    (node.content ?? []).forEach(walk);
  };
  walk(doc);
  return out;
}

/**
 * One question of a document: its Heading 2 and everything under it, up to the next Heading 1 or 2.
 * Returns { heading, body } (body = the answer, as document nodes) or null when the question is not there.
 */
export function findQuestion(doc, id) {
  const stops = (n) => n.type === 'heading' && (n.attrs?.level ?? 1) <= 2;
  const walk = (content) => {
    if (!Array.isArray(content)) return null;
    const i = content.findIndex((n) => n.type === 'heading' && n.attrs?.level === 2 && n.attrs?.id === id);
    if (i >= 0) {
      let j = i + 1;
      while (j < content.length && !stops(content[j])) j += 1;
      return { heading: content[i], body: content.slice(i + 1, j) };
    }
    for (const n of content) {
      const found = walk(n.content);
      if (found) return found;
    }
    return null;
  };
  return walk(doc?.content);
}

/** First paragraph of an answer as short plain text. Used as the teaser of a Pro question for free users. */
export function teaser(nodes, max = 220) {
  const first = (nodes ?? []).map((n) => (n.type === 'paragraph' ? plainText(n).trim() : '')).find(Boolean) ?? '';
  if (first.length <= max) return first;
  const cut = first.slice(0, max).replace(/\s+\S*$/, '');
  return `${cut}…`;
}

/** Light validation so a bad client payload cannot be stored. */
export function isDoc(value) {
  return Boolean(value) && typeof value === 'object' && value.type === 'doc' && Array.isArray(value.content);
}

/**
 * Keeps a numbered list counting when an image (or an empty line) sits between two of its parts.
 * Pasting an image between "1." and "2." splits the list in two, and the second half would start again at 1.
 * Only top-level lists are touched, and only when the second list has no start number of its own.
 * Does not mutate. Used on the server before the document is turned into HTML.
 */
export function continueNumbering(nodes) {
  const out = [];
  let lastEnd = null; // the number the previous top-level numbered list ended on
  for (const n of nodes ?? []) {
    if (n?.type === 'orderedList') {
      const explicit = Number(n.attrs?.start);
      let start = Number.isFinite(explicit) && explicit > 0 ? explicit : 1;
      let node = n;
      if (lastEnd !== null && start === 1) {
        start = lastEnd + 1;
        node = { ...n, attrs: { ...n.attrs, start } };
      }
      lastEnd = start + (n.content ?? []).length - 1;
      out.push(node);
    } else if (n?.type === 'image' || (n?.type === 'paragraph' && !(n.content ?? []).length)) {
      out.push(n); // images and blank lines do not end a numbered list
    } else {
      lastEnd = null;
      out.push(n);
    }
  }
  return out;
}