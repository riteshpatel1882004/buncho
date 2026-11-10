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
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { newId } from './tree';

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

export function buildExtensions({ placeholder } = {}) {
  return [
    StarterKit.configure({ heading: false, link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' } } }),
    HeadingWithId.configure({ levels: [1, 2, 3] }),
    HeadingIds,
    Image.configure({ allowBase64: true }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    Table.configure({ resizable: false }),
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