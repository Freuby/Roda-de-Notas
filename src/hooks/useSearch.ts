import { useState, useEffect, useCallback } from 'react';
import { Space, Page, Block } from '../types';
import { normalize } from '../lib/utils';

interface SearchResult {
  type: 'space' | 'page' | 'block';
  title: string;
  subtitle: string;
  id: string;
  spaceId: string;
  pageId?: string;
  blockId?: string;
  blockType?: string;
}

interface UseSearchOptions {
  spaces: Space[];
  pages: Page[];
  blocks: Block[];
}

export function useSearch({ spaces, pages, blocks }: UseSearchOptions) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setBusy(true);
    const lowerQ = q.toLowerCase();

    const spaceMatches = spaces
      .filter((s) => s.name.toLowerCase().includes(lowerQ))
      .map((s) => ({
        type: 'space' as const,
        title: s.name,
        subtitle: `${pages.filter((p) => p.space_id === s.id).length} cours`,
        id: s.id,
        spaceId: s.id,
      }));

    const pageMatches = pages
      .filter((p) => p.title.toLowerCase().includes(lowerQ))
      .map((p) => ({
        type: 'page' as const,
        title: p.title,
        subtitle: `Espace: ${spaces.find((s) => s.id === p.space_id)?.name || ''}`,
        id: p.id,
        spaceId: p.space_id,
        pageId: p.id,
      }));

    const blockMatches = blocks
      .filter((b) => JSON.stringify(b.content).toLowerCase().includes(lowerQ))
      .map((b) => ({
        type: 'block' as const,
        title: b.content?.text || b.content?.title || b.type,
        subtitle: `Page: ${pages.find((p) => p.id === b.page_id)?.title || ''}`,
        id: b.id,
        spaceId: pages.find((p) => p.id === b.page_id)?.space_id,
        pageId: b.page_id,
        blockId: b.id,
        blockType: b.type,
      }));

    setResults([...spaceMatches, ...pageMatches, ...blockMatches].slice(0, 20));
    setBusy(false);
  }, [spaces, pages, blocks]);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const selectResult = useCallback(
    (result: SearchResult) => {
      if (result.type === 'space') {
        return { action: 'selectSpace' as const, spaceId: result.spaceId };
      } else if (result.type === 'page') {
        return { action: 'selectPage' as const, spaceId: result.spaceId, pageId: result.pageId };
      } else if (result.type === 'block') {
        return {
          action: 'selectBlock' as const,
          spaceId: result.spaceId,
          pageId: result.pageId,
          blockId: result.blockId,
        };
      }
      return null;
    },
    []
  );

  return {
    query,
    setQuery,
    results,
    busy,
    selectResult,
  };
}