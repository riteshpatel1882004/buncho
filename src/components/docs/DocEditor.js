'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { buildExtensions } from '@/lib/docs/extensions';
import { saveTab } from '@/app/docs-actions';
import { cleanClipboardTables, hasForeignTable, stripForeignColors } from '@/lib/docs/paste';

const MAX_IMAGE_BYTES = 1_500_000;
const AUTOSAVE_MS = 800; // wait this long after the last edit, then save
const MODE_KEY = 'docs-editor-mode'; // 'edit' | 'read' (remembered in this browser)
const TOOLS_KEY = 'docs-editor-tools'; // 'open' | 'closed'

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
  tt: (
    <Icon>
      <path d="M4 7V5h10v2M9 5v12M16 12v-1h5v1M18.5 11v6" />
    </Icon>
  ),
  wide: (
    <Icon>
      <path d="M4 12h6M20 12h-6M7 9l3 3-3 3M17 9l-3 3 3 3" />
    </Icon>
  ),
  table: (
    <Icon>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 4v16" />
    </Icon>
  ),
  image: (
    <Icon>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 16l-5-5-9 9" />
    </Icon>
  ),
  check: (
    <Icon>
      <path d="M4 7l2 2 3-3M4 17l2 2 3-3M13 8h8M13 18h8" />
    </Icon>
  ),
  plus: (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  ),
  list: (
    <Icon>
      <path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </Icon>
  ),
  palette: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <circle cx="8" cy="11" r="1" />
      <circle cx="12" cy="7.5" r="1" />
      <circle cx="16" cy="11" r="1" />
    </Icon>
  ),
  link: (
    <Icon>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </Icon>
  ),
  eye: (
    <Icon>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  ),
  pencil: (
    <Icon>
      <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
    </Icon>
  ),
  caret: (
    <Icon size={12}>
      <path d="M6 9l6 6 6-6" />
    </Icon>
  ),
};

