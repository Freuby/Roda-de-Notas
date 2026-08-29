import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Space, Page, Block, Profile, Song, Prerequisite, BlockType } from '../types';

export function useRodaData(session: any) {
  // Spaces & Pages
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  // Prerequisites
  const [allPrerequisites, setAllPrerequisites] = useState<Prerequisite[]>([]);
  const [pagePrereqIds, setPagePrereqIds] = useState<Set<string>>(new Set());
  const [spacePrereqCounts, setSpacePrereqCounts] = useState<Record<string, number>>({});
  const [spaceCoverage, setSpaceCoverage] = useState<Record<string, { '2': number; '3': number; '4': number }>>({});

  // Songs
  const [allSongs, setAllSongs] = useState<Song[]>([]);

  // Comments & Toggles
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [openCommentBlockId, setOpenCommentBlockId] = useState<string | null>(null);
  const [openToggles, setOpenToggles] = useState<Set<string>>(new Set());

  // Bootstrap data on login
  useEffect(() => {
    if (session) {
      loadProfiles();
      loadSpaces();
      loadPrerequisites();
      loadSongs();
    }
  }, [session]);

  // Load pages when space changes
  useEffect(() => {
    if (currentSpaceId) {
      loadPages(currentSpaceId);
    }
  }, [currentSpaceId]);

  // Load blocks & page prerequisites when page changes
  useEffect(() => {
    if (currentPageId && currentPageId !== '__repertoire__') {
      loadBlocks(currentPageId);
      loadPagePrerequisites(currentPageId);
    }
  }, [currentPageId]);

  const loadProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, first_name, last_name, email');
    if (data) {
      const map: Record<string, Profile> = {};
      data.forEach((p) => {
        map[p.id] = p;
      });
      setProfiles(map);
    }
  };

  const loadSpaces = async () => {
    const { data } = await supabase
      .from('spaces')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (data && data.length > 0) {
      setSpaces(data);
      if (!currentSpaceId) {
        setCurrentSpaceId(data[0].id);
      }
    }
  };

  const loadPages = async (spaceId: string) => {
    const { data } = await supabase
      .from('pages')
      .select('*')
      .eq('space_id', spaceId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (data) {
      setPages(data);
      if (data.length > 0 && !currentPageId) {
        setCurrentPageId(data[0].id);
      }
      loadSpaceCoverage(spaceId, data);
    }
  };

  const loadBlocks = async (pageId: string) => {
    const { data } = await supabase
      .from('blocks')
      .select('*')
      .eq('page_id', pageId)
      .order('order_index', { ascending: true });
    if (data) {
      setBlocks(data);
      loadComments(data.map((b) => b.id));
    }
  };

  const loadComments = async (blockIds: string[]) => {
    if (!blockIds.length) return;
    const { data } = await supabase
      .from('comments')
      .select('*')
      .in('block_id', blockIds)
      .order('created_at', { ascending: true });
    if (data) {
      const map: Record<string, any[]> = {};
      data.forEach((c) => {
        if (!map[c.block_id]) map[c.block_id] = [];
        map[c.block_id].push(c);
      });
      setCommentsMap(map);
    }
  };

  const loadPrerequisites = async () => {
    const { data } = await supabase
      .from('prerequisites')
      .select('*')
      .order('corde', { ascending: true })
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });
    if (data) setAllPrerequisites(data);
  };

  const loadPagePrerequisites = async (pageId: string) => {
    const { data } = await supabase
      .from('page_prerequisites')
      .select('prerequisite_id')
      .eq('page_id', pageId);
    if (data) {
      setPagePrereqIds(new Set(data.map((d) => d.prerequisite_id)));
    }
  };

  const loadSpaceCoverage = async (spaceId: string, spacePages: Page[]) => {
    const pageIds = spacePages.map((p) => p.id);
    if (!pageIds.length) return;

    const { data } = await supabase
      .from('page_prerequisites')
      .select('prerequisite_id')
      .in('page_id', pageIds);

    if (data) {
      const counts: Record<string, number> = {};
      const covered = new Set<string>();
      data.forEach((r) => {
        counts[r.prerequisite_id] = (counts[r.prerequisite_id] || 0) + 1;
        covered.add(r.prerequisite_id);
      });
      setSpacePrereqCounts(counts);

      if (allPrerequisites.length > 0) {
        const cov: any = {};
        (['2', '3', '4'] as const).forEach((corde) => {
          const items = allPrerequisites.filter((p) => p.corde === corde);
          const done = items.filter((p) => covered.has(p.id)).length;
          cov[corde] = items.length ? Math.round((done / items.length) * 100) : 0;
        });
        setSpaceCoverage((prev) => ({ ...prev, [spaceId]: cov }));
      }
    }
  };

  const loadSongs = async () => {
    const { data } = await supabase.from('songs').select('*').order('title', { ascending: true });
    if (data) setAllSongs(data);
  };

  // Actions
  const handleCreateSpace = async () => {
    const name = prompt('Nom du nouvel espace (ex : Année 2026-2027)');
    if (!name || !name.trim()) return;
    const maxOrder = spaces.reduce((m, s) => Math.max(m, s.order_index || 0), -1);
    const { data } = await supabase
      .from('spaces')
      .insert({ name: name.trim(), created_by: session.user.id, order_index: maxOrder + 1 })
      .select()
      .single();
    if (data) {
      setSpaces([...spaces, data]);
      setCurrentSpaceId(data.id);
      setCurrentPageId(null);
    }
  };

  const handleCreatePage = async () => {
    if (!currentSpaceId) return;
    const maxOrder = pages.reduce((m, p) => Math.max(m, p.order_index || 0), -1);
    const { data } = await supabase
      .from('pages')
      .insert({
        space_id: currentSpaceId,
        title: 'Nouveau cours',
        created_by: session.user.id,
        order_index: maxOrder + 1,
      })
      .select()
      .single();
    if (data) {
      setPages([...pages, data]);
      setCurrentPageId(data.id);
    }
  };

  const handleUpdatePageTitle = async (title: string) => {
    if (!currentPageId || currentPageId === '__repertoire__') return;
    setPages(pages.map((p) => (p.id === currentPageId ? { ...p, title } : p)));
    await supabase.from('pages').update({ title }).eq('id', currentPageId);
  };

  const handleToggleLock = async () => {
    const page = pages.find((p) => p.id === currentPageId);
    if (!page) return;
    const nextLocked = !page.locked;
    setPages(pages.map((p) => (p.id === page.id ? { ...p, locked: nextLocked } : p)));
    await supabase.from('pages').update({ locked: nextLocked }).eq('id', page.id);
  };

  const handleAddBlock = async (
    type: BlockType,
    parentBlockId: string | null = null,
    onSongPickNeeded?: (blockId: string) => void
  ) => {
    if (!currentPageId || currentPageId === '__repertoire__') return;
    const siblings = blocks.filter((b) => (b.parent_block_id || null) === (parentBlockId || null));
    const maxOrder = siblings.reduce((m, b) => Math.max(m, b.order_index || 0), -1);

    let content: any = { text: '' };
    if (type === 'callout') content = { text: '', emoji: '💡' };
    if (type === 'video') content = { url: '', caption: '' };
    if (type === 'song') content = {};

    const { data } = await supabase
      .from('blocks')
      .insert({
        page_id: currentPageId,
        type,
        content,
        parent_block_id: parentBlockId,
        order_index: maxOrder + 1,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (data) {
      setBlocks([...blocks, data]);
      if (type === 'song' && onSongPickNeeded) {
        onSongPickNeeded(data.id);
      }
      if (type === 'toggle') {
        setOpenToggles((prev) => new Set([...prev, data.id]));
      }
    }
  };

  const handleUpdateBlockContent = async (block: Block, patch: any) => {
    const nextContent = { ...block.content, ...patch };
    const now = new Date().toISOString();
    setBlocks(
      blocks.map((b) =>
        b.id === block.id
          ? { ...b, content: nextContent, updated_at: now, updated_by: session.user.id }
          : b
      )
    );
    await supabase
      .from('blocks')
      .update({ content: nextContent, updated_at: now, updated_by: session.user.id })
      .eq('id', block.id);
  };

  const handleChangeBlockType = async (
    block: Block,
    type: BlockType,
    onSongPickNeeded?: (blockId: string) => void
  ) => {
    let newContent: any = { text: block.content?.text || '' };
    if (type === 'callout') newContent = { text: block.content?.text || '', emoji: '💡' };
    if (type === 'video') newContent = { url: block.content?.url || '', caption: '' };
    if (type === 'song') newContent = {};

    setBlocks(blocks.map((b) => (b.id === block.id ? { ...b, type, content: newContent } : b)));
    await supabase.from('blocks').update({ type, content: newContent }).eq('id', block.id);
    if (type === 'song' && onSongPickNeeded) {
      onSongPickNeeded(block.id);
    }
  };

  const handleDuplicateBlock = async (block: Block) => {
    const { data } = await supabase
      .from('blocks')
      .insert({
        page_id: block.page_id,
        type: block.type,
        content: block.content,
        parent_block_id: block.parent_block_id,
        order_index: block.order_index + 1,
        created_by: session.user.id,
      })
      .select()
      .single();
    if (data) {
      setBlocks([...blocks, data]);
    }
  };

  const handleDeleteBlock = async (block: Block) => {
    if (!confirm('Supprimer ce bloc ?')) return;
    await supabase.from('blocks').delete().eq('id', block.id);
    setBlocks(blocks.filter((b) => b.id !== block.id && b.parent_block_id !== block.id));
  };

  const handleTogglePrerequisite = async (prereqId: string) => {
    if (!currentPageId || currentPageId === '__repertoire__') return;
    const exists = pagePrereqIds.has(prereqId);
    const next = new Set(pagePrereqIds);
    if (exists) {
      next.delete(prereqId);
      setPagePrereqIds(next);
      await supabase
        .from('page_prerequisites')
        .delete()
        .eq('page_id', currentPageId)
        .eq('prerequisite_id', prereqId);
    } else {
      next.add(prereqId);
      setPagePrereqIds(next);
      await supabase
        .from('page_prerequisites')
        .insert({ page_id: currentPageId, prerequisite_id: prereqId });
    }
    if (currentSpaceId) {
      loadSpaceCoverage(currentSpaceId, pages);
    }
  };

  const handleAddComment = async (blockId: string, text: string) => {
    if (!text.trim()) return;
    const { data } = await supabase
      .from('comments')
      .insert({
        block_id: blockId,
        user_id: session.user.id,
        content: text.trim(),
      })
      .select()
      .single();
    if (data) {
      setCommentsMap((prev) => ({
        ...prev,
        [blockId]: [...(prev[blockId] || []), data],
      }));
    }
  };

  const profileMap: Record<string, string> = {};
  Object.values(profiles).forEach((p) => {
    profileMap[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email?.split('@')[0] || 'Inconnu';
  });

  return {
    spaces,
    currentSpaceId,
    setCurrentSpaceId,
    pages,
    currentPageId,
    setCurrentPageId,
    blocks,
    profileMap,
    allPrerequisites,
    pagePrereqIds,
    spacePrereqCounts,
    spaceCoverage,
    allSongs,
    commentsMap,
    openCommentBlockId,
    setOpenCommentBlockId,
    openToggles,
    setOpenToggles,
    handleCreateSpace,
    handleCreatePage,
    handleUpdatePageTitle,
    handleToggleLock,
    handleAddBlock,
    handleUpdateBlockContent,
    handleChangeBlockType,
    handleDuplicateBlock,
    handleDeleteBlock,
    handleTogglePrerequisite,
    handleAddComment,
  };
}