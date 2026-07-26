import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationBellProps {
  personId: string;
}

// Lightweight notification indicator: counts likes + comments received on
// the person's own posts since they last opened the bell. No dedicated
// notifications table needed — just compares timestamps against a
// per-person "last seen" marker stored locally.
export default function NotificationBell({ personId }: NotificationBellProps) {
  const [count, setCount] = useState(0);
  const storageKey = `notif_last_seen_${personId}`;

  const fetchCount = useCallback(async () => {
    const lastSeen = localStorage.getItem(storageKey) || new Date(0).toISOString();

    // Only look at activity on posts authored by this person.
    const { data: myPosts } = await supabase
      .from('feed_posts')
      .select('id')
      .eq('person_id', personId);

    const postIds = (myPosts || []).map(p => p.id);
    if (postIds.length === 0) { setCount(0); return; }

    const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
      supabase
        .from('feed_likes')
        .select('id', { count: 'exact', head: true })
        .in('post_id', postIds)
        .neq('person_id', personId)
        .gt('created_at', lastSeen),
      supabase
        .from('feed_comments')
        .select('id', { count: 'exact', head: true })
        .in('post_id', postIds)
        .neq('person_id', personId)
        .gt('created_at', lastSeen),
    ]);

    setCount((likeCount || 0) + (commentCount || 0));
  }, [personId, storageKey]);

  useEffect(() => {
    fetchCount();
    // Light polling so the badge stays reasonably fresh without needing
    // a realtime subscription.
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  const handleOpen = () => {
    localStorage.setItem(storageKey, new Date().toISOString());
    setCount(0);
  };

  return (
    <button
      onClick={handleOpen}
      title="Notifications"
      className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      <Bell className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
