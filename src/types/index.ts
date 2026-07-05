/* ======================= Modèle de données =======================
 * Déduit du code app.js original + du schéma Supabase réel.
 * Toutes les tables et la structure JSON des blocs sont ici. */

// ---- Tables métier ----

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at?: string;
}

export interface Space {
  id: string;
  name: string;
  created_by: string;
  order_index: number;
  created_at?: string;
}

export interface Page {
  id: string;
  space_id: string;
  title: string;
  created_by: string;
  order_index: number;
  locked: boolean;
  created_at?: string;
  updated_at?: string;
}

// ---- Types de blocs ----

export type BlockType =
  | 'heading'
  | 'subheading'
  | 'toggle'
  | 'paragraph'
  | 'bullet'
  | 'numbered'
  | 'callout'
  | 'video'
  | 'song'
  | 'divider';

export interface BlockTypeMeta {
  type: BlockType;
  label: string;
  icon: string;
}

export const BLOCK_TYPES: BlockTypeMeta[] = [
  { type: 'heading', label: 'Titre', icon: 'H1' },
  { type: 'subheading', label: 'Sous-titre', icon: 'H2' },
  { type: 'toggle', label: 'Titre dépliant', icon: '▸' },
  { type: 'paragraph', label: 'Texte', icon: '¶' },
  { type: 'bullet', label: 'Liste à puces', icon: '•' },
  { type: 'numbered', label: 'Liste numérotée', icon: '1.' },
  { type: 'callout', label: 'Encadré', icon: '!' },
  { type: 'video', label: 'Vidéo', icon: '▶' },
  { type: 'song', label: 'Chant (base de données)', icon: '♪' },
  { type: 'divider', label: 'Séparateur', icon: '—' },
];

/** Contenu JSON d'un bloc, selon son type. */
export interface BlockContent {
  // texte simple (heading, subheading, paragraph, bullet, numbered, toggle)
  text?: string;
  // callout
  emoji?: string;
  // video
  url?: string;
  caption?: string;
  // song (snapshot au moment de l'insertion)
  song_id?: string;
  title?: string;
  category?: SongCategory;
  lyrics?: string;
  mnemonic?: string;
  mediaLink?: string;
}

export interface Block {
  id: string;
  page_id: string;
  type: BlockType;
  content: BlockContent;
  parent_block_id: string | null;
  order_index: number;
  created_by: string;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  block_id: string;
  user_id: string;
  content: string;
  seen_by: string[] | null;
  created_at: string;
}

// ---- Chants ----

export type SongCategory =
  | 'angola'
  | 'saoBentoPequeno'
  | 'saoBentoGrande'
  | 'sambaDeRoda'
  | 'maculele'
  | 'puxadaDeRede'
  | 'autre';

export const SONG_CATEGORIES: Record<SongCategory, string> = {
  angola: 'Angola',
  saoBentoPequeno: 'São Bento Pequeno',
  saoBentoGrande: 'São Bento Grande',
  sambaDeRoda: 'Samba de Roda',
  maculele: 'Maculelê',
  puxadaDeRede: 'Puxada de Rede',
  autre: 'Autre',
};

export interface Song {
  id: string;
  title: string;
  category: SongCategory;
  mnemonic?: string;
  lyrics?: string;
  mediaLink?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// ---- Prérequis ----

export type Corde = '2' | '3' | '4';

export interface Prerequisite {
  id: string;
  label: string;
  corde: Corde;
  category: string;
  order_index: number;
}

export interface PagePrerequisite {
  page_id: string;
  prerequisite_id: string;
}

// ---- Notifications (vue dérivée côté client) ----

export interface Notification {
  id: string;
  block_id: string;
  page_id: string;
  page_title: string;
  user_id: string;
  content: string;
  created_at: string;
  seen_by: string[] | null;
  seen: boolean;
}

// ---- Divers ----

export interface VideoEmbed {
  platform: 'youtube' | 'instagram' | 'facebook';
  id?: string;
  embedUrl: string;
  watchUrl: string;
}

export interface SpaceVisual {
  symbol: string;
  color: { bg: string; fg: string; border: string };
}
