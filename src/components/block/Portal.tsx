import React, { useEffect, useRef, useState } from 'react';

// Renders menus outside the block hierarchy to avoid overflow/positioning issues
export const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    elRef.current = document.createElement('div');
    document.body.appendChild(elRef.current);
    setMounted(true);
    return () => {
      if (elRef.current) {
        document.body.removeChild(elRef.current);
      }
    };
  }, []);

  if (!mounted || !elRef.current) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'auto' }}>
      {children}
    </div>
  );
};
