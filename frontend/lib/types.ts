export type FeatureKey =
  | 'power'
  | 'heart_rate'
  | 'vo2'
  | 'height'
  | 'weight'
  | 'age';

export interface PredictionInputs {
  power: number;
  heart_rate: number;
  vo2: number;
  height: number;
  weight: number;
  age: number;
}

export interface PredictionResult {
  lactate: number;
  unit: string;
  model: string;
}

export interface FeatureStats {
  key: FeatureKey;
  name: string;
  unit: string;
  min: number;
  max: number;
  count: number;
  mean: number;
  std: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  lactate?: number;
}

export interface ScatterSeries {
  feature_x: FeatureKey;
  feature_y: FeatureKey;
  points: ScatterPoint[];
  x_unit: string;
  y_unit: string;
}

export interface ModelResponsePoint {
  feature_value: number;
  lactate: number;
}

export interface ModelResponseSeries {
  feature: FeatureKey;
  points: ModelResponsePoint[];
  unit: string;
  current_value: number;
}

export interface ResponseCurvePoint {
  power: number;
  measured_lactate?: number;
  predicted_lactate?: number;
}

export interface ResponseCurveData {
  observed: { power: number; lactate: number }[];
  curve: { power: number; lactate: number }[];
  coverage_min: number;
  coverage_max: number;
}

export interface PowerBinSummary {
  bin_label: string;
  bin_min: number;
  bin_max: number;
  count: number;
  mean_lactate: number;
  std_lactate: number;
}

export interface DataInsights {
  power_bins: PowerBinSummary[];
  lactate_distribution: { bin_label: string; count: number; min: number; max: number }[];
  feature_ranges: FeatureStats[];
}

export interface EvaluationMetrics {
  model_name: string;
  split: string;
  mae: number;
  r2: number;
  rmse: number;
}

export interface ResidualPoint {
  predicted: number;
  measured: number;
  residual: number;
}

export interface ComparisonData {
  watts_only: EvaluationMetrics;
  six_input: EvaluationMetrics;
  residuals: {
    watts_only: ResidualPoint[];
    six_input: ResidualPoint[];
  };
  predicted_vs_measured: {
    watts_only: { predicted: number; measured: number }[];
    six_input: { predicted: number; measured: number }[];
  };
  error_by_power: {
    watts_only: { power: number; error: number }[];
    six_input: { power: number; error: number }[];
  };
}

export interface FeatureInfo {
  key: FeatureKey;
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

export const FEATURES: FeatureInfo[] = [
  {
    key: 'power',
    label: 'Cycling Power',
    shortLabel: 'Power',
    unit: 'W',
    description: 'Power output during the cycling stage.',
    min: 80,
    max: 480,
    step: 1,
    default: 200,
  },
  {
    key: 'heart_rate',
    label: 'Heart Rate',
    shortLabel: 'HR',
    unit: 'bpm',
    description: 'Heart rate measured during the stage.',
    min: 87,
    max: 210,
    step: 1,
    default: 150,
  },
  {
    key: 'vo2',
    label: 'VO₂',
    shortLabel: 'VO₂',
    unit: 'mL/kg/min',
    description: 'Oxygen uptake during the stage.',
    min: 20.1,
    max: 83.9,
    step: 0.1,
    default: 45,
  },
  {
    key: 'height',
    label: 'Height',
    shortLabel: 'Height',
    unit: 'm',
    description: 'Participant height in meters.',
    min: 1.6,
    max: 1.95,
    step: 0.01,
    default: 1.75,
  },
  {
    key: 'weight',
    label: 'Weight',
    shortLabel: 'Weight',
    unit: 'kg',
    description: 'Participant body weight in kilograms.',
    min: 49,
    max: 108,
    step: 0.5,
    default: 70,
  },
  {
    key: 'age',
    label: 'Age',
    shortLabel: 'Age',
    unit: 'years',
    description: 'Participant age in years.',
    min: 15.705,
    max: 65.608,
    step: 0.5,
    default: 30,
  },
];

export const FEATURE_MAP: Record<FeatureKey, FeatureInfo> = FEATURES.reduce(
  (acc, f) => ({ ...acc, [f.key]: f }),
  {} as Record<FeatureKey, FeatureInfo>
);

export const DEFAULT_INPUTS: PredictionInputs = FEATURES.reduce(
  (acc, f) => ({ ...acc, [f.key]: f.default }),
  {} as PredictionInputs
);

export const FEATURE_PAIRS: [FeatureKey, FeatureKey][] = [
  ['power', 'heart_rate'],
  ['power', 'vo2'],
  ['heart_rate', 'vo2'],
  ['weight', 'vo2'],
  ['age', 'heart_rate'],
];
