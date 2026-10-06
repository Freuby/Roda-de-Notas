import { useState, useCallback, useRef } from 'react';
import { Block, BlockType } from '../types';

export interface HistoryState {
  type: BlockType;
  content: any;
}

export interface BlockSnapshot {
  id: string;
  page_id: string;
  parent_block_id: string | null;
  order_index: number;
  type: BlockType;
  content: any;
}

export interface HistoryEntry {
  blockId: string;
  previous: HistoryState;
  next: HistoryState;
  action: string;
  // For deletions, we store enough to restore the block
  snapshot?: BlockSnapshot;
  // Optional: children that were deleted together (e.g. inside a toggle)
  childSnapshots?: BlockSnapshot[];
}

const MAX_HISTORY = 50;

export function useBlockHistory() {
  const [blockHistory, setBlockHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isApplyingRef = useRef(false);

  const recordChange = useCallback((
    block: Block, 
    nextPatch?: Partial<{ type: BlockType; content: any }>,
    action: string = 'edit'
  ) => {
    if (isApplyingRef.current) return;

    const previous: HistoryState = {
      type: block.type,
      content: block.content ? { ...block.content } : {},
    };

    const nextType = nextPatch?.type ?? block.type;
    const nextContent = nextPatch?.content 
      ? { ...block.content, ...nextPatch.content }
      : { ...block.content };

    const next: HistoryState = {
      type: nextType,
      content: nextContent,
    };

    if (
      previous.type === next.type &&
      JSON.stringify(previous.content) === JSON.stringify(next.content)
    ) {
      return;
    }

    const entry: HistoryEntry = {
      blockId: block.id,
      previous,
      next,
      action,
    };

    setBlockHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const newHistory = [...trimmed, entry];
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(newHistory.length - MAX_HISTORY);
      }
      return newHistory;
    });

    setHistoryIndex((prev) => {
      const newIdx = Math.min(prev + 1, MAX_HISTORY - 1);
      return Math.min(newIdx, blockHistory.length);
    });
  }, [historyIndex, blockHistory.length]);

  // Record a deletion with full snapshot (including direct children for toggles etc.)
  const recordDeletion = useCallback((block: Block, childSnapshots: BlockSnapshot[] = []) => {
    if (isApplyingRef.current) return;

    const previous: HistoryState = {
      type: block.type,
      content: block.content ? { ...block.content } : {},
    };

    const snapshot: BlockSnapshot = {
      id: block.id,
      page_id: block.page_id,
      parent_block_id: block.parent_block_id || null,
      order_index: block.order_index,
      type: block.type,
      content: block.content ? { ...block.content } : {},
    };

    const entry: HistoryEntry = {
      blockId: block.id,
      previous,
      next: { type: block.type, content: { __deleted: true } },
      action: 'delete',
      snapshot,
      // We store children snapshots so undo can restore the whole subtree
      // @ts-ignore - extending the type locally for this feature
      childSnapshots,
    };

    setBlockHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const newHistory = [...trimmed, entry];
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(newHistory.length - MAX_HISTORY);
      }
      return newHistory;
    });

    setHistoryIndex((prev) => {
      const newIdx = Math.min(prev + 1, MAX_HISTORY - 1);
      return Math.min(newIdx, blockHistory.length);
    });
  }, [historyIndex, blockHistory.length]);

  // Record a creation (so undo can delete it)
  const recordCreation = useCallback((block: Block) => {
    if (isApplyingRef.current) return;

    const previous: HistoryState = {
      type: block.type,
      content: {}, // block didn't exist before
    };

    const next: HistoryState = {
      type: block.type,
      content: block.content ? { ...block.content } : {},
    };

    const entry: HistoryEntry = {
      blockId: block.id,
      previous,
      next,
      action: 'create',
    };

    setBlockHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const newHistory = [...trimmed, entry];
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(newHistory.length - MAX_HISTORY);
      }
      return newHistory;
    });

    setHistoryIndex((prev) => {
      const newIdx = Math.min(prev + 1, MAX_HISTORY - 1);
      return Math.min(newIdx, blockHistory.length);
    });
  }, [historyIndex, blockHistory.length]);

  const undo = useCallback(() => {
    if (historyIndex < 0) return null;
    const entry = blockHistory[historyIndex];
    if (!entry) return null;

    isApplyingRef.current = true;
    setHistoryIndex((prev) => prev - 1);
    setTimeout(() => { isApplyingRef.current = false; }, 0);

    return entry;
  }, [historyIndex, blockHistory]);

  const redo = useCallback(() => {
    if (historyIndex >= blockHistory.length - 1) return null;
    const entry = blockHistory[historyIndex + 1];
    if (!entry) return null;

    isApplyingRef.current = true;
    setHistoryIndex((prev) => prev + 1);
    setTimeout(() => { isApplyingRef.current = false; }, 0);

    return entry;
  }, [historyIndex, blockHistory]);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < blockHistory.length - 1;

  const clear = useCallback(() => {
    setBlockHistory([]);
    setHistoryIndex(-1);
    isApplyingRef.current = false;
  }, []);

  // After redoing a creation (new id generated), remap history entries
  const remapBlockId = useCallback((oldId: string, newId: string) => {
    setBlockHistory((prev) =>
      prev.map((e) => (e.blockId === oldId ? { ...e, blockId: newId } : e))
    );
  }, []);

  return {
    blockHistory,
    historyIndex,
    recordChange,
    recordDeletion,
    recordCreation,
    remapBlockId,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
    isApplying: () => isApplyingRef.current,
  };
}
