'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppShell } from '@/components/app-shell';
import { PageHeader, SectionHeading } from '@/components/page-shell';
import { ChartCard, LactateScatterPlot, ModelResponseChart } from '@/components/charts';
import { FeatureSelector } from '@/components/feature-selector';
import { FeatureStatsCard } from '@/components/feature-stats-card';
import { Info, GitCompare, BarChart2, Sparkles } from 'lucide-react';
import {
  FEATURES,
  FEATURE_MAP,
  FEATURE_PAIRS,
  FeatureKey,
} from '@/lib/types';
import { useForm } from '@/lib/form-context';
import {
  getFeatureStats,
  getScatterSeries,
  getAllModelResponseSeries,
  ApiError,
} from '@/lib/api';

type LoadState = 'idle' | 'loading' | 'error' | 'data' | 'unavailable';

const PAIR_DESCRIPTIONS: Record<string, string> = {
  'power-heart_rate':
    'Cardiovascular intensity response: illustrates how measured heart rate tracks mechanical power output across graded cycling stages.',
  'power-vo2':
    'Aerobic demand: demonstrates oxygen uptake progression with increasing cycling workload.',
  'heart_rate-vo2':
    'Cardiorespiratory coupling: shows the strong association between cardiac frequency and metabolic oxygen consumption.',
  'weight-vo2':
    'Anthropometric context: displays mass-normalized oxygen consumption (mL/kg/min) across participant body weights.',
  'age-heart_rate':
    'Chronological spread: shows exercise heart rates measured across various age cohorts.',
};

