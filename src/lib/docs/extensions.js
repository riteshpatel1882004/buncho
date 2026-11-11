// The editor schema, shared by the admin editor (browser) and the read-only page (server).
// Keep this file free of React so it can run in both places.
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { Details, DetailsSummary, DetailsContent } from '@tiptap/extension-details';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import { Extension, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { newId, parseCompanies, cleanAsked } from './tree';
import { tokenizePython } from './highlight';

// Every heading carries a stable `id`. For an H2 (a question) that id is the anchor in the URL, so a link
// to /docs/ai/python#abc123 keeps working after the question is edited or moved.
const HeadingWithId = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute('id'),
        renderHTML: (attrs) => (attrs.id ? { id: attrs.id } : {}),
      },
      // Pro question: an admin switches this on a Heading 2 (the "Pro" button at the end of the heading). The question
      // then opens for Pro users only. It is saved in the document, and saveTab copies it to Problem.proOnly.
      pro: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-pro') === 'true',
        renderHTML: (attrs) => (attrs.pro ? { 'data-pro': 'true' } : {}),
      },
      // Pro insights of a question, set by the admin next to the Pro button. Saved in the document, and saveTab copies
      // them to Problem.askedByCompanies / Problem.askedFrequency.
      company: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-company') || '',
        renderHTML: (attrs) => (attrs.company ? { 'data-company': attrs.company } : {}),
      },
      asked: {
        default: null,
        parseHTML: (el) => cleanAsked(el.getAttribute('data-asked')),
        renderHTML: (attrs) => (cleanAsked(attrs.asked) === null ? {} : { 'data-asked': String(cleanAsked(attrs.asked)) }),
      },
    };
  },
});

// Gives new headings an id and fixes duplicates (copy/paste). Runs after any change, and once on load.
const HeadingIds = Extension.create({
  name: 'headingIds',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('headingIds'),
        appendTransaction(transactions, _old, state) {
          if (!transactions.some((t) => t.docChanged || t.getMeta('ensureIds'))) return null;
          const seen = new Set();
          let tr = null;
          state.doc.descendants((node, pos) => {
            if (node.type.name !== 'heading') return;
            let id = node.attrs.id;
            if (!id || seen.has(id)) {
              id = newId();
              tr = (tr ?? state.tr).setNodeMarkup(pos, undefined, { ...node.attrs, id });
            }
            seen.add(id);
          });
          return tr;
        },
      }),
    ];
  },
});

