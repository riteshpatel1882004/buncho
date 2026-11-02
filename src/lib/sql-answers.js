// Turns a SQL question's "answers" markdown (prisma/content/sql/<slug>.solution.md) into a list of approaches.
//
// File format, one block per approach, ordered from brute force to optimized:
//
//   ### Brute force | Nested MAX subquery        <- "<level> | <title>"  (level: Brute force, Better or Optimized)
//
//   ```sql
//   SELECT ...
//   ```
//
//   **Time:** O(n²) | **Engines:** all | Slowest option   <- optional note line, chips are separated by " | "
//
// Only the FIRST code fence in a block is shown as the query, so put every statement of one approach in one fence.
//
// Text before the first "### " heading is the "quick answer" (short theory bullets). parseIntro returns it and the
// page shows it above the approaches. Do not start a line with "### " inside it.
//
// A heading without " | " is fine too (it just has no level badge). If the file has no "### " headings at all,
// parseAnswers returns [] and the page falls back to rendering the raw markdown (used for pure theory questions).

export function parseIntro(markdown) {
  const src = String(markdown ?? '').replace(/\r\n/g, '\n');
  if (!/^### /m.test(src)) return '';
  return src.split(/^### /m)[0].trim();
}

export function parseAnswers(markdown) {
  const src = String(markdown ?? '').replace(/\r\n/g, '\n');
  if (!/^### /m.test(src)) return [];

  return src
    .split(/^### /m)
    .slice(1) // the first piece is the quick answer (or empty), not an approach
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part, i) => {
      const nl = part.indexOf('\n');
      const head = (nl === -1 ? part : part.slice(0, nl)).trim();
      const body = nl === -1 ? '' : part.slice(nl + 1).trim();

      const [first, ...rest] = head.split('|');
      const hasLevel = rest.length > 0;
      const level = hasLevel ? first.trim() : null;
      const title = (hasLevel ? rest.join('|') : head).trim();

      const fence = body.match(/```[a-z]*\n([\s\S]*?)```/i);
      const code = fence ? fence[1].replace(/\s+$/, '') : null;
      const noteText = (fence ? body.replace(fence[0], '') : body).trim();

      // "**Time:** O(n) | **Scans:** 1 | Fastest" -> [{ key: 'Time', value: 'O(n)' }, { key: 'Scans', value: '1' }, { key: null, value: 'Fastest' }]
      const chips = noteText
        ? noteText
            .split(/\s\|\s/)
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => {
              const m = c.match(/^\*\*(.+?):\*\*\s*(.*)$/);
              const clean = (t) => t.replace(/`/g, '').replace(/\*\*/g, '').trim();
              return m ? { key: clean(m[1]), value: clean(m[2]) } : { key: null, value: clean(c) };
            })
        : [];

      return { n: i + 1, level, title, code, chips };
    });
}