import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Heart, MessageCircle, Trash2, ImageIcon, Send,
  ArrowLeft, Cake, X, Loader2, Users, Calendar, BookOpen, Film,
  Copy, Check, ExternalLink, LogIn,
} from 'lucide-react';
import ChatSupportWidget from '@/components/ChatSupportWidget';
import OnboardingTour from '@/components/OnboardingTour';
import UserMenu from '@/components/UserMenu';
import WelcomeBanner from '@/components/WelcomeBanner';
import ProfileNudge from '@/components/ProfileNudge';
import NotificationBell from '@/components/NotificationBell';
import MobileNavBar from '@/components/MobileNavBar';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface PostRow {
  id: string;
  person_id: string;
  content: string;
  image_url: string | null;
  is_birthday_post: boolean;
  created_at: string;
}

interface Post extends PostRow {
  author_name: string;
  author_picture: string | null;
  like_count: number;
  comment_count: number;
  user_liked: boolean;
}

interface Comment {
  id: string;
  person_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_picture: string | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ picture, name, size = 'md' }: { picture: string | null; name: string; size?: 'sm' | 'md' }) {
  const [imgError, setImgError] = useState(false);
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const ringWrap = size === 'sm' ? 'p-[1.5px]' : 'p-[2px]';
  return (
    <div className={`${ringWrap} rounded-full bg-gradient-to-br from-primary/60 via-primary/30 to-transparent flex-shrink-0 self-start`}>
      {picture && !imgError ? (
        <img
          src={picture}
          alt={name}
          onError={() => setImgError(true)}
          className={`${sz} rounded-full object-cover block ring-2 ring-background`}
        />
      ) : (
        <div className={`${sz} rounded-full bg-primary/15 flex items-center justify-center font-semibold text-primary ring-2 ring-background`}>
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

/* ─── Copy Button ────────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

/* ─── Birthday Modal ─────────────────────────────────────────────────────── */
function BirthdayModal({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-yellow-200 dark:border-yellow-900 animate-birthday-pop">
        {/* Confetti dots */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti-fall"
              style={{
                left: `${(i * 6.25) % 100}%`,
                top: '-8px',
                backgroundColor: ['#f59e0b','#ec4899','#8b5cf6','#10b981','#3b82f6','#ef4444','#f97316'][i % 7],
                animationDelay: `${(i * 0.15)}s`,
                animationDuration: `${1.5 + (i % 3) * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-birthday-bounce">
          <Cake className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-1">Happy Birthday!</h2>
        <p className="text-xl font-semibold text-pink-600 dark:text-pink-400 mb-3">{name}</p>
        <p className="text-sm text-muted-foreground mb-6">
          Wishing you a day filled with joy, laughter, and God's abundant blessings!
        </p>

        <Button
          onClick={onClose}
          className="bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-500 hover:to-pink-600 text-white border-0 rounded-full px-8 font-semibold shadow-md"
        >
          Thank you!
        </Button>
      </div>
    </div>
  );
}

/* ─── Comment Section ────────────────────────────────────────────────────── */
function CommentSection({ postId, personId }: { postId: string; personId: string | null }) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from('feed_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error || !rows) { setLoading(false); return; }

    const personIds = [...new Set(rows.map(r => r.person_id))];
    const { data: people } = await supabase
      .from('people')
      .select('uuid, full_name, profile_picture')
      .in('uuid', personIds);

    const peopleMap = Object.fromEntries((people || []).map(p => [p.uuid, p]));

    setComments(rows.map(r => ({
      ...r,
      author_name: peopleMap[r.person_id]?.full_name ?? 'Member',
      author_picture: peopleMap[r.person_id]?.profile_picture ?? null,
    })));
    setLoading(false);
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!text.trim() || !personId) return;
    setSubmitting(true);
    const { error } = await supabase.from('feed_comments').insert({
      post_id: postId,
      person_id: personId,
      content: text.trim(),
    });
    if (error) {
      toast({ title: 'Error', description: 'Could not post comment.', variant: 'destructive' });
    } else {
      setText('');
      fetchComments();
    }
    setSubmitting(false);
  };

  return (
    <div className="border-t border-border pt-3 mt-3 space-y-3">
      {loading ? (
        <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {comments.map((c, i) => (
            <div key={c.id} className="flex gap-2 animate-feed-comment-item" style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}>
              <Avatar picture={c.author_picture} name={c.author_name} size="sm" />
              <div className="flex-1 bg-muted rounded-2xl px-3 py-2">
                <p className="text-xs font-semibold text-foreground">{c.author_name}</p>
                <p className="text-sm text-foreground/90 mt-0.5">{c.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(c.created_at)}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-1">No comments yet. Be the first!</p>
          )}
        </div>
      )}

      {personId && (
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Write a comment…"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={1}
            className="resize-none text-sm rounded-2xl min-h-[38px] flex-1"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="rounded-full h-9 w-9 p-0 flex-shrink-0"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Post Card ──────────────────────────────────────────────────────────── */
function PostCard({
  post, personId, onLikeToggle, onDelete, index = 0, canModerate = false, onImageClick,
}: {
  post: Post;
  personId: string | null;
  onLikeToggle: (postId: string, liked: boolean) => void;
  onDelete: (postId: string) => void;
  index?: number;
  canModerate?: boolean;
  onImageClick: (url: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const [justLiked, setJustLiked] = useState(false);

  const handleLike = async () => {
    if (!personId || liking) return;
    setLiking(true);
    const willLike = !post.user_liked;
    onLikeToggle(post.id, post.user_liked);
    if (willLike) {
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 450);
    }
    setLiking(false);
  };

  return (
    <div
      className={`animate-feed-post bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${post.is_birthday_post ? 'border-yellow-300 dark:border-yellow-700' : ''}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      {post.is_birthday_post && (
        <div className="bg-gradient-to-r from-yellow-400 to-pink-500 px-4 py-1.5 flex items-center gap-2">
          <Cake className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-semibold">Birthday Celebration!</span>
        </div>
      )}

      <div className="p-4">
        {/* Author row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Avatar picture={post.author_picture} name={post.author_name} />
            <div>
              <p className="font-semibold text-sm text-foreground leading-tight">{post.author_name}</p>
              <p className="text-xs text-muted-foreground" title={fullDate(post.created_at)}>{timeAgo(post.created_at)}</p>
            </div>
          </div>
          {(personId === post.person_id || canModerate) && (
            <button
              onClick={() => onDelete(post.id)}
              title={personId === post.person_id ? 'Delete post' : 'Delete post (admin)'}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

        {/* Image */}
        {post.image_url && (
          <div className="rounded-xl overflow-hidden mb-3 bg-muted border border-border/40">
            <img
              src={post.image_url}
              alt="Post image"
              onClick={() => onImageClick(post.image_url!)}
              className="w-full max-h-[420px] object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
              loading="lazy"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1 border-t border-border/60">
          <button
            onClick={handleLike}
            disabled={!personId}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-90
              ${post.user_liked
                ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
          >
            <Heart className={`w-4 h-4 transition-transform ${post.user_liked ? 'fill-rose-500 scale-110' : ''} ${justLiked ? 'animate-feed-like-pop' : ''}`} />
            <span className="tabular-nums">{post.like_count}</span>
          </button>

          <button
            onClick={() => setShowComments(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-90
              ${showComments
                ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : 'text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30'
              }`}
          >
            <MessageCircle className={`w-4 h-4 transition-transform duration-300 ${showComments ? 'scale-110' : ''}`} />
            <span className="tabular-nums">{post.comment_count}</span>
          </button>
        </div>

        {showComments && (
          <div className="animate-feed-comments">
            <CommentSection postId={post.id} personId={personId} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Feed Page ─────────────────────────────────────────────────────── */
export default function Feed() {
  const navigate = useNavigate();
  const { personId, isLoggedIn, loading: authLoading } = useUserAuth();
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [dbSetupNeeded, setDbSetupNeeded] = useState(false);
  const [autoSetupRunning, setAutoSetupRunning] = useState(false);
  const [autoSetupError, setAutoSetupError] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [birthdayName, setBirthdayName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string; first_name: string; profile_picture: string | null } | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  /* ── Close lightbox on Escape ── */
  useEffect(() => {
    if (!lightboxImage) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxImage(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxImage]);

  /* ── No redirect — allow read-only view for non-logged-in users ── */

  /* ── Load user profile + birthday check ── */
  useEffect(() => {
    if (!personId) return;
    const load = async () => {
      const { data } = await supabase
        .from('people')
        .select('full_name, profile_picture, date_of_birth, first_name, phone')
        .eq('uuid', personId)
        .maybeSingle();
      if (!data) return;
      setUserProfile({
        full_name: data.full_name ?? 'Me',
        first_name: data.first_name ?? data.full_name?.split(' ')[0] ?? 'Friend',
        profile_picture: data.profile_picture ?? null,
      });

      const missing: string[] = [];
      if (!data.profile_picture) missing.push('photo');
      if (!data.phone) missing.push('phone number');
      setMissingFields(missing);

      // Birthday check
      const dob: string | null = data.date_of_birth;
      const firstName: string = data.first_name ?? data.full_name ?? 'Friend';
      if (dob) {
        const today = new Date();
        const birth = new Date(dob);
        if (birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate()) {
          setBirthdayName(firstName);
          setShowBirthdayModal(true);
          const todayStr = today.toISOString().split('T')[0];
          const { data: existing } = await supabase
            .from('feed_posts')
            .select('id')
            .eq('person_id', personId)
            .eq('is_birthday_post', true)
            .gte('created_at', `${todayStr}T00:00:00`)
            .maybeSingle();
          if (!existing) {
            await supabase.from('feed_posts').insert({
              person_id: personId,
              content: `🎂 Today is ${firstName}'s birthday! Wishing you a wonderful day filled with joy and God's blessings! 🎉`,
              is_birthday_post: true,
            });
            fetchPosts();
          }
        }
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  /* ── Fetch posts ── */
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    const { data: rows, error } = await supabase
      .from('feed_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // Detect missing table (PGRST205 = table not in schema cache)
      if (error.code === 'PGRST205' || error.message?.includes('feed_posts')) {
        setDbSetupNeeded(true);
      }
      setLoadingPosts(false);
      return;
    }
    if (!rows) { setLoadingPosts(false); return; }

    setDbSetupNeeded(false);

    const personIds = [...new Set(rows.map((r: PostRow) => r.person_id))];

    const [{ data: people }, { data: likes }] = await Promise.all([
      supabase.from('people').select('uuid, full_name, profile_picture').in('uuid', personIds),
      supabase.from('feed_likes').select('post_id, person_id').in('post_id', rows.map((r: PostRow) => r.id)),
    ]);

    // Comment counts
    const { data: commentCounts } = await supabase
      .from('feed_comments')
      .select('post_id')
      .in('post_id', rows.map((r: PostRow) => r.id));

    const peopleMap = Object.fromEntries((people || []).map(p => [p.uuid, p]));
    const likesArr = likes || [];
    const commentsArr = commentCounts || [];

    setPosts(rows.map((r: PostRow) => {
      const postLikes = likesArr.filter((l: { post_id: string; person_id: string }) => l.post_id === r.id);
      const postComments = commentsArr.filter((c: { post_id: string }) => c.post_id === r.id);
      return {
        ...r,
        author_name: peopleMap[r.person_id]?.full_name ?? 'Member',
        author_picture: peopleMap[r.person_id]?.profile_picture ?? null,
        like_count: postLikes.length,
        comment_count: postComments.length,
        user_liked: postLikes.some((l: { post_id: string; person_id: string }) => l.person_id === personId),
      };
    }));

    setLoadingPosts(false);
  }, [personId]);

  useEffect(() => {
    if (!authLoading) fetchPosts();
  }, [authLoading, fetchPosts]);

  /* ── Auto setup when tables missing ── */
  useEffect(() => {
    if (!dbSetupNeeded || autoSetupRunning) return;
    const tryAutoSetup = async () => {
      setAutoSetupRunning(true);
      setAutoSetupError('');
      try {
        const { data, error } = await supabase.functions.invoke('setup-feed', { body: {} });
        if (error || !data?.success) {
          setAutoSetupError(error?.message ?? data?.error ?? 'Setup function not yet deployed.');
          setAutoSetupRunning(false);
          return;
        }
        // Success — reload posts
        setDbSetupNeeded(false);
        setAutoSetupRunning(false);
        fetchPosts();
      } catch (e: unknown) {
        setAutoSetupError(String(e));
        setAutoSetupRunning(false);
      }
    };
    tryAutoSetup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbSetupNeeded]);

  /* ── Image select ── */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Create post ── */
  const handlePost = async () => {
    if (!content.trim() || !personId) return;
    setPosting(true);

    let imageUrl: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${personId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('feed-images')
        .upload(path, imageFile, { upsert: true });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('feed-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('feed_posts').insert({
      person_id: personId,
      content: content.trim(),
      image_url: imageUrl,
      is_birthday_post: false,
    });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('feed_posts')) {
        setDbSetupNeeded(true);
      } else {
        toast({ title: 'Error', description: 'Failed to create post.', variant: 'destructive' });
      }
    } else {
      setContent('');
      removeImage();
      fetchPosts();
    }
    setPosting(false);
  };

  /* ── Like toggle ── */
  const handleLikeToggle = async (postId: string, wasLiked: boolean) => {
    if (!personId) return;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, user_liked: !wasLiked, like_count: p.like_count + (wasLiked ? -1 : 1) }
        : p
    ));

    if (wasLiked) {
      await supabase.from('feed_likes').delete().eq('post_id', postId).eq('person_id', personId);
    } else {
      await supabase.from('feed_likes').insert({ post_id: postId, person_id: personId });
    }
  };

  /* ── Delete post ── */
  const handleDelete = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    await supabase.from('feed_posts').delete().eq('id', postId);
  };

  /* ── Render ── */
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ── DB Setup Required Screen ── */
  if (dbSetupNeeded) {
    const SUPABASE_REF = 'eauupydshoidelyrrbaf';
    const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${SUPABASE_REF}/sql/new`;

    const setupSql = `CREATE TABLE feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  is_birthday_post boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read" ON feed_posts FOR SELECT USING (true);
CREATE POLICY "insert" ON feed_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "delete" ON feed_posts FOR DELETE USING (true);

CREATE TABLE feed_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  person_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, person_id)
);
ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read" ON feed_likes FOR SELECT USING (true);
CREATE POLICY "insert" ON feed_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "delete" ON feed_likes FOR DELETE USING (true);

CREATE TABLE feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  person_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read" ON feed_comments FOR SELECT USING (true);
CREATE POLICY "insert" ON feed_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "delete" ON feed_comments FOR DELETE USING (true);`;

    // Show spinner while auto-setup is trying
    if (autoSetupRunning) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="font-semibold text-foreground">Setting up Community Feed…</p>
            <p className="text-sm text-muted-foreground">Creating database tables automatically</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-10">
        <div className="max-w-2xl w-full space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-foreground text-lg">Community Feed — One-time Setup</h1>
          </div>

          {autoSetupError && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 text-sm text-yellow-800 dark:text-yellow-300">
              Automatic setup is not available yet. Please use the manual steps below.
            </div>
          )}

          {/* Steps */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <p className="text-sm text-muted-foreground">
              The feed needs 3 database tables. Follow these 3 steps — it takes less than a minute.
            </p>

            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
              <div className="flex-1 pt-0.5">
                <p className="font-semibold text-foreground text-sm mb-2">Open the SQL Editor</p>
                <a
                  href={SQL_EDITOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" /> Open SQL Editor
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
              <div className="flex-1 pt-0.5">
                <p className="font-semibold text-foreground text-sm mb-2">Copy this SQL and paste it in the editor</p>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-300 text-xs p-4 rounded-xl overflow-x-auto whitespace-pre font-mono border border-gray-700 max-h-60">
                    {setupSql}
                  </pre>
                  <CopyButton text={setupSql} />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
              <div className="flex-1 pt-0.5">
                <p className="font-semibold text-foreground text-sm mb-2">Click "Run" in the SQL Editor, then come back and click below</p>
                <Button
                  onClick={() => { setDbSetupNeeded(false); fetchPosts(); }}
                  className="rounded-lg"
                >
                  <Check className="w-4 h-4 mr-2" /> Done — Load Feed
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Birthday Modal */}
      {showBirthdayModal && (
        <BirthdayModal name={birthdayName} onClose={() => setShowBirthdayModal(false)} />
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-foreground text-lg leading-tight">Community Feed</h1>
              <p className="text-xs text-muted-foreground">Share updates with your church family</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[
              { icon: Users, path: '/directory', label: 'Directory' },
              { icon: Calendar, path: '/events', label: 'Events' },
              { icon: BookOpen, path: '/prayer-requests', label: 'Prayers' },
              { icon: Film, path: '/gallery', label: 'Gallery' },
            ].map(({ icon: Icon, path, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                title={label}
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
            {isLoggedIn && personId && <NotificationBell personId={personId} />}
            {isLoggedIn && userProfile ? (
              <UserMenu name={userProfile.full_name} picture={userProfile.profile_picture} />
            ) : !isLoggedIn && (
              <Button size="sm" onClick={() => navigate('/user/login')} className="rounded-full gap-1.5 ml-1">
                <LogIn className="w-3.5 h-3.5" /> Log in
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3 pb-24 md:pb-6">

       {isLoggedIn && personId && userProfile && (
  <>
    <OnboardingTour personId={personId} firstName={userProfile.first_name} />
    <WelcomeBanner personId={personId} firstName={userProfile.first_name} />
  </>
)}

        {isLoggedIn && !nudgeDismissed && (
          <ProfileNudge missingFields={missingFields} onDismiss={() => setNudgeDismissed(true)} />
        )}

        {/* Create Post — logged in users only */}
        {isLoggedIn ? (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-primary/40 transition-all">
          <div className="flex gap-3 items-start">
            {userProfile && (
              <Avatar picture={userProfile.profile_picture} name={userProfile.full_name} />
            )}
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's on your mind? Share an update with your church family…"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={3}
                className="resize-none rounded-xl border-border/60 focus-visible:ring-primary/30 bg-muted/40"
              />

              {/* Image preview */}
              {imagePreview && (
                <div className="relative rounded-xl overflow-hidden bg-muted border border-border/40">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-0.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-full hover:bg-primary/10 active:scale-95"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <Button
                  onClick={handlePost}
                  disabled={!content.trim() || posting}
                  size="sm"
                  className="rounded-full px-5 shadow-sm active:scale-95 transition-transform"
                >
                  {posting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="bg-card border border-dashed border-border rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground text-sm">Join the conversation</p>
              <p className="text-xs text-muted-foreground mt-0.5">Log in to post updates and interact with the community</p>
            </div>
            <Button size="sm" onClick={() => navigate('/user/login')} className="rounded-full gap-2 flex-shrink-0">
              <LogIn className="w-4 h-4" /> Log in
            </Button>
          </div>
        )}

        {/* Posts list */}
        {loadingPosts ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading feed…</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="animate-feed-fade-in flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground">No posts yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Be the first to share something with the community!
            </p>
          </div>
        ) : (
          posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              personId={personId}
              onLikeToggle={handleLikeToggle}
              onDelete={handleDelete}
              index={i}
              canModerate={isSuperAdmin}
              onImageClick={setLightboxImage}
            />
          ))
        )}
      </div>

      <ChatSupportWidget />
      <MobileNavBar />

      {/* Image lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-feed-fade-in cursor-zoom-out"
        >
          <button
            onClick={() => setLightboxImage(null)}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg cursor-default"
          />
        </div>
      )}
    </div>
  );
}