import React from 'react';
import { createPortal } from 'react-dom';

// Renders menus directly in <body> to avoid transformed/overflow ancestors breaking fixed positioning
export const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  createPortal(<div style={{ position: 'relative', zIndex: 9999 }}>{children}</div>, document.body);