// rail: the menu belongs to the vertical toolbar on the right, so it opens towards the left instead of downwards
function Menu({ open, onClose, children, className = '', rail = false }) {
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
    <div
      ref={ref}
      className={`absolute z-40 min-w-48 rounded-xl border border-line bg-surface p-1.5 shadow-xl ${rail ? 'right-full top-0 mr-2' : 'left-0 top-full mt-1.5'} ${className}`}
    >
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
export default function DocEditor({ slug, title, initialCount, initialContent, initialSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [message, setMessage] = useState(null);
  const [menu, setMenu] = useState(null); // 'font' | 'image' | 'plus' | 'style' | 'color' | 'list'
  // Reading mode: the page is locked, so a stray key press or click can never change it. Starts locked.
  const [readOnly, setReadOnly] = useState(true);
  // The toolbar is folded away until you click the header bar, which saves space
  const [toolsOpen, setToolsOpen] = useState(false);
  const fileRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Autosave bookkeeping. Refs, because the editor callbacks and timers must always see the latest values.
  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);
  const revRef = useRef(0); // bumped on every edit, so a save knows whether more edits arrived while it ran
  const mountedRef = useRef(true);
  const saveRef = useRef(null);
  const touchRef = useRef(null);
  const readOnlyRef = useRef(true);

  // Declared BEFORE useEditor on purpose: React runs cleanups in order, so this one still sees a live editor.
  // It saves what is still unsaved when you click another tab or leave the page.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
      if (dirtyRef.current && editorRef.current) saveRef.current?.({ auto: true });
    };
  }, []);

  const extensions = useMemo(() => buildExtensions({ placeholder: 'Start writing. Every Heading 2 becomes a question in the list.' }), []);

  const editor = useEditor({
    extensions,
    content: initialContent,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: () => touchRef.current?.(),
    onCreate: ({ editor: e }) => e.view.dispatch(e.state.tr.setMeta('ensureIds', true).setMeta('addToHistory', false)),
    editorProps: {
      // Drop the other site's text colour / background so pasted text stays readable on this theme
      transformPastedHTML: (html) => stripForeignColors(html),
      handlePaste(view, event) {
        const file = [...(event.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
        if (file) {
          insertImageFile(file);
          return true;
        }
        // Tables copied from a website or chat page: rebuild them in the editor's own table shape, then insert.
        const html = event.clipboardData?.getData('text/html');
        const ed = editorRef.current;
        if (ed && hasForeignTable(html)) {
          const clean = cleanClipboardTables(html);
          // Pasting while the cursor is inside a table would try to overwrite its cells, so go just below that table instead
          let pos = null;
          const { $from } = ed.state.selection;
          for (let d = $from.depth; d > 0; d -= 1) {
            if ($from.node(d).type.name === 'table') {
              pos = $from.after(d);
              break;
            }
          }
          if (pos === null) ed.chain().focus().insertContent(clean).run();
          else ed.chain().focus().insertContentAt(pos, clean).run();
          return true;
        }
        return false;
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
  editorRef.current = editor;
  readOnlyRef.current = readOnly;

  // Remember the last mode used in this browser
  useEffect(() => {
    try {
      if (localStorage.getItem(MODE_KEY) === 'edit') setReadOnly(false);
      if (localStorage.getItem(TOOLS_KEY) === 'open') setToolsOpen(true);
    } catch {
      /* storage blocked: stay in reading mode */
    }
  }, []);

  // Lock / unlock the editor. `false` = do not count the switch itself as an edit.
  useEffect(() => {
    if (editor) editor.setEditable(!readOnly, false);
    if (readOnly) setMenu(null);
  }, [editor, readOnly]);

  const toggleTools = () => {
    if (readOnly) return;
    const next = !toolsOpen;
    setToolsOpen(next);
    setMenu(null);
    try {
      localStorage.setItem(TOOLS_KEY, next ? 'open' : 'closed');
    } catch {
      /* ignore */
    }
  };

  const setMode = (readMode) => {
    if (readMode) {
      // Make sure nothing is left unsaved before locking
      clearTimeout(timerRef.current);
      if (dirtyRef.current) saveRef.current?.({ auto: true });
    }
    setReadOnly(readMode);
    try {
      localStorage.setItem(MODE_KEY, readMode ? 'read' : 'edit');
    } catch {
      /* ignore */
    }
  };

  const closeMenu = useCallback(() => setMenu(null), []);

  function insertImageFile(file) {
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage({ type: 'error', text: 'That image is over 1.5 MB. Use a smaller one, or paste an image link instead.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      editorRef.current
        ?.chain()
        .focus()
        .setImage({ src: String(reader.result) })
        .run();
    reader.readAsDataURL(file);
  }

  // One save routine for the Save button, Ctrl+S and autosave
  const save = useCallback(
    async ({ auto = false } = {}) => {
      const ed = editorRef.current;
      if (!ed || savingRef.current) return;
      savingRef.current = true;
      if (mountedRef.current) setSaving(true);
      const rev = revRef.current;
      try {
        // ProseMirror's attrs objects have no prototype, which Next cannot send to a server action ("Cannot access id
        // on the server… temporary client reference"). A JSON round trip turns them into plain objects.
        const plainDoc = JSON.parse(JSON.stringify(ed.getJSON()));
        const res = await saveTab(slug, plainDoc, { ...settingsRef.current });
        if (!mountedRef.current) return;
        if (res.ok) {
          if (revRef.current === rev) {
            dirtyRef.current = false;
            setDirty(false);
          }
          setCount(res.questions);
          setMessage(auto ? null : { type: 'ok', text: `Saved. ${res.questions} question${res.questions === 1 ? '' : 's'} in this tab.` });
          if (!auto) router.refresh();
        } else {
          setMessage({ type: 'error', text: `Autosave failed: ${res.error}` });
        }
      } catch (e) {
        if (mountedRef.current) setMessage({ type: 'error', text: `Could not save: ${e.message}` });
      } finally {
        savingRef.current = false;
        if (mountedRef.current) setSaving(false);
      }
    },
    [slug, router],
  );
  saveRef.current = save;

  // Called after every edit (typing, formatting, tables, images, font / layout settings)
  touchRef.current = () => {
    revRef.current += 1;
    dirtyRef.current = true;
    setDirty(true);
    setMessage((m) => (m?.type === 'error' ? m : null));
    clearTimeout(timerRef.current);
    const tick = () => {
      if (savingRef.current)
        timerRef.current = setTimeout(tick, 400); // a save is running: try again shortly
      else saveRef.current?.({ auto: true });
    };
    timerRef.current = setTimeout(tick, AUTOSAVE_MS);
  };

  // Ctrl/Cmd+S saves now; warn before closing the tab with unsaved changes
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (readOnlyRef.current) return;
        clearTimeout(timerRef.current);
        save();
      }
    };
    const onLeave = (e) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onLeave);
    };
  }, [save]);

  const changeSetting = (patch) => {
    settingsRef.current = { ...settingsRef.current, ...patch };
    setSettings((s) => ({ ...s, ...patch }));
    touchRef.current?.();
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
      {/* Slim header: click the title bar to fold the toolbar in or out. Only this bar stays on screen while scrolling. */}
      <div className="sticky top-[4.75rem] z-30 -mx-2 mb-4 bg-bg px-2 pt-1">
        <div className="flex items-center gap-2 border-b border-line py-1.5">
          <button
            type="button"
            onClick={toggleTools}
            aria-expanded={toolsOpen && !readOnly}
            disabled={readOnly}
            title={readOnly ? 'Reading mode: click Edit to unlock' : toolsOpen ? 'Hide the toolbar' : 'Show the toolbar'}
            className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left ${readOnly ? 'cursor-default' : 'hover:bg-surface-2'}`}
          >
            {!readOnly && <span className={`text-muted transition-transform ${toolsOpen ? 'rotate-180' : ''}`}>{I.caret}</span>}
            <span className="truncate text-sm font-medium text-muted">
              {title}{' '}
              <span className="font-normal">
                · {count} question{count === 1 ? '' : 's'}
              </span>
            </span>
            <span className="hidden shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent sm:inline">Admin editing</span>
            {!readOnly && <span className="hidden shrink-0 text-xs text-muted md:inline">{toolsOpen ? 'Hide tools' : 'Show tools'}</span>}
          </button>
          <div className="flex shrink-0 items-center gap-3">
            {message && (
              <span role="status" className={`text-xs ${message.type === 'error' ? 'text-hard' : 'text-muted'}`}>
                {message.text}
              </span>
            )}
            {!readOnly && <span className="text-xs text-muted">{saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'All changes saved'}</span>}
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  clearTimeout(timerRef.current);
                  save();
                }}
                disabled={saving || !dirty}
                className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode(!readOnly)}
              aria-pressed={readOnly}
              title={readOnly ? 'Switch to editing' : 'Switch to reading mode (locks the page)'}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${readOnly ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:bg-surface-2 hover:text-ink'}`}
            >
              {readOnly ? I.pencil : I.eye}
              {readOnly ? 'Edit' : 'Reading mode'}
            </button>
          </div>
        </div>

        {/* Table tools, only while the cursor is in a table */}
        {!readOnly && editor.isActive('table') && (
          <div className="mt-2 flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs">
            <span className="mr-1 text-muted">Table</span>
            {[
              ['Row above', () => chain().addRowBefore().run()],
              ['Row below', () => chain().addRowAfter().run()],
              ['Column left', () => chain().addColumnBefore().run()],
              ['Column right', () => chain().addColumnAfter().run()],
              ['Delete row', () => chain().deleteRow().run()],
              ['Delete column', () => chain().deleteColumn().run()],
              ['Delete table', () => chain().deleteTable().run()],
              ['Toggle header row', () => chain().toggleHeaderRow().run()],
            ].map(([label, fn]) => (
              <button key={label} type="button" onClick={fn} className="rounded-md px-2 py-1 hover:bg-surface-2">
                {label}
              </button>
            ))}
            <span className="ml-auto text-muted">Drag a column edge to resize it</span>
          </div>
        )}
      </div>

      {/* Floating toolbar on selected text */}
      <BubbleMenu editor={editor} options={BUBBLE_OPTIONS} shouldShow={showBubble}>
        <div className="flex items-center gap-0.5 rounded-xl border border-line bg-surface p-1 shadow-xl">
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              className={`${btn} gap-1`}
              onClick={() => setMenu(menu === 'style' ? null : 'style')}
              aria-label="Text style"
            >
              <span className="text-xs font-semibold">{styleLabel}</span>
              {I.caret}
            </button>
            <Menu open={menu === 'style'} onClose={closeMenu}>
              <MenuItem active={styleLabel === 'T'} icon={<span className="text-xs">T</span>} onClick={run(() => chain().setParagraph().run())}>
                Text
              </MenuItem>
              <MenuItem active={styleLabel === 'H1'} icon={<H n={1} />} onClick={run(() => chain().setHeading({ level: 1 }).run())}>
                Heading 1
              </MenuItem>
              <MenuItem active={styleLabel === 'H2'} icon={<H n={2} />} onClick={run(() => chain().setHeading({ level: 2 }).run())}>
                Heading 2
              </MenuItem>
              <MenuItem active={styleLabel === 'H3'} icon={<H n={3} />} onClick={run(() => chain().setHeading({ level: 3 }).run())}>
                Heading 3
              </MenuItem>
            </Menu>
          </div>
          <span className="mx-0.5 h-5 w-px bg-line" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            className={`${btn} ${editor.isActive('bold') ? btnOn : ''} font-bold`}
            onClick={() => chain().toggleBold().run()}
            aria-label="Bold"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            className={`${btn} ${editor.isActive('italic') ? btnOn : ''} italic`}
            onClick={() => chain().toggleItalic().run()}
            aria-label="Italic"
          >
            I
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            className={`${btn} ${editor.isActive('underline') ? btnOn : ''} underline`}
            onClick={() => chain().toggleUnderline().run()}
            aria-label="Underline"
          >
            U
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            className={`${btn} ${editor.isActive('strike') ? btnOn : ''} line-through`}
            onClick={() => chain().toggleStrike().run()}
            aria-label="Strikethrough"
          >
            S
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            className={`${btn} ${editor.isActive('code') ? btnOn : ''} font-mono`}
            onClick={() => chain().toggleCode().run()}
            aria-label="Inline code"
          >
            {'{}'}
          </button>
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              className={`${btn} gap-1`}
              onClick={() => setMenu(menu === 'color' ? null : 'color')}
              aria-label="Colours"
            >
              {I.palette}
              {I.caret}
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
              {I.list}
              {I.caret}
            </button>
            <Menu open={menu === 'list'} onClose={closeMenu}>
              <MenuItem icon={I.list} active={editor.isActive('bulletList')} onClick={run(() => chain().toggleBulletList().run())}>
                Bulleted list
              </MenuItem>
              <MenuItem icon={<span className="text-xs">1.</span>} active={editor.isActive('orderedList')} onClick={run(() => chain().toggleOrderedList().run())}>
                Numbered list
              </MenuItem>
              <MenuItem icon={I.check} active={editor.isActive('taskList')} onClick={run(() => chain().toggleTaskList().run())}>
                Checklist
              </MenuItem>
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

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {readOnly && <p className="mb-3 text-xs text-muted">Reading mode: the page is locked and nothing can be changed. Click Edit to make changes.</p>}
          <div className={`doc doc-h-${settings.headingFont} doc-t-${settings.textFont}`}>
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Vertical toolbar on the right: folded away until the title bar is clicked */}
        {!readOnly && toolsOpen && (
          <aside
            aria-label="Editing tools"
            className="sticky top-[9rem] z-20 flex w-11 shrink-0 flex-col items-center gap-1 self-start rounded-xl border border-line bg-surface p-1"
          >
            <div className="relative">
              <button type="button" className={`${btn} ${menu === 'font' ? btnOn : ''}`} aria-label="Fonts" title="Fonts" onClick={() => setMenu(menu === 'font' ? null : 'font')}>
                {I.tt}
              </button>
              <Menu rail open={menu === 'font'} onClose={closeMenu}>
                <Label>Headings</Label>
                <MenuItem active={settings.headingFont === 'serif'} onClick={() => changeSetting({ headingFont: 'serif' })}>
                  <span style={{ fontFamily: 'Georgia, serif' }}>Serif</span>
                </MenuItem>
                <MenuItem active={settings.headingFont === 'sans'} onClick={() => changeSetting({ headingFont: 'sans' })}>
                  Sans
                </MenuItem>
                <div className="my-1 border-t border-line" />
                <Label>Text</Label>
                <MenuItem active={settings.textFont === 'serif'} onClick={() => changeSetting({ textFont: 'serif' })}>
                  <span style={{ fontFamily: 'Georgia, serif' }}>Serif</span>
                </MenuItem>
                <MenuItem active={settings.textFont === 'sans'} onClick={() => changeSetting({ textFont: 'sans' })}>
                  Sans
                </MenuItem>
              </Menu>
            </div>

            <button
              type="button"
              className={`${btn} ${settings.wide ? btnOn : ''}`}
              aria-label="Wide layout"
              title="Wide layout"
              onClick={() => changeSetting({ wide: !settings.wide })}
            >
              {I.wide}
            </button>

            <span className="my-1 h-px w-5 bg-line" />

            <button type="button" className={btn} aria-label="Table" title="Table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
              {I.table}
            </button>

            <div className="relative">
              <button
                type="button"
                className={`${btn} ${menu === 'image' ? btnOn : ''}`}
                aria-label="Image"
                title="Image"
                onClick={() => setMenu(menu === 'image' ? null : 'image')}
              >
                {I.image}
              </button>
              <Menu rail open={menu === 'image'} onClose={closeMenu}>
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    fileRef.current?.click();
                  }}
                >
                  Upload from device
                </MenuItem>
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

            <button
              type="button"
              className={`${btn} ${editor.isActive('taskList') ? btnOn : ''}`}
              aria-label="Checklist"
              title="Checklist (Ctrl+Shift+9)"
              onClick={() => chain().toggleTaskList().run()}
            >
              {I.check}
            </button>

            <div className="relative">
              <button
                type="button"
                className={`${btn} gap-1 ${menu === 'plus' ? btnOn : ''}`}
                aria-label="Insert"
                title="Insert"
                onClick={() => setMenu(menu === 'plus' ? null : 'plus')}
              >
                {I.plus}
                {I.caret}
              </button>
              <Menu rail open={menu === 'plus'} onClose={closeMenu} className="max-h-96 overflow-y-auto">
                <MenuItem icon={I.list} onClick={run(() => chain().toggleBulletList().run())}>
                  Bulleted list
                </MenuItem>
                <MenuItem icon={I.check} onClick={run(() => chain().toggleTaskList().run())}>
                  Checklist
                </MenuItem>
                <MenuItem icon={<span className="text-xs">{'<>'}</span>} onClick={run(() => chain().toggleCodeBlock().run())}>
                  Code block (Python)
                </MenuItem>
                <MenuItem icon={<span className="text-xs">▦</span>} onClick={run(() => chain().insertContent(today()).run())}>
                  Date
                </MenuItem>
                <MenuItem icon={<span>—</span>} onClick={run(() => chain().setHorizontalRule().run())}>
                  Divider
                </MenuItem>
                <MenuItem icon={<span className="text-xs">▾</span>} onClick={run(() => chain().setDetails().run())}>
                  Dropdown
                </MenuItem>
                <MenuItem icon={<H n={1} />} onClick={run(() => chain().toggleHeading({ level: 1 }).run())}>
                  Heading 1
                </MenuItem>
                <MenuItem icon={<H n={2} />} onClick={run(() => chain().toggleHeading({ level: 2 }).run())}>
                  Heading 2 (a question)
                </MenuItem>
                <MenuItem icon={<H n={3} />} onClick={run(() => chain().toggleHeading({ level: 3 }).run())}>
                  Heading 3
                </MenuItem>
                <MenuItem icon={<span className="text-xs">1.</span>} onClick={run(() => chain().toggleOrderedList().run())}>
                  Numbered list
                </MenuItem>
                <MenuItem icon={<span className="text-xs">❝</span>} onClick={run(() => chain().toggleBlockquote().run())}>
                  Quote
                </MenuItem>
              </Menu>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}