'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-shell';
import { PredictionForm } from '@/components/prediction-form';
import { PredictionModelResponseSection } from '@/components/charts';
import { FEATURES, FeatureStats } from '@/lib/types';
import { useForm } from '@/lib/form-context';
import { predictSixInput, getFeatureStats } from '@/lib/api';

export default function PredictionPage() {
  const { inputs } = useForm();

  const [loading, setLoading] = useState(false);
  const [lactate, setLactate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [featureStats, setFeatureStats] = useState<FeatureStats[] | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch real observed feature stats from backend
  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);

    getFeatureStats()
      .then((data) => {
        if (!cancelled) setFeatureStats(data);
      })
      .catch(() => {
        if (!cancelled) setFeatureStats(null);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePredict() {
    setLoading(true);
    setError(null);

    try {
      const response = await predictSixInput(inputs);

      if (
        typeof response.lactate !== 'number' ||
        !Number.isFinite(response.lactate)
      ) {
        throw new Error('The API returned an invalid prediction.');
      }

      setLactate(response.lactate);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not get a prediction from FastAPI.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Six-Input Blood Lactate Estimation"
        subtitle="Enter six measured physiological and contextual inputs to estimate blood lactate using a degree-2 polynomial regression model trained on real graded cycling exercise tests."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Column: Six-Input Form (5 cols on xl) */}
        <div className="xl:col-span-5 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Six-Input Prediction Form
                </CardTitle>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  All 6 Required
                </span>
              </div>
              <CardDescription className="text-sm mt-1 text-muted-foreground">
                Sliders and validation bounds are dynamically set from measured dataset ranges.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 pb-5">
              <PredictionForm
                onPredict={handlePredict}
                loading={loading}
                featureStats={featureStats}
                statsLoading={statsLoading}
              />
            </CardContent>
          </Card>

          {/* Current Input Summary */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Active Input Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FEATURES.map((feature) => (
                  <div
                    key={feature.key}
                    className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {feature.shortLabel}
                    </p>
                    <p className="text-sm font-black tabular-nums text-foreground mt-0.5">
                      {inputs[feature.key]}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        {feature.unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Result Card & Large Response Chart (7 cols on xl) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Prominent Estimated Blood Lactate Card */}
          <Card className="border-primary/30 shadow-md bg-gradient-to-br from-card via-card to-primary/[0.02]">
            <CardHeader className="pb-2 pt-5 px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                    <Activity className="h-5 w-5" />
                  </div>
                  Estimated Blood Lactate
                </CardTitle>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                  Degree-2 Polynomial Model
                </span>
              </div>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Dataset-level estimate calculated via FastAPI from your six entered measurements.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-2">
              {loading && (
                <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-primary/20 bg-primary/5">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="mt-3 text-base font-semibold text-foreground">
                    Calculating degree-2 polynomial estimate…
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Standardizing features and evaluating model response
                  </p>
                </div>
              )}

              {!loading && error && (
                <div className="flex gap-3.5 rounded-xl border border-destructive/40 bg-destructive/10 p-5">
                  <AlertTriangle className="h-6 w-6 shrink-0 text-destructive mt-0.5" />
                  <div>
                    <p className="font-bold text-base text-destructive">
                      Prediction Rejected by Model Backend
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {error}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Ensure your input values fall strictly within the measured dataset ranges indicated on each field card.
                    </p>
                  </div>
                </div>
              )}

              {!loading && !error && lactate !== null && (
                <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-7 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-primary/10 blur-xl pointer-events-none" />
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Estimated Concentration
                  </p>
                  <div className="mt-2 flex items-baseline justify-center gap-2">
                    <span className="text-6xl sm:text-7xl font-black tabular-nums tracking-tight text-primary drop-shadow-xs">
                      {lactate.toFixed(3)}
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      mmol/L
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Degree-2 Polynomial Regression • 6 Input Features</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground max-w-lg mx-auto">
                    This is a dataset-level estimate derived from measured cycling exercise-test data, not a direct clinical blood test or individualized athletic performance prediction.
                  </p>
                </div>
              )}

              {!loading && !error && lactate === null && (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 py-10 px-6 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground/30 stroke-1" />
                  <p className="mt-3 text-base font-bold text-foreground">
                    Ready to Generate Prediction
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    Configure your six measurements on the left and click &ldquo;Predict Blood Lactate&rdquo; to compute your estimate.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Large Model-Response Chart Explaining CURRENT Six-Input Prediction */}
          <PredictionModelResponseSection
            inputs={inputs}
            currentPrediction={lactate}
          />
        </div>
      </div>
    </AppShell>
  );
}
