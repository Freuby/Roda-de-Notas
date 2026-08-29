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
import { useRodaData } from './hooks/useRodaData';
import { Block, NotificationItem } from './types';
import { Menu, Search } from 'lucide-react';

export const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals & UI state
  const [searchOpen, setSearchOpen] = useState(false);
  const [emojiPickerBlockId, setEmojiPickerBlockId] = useState<string | null>(null);
  const [songPickerBlockId, setSongPickerBlockId] = useState<string | null>(null);
  const [movingBlock, setMovingBlock] = useState<Block | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const data = useRodaData(session);

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
    <div className="flex h-screen w-full bg-bg overflow-hidden">
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border flex items-center justify-between px-4 z-20">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-ink">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-display font-bold text-ink flex items-center gap-2">
          <span className="text-terracotta">🪘</span> Roda de Notas
        </span>
        <button onClick={() => setSearchOpen(true)} className="p-2 text-muted">
          <Search className="w-4 h-4" />
        </button>
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
        onSelectPage={data.setCurrentPageId}
        onDuplicatePage={data.handleDuplicatePage}
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
              onDuplicateBlock={data.handleDuplicateBlock}
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
    </div>
  );
};

export default App;