import React, { useState } from 'react';
import { Page, Block, Prerequisite, BlockType } from '../types';
import { fmtDate } from '../lib/utils';
import { PrerequisitesBar } from './PrerequisitesBar';
import { BlockItem } from './BlockItem';
import { Lock, Unlock, Plus, Send } from 'lucide-react';

interface PageEditorProps {
  page: Page;
  spaceName: string;
  pages: Page[];
  blocks: Block[];
  prerequisites: Prerequisite[];
  selectedPrereqIds: Set<string>;
  spacePrereqCounts: Record<string, number>;
  profileMap: Record<string, string>;
  commentsMap: Record<string, any[]>;
  openCommentBlockId: string | null;
  openToggles: Set<string>;
  activeBlockId: string | null;
  onUpdateTitle: (title: string) => void;
  onToggleLock: () => void;
  onTogglePrerequisite: (prereqId: string) => void;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlockContent: (block: Block, patch: any) => void;
  onChangeBlockType: (block: Block, type: BlockType) => void;
  onDuplicateBlock: (block: Block) => void;
  onMoveBlockToPage: (block: Block) => void;
  onDeleteBlock: (block: Block) => void;
  onAddBlock: (type: BlockType, parentId?: string | null) => void;
  onToggleComment: (blockId: string) => void;
  onAddComment: (blockId: string, text: string) => void;
  onOpenEmojiPicker: (blockId: string) => void;
  onOpenSongPicker: (blockId: string) => void;
  onToggleCollapse: (blockId: string) => void;
  onReorderBlock: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
}

