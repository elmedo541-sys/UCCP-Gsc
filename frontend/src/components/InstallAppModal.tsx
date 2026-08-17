import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { triggerInstallPrompt, isIOS } from '@/lib/installPrompt';
import { Download, Share, SquarePlus, X, CheckCircle2, MoreVertical } from 'lucide-react';

interface InstallAppModalProps {
  open: boolean;
  onClose: () => void;
}

// Shown right after a successful login (once per person, ever) to encourage
// installing the site as an app, and also available any time via the
// "Download the App" button on the homepage footer. Chrome/Android gets
// the real native install prompt when it's ready; iOS Safari doesn't
// support that API so we show manual "Share → Add to Home Screen" steps;
// and if the native prompt just isn't ready yet (common on desktop, or
// browsers like Firefox that don't support it), we fall back to generic
// browser-menu instructions rather than silently doing nothing.
export default function InstallAppModal({ open, onClose }: InstallAppModalProps) {
  const [installing, setInstalling] = useState(false);
  const [outcome, setOutcome] = useState<'accepted' | 'dismissed' | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const ios = isIOS();

  const handleInstall = async () => {
    setInstalling(true);
    const result = await triggerInstallPrompt();
    setInstalling(false);
    if (result === 'accepted' || result === 'dismissed') {
      setOutcome(result);
      if (result === 'accepted') {
        setTimeout(onClose, 1500);
      }
    } else {
      // Native prompt isn't available (not ready yet, or unsupported
      // browser) — show manual instructions instead of just closing.
      setShowFallback(true);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset for next time this modal opens.
    setTimeout(() => { setOutcome(null); setShowFallback(false); }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 text-center">
          {outcome === 'accepted' ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">Installed!</h3>
              <p className="text-sm text-muted-foreground">
                Look for the app icon on your home screen.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">Install the App</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Add UCCP-Good Samaritan Church to your home screen for quick,
                one-tap access — no browser bar, just the app.
              </p>

              {(ios || showFallback) ? (
                <div className="text-left bg-muted/50 rounded-xl p-4 space-y-3 mb-2">
                  {ios ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                        <p className="text-sm text-foreground flex items-center gap-1.5">
                          Tap the <Share className="w-4 h-4 inline" /> Share button
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                        <p className="text-sm text-foreground flex items-center gap-1.5">
                          Scroll down and tap <SquarePlus className="w-4 h-4 inline" /> "Add to Home Screen"
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                        <p className="text-sm text-foreground flex items-center gap-1.5">
                          Open your browser's menu <MoreVertical className="w-4 h-4 inline" /> (top right)
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                        <p className="text-sm text-foreground flex items-center gap-1.5">
                          Look for "Install app" or "Add to Home screen"
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClose} className="flex-1">
                  Not now
                </Button>
                {!ios && !showFallback && (
                  <Button size="sm" onClick={handleInstall} disabled={installing} className="flex-1 gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    {installing ? 'Installing…' : 'Install'}
                  </Button>
                )}
                {(ios || showFallback) && (
                  <Button size="sm" onClick={handleClose} className="flex-1">
                    Got it
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}