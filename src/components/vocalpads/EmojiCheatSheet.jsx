import { EMOJI_TAG_MAP } from '@/lib/emoji-tags';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmojiCheatSheet({ open, onClose }) {
  if (!open) return null;

  const entries = Object.entries(EMOJI_TAG_MAP).reduce((acc, [emoji, tag]) => {
    if (!acc.some(([, t]) => t === tag)) acc.push([emoji, tag]);
    return acc;
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
      <div className="w-full max-w-xs p-4 bg-card border border-border rounded-lg shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Emoji → Tag
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {entries.map(([emoji, tag]) => (
            <div key={tag} className="flex items-center gap-3 text-xs">
              <span className="text-base w-6 text-center">{emoji}</span>
              <span className="font-mono text-primary">{tag}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
          Add emojis before or after your word. They get translated to ElevenLabs v3
          audio tags automatically.
        </p>
      </div>
    </div>
  );
}