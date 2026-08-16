import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, MapPin, Clock, Search, ChevronRight } from 'lucide-react';
import ChatSupportWidget from '@/components/ChatSupportWidget';

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

const CATEGORY_COLORS: Record<string, string> = {
  General:   'bg-blue-100 text-blue-700 border-blue-200',
  Worship:   'bg-purple-100 text-purple-700 border-purple-200',
  Youth:     'bg-green-100 text-green-700 border-green-200',
  Community: 'bg-orange-100 text-orange-700 border-orange-200',
  Special:   'bg-pink-100 text-pink-700 border-pink-200',
};

function formatEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function isUpcoming(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(dateStr) >= today;
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true });
      setEvents((data || []) as Event[]);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const filtered = events
    .filter(e => tab === 'upcoming' ? isUpcoming(e.event_date) : !isUpcoming(e.event_date))
    .filter(e => {
      if (!search) return true;
      const q = search.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q);
    })
    .sort((a, b) => tab === 'upcoming'
      ? new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      : new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Events & Announcements</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12">
        <div className="container mx-auto px-4 text-center">
          <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-2">Church Events</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Stay up to date with upcoming services, programs, and community activities.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['upcoming', 'past'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize
                ${tab === t
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
            >
              {t} Events
            </button>
          ))}
        </div>

        {/* Events list */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading events…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground font-medium">No {tab} events found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(event => (
              <div
                key={event.id}
                className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Date block */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="bg-primary/10 rounded-xl p-2">
                      <p className="text-xs font-semibold text-primary uppercase">
                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-2xl font-bold text-primary leading-none">
                        {new Date(event.event_date).getDate()}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`text-xs ${CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.General}`}
                      >
                        {event.category}
                      </Badge>
                      {isUpcoming(event.event_date) && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs">Upcoming</Badge>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatEventDate(event.event_date)}
                      </span>
                      {event.event_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.event_time}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
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
