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
import { newId } from './tree';
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