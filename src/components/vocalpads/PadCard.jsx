import { useState } from 'react';
import { HelpCircle, Loader2, Check, AlertCircle, Circle } from 'lucide-react';
import WaveformPreview from './WaveformPreview';
import EmojiCheatSheet from './EmojiCheatSheet';
import { translateEmojisToTags } from '@/lib/emoji-tags';

const STATUS_CONFIG = {
  idle: { icon: Circle, color: 'text-primary-foreground/20', label: '' },
  generating: { icon: Loader2, color: 'text-primary-foreground/50 animate-spin', label: 'gen' },
  loaded: { icon: Check, color: 'text-primary-foreground/70', label: 'ok' },
  error: { icon: AlertCircle, color: 'text-red-900', label: 'err' },
};

export default function PadCard({ index, pad, onTextChange, onGenerate, showLocators, onRangeChange }) {
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const status = STATUS_CONFIG[pad.status] || STATUS_CONFIG.idle;
  const StatusIcon = status.icon;
  const translated = pad.text ? translateEmojisToTags(pad.text) : '';
  const hasTranslation = translated !== pad.text;
  const isLoaded = pad.status === 'loaded';
  const isError = pad.status === 'error';

  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      onGenerate(index);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const firstWord = pasted.split(/\s/)[0];
    onTextChange(index, (pad.text || '') + firstWord);
  };

  return (
    <div
      className={`relative flex flex-col p-3 rounded-2xl transition-all duration-300 bg-primary shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),inset_0_-3px_6px_rgba(0,0,0,0.2),0_3px_6px_rgba(0,0,0,0.35)] ${
        isLoaded
          ? 'ring-2 ring-accent shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),inset_0_-3px_6px_rgba(0,0,0,0.2),0_0_14px_rgba(255,237,0,0.45)]'
          : isError
            ? 'ring-2 ring-red-800'
            : ''
      }`}
    >
      {/* Header: pad number + status */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold font-heading text-primary-foreground/40 uppercase tracking-wider">
          {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <StatusIcon className={`h-3 w-3 ${status.color}`} />
          {status.label && (
            <span className={`text-[9px] uppercase font-bold tracking-wider ${status.color}`}>
              {status.label}
            </span>
          )}
        </div>
      </div>

      {/* Text input — membrane style */}
      <div className="relative">
        <input
          type="text"
          value={pad.text}
          onChange={(e) => onTextChange(index, e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="word…"
          className="w-full bg-transparent border-0 focus:ring-0 outline-none text-center text-lg font-bold font-heading text-primary-foreground placeholder:text-primary-foreground/25 pb-1 transition-colors"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          onClick={() => setShowCheatSheet(true)}
          className="absolute -top-0.5 -right-0.5 text-primary-foreground/20 hover:text-primary-foreground/50 transition-colors"
          title="Emoji cheat sheet"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Translated tag preview */}
      <div className="min-h-[14px] mt-0.5">
        {hasTranslation && (
          <p className="text-[10px] font-mono text-primary-foreground/40 truncate text-center">
            {translated}
          </p>
        )}
      </div>

      {/* Waveform preview — dark strip */}
      <div className="mt-1.5 min-h-[32px] rounded bg-card/30 p-1">
        {pad.audioUrl && (
          <WaveformPreview
            audioUrl={pad.audioUrl}
            showLocators={showLocators}
            onRangeChange={(start, end) => onRangeChange?.(index, start, end)}
          />
        )}
      </div>

      {/* Error message */}
      {isError && pad.error && (
        <p className="text-[10px] text-red-900 mt-1 truncate font-semibold" title={pad.error}>
          {pad.error}
        </p>
      )}

      {/* Enter hint */}
      {pad.status === 'idle' && !pad.text && (
        <p className="text-[10px] text-primary-foreground/25 mt-1 text-center font-heading">↵ generate</p>
      )}

      <EmojiCheatSheet open={showCheatSheet} onClose={() => setShowCheatSheet(false)} />
    </div>
  );
}