import React from 'react';
import { Page, Block } from '../types';
import { X, ArrowRight, FileText } from 'lucide-react';

interface MoveBlockModalProps {
  block: Block;
  pages: Page[];
  onMove: (targetPageId: string) => void;
  onClose: () => void;
}

export const MoveBlockModal: React.FC<MoveBlockModalProps> = ({
  block,
  pages,
  onMove,
  onClose,
}) => {
  const otherPages = pages.filter((p) => p.id !== block.page_id);
  const preview =
    block.content?.text ||
    block.content?.title ||
    block.content?.caption ||
    `Bloc ${block.type}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-card w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-ink">
              Déplacer vers un autre cours
            </h3>
            <p className="text-xs text-muted truncate max-w-[280px] mt-0.5">
              « {preview} »
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:text-ink rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {otherPages.length === 0 ? (
            <p className="text-center text-xs text-muted py-8 italic">
              Aucun autre cours disponible dans cet espace.
            </p>
          ) : (
            otherPages.map((p) => (
              <button
                key={p.id}
                onClick={() => onMove(p.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-bg text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-green flex-shrink-0" />
                  <span className="text-xs font-semibold text-ink truncate">
                    {p.title || 'Sans titre'}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-terracotta group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-border bg-surface text-right">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-muted hover:text-ink font-semibold rounded-lg"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};