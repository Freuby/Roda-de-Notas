import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { Block, BlockType } from '../types';
import { BlockActionBar } from './block/BlockActionBar';
import { BlockBody } from './block/BlockBody';

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
  onAddBlockAfter?: (block: Block) => void;
  onReorderBlock?: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
}

export const BlockItem: React.FC<BlockItemProps> = (props) => {
  const {
    block,
    childBlocks = [],
    locked,
    activeBlockId,
    commentsCount,
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
    onAddBlockAfter,
    onReorderBlock,
  } = props;

  const [dropPos, setDropPos] = useState<'before' | 'after' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isToggleOpen = openToggles.has(block.id);
  const isActive = activeBlockId === block.id;
  const shouldShowActions = isHovered || isActive;
  const canReorder = !locked && !!onReorderBlock;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!canReorder) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id);
    e.currentTarget.classList.add('opacity-40');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-40');
    setDropPos(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canReorder) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDropPos(e.clientY < rect.top + rect.height / 2 ? 'before' : 'after');
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!canReorder) return;
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== block.id && dropPos) {
      onReorderBlock!(draggedId, block.id, dropPos);
    }
    setDropPos(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={() => setDropPos(null)}
      onDrop={handleDrop}
      className={`group relative flex flex-col items-start gap-0 py-1 rounded-lg hover:bg-black/[0.015] transition-all duration-200 block-animated ${
        isActive || isHovered ? 'is-active is-hovered' : ''
      } ${dropPos === 'before' ? 'border-t-2 border-terracotta' : ''} ${
        dropPos === 'after' ? 'border-b-2 border-terracotta' : ''
      }`}
    >
      {!locked && shouldShowActions && (
        <BlockActionBar
          block={block}
          commentsCount={commentsCount}
          profileMap={profileMap}
          canDrag={canReorder}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onChangeType={onChangeType}
          onDuplicate={onDuplicate}
          onMoveToPage={onMoveToPage}
          onDelete={onDelete}
          onToggleComment={onToggleComment}
          onOpenEmojiPicker={onOpenEmojiPicker}
        />
      )}

      <div
        onClick={() => onSelectBlock(block.id)}
        className={`flex-1 min-w-0 w-full py-px px-2 ${
          !locked && shouldShowActions ? 'pt-4 block-content-padded' : ''
        } transition-all duration-200 cursor-pointer`}
      >
        <BlockBody
          block={block}
          locked={locked}
          isToggleOpen={isToggleOpen}
          onSelectBlock={onSelectBlock}
          onUpdateContent={onUpdateContent}
          onOpenSongPicker={onOpenSongPicker}
          onToggleCollapse={onToggleCollapse}
          onAddBlockAfter={onAddBlockAfter}
        />
      </div>

      {isToggleOpen && (
        <div className="ml-4 pl-3 border-l-2 border-green-soft mt-2 space-y-2 w-full">
          {childBlocks.map((child) => (
            <BlockItem
              key={child.id}
              {...props}
              block={child}
              childBlocks={[]}
              commentsCount={0}
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
};
