import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { SearchResult } from '../hooks/useSearch';

interface GlobalSearchModalProps {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  busy: boolean;
  onSelect: (result: SearchResult) => void;
  onClose: () => void;
}

const typeLabel = (r: SearchResult) => {
  if (r.type === 'space') return 'Espace';
  if (r.type === 'page') return 'Cours';
  if (r.type === 'block') {
    const t = r.blockType || '';
    if (t === 'heading') return 'Titre';
    if (t === 'subheading') return 'Sous-titre';
    if (t === 'paragraph') return 'Texte';
    if (t === 'bullet') return 'Puce';
    if (t === 'numbered') return 'Numéroté';
    if (t === 'callout') return 'Encadré';
    if (t === 'toggle') return 'Dépliant';
    if (t === 'video') return 'Vidéo';
    if (t === 'song') return 'Chant';
    if (t === 'divider') return 'Séparateur';
    return 'Bloc';
  }
  return '';
};

// Simple HTML strip for previews
const stripHtml = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  query,
  setQuery,
  results,
  busy,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      onSelect(results[selectedIndex]);
    }
  };

  const displayTitle = (r: SearchResult) => {
    if (r.type === 'block' && r.title) {
      // If it looks like it might contain HTML, strip it for preview
      if (r.title.includes('<')) return stripHtml(r.title);
    }
    return r.title;
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center pt-[12vh] p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Search className="w-4 h-4 text-muted flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Rechercher des espaces, cours ou blocs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm text-ink placeholder-muted"
          />
          <button onClick={onClose} className="p-1 text-muted hover:text-ink rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {busy && (
            <div className="text-center text-xs text-muted py-6">Recherche…</div>
          )}

          {!busy && results.length === 0 && query.trim() && (
            <div className="text-center text-xs text-muted py-8 italic">
              Aucun résultat pour « {query} ».
            </div>
          )}

          {!busy && results.length === 0 && !query.trim() && (
            <div className="text-center text-xs text-muted py-8 italic">
              Tapez pour rechercher dans les espaces, cours et blocs.
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((r, idx) => {
                const isSelected = idx === selectedIndex;
                // Show a light section header when type changes
                const prev = idx > 0 ? results[idx - 1] : null;
                const showHeader = !prev || prev.type !== r.type;
                const sectionTitle =
                  r.type === 'space' ? 'Espaces' : r.type === 'page' ? 'Cours' : 'Blocs';

                return (
                  <React.Fragment key={`${r.type}-${r.id}-${idx}`}>
                    {showHeader && (
                      <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted font-bold">
                        {sectionTitle}
                      </div>
                    )}
                    <button
                      onClick={() => onSelect(r)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                        isSelected ? 'bg-bg ring-1 ring-border' : 'hover:bg-bg'
                      }`}
                    >
                      <span className="mt-0.5 w-6 h-6 rounded-full bg-green-soft text-green flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {r.type === 'space' ? 'S' : r.type === 'page' ? 'C' : 'B'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-ink truncate">{displayTitle(r)}</div>
                        <div className="text-[11px] text-muted truncate">{r.subtitle}</div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-muted bg-surface border border-border px-1.5 py-0.5 rounded self-start">
                        {typeLabel(r)}
                      </span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-2 border-t border-border bg-surface text-[10px] text-muted flex items-center justify-between px-3">
          <span>↑↓ naviguer • Entrée ouvrir • Esc fermer</span>
          <span className="text-muted">Recherche globale</span>
        </div>
      </div>
    </div>
  );
};
