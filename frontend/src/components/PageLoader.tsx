import { Loader2 } from 'lucide-react';

// Shown briefly while a lazily-loaded page's JavaScript is being fetched.
// Keeps navigation feeling instant instead of showing a blank white screen.
export default function PageLoader() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Loader2 className="w-7 h-7 animate-spin text-primary" />
    </div>
  );
}
