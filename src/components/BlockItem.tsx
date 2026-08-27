import React, { useState } from 'react';
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
}

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
}) => {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const content = block.content || {};
  const isToggleOpen = openToggles.has(block.id);
  const isActive = activeBlockId === block.id;

  const createdByName = profileMap[block.created_by] || 'Inconnu';
  const updatedByName = block.updated_by ? profileMap[block.updated_by] || 'Inconnu' : null;

  const renderContentEditable = (placeholder: string, className = '') => (
    <div
      contentEditable={!locked}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => onUpdateContent(block, { text: e.currentTarget.innerText })}
      className={`outline-none min-w-[60px] flex-1 text-ink ${className} ${
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
                onClick={() => onToggleCollapse(block.id)}
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
                  />
                ))}
                {!locked && (
                  <button
                    onClick={() => onAddChildBlock(block.id)}
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

  return (
    <div
      onClick={() => onSelectBlock(block.id)}
      className="group relative flex items-start gap-1 py-1 rounded-lg hover:bg-black/[0.015] transition-colors"
    >
      {!locked && (
        <div className="opacity-0 group-hover:opacity-100 p-1 text-muted cursor-grab flex-shrink-0 mt-0.5">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}

      <div className="flex-1 min-w-0">{renderBlockBody()}</div>

      {/* Toolbar actions */}
      <div
        className={`flex items-center gap-1 flex-shrink-0 self-start transition-opacity ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComment(block.id);
          }}
          className={`p-1.5 rounded text-xs flex items-center gap-1 ${
            commentsCount > 0
              ? 'text-terracotta bg-terracotta-soft font-semibold'
              : 'text-muted hover:text-ink hover:bg-bg'
          }`}
          title="Commentaires"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {commentsCount > 0 && <span>{commentsCount}</span>}
        </button>

        {/* Info tooltip */}
        <div className="relative group/info">
          <span className="p-1.5 text-muted hover:text-ink rounded cursor-default block">
            <Info className="w-3.5 h-3.5" />
          </span>
          <div className="hidden group-hover/info:block absolute right-0 bottom-full mb-1 w-52 p-2 bg-ink text-white text-[11px] rounded-lg shadow-xl z-30 pointer-events-none">
            <div>✏️ Créé par <strong>{createdByName}</strong></div>
            {block.created_at && <div>📅 {fmtDate(block.created_at)}</div>}
            {updatedByName && (
              <div className="mt-1 pt-1 border-t border-white/20">
                🔄 Modifié par <strong>{updatedByName}</strong>
                {block.updated_at && <div>📅 {fmtDate(block.updated_at)}</div>}
              </div>
            )}
          </div>
        </div>

        {!locked && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenEmojiPicker(block.id);
              }}
              className="p-1.5 text-muted hover:text-ink hover:bg-bg rounded"
              title="Insérer un émoji"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTypeMenu(!showTypeMenu);
                }}
                className="p-1.5 text-muted hover:text-ink hover:bg-bg rounded"
                title="Changer de type"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              {showTypeMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-xl shadow-xl p-1 z-40"
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
                      onClick={() => {
                        onChangeType(block, t.type as BlockType);
                        setShowTypeMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-bg ${
                        block.type === t.type ? 'bg-terracotta-soft text-terracotta font-semibold' : 'text-ink'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(block);
              }}
              className="p-1.5 text-muted hover:text-ink hover:bg-bg rounded"
              title="Dupliquer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveToPage(block);
              }}
              className="p-1.5 text-muted hover:text-ink hover:bg-bg rounded"
              title="Déplacer vers un autre cours"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(block);
              }}
              className="p-1.5 text-muted hover:text-terracotta hover:bg-bg rounded"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};