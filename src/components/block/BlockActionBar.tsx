import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Smile,
  ArrowRightLeft,
  Copy,
  ArrowUpRight,
  Trash2,
  Info,
  GripVertical,
} from 'lucide-react';
import { Block, BlockType } from '../../types';
import { fmtDate } from '../../lib/utils';
import { Portal } from './Portal';
import { FormatToolbar } from './FormatToolbar';
import { isRichType } from './BlockEditable';

const TYPE_OPTIONS: { type: BlockType; label: string }[] = [
  { type: 'heading', label: 'Titre H1' },
  { type: 'subheading', label: 'Sous-titre H2' },
  { type: 'paragraph', label: 'Texte' },
  { type: 'bullet', label: 'Liste à puces' },
  { type: 'numbered', label: 'Liste numérotée' },
  { type: 'callout', label: 'Encadré' },
  { type: 'video', label: 'Vidéo' },
  { type: 'song', label: 'Chant' },
  { type: 'toggle', label: 'Dépliant' },
  { type: 'divider', label: 'Séparateur' },
];

interface BlockActionBarProps {
  block: Block;
  commentsCount: number;
  profileMap: Record<string, string>;
  canDrag: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onChangeType: (block: Block, type: BlockType) => void;
  onDuplicate: (block: Block) => void;
  onMoveToPage: (block: Block) => void;
  onDelete: (block: Block) => void;
  onToggleComment: (blockId: string) => void;
  onOpenEmojiPicker: (blockId: string) => void;
}

const iconBtn = 'p-1 text-muted hover:text-ink hover:bg-bg rounded';

