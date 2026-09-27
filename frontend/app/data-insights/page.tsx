'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppShell } from '@/components/app-shell';
import { PageHeader, SectionHeading } from '@/components/page-shell';
import { ChartCard, PowerBinBarChart, LactateDistributionBarChart } from '@/components/charts';
import { Info, Database, BarChart3, TrendingUp, Layers } from 'lucide-react';
import { getDataInsights, ApiError } from '@/lib/api';
import { DataInsights } from '@/lib/types';

type LoadState = 'loading' | 'error' | 'data' | 'unavailable';

export default function DataInsightsPage() {
  const [state, setState] = useState<LoadState>('loading');
  const [data, setData] = useState<DataInsights | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    getDataInsights()
      .then((result) => {
        if (cancelled) return;
        if (!result || (!result.power_bins?.length && !result.lactate_distribution?.length)) {
          setState('unavailable');
        } else {
          setData(result);
          setState('data');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setState(err instanceof ApiError ? 'unavailable' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Dataset Insights & Distributions"
        subtitle="Empirical distributions, power-bin summaries, and observed feature metrics derived directly from the laboratory exercise test dataset."
      />

      <Alert className="border-border/80 bg-muted/30">
        <Info className="h-5 w-5 text-primary shrink-0" />
        <div>
          <AlertTitle className="text-sm font-bold text-foreground">
            Strict Real-Data Verification
          </AlertTitle>
          <AlertDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground mt-1">
            All data points, bin summaries, and distributions shown on this page are computed directly by the FastAPI backend from real laboratory exercise-test records. No synthetic values or hardcoded estimates are rendered.
          </AlertDescription>
        </div>
      </Alert>

      {/* Section 1: Power-Bin Lactate Summaries */}
      <SectionHeading
        title="Power-Bin Lactate Summaries"
        description="Mean measured blood lactate grouped into 50 W power bins. Visualizes the empirical progression of lactate concentration with increasing mechanical workload."
      />
      <ChartCard
        title="Mean Blood Lactate by Cycling Power Bin"
        caption="Bars show the mean blood lactate (mmol/L) observed across stages within each 50 W power interval. Hover to view exact counts, ranges, and standard deviations."
        loading={state === 'loading'}
        error={state === 'error' ? 'Could not load power-bin summaries.' : null}
        unavailable={state === 'unavailable' || !data?.power_bins?.length}
        unavailableMessage="Power-bin summaries are not yet available from the backend."
        height={400}
      >
        <PowerBinBarChart
          data={data?.power_bins ?? []}
          height={400}
        />
      </ChartCard>

      {/* Section 2: Lactate Distribution */}
      <SectionHeading
        title="Blood Lactate Distribution"
        description="Histogram of measured blood lactate observations binned into 2 mmol/L intervals, revealing the frequency distribution across all exercise stages."
      />
      <ChartCard
        title="Measured Blood Lactate Frequency Distribution"
        caption="Each bar displays the total number of measured exercise-test stages within each 2 mmol/L concentration interval."
        loading={state === 'loading'}
        error={state === 'error' ? 'Could not load lactate distribution.' : null}
        unavailable={state === 'unavailable' || !data?.lactate_distribution?.length}
        unavailableMessage="Lactate distribution data is not yet available from the backend."
        height={400}
      >
        <LactateDistributionBarChart
          data={data?.lactate_distribution ?? []}
          height={400}
        />
      </ChartCard>

      {/* Section 3: Observed Feature Ranges */}
      <SectionHeading
        title="Observed Feature Ranges & Metrics"
        description="Statistical summary of all six model input features across the complete dataset of verified cycling tests."
      />
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 pt-5 px-6">
          <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-foreground">
            <Database className="h-5 w-5 text-primary" />
            Verified Input Feature Statistics
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Empirical minimums, maximums, means, and standard deviations used for model training and input bounds validation.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {state === 'loading' ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : state === 'unavailable' || !data?.feature_ranges?.length ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
              <Database className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                Feature range statistics are not yet available from the backend.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground font-semibold">
                    <th className="py-3 pr-4 text-left">Input Feature</th>
                    <th className="py-3 px-4 text-right">Unit</th>
                    <th className="py-3 px-4 text-right">Measured Min</th>
                    <th className="py-3 px-4 text-right">Measured Max</th>
                    <th className="py-3 px-4 text-right">Sample Mean</th>
                    <th className="py-3 px-4 text-right">Std Dev (±)</th>
                    <th className="py-3 pl-4 text-right">Valid Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.feature_ranges.map((f) => (
                    <tr key={f.key} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 pr-4 font-bold text-foreground flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary/70" />
                        {f.name}
                      </td>
                      <td className="py-3.5 px-4 text-right text-muted-foreground font-medium">
                        {f.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-foreground">
                        {f.min.toFixed(f.unit === 'm' ? 2 : f.key === 'power' || f.key === 'heart_rate' ? 0 : 2)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-foreground">
                        {f.max.toFixed(f.unit === 'm' ? 2 : f.key === 'power' || f.key === 'heart_rate' ? 0 : 2)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-foreground">
                        {f.mean.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-muted-foreground">
                        ±{f.std.toFixed(2)}
                      </td>
                      <td className="py-3.5 pl-4 text-right tabular-nums font-bold text-primary">
                        {f.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
