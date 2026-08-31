import React from 'react';
import { Menu, Search, Moon, Sun } from 'lucide-react';

interface MobileTopbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const MobileTopbar: React.FC<MobileTopbarProps> = ({
  sidebarOpen,
  onToggleSidebar,
  onOpenSearch,
  theme,
  onToggleTheme,
}) => {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border flex items-center justify-between px-4 z-20">
      <button onClick={onToggleSidebar} className="p-2 text-ink">
        <Menu className="w-5 h-5" />
      </button>
      <span className="font-display font-bold text-ink flex items-center gap-2">
        <span className="text-terracotta">🪘</span> Roda de Notas
      </span>
      <div className="flex items-center gap-2">
        <button onClick={onToggleTheme} className="p-2 text-muted hover:text-ink">
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        <button onClick={onOpenSearch} className="p-2 text-muted">
          <Search className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};