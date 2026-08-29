import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { Space, Page, Block, Profile, Song, Prerequisite, BlockType } from './types';
import {
  Search,
  Menu,
  Plus,
  Lock,
  Unlock,
  LogOut,
  Music,
  Send,
} from 'lucide-react';
import { fmtDate } from './lib/utils';
import { SPACE_ICONS } from './components/Icons';
import { PrerequisitesBar } from './components/PrerequisitesBar';
import { RepertoireView } from './components/RepertoireView';
import { SongPickerModal } from './components/SongPickerModal';
import { EmojiPickerModal } from './components/EmojiPickerModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { BlockItem } from './components/BlockItem';

export const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  const [songPickerBlockId, setSongPickerBlockId] = useState<string | null>(null);

  // Comments & Toggles
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [openCommentBlockId, setOpenCommentBlockId] = useState<string | null>(null);
  const [openToggles, setOpenToggles] = useState<Set<string>>(new Set());
  const [commentInput, setCommentInput] = useState('');

  // Modals & UI
  const [searchOpen, setSearchOpen] = useState(false);
  const [emojiPickerBlockId, setEmojiPickerBlockId] = useState<string | null>(null);
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

  useEffect(() => {
    if (session) {
      loadProfiles();
      loadSpaces();
      loadPrerequisites();
      loadSongs();
    }
  }, [session]);

  useEffect(() => {
    if (currentSpaceId) {
      loadPages(currentSpaceId);
    }
  }, [currentSpaceId]);

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

  const handleAddBlock = async (type: BlockType, parentBlockId: string | null = null) => {
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
      if (type === 'song') {
        setSongPickerBlockId(data.id);
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

  const handleChangeBlockType = async (block: Block, type: BlockType) => {
    let newContent: any = { text: block.content?.text || '' };
    if (type === 'callout') newContent = { text: block.content?.text || '', emoji: '💡' };
    if (type === 'video') newContent = { url: block.content?.url || '', caption: '' };
    if (type === 'song') newContent = {};

    setBlocks(blocks.map((b) => (b.id === block.id ? { ...b, type, content: newContent } : b)));
    await supabase.from('blocks').update({ type, content: newContent }).eq('id', block.id);
    if (type === 'song') {
      setSongPickerBlockId(block.id);
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

  const handleAddComment = async (blockId: string) => {
    if (!commentInput.trim()) return;
    const { data } = await supabase
      .from('comments')
      .insert({
        block_id: blockId,
        user_id: session.user.id,
        content: commentInput.trim(),
      })
      .select()
      .single();
    if (data) {
      setCommentsMap((prev) => ({
        ...prev,
        [blockId]: [...(prev[blockId] || []), data],
      }));
      setCommentInput('');
    }
  };

  const profileMap: Record<string, string> = {};
  Object.values(profiles).forEach((p) => {
    profileMap[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email?.split('@')[0] || 'Inconnu';
  });

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

  const activeSpace = spaces.find((s) => s.id === currentSpaceId);
  const activePage = pages.find((p) => p.id === currentPageId);
  const topLevelBlocks = blocks.filter((b) => !b.parent_block_id);

  return (
    <div className="flex h-screen w-full bg-bg overflow-hidden">
      {/* Mobile topbar */}
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
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-surface border-r border-border flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-terracotta flex items-center justify-center text-sm animate-spin-slow">
              🪘
            </div>
            <span className="font-display font-bold text-lg text-ink">Roda de Notas</span>
          </div>
        </div>

        {/* Global search trigger */}
        <div className="p-3 border-b border-border">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 bg-bg hover:border-terracotta border border-border rounded-xl text-xs text-muted transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">Rechercher…</span>
            <kbd className="text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Spaces */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Espaces</span>
              <button
                onClick={handleCreateSpace}
                className="text-green hover:text-green-light p-1 rounded hover:bg-green-soft text-xs"
                title="Ajouter un espace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {spaces.map((s, idx) => {
                const IconComp = SPACE_ICONS[idx % SPACE_ICONS.length];
                const cov = spaceCoverage[s.id];
                const isActive = s.id === currentSpaceId;

                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentSpaceId(s.id);
                      setCurrentPageId(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-colors text-left ${
                      isActive
                        ? 'bg-terracotta-soft text-ink font-semibold'
                        : 'hover:bg-bg text-ink'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs flex-shrink-0 ${
                        isActive
                          ? 'bg-terracotta border-terracotta text-white'
                          : 'bg-white border-border text-terracotta'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-semibold">{s.name}</div>
                      {cov && (
                        <div className="flex gap-1 mt-1">
                          <span className="text-[9px] px-1 rounded bg-green-soft text-green font-bold">
                            2e {cov['2']}%
                          </span>
                          <span className="text-[9px] px-1 rounded bg-ochre-soft text-[#8a6a1f] font-bold">
                            3e {cov['3']}%
                          </span>
                          <span className="text-[9px] px-1 rounded bg-[#dce8f5] text-[#2c5d8a] font-bold">
                            4e {cov['4']}%
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {activeSpace ? activeSpace.name : 'Cours'}
              </span>
              {currentSpaceId && (
                <button
                  onClick={handleCreatePage}
                  className="text-green hover:text-green-light p-1 rounded hover:bg-green-soft text-xs"
                  title="Ajouter un cours"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCurrentPageId(p.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                    p.id === currentPageId
                      ? 'bg-green-soft text-green font-bold'
                      : 'hover:bg-bg text-ink font-medium'
                  }`}
                >
                  <span className="truncate flex-1">{p.title || 'Sans titre'}</span>
                  {p.locked && <Lock className="w-3 h-3 text-muted ml-2 flex-shrink-0" />}
                </button>
              ))}
              {currentSpaceId && (
                <button
                  onClick={() => {
                    setCurrentPageId('__repertoire__');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs italic text-left border border-dashed border-border transition-colors mt-2 ${
                    currentPageId === '__repertoire__'
                      ? 'bg-green-soft text-green font-bold border-green'
                      : 'hover:bg-bg text-muted'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Répertoire des chants</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted">
          <span className="truncate max-w-[140px] font-medium">
            {profileMap[session.user.id] || session.user.email}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1 text-terracotta font-semibold hover:underline"
            title="Déconnexion"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sortir</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 p-6 md:p-12">
        <div className="max-w-3xl mx-auto pb-24">
          {currentPageId === '__repertoire__' ? (
            <RepertoireView spaceName={activeSpace?.name || ''} pages={pages} />
          ) : activePage ? (
            <div>
              <div className="flex items-center justify-between gap-4 mb-1">
                <input
                  type="text"
                  value={activePage.title || ''}
                  readOnly={activePage.locked}
                  onChange={(e) => handleUpdatePageTitle(e.target.value)}
                  placeholder="Titre du cours"
                  className="text-3xl md:text-4xl font-display font-bold text-ink bg-transparent border-none outline-none w-full"
                />
                <button
                  onClick={handleToggleLock}
                  className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-colors ${
                    activePage.locked
                      ? 'bg-ochre-soft text-[#7a5c10] border-ochre hover:bg-ochre hover:text-white'
                      : 'bg-surface text-muted border-border hover:text-ink'
                  }`}
                  title={activePage.locked ? 'Déverrouiller' : 'Verrouiller'}
                >
                  {activePage.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{activePage.locked ? 'Verrouillé' : 'Verrouiller'}</span>
                </button>
              </div>

              <p className="text-xs text-muted mb-6">
                Modifié {fmtDate(activePage.updated_at || activePage.created_at)} · espace « {activeSpace?.name} »
              </p>

              {/* Prerequisites Bar */}
              <PrerequisitesBar
                prerequisites={allPrerequisites}
                selectedIds={pagePrereqIds}
                spaceCounts={spacePrereqCounts}
                locked={activePage.locked}
                onToggle={handleTogglePrerequisite}
              />

              {/* Blocks */}
              <div className="space-y-1">
                {topLevelBlocks.map((b) => (
                  <div key={b.id}>
                    <BlockItem
                      block={b}
                      childBlocks={blocks.filter((child) => child.parent_block_id === b.id)}
                      locked={activePage.locked}
                      activeBlockId={activeBlockId}
                      commentsCount={(commentsMap[b.id] || []).length}
                      openCommentBlockId={openCommentBlockId}
                      openToggles={openToggles}
                      profileMap={profileMap}
                      onSelectBlock={setActiveBlockId}
                      onUpdateContent={handleUpdateBlockContent}
                      onChangeType={handleChangeBlockType}
                      onDuplicate={handleDuplicateBlock}
                      onMoveToPage={() => {}}
                      onDelete={handleDeleteBlock}
                      onToggleComment={(id) =>
                        setOpenCommentBlockId(openCommentBlockId === id ? null : id)
                      }
                      onOpenEmojiPicker={setEmojiPickerBlockId}
                      onOpenSongPicker={setSongPickerBlockId}
                      onToggleCollapse={(id) => {
                        const next = new Set(openToggles);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        setOpenToggles(next);
                      }}
                      onAddChildBlock={(parentId) => handleAddBlock('paragraph', parentId)}
                    />

                    {/* Comments panel */}
                    {openCommentBlockId === b.id && (
                      <div className="my-2 p-3 bg-surface border border-border rounded-xl shadow-sm space-y-2">
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(commentsMap[b.id] || []).length === 0 ? (
                            <p className="text-xs text-muted italic">Aucun commentaire.</p>
                          ) : (
                            (commentsMap[b.id] || []).map((c) => (
                              <div key={c.id} className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-green">
                                    {profileMap[c.user_id] || 'Inconnu'}
                                  </span>
                                  <span className="text-[10px] text-muted">{fmtDate(c.created_at)}</span>
                                </div>
                                <div className="text-ink mt-0.5">{c.content}</div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <input
                            type="text"
                            placeholder="Ajouter un commentaire…"
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(b.id);
                            }}
                            className="flex-1 text-xs px-2.5 py-1.5 bg-bg border border-border rounded-lg outline-none focus:border-green text-ink"
                          />
                          <button
                            onClick={() => handleAddComment(b.id)}
                            className="bg-green text-white p-1.5 rounded-lg text-xs hover:bg-green-light"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add block button */}
              {!activePage.locked && (
                <div className="mt-4">
                  <button
                    onClick={() => handleAddBlock('paragraph')}
                    className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-border rounded-xl text-xs font-semibold text-muted hover:border-terracotta hover:text-terracotta hover:bg-terracotta-soft transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un bloc</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-muted">
              <div className="text-4xl mb-4">🪘</div>
              <h2 className="text-xl font-bold font-display text-ink mb-2">Bem-vindo !</h2>
              <p className="text-sm mb-6">Sélectionnez ou créez un cours pour commencer à noter vos séances.</p>
              {currentSpaceId && (
                <button
                  onClick={handleCreatePage}
                  className="bg-terracotta text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau cours</span>
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Global Modals */}
      {searchOpen && (
        <GlobalSearchModal
          spaces={spaces}
          onSelect={(sId, pId) => {
            setCurrentSpaceId(sId);
            setCurrentPageId(pId);
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {songPickerBlockId && (
        <SongPickerModal
          songs={allSongs}
          onSelect={(song) => {
            const block = blocks.find((b) => b.id === songPickerBlockId);
            if (block) {
              handleUpdateBlockContent(block, {
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
            const block = blocks.find((b) => b.id === emojiPickerBlockId);
            if (block) {
              handleUpdateBlockContent(block, { text: (block.content?.text || '') + emoji });
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