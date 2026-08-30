import React, { useState, useRef, useEffect } from 'react';
import { Block, BlockType } from '../types';
import { SongBlock } from './SongBlock';
import { VideoBlock } from './VideoBlock';
import {
  MessageSquare,
  Smile,
  ArrowRightLeft,
  Copy,
  ArrowUpRight,
  Trash2,
  ChevronRight,
  Info,
  GripVertical,
  Plus,
} from 'lucide-react';
import { fmtDate } from '../lib/utils';

interface BlockItemProps {
  block: Block;
  childBlocks?: Block[];
  locked?: boolean;
  activeBlockId: string | null;
  commentsCount: number;
  openCommentBlockId: string | null;
  openToggles: Set<string>;
  profileMap: Record<string, string>;
  onSelectBlock: (id: string | null) => void;
  onUpdateContent: (block: Block, patch: any) => void;
  onChangeType: (block: Block, type: BlockType) => void;
  onDuplicate: (block: Block) => void;
  onMoveToPage: (block: Block) => void;
  onDelete: (block: Block) => void;
  onToggleComment: (blockId: string) => void;
  onOpenEmojiPicker: (blockId: string) => void;
  onOpenSongPicker: (blockId: string) => void;
  onToggleCollapse: (blockId: string) => void;
  onAddChildBlock: (parentBlockId: string) => void;
  onReorderBlock?: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
}

// Portal component for rendering menus outside the block hierarchy
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    elRef.current = document.createElement('div');
    document.body.appendChild(elRef.current);
    setMounted(true);
    return () => {
      if (elRef.current) {
        document.body.removeChild(elRef.current);
      }
    };
  }, []);

  if (!mounted || !elRef.current) return null;
  return <>{children}</>;
};

