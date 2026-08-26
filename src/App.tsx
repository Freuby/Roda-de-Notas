import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { Space, Page, Block, Profile, NotificationItem } from './types';
import { Search, Menu, Plus, Lock, Unlock, LogOut, MessageSquare, Music } from 'lucide-react';
import { fmtDate, SONG_CATEGORIES } from './lib/utils';
import { BerimbauIcon } from './components/Icons';

export const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    }
  }, [currentPageId]);

  const loadProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, first_name, last_name, email');
    if (data) {
      const map: Record<string, Profile> = {};
      data.forEach((p) => (map[p.id] = p));
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
    }
  };

  const loadBlocks = async (pageId: string) => {
    const { data } = await supabase
      .from('blocks')
      .select('*')
      .eq('page_id', pageId)
      .order('order_index', { ascending: true });
    if (data) setBlocks(data);
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

  const activePage = pages.find((p) => p.id === currentPageId);

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
        <div className="w-5" />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-surface border-r border-border flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-terracotta flex items-center justify-center text-sm animate-spin-slow">
              🪘
            </div>
            <span className="font-display font-bold text-lg text-ink">Roda de Notas</span>
          </div>
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
              {spaces.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentSpaceId(s.id);
                    setCurrentPageId(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left ${
                    s.id === currentSpaceId
                      ? 'bg-terracotta-soft text-ink font-semibold'
                      : 'hover:bg-bg text-ink'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center text-xs text-terracotta">
                    <BerimbauIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate flex-1">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Cours</span>
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    p.id === currentPageId
                      ? 'bg-green-soft text-green font-semibold'
                      : 'hover:bg-bg text-ink'
                  }`}
                >
                  <span className="truncate flex-1">{p.title || 'Sans titre'}</span>
                  {p.locked && <Lock className="w-3.5 h-3.5 text-muted ml-2 flex-shrink-0" />}
                </button>
              ))}
              {currentSpaceId && (
                <button
                  onClick={() => {
                    setCurrentPageId('__repertoire__');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs italic text-left border border-dashed border-border transition-colors ${
                    currentPageId === '__repertoire__'
                      ? 'bg-green-soft text-green font-semibold border-green'
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
          <span className="truncate max-w-[140px]">{session.user.email}</span>
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
        <div className="max-w-3xl mx-auto">
          {activePage ? (
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-ink mb-2">
                {activePage.title}
              </h1>
              <p className="text-xs text-muted mb-8">
                Dernière modification {fmtDate(activePage.updated_at || activePage.created_at)}
              </p>

              <div className="space-y-4">
                {blocks.length === 0 ? (
                  <div className="text-sm text-muted italic p-8 border border-dashed border-border rounded-card text-center">
                    Ce cours est vide. Ajoutez vos exercices, séquences ou chants.
                  </div>
                ) : (
                  blocks.map((b) => (
                    <div key={b.id} className="p-3 bg-surface border border-border rounded-lg text-sm text-ink">
                      {b.content?.text || b.content?.title || `[Bloc ${b.type}]`}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-muted">
              <div className="text-4xl mb-4">🪘</div>
              <h2 className="text-xl font-bold font-display text-ink mb-2">Bem-vindo !</h2>
              <p className="text-sm mb-6">Sélectionnez ou créez un cours pour commencer à noter vos séances.</p>
              {currentSpaceId && (
                <button
                  onClick={handleCreatePage}
                  className="bg-terracotta text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau cours</span>
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;