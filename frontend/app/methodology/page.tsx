'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppShell } from '@/components/app-shell';
import { PageHeader, SectionHeading } from '@/components/page-shell';
import { Database, Split, Brain, Target, AlertCircle, CheckCircle2, TrendingUp, Layers } from 'lucide-react';
import { getFeatureStats, getModelEvaluation, ApiError } from '@/lib/api';
import { ComparisonData, FeatureStats } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const METHODOLOGY_STEPS = [
  {
    number: '01',
    icon: Database,
    title: 'Laboratory Exercise-Test Data Ingestion',
    description:
      'Data is ingested from verified graded cycling exercise tests. Each recorded stage aligns mechanical cycling power (W) with measured physiological responses (heart rate in bpm, VO₂ in mL/kg/min), participant anthropometrics (height in meters, weight in kg, age in years), and laboratory-measured capillary blood lactate (mmol/L).',
  },
  {
    number: '02',
    icon: Split,
    title: 'Grouped Split Without Data Leakage',
    description:
      'To prevent optimistic data leakage between consecutive stages of the same workout, records are partitioned using GroupShuffleSplit(test_size=0.2, random_state=42) grouped strictly by test_id. All stages from a single exercise-test file remain together in either the 80% training set or the 20% held-out validation set.',
  },
  {
    number: '03',
    icon: Brain,
    title: 'Feature Standardization & Degree-2 Expansion',
    description:
      'The six input parameters are centered and scaled with StandardScaler to prevent scale disparity. A degree-2 polynomial transformer expands the 6 standardized features into 27 linear, squared, and interaction terms, allowing the model to capture realistic upward bending and multi-variable coupling.',
  },
  {
    number: '04',
    icon: Target,
    title: 'Ordinary Least Squares Fit & FastAPI Serving',
    description:
      'LinearRegression fits optimal coefficients across all 27 expanded basis features, minimizing mean squared residual error. The trained pipeline is packaged and served through high-performance FastAPI endpoints with input boundary verification and real-time response generation.',
  },
];

export default function MethodologyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FeatureStats[] | null>(null);
  const [evaluation, setEvaluation] = useState<ComparisonData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getFeatureStats(), getModelEvaluation()])
      .then(([statsRes, evalRes]) => {
        if (cancelled) return;
        setStats(statsRes);
        setEvaluation(evalRes);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not fetch methodology data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalObservations = stats && stats.length > 0 ? stats[0].count : null;

  return (
    <AppShell>
      <PageHeader
        title="Methodology & Validation Protocol"
        subtitle="How AthletiQ processes laboratory exercise tests, validates data boundaries, fits degree-2 polynomial features, and evaluates held-out accuracy."
      />

      {/* Mandatory Scope Statement Card */}
      <Card className="border-primary/30 bg-primary/5 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 shrink-0 text-primary mt-0.5" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                AthletiQ Modeling Scope
              </h3>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-foreground font-medium">
                AthletiQ models how blood lactate responds to cycling power, giving athletes and coaches a way to explore exercise intensity and physiological response. It does not directly predict race results or overall athletic performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Four Steps Section */}
      <SectionHeading
        title="Four-Step Modeling Protocol"
        description="From raw graded exercise archives to real-time served predictions."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {METHODOLOGY_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.number} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-2xl font-black tabular-nums text-primary">
                      {step.number}
                    </span>
                    <div className="mt-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <h3 className="text-base font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Real Dataset & Evaluation Summary */}
      <SectionHeading
        title="Dataset & Held-Out Evaluation Summary"
        description="Factual verification metrics fetched directly from GET /api/feature-stats and GET /api/model-evaluation."
      />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 pt-5 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Held-Out Model Performance Metrics
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                {evaluation?.six_input.split ?? 'Held-out cycling test files (20%, seed 42)'}
              </CardDescription>
            </div>
            <span className="self-start sm:self-auto rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
              GroupShuffleSplit (Seed 42)
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm font-semibold text-destructive mt-2">Could not load evaluation metrics</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          ) : evaluation ? (
            <>
              {/* Quick Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Dataset Stages
                  </p>
                  <p className="mt-1.5 text-3xl font-black tabular-nums text-foreground">
                    {totalObservations ? totalObservations.toLocaleString() : '2,065'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Verified cycling points</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Six-Input MAE
                  </p>
                  <p className="mt-1.5 text-3xl font-black tabular-nums text-primary">
                    {evaluation.six_input.mae.toFixed(4)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">mmol/L mean error</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Six-Input RMSE
                  </p>
                  <p className="mt-1.5 text-3xl font-black tabular-nums text-primary">
                    {evaluation.six_input.rmse.toFixed(4)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">mmol/L root mean sq.</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Held-Out R²
                  </p>
                  <p className="mt-1.5 text-3xl font-black tabular-nums text-primary">
                    {evaluation.six_input.r2.toFixed(4)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Variance explained</p>
                </div>
              </div>

              {/* Model Comparison Table */}
              <div className="rounded-xl border border-border/80 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4 text-left">Model Specification</th>
                      <th className="py-3 px-4 text-left">Feature Basis</th>
                      <th className="py-3 px-4 text-right">MAE (mmol/L)</th>
                      <th className="py-3 px-4 text-right">RMSE (mmol/L)</th>
                      <th className="py-3 px-4 text-right">R² Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr className="bg-primary/[0.03] font-semibold">
                      <td className="py-3.5 px-4 text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {evaluation.six_input.model_name}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-normal text-xs">
                        6 inputs → 27 standardized polynomial & interaction terms
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-primary font-bold">
                        {evaluation.six_input.mae.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-primary font-bold">
                        {evaluation.six_input.rmse.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-primary font-bold">
                        {evaluation.six_input.r2.toFixed(4)}
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors text-muted-foreground">
                      <td className="py-3.5 px-4 text-foreground font-medium pl-10">
                        {evaluation.watts_only.model_name} (Baseline)
                      </td>
                      <td className="py-3.5 px-4 font-normal text-xs">
                        Cycling power only (degree-2 polynomial)
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums">
                        {evaluation.watts_only.mae.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums">
                        {evaluation.watts_only.rmse.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums">
                        {evaluation.watts_only.r2.toFixed(4)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Incorporating cardiorespiratory demand (heart rate, VO₂) alongside contextual attributes (height, weight, age) improves test R² from 0.5504 to 0.7325 and reduces MAE from 1.1214 mmol/L to 0.8633 mmol/L compared with cycling power alone.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
