import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Space, Page, Block } from '../types';
import { Search, X, FileText, Music, ChevronRight, Filter, Calendar } from 'lucide-react';
import { normalize } from '../lib/utils';

interface GlobalSearchModalProps {
  spaces: Space[];
  onSelect: (spaceId: string, pageId: string, blockId?: string) => void;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ spaces, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'spaces' | 'pages' | 'blocks'>('all');
  const [results, setResults] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBusy(true);
      
      const q = normalize(query);
      
      // Fetch all data
      const [{ data: allPages }, { data: allBlocks }] = await Promise.all([
        supabase.from('pages').select('id, title, space_id, created_at'),
        supabase.from('blocks').select('id, page_id, type, content, created_at')
      ]);

      const spaceMap: Record<string, string> = {};
      spaces.forEach((s) => (spaceMap[s.id] = s.name));
      const pageMap: Record<string, any> = {};
      (allPages || []).forEach((p) => (pageMap[p.id] = p));

      let found: any[] = [];

      // 1. Search in spaces
      if (filter === 'all' || filter === 'spaces') {
        (allPages || []).forEach((p) => {
          if (normalize(p.title).includes(q)) {
            found.push({
              kind: 'page',
              pageId: p.id,
              pageTitle: p.title || 'Sans titre',
              spaceId: p.space_id,
              spaceName: (spaceMap[p.space_id] || ''),
              snippet: null,
              blockId: null,
              createdAt: p.created_at,
            });
          }
        });
      }

      // 2. Search in blocks
      if (filter === 'all' || filter === 'blocks') {
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
            const page = pageMap[b.page_id];
            if (page) {
              // build a short snippet around the match
              const idx = normalize(text).indexOf(q);
              const start = Math.max(0, idx - 40);
              const end = Math.min(text.length, idx + q.length + 60);
              let snippet = text.substring(start, end).replace(/\n/g, ' ').trim();
              if (start > 0) snippet = '…' + snippet;
              if (end < text.length) snippet = snippet + '…';
              
              found.push({
                kind: 'block',
                blockId: b.id,
                blockType: b.type,
                snippet,
                pageId: page.id,
                pageTitle: page.title || 'Sans titre',
                spaceId: page.space_id,
                spaceName: (spaceMap[page.space_id] || ''),
                createdAt: b.created_at,
              });
            }
          }
        });
      }

      // De-duplicate: if a page already matched by title, keep block matches too (more specific)
      found.sort((a, b) => {
        if (a.kind === 'page' && b.kind !== 'page') return -1;
        if (a.kind !== 'page' && b.kind === 'page') return 1;
        return 0;
      });

      setResults(found.slice(0, 30));
      setBusy(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filter]);

  const getResultIcon = (kind: string) => {
    switch (kind) {
      case 'page': return <FileText className="w-4 h-4" />;
      case 'block': return '¶';
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getResultColor = (kind: string) => {
    switch (kind) {
      case 'page': return 'bg-green-soft text-green border-green';
      case 'block': return 'bg-terracotta-soft text-terracotta border-terracotta';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16 px-4">
      <div className="bg-surface border border-border rounded-card w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Search className="w-5 h-5 text-muted flex-shrink-0" />
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

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showFilters || filter !== 'all'
                  ? 'bg-bg text-ink border border-border'
                  : 'text-muted hover:text-ink hover:bg-bg'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtres</span>
            </button>
            
            {showFilters && (
              <div className="flex items-center gap-1.5 ml-2">
                {(['all', 'spaces', 'pages', 'blocks'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      filter === f
                        ? 'bg-terracotta text-white'
                        : 'text-muted hover:text-ink hover:bg-bg'
                    }`}
                  >
                    {f === 'all' ? 'Tout' : 
                     f === 'spaces' ? 'Espaces' : 
                     f === 'pages' ? 'Cours' : 
                     'Blocs'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3">
          {busy ? (
            <p className="text-center text-xs text-muted py-8">Recherche en cours…</p>
          ) : results.length === 0 && query ? (
            <p className="text-center text-xs text-muted py-8 italic">
              Aucun résultat pour « {query} »
            </p>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted mx-auto mb-3 opacity-30" />
              <p className="text-xs text-muted">
                Tapez pour rechercher dans tous vos cours et chants.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(r.spaceId, r.pageId, r.blockId)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-bg text-left transition-colors border border-transparent hover:border-border"
                >
                  <span className={`w-8 h-8 rounded-md border flex items-center justify-center text-xs font-bold flex-shrink-0 ${getResultColor(r.kind)}`}>
                    {getResultIcon(r.kind)}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-ink truncate">
                      {r.pageTitle}
                    </div>
                    <div className="text-[11px] text-green font-medium flex items-center gap-1.5 mt-0.5">
                      <span>{r.spaceName}</span>
                      {r.createdAt && (
                        <>
                          <span>•</span>
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{formatDate(r.createdAt)}</span>
                        </>
                      )}
                    </div>
                    {r.snippet && (
                      <div className="text-[11px] text-muted truncate mt-1 italic">
                        « {r.snippet} »
                      </div>
                    )}
                  </div>
                  
                  <ChevronRight className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};