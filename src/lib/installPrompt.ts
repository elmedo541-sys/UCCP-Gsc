// Captures Chrome/Edge/Android's native "install app" prompt event as early
// as possible (it can only fire once and must be captured before it's used).
// This lives outside React so it works regardless of which component mounts
// first — we just read from it later, e.g. right after a successful login.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Stop Chrome's default mini-infobar so we can show our own UI instead.
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
});

export function canShowInstallPrompt(): boolean {
  return deferredPrompt !== null;
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's own flag for "launched from home screen"
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export async function triggerInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome;
}