export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  childBlocks = [],
  locked,
  activeBlockId,
  commentsCount,
  openCommentBlockId,
  openToggles,
  profileMap,
  onSelectBlock,
  onUpdateContent,
  onChangeType,
  onDuplicate,
  onMoveToPage,
  onDelete,
  onToggleComment,
  onOpenEmojiPicker,
  onOpenSongPicker,
  onToggleCollapse,
  onAddChildBlock,
  onReorderBlock,
}) => {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [dropPos, setDropPos] = useState<'before' | 'after' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [typeMenuPos, setTypeMenuPos] = useState({ x: 0, y: 0 });
  const [infoMenuPos, setInfoMenuPos] = useState({ x: 0, y: 0 });
  const typeButtonRef = useRef<HTMLButtonElement>(null);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const content = block.content || {};
  const isToggleOpen = openToggles.has(block.id);
  const isActive = activeBlockId === block.id;
  const shouldShowActions = isHovered || isActive;

  const createdByName = profileMap[block.created_by] || 'Inconnu';
  const updatedByName = block.updated_by ? profileMap[block.updated_by] || 'Inconnu' : null;

  // Update menu positions when buttons are clicked
  const handleTypeMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setTypeMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setShowTypeMenu(!showTypeMenu);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setInfoMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setShowInfo(!showInfo);
  };

  const renderContentEditable = (placeholder: string, className = '') => (
    <div
      contentEditable={!locked}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => onUpdateContent(block, { text: e.currentTarget.innerText })}
      onClick={(e) => {
        e.stopPropagation();
        onSelectBlock(block.id);
      }}
      className={`outline-none min-w-[60px] flex-1 text-ink cursor-text ${className} ${
        !content.text && !locked ? 'before:content-[attr(data-placeholder)] before:text-muted' : ''
      }`}
    >
      {content.text || ''}
    </div>
  );

  const renderBlockBody = () => {
    switch (block.type) {
      case 'heading':
        return (
          <div className="border-l-4 border-terracotta pl-3 py-1 font-display font-bold text-2xl text-ink">
            {renderContentEditable('Titre principal…')}
          </div>
        );
      case 'subheading':
        return (
          <div className="border-l-4 border-ochre pl-3 py-0.5 font-display font-semibold text-lg text-[#5a4a2c]">
            {renderContentEditable('Sous-titre…')}
          </div>
        );
      case 'paragraph':
        return (
          <div className="py-1 text-sm leading-relaxed">
            {renderContentEditable('Écrivez quelque chose…')}
          </div>
        );
      case 'bullet':
        return (
          <div className="flex items-start gap-2.5 py-1 text-sm leading-relaxed">
            <span className="text-green font-bold select-none">•</span>
            {renderContentEditable('Élément de liste…')}
          </div>
        );
      case 'numbered':
        return (
          <div className="flex items-start gap-2.5 py-1 text-sm leading-relaxed">
            <span className="text-green font-bold text-xs pt-0.5 select-none">{block.order_index + 1}.</span>
            {renderContentEditable('Élément de liste…')}
          </div>
        );
      case 'callout':
        return (
          <div className="bg-ochre-soft border border-ochre/40 rounded-xl p-3 flex items-start gap-2.5 text-sm text-ink">
            <span className="text-base select-none">{content.emoji || '💡'}</span>
            {renderContentEditable('Note importante…')}
          </div>
        );
      case 'divider':
        return <hr className="border-none border-t border-dashed border-border my-3 w-full" />;
      case 'video':
        return (
          <VideoBlock
            block={block}
            locked={locked}
            onUpdate={(patch) => onUpdateContent(block, patch)}
          />
        );
      case 'song':
        return (
          <SongBlock
            block={block}
            locked={locked}
            onOpenPicker={onOpenSongPicker}
          />
        );
      case 'toggle':
        return (
          <div className="w-full">
            <div className="flex items-center gap-2 font-display font-semibold text-base text-green">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse(block.id);
                }}
                className={`p-1 text-green hover:bg-green-soft rounded transition-transform ${
                  isToggleOpen ? 'rotate-90' : ''
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {renderContentEditable('Titre dépliant…', 'text-green font-semibold')}
            </div>

            {isToggleOpen && (
              <div className="ml-6 pl-3 border-l-2 border-green-soft mt-2 space-y-2">
                {childBlocks.map((child) => (
                  <BlockItem
                    key={child.id}
                    block={child}
                    locked={locked}
                    activeBlockId={activeBlockId}
                    commentsCount={0}
                    openCommentBlockId={openCommentBlockId}
                    openToggles={openToggles}
                    profileMap={profileMap}
                    onSelectBlock={onSelectBlock}
                    onUpdateContent={onUpdateContent}
                    onChangeType={onChangeType}
                    onDuplicate={onDuplicate}
                    onMoveToPage={onMoveToPage}
                    onDelete={onDelete}
                    onToggleComment={onToggleComment}
                    onOpenEmojiPicker={onOpenEmojiPicker}
                    onOpenSongPicker={onOpenSongPicker}
                    onToggleCollapse={onToggleCollapse}
                    onAddChildBlock={onAddChildBlock}
                    onReorderBlock={onReorderBlock}
                  />
                ))}
                {!locked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChildBlock(block.id);
                    }}
                    className="text-xs text-muted hover:text-ink hover:bg-bg px-2 py-1 rounded-md flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un élément ici</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (locked || !onReorderBlock) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id);
    e.currentTarget.classList.add('opacity-40');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-40');
    setDropPos(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (locked || !onReorderBlock) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const midY = rect.top + rect.height / 2;
    setDropPos(e.clientY < midY ? 'before' : 'after');
  };

  const handleDragLeave = () => {
    setDropPos(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (locked || !onReorderBlock) return;
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== block.id && dropPos) {
      onReorderBlock(draggedId, block.id, dropPos);
    }
    setDropPos(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowInfo(false);
        setShowTypeMenu(false);
      }}
      className={`group relative flex flex-col items-start gap-0 py-1 rounded-lg hover:bg-black/[0.015] transition-all duration-200 block-animated ${
        isActive || isHovered ? 'is-active is-hovered' : ''
      } ${
        dropPos === 'before' ? 'border-t-2 border-terracotta' : ''
      } ${dropPos === 'after' ? 'border-b-2 border-terracotta' : ''}`}
    >
      {/* Action Bar - appears on hover/selection */}
      {!locked && shouldShowActions && (
        <div className="w-full flex items-center justify-between px-3 py-1.5 bg-bg/50 backdrop-blur-sm rounded-t-lg transition-all duration-200 block-action-bar">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComment(block.id);
              }}
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

            {/* Info tooltip - clickable, uses portal for proper positioning */}
            <button
              ref={infoButtonRef}
              onClick={handleInfoClick}
              className="p-1 text-muted hover:text-ink rounded cursor-pointer block"
              title="Informations"
            >
              <Info className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenEmojiPicker(block.id);
              }}
              className="p-1 text-muted hover:text-ink hover:bg-bg rounded"
              title="Insérer un émoji"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            <button
              ref={typeButtonRef}
              onClick={handleTypeMenuClick}
              className="p-1 text-muted hover:text-ink hover:bg-bg rounded"
              title="Changer de type"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(block);
              }}
              className="p-1 text-muted hover:text-ink hover:bg-bg rounded"
              title="Dupliquer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveToPage(block);
              }}
              className="p-1 text-muted hover:text-ink hover:bg-bg rounded"
              title="Déplacer vers un autre cours"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(block);
              }}
              className="p-1 text-muted hover:text-terracotta hover:bg-bg rounded"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - clicking here selects the block */}
      <div
        onClick={() => onSelectBlock(block.id)}
        className={`flex-1 min-w-0 w-full py-2 px-3 ${
          !locked && shouldShowActions ? 'pt-4 block-content-padded' : ''
        } transition-all duration-200 cursor-pointer`}
      >
        {renderBlockBody()}
      </div>

      {/* Drag handle on left - ONLY this initiates drag */}
      {!locked && onReorderBlock && (
        <div
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 text-muted cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Toggle children */}
      {isToggleOpen && (
        <div className="ml-4 pl-3 border-l-2 border-green-soft mt-2 space-y-2 w-full">
          {childBlocks.map((child) => (
            <BlockItem
              key={child.id}
              block={child}
              locked={locked}
              activeBlockId={activeBlockId}
              commentsCount={0}
              openCommentBlockId={openCommentBlockId}
              openToggles={openToggles}
              profileMap={profileMap}
              onSelectBlock={onSelectBlock}
              onUpdateContent={onUpdateContent}
              onChangeType={onChangeType}
              onDuplicate={onDuplicate}
              onMoveToPage={onMoveToPage}
              onDelete={onDelete}
              onToggleComment={onToggleComment}
              onOpenEmojiPicker={onOpenEmojiPicker}
              onOpenSongPicker={onOpenSongPicker}
              onToggleCollapse={onToggleCollapse}
              onAddChildBlock={onAddChildBlock}
              onReorderBlock={onReorderBlock}
            />
          ))}
          {!locked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChildBlock(block.id);
              }}
              className="text-xs text-muted hover:text-ink hover:bg-bg px-2 py-1 rounded-md flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un élément ici</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  // Render menus in a portal to avoid overflow/positioning issues
  return (
    <>
      {showTypeMenu && (
        <Portal>
          <div
            className="fixed z-[9999] bg-surface border border-border rounded-xl shadow-xl p-2"
            style={{ left: typeMenuPos.x, top: typeMenuPos.y }}
            onClick={(e) => {
              e.stopPropagation();
              setShowTypeMenu(false);
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 py-1">
              Changer le type
            </div>
            {[
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
            ].map((t) => (
              <button
                key={t.type}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeType(block, t.type as BlockType);
                  setShowTypeMenu(false);
                }}
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
            className="fixed z-[9999] bg-ink text-white text-[11px] rounded-lg shadow-xl p-2"
            style={{ left: infoMenuPos.x, top: infoMenuPos.y }}
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(false);
            }}
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