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

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
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
  locked?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BlockContent {
  text?: string;
  url?: string;
  caption?: string;
  emoji?: string;
  song_id?: string;
  title?: string;
  category?: string;
  mnemonic?: string;
  lyrics?: string;
  mediaLink?: string;
}

export interface Block {
  id: string;
  page_id: string;
  type: BlockType;
  content: BlockContent;
  parent_block_id?: string | null;
  order_index: number;
  created_by: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  block_id: string;
  user_id: string;
  content: string;
  created_at?: string;
  seen_by?: string[];
}

export interface Song {
  id: string;
  title: string;
  category?: string;
  mnemonic?: string;
  lyrics?: string;
  mediaLink?: string;
}

export interface Prerequisite {
  id: string;
  label: string;
  corde: '2' | '3' | '4';
  category: string;
  order_index: number;
}

export interface NotificationItem extends Comment {
  page_id?: string;
  page_title?: string;
  seen: boolean;
}