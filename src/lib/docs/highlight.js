// Tiny Python syntax highlighter. No dependencies, and no React, so it runs in the editor (browser) and on the
// server (read-only page). Used in two places:
//   1. extensions.js  -> ProseMirror decorations, so code is coloured while an admin edits
//   2. enhanceDocHtml -> post-processes the server-rendered HTML for readers

const KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
  'return', 'try', 'while', 'with', 'yield', 'match', 'case',
]);
const CONSTANTS = new Set(['True', 'False', 'None']);
const BUILTINS = new Set([
  'abs', 'all', 'any', 'bool', 'bytearray', 'bytes', 'callable', 'chr', 'dict', 'dir', 'divmod', 'enumerate', 'filter',
  'float', 'format', 'frozenset', 'getattr', 'hasattr', 'hash', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter',
  'len', 'list', 'map', 'max', 'min', 'next', 'object', 'open', 'ord', 'pow', 'print', 'range', 'repr', 'reversed',
  'round', 'set', 'setattr', 'slice', 'sorted', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip',
]);

const RULES = [
  ['comment', /#[^\n]*/y],
  ['string', /(?:[rRbBuUfF]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$))/y],
  ['string', /(?:[rRbBuUfF]{1,2})?(?:"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)/y],
  ['decorator', /@[A-Za-z_][\w.]*/y],
  ['number', /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d+)?[jJ]?)/y],
  ['word', /[A-Za-z_]\w*/y],
];

/** Splits Python source into [{ type, text }]. type is 'plain' or one of the tok-* names below. */
export function tokenizePython(src) {
  const out = [];
  const push = (type, text) => {
    const last = out[out.length - 1];
    if (last && last.type === type && type === 'plain') last.text += text;
    else out.push({ type, text });
  };
  let i = 0;
  let prevWord = '';
  while (i < src.length) {
    let matched = false;
    for (const [type, re] of RULES) {
      re.lastIndex = i;
      const m = re.exec(src);
      if (!m || m.index !== i || !m[0]) continue;
      const text = m[0];
      if (type === 'word') {
        let kind = 'plain';
        if (KEYWORDS.has(text)) kind = 'keyword';
        else if (CONSTANTS.has(text)) kind = 'constant';
        else if (text === 'self' || text === 'cls') kind = 'self';
        else if (prevWord === 'def' || prevWord === 'class') kind = 'function';
        else if (BUILTINS.has(text)) kind = 'builtin';
        else if (/^\s*\(/.test(src.slice(i + text.length, i + text.length + 8))) kind = 'function';
        push(kind, text);
        prevWord = KEYWORDS.has(text) ? text : '';
      } else {
        push(type, text);
        prevWord = '';
      }
      i += text.length;
      matched = true;
      break;
    }
    if (!matched) {
      push('plain', src[i]);
      if (!/\s/.test(src[i])) prevWord = '';
      i += 1;
    }
  }
  return out;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&');

/**
 * Takes the HTML made by generateHTML and
 *  - colours every <pre><code> block (they are all Python)
 *  - wraps every <table> in .tableWrapper so wide or resized tables scroll sideways instead of breaking the page
 */
export function enhanceDocHtml(html) {
  return html
    .replace(/<pre([^>]*)><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (_all, preAttrs, codeAttrs, body) => {
      const code = unesc(body);
      const inner = tokenizePython(code)
        .map((t) => (t.type === 'plain' ? esc(t.text) : `<span class="tok-${t.type}">${esc(t.text)}</span>`))
        .join('');
      return `<pre${preAttrs}><code${codeAttrs}>${inner}</code></pre>`;
    })
    .replace(/<table/g, '<div class="tableWrapper"><table')
    .replace(/<\/table>/g, '</table></div>');
}