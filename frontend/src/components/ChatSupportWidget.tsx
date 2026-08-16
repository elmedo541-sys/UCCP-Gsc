import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, ChevronDown, ShieldCheck } from 'lucide-react';

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

// ─── Storage keys ─────────────────────────────────────────────────────────────
const CONV_KEY = 'support_conversation_id';
const NAME_KEY = 'support_sender_name';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ChatSupportWidgetProps {
  /** Pre-fill the sender name (pass logged-in user's name) */
  userName?: string;
  /** Person ID for logged-in users */
  personId?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatSupportWidget({ userName, personId }: ChatSupportWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [senderName, setSenderName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── fetchMessages — declared FIRST so effects below can reference it ───────
  const fetchMessages = useCallback(async (convId: string, isOpen: boolean) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    const msgs = (data || []) as SupportMessage[];
    setMessages(msgs);

    const unread = msgs.filter(m => m.sender_type === 'admin' && !m.is_read).length;
    if (!isOpen) setUnreadCount(unread);
  }, []);

  // ── Init conversation ────────────────────────────────────────────────────
  useEffect(() => {
    let convId = localStorage.getItem(CONV_KEY);
    if (!convId) {
      convId = generateUUID();
      localStorage.setItem(CONV_KEY, convId);
    }
    setConversationId(convId);

    const savedName = localStorage.getItem(NAME_KEY);
    const resolvedName = userName || savedName || '';
    if (resolvedName) {
      setSenderName(resolvedName);
      setNameSaved(true);
      if (userName) localStorage.setItem(NAME_KEY, userName);
    }
  }, [userName]);

  // ── Fetch + realtime subscription ────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    fetchMessages(conversationId, open);

    const channel = supabase
      .channel(`support:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as SupportMessage;
          setMessages(prev => [...prev, msg]);
          if (msg.sender_type === 'admin' && !open) {
            setUnreadCount(c => c + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, open, fetchMessages]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // ── Clear unread on open ──────────────────────────────────────────────────
  useEffect(() => {
    if (open && conversationId) {
      setUnreadCount(0);
      supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'admin')
        .eq('is_read', false)
        .then(() => {});
    }
  }, [open, conversationId]);

  // ── Save name ─────────────────────────────────────────────────────────────
  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSenderName(trimmed);
    setNameSaved(true);
    localStorage.setItem(NAME_KEY, trimmed);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const msg = inputMsg.trim();
    if (!msg || !senderName || !conversationId) return;
    setSending(true);
    setInputMsg('');

    await supabase.from('support_messages').insert({
      conversation_id: conversationId,
      sender_type: 'user',
      sender_name: senderName,
      message: msg,
      person_id: personId || null,
      is_read: false,
    });

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Chat Panel ── */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-border bg-card"
          style={{ height: '480px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <div>
                <p className="font-semibold text-sm leading-none">Support</p>
                <p className="text-xs opacity-75 mt-0.5">Chat with the Admin</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Name prompt */}
          {!nameSaved ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 bg-muted/30">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Welcome!</p>
                <p className="text-sm text-muted-foreground mt-1">Please enter your name to start chatting with the admin.</p>
              </div>
              <div className="w-full space-y-2">
                <Input
                  placeholder="Your name…"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); }}
                  autoFocus
                />
                <Button onClick={handleSaveName} className="w-full" disabled={!nameInput.trim()}>
                  Start Chat
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                    <MessageCircle className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Send a message to start the conversation.</p>
                    <p className="text-xs text-muted-foreground/60">The admin will reply as soon as possible.</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-0.5 ${msg.sender_type === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.sender_type === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">
                      {msg.sender_type === 'admin' ? `Admin` : msg.sender_name}
                      {' · '}
                      {new Date(msg.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 p-3 border-t border-border bg-card shrink-0">
                <Input
                  placeholder="Type a message…"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  className="flex-1 h-9"
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={sending || !inputMsg.trim()}
                  className="h-9 w-9 p-0 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
        aria-label="Chat Support"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
