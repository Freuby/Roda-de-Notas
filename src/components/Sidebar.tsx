import React, { useState, useRef } from 'react';
import { Space, Page, NotificationItem } from '../types';
import {
  Search,
  Plus,
  Lock,
  Music,
  LogOut,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  MessageSquare,
  Download,
  Upload,
} from 'lucide-react';
import { SPACE_ICONS } from './Icons';
import { supabase } from '../lib/supabase';
import { NotificationsPanel } from './NotificationsPanel';

interface SidebarProps {
  spaces: Space[];
  currentSpaceId: string | null;
  pages: Page[];
  currentPageId: string | null;
  spaceCoverage: Record<string, { '2': number; '3': number; '4': number }>;
  userName: string;
  notifications: NotificationItem[];
  profileMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onSelectSpace: (spaceId: string) => void;
  onRenameSpace: (space: Space) => void;
  onDeleteSpace: (space: Space) => void;
  onArchiveSpace: (space: Space) => void;
  onImportArchive: (file: File) => void;
  onSelectPage: (pageId: string) => void;
  onDuplicatePage: (page: Page) => void;
  onDeletePage: (page: Page) => void;
  onCreateSpace: () => void;
  onCreatePage: () => void;
  onOpenSearch: () => void;
  onMarkAllRead: () => void;
  onSelectNotification: (notif: NotificationItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  spaces,
  currentSpaceId,
  pages,
  currentPageId,
  spaceCoverage,
  userName,
  notifications,
  profileMap,
  isOpen,
  onClose,
  onSelectSpace,
  onRenameSpace,
  onDeleteSpace,
  onArchiveSpace,
  onImportArchive,
  onSelectPage,
  onDuplicatePage,
  onDeletePage,
  onCreateSpace,
  onCreatePage,
  onOpenSearch,
  onMarkAllRead,
  onSelectNotification,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeSpaceMenuId, setActiveSpaceMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSpace = spaces.find((s) => s.id === currentSpaceId);
  const unreadCount = notifications.filter((n) => !n.seen).length;

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
                  <div key={s.id} className="relative group">
                    <button
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
                      <div className="flex-1 min-w-0 pr-6">
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

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSpaceMenuId(activeSpaceMenuId === s.id ? null : s.id);
                      }}
                      className="absolute right-2 top-2.5 p-1 text-muted hover:text-ink opacity-0 group-hover:opacity-100 rounded"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeSpaceMenuId === s.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-2 top-9 bg-surface border border-border rounded-xl shadow-xl p-1 z-40 w-44 text-xs space-y-0.5"
                      >
                        <button
                          onClick={() => {
                            onRenameSpace(s);
                            setActiveSpaceMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-bg text-ink"
                        >
                          <Edit2 className="w-3 h-3 text-muted" />
                          <span>Renommer</span>
                        </button>
                        <button
                          onClick={() => {
                            onArchiveSpace(s);
                            setActiveSpaceMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-bg text-ink"
                        >
                          <Download className="w-3 h-3 text-muted" />
                          <span>Archiver en HTML</span>
                        </button>
                        <button
                          onClick={() => {
                            onDeleteSpace(s);
                            setActiveSpaceMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-bg text-terracotta font-semibold"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Import archive button */}
            <div className="pt-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".html"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportArchive(file);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted hover:text-ink hover:bg-bg rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importer une archive HTML</span>
              </button>
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
                <div key={p.id} className="group flex items-center justify-between rounded-xl">
                  <button
                    onClick={() => {
                      onSelectPage(p.id);
                      onClose();
                    }}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors text-left min-w-0 ${
                      p.id === currentPageId
                        ? 'bg-green-soft text-green font-bold'
                        : 'hover:bg-bg text-ink font-medium'
                    }`}
                  >
                    <span className="truncate flex-1">{p.title || 'Sans titre'}</span>
                    {p.locked && <Lock className="w-3 h-3 text-muted flex-shrink-0" />}
                  </button>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pr-1">
                    <button
                      onClick={() => onDuplicatePage(p)}
                      className="p-1 text-muted hover:text-ink rounded"
                      title="Dupliquer ce cours"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {!p.locked && (
                      <button
                        onClick={() => onDeletePage(p)}
                        className="p-1 text-muted hover:text-terracotta rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
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
        <div className="relative p-3 border-t border-border flex items-center justify-between text-xs text-muted">
          <span className="truncate max-w-[110px] font-medium">{userName}</span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className={`p-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                unreadCount > 0
                  ? 'border-terracotta text-terracotta bg-terracotta-soft font-bold'
                  : 'border-border text-muted hover:text-ink hover:bg-bg'
              }`}
              title="Commentaires récents"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {unreadCount > 0 && <span className="text-[10px]">{unreadCount}</span>}
            </button>

            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1 text-terracotta font-semibold hover:underline p-1.5"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {notifOpen && (
            <NotificationsPanel
              notifications={notifications}
              profileMap={profileMap}
              onSelectNotif={(n) => {
                onSelectNotification(n);
                setNotifOpen(false);
              }}
              onMarkAllRead={onMarkAllRead}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>
      </aside>
    </>
  );
};