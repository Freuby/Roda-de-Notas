/** SVG icons pour les espaces - version React components */

import React from 'react';

export const SPACE_DOT_COLORS = [
  { bg: '#FFE3CC', fg: '#FF6B00', border: '#FF6B00' },
  { bg: '#DCEFE6', fg: '#1A3C2F', border: '#2E6B52' },
  { bg: '#FFF3D6', fg: '#8a6a1f', border: '#FFB300' },
  { bg: '#dce8f5', fg: '#2c5d8a', border: '#5b8fc4' },
  { bg: '#f3dcec', fg: '#9c2f7a', border: '#c45ba3' },
  { bg: '#e2e8d8', fg: '#52681f', border: '#82a23f' },
  { bg: '#fde2e2', fg: '#b3401f', border: '#e0654a' },
  { bg: '#e6e1f5', fg: '#4f3c8a', border: '#7e68c4' },
];

export const SpaceIcons = [
  // berimbau
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path d="M2 13.5C5 8 8 2.5 13.5 2" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="2.6" cy="13" r="1.8"/>
      <path d="M4.2 11.6L12.8 3" stroke="currentColor" strokeWidth=".7"/>
    </svg>
  ),
  // atabaque
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" {...props}>
      <path d="M5 2.5h6l-1.2 11H6.2L5 2.5Z"/>
      <path d="M5 2.5C5 3.3 6.3 4 8 4s3-.7 3-1.5"/>
      <path d="M6 6.2h4M6.3 8.6h3.4M6.6 11h2.8"/>
    </svg>
  ),
  // ginga
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" {...props}>
      <circle cx="8" cy="3" r="1.5"/>
      <path d="M8 4.6v4.2M8 8.8 5 13M8 8.8l3.3 2.4M8 6.6 4.8 8.4M8 6.6l3.4 1"/>
    </svg>
  ),
  // star
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" {...props}>
      <path d="M8 1.5l1.8 4.2 4.5.4-3.4 3 1 4.4L8 11.2l-3.9 2.3 1-4.4-3.4-3 4.5-.4L8 1.5Z"/>
    </svg>
  ),
  // leaf
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" {...props}>
      <path d="M3 13C3 7 7 2.5 13.5 2.5 13.5 9 9 13 3 13Z"/>
      <path d="M3.5 12.5C6.5 9.5 9 7 12.5 3.2"/>
    </svg>
  ),
  // moon
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" {...props}>
      <path d="M10.8 2.2a6 6 0 1 0 3 9.4 5 5 0 0 1-3-9.4Z"/>
    </svg>
  ),
  // au (rotation)
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" {...props}>
      <circle cx="8" cy="8" r="5.3" strokeDasharray="2.2 2.4"/>
      <path d="M11.6 4.5l1.6-.4-.1 1.7"/>
    </svg>
  ),
  // pandeiro
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" {...props}>
      <circle cx="8" cy="8" r="5.6"/>
      <circle cx="8" cy="8" r="2.6"/>
      <circle cx="3.3" cy="6" r=".7"/>
      <circle cx="12.7" cy="6" r=".7"/>
      <circle cx="3.3" cy="10" r=".7"/>
      <circle cx="12.7" cy="10" r=".7"/>
    </svg>
  ),
] as const;
