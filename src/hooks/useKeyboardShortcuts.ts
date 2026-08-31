import { useEffect } from 'react';
import { useRodaData } from './useRodaData';

interface KeyboardShortcutsOptions {
  session: any;
  activeBlockId: string | null;
  blockHistory: any[];
  historyIndex: number;
  setActiveBlockId: (id: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  setBlockHistory: React.Dispatch<React.SetStateAction<any[]>>;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  setToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  navigateBlock: (dir: 'up' | 'down' | 'left' | 'right') => void;
  undoBlock: () => void;
  redoBlock: () => void;
  deleteActiveBlock: () => void;
}

export function useKeyboardShortcuts({
  session,
  activeBlockId,
  blockHistory,
  historyIndex,
  setActiveBlockId,
  setSearchOpen,
  setBlockHistory,
  setHistoryIndex,
  setToastMessage,
  navigateBlock,
  undoBlock,
  redoBlock,
  deleteActiveBlock,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }

      if (session && !e.shiftKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            navigateBlock('up');
            break;
          case 'ArrowDown':
            e.preventDefault();
            navigateBlock('down');
            break;
          case 'ArrowLeft':
            e.preventDefault();
            navigateBlock('left');
            break;
          case 'ArrowRight':
            e.preventDefault();
            navigateBlock('right');
            break;
          case 'Escape':
            e.preventDefault();
            setActiveBlockId(null);
            setSearchOpen(false);
            break;
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redoBlock();
        } else {
          undoBlock();
        }
      }

      if (e.key === 'Delete' && activeBlockId) {
        e.preventDefault();
        deleteActiveBlock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, activeBlockId, blockHistory, historyIndex]);
}