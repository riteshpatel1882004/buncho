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
import { newId, parseCompanies, cleanAsked, cleanDifficulty } from './tree';
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
      // Level of a question: EASY, MEDIUM or HARD (empty = not set, shown as Medium in the database).
      difficulty: {
        default: '',
        parseHTML: (el) => cleanDifficulty(el.getAttribute('data-difficulty')) ?? '',
        renderHTML: (attrs) => (cleanDifficulty(attrs.difficulty) ? { 'data-difficulty': cleanDifficulty(attrs.difficulty) } : {}),
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

// Small buttons at the end of every Heading 2 while editing: Level, Companies, Asked % and Pro. They are decorations, so
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
              const level = cleanDifficulty(node.attrs.difficulty);
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

                    // Click to go Easy -> Medium -> Hard -> not set
                    const LEVELS = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' };
                    const NEXT = { '': 'EASY', EASY: 'MEDIUM', MEDIUM: 'HARD', HARD: '' };
                    const levelBtn = make(
                      level ? `⚡ ${LEVELS[level]}` : '⚡ Set level',
                      'Level of this question: click to go Easy, Medium, Hard, then back to not set.',
                      false,
                      () => change({ difficulty: NEXT[level ?? ''] }),
                    );
                    if (level) levelBtn.classList.add('is-set', `lvl-${level.toLowerCase()}`);

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

                    wrap.append(levelBtn, companyBtn, askedBtn, proBtn);
                    return wrap;
                  },
                  { side: 1, key: `tools-${node.attrs.id}-${pro}-${companies.join('|')}-${asked}-${level}` },
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

// ---------- Images: centred, resizable, and the chosen size is what readers see ----------
// The size is a percentage of the page width (not pixels), so it looks the same on every screen. A new image starts at 60%:
// big enough to read a diagram, small enough not to dominate the answer. Old images without a size get the same default.
export const IMG_DEFAULT = 60;
export const IMG_MIN = 15;
export const IMG_MAX = 100;
export const IMG_PRESETS = [
  ['S', 35, 'Small'],
  ['M', 60, 'Medium'],
  ['L', 85, 'Large'],
  ['Full', 100, 'Full width'],
];
export function cleanImgSize(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(IMG_MAX, Math.max(IMG_MIN, n)) : IMG_DEFAULT;
}

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: IMG_DEFAULT,
        parseHTML: (el) => cleanImgSize(el.getAttribute('data-size')),
        renderHTML: (attrs) => {
          const size = cleanImgSize(attrs.size);
          return { 'data-size': String(size), style: `--img-size:${size}%` };
        },
      },
    };
  },

  // Editor only: the image gets drag handles on both sides and a small S / M / L / Full bar while it is selected.
  // Plain DOM on purpose, so this file stays free of React. It is never called on the server (generateHTML uses renderHTML).
  addNodeView() {
    return ({ node, editor, getPos }) => {
      let current = node;
      const dom = document.createElement('div');
      dom.className = 'doc-img';

      const img = document.createElement('img');
      img.draggable = false;
      dom.appendChild(img);

      const ui = document.createElement('div');
      ui.className = 'doc-img-ui';
      ui.contentEditable = 'false';
      dom.appendChild(ui);

      const badge = document.createElement('span');
      badge.className = 'doc-img-badge';

      const paint = (size) => {
        dom.style.setProperty('--img-size', `${size}%`);
        badge.textContent = `${size}%`;
        ui.querySelectorAll('[data-preset]').forEach((b) => b.classList.toggle('is-on', Number(b.dataset.preset) === size));
      };

      const commit = (size) => {
        const pos = getPos();
        if (typeof pos !== 'number' || !editor.isEditable) return;
        const next = cleanImgSize(size);
        editor.view.dispatch(editor.view.state.tr.setNodeMarkup(pos, undefined, { ...current.attrs, size: next }));
      };

      const bar = document.createElement('div');
      bar.className = 'doc-img-bar';
      IMG_PRESETS.forEach(([label, value, title]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.title = `${title} (${value}%)`;
        b.dataset.preset = String(value);
        b.addEventListener('mousedown', (e) => e.preventDefault());
        b.addEventListener('click', (e) => {
          e.preventDefault();
          commit(value);
        });
        bar.appendChild(b);
      });
      bar.appendChild(badge);
      ui.appendChild(bar);

      // One handle per side. The image stays centred, so dragging a side by N px changes the width by 2N px.
      [-1, 1].forEach((side) => {
        const h = document.createElement('span');
        h.className = `doc-img-handle ${side < 0 ? 'is-left' : 'is-right'}`;
        h.title = 'Drag to resize';
        h.addEventListener('pointerdown', (e) => {
          if (!editor.isEditable) return;
          e.preventDefault();
          e.stopPropagation();
          h.setPointerCapture?.(e.pointerId);
          const startX = e.clientX;
          const startPx = dom.getBoundingClientRect().width;
          const room = dom.parentElement?.clientWidth || startPx;
          let size = cleanImgSize(current.attrs.size);
          const prevSelect = document.body.style.userSelect;
          document.body.style.userSelect = 'none';
          dom.classList.add('is-resizing');

          const move = (ev) => {
            size = cleanImgSize(((startPx + side * (ev.clientX - startX) * 2) / room) * 100);
            paint(size);
          };
          const up = () => {
            h.removeEventListener('pointermove', move);
            h.removeEventListener('pointerup', up);
            h.removeEventListener('pointercancel', up);
            document.body.style.userSelect = prevSelect;
            dom.classList.remove('is-resizing');
            commit(size);
          };
          h.addEventListener('pointermove', move);
          h.addEventListener('pointerup', up);
          h.addEventListener('pointercancel', up);
        });
        ui.appendChild(h);
      });

      const sync = () => {
        img.src = current.attrs.src;
        img.alt = current.attrs.alt ?? '';
        if (current.attrs.title) img.title = current.attrs.title;
        paint(cleanImgSize(current.attrs.size));
      };
      sync();

      return {
        dom,
        update(updated) {
          if (updated.type !== current.type) return false;
          current = updated;
          sync();
          return true;
        },
        selectNode() {
          dom.classList.add('is-selected');
        },
        deselectNode() {
          dom.classList.remove('is-selected');
        },
        stopEvent: (e) => Boolean(e.target?.closest?.('.doc-img-ui')),
        ignoreMutation: () => true,
      };
    };
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
    ResizableImage.configure({ allowBase64: true }),
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