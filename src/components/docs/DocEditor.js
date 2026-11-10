'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { buildExtensions } from '@/lib/docs/extensions';
import { saveTab } from '@/app/docs-actions';

const MAX_IMAGE_BYTES = 1_500_000;

// These two MUST stay outside the component. BubbleMenu re-registers itself whenever they change identity, and each
// re-registration triggers a render, which would loop forever ("Maximum update depth exceeded", React error #185).
const BUBBLE_OPTIONS = { placement: 'top' };
const showBubble = ({ editor, state }) => editor.isEditable && !state.selection.empty && !editor.isActive('image');

const TEXT_COLORS = [
  ['Default', null, '#e5e5e5'],
  ['Red', '#f87171', '#f87171'],
  ['Yellow', '#f59e0b', '#f59e0b'],
  ['Green', '#4ade80', '#4ade80'],
  ['Teal', '#2dd4bf', '#2dd4bf'],
  ['Purple', '#a78bfa', '#a78bfa'],
];
const HIGHLIGHTS = [
  ['No highlight', null, 'transparent'],
  ['Yellow', 'rgba(245, 158, 11, 0.35)', '#8a6a1f'],
  ['Green', 'rgba(74, 222, 128, 0.3)', '#2f7d4a'],
  ['Purple', 'rgba(167, 139, 250, 0.35)', '#6b5bb0'],
];

/* ---------- tiny UI pieces ---------- */
const btn = 'grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40';
const btnOn = 'bg-surface-2 text-ink';

