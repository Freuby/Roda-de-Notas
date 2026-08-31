import { useState, useCallback } from 'react';
import { Block } from '../types';

interface HistoryEntry {
  action: string;
  blockId: string;
  previousContent: any;
  newContent: any;
}

export function useBlockHistory() {
  const [blockHistory, setBlockHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = useCallback((action: string, block: Block, previousContent?: any) => {
    const entry: HistoryEntry = {
      action,
      blockId: block.id,
      previousContent,
      newContent: block.content,
    };
    setBlockHistory((prev) => [...prev.slice(0, historyIndex + 1), entry]);
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undoBlock = useCallback(() => {
    if (historyIndex > 0) {
      const previousItem = blockHistory[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      return previousItem;
    }
    return null;
  }, [historyIndex, blockHistory]);

  const redoBlock = useCallback(() => {
    if (historyIndex < blockHistory.length - 1) {
      const nextItem = blockHistory[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      return nextItem;
    }
    return null;
  }, [historyIndex, blockHistory]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < blockHistory.length - 1;

  return {
    blockHistory,
    historyIndex,
    setBlockHistory,
    setHistoryIndex,
    saveToHistory,
    undoBlock,
    redoBlock,
    canUndo,
    canRedo,
  };
}