// Three small buttons at the end of every Heading 2 while editing: Companies, Asked %, and Pro. They are decorations, so
// they are never saved into the document and readers never see them.
const QuestionTools = Extension.create({
  name: 'questionTools',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('questionTools'),
        props: {
          decorations(state) {
            const decos = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name !== 'heading' || node.attrs.level !== 2) return;
              const pro = Boolean(node.attrs.pro);
              const companies = parseCompanies(node.attrs.company);
              const asked = cleanAsked(node.attrs.asked);
              decos.push(
                Decoration.widget(
                  pos + node.nodeSize - 1,
                  (view) => {
                    const wrap = document.createElement('span');
                    wrap.className = 'doc-q-tools';
                    wrap.contentEditable = 'false';

                    // Change attributes of the heading this widget sits in
                    const change = (patch) => {
                      if (!view.editable) return;
                      const $pos = view.state.doc.resolve(view.posAtDOM(wrap, 0));
                      const headingPos = $pos.before($pos.depth);
                      const heading = view.state.doc.nodeAt(headingPos);
                      if (!heading || heading.type.name !== 'heading') return;
                      view.dispatch(view.state.tr.setNodeMarkup(headingPos, undefined, { ...heading.attrs, ...patch }));
                    };
                    const make = (text, title, on, onClick) => {
                      const b = document.createElement('button');
                      b.type = 'button';
                      b.className = `doc-pro-btn${on ? ' is-on' : ''}`;
                      b.textContent = text;
                      b.title = title;
                      b.addEventListener('mousedown', (e) => e.preventDefault()); // keep the cursor where it is
                      b.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (view.editable) onClick();
                      });
                      return b;
                    };

                    const companyBtn = make(
                      companies.length ? `🏢 ${companies.join(', ')}` : '🏢 Add companies',
                      'Companies that ask this question (Pro insight). Click to edit.',
                      false,
                      () => {
                        const next = window.prompt('Companies that ask this question, separated by commas.\nLeave empty to clear.', companies.join(', '));
                        if (next !== null) change({ company: parseCompanies(next).join(', ') });
                      },
                    );
                    if (companies.length) companyBtn.classList.add('is-set');

                    const askedBtn = make(
                      asked === null ? '📊 Add asked %' : `📊 ${asked}% asked`,
                      'How often this question is asked, in % of interviews (Pro insight). Click to edit.',
                      false,
                      () => {
                        const next = window.prompt('How often is this question asked, in % of interviews (0 to 100)?\nLeave empty to clear.', asked === null ? '' : String(asked));
                        if (next === null) return;
                        const value = cleanAsked(next.trim());
                        if (next.trim() !== '' && value === null) return; // not a number: keep what was there
                        change({ asked: value });
                      },
                    );
                    if (asked !== null) askedBtn.classList.add('is-set');

                    const proBtn = make(
                      pro ? '★ Pro' : '☆ Make Pro',
                      pro ? 'Pro question: only Pro users can open it. Click to make it free.' : 'Click to make this question Pro-only',
                      pro,
                      () => change({ pro: !pro }),
                    );

                    wrap.append(companyBtn, askedBtn, proBtn);
                    return wrap;
                  },
                  { side: 1, key: `tools-${node.attrs.id}-${pro}-${companies.join('|')}-${asked}` },
                ),
              );
            });
            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
});

// Every code block is Python: the language label is always "python" and the text is coloured as Python.
const PythonCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: { default: 'python', parseHTML: () => 'python', renderHTML: () => ({}) },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['pre', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-language': 'python' }), ['code', { class: 'language-python' }, 0]];
  },
});

// Inline code normally refuses every other mark, so highlight / colour / bold could never be applied to `code` text.
// An empty `excludes` lets them combine.
const InlineCode = Code.extend({ excludes: '' });

// Colours code blocks while editing (readers get the same colours from enhanceDocHtml on the server).
const PythonColors = Extension.create({
  name: 'pythonColors',
  addProseMirrorPlugins() {
    const build = (doc) => {
      const decos = [];
      doc.descendants((node, pos) => {
        if (node.type.name !== 'codeBlock') return;
        let offset = pos + 1;
        for (const t of tokenizePython(node.textContent)) {
          if (t.type !== 'plain') decos.push(Decoration.inline(offset, offset + t.text.length, { class: `tok-${t.type}` }));
          offset += t.text.length;
        }
        return false;
      });
      return DecorationSet.create(doc, decos);
    };
    return [
      new Plugin({
        key: new PluginKey('pythonColors'),
        state: {
          init: (_, { doc }) => build(doc),
          apply: (tr, old) => (tr.docChanged ? build(tr.doc) : old),
        },
        props: { decorations(state) { return this.getState(state); } },
      }),
    ];
  },
});

export function buildExtensions({ placeholder } = {}) {
  return [
    StarterKit.configure({ heading: false, code: false, codeBlock: false, link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' } } }),
    HeadingWithId.configure({ levels: [1, 2, 3] }),
    HeadingIds,
    QuestionTools,
    InlineCode,
    PythonCodeBlock,
    PythonColors,
    Image.configure({ allowBase64: true }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    Table.configure({ resizable: true, cellMinWidth: 60, lastColumnResizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Details.configure({ persist: false }),
    DetailsSummary,
    DetailsContent,
    ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
  ];
}