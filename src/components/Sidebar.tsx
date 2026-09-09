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
  GripVertical,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
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
  onReorderPages: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
  onMoveSpace: (space: Space, direction: -1 | 1) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
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
  onReorderPages,
  onMoveSpace,
  theme,
  onToggleTheme,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeSpaceMenuId, setActiveSpaceMenuId] = useState<string | null>(null);
  const [repertoireOpen, setRepertoireOpen] = useState(false);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dropInfo, setDropInfo] = useState<{ targetId: string; position: 'before' | 'after' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
    const [draggedSpaceId, setDraggedSpaceId] = useState<string | null>(null);
    const [dropInfoSpace, setDropInfoSpace] = useState<{ targetId: string; position: 'before' | 'after' } | null>(null);
    const spaceDragCounterRef = useRef(0);
  
    const activeSpace = spaces.find((s) => s.id === currentSpaceId);
  const unreadCount = notifications.filter((n) => !n.seen).length;

  // --- Page Drag & Drop Handlers ---

  const handlePageDragStart = (e: React.DragEvent, pageId: string) => {
    if (!e.dataTransfer) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pageId);
    setDraggedPageId(pageId);
    const row = (e.currentTarget as HTMLElement).closest('[data-page-row]') as HTMLElement;
    if (row) row.classList.add('page-dragging');
  };

  const handlePageDragEnd = (e: React.DragEvent) => {
    document.querySelectorAll('.page-dragging').forEach((el) => el.classList.remove('page-dragging'));
    document.querySelectorAll('.page-drop-before, .page-drop-after').forEach((el) => {
      el.classList.remove('page-drop-before', 'page-drop-after');
    });
    setDraggedPageId(null);
    setDropInfo(null);
  };

  const handlePageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    e.dataTransfer.dropEffect = 'move';

    const row = (e.target as HTMLElement).closest('[data-page-row]') as HTMLElement | null;
    if (!row) return;

    const rowPageId = row.dataset.pageRow || row.querySelector('[data-page-row]')?.getAttribute('data-page-row');
    if (!rowPageId || rowPageId === draggedPageId) {
      document.querySelectorAll('.page-drop-before, .page-drop-after').forEach((el) => {
        el.classList.remove('page-drop-before', 'page-drop-after');
      });
      setDropInfo(null);
      return;
    }

    const rect = row.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';

    document.querySelectorAll('.page-drop-before, .page-drop-after').forEach((el) => {
      el.classList.remove('page-drop-before', 'page-drop-after');
    });

    row.classList.add(position === 'before' ? 'page-drop-before' : 'page-drop-after');
    setDropInfo({ targetId: rowPageId, position });
  };

  const handlePageDragLeave = (e: React.DragEvent) => {
    const row = (e.target as HTMLElement).closest('[data-page-row]') as HTMLElement | null;
    if (!row) return;
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !row.contains(related)) {
      row.classList.remove('page-drop-before', 'page-drop-after');
      setDropInfo((prev) => (prev?.targetId === row.dataset.pageRow ? null : prev));
    }
  };

  const handlePageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer) return;

    const draggedId = e.dataTransfer.getData('text/plain');

    let targetId = '';
    let position: 'before' | 'after' = 'after';

    const row = (e.target as HTMLElement).closest('[data-page-row]') as HTMLElement | null;
    if (row) {
      targetId = row.dataset.pageRow || '';
      const rect = row.getBoundingClientRect();
      position = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    } else if (dropInfo) {
      targetId = dropInfo.targetId;
      position = dropInfo.position;
    }

    document.querySelectorAll('.page-dragging').forEach((el) => el.classList.remove('page-dragging'));
    document.querySelectorAll('.page-drop-before, .page-drop-after').forEach((el) => {
      el.classList.remove('page-drop-before', 'page-drop-after');
    });
    setDraggedPageId(null);
    setDropInfo(null);

    if (!draggedId || !targetId || draggedId === targetId) return;

    onReorderPages(draggedId, targetId, position);
  };

  const handlePageDragEnter = (e: React.DragEvent) => {
    dragCounterRef.current++;
  };

  const handlePageDragExit = (e: React.DragEvent) => {
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      document.querySelectorAll('.page-drop-before, .page-drop-after').forEach((el) => {
        el.classList.remove('page-drop-before', 'page-drop-after');
      });
      setDropInfo(null);
    }
  };

  // --- Space Drag & Drop Handlers ---

  const handleSpaceDragStart = (e: React.DragEvent, spaceId: string) => {
    if (!e.dataTransfer) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', spaceId);
    setDraggedSpaceId(spaceId);
    const row = (e.currentTarget as HTMLElement).closest('[data-space-row]') as HTMLElement;
    if (row) row.classList.add('space-dragging');
  };

  const handleSpaceDragEnd = (e: React.DragEvent) => {
    document.querySelectorAll('.space-dragging').forEach((el) => el.classList.remove('space-dragging'));
    document.querySelectorAll('.space-drop-before, .space-drop-after').forEach((el) => {
      el.classList.remove('space-drop-before', 'space-drop-after');
    });
    setDraggedSpaceId(null);
    setDropInfoSpace(null);
  };

  const handleSpaceDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    e.dataTransfer.dropEffect = 'move';

    const row = (e.target as HTMLElement).closest('[data-space-row]') as HTMLElement | null;
    if (!row) return;

    const rowSpaceId = row.dataset.spaceRow || row.querySelector('[data-space-row]')?.getAttribute('data-space-row');
    if (!rowSpaceId || rowSpaceId === draggedSpaceId) {
      document.querySelectorAll('.space-drop-before, .space-drop-after').forEach((el) => {
        el.classList.remove('space-drop-before', 'space-drop-after');
      });
      setDropInfoSpace(null);
      return;
    }

    const rect = row.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';

    document.querySelectorAll('.space-drop-before, .space-drop-after').forEach((el) => {
      el.classList.remove('space-drop-before', 'space-drop-after');
    });

    row.classList.add(position === 'before' ? 'space-drop-before' : 'space-drop-after');
    setDropInfoSpace({ targetId: rowSpaceId, position });
  };

  const handleSpaceDragLeave = (e: React.DragEvent) => {
    const row = (e.target as HTMLElement).closest('[data-space-row]') as HTMLElement | null;
    if (!row) return;
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !row.contains(related)) {
      row.classList.remove('space-drop-before', 'space-drop-after');
      setDropInfoSpace((prev) => (prev?.targetId === row.dataset.spaceRow ? null : prev));
    }
  };

  const handleSpaceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer) return;

    const draggedId = e.dataTransfer.getData('text/plain');

    let targetId = '';
    let position: 'before' | 'after' = 'after';

    const row = (e.target as HTMLElement).closest('[data-space-row]') as HTMLElement | null;
    if (row) {
      targetId = row.dataset.spaceRow || '';
      const rect = row.getBoundingClientRect();
      position = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    } else if (dropInfoSpace) {
      targetId = dropInfoSpace.targetId;
      position = dropInfoSpace.position;
    }

    document.querySelectorAll('.space-dragging').forEach((el) => el.classList.remove('space-dragging'));
    document.querySelectorAll('.space-drop-before, .space-drop-after').forEach((el) => {
      el.classList.remove('space-drop-before', 'space-drop-after');
    });
    setDraggedSpaceId(null);
    setDropInfoSpace(null);

    if (!draggedId || !targetId || draggedId === targetId) return;

    const draggedSpace = spaces.find((s) => s.id === draggedId);
    const targetSpace = spaces.find((s) => s.id === targetId);
    if (!draggedSpace || !targetSpace) return;

    onMoveSpace(draggedSpace, position === 'before' ? -1 : 1);
  };

  const handleSpaceDragEnter = (e: React.DragEvent) => {
    spaceDragCounterRef.current++;
  };

  const handleSpaceDragExit = (e: React.DragEvent) => {
    spaceDragCounterRef.current = Math.max(0, spaceDragCounterRef.current - 1);
    if (spaceDragCounterRef.current === 0) {
      document.querySelectorAll('.space-drop-before, .space-drop-after').forEach((el) => {
        el.classList.remove('space-drop-before', 'space-drop-after');
      });
      setDropInfoSpace(null);
    }
  };

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
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-terracotta flex items-center justify-center text-sm animate-spin-slow">
              🪘
            </div>
            <span className="font-display font-bold text-lg text-ink">Roda de Notas</span>
          </div>
          <div className="flex items-center gap-2">
            <button
                          onClick={onToggleTheme}
                          className="p-1.5 rounded-lg text-muted hover:text-ink transition-colors"
                          title="Toggle day/night mode"
                        >
                          {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                        </button>
          </div>
        </div>

        {/* Global search trigger */}
        <div className="p-3 border-b border-border flex-shrink-0">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-2.5 px-3 py-2 bg-bg hover:border-terracotta border border-border rounded-xl text-xs text-muted transition-colors"
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 text-left">Rechercher…</span>
            <kbd className="text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border text-muted">⌘K</kbd>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Spaces */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Espaces</span>
              <button
                onClick={onCreateSpace}
                className="text-green hover:text-green-light p-1 rounded hover:bg-green-soft"
                title="Ajouter un espace"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div
              onDragEnter={handleSpaceDragEnter}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer && (e.dataTransfer.dropEffect = 'move');
              }}
              onDragExit={handleSpaceDragExit}
              onDrop={handleSpaceDrop}
              className="space-y-1 min-h-[4px] rounded-lg transition-colors"
            >
              {spaces.map((s, idx) => {
                const IconComp = SPACE_ICONS[idx % SPACE_ICONS.length];
                const cov = spaceCoverage[s.id];
                const isActive = s.id === currentSpaceId;
                const spaceIndex = spaces.findIndex((sp) => sp.id === s.id);
                const canMoveUp = spaceIndex > 0;
                const canMoveDown = spaceIndex < spaces.length - 1;

                return (
                  <div
                    key={s.id}
                    data-space-row={s.id}
                    draggable
                    onDragStart={(e) => handleSpaceDragStart(e, s.id)}
                    onDragEnd={handleSpaceDragEnd}
                    onDragOver={handleSpaceDragOver}
                    onDragLeave={handleSpaceDragLeave}
                    className={`relative group ${
                      draggedSpaceId === s.id ? 'space-dragging opacity-40 scale-[0.98]' : ''
                    }`}
                  >
                    {/* Outer container is a div, not a button — avoids button-inside-button */}
                    <div
                      onClick={() => {
                        onSelectSpace(s.id);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors text-left cursor-pointer ${
                        isActive
                          ? 'bg-capoeiraBlue-soft text-capoeiraBlue font-semibold border border-capoeiraBlue'
                          : 'hover:bg-bg text-ink'
                      }`}
                    >
                      {/* Move arrows on the LEFT */}
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveSpace(s, -1);
                          }}
                          disabled={!canMoveUp}
                          className="p-0.5 text-muted hover:text-ink hover:bg-bg rounded transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Monter"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveSpace(s, 1);
                          }}
                          disabled={!canMoveDown}
                          className="p-0.5 text-muted hover:text-ink hover:bg-bg rounded transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Descendre"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span
                                              className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs flex-shrink-0 ${
                                                isActive
                                                  ? 'bg-capoeiraBlue border-capoeiraBlue text-white'
                                                  : 'bg-white border-border text-capoeiraBlue'
                                              }`}
                                            >
                        <IconComp className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate leading-tight">{s.name}</div>
                        {cov && (
                                                  <div className="flex gap-1 mt-1.5">
                                                    <span className="text-[9px] px-1 py-0.5 rounded bg-capoeiraBlue-soft text-capoeiraBlue font-bold leading-none">
                                                      2e {cov['2']}%
                                                    </span>
                                                    <span className="text-[9px] px-1 py-0.5 rounded bg-capoeiraGold-soft text-capoeiraGold font-bold leading-none">
                                                      3e {cov['3']}%
                                                    </span>
                                                    <span className="text-[9px] px-1 py-0.5 rounded bg-capoeiraGreen-soft text-capoeiraGreen font-bold leading-none">
                                                      4e {cov['4']}%
                                                    </span>
                                                  </div>
                                                )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSpaceMenuId(activeSpaceMenuId === s.id ? null : s.id);
                      }}
                      className="absolute right-2 top-2 p-1 text-muted hover:text-ink opacity-0 group-hover:opacity-100 rounded transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeSpaceMenuId === s.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-2 top-9 bg-surface border border-border rounded-xl shadow-xl p-1 z-40 w-48 text-xs space-y-0.5"
                      >
                        <button
                          onClick={() => {
                            onRenameSpace(s);
                            setActiveSpaceMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-bg text-ink"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-muted" />
                          <span>Renommer</span>
                        </button>
                        <button
                          onClick={() => {
                            onArchiveSpace(s);
                            setActiveSpaceMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-bg text-ink"
                        >
                          <Download className="w-3.5 h-3.5 text-muted" />
                          <span>Archiver en HTML</span>
                        </button>
                        <button
                          onClick={() => {
                            onDeleteSpace(s);
                            setActiveSpaceMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-bg text-terracotta font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Import archive */}
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
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-muted hover:text-ink hover:bg-bg rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importer une archive HTML</span>
              </button>
            </div>
          </div>

          {/* Pages — with drag & drop */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {activeSpace ? activeSpace.name : 'Cours'}
              </span>
              <div className="flex items-center gap-1">
                {currentSpaceId && (
                  <button
                    onClick={onCreatePage}
                    className="p-1 text-green hover:text-green-light rounded hover:bg-green-soft"
                    title="Nouveau cours"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Drop zone wrapper for the entire pages list */}
            <div
              onDragEnter={handlePageDragEnter}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer && (e.dataTransfer.dropEffect = 'move');
              }}
              onDragExit={handlePageDragExit}
              onDrop={handlePageDrop}
              className="space-y-1 min-h-[4px] rounded-lg transition-colors"
            >
              {pages.map((p) => {
                const isActive = p.id === currentPageId;
                const isDragging = draggedPageId === p.id;

                return (
                  <div
                    key={p.id}
                    data-page-row={p.id}
                    draggable
                    onDragStart={(e) => handlePageDragStart(e, p.id)}
                    onDragEnd={handlePageDragEnd}
                    onDragOver={handlePageDragOver}
                    onDragLeave={handlePageDragLeave}
                    className={`group flex items-center rounded-xl cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
                      isDragging ? 'page-dragging opacity-40 scale-[0.98]' : ''
                    } ${isActive ? 'bg-green-soft' : 'hover:bg-bg'}`}
                  >
                    {/* Grip handle */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="pl-2 pr-1 py-2 flex-shrink-0 cursor-grab active:cursor-grabbing text-muted opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                      title="Glisser pour réorganiser"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Page title button */}
                    <button
                      onClick={() => {
                        onSelectPage(p.id);
                        onClose();
                      }}
                      className={`flex-1 flex items-center gap-2 px-2 py-2 rounded-xl text-xs text-left min-w-0 transition-colors ${
                        isActive ? 'text-green font-bold' : 'text-ink font-medium'
                      }`}
                    >
                      <span className="truncate flex-1">{p.title || 'Sans titre'}</span>
                      {p.locked && <Lock className="w-3 h-3 text-muted flex-shrink-0" />}
                    </button>

                    {/* Actions — visible on hover */}
                    <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicatePage(p);
                        }}
                        className="p-1 text-muted hover:text-ink rounded"
                        title="Dupliquer ce cours"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {!p.locked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePage(p);
                          }}
                          className="p-1 text-muted hover:text-terracotta rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Repertoire link */}
            {currentSpaceId && (
              <button
                onClick={() => setRepertoireOpen(!repertoireOpen)}
                className={`w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs transition-colors ${
                  repertoireOpen
                    ? 'bg-green-soft text-green font-bold border border-green'
                    : 'text-green-light border border-dashed border-border hover:bg-green-soft hover:border-green'
                }`}
              >
                <span className="text-base">🎵</span>
                <span className="flex-1 text-left">Répertoire des chants</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${repertoireOpen ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative p-3 border-t border-border flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="truncate max-w-[100px] font-medium">{userName}</span>

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