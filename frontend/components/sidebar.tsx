'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gauge,
  ScatterChart,
  BarChart3,
  Workflow,
  Spline,
  ClipboardList,
  Activity,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNav } from '@/lib/nav-context';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Prediction',
    icon: Gauge,
    description: 'Six-input lactate estimation',
  },
  {
    href: '/feature-explorer',
    label: 'Feature Explorer',
    icon: ScatterChart,
    description: 'Six-feature analytics & curves',
  },
  {
    href: '/data-insights',
    label: 'Data Insights',
    icon: BarChart3,
    description: 'Dataset summaries & distributions',
  },
  {
    href: '/how-it-works',
    label: 'How It Works',
    icon: Workflow,
    description: 'Pipeline & regression overview',
  },
  {
    href: '/polynomial-fitting',
    label: 'Polynomial Curve Fitting',
    icon: Spline,
    description: 'Nonlinear ML fundamentals',
  },
  {
    href: '/methodology',
    label: 'Methodology',
    icon: ClipboardList,
    description: 'Dataset & validation protocol',
  },
] as const;

export const NAV_LINKS = NAV_ITEMS;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
              isActive
                ? 'bg-white text-sidebar shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={cn(
                'mt-0.5 h-5 w-5 shrink-0 transition-transform group-hover:scale-110',
                isActive ? 'text-primary' : 'text-white/60 group-hover:text-white'
              )}
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                {item.label}
              </span>
              <span
                className={cn(
                  'text-xs leading-tight',
                  isActive ? 'text-sidebar/60' : 'text-white/45'
                )}
              >
                {item.description}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md">
        <Activity className="h-6 w-6 text-primary" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold tracking-tight text-white">
          AthletiQ
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">
          Lactate Estimation
        </span>
      </div>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      <SidebarLogo />
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        <NavLinks />
      </div>
      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-white/40">
          Explore exercise intensity and physiological response. Not a medical
          device.
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { mobileOpen, setMobileOpen } = useNav();

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-sidebar px-4 py-3 text-white shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <Activity className="h-5 w-5 text-primary" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">AthletiQ</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-white hover:bg-white/10 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-sidebar text-white animate-slide-in-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                  <Activity className="h-5 w-5 text-primary" strokeWidth={2.5} />
                </div>
                <span className="text-lg font-bold tracking-tight">AthletiQ</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-white hover:bg-white/10 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto sidebar-scroll">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
