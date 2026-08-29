import React from 'react';
import { Block } from '../types';
import { detectVideoEmbed } from '../lib/utils';
import { Play, ExternalLink, Camera } from 'lucide-react';

interface VideoBlockProps {
  block: Block;
  locked?: boolean;
  onUpdate: (patch: { url?: string; caption?: string }) => void;
}

export const VideoBlock: React.FC<VideoBlockProps> = ({ block, locked, onUpdate }) => {
  const content = block.content || {};
  const videoInfo = detectVideoEmbed(content.url);

  return (
    <div className="w-full space-y-2">
      {!locked && (
        <input
          type="text"
          value={content.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="Collez un lien YouTube, Instagram ou Facebook…"
          className="w-full text-xs px-3 py-2 bg-surface border border-border rounded-lg outline-none focus:border-terracotta text-ink"
        />
      )}

      {videoInfo && videoInfo.platform === 'youtube' && (
        <div className="relative w-full pb-[56.25%] rounded-xl overflow-hidden bg-black border border-border shadow-sm">
          <iframe
            src={videoInfo.embedUrl}
            title="Vidéo YouTube"
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {videoInfo && videoInfo.platform === 'facebook' && (
        <div className="relative w-full pb-[56.25%] rounded-xl overflow-hidden bg-black border border-border shadow-sm">
          <iframe
            src={videoInfo.embedUrl}
            title="Vidéo Facebook"
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {videoInfo && (
        <div className="pt-1">
          <a
            href={videoInfo.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-terracotta hover:underline inline-flex items-center gap-1 font-medium"
          >
            {videoInfo.platform === 'instagram' ? (
              <Camera className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-terracotta" />
            )}
            <span>
              Regarder sur {videoInfo.platform}
              {videoInfo.platform === 'instagram' ? ' (ouvrir le post / reel)' : ' (lien externe)'}
            </span>
          </a>
        </div>
      )}

      {!locked ? (
        <input
          type="text"
          value={content.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          placeholder="Légende (optionnel)..."
          className="w-full text-xs px-1 py-0.5 bg-transparent border-none outline-none text-muted italic placeholder-muted"
        />
      ) : (
        content.caption && <div className="text-xs text-muted italic px-1">{content.caption}</div>
      )}
    </div>
  );
};