import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Page, Song } from '../types';
import { SONG_CATEGORIES } from '../lib/utils';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface RepertoireViewProps {
  spaceName: string;
  pages: Page[];
}

export const RepertoireView: React.FC<RepertoireViewProps> = ({ spaceName, pages }) => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<{ song: Partial<Song>; pages: string[] }[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSongs();
  }, [pages]);

  const loadSongs = async () => {
    setLoading(true);
    const pageIds = pages.map((p) => p.id);
    if (!pageIds.length) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const { data: songBlocks } = await supabase
      .from('blocks')
      .select('id, page_id, content')
      .in('page_id', pageIds)
      .eq('type', 'song');

    const songIds = [
      ...new Set((songBlocks || []).map((b) => b.content?.song_id).filter(Boolean)),
    ];

    let songsMap: Record<string, Song> = {};
    if (songIds.length) {
      const { data: dbSongs } = await supabase.from('songs').select('*').in('id', songIds);
      (dbSongs || []).forEach((s) => (songsMap[s.id] = s));
    }

    const byId: Record<string, { song: Partial<Song>; pages: string[] }> = {};
    for (const b of songBlocks || []) {
      const sid = b.content?.song_id || b.content?.title;
      if (!sid) continue;
      const page = pages.find((p) => p.id === b.page_id);
      if (!byId[sid]) {
        byId[sid] = {
          song: b.content?.song_id ? songsMap[b.content.song_id] || b.content : b.content,
          pages: [],
        };
      }
      if (page && !byId[sid].pages.includes(page.title)) {
        byId[sid].pages.<dyad-write path="src/components/RepertoireView.tsx" description="Complete repertoire view grouping all songs used across pages in current space">
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Page, Song } from '../types';
import { SONG_CATEGORIES } from '../lib/utils';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface RepertoireViewProps {
  spaceName: string;
  pages: Page[];
}

export const RepertoireView: React.FC<RepertoireViewProps> = ({ spaceName, pages }) => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<{ song: Partial<Song>; pages: string[] }[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSongs();
  }, [pages]);

  const loadSongs = async () => {
    setLoading(true);
    const pageIds = pages.map((p) => p.id);
    if (!pageIds.length) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const { data: songBlocks } = await supabase
      .from('blocks')
      .select('id, page_id, content')
      .in('page_id', pageIds)
      .eq('type', 'song');

    const songIds = [
      ...new Set((songBlocks || []).map((b) => b.content?.song_id).filter(Boolean)),
    ];

    let songsMap: Record<string, Song> = {};
    if (songIds.length) {
      const { data: dbSongs } = await supabase.from('songs').select('*').in('id', songIds);
      (dbSongs || []).forEach((s) => (songsMap[s.id] = s));
    }

    const byId: Record<string, { song: Partial<Song>; pages: string[] }> = {};
    for (const b of songBlocks || []) {
      const sid = b.content?.song_id || b.content?.title;
      if (!sid) continue;
      const page = pages.find((p) => p.id === b.page_id);
      if (!byId[sid]) {
        byId[sid] = {
          song: b.content?.song_id ? songsMap[b.content.song_id] || b.content : b.content,
          pages: [],
        };
      }
      if (page && !byId[sid].pages.includes(page.title)) {
        byId[sid].pages.push(page.title);
      }
    }

    setEntries(
      Object.values(byId).sort((a, b) =>
        (a.song?.title || '').localeCompare(b.song?.title || '')
      )
    );
    setLoading(false);
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-muted italic">
        Chargement du répertoire…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-ink">🎵 Répertoire des chants</h1>
        <p className="text-xs text-muted">{spaceName}</p>
        <div className="py-12 text-center text-xs text-muted italic border border-dashed border-border rounded-xl">
          Aucun chant utilisé dans les cours de cet espace pour l'instant.
        </div>
      </div>
    );
  }

  const byCategory: Record<string, typeof entries> = {};
  entries.forEach((e) => {
    const cat = e.song.category || 'autre';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(e);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">🎵 Répertoire des chants</h1>
        <p className="text-xs text-muted mt-1">
          {spaceName} · {entries.length} chant{entries.length > 1 ? 's' : ''} travaillé{entries.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(byCategory).map(([cat, catEntries]) => (
          <div key={cat} className="space-y-3">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-terracotta border-b-2 border-terracotta-soft pb-1.5">
              {SONG_CATEGORIES[cat] || cat}
            </h3>

            <div className="space-y-2">
              {catEntries.map((item, idx) => {
                const key = item.song.id || item.song.title || String(idx);
                const isOpen = expanded.has(key);
                return (
                  <div
                    key={key}
                    className="bg-surface border border-border hover:border-terracotta rounded-xl overflow-hidden shadow-sm transition-colors"
                  >
                    <div
                      onClick={() => toggleExpand(key)}
                      className="p-3.5 flex items-start gap-3 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-terracotta-soft text-terracotta flex items-center justify-center font-bold text-xs flex-shrink-0">
                        ♪
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-ink truncate">
                          {item.song.title || 'Sans titre'}
                        </div>
                        {item.song.mnemonic && (
                          <div className="text-xs text-muted italic mt-0.5">
                            {item.song.mnemonic}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.pages.map((pTitle, pi) => (
                            <span
                              key={pi}
                              className="text-[10.5px] px-2 py-0.5 rounded-full bg-green-soft text-green font-semibold"
                            >
                              {pTitle}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button className="text-muted p-1">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-2 border-t border-border bg-bg/20 space-y-3">
                        {item.song.lyrics ? (
                          <pre className="text-xs font-sans text-ink leading-relaxed whitespace-pre-wrap bg-surface p-3 rounded-lg border border-border">
                            {item.song.lyrics}
                          </pre>
                        ) : (
                          <p className="text-xs text-muted italic">Paroles non renseignées.</p>
                        )}
                        {item.song.mediaLink && (
                          <a
                            href={item.song.mediaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-terracotta font-semibold hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Écouter / voir la vidéo</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};