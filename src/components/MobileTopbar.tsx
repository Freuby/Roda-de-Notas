import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';

interface MobileTopbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const MobileTopbar: React.FC<MobileTopbarProps> = ({
  sidebarOpen,
  onToggleSidebar,
  theme,
  onToggleTheme,
}) => {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1A0B2E] border-b border-[#2E1B4E] flex items-center justify-between px-4 z-20">
      <button onClick={onToggleSidebar} className="p-2 text-white">
        <Menu className="w-5 h-5" />
      </button>
      <span className="font-display font-bold text-white flex items-center gap-2">
        <img src="/icons/logo.svg" alt="Roda de Notas" className="w-5 h-5 rounded-full border border-border object-cover" /> Roda de Notas
      </span>
      <div className="flex items-center gap-2">
        <button onClick={onToggleTheme} className="p-2 text-white hover:text-white">
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};