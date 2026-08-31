import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Space, Page, Block, Profile, Song, Prerequisite, BlockType, NotificationItem } from '../types';

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

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Bootstrap data on login
  useEffect(() => {
    if (session) {
      loadProfiles();
      loadSpaces();
      loadPrerequisites();
      loadSongs();
      loadNotifications();
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

  const loadNotifications = async () => {
    if (!session?.user?.id) return;
    const meId = session.user.id;

    const { data: comments } = await supabase
      .from('comments')
      .select('id, block_id, content, created_at, user_id, seen_by')
      .neq('user_id', meId)
      .order('created_at', { ascending: false })
      .limit(40);

    if (!comments || comments.length === 0) {
      setNotifications([]);
      return;
    }

    const blockIds = [...new Set(comments.map((c) => c.block_id))];
    const { data: blocksData } = await supabase
      .from('blocks')
      .select('id, page_id')
      .in('id', blockIds);

    const pageIds = [...new Set((blocksData || []).map((b) => b.page_id))];
    const { data: pagesData } = await supabase
      .from('pages')
      .select('id, title')
      .in('id', pageIds);

    const blockToPage: Record<string, string> = {};
    (blocksData || []).forEach((b) => (blockToPage[b.id] = b.page_id));
    const pageMap: Record<string, string> = {};
    (pagesData || []).forEach((p) => (pageMap[p.id] = p.title));

    setNotifications(
      comments.map((c) => ({
        ...c,
        page_id: blockToPage[c.block_id],
        page_title: pageMap[blockToPage[c.block_id]] || 'Cours',
        seen: (c.seen_by || []).includes(meId),
      }))
    );
  };

  const markAllNotificationsRead = async () => {
    if (!session?.user?.id) return;
    const meId = session.user.id;
    const unread = notifications.filter((n) => !n.seen);
    if (!unread.length) return;

    for (const notif of unread) {
      const newSeen = [...new Set([...(notif.seen_by || []), meId])];
      await supabase.from('comments').update({ seen_by: newSeen }).eq('id', notif.id);
    }
    setNotifications(notifications.map((n) => ({ ...n, seen: true })));
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

  // Actions: Spaces
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

  const handleRenameSpace = async (space: Space) => {
    const newName = prompt('Renommer cet espace', space.name);
    if (!newName || !newName.trim() || newName.trim() === space.name) return;
    const trimmed = newName.trim();
    setSpaces(spaces.map((s) => (s.id === space.id ? { ...s, name: trimmed } : s)));
    await supabase.from('spaces').update({ name: trimmed }).eq('id', space.id);
  };

  const handleDeleteSpace = async (space: Space) => {
    if (!confirm(`Supprimer l'espace « ${space.name} » et tout son contenu ?`)) return;
    await supabase.from('spaces').delete().eq('id', space.id);
    const remaining = spaces.filter((s) => s.id !== space.id);
    setSpaces(remaining);
    if (currentSpaceId === space.id) {
      setCurrentSpaceId(remaining[0]?.id || null);
      setCurrentPageId(null);
    }
  };

  // Move space up/down
  const handleMoveSpace = async (space: Space, direction: -1 | 1) => {
    const idx = spaces.findIndex((s) => s.id === space.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= spaces.length) return;
    const other = spaces[swapIdx];
    const a = space.order_index || 0;
    const b = other.order_index || 0;
    const updatedSpace = { ...space, order_index: b };
    const updatedOther = { ...other, order_index: a };
    setSpaces((prev) => {
      const next = [...prev];
      next[idx] = updatedSpace;
      next[swapIdx] = updatedOther;
      return next;
    });
    await supabase.from('spaces').update({ order_index: b }).eq('id', space.id);
    await supabase.from('spaces').update({ order_index: a }).eq('id', other.id);
  };

  // Actions: Pages
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

  const handleDuplicatePage = async (page: Page) => {
    const newTitle = page.title + ' (copie)';
    const maxOrder = pages.reduce((m, p) => Math.max(m, p.order_index || 0), -1);
    const { data: newPage } = await supabase
      .from('pages')
      .insert({
        space_id: page.space_id,
        title: newTitle,
        created_by: session.user.id,
        order_index: maxOrder + 1,
        locked: false,
      })
      .select()
      .single();

    if (!newPage) return;

    const { data: sourceBlocks } = await supabase
      .from('blocks')
      .select('*')
      .eq('page_id', page.id)
      .order('order_index');

    if (sourceBlocks && sourceBlocks.length > 0) {
      const clonedBlocks = sourceBlocks.map((b) => ({
        page_id: newPage.id,
        type: b.type,
        content: b.content,
        parent_block_id: b.parent_block_id,
        order_index: b.order_index,
        created_by: session.user.id,
      }));
      await supabase.from('blocks').insert(clonedBlocks);
    }

    setPages([...pages, newPage]);
    setCurrentPageId(newPage.id);
  };

  const handleDeletePage = async (page: Page) => {
    if (page.locked) {
      alert('Ce cours est verrouillé. Déverrouillez-le avant de le supprimer.');
      return;
    }
    if (!confirm(`Supprimer le cours « ${page.title} » ?`)) return;

    await supabase.from('pages').delete().eq('id', page.id);
    const remaining = pages.filter((p) => p.id !== page.id);
    setPages(remaining);
    if (currentPageId === page.id) {
      setCurrentPageId(remaining[0]?.id || null);
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

  // Page reordering
  const handleReorderPage = async (draggedId: string, targetId: string, position: 'before' | 'after') => {
    if (draggedId === targetId) return;

    // Local reordering
    const filtered = pages.filter((p) => p.id !== draggedId);
    const targetIdx = filtered.findIndex((p) => p.id === targetId);
    const insertAt = position === 'before' ? targetIdx : targetIdx + 1;
    const draggedPage = pages.find((p) => p.id === draggedId);
    if (!draggedPage) return;

    filtered.splice(insertAt, 0, draggedPage);
    
    const updates: { id: string; order_index: number }[] = [];
    const next = filtered.map((p, i) => {
      if (p.order_index !== i) {
        p.order_index = i;
        updates.push({ id: p.id, order_index: i });
      }
      return p;
    });

    setPages(next);

    // Persist to DB
    for (const u of updates) {
      await supabase.from('pages').update({ order_index: u.order_index }).eq('id', u.id);
    }
  };

  // Actions: Blocks
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

  const handleMoveBlockToPage = async (block: Block, targetPageId: string) => {
    const { data: targetBlocks } = await supabase
      .from('blocks')
      .select('order_index')
      .eq('page_id', targetPageId)
      .order('order_index', { ascending: false })
      .limit(1);

    const maxOrder = targetBlocks && targetBlocks.length ? targetBlocks[0].order_index + 1 : 0;
    await supabase
      .from('blocks')
      .update({ page_id: targetPageId, parent_block_id: null, order_index: maxOrder })
      .eq('id', block.id);

    setBlocks(blocks.filter((b) => b.id !== block.id));
  };

  const handleDeleteBlock = async (block: Block) => {
    if (!confirm('Supprimer ce bloc ?')) return;
    await supabase.from('blocks').delete().eq('id', block.id);
    setBlocks(blocks.filter((b) => b.id !== block.id && b.parent_block_id !== block.id));
  };

  // Drag-and-drop reordering within the same page (top-level blocks only)
  const handleReorderBlock = async (
    draggedId: string,
    targetId: string,
    position: 'before' | 'after'
  ) => {
    const dragged = blocks.find((b) => b.id === draggedId);
    const target = blocks.find((b) => b.id === targetId);
    if (!dragged || !target) return;
    if (dragged.parent_block_id || target.parent_block_id) return; // top-level only

    // Local reordering
    const topLevel = blocks.filter((b) => !b.parent_block_id);
    const filtered = topLevel.filter((b) => b.id !== draggedId);
    const targetIdx = filtered.findIndex((b) => b.id === targetId);
    const insertAt = position === 'before' ? targetIdx : targetIdx + 1;
    filtered.splice(insertAt, 0, dragged);

    const updates: { id: string; order_index: number }[] = [];
    const next = filtered.map((b, i) => {
      if (b.order_index !== i) {
        b.order_index = i;
        updates.push({ id: b.id, order_index: i });
      }
      return b;
    });

    // Merge back with children blocks
    const childBlocks = blocks.filter((b) => b.parent_block_id);
    setBlocks([...next, ...childBlocks]);

    // Persist to DB
    for (const u of updates) {
      await supabase.from('blocks').update({ order_index: u.order_index }).eq('id', u.id);
    }
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
    setBlocks,
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
    notifications,
    markAllNotificationsRead,
    handleCreateSpace,
    handleRenameSpace,
    handleDeleteSpace,
    handleMoveSpace,
    handleCreatePage,
    handleDuplicatePage,
    handleDeletePage,
    handleUpdatePageTitle,
    handleToggleLock,
    handleReorderPage,
    handleAddBlock,
    handleUpdateBlockContent,
    handleChangeBlockType,
    handleDuplicateBlock,
    handleMoveBlockToPage,
    handleDeleteBlock,
    handleReorderBlock,
    handleTogglePrerequisite,
    handleAddComment,
  };
}