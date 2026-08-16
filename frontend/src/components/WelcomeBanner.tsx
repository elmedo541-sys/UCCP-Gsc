import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface WelcomeBannerProps {
  personId: string;
  firstName: string;
}

// Shows a warm "Welcome back" message once per browser session per person,
// so it doesn't nag on every single page navigation.
export default function WelcomeBanner({ personId, firstName }: WelcomeBannerProps) {
  const storageKey = `welcomed_${personId}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(storageKey);
    if (!alreadyShown) {
      setVisible(true);
      sessionStorage.setItem(storageKey, '1');
    }
  }, [storageKey]);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <p className="text-sm text-foreground">
          <span className="font-semibold">Welcome back, {firstName}!</span>{' '}
          <span className="text-muted-foreground">Here's what's new with your church family.</span>
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
