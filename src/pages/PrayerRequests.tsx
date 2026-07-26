import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserAuth } from '@/hooks/useUserAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Heart, Send, CheckCircle, Loader2 } from 'lucide-react';
import ChatSupportWidget from '@/components/ChatSupportWidget';

interface PrayerRequest {
  id: string;
  requester_name: string;
  request: string;
  is_answered: boolean;
  created_at: string;
}

export default function PrayerRequests() {
  const navigate = useNavigate();
  const { isLoggedIn, personId } = useUserAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [request, setRequest] = useState('');

  // Pre-fill name for logged-in users
  useEffect(() => {
    if (!isLoggedIn || !personId) return;
    const fetchName = async () => {
      const { data } = await supabase
        .from('people')
        .select('full_name')
        .eq('uuid', personId)
        .maybeSingle();
      if (data?.full_name) setName(data.full_name);
    };
    fetchName();
  }, [isLoggedIn, personId]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('prayer_requests')
      .select('id, requester_name, request, is_answered, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    setRequests((data || []) as PrayerRequest[]);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !request.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('prayer_requests').insert({
      requester_name: name.trim(),
      request: request.trim(),
      person_id: personId ?? null,
      is_public: true,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: 'Could not submit request.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Prayer request submitted', description: 'Our community will pray for you.' });
    setRequest('');
    if (!isLoggedIn) setName('');
    setShowForm(false);
    fetchRequests();
  };

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Prayer Requests</h1>
          </div>
          <Button onClick={() => setShowForm(v => !v)} size="sm" className="gap-2">
            <Heart className="h-4 w-4" />
            Request Prayer
          </Button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12">
        <div className="container mx-auto px-4 text-center">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-2">Community Prayer Wall</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Share your prayer needs with our church family. We pray for one another.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Submit Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Share a Prayer Request
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="pr-name">Your Name</Label>
                <Input
                  id="pr-name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={isLoggedIn}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pr-request">Prayer Request</Label>
                <Textarea
                  id="pr-request"
                  placeholder="Share what you'd like the community to pray for…"
                  value={request}
                  onChange={e => setRequest(e.target.value)}
                  rows={4}
                  required
                  className="mt-1 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Requests list */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading prayer requests…</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground font-medium">No prayer requests yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to share a request</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(r => (
              <div
                key={r.id}
                className={`bg-card border rounded-2xl p-5 transition-all ${
                  r.is_answered
                    ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                    : 'border-border hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Heart className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground text-sm">{r.requester_name}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="text-foreground/90 text-sm leading-relaxed pl-10">{r.request}</p>
                  </div>
                  {r.is_answered && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-300 text-xs flex-shrink-0 gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Answered
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ChatSupportWidget />
    </div>
  );
}
