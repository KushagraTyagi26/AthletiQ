'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';
import { FEATURES, FeatureInfo, FeatureKey, FeatureStats } from '@/lib/types';
import { useForm } from '@/lib/form-context';
import { cn } from '@/lib/utils';

export function formatFeatureBound(key: FeatureKey, val: number, isMin: boolean): string {
  switch (key) {
    case 'power':
    case 'heart_rate':
      return val.toFixed(0);
    case 'vo2':
      return val.toFixed(1);
    case 'height':
      return val.toFixed(2);
    case 'weight':
      return Number.isInteger(val) ? val.toFixed(0) : val.toFixed(1);
    case 'age':
      // Do not round min upward or max downward in a way that excludes valid observations
      return isMin
        ? (Math.floor(val * 100) / 100).toFixed(2)
        : (Math.ceil(val * 100) / 100).toFixed(2);
    default:
      return val.toString();
  }
}

export function PredictionForm({
  onPredict,
  loading,
  featureStats,
  statsLoading,
}: {
  onPredict: () => void;
  loading: boolean;
  featureStats?: FeatureStats[] | null;
  statsLoading?: boolean;
}) {
  const { inputs, updateInput, resetInputs } = useForm();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const hasAnyErrors = Object.values(fieldErrors).some((err) => !!err);

  const handlePredictClick = () => {
    // Re-validate all fields against measured stats if available
    if (featureStats && featureStats.length > 0) {
      const newErrors: Record<string, string | null> = {};
      let hasError = false;

      FEATURES.forEach((f) => {
        const val = inputs[f.key];
        const stat = featureStats.find((s) => s.key === f.key);
        if (stat) {
          if (val < stat.min) {
            newErrors[f.key] = `Below measured minimum of ${formatFeatureBound(f.key, stat.min, true)} ${f.unit}`;
            hasError = true;
          } else if (val > stat.max) {
            newErrors[f.key] = `Above measured maximum of ${formatFeatureBound(f.key, stat.max, false)} ${f.unit}`;
            hasError = true;
          }
        }
      });

      if (hasError) {
        setFieldErrors(newErrors);
        return;
      }
    }

    onPredict();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {FEATURES.map((feature) => {
          const stat = featureStats?.find((s) => s.key === feature.key);
          return (
            <FeatureInput
              key={feature.key}
              feature={feature}
              stat={stat}
              statsLoading={statsLoading}
              value={inputs[feature.key]}
              error={fieldErrors[feature.key] ?? null}
              onErrorChange={(err) =>
                setFieldErrors((prev) => ({ ...prev, [feature.key]: err }))
              }
              onChange={(v) => updateInput(feature.key, v)}
            />
          );
        })}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-3 border-t border-border">
        <Button
          variant="outline"
          onClick={() => {
            resetInputs();
            setFieldErrors({});
          }}
          type="button"
          className="sm:w-auto h-11 px-5 text-sm font-semibold"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Defaults
        </Button>
        <Button
          onClick={handlePredictClick}
          disabled={loading || hasAnyErrors}
          className="sm:flex-1 h-11 text-base font-bold shadow-sm transition-all"
          size="lg"
        >
          {loading ? 'Evaluating Model…' : 'Predict Blood Lactate'}
        </Button>
      </div>
    </div>
  );
}

function FeatureInput({
  feature,
  stat,
  statsLoading,
  value,
  error,
  onErrorChange,
  onChange,
}: {
  feature: FeatureInfo;
  stat?: FeatureStats;
  statsLoading?: boolean;
  value: number;
  error: string | null;
  onErrorChange: (err: string | null) => void;
  onChange: (value: number) => void;
}) {
  // Use actual observed min/max if loaded
  const actualMin = stat ? stat.min : undefined;
  const actualMax = stat ? stat.max : undefined;

  const validate = (raw: string): number | null => {
    const num = parseFloat(raw);
    if (isNaN(num)) {
      onErrorChange('Please enter a valid number');
      return null;
    }

    if (actualMin !== undefined && num < actualMin) {
      onErrorChange(
        `Below measured minimum of ${formatFeatureBound(feature.key, actualMin, true)} ${feature.unit}`
      );
      return num;
    }

    if (actualMax !== undefined && num > actualMax) {
      onErrorChange(
        `Above measured maximum of ${formatFeatureBound(feature.key, actualMax, false)} ${feature.unit}`
      );
      return num;
    }

    onErrorChange(null);
    return num;
  };

  const sliderMin = actualMin ?? feature.min;
  const sliderMax = actualMax ?? feature.max;
  const sliderValue = Math.max(sliderMin, Math.min(sliderMax, value));

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all duration-200 bg-card shadow-xs',
        error
          ? 'border-destructive/60 bg-destructive/5 ring-1 ring-destructive/40'
          : 'border-border/80 hover:border-border'
      )}
    >
      {/* Title & Range Display */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <Label htmlFor={feature.key} className="text-sm font-bold text-foreground block">
            {feature.label}
          </Label>
          <span className="text-[11px] text-muted-foreground">{feature.unit}</span>
        </div>

        {statsLoading ? (
          <span className="text-[11px] font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded animate-pulse">
            Loading range…
          </span>
        ) : stat ? (
          <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded tabular-nums">
            {formatFeatureBound(feature.key, stat.min, true)} – {formatFeatureBound(feature.key, stat.max, false)} {feature.unit}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/60 italic">
            Range unavailable
          </span>
        )}
      </div>

      {/* Numeric Input Field */}
      <div className="relative mt-2">
        <Input
          id={feature.key}
          type="number"
          inputMode="decimal"
          value={value}
          min={actualMin}
          max={actualMax}
          step={feature.step}
          onChange={(e) => {
            const valid = validate(e.target.value);
            if (valid !== null) onChange(valid);
          }}
          className={cn(
            'text-base font-semibold tabular-nums pr-12 h-10',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          aria-describedby={`${feature.key}-desc`}
          aria-invalid={!!error}
        />
        <span className="absolute right-3 top-2.5 text-xs font-semibold text-muted-foreground pointer-events-none">
          {feature.unit}
        </span>
      </div>

      {/* Field Feedback */}
      <div className="min-h-[20px] mt-1.5">
        {error ? (
          <p className="flex items-center gap-1 text-xs font-semibold text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : (
          <p id={`${feature.key}-desc`} className="text-xs text-muted-foreground leading-tight">
            {feature.description}
          </p>
        )}
      </div>

      {/* Slider with exact measured endpoint bounds */}
      <div className="pt-2">
        <Slider
          value={[sliderValue]}
          min={sliderMin}
          max={sliderMax}
          step={feature.step}
          onValueChange={(arr) => {
            const val = arr[0];
            onChange(val);
            if (actualMin !== undefined && val < actualMin) {
              onErrorChange(
                `Below measured minimum of ${formatFeatureBound(feature.key, actualMin, true)} ${feature.unit}`
              );
            } else if (actualMax !== undefined && val > actualMax) {
              onErrorChange(
                `Above measured maximum of ${formatFeatureBound(feature.key, actualMax, false)} ${feature.unit}`
              );
            } else {
              onErrorChange(null);
            }
          }}
          aria-label={`${feature.label} slider`}
        />
        <div className="flex justify-between mt-1.5 text-[11px] font-medium text-muted-foreground tabular-nums">
          <span>
            {stat ? `${formatFeatureBound(feature.key, stat.min, true)} ${feature.unit}` : '—'}
          </span>
          <span>
            {stat ? `${formatFeatureBound(feature.key, stat.max, false)} ${feature.unit}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
