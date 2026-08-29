import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
      <div className="bg-ink text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/10">
        {type === 'success' ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-terracotta" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};