export default function FeatureExplorerPage() {
  const { inputs } = useForm();
  const [statsState, setStatsState] = useState<LoadState>('idle');
  const [featureStats, setFeatureStats] = useState<
    { key: FeatureKey; name: string; unit: string; min: number; max: number; count: number; mean: number; std: number }[]
  >([]);
  const [scatterState, setScatterState] = useState<LoadState>('idle');
  const [scatterData, setScatterData] = useState<
    Record<string, { x: number; y: number; lactate?: number }[]>
  >({});
  const [compareState, setCompareState] = useState<LoadState>('idle');
  const [compareData, setCompareData] = useState<
    Record<string, { x: number; y: number; lactate?: number }[]>
  >({});
  const [modelRespState, setModelRespState] = useState<LoadState>('idle');
  const [modelRespData, setModelRespData] = useState<
    Record<FeatureKey, { feature_value: number; lactate: number }[]>
  >({} as Record<FeatureKey, { feature_value: number; lactate: number }[]>);

  // Custom comparison selectors
  const [customX, setCustomX] = useState<FeatureKey>('power');
  const [customY, setCustomY] = useState<FeatureKey>('heart_rate');

  const scatterKey = (x: FeatureKey, y: FeatureKey) => `${x}-${y}`;
  const scatterLactateKey = (x: FeatureKey) => `${x}-lactate`;

  // Load feature stats
  useEffect(() => {
    let cancelled = false;
    setStatsState('loading');
    getFeatureStats()
      .then((data) => {
        if (cancelled) return;
        if (!data || data.length === 0) {
          setStatsState('unavailable');
        } else {
          setFeatureStats(data);
          setStatsState('data');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatsState(err instanceof ApiError ? 'unavailable' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load feature-vs-lactate scatters
  useEffect(() => {
    let cancelled = false;
    setScatterState('loading');
    Promise.allSettled(
      FEATURES.map((f) => getScatterSeries(f.key, 'lactate' as FeatureKey))
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, { x: number; y: number; lactate?: number }[]> = {};
      let hasAny = false;
      results.forEach((res, i) => {
        if (res.status === 'fulfilled' && res.value.points.length > 0) {
          next[scatterLactateKey(FEATURES[i].key)] = res.value.points;
          hasAny = true;
        }
      });
      setScatterData(next);
      setScatterState(hasAny ? 'data' : 'unavailable');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load suggested comparison scatters
  useEffect(() => {
    let cancelled = false;
    setCompareState('loading');
    Promise.allSettled(
      FEATURE_PAIRS.map(([x, y]) => getScatterSeries(x, y))
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, { x: number; y: number; lactate?: number }[]> = {};
      let hasAny = false;
      results.forEach((res, i) => {
        const [x, y] = FEATURE_PAIRS[i];
        if (res.status === 'fulfilled' && res.value.points.length > 0) {
          next[scatterKey(x, y)] = res.value.points;
          hasAny = true;
        }
      });
      setCompareData(next);
      setCompareState(hasAny ? 'data' : 'unavailable');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load model response series
  useEffect(() => {
    let cancelled = false;
    setModelRespState('loading');
    getAllModelResponseSeries(inputs)
      .then((data) => {
        if (cancelled) return;
        if (!data || data.length === 0) {
          setModelRespState('unavailable');
          return;
        }
        const next = {} as Record<FeatureKey, { feature_value: number; lactate: number }[]>;
        data.forEach((series) => {
          next[series.feature] = series.points;
        });
        setModelRespData(next);
        setModelRespState('data');
      })
      .catch(() => {
        if (cancelled) return;
        setModelRespState('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [inputs]);

  // Custom comparison data
  const [customState, setCustomState] = useState<LoadState>('idle');
  const [customPoints, setCustomPoints] = useState<
    { x: number; y: number; lactate?: number }[]
  >([]);

  useEffect(() => {
    if (customX === customY) {
      setCustomPoints([]);
      setCustomState('unavailable');
      return;
    }
    let cancelled = false;
    setCustomState('loading');
    getScatterSeries(customX, customY)
      .then((data) => {
        if (cancelled) return;
        if (!data.points || data.points.length === 0) {
          setCustomState('unavailable');
          setCustomPoints([]);
        } else {
          setCustomPoints(data.points);
          setCustomState('data');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCustomState('unavailable');
        setCustomPoints([]);
      });
    return () => {
      cancelled = true;
    };
  }, [customX, customY]);

  return (
    <AppShell>
      <PageHeader
        title="Feature Explorer"
        subtitle="Explore how each of the six measured inputs relates to blood lactate and to each other, using real dataset observations from graded cycling tests."
      />

      {/* A. All-feature overview */}
      <SectionHeading
        title="All-Feature Overview"
        description="Measured distributions and descriptive statistics for each input feature across the verified exercise dataset."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f) => {
          const stat = featureStats.find((s) => s.key === f.key);
          return (
            <FeatureStatsCard
              key={f.key}
              feature={f}
              stats={
                statsState === 'data' && stat
                  ? { min: stat.min, max: stat.max, count: stat.count, mean: stat.mean, std: stat.std }
                  : null
              }
              loading={statsState === 'loading'}
              unavailable={statsState === 'unavailable' || statsState === 'error'}
            />
          );
        })}
      </div>

      {/* B. Six feature-vs-lactate plots */}
      <SectionHeading
        title="Feature vs Measured Blood Lactate"
        description="Six scatter plots showing each input against measured blood lactate from real paired observations. Lower point opacity highlights sample concentrations."
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {FEATURES.map((f) => {
          const data = scatterData[scatterLactateKey(f.key)];
          return (
            <ChartCard
              key={f.key}
              title={`${f.label} vs Blood Lactate`}
              caption={`Real observed data points. ${f.description}`}
              loading={scatterState === 'loading'}
              error={scatterState === 'error' ? 'Could not load observations.' : null}
              unavailable={scatterState === 'unavailable' || !data}
              unavailableMessage="No paired observations available from the backend yet."
              height={400}
            >
              <LactateScatterPlot
                data={data ?? []}
                xLabel={f.label}
                yLabel="Blood Lactate"
                xUnit={f.unit}
                yUnit="mmol/L"
                height={400}
              />
            </ChartCard>
          );
        })}
      </div>

      {/* C. Feature-to-feature comparisons */}
      <SectionHeading
        title="Feature-to-Feature Comparisons"
        description="Paired comparisons revealing key exercise physiology relationships, coloured by measured blood lactate with a genuine mmol/L colour scale."
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {FEATURE_PAIRS.map(([xKey, yKey]) => {
          const xF = FEATURE_MAP[xKey];
          const yF = FEATURE_MAP[yKey];
          const data = compareData[scatterKey(xKey, yKey)];
          const pairKey = `${xKey}-${yKey}`;
          const pairDesc = PAIR_DESCRIPTIONS[pairKey] ?? 'Real paired observations from the dataset.';

          return (
            <ChartCard
              key={scatterKey(xKey, yKey)}
              title={`${xF.label} vs ${yF.label}`}
              caption={pairDesc}
              loading={compareState === 'loading'}
              error={compareState === 'error' ? 'Could not load comparisons.' : null}
              unavailable={compareState === 'unavailable' || !data}
              unavailableMessage="No paired observations available from the backend yet."
              height={440}
            >
              <LactateScatterPlot
                data={data ?? []}
                xLabel={xF.label}
                yLabel={yF.label}
                xUnit={xF.unit}
                yUnit={yF.unit}
                colorByLactate
                height={370}
              />
            </ChartCard>
          );
        })}
      </div>

      {/* Customizable comparison */}
      <SectionHeading
        title="Customizable Comparison"
        description="Select any two features to compare using real paired observations, coloured by measured blood lactate."
      />
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 pt-5 px-6">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <GitCompare className="h-5 w-5 text-primary" />
            Custom Feature Pair Analysis
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Choose two distinct features to inspect their bivariate distribution and lactate concentration.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg p-4 rounded-xl border border-border/80 bg-muted/20">
            <FeatureSelector
              label="X-axis measurement"
              value={customX}
              onChange={setCustomX}
              excludeKey={customY}
              id="custom-x"
            />
            <FeatureSelector
              label="Y-axis measurement"
              value={customY}
              onChange={setCustomY}
              excludeKey={customX}
              id="custom-y"
            />
          </div>

          <ChartCard
            title={`${FEATURE_MAP[customX].label} vs ${FEATURE_MAP[customY].label}`}
            caption={`Real paired observations colored by measured lactate (mmol/L).`}
            loading={customState === 'loading'}
            unavailable={customState === 'unavailable' || customX === customY}
            unavailableMessage={
              customX === customY
                ? 'Select two different features to compare.'
                : 'No paired observations available from the backend yet.'
            }
            height={440}
          >
            <LactateScatterPlot
              data={customPoints}
              xLabel={FEATURE_MAP[customX].label}
              yLabel={FEATURE_MAP[customY].label}
              xUnit={FEATURE_MAP[customX].unit}
              yUnit={FEATURE_MAP[customY].unit}
              colorByLactate
              height={370}
            />
          </ChartCard>
        </CardContent>
      </Card>

      {/* D. Six model-response charts */}
      <SectionHeading
        title="How Each Input Changes the Model's Estimate"
        description="Each chart varies one input across its observed range while holding the other five at the values in the Prediction form. Model response with other inputs held fixed."
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {FEATURES.map((f) => {
          const data = modelRespData[f.key];
          return (
            <ChartCard
              key={f.key}
              title={`Model Response: ${f.label}`}
              caption={`Fitted model output varying ${f.label.toLowerCase()} across measured bounds with the remaining five inputs fixed at form values. Dashed line marks your active input (${inputs[f.key]} ${f.unit}).`}
              loading={modelRespState === 'loading'}
              error={modelRespState === 'error' ? 'Could not load model response.' : null}
              unavailable={modelRespState === 'unavailable' || !data}
              unavailableMessage="Model response data is not yet available from the backend."
              height={390}
            >
              <ModelResponseChart
                data={data ?? []}
                featureLabel={f.label}
                featureUnit={f.unit}
                currentValue={inputs[f.key]}
                height={390}
              />
            </ChartCard>
          );
        })}
      </div>

      {/* E. Interpretation */}
      <Alert className="border-border/80 bg-muted/40 p-4">
        <Info className="h-5 w-5 text-primary shrink-0" />
        <div>
          <AlertTitle className="text-sm font-bold text-foreground">
            Interpretation Guidance
          </AlertTitle>
          <AlertDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground mt-1">
            Scatter plots represent real measured observations from graded exercise laboratory tests. Model-response charts reflect hypothetical predictions from the fitted degree-2 polynomial equation when varying one parameter with others held fixed. Plotted associations do not prove physiological causality, and contextual inputs like age or height are descriptive model covariates rather than prescriptive training metrics.
          </AlertDescription>
        </div>
      </Alert>
    </AppShell>
  );
}
