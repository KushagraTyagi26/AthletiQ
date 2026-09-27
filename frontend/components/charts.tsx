'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  LineChart,
  ComposedChart,
  ReferenceLine,
  ReferenceDot,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, LineChart as LineChartIcon, Activity, Sparkles, SlidersHorizontal } from 'lucide-react';
import { FeatureKey, FEATURES, FEATURE_MAP, PredictionInputs } from '@/lib/types';
import { getModelResponseSeries } from '@/lib/api';

const RED = '#dc2626'; // primary brand red
const BLUE = '#2563eb'; // blue accent
const DARK = '#334155'; // dark slate for references

interface ChartCardProps {
  title: string;
  caption?: string;
  height?: number;
  loading?: boolean;
  error?: string | null;
  unavailable?: boolean;
  unavailableMessage?: string;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  caption,
  height = 400,
  loading,
  error,
  unavailable,
  unavailableMessage = 'Data not yet available from the backend.',
  children,
}: ChartCardProps) {
  return (
    <Card className="w-full border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground">
          {title}
        </CardTitle>
        {caption && (
          <CardDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground mt-1">
            {caption}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {loading ? (
          <Skeleton className="w-full rounded-lg" style={{ height }} />
        ) : error ? (
          <ChartError message={error} height={height} />
        ) : unavailable ? (
          <ChartUnavailable message={unavailableMessage} height={height} />
        ) : (
          <div className="w-full" style={{ minHeight: height }}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartError({ message, height }: { message: string; height: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 text-center p-6"
      style={{ height }}
    >
      <AlertCircle className="h-8 w-8 text-destructive" />
      <div>
        <p className="text-sm font-bold text-destructive">Could not load chart data</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function ChartUnavailable({
  message,
  height,
}: {
  message: string;
  height: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 text-center p-6"
      style={{ height }}
    >
      <LineChartIcon className="h-8 w-8 text-muted-foreground/50" />
      <div>
        <p className="text-sm font-semibold text-muted-foreground">Chart Unavailable</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground/80">{message}</p>
      </div>
    </div>
  );
}

export const axisTickStyle = {
  fill: 'hsl(var(--foreground))',
  fontSize: 12,
  fontWeight: 500 as const,
};

export function lactateColor(value: number): string {
  if (value <= 2.0) return '#2563eb'; // blue
  if (value <= 4.0) return '#0284c7'; // cyan/light blue
  if (value <= 6.0) return '#eab308'; // amber/yellow
  if (value <= 8.0) return '#f97316'; // orange
  if (value <= 10.0) return '#ef4444'; // red
  return '#991b1b'; // deep dark crimson
}

/**
 * Genuine, readable colour scale bar with mmol/L units.
 * Eliminates ambiguous single-dot or overlapping dot legends.
 */
export function LactateColorScaleBar() {
  const brackets = [
    { label: '≤ 2.0', color: '#2563eb', desc: 'Baseline / Aerobic' },
    { label: '2.0 – 4.0', color: '#0284c7', desc: 'Moderate' },
    { label: '4.0 – 6.0', color: '#eab308', desc: 'Heavy / Threshold' },
    { label: '6.0 – 8.0', color: '#f97316', desc: 'Severe' },
    { label: '8.0 – 10.0', color: '#ef4444', desc: 'High Intensity' },
    { label: '> 10.0', color: '#991b1b', desc: 'Maximal' },
  ];

  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-muted/30 px-3.5 py-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-xs font-bold text-foreground tracking-tight">
          Blood Lactate Scale (mmol/L):
        </span>
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
          {brackets.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block h-3.5 w-3.5 rounded-full shrink-0 shadow-sm border border-black/10"
                style={{ backgroundColor: b.color }}
              />
              <span className="tabular-nums font-semibold text-foreground">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ScatterPlotProps {
  data: { x: number; y: number; lactate?: number }[];
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  colorByLactate?: boolean;
  height?: number;
  domainX?: [number | string, number | string];
  domainY?: [number | string, number | string];
}

export function LactateScatterPlot({
  data,
  xLabel,
  yLabel,
  xUnit,
  yUnit,
  colorByLactate = false,
  height = 380,
  domainX,
  domainY,
}: ScatterPlotProps) {
  const formattedData = useMemo(
    () => data.map((d) => ({ ...d, lactate: d.lactate ?? 0 })),
    [data]
  );

  return (
    <div className="flex flex-col w-full">
      <div style={{ height, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 55, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.7} />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              tick={axisTickStyle}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              domain={domainX ?? ['auto', 'auto']}
              label={{
                value: xUnit ? `${xLabel} (${xUnit})` : xLabel,
                position: 'insideBottom',
                offset: -12,
                style: {
                  fill: 'hsl(var(--foreground))',
                  fontSize: 13,
                  fontWeight: 600,
                  textAnchor: 'middle',
                },
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              tick={axisTickStyle}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              domain={domainY ?? ['auto', 'auto']}
              label={{
                value: yUnit ? `${yLabel} (${yUnit})` : yLabel,
                angle: -90,
                position: 'insideLeft',
                offset: -45,
                style: {
                  fill: 'hsl(var(--foreground))',
                  fontSize: 13,
                  fontWeight: 600,
                  textAnchor: 'middle',
                },
              }}
            />
            {colorByLactate && <ZAxis type="number" dataKey="lactate" range={[35, 35]} />}
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--muted-foreground))' }}
              content={
                <ScatterTooltip
                  xLabel={xLabel}
                  yLabel={yLabel}
                  xUnit={xUnit}
                  yUnit={yUnit}
                  showLactate={colorByLactate}
                />
              }
            />
            <Scatter
              data={formattedData}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const fill = colorByLactate ? lactateColor(payload?.lactate ?? 0) : RED;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={2.8}
                    fill={fill}
                    fillOpacity={colorByLactate ? 0.65 : 0.45}
                    stroke="none"
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {colorByLactate && <LactateColorScaleBar />}
    </div>
  );
}

interface ScatterTooltipProps {
  active?: boolean;
  payload?: any[];
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  showLactate?: boolean;
}

function ScatterTooltip({
  active,
  payload,
  xLabel,
  yLabel,
  xUnit,
  yUnit,
  showLactate,
}: ScatterTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload as { x: number; y: number; lactate?: number } | undefined;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur-sm space-y-1">
      <div className="font-semibold text-foreground flex items-center justify-between gap-4">
        <span>{xLabel}:</span>
        <span className="font-bold tabular-nums text-primary">
          {point.x?.toFixed(1)} {xUnit}
        </span>
      </div>
      <div className="font-semibold text-foreground flex items-center justify-between gap-4">
        <span>{yLabel}:</span>
        <span className="font-bold tabular-nums text-foreground">
          {point.y?.toFixed(1)} {yUnit}
        </span>
      </div>
      {showLactate && point.lactate !== undefined && (
        <div className="pt-1 mt-1 border-t border-border flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Measured Lactate:</span>
          <span className="font-bold tabular-nums" style={{ color: lactateColor(point.lactate) }}>
            {point.lactate.toFixed(2)} mmol/L
          </span>
        </div>
      )}
    </div>
  );
}

interface ModelResponseChartProps {
  data: { feature_value: number; lactate: number }[];
  featureLabel: string;
  featureUnit: string;
  currentValue?: number;
  height?: number;
}

export function ModelResponseChart({
  data,
  featureLabel,
  featureUnit,
  currentValue,
  height = 360,
}: ModelResponseChartProps) {
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 25, right: 30, bottom: 55, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.7} />
          <XAxis
            type="number"
            dataKey="feature_value"
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            domain={['auto', 'auto']}
            label={{
              value: `${featureLabel} (${featureUnit})`,
              position: 'insideBottom',
              offset: -12,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <YAxis
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Predicted blood lactate (mmol/L)',
              angle: -90,
              position: 'insideLeft',
              offset: -45,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <Tooltip
            content={<ModelResponseTooltip featureLabel={featureLabel} featureUnit={featureUnit} />}
          />
          {currentValue !== undefined && (
            <ReferenceLine
              x={currentValue}
              stroke={BLUE}
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `Current (${currentValue})`,
                fontSize: 11,
                fill: BLUE,
                fontWeight: 600,
                position: 'top',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="lactate"
            stroke={RED}
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ModelResponseTooltip({
  active,
  payload,
  featureLabel,
  featureUnit,
}: {
  active?: boolean;
  payload?: any[];
  featureLabel: string;
  featureUnit: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload as { feature_value: number; lactate: number } | undefined;
  if (!p) return null;

  return (
    <div className="rounded-xl border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur-sm space-y-1">
      <div className="font-semibold text-foreground flex items-center justify-between gap-4">
        <span>{featureLabel}:</span>
        <span className="font-bold tabular-nums text-foreground">
          {p.feature_value.toFixed(1)} {featureUnit}
        </span>
      </div>
      <div className="font-semibold text-foreground flex items-center justify-between gap-4 pt-1 border-t border-border">
        <span>Predicted Lactate:</span>
        <span className="font-bold tabular-nums text-primary text-sm">
          {p.lactate.toFixed(2)} mmol/L
        </span>
      </div>
    </div>
  );
}

/**
 * Dedicated, large interactive chart for the Prediction page.
 * Uses POST /api/model-response/{feature} to illustrate how the model responds
 * as one feature changes across its measured range while the other five remain fixed.
 */
export function PredictionModelResponseSection({
  inputs,
  currentPrediction,
}: {
  inputs: PredictionInputs;
  currentPrediction: number | null;
}) {
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey>('power');
  const [seriesData, setSeriesData] = useState<{ feature_value: number; lactate: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const featureInfo = FEATURE_MAP[selectedFeature];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getModelResponseSeries(selectedFeature, inputs)
      .then((res) => {
        if (cancelled) return;
        setSeriesData(res.points);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not fetch model response curve.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedFeature, inputs]);

  const currentInputValue = inputs[selectedFeature];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 pt-5 px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                Model Sensitivity Across Measured Range
              </CardTitle>
            </div>
            <CardDescription className="text-sm mt-1 text-muted-foreground">
              Explore how the model predicts blood lactate as one input changes while holding the other five fixed.
            </CardDescription>
          </div>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary self-start sm:self-auto">
            Degree-2 Polynomial Response
          </span>
        </div>

        {/* Feature Selector Tabs */}
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Select input feature to vary:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {FEATURES.map((f) => {
              const isSelected = f.key === selectedFeature;
              const val = inputs[f.key];
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setSelectedFeature(f.key)}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm text-foreground'
                      : 'border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="text-xs font-bold leading-tight flex items-center justify-between w-full">
                    <span>{f.shortLabel}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{f.unit}</span>
                  </span>
                  <span className="text-xs font-medium tabular-nums mt-1 text-foreground">
                    {val} <span className="text-[10px] text-muted-foreground font-normal">{f.unit}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {/* Prominent Context Callout */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            <span className="font-semibold text-foreground">
              Model response with the other five inputs held fixed.
            </span>
          </div>
          <span className="text-muted-foreground/90">
            Varying {featureInfo.label} across observed dataset range ({featureInfo.unit})
          </span>
        </div>

        {/* Chart Area */}
        <div className="h-[380px] w-full">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/10">
              <Skeleton className="h-4/5 w-11/12 rounded-lg" />
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 text-center p-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm font-semibold text-destructive">Could not calculate model response</p>
              <p className="max-w-md text-xs text-muted-foreground">{error}</p>
            </div>
          ) : seriesData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-center p-6">
              <p className="text-sm font-medium text-muted-foreground">No model response data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={seriesData} margin={{ top: 25, right: 35, bottom: 55, left: 65 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.7} />
                <XAxis
                  type="number"
                  dataKey="feature_value"
                  tick={axisTickStyle}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  domain={['dataMin', 'dataMax']}
                  label={{
                    value: `${featureInfo.label} (${featureInfo.unit})`,
                    position: 'insideBottom',
                    offset: -12,
                    style: {
                      fill: 'hsl(var(--foreground))',
                      fontSize: 13,
                      fontWeight: 600,
                      textAnchor: 'middle',
                    },
                  }}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  domain={['auto', 'auto']}
                  label={{
                    value: 'Predicted blood lactate (mmol/L)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: -45,
                    style: {
                      fill: 'hsl(var(--foreground))',
                      fontSize: 13,
                      fontWeight: 600,
                      textAnchor: 'middle',
                    },
                  }}
                />
                <Tooltip
                  content={
                    <PredictionResponseTooltip
                      feature={featureInfo}
                      currentValue={currentInputValue}
                    />
                  }
                />
                {/* Vertical marker for current input */}
                <ReferenceLine
                  x={currentInputValue}
                  stroke={BLUE}
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Current: ${currentInputValue} ${featureInfo.unit}`,
                    fill: BLUE,
                    fontSize: 12,
                    fontWeight: 700,
                    position: 'top',
                  }}
                />
                {/* Marker for current prediction point if calculated */}
                {currentPrediction !== null && (
                  <ReferenceDot
                    x={currentInputValue}
                    y={currentPrediction}
                    r={6.5}
                    fill={RED}
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    label={{
                      value: `${currentPrediction.toFixed(2)} mmol/L`,
                      fill: RED,
                      fontSize: 12,
                      fontWeight: 700,
                      position: 'top',
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="lactate"
                  name="Model Response"
                  stroke={RED}
                  strokeWidth={3.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Scientific Context Disclaimer */}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Note:</span> This chart demonstrates hypothetical model output under isolated variation of {featureInfo.label.toLowerCase()} across its measured dataset range, while the other five inputs are held constant at your form values. It reflects the mathematical response surface of the degree-2 polynomial model and does not imply that changing an input causes blood lactate to change physiologically.
        </p>
      </CardContent>
    </Card>
  );
}

function PredictionResponseTooltip({
  active,
  payload,
  feature,
  currentValue,
}: {
  active?: boolean;
  payload?: any[];
  feature: typeof FEATURES[number];
  currentValue: number;
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload as { feature_value: number; lactate: number } | undefined;
  if (!p) return null;

  const isNearCurrent = Math.abs(p.feature_value - currentValue) < 0.01;

  return (
    <div className="rounded-xl border border-border bg-card/95 p-3.5 text-xs shadow-xl backdrop-blur-sm space-y-1.5 min-w-[200px]">
      <div className="flex items-center justify-between gap-4 font-semibold text-foreground">
        <span>{feature.label}:</span>
        <span className="tabular-nums font-bold text-foreground">
          {p.feature_value.toFixed(feature.key === 'height' ? 2 : feature.key === 'power' || feature.key === 'heart_rate' ? 0 : 1)} {feature.unit}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 font-semibold pt-1 border-t border-border">
        <span>Predicted Lactate:</span>
        <span className="text-sm font-black tabular-nums text-primary">
          {p.lactate.toFixed(2)} mmol/L
        </span>
      </div>
      {isNearCurrent && (
        <div className="pt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
          • Matches your current input
        </div>
      )}
    </div>
  );
}

/**
 * Dedicated Bar Chart for Data Insights Power Bins.
 * Fulfills requirement: Mean measured lactate: [value] mmol/L, power range, observation count.
 */
export function PowerBinBarChart({
  data,
  height = 380,
}: {
  data: {
    bin_label: string;
    bin_min: number;
    bin_max: number;
    count: number;
    mean_lactate: number;
    std_lactate: number;
  }[];
  height?: number;
}) {
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 25, right: 30, bottom: 55, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.7} />
          <XAxis
            dataKey="bin_label"
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Cycling Power Bin',
              position: 'insideBottom',
              offset: -12,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <YAxis
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Mean Measured Lactate (mmol/L)',
              angle: -90,
              position: 'insideLeft',
              offset: -45,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <Tooltip content={<PowerBinTooltip />} />
          <Bar dataKey="mean_lactate" fill={RED} radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PowerBinTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload as {
    bin_label: string;
    bin_min: number;
    bin_max: number;
    count: number;
    mean_lactate: number;
    std_lactate: number;
  };
  if (!p) return null;

  return (
    <div className="rounded-xl border border-border bg-card/95 p-3.5 text-xs shadow-xl backdrop-blur-sm space-y-1.5 min-w-[220px]">
      <p className="font-bold text-sm text-foreground pb-1 border-b border-border">
        Power Range: {p.bin_label}
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Mean measured lactate:</span>
        <span className="font-black tabular-nums text-primary text-sm">
          {p.mean_lactate.toFixed(2)} mmol/L
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-muted-foreground">
        <span>Standard deviation:</span>
        <span className="font-medium tabular-nums text-foreground">
          ±{p.std_lactate.toFixed(2)} mmol/L
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-muted-foreground pt-1 border-t border-border/60">
        <span>Measured observations:</span>
        <span className="font-bold tabular-nums text-foreground">
          {p.count.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

/**
 * Dedicated Bar Chart for Data Insights Lactate Distribution.
 * Fulfills requirement: Lactate range, observation count, backend provided values only.
 */
export function LactateDistributionBarChart({
  data,
  height = 380,
}: {
  data: {
    bin_label: string;
    count: number;
    min: number;
    max: number;
  }[];
  height?: number;
}) {
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 25, right: 30, bottom: 55, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.7} />
          <XAxis
            dataKey="bin_label"
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Lactate Concentration Range (mmol/L)',
              position: 'insideBottom',
              offset: -12,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <YAxis
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Observation Count',
              angle: -90,
              position: 'insideLeft',
              offset: -45,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <Tooltip content={<LactateDistTooltip />} />
          <Bar dataKey="count" fill={BLUE} radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LactateDistTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload as {
    bin_label: string;
    count: number;
    min: number;
    max: number;
  };
  if (!p) return null;

  return (
    <div className="rounded-xl border border-border bg-card/95 p-3.5 text-xs shadow-xl backdrop-blur-sm space-y-1.5 min-w-[200px]">
      <p className="font-bold text-sm text-foreground pb-1 border-b border-border">
        Lactate Range: {p.min} – {p.max} mmol/L
      </p>
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-muted-foreground">Observed Count:</span>
        <span className="font-bold tabular-nums text-foreground text-sm">
          {p.count.toLocaleString()} observations
        </span>
      </div>
    </div>
  );
}

interface SimpleBarChartProps {
  data: { label: string; value: number; secondary?: number }[];
  xLabel: string;
  yLabel: string;
  height?: number;
  showSecondary?: boolean;
}

export function SimpleBarChart({
  data,
  xLabel,
  yLabel,
  height = 360,
  showSecondary = false,
}: SimpleBarChartProps) {
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 25, right: 30, bottom: 55, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.7} />
          <XAxis
            dataKey="label"
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: xLabel,
              position: 'insideBottom',
              offset: -12,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <YAxis
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: yLabel,
              angle: -90,
              position: 'insideLeft',
              offset: -45,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--background))',
              fontSize: 12,
            }}
          />
          {showSecondary ? (
            <>
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }} />
              <Bar dataKey="value" name="Watts-only" fill={BLUE} radius={[4, 4, 0, 0]} />
              <Bar dataKey="secondary" name="Six-input" fill={RED} radius={[4, 4, 0, 0]} />
            </>
          ) : (
            <Bar dataKey="value" fill={RED} radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PredVsMeasuredChartProps {
  data: { predicted: number; measured: number }[];
  label: string;
  color?: string;
  height?: number;
}

export function PredictedVsMeasuredChart({
  data,
  label,
  color = RED,
  height = 360,
}: PredVsMeasuredChartProps) {
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.predicted, d.measured)),
    0
  );
  const identityLine = [
    { predicted: 0, measured: 0 },
    { predicted: maxVal * 1.05, measured: maxVal * 1.05 },
  ];

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 25, right: 30, bottom: 55, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.7} />
          <XAxis
            type="number"
            dataKey="measured"
            name="Measured"
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            domain={[0, maxVal * 1.05]}
            label={{
              value: 'Measured Lactate (mmol/L)',
              position: 'insideBottom',
              offset: -12,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <YAxis
            type="number"
            dataKey="predicted"
            name="Predicted"
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            domain={[0, maxVal * 1.05]}
            label={{
              value: 'Predicted Lactate (mmol/L)',
              angle: -90,
              position: 'insideLeft',
              offset: -45,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<PredVsMeasuredTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
          <Scatter
            name={label}
            data={data}
            fill={color}
            shape={(props: any) => (
              <circle cx={props.cx} cy={props.cy} r={2.8} fill={color} fillOpacity={0.6} />
            )}
          />
          <Scatter
            name="Ideal (y = x)"
            data={identityLine}
            fill={DARK}
            line={{ stroke: DARK, strokeWidth: 2 }}
            shape={() => <></>}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function PredVsMeasuredTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload as { predicted: number; measured: number } | undefined;
  if (!p) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur-sm space-y-1">
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">Measured:</span>
        <span className="font-bold tabular-nums text-foreground">{p.measured.toFixed(2)} mmol/L</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">Predicted:</span>
        <span className="font-bold tabular-nums text-primary">{p.predicted.toFixed(2)} mmol/L</span>
      </div>
    </div>
  );
}

interface ResidualChartProps {
  data: { predicted: number; residual: number }[];
  label: string;
  color?: string;
  height?: number;
}

export function ResidualChart({
  data,
  label,
  color = RED,
  height = 360,
}: ResidualChartProps) {
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 25, right: 30, bottom: 55, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.7} />
          <XAxis
            type="number"
            dataKey="predicted"
            name="Predicted"
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            domain={['auto', 'auto']}
            label={{
              value: 'Predicted Lactate (mmol/L)',
              position: 'insideBottom',
              offset: -12,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <YAxis
            type="number"
            dataKey="residual"
            name="Residual"
            tick={axisTickStyle}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            domain={['auto', 'auto']}
            label={{
              value: 'Residual (mmol/L)',
              angle: -90,
              position: 'insideLeft',
              offset: -45,
              style: {
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 600,
                textAnchor: 'middle',
              },
            }}
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ResidualTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
          <ReferenceLine y={0} stroke={DARK} strokeWidth={1.5} />
          <Scatter
            name={label}
            data={data}
            fill={color}
            shape={(props: any) => (
              <circle cx={props.cx} cy={props.cy} r={2.8} fill={color} fillOpacity={0.6} />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function ResidualTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload as { predicted: number; residual: number } | undefined;
  if (!p) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur-sm space-y-1">
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">Predicted:</span>
        <span className="font-bold tabular-nums text-foreground">{p.predicted.toFixed(2)} mmol/L</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">Residual:</span>
        <span className="font-bold tabular-nums text-primary">{p.residual.toFixed(2)} mmol/L</span>
      </div>
    </div>
  );
}
