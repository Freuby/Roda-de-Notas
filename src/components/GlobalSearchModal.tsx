import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Space, Page, Block } from '../types';
import { Search, X, FileText, Music, ChevronRight } from 'lucide-react';
import { normalize } from '../lib/utils';

interface GlobalSearchModalProps {
  spaces: Space[];
  onSelect: (spaceId: string, pageId: string, blockId?: string) => void;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ spaces, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBusy(true);
      const q = normalize(query);

      const [{ data: allPages }, { data: allBlocks }] = await Promise.all([
        supabase.from('pages').select('id, title, space_id'),
        supabase.from('blocks').select('id, page_id, type, content'),
      ]);

      const spaceMap: Record<string, string> = {};
      spaces.forEach((s) => (spaceMap[s.id] = s.name));
      const pageMap: Record<string, any> = {};
      (allPages || []).forEach((p) => (pageMap[p.id] = p));

      const found: any[] = [];

      // Pages matching title
      (allPages || []).forEach((p) => {
        if (normalize(p.title).includes(q)) {
          found.push({
            kind: 'page',
            pageId: p.id,
            pageTitle: p.title || 'Sans titre',
            spaceId: p.space_id,
            spaceName: spaceMap[p.space_id] || '',
          });
        }
      });

      // Blocks matching text
      (allBlocks || []).forEach((b) => {
        const text = [
          b.content?.text,
          b.content?.caption,
          b.content?.title,
          b.content?.lyrics,
          b.content?.mnemonic,
        ]
          .filter(Boolean)
          .join(' ');

        if (normalize(text).includes(q)) {
          const pg = pageMap[b.page_id];
          if (pg) {
            found.push({
              kind: 'block',
              blockId: b.id,
              blockType: b.type,
              snippet: text.substring(0, 100),
              pageId: pg.id,
              pageTitle: pg.title || 'Sans titre',
              spaceId: pg.space_id,
              spaceName: spaceMap[pg.space_id] || '',
            });
          }
        }
      });

      setResults(found.slice(0, 40));
      setBusy(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16 px-4">
      <div className="bg-surface border border-border rounded-card w-full max-w-xl shadow-2xl flex flex-col max-h-[70vh] overflow-hidden">
        <div className="p-3.5 border-b border-border flex items-center gap-3">
          <Search className="w-4 h-4 text-muted flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Rechercher un cours, un mouvement, un chant…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-ink placeholder-muted"
          />
          <button onClick={onClose} className="p-1 text-muted hover:text-ink rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {busy ? (
            <p className="text-center text-xs text-muted py-8">Recherche en cours…</p>
          ) : results.length === 0 && query ? (
            <p className="text-center text-xs text-muted py-8 italic">
              Aucun résultat pour « {query} »
            </p>
          ) : results.length === 0 ? (
            <p className="text-center text-xs text-muted py-8">
              Tapez pour rechercher dans tous vos cours et chants.
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  onSelect(r.spaceId, r.pageId, r.blockId);
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-bg text-left transition-colors border-b border-border/50 last:border-none"
              >
                <span className="w-6 h-6 rounded-md bg-terracotta-soft text-terracotta flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {r.kind === 'page' ? <FileText className="w-3.5 h-3.5" /> : '¶'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-ink">{r.pageTitle}</div>
                  <div className="text-[11px] text-green font-medium">{r.spaceName}</div>
                  {r.snippet && (
                    <div className="text-[11px] text-muted truncate mt-0.5">{r.snippet}</div>
                  )}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-1" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};