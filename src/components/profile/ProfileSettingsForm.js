'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { checkUsername, saveProfileSettings } from '@/app/profile-actions';
import { normalizeUsername, USERNAME_MAX, validateUsername } from '@/lib/username-rules';
import ShareProfile from './ShareProfile';

const input =
  'mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-[color:var(--accent)]/25 disabled:cursor-not-allowed disabled:opacity-60';
const label = 'block text-sm font-medium';
const hint = 'mt-1 text-xs text-muted';

function Toggle({ checked, onChange, title, desc }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line p-3.5 hover:bg-surface-2/60">
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{desc}</span>
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full bg-line transition peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--accent)]/50" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/**
 * initial: the saved profile fields. siteUrl: e.g. https://buncho.live (no trailing slash).
 * lockedDays: days left before the username can change again (0 = free). suggestions: free names for first-time setup.
 */
export default function ProfileSettingsForm({ initial, siteUrl, lockedDays = 0, suggestions = [] }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [check, setCheck] = useState({ state: 'idle', message: '', suggestions: [] });
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(initial.username || '');
  const [pending, start] = useTransition();
  const reqId = useRef(0);

  const set = (key) => (e) => setF((prev) => ({ ...prev, [key]: e.target.value }));
  const setBool = (key) => (val) => setF((prev) => ({ ...prev, [key]: val }));
  const locked = Boolean(saved) && lockedDays > 0;
  const cleaned = normalizeUsername(f.username);

  // Debounced live availability check. Format errors are caught locally, with no server call.
  useEffect(() => {
    if (locked || !cleaned || cleaned === saved) {
      setCheck({ state: cleaned && cleaned === saved ? 'same' : 'idle', message: cleaned === saved && cleaned ? 'This is your current username.' : '', suggestions: [] });
      return undefined;
    }
    const local = validateUsername(cleaned);
    if (!local.ok) {
      setCheck({ state: 'invalid', message: local.error, suggestions: [] });
      return undefined;
    }
    setCheck({ state: 'checking', message: 'Checking…', suggestions: [] });
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const res = await checkUsername(cleaned);
        if (id !== reqId.current) return; // a newer keystroke already replaced this request
        setCheck(res.ok ? { state: res.state, message: res.message, suggestions: res.suggestions ?? [] } : { state: 'invalid', message: res.error, suggestions: [] });
      } catch {
        if (id === reqId.current) setCheck({ state: 'idle', message: '', suggestions: [] });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [cleaned, saved, locked]);

  const blocked = !locked && ['invalid', 'taken', 'checking'].includes(check.state);
  const tone =
    check.state === 'available' || check.state === 'same' ? 'text-easy' : check.state === 'checking' ? 'text-muted' : 'text-hard';

  function onSubmit(e) {
    e.preventDefault();
    setResult(null);
    start(async () => {
      const res = await saveProfileSettings({ ...f, username: cleaned });
      setResult(res);
      if (res.ok) {
        setSaved(res.username);
        setF((prev) => ({ ...prev, username: res.username }));
        router.refresh();
      }
    });
  }

  const url = `${siteUrl}/user/${saved || cleaned || 'your-name'}`;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Username */}
      <section className="card p-5 sm:p-6" aria-labelledby="u-h">
        <h2 id="u-h" className="text-base font-semibold tracking-tight">Your unique username</h2>
        <p className="mt-1 text-sm text-muted">This becomes your public link. Letters, numbers, hyphens and underscores, up to {USERNAME_MAX} characters.</p>

        <label htmlFor="username" className={`${label} mt-4`}>Username</label>
        <div className="mt-1.5 flex items-stretch overflow-hidden rounded-lg border border-line bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-[color:var(--accent)]/25">
          <span className="hidden select-none items-center bg-surface-2 px-3 text-sm text-muted sm:flex">{siteUrl.replace(/^https?:\/\//, '')}/user/</span>
          <input
            id="username"
            value={f.username}
            onChange={set('username')}
            disabled={locked}
            maxLength={USERNAME_MAX + 1}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            placeholder="your-name"
            aria-describedby="username-status"
            aria-invalid={check.state === 'invalid' || check.state === 'taken'}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <p id="username-status" aria-live="polite" className={`mt-2 min-h-5 text-sm ${tone}`}>
          {locked ? `You can change your username again in ${lockedDays} day${lockedDays === 1 ? '' : 's'}.` : check.message}
        </p>

        {!locked && check.state === 'taken' && check.suggestions.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Try:</span>
            {check.suggestions.map((s) => (
              <button key={s} type="button" onClick={() => setF((p) => ({ ...p, username: s }))} className="rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-xs hover:border-accent hover:text-accent">
                {s}
              </button>
            ))}
          </div>
        )}
        {!locked && !saved && !cleaned && suggestions.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Ideas:</span>
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => setF((p) => ({ ...p, username: s }))} className="rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-xs hover:border-accent hover:text-accent">
                {s}
              </button>
            ))}
          </div>
        )}

        <p className={`${hint} mt-3`}>
          Your link: <span className="break-all font-mono text-ink">{url}</span>
        </p>
        {!locked && saved && <p className={hint}>You can change your username once every 30 days. Your old link stops working right away.</p>}
      </section>

      {/* About */}
      <section className="card p-5 sm:p-6" aria-labelledby="a-h">
        <h2 id="a-h" className="text-base font-semibold tracking-tight">About you</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profileName" className={label}>Display name</label>
            <input id="profileName" value={f.profileName} onChange={set('profileName')} maxLength={40} placeholder="Shown instead of your account name" className={input} />
            <p className={hint}>Leave empty to show your first name and last initial.</p>
          </div>
          <div>
            <label htmlFor="headline" className={label}>Headline</label>
            <input id="headline" value={f.headline} onChange={set('headline')} maxLength={80} placeholder="Aspiring AI Engineer · RAG · Agents" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="bio" className={label}>Bio</label>
            <textarea id="bio" value={f.bio} onChange={set('bio')} maxLength={280} rows={3} placeholder="What are you building or preparing for?" className={`${input} resize-y`} />
            <p className={`${hint} text-right`}>{f.bio.length}/280</p>
          </div>
          <div>
            <label htmlFor="location" className={label}>Location</label>
            <input id="location" value={f.location} onChange={set('location')} maxLength={60} placeholder="Noida, India" className={input} />
          </div>
          <div>
            <label htmlFor="website" className={label}>Website</label>
            <input id="website" value={f.website} onChange={set('website')} maxLength={200} inputMode="url" placeholder="https://your-portfolio.dev" className={input} />
          </div>
          <div>
            <label htmlFor="githubHandle" className={label}>GitHub</label>
            <input id="githubHandle" value={f.githubHandle} onChange={set('githubHandle')} maxLength={200} placeholder="username" className={input} />
          </div>
          <div>
            <label htmlFor="linkedinHandle" className={label}>LinkedIn</label>
            <input id="linkedinHandle" value={f.linkedinHandle} onChange={set('linkedinHandle')} maxLength={200} placeholder="the part after linkedin.com/in/" className={input} />
          </div>
          <div>
            <label htmlFor="xHandle" className={label}>X (Twitter)</label>
            <input id="xHandle" value={f.xHandle} onChange={set('xHandle')} maxLength={200} placeholder="@handle" className={input} />
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="card p-5 sm:p-6" aria-labelledby="p-h">
        <h2 id="p-h" className="text-base font-semibold tracking-tight">Privacy</h2>
        <p className="mt-1 text-sm text-muted">You decide what visitors see. Your email and private answers are never shown.</p>
        <div className="mt-4 space-y-3">
          <Toggle checked={f.profilePublic} onChange={setBool('profilePublic')} title="Profile is public" desc="Anyone with your link can view it. Turn off to make the page visible only to you." />
          <Toggle checked={f.showStats} onChange={setBool('showStats')} title="Show level, stats and badges" desc="Solved count, streak, topic strengths and the activity grid." />
         
        </div>
      </section>

      {/* Save */}
      <div className="sticky bottom-[calc(var(--bottom-nav-h)+0.75rem)] z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/95 p-3 shadow-lg backdrop-blur md:bottom-4">
        <button type="submit" disabled={pending || blocked} className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-ink hover:opacity-90 disabled:opacity-50">
          {pending ? 'Saving…' : saved ? 'Save changes' : 'Create my profile'}
        </button>
        {saved && (
          <Link href={`/user/${saved}`} className="rounded-lg bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-line">
            View public page
          </Link>
        )}
        {result && (
          <p role={result.ok ? 'status' : 'alert'} className={`text-sm ${result.ok ? 'text-easy' : 'text-hard'}`}>
            {result.ok ? 'Saved. Your profile is live.' : result.error}
          </p>
        )}
      </div>

      {saved && (
        <section className="card p-5 sm:p-6" aria-labelledby="s-h">
          <h2 id="s-h" className="text-base font-semibold tracking-tight">Share your profile</h2>
          <p className="mt-1 text-sm text-muted">Send it to recruiters, add it to your resume or put the badge in your GitHub README.</p>
          <div className="mt-4">
            <ShareProfile url={`${siteUrl}/user/${saved}`} name={f.profileName || 'my'} owner />
          </div>
        </section>
      )}
    </form>
  );
}