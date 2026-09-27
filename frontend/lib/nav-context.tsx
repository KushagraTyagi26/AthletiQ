'use client';

import React, { createContext, useContext, useState } from 'react';

interface PageMeta {
  title: string;
  description: string;
}

type PageKey =
  | 'prediction'
  | 'feature-explorer'
  | 'data-insights'
  | 'how-it-works'
  | 'polynomial-fitting'
  | 'methodology';

interface NavContextValue {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <NavContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}

export type { PageKey, PageMeta };
