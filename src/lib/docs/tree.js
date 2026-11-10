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

/** The questions in a document: every Heading 2, in order. */
export function extractQuestions(doc) {
  const out = [];
  const walk = (node) => {
    if (!node) return;
    if (node.type === 'heading' && node.attrs?.level === 2 && node.attrs?.id) {
      const title = plainText(node).trim();
      if (title) out.push({ id: node.attrs.id, title });
    }
    (node.content ?? []).forEach(walk);
  };
  walk(doc);
  return out;
}

/** Light validation so a bad client payload cannot be stored. */
export function isDoc(value) {
  return Boolean(value) && typeof value === 'object' && value.type === 'doc' && Array.isArray(value.content);
}