export const PageEditor: React.FC<PageEditorProps> = ({
  page,
  spaceName,
  pages,
  blocks,
  prerequisites,
  selectedPrereqIds,
  spacePrereqCounts,
  profileMap,
  commentsMap,
  openCommentBlockId,
  openToggles,
  activeBlockId,
  onUpdateTitle,
  onToggleLock,
  onTogglePrerequisite,
  onSelectBlock,
  onUpdateBlockContent,
  onChangeBlockType,
  onDuplicateBlock,
  onMoveBlockToPage,
  onDeleteBlock,
  onAddBlock,
  onToggleComment,
  onAddComment,
  onOpenEmojiPicker,
  onOpenSongPicker,
  onToggleCollapse,
  onReorderBlock,
}) => {
  const [commentInput, setCommentInput] = useState('');
  const topLevelBlocks = blocks.filter((b) => !b.parent_block_id);

  const handleSendComment = (blockId: string) => {
    if (!commentInput.trim()) return;
    onAddComment(blockId, commentInput);
    setCommentInput('');
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <input
          type="text"
          value={page.title || ''}
          readOnly={page.locked}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="Titre du cours"
          className="text-3xl md:text-4xl font-display font-bold text-ink bg-transparent border-none outline-none w-full"
        />
        <button
          onClick={onToggleLock}
          className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-colors ${
            page.locked
              ? 'bg-ochre-soft text-[#7a5c10] border-ochre hover:bg-ochre hover:text-white'
              : 'bg-surface text-muted border-border hover:text-ink'
          }`}
          title={page.locked ? 'Déverrouiller' : 'Verrouiller'}
        >
          {page.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>{page.locked ? 'Verrouillé' : 'Verrouiller'}</span>
        </button>
      </div>

      <p className="text-xs text-muted mb-6">
        Modifié {fmtDate(page.updated_at || page.created_at)} · espace « {spaceName} »
      </p>

      {/* Prerequisites Bar */}
      <PrerequisitesBar
        prerequisites={prerequisites}
        selectedIds={selectedPrereqIds}
        spaceCounts={spacePrereqCounts}
        locked={page.locked}
        onToggle={onTogglePrerequisite}
      />

      {/* Blocks */}
      <div className="space-y-1">
        {topLevelBlocks.map((b) => (
          <div key={b.id}>
            <BlockItem
              block={b}
              childBlocks={blocks.filter((child) => child.parent_block_id === b.id)}
              locked={page.locked}
              activeBlockId={activeBlockId}
              commentsCount={(commentsMap[b.id]

<dyad-write path="src/components/PageEditor.tsx" description="Complete PageEditor component with blocks and prerequisites">
import React, { useState } from 'react';
import { Page, Block, Prerequisite, BlockType } from '../types';
import { fmtDate } from '../lib/utils';
import { PrerequisitesBar } from './PrerequisitesBar';
import { BlockItem } from './BlockItem';
import { Lock, Unlock, Plus, Send } from 'lucide-react';

interface PageEditorProps {
  page: Page;
  spaceName: string;
  pages: Page[];
  blocks: Block[];
  prerequisites: Prerequisite[];
  selectedPrereqIds: Set<string>;
  spacePrereqCounts: Record<string, number>;
  profileMap: Record<string, string>;
  commentsMap: Record<string, any[]>;
  openCommentBlockId: string | null;
  openToggles: Set<string>;
  activeBlockId: string | null;
  onUpdateTitle: (title: string) => void;
  onToggleLock: () => void;
  onTogglePrerequisite: (prereqId: string) => void;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlockContent: (block: Block, patch: any) => void;
  onChangeBlockType: (block: Block, type: BlockType) => void;
  onDuplicateBlock: (block: Block) => void;
  onMoveBlockToPage: (block: Block) => void;
  onDeleteBlock: (block: Block) => void;
  onAddBlock: (type: BlockType, parentId?: string | null) => void;
  onToggleComment: (blockId: string) => void;
  onAddComment: (blockId: string, text: string) => void;
  onOpenEmojiPicker: (blockId: string) => void;
  onOpenSongPicker: (blockId: string) => void;
  onToggleCollapse: (blockId: string) => void;
  onReorderBlock: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
}

export const PageEditor: React.FC<PageEditorProps> = ({
  page,
  spaceName,
  pages,
  blocks,
  prerequisites,
  selectedPrereqIds,
  spacePrereqCounts,
  profileMap,
  commentsMap,
  openCommentBlockId,
  openToggles,
  activeBlockId,
  onUpdateTitle,
  onToggleLock,
  onTogglePrerequisite,
  onSelectBlock,
  onUpdateBlockContent,
  onChangeBlockType,
  onDuplicateBlock,
  onMoveBlockToPage,
  onDeleteBlock,
  onAddBlock,
  onToggleComment,
  onAddComment,
  onOpenEmojiPicker,
  onOpenSongPicker,
  onToggleCollapse,
  onReorderBlock,
}) => {
  const [commentInput, setCommentInput] = useState('');
  const topLevelBlocks = blocks.filter((b) => !b.parent_block_id);

  const handleSendComment = (blockId: string) => {
    if (!commentInput.trim()) return;
    onAddComment(blockId, commentInput);
    setCommentInput('');
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <input
          type="text"
          value={page.title || ''}
          readOnly={page.locked}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="Titre du cours"
          className="text-3xl md:text-4xl font-display font-bold text-ink bg-transparent border-none outline-none w-full"
        />
        <button
          onClick={onToggleLock}
          className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-colors ${
            page.locked
              ? 'bg-ochre-soft text-[#7a5c10] border-ochre hover:bg-ochre hover:text-white'
              : 'bg-surface text-muted border-border hover:text-ink'
          }`}
          title={page.locked ? 'Déverrouiller' : 'Verrouiller'}
        >
          {page.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>{page.locked ? 'Verrouillé' : 'Verrouiller'}</span>
        </button>
      </div>

      <p className="text-xs text-muted mb-6">
        Modifié {fmtDate(page.updated_at || page.created_at)} · espace « {spaceName} »
      </p>

      {/* Prerequisites Bar */}
      <PrerequisitesBar
        prerequisites={prerequisites}
        selectedIds={selectedPrereqIds}
        spaceCounts={spacePrereqCounts}
        locked={page.locked}
        onToggle={onTogglePrerequisite}
      />

      {/* Blocks */}
      <div className="space-y-1">
        {topLevelBlocks.map((b) => (
          <div key={b.id}>
            <BlockItem
              block={b}
              childBlocks={blocks.filter((child) => child.parent_block_id === b.id)}
              locked={page.locked}
              activeBlockId={activeBlockId}
              commentsCount={(commentsMap[b.id] || []).length}
              openCommentBlockId={openCommentBlockId}
              openToggles={openToggles}
              profileMap={profileMap}
              onSelectBlock={onSelectBlock}
              onUpdateContent={onUpdateBlockContent}
              onChangeType={onChangeBlockType}
              onDuplicate={onDuplicateBlock}
              onMoveToPage={onMoveBlockToPage}
              onDelete={onDeleteBlock}
              onToggleComment={onToggleComment}
              onOpenEmojiPicker={onOpenEmojiPicker}
              onOpenSongPicker={onOpenSongPicker}
              onToggleCollapse={onToggleCollapse}
              onAddChildBlock={(parentId) => onAddBlock('paragraph', parentId)}
              onReorderBlock={onReorderBlock}
            />

            {/* Comments panel */}
            {openCommentBlockId === b.id && (
              <div className="my-2 p-3 bg-surface border border-border rounded-xl shadow-sm space-y-2">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(commentsMap[b.id] || []).length === 0 ? (
                    <p className="text-xs text-muted italic">Aucun commentaire.</p>
                  ) : (
                    (commentsMap[b.id] || []).map((c) => (
                      <div key={c.id} className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-green">
                            {profileMap[c.user_id] || 'Inconnu'}
                          </span>
                          <span className="text-[10px] text-muted">{fmtDate(c.created_at)}</span>
                        </div>
                        <div className="text-ink mt-0.5">{c.content}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <input
                    type="text"
                    placeholder="Ajouter un commentaire…"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendComment(b.id);
                    }}
                    className="flex-1 text-xs px-2.5 py-1.5 bg-bg border border-border rounded-lg outline-none focus:border-green text-ink"
                  />
                  <button
                    onClick={() => handleSendComment(b.id)}
                    className="bg-green text-white p-1.5 rounded-lg text-xs hover:bg-green-light"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add block button */}
      {!page.locked && (
        <div className="mt-4">
          <button
            onClick={() => onAddBlock('paragraph')}
            className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-border rounded-xl text-xs font-semibold text-muted hover:border-terracotta hover:text-terracotta hover:bg-terracotta-soft transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un bloc</span>
          </button>
        </div>
      )}
    </div>
  );
};