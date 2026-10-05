import React from 'react';
import { Block } from '../../types';
import { sanitizeHtml, escapeHtml } from '../../lib/richText';

const RICH_TYPES = ['paragraph', 'bullet', 'numbered', 'callout', 'toggle'];

export const isRichType = (type: string) => RICH_TYPES.includes(type);

interface BlockEditableProps {
  block: Block;
  locked?: boolean;
  placeholder: string;
  className?: string;
  onUpdateContent: (block: Block, patch: any) => void;
  onSelectBlock: (id: string | null) => void;
  onAddBlockAfter?: (block: Block) => void;
}

export const BlockEditable: React.FC<BlockEditableProps> = ({
  block,
  locked,
  placeholder,
  className = '',
  onUpdateContent,
  onSelectBlock,
  onAddBlockAfter,
}) => {
  const content = block.content || {};
  const rich = isRichType(block.type);

  const buildPatch = (el: HTMLElement) =>
    rich ? { text: el.innerText, html: sanitizeHtml(el.innerHTML) } : { text: el.innerText };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || !onAddBlockAfter) return;
    e.preventDefault();
    onUpdateContent(block, buildPatch(e.currentTarget));
    onAddBlockAfter(block);
  };

  const commonProps = {
    contentEditable: !locked,
    suppressContentEditableWarning: true,
    'data-block-editable': block.id,
    'data-placeholder': placeholder,
    onKeyDown: handleKeyDown,
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => onUpdateContent(block, buildPatch(e.currentTarget)),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectBlock(block.id);
    },
    className: `outline-none min-w-[60px] flex-1 text-ink cursor-text ${className} ${
      !content.text && !locked ? 'before:content-[attr(data-placeholder)] before:text-muted' : ''
    }`,
  };

  if (rich) {
    return (
      <div
        {...commonProps}
        dangerouslySetInnerHTML={{
          __html: content.html ? sanitizeHtml(content.html) : escapeHtml(content.text || ''),
        }}
      />
    );
  }

  return <div {...commonProps}>{content.text || ''}</div>;
};
