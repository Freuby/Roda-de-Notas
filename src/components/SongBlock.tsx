import React, { useState } from 'react';
import { Block, BlockContent } from '../types';
import { SONG_CATEGORIES } from '../lib/utils';
import { Music, ArrowRightLeft, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface SongBlockProps {
  block: Block;
  locked?: boolean;
  onOpenPicker: (blockId: string) => void;
}

export const SongBlock: React.FC<SongBlockProps> = ({ block, locked, onOpenPicker }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const content = block.content || {};

  if (!content.song_id && !content.title) {
    return (
      <div className="flex items-center justify-between p-3.5 bg-surface border border-dashed border-border rounded-xl">
        <span className="text-xs text-muted flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-muted" />
          <span>Aucun chant sélectionné</span>
        </span>
        {!locked && (
          <button
            onClick={() => onOpenPicker(block.id)}
            className="bg-terracotta text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm hover:opacity-95 transition-opacity"
          >
            Choisir un chant
          </button>
        )}
      </div>
    );
  }

  const categoryName = content.category ? SONG_CATEGORIES[content.category] || content.category : '';

  return (
    <div className="w-full bg-surface border border-terracotta rounded-xl overflow-hidden shadow-sm">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 flex items-center gap-3 cursor-pointer hover:bg-bg/40 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-terracotta-soft text-terracotta flex items-center justify-center font-bold text-sm flex-shrink-0">
          ♪
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-sm text-ink truncate">
            {content.title || 'Sans titre'}
          </div>
          {categoryName && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-terracotta bg-terracotta-soft px-2 py-0.5 rounded-full mt-1">
              {categoryName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!locked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPicker(block.id);
              }}
              className="p-1.5 text-muted hover:text-ink hover:bg-bg rounded-md"
              title="Changer de chant"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-muted p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border bg-bg/20 space-y-3">
          {content.lyrics ? (
            <pre className="text-xs font-sans text-ink leading-relaxed whitespace-pre-wrap bg-surface p-3 rounded-lg border border-border">
              {content.lyrics}
            </pre>
          ) : (
            <p className="text-xs text-muted italic">Pas de paroles enregistrées.</p>
          )}

          {content.mnemonic && (
            <div className="text-xs text-green font-medium italic">
              💭 {content.mnemonic}
            </div>
          )}

          {content.mediaLink && (
            <a
              href={content.mediaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-terracotta font-semibold hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Écouter / voir la vidéo</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};