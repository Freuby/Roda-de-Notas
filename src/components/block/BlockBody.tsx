import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Block } from '../../types';
import { SongBlock } from '../SongBlock';
import { VideoBlock } from '../VideoBlock';
import { BlockEditable } from './BlockEditable';

interface BlockBodyProps {
  block: Block;
  locked?: boolean;
  isToggleOpen: boolean;
  onSelectBlock: (id: string | null) => void;
  onUpdateContent: (block: Block, patch: any) => void;
  onOpenSongPicker: (blockId: string) => void;
  onToggleCollapse: (blockId: string) => void;
  onAddBlockAfter?: (block: Block) => void;
}

export const BlockBody: React.FC<BlockBodyProps> = ({
  block,
  locked,
  isToggleOpen,
  onSelectBlock,
  onUpdateContent,
  onOpenSongPicker,
  onToggleCollapse,
  onAddBlockAfter,
}) => {
  const editable = (placeholder: string, className?: string) => (
    <BlockEditable
      block={block}
      locked={locked}
      placeholder={placeholder}
      className={className}
      onUpdateContent={onUpdateContent}
      onSelectBlock={onSelectBlock}
      onAddBlockAfter={onAddBlockAfter}
    />
  );

  switch (block.type) {
    case 'heading':
      return (
        <div className="border-l-4 border-terracotta pl-3 py-1 font-display font-bold text-2xl text-ink bg-[var(--violet-extra-soft)] rounded-r-lg">
          {editable('Titre principal…')}
        </div>
      );
    case 'subheading':
      return (
        <div className="border-l-4 border-violet pl-3 py-0.5 font-display font-semibold text-lg text-[#5a4a2c]">
          {editable('Sous-titre…')}
        </div>
      );
    case 'paragraph':
      return <div className="text-sm leading-relaxed">{editable('Écrivez quelque chose…')}</div>;
    case 'bullet':
      return (
        <div className="flex items-start gap-2.5 py-1 text-sm leading-relaxed">
          <span className="text-green font-bold select-none">•</span>
          {editable('Élément de liste…')}
        </div>
      );
    case 'numbered':
      return (
        <div className="flex items-start gap-2.5 py-1 text-sm leading-relaxed">
          <span className="text-green font-bold text-xs pt-0.5 select-none">{block.order_index + 1}.</span>
          {editable('Élément de liste…')}
        </div>
      );
    case 'callout':
      return (
        <div className="bg-ochre-soft border border-ochre/40 rounded-xl p-3 text-center text-sm text-ink">
          {editable('Note importante…')}
        </div>
      );
    case 'divider':
      return <hr className="border-t-2 border-dashed border-[#6B46C1] my-3 w-full" />;
    case 'video':
      return (
        <VideoBlock block={block} locked={locked} onUpdate={(patch) => onUpdateContent(block, patch)} />
      );
    case 'song':
      return <SongBlock block={block} locked={locked} onOpenPicker={onOpenSongPicker} />;
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
            {editable('Titre dépliant…', 'text-green font-semibold')}
          </div>
        </div>
      );
    default:
      return null;
  }
};
