import React, { useEffect, useState } from 'react';
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
import { Block, Space, NotificationItem } from './types';
import { Menu, Search, Undo, Redo, Moon, Sun } from 'lucide-react';

export const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Modals & UI state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [emojiPickerBlockId, setEmojiPickerBlockId] = useState<string | null>(null);
  const [songPickerBlockId, setSongPickerBlockId] = useState<string | null>(null);
  const [movingBlock, setMovingBlock] = useState<Block | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Block history state for undo/redo
  const [blockHistory, setBlockHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2400);
  };

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('roda-theme', theme);
  }, [theme]);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('roda-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Global shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      
      // Arrow key navigation between blocks
      if (session && !e.shiftKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            navigateBlock('up');
            break;
          case 'ArrowDown':
            e.preventDefault();
            navigateBlock('down');
            break;
          case 'ArrowLeft':
            e.preventDefault();
            navigateBlock('left');
            break;
          case 'ArrowRight':
            e.preventDefault();
            navigateBlock('right');
            break;
          case 'Escape':
            e.preventDefault();
            setActiveBlockId(null);
            setSearchOpen(false);
            break;
        }
      }
      
      // Undo/Redo shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redoBlock();
        } else {
          undoBlock();
        }
      }
      
      // Delete block
      if (e.key === 'Delete' && activeBlockId) {
        e.preventDefault();
        deleteActiveBlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, activeBlockId, blockHistory]);

  const data = useRodaData(session);

  // Block navigation functions
  const navigateBlock = (direction: 'up' | 'down' | 'left' | 'right') => {
    const currentIndex = data.blocks.findIndex(b => b.id === activeBlockId);
    if (currentIndex === -1) return;
    
    let targetIndex = currentIndex;
    
    switch (direction) {
      case 'up':
        targetIndex = Math.max(0, currentIndex - 1);
        break;
      case 'down':
        targetIndex = Math.min(data.blocks.length - 1, currentIndex + 1);
        break;
      case 'left':
        targetIndex = Math.max(0, currentIndex - 1);
        break;
      case 'right':
        targetIndex = Math.min(data.blocks.length - 1, currentIndex + 1);
        break;
    }
    
    const targetBlock = data.blocks[targetIndex];
    if (targetBlock) {
      setActiveBlockId(targetBlock.id);
      // Scroll the block into view
      setTimeout(() => {
        const element = document.querySelector(`[data-block-id="${targetBlock.id}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Block history functions
  const saveToHistory = (action: string, block: Block, previousContent?: any) => {
    const historyItem = {
      action,
      blockId: block.id,
      blockType: block.type,
      previousContent,
      newContent: block.content,
      timestamp: Date.now(),
    };
    
    setBlockHistory(prev => [...prev.slice(0, historyIndex + 1), historyItem]);
    setHistoryIndex(prev => prev + 1);
  };

  const undoBlock = () => {
    if (historyIndex > 0) {
      const previousItem = blockHistory[historyIndex - 1];
      setHistoryIndex(prev => prev - 1);
      
      // Restore previous content
      data.setBlocks(prev => prev.map(b => 
        b.id === previousItem.blockId 
          ? { ...b, content: previousItem.previousContent }
          : b
      ));
      
      showToast('Annulé');
    }
  };

  const redoBlock = () => {
    if (historyIndex < blockHistory.length - 1) {
      const nextItem = blockHistory[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);
      
      // Restore next content
      data.setBlocks(prev => prev.map(b => 
        b.id === nextItem.blockId 
          ? { ...b, content: nextItem.newContent }
          : b
      ));
      
      showToast('Répété');
    }
  };

  const deleteActiveBlock = () => {
    const block = data.blocks.find(b => b.id === activeBlockId);
    if (block) {
      saveToHistory('delete', block, block.content);
      data.handleDeleteBlock(block);
      setActiveBlockId(null);
      showToast('Bloc supprimé');
    }
  };

  // Enhanced search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchBusy(true);
      
      const q = searchQuery.toLowerCase();
      
      // Search in spaces
      const spaceMatches = data.spaces.filter(s => 
        s.name.toLowerCase().includes(q)
      );
      
      // Search in pages
      const pageMatches = data.pages.filter(p => 
        p.title.toLowerCase().includes(q)
      );
      
      // Search in blocks
      const blockMatches = data.blocks.filter(b => {
        const content = JSON.stringify(b.content).toLowerCase();
        return content.includes(q);
      });
      
      // Combine results
      const results = [
        ...spaceMatches.map(s => ({
          type: 'space',
          title: s.name,
          subtitle: `${data.pages.filter(p => p.space_id === s.id).length} cours`,
          id: s.id,
          spaceId: s.id,
        })),
        ...pageMatches.map(p => ({
          type: 'page',
          title: p.title,
          subtitle: `Espace: ${data.spaces.find(s => s.id === p.space_id)?.name || ''}`,
          id: p.id,
          spaceId: p.space_id,
          pageId: p.id,
        })),
        ...blockMatches.map(b => ({
          type: 'block',
          title: b.content?.text || b.content?.title || b.type,
          subtitle: `Page: ${data.pages.find(p => p.id === b.page_id)?.title || ''}`,
          id: b.id,
          spaceId: data.pages.find(p => p.id === b.page_id)?.space_id,
          pageId: b.page_id,
          blockId: b.id,
          blockType: b.type,
        }))
      ];
      
      setSearchResults(results.slice(0, 20));
      setSearchBusy(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSelect = (result: any) => {
    if (result.type === 'space') {
      data.setCurrentSpaceId(result.spaceId);
    } else if (result.type === 'page') {
      data.setCurrentSpaceId(result.spaceId);
      data.setCurrentPageId(result.pageId);
    } else if (result.type === 'block') {
      data.setCurrentSpaceId(result.spaceId);
      data.setCurrentPageId(result.pageId);
      setActiveBlockId(result.blockId);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSelectNotification = async (notif: NotificationItem) => {
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
  };

  const handleArchiveSpace = async (space: Space) => {
    showToast('Génération de l\'archive…');
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
    showToast('Archive téléchargée ✓');
  };

  const handleImportArchive = async (file: File) => {
    showToast('Lecture de l\'archive…');
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const dataEl = doc.getElementById('roda-archive-data');
      if (!dataEl) {
        showToast('Fichier non reconnu');
        return;
      }

      const payload = JSON.parse(dataEl.textContent || '{}');
      const { space, pages: impPages, blocks: impBlocks } = payload;
      if (!space || !impPages) return;

      const maxOrder = data.spaces.reduce((m, s) => Math.max(m, s.order_index || 0), -1);
      const { data: newSpace } = await supabase
        .from('spaces')
        .insert({
          name: `${space.name} (importé)`,
          created_by: session.user.id,
          order_index: maxOrder + 1,
        })
        .select()
        .single();

      if (!newSpace) return;

      const pageIdMap: Record<string, string> = {};
      for (const p of impPages) {
        const { data: newPage } = await supabase
          .from('pages')
          .insert({
            space_id: newSpace.id,
            title: p.title,
            created_by: session.user.id,
            order_index: p.order_index,
            locked: false,
          })
          .select()
          .single();
        if (newPage) pageIdMap[p.id] = newPage.id;
      }

      const blockIdMap: Record<string, string> = {};
      const sorted = [...(impBlocks || [])].sort(
        (a, b) => (a.parent_block_id ? 1 : 0) - (b.parent_block_id ? 1 : 0)
      );

      for (const b of sorted) {
        const newPageId = pageIdMap[b.page_id];
        if (!newPageId) continue;
        const newParentId = b.parent_block_id ? blockIdMap[b.parent_block_id] : null;

        const { data: newBlock } = await supabase
          .from('blocks')
          .insert({
            page_id: newPageId,
            type: b.type,
            content: b.content,
            parent_block_id: newParentId,
            order_index: b.order_index,
            created_by: session.user.id,
          })
          .select()
          .single();
        if (newBlock) blockIdMap[b.id] = newBlock.id;
      }

      showToast('Archive importée ✓');
      window.location.reload();
    } catch (err) {
      showToast('Erreur lors de l\'import');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-muted font-display text-sm">
        Chargement de la roda…
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  const activeSpace = data.spaces.find((s) => s.id === data.currentSpaceId);
  const activePage = data.pages.find((p) => p.id === data.currentPageId);

  return (
    <div className="flex h-screen w-full bg-bg text-ink overflow-hidden transition-colors duration-300">
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border flex items-center justify-between px-4 z-20">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-ink">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-display font-bold text-ink flex items-center gap-2">
          <span className="text-terracotta">🪘</span> Roda de Notas
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 text-muted hover:text-ink">
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button onClick={() => setSearchOpen(true)} className="p-2 text-muted">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
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
        onSelectSpace={(sId) => {
          data.setCurrentSpaceId(sId);
          data.setCurrentPageId(null);
        }}
        onRenameSpace={data.handleRenameSpace}
        onDeleteSpace={data.handleDeleteSpace}
        onArchiveSpace={handleArchiveSpace}
        onImportArchive={handleImportArchive}
        onSelectPage={data.setCurrentPageId}
        onDuplicatePage={async (p) => {
          await data.handleDuplicatePage(p);
          showToast('Cours dupliqué ✓');
        }}
        onDeletePage={data.handleDeletePage}
        onCreateSpace={data.handleCreateSpace}
        onCreatePage={data.handleCreatePage}
        onOpenSearch={() => setSearchOpen(true)}
        onMarkAllRead={data.markAllNotificationsRead}
        onSelectNotification={handleSelectNotification}
      />

      {/* Main Content Area */}
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
              onChangeBlockType={(b, type) => data.handleChangeBlockType(b, type, setSongPickerBlockId)}
              onDuplicateBlock={async (b) => {
                await data.handleDuplicateBlock(b);
                showToast('Bloc dupliqué ✓');
              }}
              onMoveBlockToPage={(b) => setMovingBlock(b)}
              onDeleteBlock={data.handleDeleteBlock}
              onAddBlock={(type, parentId) => data.handleAddBlock(type, parentId, setSongPickerBlockId)}
              onToggleComment={(id) =>
                data.setOpenCommentBlockId(data.openCommentBlockId === id ? null : id)
              }
              onAddComment={data.handleAddComment}
              onOpenEmojiPicker={setEmojiPickerBlockId}
              onOpenSongPicker={setSongPickerBlockId}
              onToggleCollapse={(id) => {
                const next = new Set(data.openToggles);
                if (next.has(id)) next.delete(id);
                else next.add(id);
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

      {/* Global Modals */}
      {searchOpen && (
        <GlobalSearchModal
          spaces={data.spaces}
          onSelect={(sId, pId) => {
            data.setCurrentSpaceId(sId);
            data.setCurrentPageId(pId);
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {movingBlock && (
        <MoveBlockModal
          block={movingBlock}
          pages={data.pages}
          onMove={(targetPageId) => {
            data.handleMoveBlockToPage(movingBlock, targetPageId);
            setMovingBlock(null);
            showToast('Bloc déplacé ✓');
          }}
          onClose={() => setMovingBlock(null)}
        />
      )}

      {songPickerBlockId && (
        <SongPickerModal
          songs={data.allSongs}
          onSelect={(song) => {
            const block = data.blocks.find((b) => b.id === songPickerBlockId);
            if (block) {
              data.handleUpdateBlockContent(block, {
                song_id: song.id,
                title: song.title,
                category: song.category,
                mnemonic: song.mnemonic,
                lyrics: song.lyrics,
                mediaLink: song.mediaLink,
              });
            }
            setSongPickerBlockId(null);
          }}
          onClose={() => setSongPickerBlockId(null)}
        />
      )}

      {emojiPickerBlockId && (
        <EmojiPickerModal
          onSelect={(emoji) => {
            const block = data.blocks.find((b) => b.id === emojiPickerBlockId);
            if (block) {
              data.handleUpdateBlockContent(block, { text: (block.content?.text || '') + emoji });
            }
            setEmojiPickerBlockId(null);
          }}
          onClose={() => setEmojiPickerBlockId(null)}
        />
      )}

      {/* Toast popup */}
      <Toast message={toastMessage} />
    </div>
  );
};

export default App;