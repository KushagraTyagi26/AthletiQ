'use client';

import React from 'react';
import { Sidebar, MobileNav } from '@/components/sidebar';
import { PageShell } from '@/components/page-shell';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <MobileNav />
        <main className="flex-1 scrollbar-thin">
          <PageShell>{children}</PageShell>
        </main>
      </div>
    </div>
  );
}
