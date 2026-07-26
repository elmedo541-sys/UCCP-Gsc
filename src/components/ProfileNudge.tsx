import { useNavigate } from 'react-router-dom';
import { X, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileNudgeProps {
  missingFields: string[];
  onDismiss: () => void;
}

// Encourages members to fill in the profile fields that matter most for
// feeling connected to the community (photo, phone) without being pushy —
// dismissible, and only shown when something is actually missing.
export default function ProfileNudge({ missingFields, onDismiss }: ProfileNudgeProps) {
  const navigate = useNavigate();

  if (missingFields.length === 0) return null;

  return (
    <div className="bg-card border border-dashed border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0">
          <UserCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-sm text-foreground min-w-0">
          <span className="font-semibold">Complete your profile</span>{' '}
          <span className="text-muted-foreground">
            — add your {missingFields.join(' and ')} so your church family can recognize you.
          </span>
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button size="sm" variant="outline" onClick={() => navigate('/user/profile')} className="rounded-full">
          Update
        </Button>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors p-1.5">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
