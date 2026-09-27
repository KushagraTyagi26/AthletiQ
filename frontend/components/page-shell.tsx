'use client';

import React from 'react';

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="pb-1">
      <h1 className="text-2xl sm:text-3.5xl lg:text-4xl font-black tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 max-w-4xl text-base sm:text-lg leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-l-4 border-primary pl-4 py-0.5">
      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm sm:text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
