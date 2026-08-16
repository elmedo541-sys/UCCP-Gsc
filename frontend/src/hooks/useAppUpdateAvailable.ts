import { useEffect, useRef, useState } from 'react';

/**
 * Polls the deployed index.html and compares its referenced JS bundle
 * against the one currently loaded in this tab. When Vercel ships a new
 * build, the hashed script filename changes, so a mismatch means an
 * update has gone live — no build-config changes required.
 */
export function useAppUpdateAvailable(pollMs = 60000) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const currentBundleRef = useRef<string | null>(null);

  useEffect(() => {
    const extractBundleSrc = (html: string): string | null => {
      const match = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/i);
      return match ? match[1] : null;
    };

    // Capture what's currently loaded, from the live document itself.
    const liveScript = document.querySelector('script[type="module"]');
    currentBundleRef.current = liveScript?.getAttribute('src') ?? null;

    const checkForUpdate = async () => {
      try {
        const res = await fetch(`/index.html?_=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const html = await res.text();
        const latestBundle = extractBundleSrc(html);
        if (latestBundle && currentBundleRef.current && latestBundle !== currentBundleRef.current) {
          setUpdateAvailable(true);
        }
      } catch {
        // Network hiccup or offline — just try again next interval.
      }
    };

    const interval = setInterval(checkForUpdate, pollMs);
    // Also check once shortly after mount, and whenever the tab regains focus.
    const onFocus = () => checkForUpdate();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [pollMs]);

  return updateAvailable;
}
