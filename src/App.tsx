import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { PageEditor } from './components/PageEditor';
import { EmptyState } from './components/EmptyState';
import { RepertoireView } from './components/RepertoireView';
import { SongPickerModal } from './components/SongPickerModal';
import { EmojiPickerModal } from './components/EmojiPickerModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { MoveBlockModal } from './components/MoveBlockModal';
import { Toast } from './components/Toast';
import { downloadSpaceArchive } from './lib/archive';
import { useRodaData } from './hooks/useRodaData';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSearch } from './hooks/useSearch';
import { useBlockHistory } from './hooks/useBlockHistory';
import { useTheme } from './hooks/useTheme';
import { MobileTopbar } from './components/MobileTopbar';
import { Block, Space, NotificationItem } from './types';

export const App: React.FC = () => {
  // --- Core state ---
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [movingBlock, setMovingBlock] = useState<Block | null>(null);

  // --- Hooks ---
  const { theme, toggleTheme } = useTheme();
  const data = useRodaData(session);
  const search = useSearch({ spaces: data.spaces, pages: data.pages, blocks: data.blocks });
  const history = useBlockHistory();

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

  const undoBlock = useCallback(() => {
    const entry = history.undoBlock();
    if (entry) {
      data.setBlocks((prev: Block[]) =>
        prev.map((b) => (b.id === entry.blockId ? { ...b, content: entry.previousContent } : b))
      );
      setToastMessage('Annulé');
    }
  }, [history, data]);

  const redoBlock = useCallback(() => {
    const entry = history.redoBlock();
    if (entry) {
      data.setBlocks((prev: Block[]) =>
        prev.map((b) => (b.id === entry.blockId ? { ...b, content: entry.newContent } : b))
      );
      setToastMessage('Répété');
    }
  }, [history, data]);

  const deleteActiveBlock = useCallback(() => {
    const block = data.blocks.find((b) => b.id === activeBlockId);
    if (block) {
      history.saveToHistory('delete', block, block.content);
      data.handleDeleteBlock(block);
      setActiveBlockId(null);
      setToastMessage('Bloc supprimé');
    }
  }, [data, activeBlockId, history]);

  // --- Keyboard shortcuts ---
  useKeyboardShortcuts({
    session,
    activeBlockId,
    blockHistory: history.blockHistory,
    historyIndex: history.historyIndex,
    setActiveBlockId,
    setSearchOpen: search.setQuery,
    setBlockHistory: history.setBlockHistory,
    setHistoryIndex: history.setHistoryIndex,
    setToastMessage,
    navigateBlock,
    undoBlock,
    redoBlock,
    deleteActiveBlock,
  });

  // --- Search handlers ---
  const handleSearchSelect = useCallback(
    (result: any) => {
      const action = search.selectResult(result);
      if (!action) return;
      if (action.action === 'selectSpace') data.setCurrentSpaceId(action.spaceId);
      else if (action.action === 'selectPage') {
        data.setCurrentSpaceId(action.spaceId);
        data.setCurrentPageId(action.pageId);
      } else if (action.action === 'selectBlock') {
        data.setCurrentSpaceId(action.spaceId);
        data.setCurrentPageId(action.pageId);
        setActiveBlockId(action.blockId);
      }
      search.setQuery('');
    },
    [search, data]
  );

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

  // --- Archive / Import ---
  const handleArchiveSpace = useCallback(async (space: Space) => {
    setToastMessage('Génération de l\'archive…');
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
    setToastMessage('Lecture de l\'archive…');
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
    } catch { setToastMessage('Erreur lors de l\'import'); }
  }, [data, session]);

  // --- Reorder handlers ---
  const handleReorderPages = useCallback((draggedId: string, targetId: string, position: 'before' | 'after') => {
    data.handleReorderPage(draggedId, targetId, position);
  }, [data]);

  const handleMoveSpace = useCallback((space: Space, direction: -1 | 1) => {
    data.handleMoveSpace(space, direction);
  }, [data]);

  // --- Toast ---
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

  // --- Loading / Auth ---
  if (loading) return <div className="flex h-screen items-center justify-center bg-bg text-muted font-display text-sm">Chargement de la roda…</div>;
  if (!session) return <AuthScreen />;

  const activeSpace = data.spaces.find((s) => s.id === data.currentSpaceId);
  const activePage = data.pages.find((p) => p.id === data.currentPageId);

  return (
    <div className="flex h-screen w-full bg-bg text-ink overflow-hidden transition-colors duration-300">
      <MobileTopbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenSearch={() => search.setQuery('')}
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
        onOpenSearch={() => search.setQuery('')}
        onMarkAllRead={data.markAllNotificationsRead}
        onSelectNotification={handleSelectNotification}
        onReorderPages={handleReorderPages}
        onMoveSpace={handleMoveSpace}
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
              onUpdateBlockContent={data.handleUpdateBlockContent}
              onChangeBlockType={(b, type) => data.handleChangeBlockType(b, type, setMovingBlock)}
              onDuplicateBlock={async (b) => { await data.handleDuplicateBlock(b); setToastMessage('Bloc dupliqué ✓'); }}
              onMoveBlockToPage={(b) => setMovingBlock(b)}
              onDeleteBlock={data.handleDeleteBlock}
              onAddBlock={(type, parentId) => data.handleAddBlock(type, parentId, setMovingBlock)}
              onToggleComment={(id) => data.setOpenCommentBlockId(data.openCommentBlockId === id ? null : id)}
              onAddComment={data.handleAddComment}
              onOpenEmojiPicker={setMovingBlock}
              onOpenSongPicker={setMovingBlock}
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

      {search.query && (
        <GlobalSearchModal
          spaces={data.spaces}
          onSelect={(sId, pId) => {
            data.setCurrentSpaceId(sId);
            data.setCurrentPageId(pId);
          }}
          onClose={() => search.setQuery('')}
        />
      )}

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

      {/* Song picker, emoji picker, toast handled via setMovingBlock / setToastMessage */}
      <Toast message={toastMessage} />
    </div>
  );
};

export default App;