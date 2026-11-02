'use client';

import { useState } from 'react';
import { Check } from '../icons';

// A small read-only SQL viewer: dark panel, line numbers, light syntax colours and a copy button.
// No editor and nothing is executed. The colours are fixed (not theme variables) so it reads the same in light and dark mode.

const KEYWORDS = new Set(
  `select distinct from where and or not in is null as on join left right inner outer full cross lateral group by order
   having limit offset union all case when then else end over partition with between like exists asc desc true false
   using top fetch first rows only create index table insert into values update set delete`.split(/\s+/),
);

const TOKEN = /(--.*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/g;

const COLOR = {
  k: 'text-[#6ee7a0] font-semibold', // keyword
  f: 'text-[#7cc4ff]', // function
  s: 'text-[#f5c177]', // string
  n: 'text-[#e9a8ff]', // number
  c: 'text-[#7d8b99] italic', // comment
  i: 'text-[#e6edf3]', // identifier
  p: 'text-[#9fb0bf]', // punctuation
  w: '', // whitespace
};

function tokenize(line) {
  const out = [];
  for (const m of line.matchAll(TOKEN)) {
    const [text, comment, str, num, word, space] = m;
    if (comment) out.push([text, 'c']);
    else if (str) out.push([text, 's']);
    else if (num) out.push([text, 'n']);
    else if (word) {
      const next = line.slice(m.index + text.length).trimStart()[0];
      out.push([text, KEYWORDS.has(word.toLowerCase()) ? 'k' : next === '(' ? 'f' : 'i']);
    } else if (space) out.push([text, 'w']);
    else out.push([text, 'p']);
  }
  return out;
}

export default function SqlCode({ code, label = 'query.sql', copyable = true }) {
  const [copied, setCopied] = useState(false);
  const lines = String(code ?? '').split('\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-white/10 bg-[#0e1317] shadow-sm">
      <figcaption className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-3.5 py-2">
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-[11px] uppercase tracking-wider text-[#7d8b99]">{label}</span>
        </span>
        {copyable && (
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? 'Copied' : 'Copy query'}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-[#9fb0bf] transition-colors hover:bg-white/10 hover:text-white"
          >
            {copied ? (
              <>
                <Check width={13} height={13} strokeWidth={3} className="text-[#6ee7a0]" /> Copied
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                </svg>
                Copy
              </>
            )}
          </button>
        )}
      </figcaption>

      <pre className="overflow-x-auto py-3.5 font-mono text-[13px] leading-6">
        <code className="block min-w-max">
          {lines.map((line, i) => (
            <span key={i} className="flex">
              <span aria-hidden="true" className="w-11 shrink-0 select-none pr-4 text-right text-[#4b5966]">
                {i + 1}
              </span>
              <span className="whitespace-pre pr-5">
                {tokenize(line).map(([text, kind], j) => (
                  <span key={j} className={COLOR[kind]}>
                    {text}
                  </span>
                ))}
                {line === '' && ' '}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}