function Icon({ children, size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const I = {
  tt: <Icon><path d="M4 7V5h10v2M9 5v12M16 12v-1h5v1M18.5 11v6" /></Icon>,
  wide: <Icon><path d="M4 12h6M20 12h-6M7 9l3 3-3 3M17 9l-3 3 3 3" /></Icon>,
  table: <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></Icon>,
  image: <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-9 9" /></Icon>,
  check: <Icon><path d="M4 7l2 2 3-3M4 17l2 2 3-3M13 8h8M13 18h8" /></Icon>,
  plus: <Icon><path d="M12 5v14M5 12h14" /></Icon>,
  list: <Icon><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" /></Icon>,
  palette: <Icon><circle cx="12" cy="12" r="9" /><circle cx="8" cy="11" r="1" /><circle cx="12" cy="7.5" r="1" /><circle cx="16" cy="11" r="1" /></Icon>,
  link: <Icon><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Icon>,
  caret: <Icon size={12}><path d="M6 9l6 6 6-6" /></Icon>,
};

function Menu({ open, onClose, children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className={`absolute left-0 top-full z-40 mt-1.5 min-w-48 rounded-xl border border-line bg-surface p-1.5 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

function MenuItem({ children, onClick, active, icon }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-surface-2"
    >
      <span className="grid h-5 w-5 place-items-center text-muted">{icon}</span>
      <span className="flex-1">{children}</span>
      {active && <span className="text-accent">✓</span>}
    </button>
  );
}

const Label = ({ children }) => <p className="px-2.5 pb-0.5 pt-1.5 text-xs font-medium text-muted">{children}</p>;
const H = ({ n }) => <span className="text-[11px] font-bold">H{n}</span>;

/* ---------- the editor ---------- */
export default function DocEditor({ slug, initialContent, initialSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState(null);
  const [pending, start] = useTransition();
  const [menu, setMenu] = useState(null); // 'font' | 'image' | 'plus' | 'style' | 'color' | 'list'
  const fileRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const extensions = useMemo(() => buildExtensions({ placeholder: 'Start writing. Every Heading 2 becomes a question in the list.' }), []);

  const editor = useEditor({
    extensions,
    content: initialContent,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: () => setDirty(true),
    onCreate: ({ editor: e }) => e.view.dispatch(e.state.tr.setMeta('ensureIds', true).setMeta('addToHistory', false)),
    editorProps: {
      handlePaste(view, event) {
        const file = [...(event.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
        if (!file) return false;
        insertImageFile(file);
        return true;
      },
      handleDrop(view, event) {
        const file = [...(event.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'));
        if (!file) return false;
        event.preventDefault();
        insertImageFile(file);
        return true;
      },
    },
  });

  const closeMenu = useCallback(() => setMenu(null), []);

  function insertImageFile(file) {
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage({ type: 'error', text: 'That image is over 1.5 MB. Use a smaller one, or paste an image link instead.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => editor?.chain().focus().setImage({ src: String(reader.result) }).run();
    reader.readAsDataURL(file);
  }

  const save = useCallback(() => {
    if (!editor) return;
    start(async () => {
      const res = await saveTab(slug, editor.getJSON(), settingsRef.current);
      if (res.ok) {
        setDirty(false);
        setMessage({ type: 'ok', text: `Saved. ${res.questions} question${res.questions === 1 ? '' : 's'} in this tab.` });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: res.error });
      }
    });
  }, [editor, slug, router]);

  // Ctrl/Cmd+S saves; warn before leaving with unsaved changes
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onLeave);
    };
  }, [save, dirty]);

  const changeSetting = (patch) => {
    setSettings((s) => ({ ...s, ...patch }));
    setDirty(true);
  };

  if (!editor) return <div className="h-64 animate-pulse rounded-xl bg-surface-2" />;

  const chain = () => editor.chain().focus();
  const run = (fn) => () => {
    fn();
    closeMenu();
  };
  const today = () => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const styleLabel = editor.isActive('heading', { level: 1 }) ? 'H1' : editor.isActive('heading', { level: 2 }) ? 'H2' : editor.isActive('heading', { level: 3 }) ? 'H3' : 'T';

  return (
    <div>
      {/* Top toolbar */}
      <div className="sticky top-0 z-30 -mx-1 mb-4 flex flex-wrap items-center gap-1 border-b border-line bg-bg/95 px-1 py-2 backdrop-blur">
        <div className="relative">
          <button type="button" className={`${btn} ${menu === 'font' ? btnOn : ''}`} aria-label="Fonts" title="Fonts" onClick={() => setMenu(menu === 'font' ? null : 'font')}>
            {I.tt}
          </button>
          <Menu open={menu === 'font'} onClose={closeMenu}>
            <Label>Headings</Label>
            <MenuItem active={settings.headingFont === 'serif'} onClick={() => changeSetting({ headingFont: 'serif' })}><span style={{ fontFamily: 'Georgia, serif' }}>Serif</span></MenuItem>
            <MenuItem active={settings.headingFont === 'sans'} onClick={() => changeSetting({ headingFont: 'sans' })}>Sans</MenuItem>
            <div className="my-1 border-t border-line" />
            <Label>Text</Label>
            <MenuItem active={settings.textFont === 'serif'} onClick={() => changeSetting({ textFont: 'serif' })}><span style={{ fontFamily: 'Georgia, serif' }}>Serif</span></MenuItem>
            <MenuItem active={settings.textFont === 'sans'} onClick={() => changeSetting({ textFont: 'sans' })}>Sans</MenuItem>
          </Menu>
        </div>

        <button type="button" className={`${btn} ${settings.wide ? btnOn : ''}`} aria-label="Wide layout" title="Wide layout" onClick={() => changeSetting({ wide: !settings.wide })}>
          {I.wide}
        </button>

        <span className="mx-1 h-5 w-px bg-line" />

        <button type="button" className={btn} aria-label="Table" title="Table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          {I.table}
        </button>

        <div className="relative">
          <button type="button" className={`${btn} ${menu === 'image' ? btnOn : ''}`} aria-label="Image" title="Image" onClick={() => setMenu(menu === 'image' ? null : 'image')}>
            {I.image}
          </button>
          <Menu open={menu === 'image'} onClose={closeMenu}>
            <MenuItem onClick={() => { closeMenu(); fileRef.current?.click(); }}>Upload from device</MenuItem>
            <MenuItem
              onClick={() => {
                closeMenu();
                const src = window.prompt('Image link (https://…)');
                if (src && /^https?:\/\//i.test(src.trim())) chain().setImage({ src: src.trim() }).run();
              }}
            >
              From a link
            </MenuItem>
          </Menu>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) insertImageFile(f);
              e.target.value = '';
            }}
          />
        </div>

        <button type="button" className={`${btn} ${editor.isActive('taskList') ? btnOn : ''}`} aria-label="Checklist" title="Checklist (Ctrl+Shift+9)" onClick={() => chain().toggleTaskList().run()}>
          {I.check}
        </button>

        <div className="relative">
          <button type="button" className={`${btn} gap-1 ${menu === 'plus' ? btnOn : ''}`} aria-label="Insert" title="Insert" onClick={() => setMenu(menu === 'plus' ? null : 'plus')}>
            {I.plus}
            {I.caret}
          </button>
          <Menu open={menu === 'plus'} onClose={closeMenu} className="max-h-96 overflow-y-auto">
            <MenuItem icon={I.list} onClick={run(() => chain().toggleBulletList().run())}>Bulleted list</MenuItem>
            <MenuItem icon={I.check} onClick={run(() => chain().toggleTaskList().run())}>Checklist</MenuItem>
            <MenuItem icon={<span className="text-xs">{'<>'}</span>} onClick={run(() => chain().toggleCodeBlock().run())}>Code block</MenuItem>
            <MenuItem icon={<span className="text-xs">▦</span>} onClick={run(() => chain().insertContent(today()).run())}>Date</MenuItem>
            <MenuItem icon={<span>—</span>} onClick={run(() => chain().setHorizontalRule().run())}>Divider</MenuItem>
            <MenuItem icon={<span className="text-xs">▾</span>} onClick={run(() => chain().setDetails().run())}>Dropdown</MenuItem>
            <MenuItem icon={<H n={1} />} onClick={run(() => chain().toggleHeading({ level: 1 }).run())}>Heading 1</MenuItem>
            <MenuItem icon={<H n={2} />} onClick={run(() => chain().toggleHeading({ level: 2 }).run())}>Heading 2 (a question)</MenuItem>
            <MenuItem icon={<H n={3} />} onClick={run(() => chain().toggleHeading({ level: 3 }).run())}>Heading 3</MenuItem>
            <MenuItem icon={<span className="text-xs">1.</span>} onClick={run(() => chain().toggleOrderedList().run())}>Numbered list</MenuItem>
            <MenuItem icon={<span className="text-xs">❝</span>} onClick={run(() => chain().toggleBlockquote().run())}>Quote</MenuItem>
          </Menu>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {message && (
            <span role="status" className={`text-xs ${message.type === 'error' ? 'text-hard' : 'text-muted'}`}>
              {message.text}
            </span>
          )}
          {dirty && !pending && <span className="text-xs text-muted">Unsaved changes</span>}
          <button type="button" onClick={save} disabled={pending || !dirty} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink disabled:opacity-40">
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Table tools, only while the cursor is in a table */}
      {editor.isActive('table') && (
        <div className="mb-3 flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs">
          <span className="mr-1 text-muted">Table</span>
          {[
            ['Row above', () => chain().addRowBefore().run()],
            ['Row below', () => chain().addRowAfter().run()],
            ['Column left', () => chain().addColumnBefore().run()],
            ['Column right', () => chain().addColumnAfter().run()],
            ['Delete row', () => chain().deleteRow().run()],
            ['Delete column', () => chain().deleteColumn().run()],
            ['Delete table', () => chain().deleteTable().run()],
          ].map(([label, fn]) => (
            <button key={label} type="button" onClick={fn} className="rounded-md px-2 py-1 hover:bg-surface-2">{label}</button>
          ))}
        </div>
      )}

      {/* Floating toolbar on selected text */}
      <BubbleMenu editor={editor} options={BUBBLE_OPTIONS} shouldShow={showBubble}>
        <div className="flex items-center gap-0.5 rounded-xl border border-line bg-surface p-1 shadow-xl">
          <div className="relative">
            <button type="button" onMouseDown={(e) => e.preventDefault()} className={`${btn} gap-1`} onClick={() => setMenu(menu === 'style' ? null : 'style')} aria-label="Text style">
              <span className="text-xs font-semibold">{styleLabel}</span>{I.caret}
            </button>
            <Menu open={menu === 'style'} onClose={closeMenu}>
              <MenuItem active={styleLabel === 'T'} icon={<span className="text-xs">T</span>} onClick={run(() => chain().setParagraph().run())}>Text</MenuItem>
              <MenuItem active={styleLabel === 'H1'} icon={<H n={1} />} onClick={run(() => chain().setHeading({ level: 1 }).run())}>Heading 1</MenuItem>
              <MenuItem active={styleLabel === 'H2'} icon={<H n={2} />} onClick={run(() => chain().setHeading({ level: 2 }).run())}>Heading 2</MenuItem>
              <MenuItem active={styleLabel === 'H3'} icon={<H n={3} />} onClick={run(() => chain().setHeading({ level: 3 }).run())}>Heading 3</MenuItem>
            </Menu>
          </div>
          <span className="mx-0.5 h-5 w-px bg-line" />
          <button type="button" onMouseDown={(e) => e.preventDefault()} className={`${btn} ${editor.isActive('bold') ? btnOn : ''} font-bold`} onClick={() => chain().toggleBold().run()} aria-label="Bold">B</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} className={`${btn} ${editor.isActive('italic') ? btnOn : ''} italic`} onClick={() => chain().toggleItalic().run()} aria-label="Italic">I</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} className={`${btn} ${editor.isActive('underline') ? btnOn : ''} underline`} onClick={() => chain().toggleUnderline().run()} aria-label="Underline">U</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} className={`${btn} ${editor.isActive('strike') ? btnOn : ''} line-through`} onClick={() => chain().toggleStrike().run()} aria-label="Strikethrough">S</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} className={`${btn} ${editor.isActive('code') ? btnOn : ''} font-mono`} onClick={() => chain().toggleCode().run()} aria-label="Inline code">{'{}'}</button>
          <div className="relative">
            <button type="button" onMouseDown={(e) => e.preventDefault()} className={`${btn} gap-1`} onClick={() => setMenu(menu === 'color' ? null : 'color')} aria-label="Colours">
              {I.palette}{I.caret}
            </button>
            <Menu open={menu === 'color'} onClose={closeMenu}>
              <Label>Text</Label>
              {TEXT_COLORS.map(([name, value, swatch]) => (
                <MenuItem
                  key={name}
                  active={value ? editor.isActive('textStyle', { color: value }) : !editor.getAttributes('textStyle').color}
                  icon={<span className="h-4 w-4 rounded-md" style={{ background: swatch }} />}
                  onClick={run(() => (value ? chain().setColor(value).run() : chain().unsetColor().run()))}
                >
                  {name}
                </MenuItem>
              ))}
              <div className="my-1 border-t border-line" />
              <Label>Highlight</Label>
              {HIGHLIGHTS.map(([name, value, swatch]) => (
                <MenuItem
                  key={name}
                  active={value ? editor.isActive('highlight', { color: value }) : !editor.isActive('highlight')}
                  icon={<span className="h-4 w-4 rounded-md border border-line" style={{ background: swatch }} />}
                  onClick={run(() => (value ? chain().setHighlight({ color: value }).run() : chain().unsetHighlight().run()))}
                >
                  {name}
                </MenuItem>
              ))}
            </Menu>
          </div>
          <span className="mx-0.5 h-5 w-px bg-line" />
          <div className="relative">
            <button type="button" onMouseDown={(e) => e.preventDefault()} className={`${btn} gap-1`} onClick={() => setMenu(menu === 'list' ? null : 'list')} aria-label="Lists">
              {I.list}{I.caret}
            </button>
            <Menu open={menu === 'list'} onClose={closeMenu}>
              <MenuItem icon={I.list} active={editor.isActive('bulletList')} onClick={run(() => chain().toggleBulletList().run())}>Bulleted list</MenuItem>
              <MenuItem icon={<span className="text-xs">1.</span>} active={editor.isActive('orderedList')} onClick={run(() => chain().toggleOrderedList().run())}>Numbered list</MenuItem>
              <MenuItem icon={I.check} active={editor.isActive('taskList')} onClick={run(() => chain().toggleTaskList().run())}>Checklist</MenuItem>
            </Menu>
          </div>
          <span className="mx-0.5 h-5 w-px bg-line" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            className={`${btn} ${editor.isActive('link') ? btnOn : ''}`}
            aria-label="Link"
            onClick={() => {
              if (editor.isActive('link')) return void chain().unsetLink().run();
              const href = window.prompt('Link address (https://…)');
              if (href && /^(https?:\/\/|mailto:)/i.test(href.trim())) chain().setLink({ href: href.trim() }).run();
            }}
          >
            {I.link}
          </button>
        </div>
      </BubbleMenu>

      <div className={`doc doc-h-${settings.headingFont} doc-t-${settings.textFont}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}