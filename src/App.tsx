import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { PageEditor } from './components/PageEditor';
import { EmptyState } from './components/EmptyState';
import { RepertoireView } from './components/RepertoireView';
import { SongPickerModal } from './components/SongPickerModal';
import { EmojiPickerModal } from './components/EmojiPickerModal';
import { MoveBlockModal } from './components/MoveBlockModal';
import { Toast } from './components/Toast';
import { downloadSpaceArchive } from './lib/archive';
import { useRodaData } from './hooks/useRodaData';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useBlockHistory } from './hooks/useBlockHistory';
import { useTheme } from './hooks/useTheme';
import { useSearch, SearchResult } from './hooks/useSearch';
import { MobileTopbar } from './components/MobileTopbar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { Block, Space, NotificationItem, Song, BlockType } from './types';

export const App: React.FC = () => {
  // --- Core state ---
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [movingBlock, setMovingBlock] = useState<Block | null>(null);

  // --- Picker states ---
    const [songPickerBlockId, setSongPickerBlockId] = useState<string | null>(null);
    const [emojiPickerBlockId, setEmojiPickerBlockId] = useState<string | null>(null);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // --- Hooks ---
  const { theme, toggleTheme } = useTheme();
  const data = useRodaData(session, setToastMessage);
  const search = useSearch();
  const history = useBlockHistory();

  // Wrapped update functions that record history before mutating
  const updateBlockContentWithHistory = useCallback((block: Block, patch: any) => {
    if (!history.isApplying()) {
      history.recordChange(block, { content: { ...block.content, ...patch } });
    }
    data.handleUpdateBlockContent(block, patch);
  }, [history, data]);

  const changeBlockTypeWithHistory = useCallback((block: Block, type: BlockType) => {
    if (!history.isApplying()) {
      const previousContent = block.content ? { ...block.content } : {};
      history.recordChange(block, { type, content: previousContent });
    }
    data.handleChangeBlockType(block, type, (id) => {
      if (type === 'song') setSongPickerBlockId(id);
    });
  }, [history, data]);

  // --- Navigation helpers ---
  const navigateBlock = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      const idx = data.blocks.findIndex((b) => b.id === activeBlockId);
      if (idx === -1) return;
      const next =
        direction === 'up'
          ? Math.max(0, idx - 1)
          : Math.min(data.blocks.length - 1, idx + 1);
      const target = data.blocks[next];
      if (target) {
        setActiveBlockId(target.id);
        setTimeout(() => {
          const el = document.querySelector(`[data-block-id="${target.id}"]`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    },
    [data.blocks, activeBlockId]
  );

  const undoBlock = useCallback(async () => {
    const entry = history.undo();
    if (!entry) return;

    const block = data.blocks.find((b) => b.id === entry.blockId);

    // Case 1: Undoing a deletion → we need to restore the block
    if (entry.action === 'delete' && entry.snapshot) {
      const snap = entry.snapshot;
      try {
        const { data: restored } = await supabase
          .from('blocks')
          .insert({
            id: snap.id,
            page_id: snap.page_id,
            parent_block_id: snap.parent_block_id,
            order_index: snap.order_index,
            type: snap.type,
            content: snap.content,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .select()
          .single();

        if (restored) {
          const newParentId = restored.id;
          data.setBlocks((prev: Block[]) => [...prev, restored as Block]);

          // Restore any children that were captured at deletion time
          // @ts-ignore
          const childSnaps: any[] = entry.childSnapshots || [];
          if (childSnaps.length > 0) {
            const childrenToInsert = childSnaps.map((c: any) => ({
              page_id: c.page_id,
              parent_block_id: newParentId,
              order_index: c.order_index,
              type: c.type,
              content: c.content,
              created_by: (await supabase.auth.getUser()).data.user?.id,
            }));

            const { data: restoredChildren } = await supabase
              .from('blocks')
              .insert(childrenToInsert)
              .select();

            if (restoredChildren) {
              data.setBlocks((prev: Block[]) => [...prev, ...(restoredChildren as Block[])]);
            }
          }

          setActiveBlockId(newParentId);
          setToastMessage('Suppression annulée');

          if (typeof (history as any).remapBlockId === 'function') {
            (history as any).remapBlockId(entry.blockId, newParentId);
          }
        }
      } catch (e) {
        console.error(e);
        setToastMessage('Impossible de restaurer le bloc');
      }
      return;
    }

    // Case 2: Undoing a creation → delete the block + any children it may have acquired (without confirm)
    if (entry.action === 'create') {
      if (block) {
        const children = data.blocks.filter((b) => b.parent_block_id === block.id);
        if (children.length > 0) {
          await Promise.all(children.map((c) => supabase.from('blocks').delete().eq('id', c.id)));
        }
        await supabase.from('blocks').delete().eq('id', block.id);
        data.setBlocks((prev: Block[]) =>
          prev.filter(
            (b) => b.id !== block.id && b.parent_block_id !== block.id
          )
        );
        setToastMessage('Création annulée');
      }
      return;
    }

    // Case 3: Normal edit or type change
    if (!block) {
      setToastMessage('Impossible d\'annuler');
      return;
    }

    const prevState = entry.previous;

    if (prevState.type !== block.type) {
      data.handleChangeBlockType(block, prevState.type as BlockType);
      setTimeout(() => {
        const fresh = data.blocks.find((b) => b.id === entry.blockId);
        if (fresh) {
          data.handleUpdateBlockContent(fresh, { ...prevState.content });
        }
      }, 60);
    } else {
      data.handleUpdateBlockContent(block, { ...prevState.content });
    }

    setToastMessage('Annulé');
  }, [history, data]);

  const redoBlock = useCallback(async () => {
    const entry = history.redo();
    if (!entry) return;

    const block = data.blocks.find((b) => b.id === entry.blockId);

    // Redoing a deletion (force delete, no confirm)
    if (entry.action === 'delete') {
      if (block) {
        await supabase.from('blocks').delete().eq('id', block.id);
        data.setBlocks((prev: Block[]) =>
          prev.filter((b) => b.id !== block.id && b.parent_block_id !== block.id)
        );
        setToastMessage('Suppression réappliquée');
      }
      return;
    }

    // Redoing a creation
    if (entry.action === 'create' && entry.next) {
      const originalPageId = data.blocks.find((b) => b.id === entry.blockId)?.page_id || data.currentPageId;
      try {
        const { data: created } = await supabase
          .from('blocks')
          .insert({
            page_id: originalPageId,
            type: entry.next.type,
            content: entry.next.content,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .select()
          .single();

        if (created) {
          data.setBlocks((prev: Block[]) => [...prev, created as Block]);
          setActiveBlockId(created.id);
          setToastMessage('Création réappliquée');

          // Remap history so future undo/redo on this creation uses the new id
          if (typeof (history as any).remapBlockId === 'function') {
            (history as any).remapBlockId(entry.blockId, created.id);
          }
        }
      } catch (e) {
        console.error(e);
        setToastMessage('Impossible de recréer le bloc');
      }
      return;
    }

    if (!block) {
      setToastMessage('Impossible de répéter');
      return;
    }

    const nextState = entry.next;

    if (nextState.type !== block.type) {
      data.handleChangeBlockType(block, nextState.type as BlockType);
      setTimeout(() => {
        const fresh = data.blocks.find((b) => b.id === entry.blockId);
        if (fresh) {
          data.handleUpdateBlockContent(fresh, { ...nextState.content });
        }
      }, 60);
    } else {
      data.handleUpdateBlockContent(block, { ...nextState.content });
    }

    setToastMessage('Répété');
  }, [history, data]);

  const deleteActiveBlock = useCallback(async () => {
    const block = data.blocks.find((b) => b.id === activeBlockId);
    if (!block) return;

    const children = data.blocks.filter((b) => b.parent_block_id === block.id);
    const childSnapshots = children.map((c) => ({
      id: c.id,
      page_id: c.page_id,
      parent_block_id: c.parent_block_id || null,
      order_index: c.order_index,
      type: c.type,
      content: c.content ? { ...c.content } : {},
    }));

    history.recordDeletion(block, childSnapshots);

    // Delete children from DB first
    if (children.length > 0) {
      await Promise.all(children.map((c) => supabase.from('blocks').delete().eq('id', c.id)));
    }

    // Delete parent from DB
    await supabase.from('blocks').delete().eq('id', block.id);

    // Update local state
    data.setBlocks((prev: Block[]) =>
      prev.filter((b) => b.id !== block.id && b.parent_block_id !== block.id)
    );

    setActiveBlockId(null);
    setToastMessage('Bloc supprimé');
  }, [data, activeBlockId, history]);

  // Wrapped delete that records history (used by trash icon on blocks)
  // Captures direct children (for toggles etc.) so undo can restore the whole subtree.
  // We bypass the confirm in handleDeleteBlock because the user already clicked delete.
  const deleteBlockWithHistory = useCallback(async (block: Block) => {
    const children = data.blocks.filter((b) => b.parent_block_id === block.id);
    const childSnapshots = children.map((c) => ({
      id: c.id,
      page_id: c.page_id,
      parent_block_id: c.parent_block_id || null,
      order_index: c.order_index,
      type: c.type,
      content: c.content ? { ...c.content } : {},
    }));

    history.recordDeletion(block, childSnapshots);

    // Delete children directly (no confirm)
    if (children.length > 0) {
      await Promise.all(children.map((c) => supabase.from('blocks').delete().eq('id', c.id)));
    }

    // Delete the parent directly (bypass confirm in handleDeleteBlock)
    await supabase.from('blocks').delete().eq('id', block.id);
    data.setBlocks((prev: Block[]) =>
      prev.filter((b) => b.id !== block.id && b.parent_block_id !== block.id)
    );
  }, [history, data]);

  // History state (useful for future UI indicators)
  const canUndo = history.canUndo;
  const canRedo = history.canRedo;

  // --- Keyboard shortcuts ---
  useKeyboardShortcuts({
    session,
    activeBlockId,
    blockHistory: history.blockHistory,
    historyIndex: history.historyIndex,
    setActiveBlockId,
    setToastMessage,
    navigateBlock,
    undoBlock,
    redoBlock,
    deleteActiveBlock,
    openGlobalSearch: () => {
      setShowGlobalSearch(true);
      search.setQuery('');
    },
  });

  // --- Notification handler ---
  const handleSelectNotification = useCallback(async (notif: NotificationItem) => {
    if (notif.page_id) {
      const { data: page } = await supabase
        .from('pages')
        .select('space_id')
        .eq('id', notif.page_id)
        .single();
      if (page) {
        data.setCurrentSpaceId(page.space_id);
        data.setCurrentPageId(notif.page_id);
        data.setOpenCommentBlockId(notif.block_id);
      }
    }
  }, [data]);

  // --- Global search selection ---
  const handleSearchSelect = useCallback((result: SearchResult) => {
    const sel = search.selectResult(result);
    if (!sel) return;
    setShowGlobalSearch(false);
    search.setQuery('');

    if (data.currentSpaceId !== sel.spaceId) {
      data.setCurrentSpaceId(sel.spaceId);
    }

    if (sel.action === 'selectSpace') {
      data.setCurrentPageId(null);
      return;
    }
    if (sel.action === 'selectPage' && sel.pageId) {
      data.setCurrentPageId(sel.pageId);
      return;
    }
    if (sel.action === 'selectBlock' && sel.pageId && sel.blockId) {
      data.setCurrentPageId(sel.pageId);

      const targetBlockId = sel.blockId;

      // Open any parent toggles so the block is visible
      const openToggleAncestors = () => {
        const ancestors: string[] = [];
        let cur = data.blocks.find((b) => b.id === targetBlockId);
        while (cur?.parent_block_id) {
          ancestors.push(cur.parent_block_id);
          cur = data.blocks.find((b) => b.id === cur!.parent_block_id);
        }
        if (ancestors.length) {
          data.setOpenToggles((prev) => {
            const next = new Set(prev);
            ancestors.forEach((id) => next.add(id));
            return next;
          });
        }
      };

      // Focus + highlight the block + open toggles
      const tryFocusBlock = (attempts = 0) => {
        const el = document.querySelector<HTMLElement>(`[data-block-editable="${targetBlockId}"]`);
        if (el) {
          setActiveBlockId(targetBlockId);
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('search-highlight');
          setTimeout(() => el.classList.remove('search-highlight'), 2200);
          openToggleAncestors();
        } else if (attempts < 10) {
          setTimeout(() => tryFocusBlock(attempts + 1), 200);
        } else {
          // Last attempt: still try to open toggles if we have the data
          openToggleAncestors();
        }
      };

      setTimeout(() => tryFocusBlock(0), 300);
    }
  }, [search, data]);

  // --- Archive / Import ---
  const handleArchiveSpace = useCallback(async (space: Space) => {
    setToastMessage("Génération de l'archive…");
    const { data: spacePages } = await supabase
      .from('pages')
      .select('*')
      .eq('space_id', space.id)
      .order('order_index');
    if (!spacePages) return;
    const pageIds = spacePages.map((p) => p.id);
    let spaceBlocks: Block[] = [];
    if (pageIds.length > 0) {
      const { data: bData } = await supabase
        .from('blocks')
        .select('*')
        .in('page_id', pageIds)
        .order('order_index');
      spaceBlocks = (bData as Block[]) || [];
    }
    downloadSpaceArchive(space, spacePages, spaceBlocks);
    setToastMessage('Archive téléchargée ✓');
  }, []);

  const handleImportArchive = useCallback(async (file: File) => {
    setToastMessage('Lecture de larchive…');
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const dataEl = doc.getElementById('roda-archive-data');
      if (!dataEl) { setToastMessage('Fichier non reconnu'); return; }
      const payload = JSON.parse(dataEl.textContent || '{}');
      const { space, pages: impPages, blocks: impBlocks } = payload;
      if (!space || !impPages) return;

      const maxOrder = data.spaces.reduce((m, s) => Math.max(m, s.order_index || 0), -1);
      const { data: newSpace } = await supabase
        .from('spaces').insert({ name: `${space.name} (importé)`, created_by: session.user.id, order_index: maxOrder + 1 }).select().single();
      if (!newSpace) return;

      const pageIdMap: Record<string, string> = {};
      for (const p of impPages) {
        const { data: np } = await supabase.from('pages').insert({ space_id: newSpace.id, title: p.title, created_by: session.user.id, order_index: p.order_index, locked: false }).select().single();
        if (np) pageIdMap[p.id] = np.id;
      }
      const blockIdMap: Record<string, string> = {};
      const sorted = [...(impBlocks || [])].sort((a, b) => (a.parent_block_id ? 1 : 0) - (b.parent_block_id ? 1 : 0));
      for (const b of sorted) {
        const npId = pageIdMap[b.page_id]; if (!npId) continue;
        const nPid = b.parent_block_id ? blockIdMap[b.parent_block_id] : null;
        const { data: nb } = await supabase.from('blocks').insert({ page_id: npId, type: b.type, content: b.content, parent_block_id: nPid, order_index: b.order_index, created_by: session.user.id }).select().single();
        if (nb) blockIdMap[b.id] = nb.id;
      }
      setToastMessage('Archive importée ✓');
      window.location.reload();
    } catch { setToastMessage("Erreur lors de l'import"); }
  }, [data, session]);

  // --- Reorder handlers ---
  const handleReorderPages = useCallback((draggedId: string, targetId: string, position: 'before' | 'after') => {
    data.handleReorderPage(draggedId, targetId, position);
  }, [data]);

  const handleMoveSpace = useCallback((space: Space, direction: -1 | 1) => {
    data.handleMoveSpace(space, direction);
  }, [data]);

  // --- Song picker handler ---
  const handleSongSelect = useCallback((song: Song) => {
      if (!songPickerBlockId) return;
      const block = data.blocks.find((b) => b.id === songPickerBlockId);
      if (block) {
        const patch = {
          song_id: song.id,
          title: song.title,
          category: song.category,
          mnemonic: song.mnemonic,
          lyrics: song.lyrics,
          mediaLink: song.mediaLink,
        };
        if (!history.isApplying()) {
          history.recordChange(block, { content: { ...block.content, ...patch } });
        }
        data.handleUpdateBlockContent(block, patch);
      }
      setSongPickerBlockId(null);
      setToastMessage('Chant sélectionné ✓');
    }, [songPickerBlockId, data, history]);
  
    const handleOpenSearch = useCallback(() => {
      setShowGlobalSearch(true);
      search.setQuery('');
    }, [search]);

  // --- Emoji picker handler ---
  const handleEmojiSelect = useCallback((emoji: string) => {
    if (!emojiPickerBlockId) return;
    const block = data.blocks.find((b) => b.id === emojiPickerBlockId);
    if (block) {
      const current = block.content?.text || '';
      const patch: any = { text: current + emoji };
      if (block.content?.html) patch.html = block.content.html + emoji;
      // Record before applying
      if (!history.isApplying()) {
        history.recordChange(block, { content: { ...block.content, ...patch } });
      }
      data.handleUpdateBlockContent(block, patch);
    }
    setEmojiPickerBlockId(null);
  }, [emojiPickerBlockId, data, history]);

  // --- Toast auto-clear ---
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 2400);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // --- Init auth ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, ns) => { setSession(ns); setLoading(false); });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Clear undo/redo history when switching pages (avoids confusing cross-page undos)
  useEffect(() => {
    if (data.currentPageId && typeof history.clear === 'function') {
      history.clear();
    }
  }, [data.currentPageId]);

  // --- Loading / Auth ---
  if (loading) return <div className="flex h-screen items-center justify-center bg-bg text-muted font-display text-sm">Chargement de la roda…</div>;
  if (!session) return <AuthScreen />;

  const activeSpace = data.spaces.find((s) => s.id === data.currentSpaceId);
  const activePage = data.pages.find((p) => p.id === data.currentPageId);
  const songPickerSong = songPickerBlockId ? data.allSongs.find((s) => s.id === songPickerBlockId) : null;

  return (
    <div className="flex h-screen w-full bg-bg text-ink overflow-hidden transition-colors duration-300">
      <MobileTopbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <Sidebar
        spaces={data.spaces}
        currentSpaceId={data.currentSpaceId}
        pages={data.pages}
        currentPageId={data.currentPageId}
        spaceCoverage={data.spaceCoverage}
        userName={data.profileMap[session.user.id] || session.user.email}
        notifications={data.notifications}
        profileMap={data.profileMap}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectSpace={(sId) => { data.setCurrentSpaceId(sId); data.setCurrentPageId(null); }}
        onRenameSpace={data.handleRenameSpace}
        onDeleteSpace={data.handleDeleteSpace}
        onArchiveSpace={handleArchiveSpace}
        onImportArchive={handleImportArchive}
        onSelectPage={data.setCurrentPageId}
        onDuplicatePage={async (p) => { await data.handleDuplicatePage(p); setToastMessage('Cours dupliqué ✓'); }}
        onDeletePage={data.handleDeletePage}
        onCreateSpace={data.handleCreateSpace}
        onCreatePage={data.handleCreatePage}
        onMarkAllRead={data.markAllNotificationsRead}
        onSelectNotification={handleSelectNotification}
        onReorderPages={handleReorderPages}
        onMoveSpace={handleMoveSpace}
        onOpenSearch={handleOpenSearch}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 p-6 md:p-12">
        <div className="max-w-3xl mx-auto pb-24">
          {data.currentPageId === '__repertoire__' ? (
            <RepertoireView spaceName={activeSpace?.name || ''} pages={data.pages} />
          ) : activePage ? (
            <PageEditor
              page={activePage}
              spaceName={activeSpace?.name || ''}
              pages={data.pages}
              blocks={data.blocks}
              prerequisites={data.allPrerequisites}
              selectedPrereqIds={data.pagePrereqIds}
              spacePrereqCounts={data.spacePrereqCounts}
              profileMap={data.profileMap}
              commentsMap={data.commentsMap}
              openCommentBlockId={data.openCommentBlockId}
              openToggles={data.openToggles}
              activeBlockId={activeBlockId}
              onUpdateTitle={data.handleUpdatePageTitle}
              onToggleLock={data.handleToggleLock}
              onTogglePrerequisite={data.handleTogglePrerequisite}
              onSelectBlock={setActiveBlockId}
              onUpdateBlockContent={updateBlockContentWithHistory}
              onChangeBlockType={(b, type) => {
                changeBlockTypeWithHistory(b, type);
              }}
              onDuplicateBlock={async (b) => { await data.handleDuplicateBlock(b); setToastMessage('Bloc dupliqué ✓'); }}
              onMoveBlockToPage={(b) => setMovingBlock(b)}
              onDeleteBlock={deleteBlockWithHistory}
              onAddBlock={(type, parentId, afterBlockId) => {
                data.handleAddBlock(type, parentId, (id) => {
                  if (type === 'song') setSongPickerBlockId(id);
                  // Record creation for undo (after the block is in state)
                  setTimeout(() => {
                    const newBlock = data.blocks.find((b) => b.id === id);
                    if (newBlock) {
                      if (history.recordCreation) {
                        history.recordCreation(newBlock);
                      } else {
                        history.recordChange(newBlock, undefined, 'create');
                      }
                    }
                  }, 30);
                }, afterBlockId);
              }}
              onToggleComment={(id) => data.setOpenCommentBlockId(data.openCommentBlockId === id ? null : id)}
              onAddComment={data.handleAddComment}
              onOpenEmojiPicker={(blockId) => setEmojiPickerBlockId(blockId)}
              onOpenSongPicker={(blockId) => setSongPickerBlockId(blockId)}
              onToggleCollapse={(id) => {
                const next = new Set(data.openToggles);
                if (next.has(id)) next.delete(id); else next.add(id);
                data.setOpenToggles(next);
              }}
              onReorderBlock={data.handleReorderBlock}
            />
          ) : (
            <EmptyState
              hasSpace={Boolean(data.currentSpaceId)}
              onCreatePage={data.handleCreatePage}
              onCreateSpace={data.handleCreateSpace}
            />
          )}
        </div>
      </main>

      {/* Move Block Modal */}
      {movingBlock && (
        <MoveBlockModal
          block={movingBlock}
          pages={data.pages}
          onMove={(targetPageId) => {
            data.handleMoveBlockToPage(movingBlock, targetPageId);
            setMovingBlock(null);
            setToastMessage('Bloc déplacé ✓');
          }}
          onClose={() => setMovingBlock(null)}
        />
      )}

      {/* Song Picker Modal */}
      {songPickerBlockId && (
        <SongPickerModal
          songs={data.allSongs}
          onSelect={handleSongSelect}
          onClose={() => setSongPickerBlockId(null)}
        />
      )}

      {/* Emoji Picker Modal */}
      {emojiPickerBlockId && (
        <EmojiPickerModal
          onSelect={handleEmojiSelect}
          onClose={() => setEmojiPickerBlockId(null)}
        />
      )}

      {/* Global Search Modal */}
      {showGlobalSearch && (
        <GlobalSearchModal
          query={search.query}
          setQuery={search.setQuery}
          results={search.results}
          busy={search.busy}
          onSelect={handleSearchSelect}
          onClose={() => {
            setShowGlobalSearch(false);
            search.setQuery('');
          }}
        />
      )}

      {/* Toast */}
      <Toast message={toastMessage} />
    </div>
  );
};

export default App;