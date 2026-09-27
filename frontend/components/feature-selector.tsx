'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FEATURES, FeatureKey, FEATURE_MAP } from '@/lib/types';

interface FeatureSelectorProps {
  label: string;
  value: FeatureKey;
  onChange: (key: FeatureKey) => void;
  excludeKey?: FeatureKey;
  id: string;
}

export function FeatureSelector({
  label,
  value,
  onChange,
  excludeKey,
  id,
}: FeatureSelectorProps) {
  const options = FEATURES.filter((f) => f.key !== excludeKey);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as FeatureKey)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((f) => (
            <SelectItem key={f.key} value={f.key}>
              {f.label} ({f.unit})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { FEATURES, FEATURE_MAP };
