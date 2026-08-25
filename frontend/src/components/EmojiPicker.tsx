import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  /** Optional: className passed to the trigger button so callers can match
   *  their own icon-button sizing. */
  triggerClassName?: string;
}

// A curated set of common emojis, grouped so the picker stays small and
// fast without pulling in a large third-party emoji database.
const CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '😘', '😋', '😜', '🤗', '🤔'],
  },
  {
    label: 'Faith & Feelings',
    emojis: ['🙏', '❤️', '🙌', '✝️', '🕊️', '⛪', '📖', '✨', '💒', '🎉', '👏', '💪', '😢', '😭', '😌', '😴', '🥳', '😎', '🤝', '💯'],
  },
  {
    label: 'Gestures',
    emojis: ['👍', '👎', '👊', '✌️', '🤞', '👋', '🙏', '💐', '🌸', '🌿', '🌈', '☀️', '🔥', '🎊', '🎈', '🎁', '📣', '💬', '🥹', '😊'],
  },
];

export default function EmojiPicker({ onSelect, triggerClassName }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Add emoji"
          className={
            triggerClassName ??
            'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
          }
        >
          <Smile className="w-4.5 h-4.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {CATEGORIES.map(cat => (
            <div key={cat.label}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{cat.label}</p>
              <div className="grid grid-cols-8 gap-1">
                {cat.emojis.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { onSelect(e); setOpen(false); }}
                    className="text-xl leading-none p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
