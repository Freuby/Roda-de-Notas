import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface SearchResult {
  type: 'space' | 'page' | 'block';
  title: string;
  subtitle: string;
  id: string;
  spaceId: string;
  pageId?: string;
  blockId?: string;
  blockType?: string;
}

export type SearchAction =
  | { action: 'selectSpace'; spaceId: string }
  | { action: 'selectPage'; spaceId: string; pageId?: string }
  | { action: 'selectBlock'; spaceId: string; pageId?: string; blockId?: string };
export type { SearchResult };
export type { SearchResult };

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);

  // Keep the latest query to ignore stale results
  const latestQueryRef = useRef<string>('');

  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    latestQueryRef.current = trimmed;
    setBusy(true);
    const term = `%${trimmed}%`;

    try {
      // Spaces
      const { data: spData } = await supabase
        .from('spaces')
        .select('id, name')
        .ilike('name', term)
        .limit(5);

      if (latestQueryRef.current !== trimmed) return; // stale

      const spaceMatches: SearchResult[] = (spData || []).map((s: any) => ({
        type: 'space' as const,
        title: s.name,
        subtitle: 'Espace',
        id: s.id,
        spaceId: s.id,
      }));

      // Pages
      const { data: pgData } = await supabase
        .from('pages')
        .select('id, title, space_id, space:spaces(name)')
        .or(`title.ilike.${term},space.name.ilike.${term}`)
        .limit(12);

      if (latestQueryRef.current !== trimmed) return;

      const pageMatches: SearchResult[] = (pgData || []).map((p: any) => ({
        type: 'page' as const,
        title: p.title,
        subtitle: `Espace : ${p.space?.name || ''}`,
        id: p.id,
        spaceId: p.space_id,
        pageId: p.id,
      }));

      // Blocks (text + rich content + song fields)
      const { data: blData } = await supabase
        .from('blocks')
        .select('id, type, content, page_id, page:pages(title, space_id, space:spaces(name))')
        .or(`content->>text.ilike.${term},content->>html.ilike.${term},content->>title.ilike.${term},content->>lyrics.ilike.${term},content->>caption.ilike.${term},content->>mnemonic.ilike.${term}`)
        .limit(12);

      if (latestQueryRef.current !== trimmed) return;

      const blockMatches: SearchResult[] = (blData || []).map((b: any) => {
        const c = b.content || {};
        let preview = (c.text || c.title || c.lyrics || '').toString();
        if (!preview && c.html) {
          preview = c.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        const spaceName = b.page?.space?.name;
        const pageTitle = b.page?.title;
        const location = [spaceName, pageTitle].filter(Boolean).join(' › ');
        return {
          type: 'block' as const,
          title: preview ? preview.slice(0, 100) : b.type,
          subtitle: location || 'Bloc',
          id: b.id,
          spaceId: b.page?.space_id,
          pageId: b.page_id,
          blockId: b.id,
          blockType: b.type,
        };
      });

      setResults([...spaceMatches, ...pageMatches, ...blockMatches].slice(0, 20));
    } catch (e) {
      console.error('Search error', e);
      if (latestQueryRef.current === trimmed) setResults([]);
    }

    setBusy(false);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => performSearch(query), 260);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Clear results when query is emptied from outside
  useEffect(() => {
    if (!query) setResults([]);
  }, [query]);

  const selectResult = useCallback((result: SearchResult): SearchAction | null => {
    if (result.type === 'space') {
      return { action: 'selectSpace', spaceId: result.spaceId };
    }
    if (result.type === 'page') {
      return { action: 'selectPage', spaceId: result.spaceId, pageId: result.pageId };
    }
    if (result.type === 'block') {
      return {
        action: 'selectBlock',
        spaceId: result.spaceId,
        pageId: result.pageId,
        blockId: result.blockId,
      };
    }
    return null;
  }, []);

  return {
    query,
    setQuery,
    results,
    busy,
    selectResult,
  };
}

export type { SearchResult, SearchAction };