'use client';

import React from 'react';
import { FormProvider } from '@/lib/form-context';
import { NavProvider } from '@/lib/nav-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NavProvider>
      <FormProvider>{children}</FormProvider>
    </NavProvider>
  );
}
