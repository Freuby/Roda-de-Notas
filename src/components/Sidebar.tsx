import React from 'react';
import { Space, Page } from '../types';
import { Search, Plus, Lock, Music, LogOut } from 'lucide-react';
import { SPACE_ICONS } from './Icons';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  spaces: Space[];
  currentSpaceId: string | null;
  pages: Page[];
  currentPageId: string | null;
  spaceCoverage: Record<string, { '2': number; '3': number; '4': number }>;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSpace: (spaceId: string) => void;
  onSelectPage: (pageId: string) => void;
  onCreateSpace: () => void;
  onCreatePage: () => void;
  onOpenSearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  spaces,
  currentSpaceId,
  pages,
  currentPageId,
  spaceCoverage,
  userName,
  isOpen,
  onClose,
  onSelectSpace,
  onSelectPage,
  onCreateSpace,
  onCreatePage,
  onOpenSearch,
}) => {
  const activeSpace = spaces.find((s) => s.id === currentSpaceId);

  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 bg-black/40 z-20 transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-surface border-r border-border flex flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
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
            onClick={onOpenSearch}
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
                onClick={onCreateSpace}
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
                      onSelectSpace(s.id);
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
                  onClick={onCreatePage}
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
                    onSelectPage(p.id);
                    onClose();
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
                    onSelectPage('__repertoire__');
                    onClose();
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
          <span className="truncate max-w-[140px] font-medium">{userName}</span>
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
    </>
  );
};