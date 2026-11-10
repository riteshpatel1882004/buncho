'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { progress } from '@/lib/progress';

// Should this fetch show the loading bar?
//  - Server actions (Next-Action header)
//  - Route fetches triggered by navigation or router.refresh (RSC header, but not background prefetches)
//  - Same-origin POST/PUT/PATCH/DELETE calls to /api/*
function shouldTrack(input, init) {
  try {
    const req = typeof Request !== 'undefined' && input instanceof Request ? input : null;
    const headers = new Headers(init?.headers ?? req?.headers ?? undefined);
    if (headers.has('next-router-prefetch') || headers.has('next-router-segment-prefetch')) return false;
    if (headers.has('next-action')) return true;
    if (headers.get('rsc')) return true;

    const method = String(init?.method ?? req?.method ?? 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD') return false;
    const url = new URL(req ? req.url : String(input), window.location.href);
    return url.origin === window.location.origin && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export default function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const busy = useSyncExternalStore(progress.subscribe, progress.isBusy, () => false);

  const [width, setWidth] = useState(0); // 0 to 1
  const [visible, setVisible] = useState(false);
  const shown = useRef(false);
  const lastUrl = useRef('');

  // The URL changed, so the navigation has finished rendering its first screen.
  useEffect(() => {
    lastUrl.current = `${pathname}?${search}`;
    progress.endNav();
  }, [pathname, search]);

  // Detect link clicks and back/forward navigation, and track in-flight requests.
  useEffect(() => {
    function onClick(e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      // Next's <Link> calls preventDefault for client-side navigation; plain anchors do a full page load.
      setTimeout(() => {
        if (e.defaultPrevented) progress.startNav();
      }, 0);
    }

    function onPop() {
      if (lastUrl.current !== `${window.location.pathname}?${window.location.search.replace(/^\?/, '')}`) {
        progress.startNav();
      }
    }

    const originalFetch = window.fetch;
    window.fetch = function patchedFetch(input, init) {
      if (!shouldTrack(input, init)) return originalFetch.call(this, input, init);
      progress.start();
      return originalFetch.call(this, input, init).finally(progress.done);
    };

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPop);
    return () => {
      window.fetch = originalFetch;
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  // Drive the bar. It only appears if work takes longer than 120ms, so quick actions don't flicker.
  useEffect(() => {
    document.documentElement.dataset.busy = busy ? 'true' : 'false';

    if (busy) {
      let trickle;
      const show = setTimeout(() => {
        shown.current = true;
        setVisible(true);
        setWidth(0.15);
        trickle = setInterval(() => setWidth((w) => w + (0.9 - w) * 0.08), 250);
      }, 120);
      return () => {
        clearTimeout(show);
        clearInterval(trickle);
      };
    }

    if (shown.current) {
      shown.current = false;
      setWidth(1);
      const hide = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
      return () => clearTimeout(hide);
    }
  }, [busy]);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
      >
        <div
          className="h-full origin-left bg-accent"
          style={{
            transform: `scaleX(${width})`,
            transition: width === 0 ? 'none' : 'transform 250ms ease-out',
            boxShadow: '0 0 10px var(--accent)',
          }}
        />
      </div>
      <div role="status" aria-live="polite" className="sr-only">{busy ? 'Loading' : ''}</div>
    </>
  );
}