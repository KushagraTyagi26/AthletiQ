'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FeatureInfo } from '@/lib/types';
import { ArrowDownToLine, Maximize, Hash, BarChart2 } from 'lucide-react';

interface FeatureStatsCardProps {
  feature: FeatureInfo;
  stats: {
    min: number;
    max: number;
    count: number;
    mean: number;
    std: number;
  } | null;
  loading: boolean;
  unavailable: boolean;
}

function formatStat(key: string, val: number): string {
  if (key === 'power' || key === 'heart_rate') return val.toFixed(0);
  if (key === 'height') return val.toFixed(2);
  if (key === 'vo2' || key === 'weight') return val.toFixed(1);
  return val.toFixed(2);
}

export function FeatureStatsCard({
  feature,
  stats,
  loading,
  unavailable,
}: FeatureStatsCardProps) {
  return (
    <Card className="border-border/80 shadow-xs hover:border-border transition-all">
      <CardContent className="pt-5 pb-5 px-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">{feature.label}</h3>
            <p className="text-xs font-medium text-muted-foreground">{feature.unit}</p>
          </div>
          <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            {feature.shortLabel}
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : unavailable ? (
            <p className="py-3 text-center text-xs text-muted-foreground italic">
              Measured stats unavailable
            </p>
          ) : stats ? (
            <>
              <StatRow
                icon={<ArrowDownToLine className="h-4 w-4 text-primary" />}
                label="Measured Min"
                value={formatStat(feature.key, stats.min)}
                unit={feature.unit}
              />
              <StatRow
                icon={<Maximize className="h-4 w-4 text-primary" />}
                label="Measured Max"
                value={formatStat(feature.key, stats.max)}
                unit={feature.unit}
              />
              <StatRow
                icon={<BarChart2 className="h-4 w-4 text-muted-foreground" />}
                label="Sample Mean"
                value={stats.mean.toFixed(2)}
                unit={feature.unit}
              />
              <StatRow
                icon={<Hash className="h-4 w-4 text-muted-foreground" />}
                label="Valid Stages"
                value={stats.count.toLocaleString()}
                unit=""
              />
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs sm:text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
        {icon}
        {label}
      </span>
      <span className="font-bold tabular-nums text-foreground">
        {value}
        {unit && <span className="font-normal text-muted-foreground ml-1 text-xs">{unit}</span>}
      </span>
    </div>
  );
}
