import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Plus, Calendar, MapPin, Clock, Pencil, Trash2,
  Save, X, Loader2, Heart, CheckCircle,
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
}

interface PrayerRequest {
  id: string;
  requester_name: string;
  request: string;
  is_answered: boolean;
  is_public: boolean;
  created_at: string;
}

const CATEGORIES = ['General', 'Worship', 'Youth', 'Community', 'Special'];

const CATEGORY_COLORS: Record<string, string> = {
  General:   'bg-blue-100 text-blue-700 border-blue-200',
  Worship:   'bg-purple-100 text-purple-700 border-purple-200',
  Youth:     'bg-green-100 text-green-700 border-green-200',
  Community: 'bg-orange-100 text-orange-700 border-orange-200',
  Special:   'bg-pink-100 text-pink-700 border-pink-200',
};

const EMPTY_FORM = { title: '', description: '', event_date: '', event_time: '', location: '', category: 'General' };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminEvents() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, isEditor, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<'events' | 'prayers'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const canEdit = isSuperAdmin || isEditor;

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin/login');
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) { fetchEvents(); fetchPrayers(); }
  }, [isAdmin]);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
    setEvents((data || []) as Event[]);
    setLoading(false);
  };

  const fetchPrayers = async () => {
    const { data } = await supabase
      .from('prayer_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setPrayers((data || []) as PrayerRequest[]);
  };

  const handleSave = async () => {
    if (!form.title || !form.event_date) {
      toast({ title: 'Required fields missing', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      event_date: form.event_date,
      event_time: form.event_time || null,
      location: form.location || null,
      category: form.category,
    };
    if (editingId) {
      await supabase.from('events').update(payload).eq('id', editingId);
      toast({ title: 'Event updated' });
    } else {
      await supabase.from('events').insert({ ...payload, is_active: true });
      toast({ title: 'Event created' });
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    fetchEvents();
  };

  const handleEdit = (event: Event) => {
    setForm({
      title: event.title,
      description: event.description ?? '',
      event_date: event.event_date,
      event_time: event.event_time ?? '',
      location: event.location ?? '',
      category: event.category,
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await supabase.from('events').delete().eq('id', id);
    toast({ title: 'Event deleted' });
    fetchEvents();
  };

  const togglePrayerAnswered = async (id: string, current: boolean) => {
    await supabase.from('prayer_requests').update({ is_answered: !current }).eq('id', id);
    fetchPrayers();
  };

  const deletePrayer = async (id: string) => {
    if (!confirm('Delete this prayer request?')) return;
    await supabase.from('prayer_requests').delete().eq('id', id);
    fetchPrayers();
  };

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Events & Prayer Requests</h1>
          </div>
          {canEdit && tab === 'events' && (
            <Button onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-0">
            {([['events', Calendar, 'Events'], ['prayers', Heart, 'Prayer Requests']] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors
                  ${tab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                <Badge variant="secondary" className="text-xs">
                  {key === 'events' ? events.length : prayers.length}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* ── Event Form ─────────────────────────────────────────────────── */}
        {showForm && tab === 'events' && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">
              {editingId ? 'Edit Event' : 'New Event'}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" className="mt-1" />
              </div>
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Time</Label>
                <Input placeholder="e.g. 9:00 AM" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Location</Label>
                <Input placeholder="Venue or address" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Additional details…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="mt-1 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? 'Update' : 'Create'} Event
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading…</div>
        ) : tab === 'events' ? (
          /* ── Events List ─────────────────────────────────────────────── */
          events.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-muted-foreground">No events yet. Create the first one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 hover:shadow-sm transition-all">
                  <div className="flex-shrink-0 w-12 text-center bg-primary/10 rounded-xl p-2">
                    <p className="text-xs font-semibold text-primary uppercase">
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-xl font-bold text-primary leading-none">
                      {new Date(event.event_date).getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.General}`}>
                        {event.category}
                      </Badge>
                    </div>
                    <p className="font-semibold text-foreground">{event.title}</p>
                    {event.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.event_date)}</span>
                      {event.event_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.event_time}</span>}
                      {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(event)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* ── Prayer Requests List ────────────────────────────────────── */
          prayers.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-muted-foreground">No prayer requests yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prayers.map(p => (
                <div
                  key={p.id}
                  className={`bg-card border rounded-2xl p-4 transition-all ${
                    p.is_answered ? 'border-green-200 dark:border-green-800' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground text-sm">{p.requester_name}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</span>
                        {p.is_answered && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-300 text-xs gap-1">
                            <CheckCircle className="h-3 w-3" /> Answered
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground/90">{p.request}</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${p.is_answered ? 'text-green-600' : 'text-muted-foreground'}`}
                          title={p.is_answered ? 'Mark as unanswered' : 'Mark as answered'}
                          onClick={() => togglePrayerAnswered(p.id, p.is_answered)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deletePrayer(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
