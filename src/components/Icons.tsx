import React from 'react';

interface IconProps {
  className?: string;
}

export const BerimbauIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M2 13.5C5 8 8 2.5 13.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="2.6" cy="13" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4.2 11.6L12.8 3" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round"/>
  </svg>
);

export const AtabaqueIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M5 2.5h6l-1.2 11H6.2L5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M5 2.5C5 3.3 6.3 4 8 4s3-.7 3-1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M6 6.2h4M6.3 8.6h3.4M6.6 11h2.8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
  </svg>
);

export const GingaIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 4.6v4.2M8 8.8 5 13M8 8.8l3.3 2.4M8 6.6 4.8 8.4M8 6.6l3.4 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const EstrelaIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.5l1.8 4.2 4.5.4-3.4 3 1 4.4L8 11.2l-3.9 2.3 1-4.4-3.4-3 4.5-.4L8 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

export const PandeiroIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="0.9"/>
    <circle cx="3.3" cy="6" r="0.7" fill="currentColor"/>
    <circle cx="12.7" cy="6" r="0.7" fill="currentColor"/>
    <circle cx="3.3" cy="10" r="0.7" fill="currentColor"/>
    <circle cx="12.7" cy="10" r="0.7" fill="currentColor"/>
  </svg>
);

export const SPACE_ICONS = [
  BerimbauIcon,
  AtabaqueIcon,
  GingaIcon,
  EstrelaIcon,
  PandeiroIcon,
];