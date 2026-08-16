import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Calendar, Heart, Film, X } from 'lucide-react';

interface OnboardingTourProps {
  personId: string;
  firstName: string;
}

const STEPS = [
  {
    icon: MessageSquare,
    color: 'bg-indigo-100 text-indigo-600',
    title: 'Community Feed',
    body: 'Share updates, photos, and moments with your church family — and see what everyone else is up to.',
  },
  {
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
    title: 'Member Directory',
    body: 'Look up any member of the congregation and reconnect with familiar faces.',
  },
  {
    icon: Calendar,
    color: 'bg-purple-100 text-purple-600',
    title: 'Events',
    body: "Never miss a service, activity, or celebration — it's all here with dates and locations.",
  },
  {
    icon: Heart,
    color: 'bg-rose-100 text-rose-600',
    title: 'Prayer Wall',
    body: 'Share a prayer request or lift someone else up — your church family is here for you.',
  },
  {
    icon: Film,
    color: 'bg-green-100 text-green-600',
    title: 'Media Gallery',
    body: 'Browse photos and videos from past events, gatherings, and celebrations.',
  },
];

// A one-time welcome tour shown the very first time a member logs in,
// briefly introducing the main sections of the app. Never shown again
// after the first pass (tracked per-person in localStorage).
export default function OnboardingTour({ personId, firstName }: OnboardingTourProps) {
  const storageKey = `onboarded_${personId}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) setOpen(true);
  }, [storageKey]);

  const finish = () => {
    localStorage.setItem(storageKey, '1');
    setOpen(false);
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && finish()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <button
          onClick={finish}
          className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 text-center">
          {step === 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              Welcome, {firstName}! Here's a quick look around.
            </p>
          )}

          <div className={`w-16 h-16 rounded-2xl ${current.color} flex items-center justify-center mx-auto mb-4`}>
            <current.icon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1.5">{current.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-5 mb-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-6 pb-6">
          <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={() => (isLast ? finish() : setStep(s => s + 1))}>
              {isLast ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}