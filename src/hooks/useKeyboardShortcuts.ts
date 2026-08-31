import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  session: any;
  activeBlockId: string | null;
  blockHistory: any[];
  historyIndex: number;
  setActiveBlockId: (id: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  setToastMessage: (msg: string | null) => void;
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
  setToastMessage,
  navigateBlock,
  undoBlock,
  redoBlock,
  deleteActiveBlock,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K — open global search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (session) setSearchOpen(true);
        return;
      }

      if (!session) return;

      // Escape — close search or deselect block
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setActiveBlockId(null);
        return;
      }

      // Don't intercept when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Arrow navigation between blocks
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateBlock('up');
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateBlock('down');
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateBlock('left');
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateBlock('right');
        return;
      }

      // Cmd/Ctrl + Z — undo / redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redoBlock();
        } else {
          undoBlock();
        }
        return;
      }

      // Delete / Backspace — delete active block
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeBlockId) {
        e.preventDefault();
        deleteActiveBlock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, activeBlockId, blockHistory, historyIndex]);
}