export const BlockActionBar: React.FC<BlockActionBarProps> = ({
  block,
  commentsCount,
  profileMap,
  canDrag,
  onDragStart,
  onDragEnd,
  onChangeType,
  onDuplicate,
  onMoveToPage,
  onDelete,
  onToggleComment,
  onOpenEmojiPicker,
}) => {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [typeMenuPos, setTypeMenuPos] = useState({ x: 0, y: 0 });
  const [infoMenuPos, setInfoMenuPos] = useState({ x: 0, y: 0 });

  const createdByName = profileMap[block.created_by] || 'Inconnu';
  const updatedByName = block.updated_by ? profileMap[block.updated_by] || 'Inconnu' : null;

  const typeMenuRef = useRef<HTMLDivElement>(null);
  const infoMenuRef = useRef<HTMLDivElement>(null);
  const typeAnchor = useRef<DOMRect | null>(null);
  const infoAnchor = useRef<DOMRect | null>(null);

  // Place menu below the anchor (or above if no room), clamped inside the viewport
  const placeMenu = (anchor: DOMRect, menu: HTMLElement) => {
    const margin = 8;
    const { width, height } = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let y = anchor.bottom + 4;
    if (y + height > vh - margin) {
      const above = anchor.top - height - 4;
      y = above >= margin ? above : Math.max(margin, vh - height - margin);
    }
    // For mobile, prefer placing menu to the left of the anchor if there's room
    // For desktop, prefer placing menu to the right
    const isMobile = vw < 768;
    let x = anchor.left;
    if (isMobile && anchor.left + width > vw - margin) {
      // On mobile, if menu would overflow right, place it to the left
      x = Math.max(margin, anchor.left - width);
    } else {
      // On desktop or if there's room, place it to the right
      x = Math.min(Math.max(margin, anchor.left), Math.max(margin, vw - width - margin));
    }
    return { x, y };
  };

  useLayoutEffect(() => {
    if (showTypeMenu && typeAnchor.current && typeMenuRef.current) {
      setTypeMenuPos(placeMenu(typeAnchor.current, typeMenuRef.current));
    }
  }, [showTypeMenu]);

  useLayoutEffect(() => {
    if (showInfo && infoAnchor.current && infoMenuRef.current) {
      setInfoMenuPos(placeMenu(infoAnchor.current, infoMenuRef.current));
    }
  }, [showInfo]);

  const handleTypeMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    typeAnchor.current = e.currentTarget.getBoundingClientRect();
    setShowTypeMenu(!showTypeMenu);
    setShowInfo(false);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    infoAnchor.current = e.currentTarget.getBoundingClientRect();
    setShowInfo(!showInfo);
    setShowTypeMenu(false);
  };

  useEffect(() => {
    if (!showTypeMenu && !showInfo) return;
    const close = (e: Event) => {
      if (e.target instanceof HTMLElement && e.target.closest('[data-block-menu]')) return;
      setShowTypeMenu(false);
      setShowInfo(false);
    };
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [showTypeMenu, showInfo]);

  useEffect(() => {
    if (!showTypeMenu && !showInfo) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-block-menu]')) {
        setShowTypeMenu(false);
        setShowInfo(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showTypeMenu, showInfo]);

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <>
      <div className="w-full flex items-center justify-between px-3 py-1.5 bg-bg/50 backdrop-blur-sm rounded-t-lg transition-all duration-200 block-action-bar">
        <div className="flex items-center gap-2">
          {canDrag && (
            <div
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              className="p-1 text-muted cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}

          {isRichType(block.type) && <FormatToolbar />}

          <button
            onClick={stop(() => onToggleComment(block.id))}
            className={`p-1 rounded text-xs flex items-center gap-1 ${
              commentsCount > 0
                ? 'text-terracotta bg-terracotta-soft font-semibold'
                : 'text-muted hover:text-ink hover:bg-bg'
            }`}
            title="Commentaires"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {commentsCount > 0 && <span>{commentsCount}</span>}
          </button>

          <button
            onClick={handleInfoClick}
            data-block-menu
            className="p-1 text-muted hover:text-ink rounded cursor-pointer"
            title="Informations"
          >
            <Info className="w-3 h-3" />
          </button>

          <button
            onClick={stop(() => onOpenEmojiPicker(block.id))}
            className={iconBtn}
            title="Insérer un émoji"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          <button onClick={handleTypeMenuClick} data-block-menu className={iconBtn} title="Changer de type">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          <button onClick={stop(() => onDuplicate(block))} className={iconBtn} title="Dupliquer">
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={stop(() => onMoveToPage(block))}
            className={iconBtn}
            title="Déplacer vers un autre cours"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={stop(() => onDelete(block))}
            className="p-1 text-muted hover:text-terracotta hover:bg-bg rounded"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showTypeMenu && (
        <Portal>
          <div
            ref={typeMenuRef}
            data-block-menu
            className="bg-surface border border-border rounded-xl shadow-xl p-2 w-48 max-h-[calc(100vh-16px)] overflow-y-auto"
            style={{ left: typeMenuPos.x, top: typeMenuPos.y, position: 'fixed' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 py-1">
              Changer le type
            </div>
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.type}
                onClick={stop(() => {
                  onChangeType(block, t.type);
                  setShowTypeMenu(false);
                })}
                className={`w-full text-left px-2 py-1.5 text-xs rounded-lg hover:bg-bg ${
                  block.type === t.type ? 'bg-terracotta-soft text-terracotta font-semibold' : 'text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Portal>
      )}

      {showInfo && (
        <Portal>
          <div
            ref={infoMenuRef}
            data-block-menu
            className="bg-ink text-white text-[11px] rounded-lg shadow-xl p-2 w-52"
            style={{ left: infoMenuPos.x, top: infoMenuPos.y, position: 'fixed' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>✏️ Créé par <strong>{createdByName}</strong></div>
            {block.created_at && <div>📅 {fmtDate(block.created_at)}</div>}
            {updatedByName && (
              <div className="mt-1 pt-1 border-t border-white/20">
                🔄 Modifié par <strong>{updatedByName}</strong>
                {block.updated_at && <div>📅 {fmtDate(block.updated_at)}</div>}
              </div>
            )}
          </div>
        </Portal>
      )}
    </>
  );
};
