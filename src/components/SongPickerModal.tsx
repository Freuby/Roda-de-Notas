import React, { useState } from 'react';
import { Song } from '../types';
import { Search, X, Music } from 'lucide-react';
import { normalize, SONG_CATEGORIES } from '../lib/utils';

interface SongPickerModalProps {
  songs: Song[];
  onSelect: (song: Song) => void;
  onClose: () => void;
}

export const SongPickerModal: React.FC<SongPickerModalProps> = ({ songs, onSelect, onClose }) => {
  const [query, setQuery] = useState('');

  const q = normalize(query);
  const filtered = songs.filter(
    (s) =>
      !q ||
      normalize(s.title).includes(q) ||
      normalize(s.lyrics || '').includes(q) ||
      normalize(s.mnemonic || '').includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-card w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-ink">Choisir un chant</h3>
          <button onClick={onClose} className="p-1 text-muted hover:text-ink rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 border-b border-border bg-bg/50 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Rechercher un titre, des paroles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs text-ink placeholder-muted"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-muted py-8 italic">
              Aucun chant trouvé.
            </p>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg text-left transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-terracotta-soft text-terracotta flex items-center justify-center text-xs font-bold flex-shrink-0">
                  ♪
                </span>
                <span className="flex-1 font-medium text-xs text-ink truncate">{s.title}</span>
                {s.category && (
                  <span className="text-[10px] uppercase font-bold text-terracotta bg-terracotta-soft px-2 py-0.5 rounded-full">
                    {SONG_CATEGORIES[s.category] || s.category}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-border bg-surface text-right">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-muted hover:text-ink font-semibold rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};