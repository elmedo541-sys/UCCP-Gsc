import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, ArrowLeft, User, ShieldCheck, Clock } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'admin';
  sender_name: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  conversation_id: string;
  sender_name: string;
  last_message: string;
  last_time: string;
  unread_count: number;
  total_count: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminSupportPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Fetch conversations ────────────────────────────────────────────────────
  const fetchConversations = async () => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!data) { setLoadingConvs(false); return; }

    // Group by conversation_id
    const map = new Map<string, Conversation>();
    for (const msg of data as SupportMessage[]) {
      if (!map.has(msg.conversation_id)) {
        map.set(msg.conversation_id, {
          conversation_id: msg.conversation_id,
          sender_name: msg.sender_name || 'Guest',
          last_message: msg.message,
          last_time: msg.created_at,
          unread_count: 0,
          total_count: 0,
        });
      }
      const conv = map.get(msg.conversation_id)!;
      conv.total_count++;
      if (msg.sender_type === 'user' && !msg.is_read) conv.unread_count++;
      // Keep latest message (messages are ordered desc so first is latest)
      if (msg.created_at > conv.last_time) {
        conv.last_message = msg.message;
        conv.last_time = msg.created_at;
      }
      // Prefer non-admin name
      if (msg.sender_type === 'user' && msg.sender_name) {
        conv.sender_name = msg.sender_name;
      }
    }

    setConversations(Array.from(map.values()).sort((a, b) => b.last_time.localeCompare(a.last_time)));
    setLoadingConvs(false);
  };

  useEffect(() => { fetchConversations(); }, []);

  // ── Realtime for new messages ──────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('admin-support-all')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
      }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Open conversation ──────────────────────────────────────────────────────
  const openConversation = async (convId: string) => {
    setActiveConv(convId);
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages((data || []) as SupportMessage[]);

    // Mark user messages as read
    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .eq('sender_type', 'user')
      .eq('is_read', false);

    // Refresh conversation list to clear badge
    fetchConversations();
  };

  // ── Realtime for active conversation ──────────────────────────────────────
  useEffect(() => {
    if (!activeConv) return;
    const channel = supabase
      .channel(`admin-conv:${activeConv}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `conversation_id=eq.${activeConv}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as SupportMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send reply ─────────────────────────────────────────────────────────────
  const handleReply = async () => {
    const msg = replyText.trim();
    if (!msg || !activeConv) return;
    setSending(true);
    setReplyText('');
    await supabase.from('support_messages').insert({
      conversation_id: activeConv,
      sender_type: 'admin',
      sender_name: 'Admin',
      message: msg,
      is_read: false,
    });
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              Support Messages
              {totalUnread > 0 && (
                <Badge className="text-xs bg-destructive text-destructive-foreground">
                  {totalUnread} new
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">User conversations</p>
          </div>
          {activeConv && (
            <Button variant="ghost" size="sm" onClick={() => setActiveConv(null)} className="gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Conversation list */}
        {!activeConv ? (
          loadingConvs ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground text-sm">
              Loading conversations…
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-center">
              <MessageCircle className="w-7 h-7 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No support messages yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {conversations.map(conv => {
                const dt = new Date(conv.last_time);
                const timeStr = dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) + ' ' +
                  dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
                return (
                  <li
                    key={conv.conversation_id}
                    onClick={() => openConversation(conv.conversation_id)}
                    className="flex items-start gap-3 px-6 py-4 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 mt-0.5">
                      {conv.sender_name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{conv.sender_name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{timeStr}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge className="text-[10px] bg-destructive text-destructive-foreground shrink-0 h-5 px-1.5">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )
        ) : (
          // Active conversation thread
          <div className="flex flex-col" style={{ height: '400px' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-0.5 ${msg.sender_type === 'admin' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-center gap-1.5 mb-0.5 ${msg.sender_type === 'admin' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      msg.sender_type === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-foreground'
                    }`}>
                      {msg.sender_type === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {msg.sender_type === 'admin' ? 'Admin' : (msg.sender_name || 'User')}
                    </span>
                  </div>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.sender_type === 'admin'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-card border border-border text-foreground rounded-bl-sm'
                  }`}>
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {new Date(msg.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <div className="flex items-center gap-2 p-3 border-t border-border bg-card shrink-0">
              <Input
                placeholder="Type a reply…"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                className="flex-1 h-9"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleReply}
                disabled={sending || !replyText.trim()}
                className="h-9 w-9 p-0 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
