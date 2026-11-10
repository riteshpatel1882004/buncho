// Clipboard clean-up for the editor (browser only: uses DOMParser).
// Problem 1: tables copied from a chat page / website carry nested <div>s, custom elements, classes and inline colours
//            that the table schema cannot read, so the pasted table came out as empty cells.
// Problem 2: copied text brings the other site's text colour / background along (invisible on this theme).

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const BLOCK = new Set(['P', 'DIV', 'LI', 'UL', 'OL', 'SECTION', 'ARTICLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'BLOCKQUOTE']);

function inline(node) {
  let out = '';
  node.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      out += esc(n.textContent.replace(/\s+/g, ' '));
    } else if (n.nodeType === 1) {
      const tag = n.tagName.toLowerCase();
      const inner = inline(n);
      if (!inner.trim() && tag !== 'br') return;
      if (tag === 'code' || tag === 'kbd' || tag === 'samp') out += `<code>${inner}</code>`;
      else if (tag === 'strong' || tag === 'b') out += `<strong>${inner}</strong>`;
      else if (tag === 'em' || tag === 'i') out += `<em>${inner}</em>`;
      else if (tag === 'br') out += '<br>';
      else out += inner;
    }
  });
  return out;
}

// A cell can hold several blocks; each becomes its own paragraph.
function cellParagraphs(cell) {
  const paras = [];
  let buf = '';
  const flush = () => {
    if (buf.trim()) paras.push(buf.trim());
    buf = '';
  };
  const walk = (node) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === 1 && BLOCK.has(n.tagName)) {
        flush();
        if ([...n.children].some((c) => BLOCK.has(c.tagName))) walk(n);
        else paras.push(inline(n).trim());
      } else {
        const holder = document.createElement('div');
        holder.appendChild(n.cloneNode(true));
        buf += inline(holder);
      }
    });
    flush();
  };
  walk(cell);
  const list = paras.filter(Boolean);
  return list.length ? list.map((p) => `<p>${p}</p>`).join('') : '<p></p>';
}

function cleanTable(table) {
  const rows = [...table.querySelectorAll('tr')].filter((tr) => tr.closest('table') === table);
  const grid = rows.map((tr) => [...tr.children].filter((c) => /^(TD|TH)$/.test(c.tagName)));
  const width = Math.max(0, ...grid.map((r) => r.length));
  if (!width) return '';
  const headerRow = rows[0] && ([...rows[0].children].every((c) => c.tagName === 'TH') || rows[0].parentElement?.tagName === 'THEAD');
  const body = grid
    .map((cells, r) => {
      const tag = r === 0 && headerRow ? 'th' : 'td';
      const html = cells.map((c) => `<${tag}>${cellParagraphs(c)}</${tag}>`);
      while (html.length < width) html.push(`<${tag}><p></p></${tag}>`);
      return `<tr>${html.join('')}</tr>`;
    })
    .join('');
  return `<table><tbody>${body}</tbody></table>`;
}

/** True when the clipboard HTML contains a table that did not come from this editor. */
export function hasForeignTable(html) {
  return Boolean(html) && /<table[\s>]/i.test(html) && !html.includes('data-pm-slice');
}

/** Rebuilds the clipboard HTML with every table rewritten into the plain shape the editor understands. */
export function cleanClipboardTables(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  [...doc.body.querySelectorAll('table')].filter((t) => !t.parentElement.closest('table')).forEach((t) => {
    const holder = document.createElement('div');
    holder.innerHTML = cleanTable(t);
    t.replaceWith(...holder.childNodes);
  });
  doc.body.querySelectorAll('style, script, meta, link').forEach((el) => el.remove());
  return doc.body.innerHTML;
}

/** Drops the source site's text colour and background, keeps bold / italic / code / links. */
export function stripForeignColors(html) {
  if (!html || html.includes('data-pm-slice')) return html; // copied inside this editor: keep everything
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.body.querySelectorAll('style, script, meta, link').forEach((el) => el.remove());
  doc.body.querySelectorAll('[style]').forEach((el) => {
    const kept = el.getAttribute('style').split(';').filter((d) => d.trim() && !/^\s*(color|background(-color|-image)?)\s*:/i.test(d));
    if (kept.length) el.setAttribute('style', kept.join(';'));
    else el.removeAttribute('style');
  });
  doc.body.querySelectorAll('mark').forEach((el) => el.removeAttribute('data-color'));
  // Google Docs wraps everything in <b style="font-weight:normal">
  doc.body.querySelectorAll('b[style*="font-weight"]').forEach((el) => {
    if (/font-weight:\s*(normal|400)/i.test(el.getAttribute('style'))) el.replaceWith(...el.childNodes);
  });
  return doc.body.innerHTML;
}