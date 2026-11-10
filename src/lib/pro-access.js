// Pro-only questions (Problem.proOnly).
//
// Free visitors can see a Pro question in lists and on its page (title, topic, difficulty and a short preview), so it
// can be found and shared. Everything else is withheld on the SERVER: the full question, hints, steps, scenario data,
// answer editor and community answers. Server actions call
// `assertProblemAccess`, so the lock cannot be bypassed by calling them directly.

import { getIsPro } from './subscription';

export const PRO_QUESTION_MESSAGE = 'This is a Pro question. Upgrade to Buncho Pro to attempt it.';

/** True when this user may open the full question. Non-Pro questions are open to everyone. */
export const canAccessProblem = (problem, isPro) => !problem?.proOnly || Boolean(isPro);

/**
 * For server actions and API routes. Returns null when access is allowed, or an error result to return as-is.
 * `problem` needs a `proOnly` field.
 */
export async function assertProblemAccess(problem, userId) {
  if (!problem?.proOnly) return null;
  if (userId && (await getIsPro(userId))) return null;
  return { ok: false, code: 'UPGRADE', error: PRO_QUESTION_MESSAGE };
}

/**
 * A short, safe teaser of the question for free users: whole paragraphs up to about `max` characters, never cutting
 * inside a code block, table or list. Falls back to a hard cut at a sentence end.
 */
export function previewMarkdown(text, max = 360) {
  const src = String(text ?? '').replace(/\r\n/g, '\n').trim();
  if (src.length <= max) return { text: src, truncated: false };

  const blocks = src.split(/\n{2,}/);
  let out = '';
  for (const block of blocks) {
    const unsafe = /^\s*(```|~~~|\||[-*+] |\d+[.)] )/.test(block);
    if (unsafe) break;
    const next = out ? `${out}\n\n${block}` : block;
    if (next.length > max) {
      if (!out) {
        const cut = next.slice(0, max);
        const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
        out = (end > 80 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '')).trim();
      }
      break;
    }
    out = next;
  }
  if (!out) out = src.slice(0, max).replace(/\s+\S*$/, '').trim();
  return { text: out, truncated: true };
}