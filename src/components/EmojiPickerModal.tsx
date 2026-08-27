import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EmojiPickerModalProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  { label: '⚡ Capoeira', emojis: ['🥋', '🤸', '🤼', '💃', '🕺', '🦵', '🦶', '🤾', '🧘', '🏃', '🔄', '⭕', '🌀', '🎯', '🏹', '⚔️', '🛡️', '🌊'] },
  { label: '🎵 Musique', emojis: ['🎵', '🎶', '🥁', '🪘', '🎤', '🎸', '🎺', '🎻', '🪗', '🎼', '🔊', '🎙️', '🎧', '🎹', '🪕', '🎷'] },
  { label: '💪 Corps', emojis: ['💪', '🦴', '🦵', '🖐️', '✋', '👊', '🤜', '🤛', '👏', '🙌', '🤝', '👋', '👆', '👇', '👉', '🫀', '🧠', '👁️'] },
  { label: '🔖 Annotations', emojis: ['✅', '❌', '⚠️', '💡', '📝', '🎯', '⭐', '🔥', '🏆', '📌', '🔑', '💬', '❓', '❗', '➡️', '🔁', '⏱️', '📅'] },
  { label: '😀 Émotions', emojis: ['😀', '😄', '😅', '😉', '😊', '😎', '🤔', '😬', '😮', '😴', '🤩', '😤', '🥵', '🤯', '💯', '🙃', '🥳', '🫡'] },
];

export const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({ onSelect, onClose }) => {
  const [activeCat, setActiveCat] = useState(0);

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-card w-full max-w-xs shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-bold text-ink">Insérer un émoji</span>
          <button onClick={onClose} className="p-1 text-muted hover:text-ink rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex border-b border-border p-1 bg-bg/50 overflow-x-auto gap-1">
          {EMOJI_CATEGORIES.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveCat(i)}
              className={`px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                activeCat === i ? 'bg-terracotta-soft font-bold text-terracotta' : 'text-muted hover:text-ink'
              }`}
            >
              {c.label.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="p-3 grid grid-cols-6 gap-2 max-h-56 overflow-y-auto">
          {EMOJI_CATEGORIES[activeCat].emojis.map((em) => (
            <button
              key={em}
              onClick={() => {
                onSelect(em);
                onClose();
              }}
              className="text-xl p-1.5 rounded-lg hover:bg-terracotta-soft transition-transform hover:scale-110 flex items-center justify-center"
            >
              {em}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};