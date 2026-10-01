import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Heart, Loader2, CheckCircle, RotateCcw } from 'lucide-react';

interface AdminSession {
  token: string;
  adminId: string;
  role: string;
  expiresAt: string;
}

interface PrayerRequestRow {
  id: string;
  person_id: string | null;
  requester_name: string;
  request: string;
  is_answered: boolean;
  is_public: boolean;
  created_at: string;
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('admin_session');
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    return session.token;
  } catch {
    return null;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminPrayerRequests() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, isPrayerTeam, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<PrayerRequestRow[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canView = isSuperAdmin || isPrayerTeam;

  const fetchRequests = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoadError(true); setLoading(false); return; }
    setLoading(true); setLoadError(false);
    try {
      const { data, error } = await supabase.rpc('get_prayer_requests', { p_admin_token: token });
      if (error) throw error;
      setRequests((data || []) as PrayerRequestRow[]);
    } catch (error) {
      setLoadError(true);
      toast({
        title: 'Failed to load prayer requests',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    if (!canView) {
      navigate('/admin/dashboard');
      return;
    }
    fetchRequests();
  }, [authLoading, isAdmin, canView, navigate, fetchRequests]);

  const handleToggleAnswered = async (req: PrayerRequestRow) => {
    const token = getToken();
    if (!token) return;
    const next = !req.is_answered;

    setUpdatingId(req.id);
    // Optimistic update
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, is_answered: next } : r));

    try {
      const { error } = await supabase.rpc('update_prayer_request_answered', {
        p_request_id: req.id,
        p_admin_token: token,
        p_is_answered: next,
      });
      if (error) throw error;

      toast({
        title: next ? 'Marked as prayed for' : 'Marked as pending',
        description: `${req.requester_name}'s request was updated.`,
      });
    } catch (error) {
      // Revert on failure
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, is_answered: !next } : r));
      toast({
        title: 'Failed to update request',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="gsc-managed-page gsc-admin-prayer-requests-page min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="gsc-managed-page gsc-admin-prayer-requests-page min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-none">Prayer Requests</h1>
              <p className="text-muted-foreground text-xs mt-0.5">Prayer team access only — view only, no delete</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        {loadError && !loading ? <div role="alert">Could not load prayer requests. <Button variant="outline" onClick={() => fetchRequests()}>Try again</Button></div> : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground font-medium">No prayer requests yet</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {requests.map(r => (
              <div
                key={r.id}
                className={`bg-card border rounded-2xl p-5 transition-all ${
                  r.is_answered
                    ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-foreground text-sm">{r.requester_name}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                      {!r.is_public && (
                        <Badge variant="outline" className="text-xs">Private</Badge>
                      )}
                      {r.is_answered && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-300 text-xs gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Prayed For
                        </Badge>
                      )}
                    </div>
                    <p className="text-foreground/90 text-sm leading-relaxed">{r.request}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={r.is_answered ? 'outline' : 'default'}
                    disabled={updatingId === r.id}
                    onClick={() => handleToggleAnswered(r)}
                    className="gap-1.5 flex-shrink-0"
                  >
                    {updatingId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : r.is_answered ? (
                      <><RotateCcw className="h-3.5 w-3.5" /> Mark Pending</>
                    ) : (
                      <><CheckCircle className="h-3.5 w-3.5" /> Mark Prayed For</>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
