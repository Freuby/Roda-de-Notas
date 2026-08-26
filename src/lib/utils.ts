import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalize(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
    ' à ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
}

export interface VideoEmbedInfo {
  platform: 'youtube' | 'instagram' | 'facebook';
  id?: string;
  embedUrl: string;
  watchUrl: string;
}

export function detectVideoEmbed(url?: string): VideoEmbedInfo | null {
  if (!url) return null;

  const ytPatterns = [
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/,
  ];
  for (const p of ytPatterns) {
    const m = url.match(p);
    if (m) {
      return {
        platform: 'youtube',
        id: m[1],
        embedUrl: `https://www.youtube.com/embed/${m[1]}`,
        watchUrl: `https://www.youtube.com/watch?v=${m[1]}`,
      };
    }
  }

  if (/instagram\.com\/(p|reel|tv)\//.test(url)) {
    const cleanUrl = url.split('?')[0].replace(/\/?$/, '/');
    return { platform: 'instagram', embedUrl: `${cleanUrl}embed`, watchUrl: cleanUrl };
  }

  if (/facebook\.com|fb\.watch/.test(url)) {
    const cleanUrl = url.split('?')[0];
    return {
      platform: 'facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=0`,
      watchUrl: cleanUrl,
    };
  }

  return null;
}

export const SONG_CATEGORIES: Record<string, string> = {
  angola: 'Angola',
  saoBentoPequeno: 'São Bento Pequeno',
  saoBentoGrande: 'São Bento Grande',
  sambaDeRoda: 'Samba de Roda',
  maculele: 'Maculelê',
  puxadaDeRede: 'Puxada de Rede',
  autre: 'Autre',
};