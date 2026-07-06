import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useSession } from './SessionContext';
import { Space, Page, Profile } from '../types';

const LAST_LOCATION_KEY = 'roda-last-location';

interface WorkspaceState {
  // Données
  spaces: Space[];
  pages: Page[];
  profiles: Record<string, Profile>;
  // Sélection
  currentSpaceId: string | null;
  currentPageId: string | null;
  // UI
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
}

type WorkspaceContextType = WorkspaceState & {
  // Navigation
  selectSpace: (id: string) => Promise<void>;
  selectPage: (id: string) => Promise<void>;
  createSpace: () => Promise<void>;
  createPage: () => Promise<void>;
  renameSpace: (space: Space, name: string) => Promise<void>;
  renamePage: (page: Page, title: string) => Promise<void>;
  // Ordre
  moveSpace: (space: Space, dir: -1 | 1) => Promise<void>;
  movePage: (page: Page, dir: -1 | 1) => Promise<void>;
  // Suppression
  deleteSpace: (space: Space) => Promise<void>;
  deletePage: (page: Page) => Promise<void>;
  // Verrouillage
  toggleLock: (page: Page) => Promise<void>;
  // Duplication
  duplicatePage: (page: Page) => Promise<void>;
  // UI
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSession();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('roda-sidebar-collapsed') === '1';
  });

  // Charger tous les profils une fois connecté
  useEffect(() => {
    if (!session) return;
    supabase.from('profiles').select('id,first_name,last_name,email').then(({ data }) => {
      const map: Record<string, Profile> = {};
      data?.forEach(p => { map[p.id] = p; });
      setProfiles(map);
    });
  }, [session]);

  // Charger les espaces
  useEffect(() => {
    if (!session) return;
    supabase
      .from('spaces')
      .select('*')
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        setSpaces(data || []);
        // Sélectionner premier espace si aucune sélection
        if (data?.length && !currentSpaceId) {
          setCurrentSpaceId(data[0].id);
        }
      });
  }, [session, currentSpaceId]);

  // Charger les pages quand l'espace change
  useEffect(() => {
    if (!session || !currentSpaceId) return;
    supabase
      .from('pages')
      .select('*')
      .eq('space_id', currentSpaceId)
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        setPages(data || []);
        // Sélectionner premier page si aucune
        if (data?.length && !currentPageId) {
          setCurrentPageId(data[0].id);
        }
      });
  }, [session, currentSpaceId]);

  // Sauvegarder la dernière position ouverte
  useEffect(() => {
    if (currentSpaceId && currentPageId) {
      localStorage.setItem(
        LAST_LOCATION_KEY,
        JSON.stringify({ spaceId: currentSpaceId, pageId: currentPageId })
      );
    }
  }, [currentSpaceId, currentPageId]);

  const selectSpace = useCallback(async (id: string) => {
    setCurrentSpaceId(id);
    setCurrentPageId(null);
  }, []);

  const selectPage = useCallback(async (id: string) => {
    setCurrentPageId(id);
  }, []);

  // === CRUD espaces ===
  const createSpace = useCallback(async () => {
    const name = prompt('Nom du nouvel espace (ex : Année 2026-2027)');
    if (!name?.trim()) return;
    const maxOrder = spaces.reduce((m, s) => Math.max(m, s.order_index || 0), -1);
    const { data, error } = await supabase.from('spaces').insert({
      name: name.trim(),
      created_by: session?.user.id,
      order_index: maxOrder + 1,
    }).select().single();
    if (!error && data) {
      setSpaces(prev => [...prev, data]);
      setCurrentSpaceId(data.id);
    }
  }, [spaces, session]);

  const renameSpace = useCallback(async (space: Space, name: string) => {
    const { error } = await supabase.from('spaces').update({ name }).eq('id', space.id);
    if (!error) {
      setSpaces(prev => prev.map(s => s.id === space.id ? { ...s, name } : s));
    }
  }, []);

  const deleteSpace = useCallback(async (space: Space) => {
    if (!confirm(`Supprimer l'espace « ${space.name} » ?`)) return;
    const { error } = await supabase.from('spaces').delete().eq('id', space.id);
    if (!error) {
      setSpaces(prev => prev.filter(s => s.id !== space.id));
    }
  }, []);

  const moveSpace = useCallback(async (space: Space, dir: -1 | 1) => {
    const idx = spaces.findIndex(s => s.id === space.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= spaces.length) return;
    const other = spaces[swapIdx];
    const { error: e1 } = await supabase.from('spaces').update({ order_index: other.order_index }).eq('id', space.id);
    const { error: e2 } = await supabase.from('spaces').update({ order_index: space.order_index }).eq('id', other.id);
    if (!e1 && !e2) {
      setSpaces(prev => {
        const next = [...prev];
        [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
        return next;
      });
    }
  }, [spaces]);

  // === CRUD pages ===
  const createPage = useCallback(async () => {
    if (!currentSpaceId) return;
    const maxOrder = pages.reduce((m, p) => Math.max(m, p.order_index || 0), -1);
    const { data, error } = await supabase.from('pages').insert({
      space_id: currentSpaceId,
      title: 'Nouveau cours',
      created_by: session?.user.id,
      order_index: maxOrder + 1,
      locked: false,
    }).select().single();
    if (!error && data) {
      setPages(prev => [...prev, data]);
      setCurrentPageId(data.id);
    }
  }, [currentSpaceId, pages, session]);

  const renamePage = useCallback(async (page: Page, title: string) => {
    const { error } = await supabase.from('pages').update({ title }).eq('id', page.id);
    if (!error) {
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, title } : p));
    }
  }, []);

  const deletePage = useCallback(async (page: Page) => {
    if (page.locked) { alert('Cours verrouillé — déverrouillez-le d\'abord.'); return; }
    if (!confirm(`Supprimer le cours « ${page.title} » ?`)) return;
    const { error } = await supabase.from('pages').delete().eq('id', page.id);
    if (!error) {
      setPages(prev => prev.filter(p => p.id !== page.id));
    }
  }, []);

  const movePage = useCallback(async (page: Page, dir: -1 | 1) => {
    const idx = pages.findIndex(p => p.id === page.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= pages.length) return;
    const other = pages[swapIdx];
    const { error: e1 } = await supabase.from('pages').update({ order_index: other.order_index }).eq('id', page.id);
    const { error: e2 } = await supabase.from('pages').update({ order_index: page.order_index }).eq('id', other.id);
    if (!e1 && !e2) {
      setPages(prev => {
        const next = [...prev];
        [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
        return next;
      });
    }
  }, [pages]);

  const toggleLock = useCallback(async (page: Page) => {
    const { error } = await supabase.from('pages').update({ locked: !page.locked }).eq('id', page.id);
    if (!error) {
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, locked: !p.locked } : p));
    }
  }, []);

  const duplicatePage = useCallback(async (page: Page) => {
    const maxOrder = pages.reduce((m, p) => Math.max(m, p.order_index || 0), -1);
    const { data: newPage } = await supabase.from('pages').insert({
      space_id: page.space_id,
      title: `${page.title} (copie)`,
      created_by: session?.user.id,
      order_index: maxOrder + 1,
      locked: false,
    }).select().single();
    // Duplicate blocks (non implémenté ici — sera fait plus tard)
    if (newPage) {
      setPages(prev => [...prev, newPage]);
      setCurrentPageId(newPage.id);
    }
  }, [pages, session]);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      localStorage.setItem('roda-sidebar-collapsed', (!prev).toString());
      return !prev;
    });
  };

  return (
    <WorkspaceContext.Provider value={{
      spaces, pages, profiles, currentSpaceId, currentPageId,
      sidebarOpen, sidebarCollapsed,
      selectSpace, selectPage,
      createSpace, createPage,
      renameSpace, renamePage,
      moveSpace, movePage,
      deleteSpace, deletePage,
      toggleLock, duplicatePage,
      setSidebarOpen, toggleSidebarCollapse,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};