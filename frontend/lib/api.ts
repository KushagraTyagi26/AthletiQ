import type {
  PredictionInputs,
  PredictionResult,
  FeatureStats,
  ScatterSeries,
  ModelResponseSeries,
  ResponseCurveData,
  DataInsights,
  ComparisonData,
  FeatureKey,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let url = path;
  if (API_BASE && path.startsWith('/api')) {
    url = `${API_BASE}${path}`;
  }
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const errorData = await res.json();
        if (errorData?.detail) {
          if (typeof errorData.detail === 'string') {
            message = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            message = errorData.detail
              .map((d: { msg?: string; loc?: (string | number)[] }) => {
                const field = d.loc ? d.loc.filter((l) => l !== 'body').join('.') : '';
                return field ? `${field}: ${d.msg}` : (d.msg || JSON.stringify(d));
              })
              .join('; ');
          }
        }
      } catch {
        // Fallback to HTTP status message if not JSON
      }
      throw new ApiError(message, res.status);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof TypeError) {
      throw new ApiError('Could not reach the backend.', 0);
    }
    throw err;
  }
}

export async function predictSixInput(
  inputs: PredictionInputs
): Promise<PredictionResult> {
  return request<PredictionResult>('/api/predict/six-input', {
    method: 'POST',
    body: JSON.stringify(inputs),
  });
}

export async function getFeatureStats(): Promise<FeatureStats[]> {
  return request<FeatureStats[]>('/api/feature-stats');
}

export async function getScatterSeries(
  xFeature: FeatureKey,
  yFeature: FeatureKey
): Promise<ScatterSeries> {
  return request<ScatterSeries>(
    `/api/scatter?x=${xFeature}&y=${yFeature}`
  );
}

export async function getModelResponseSeries(
  feature: FeatureKey,
  inputs: PredictionInputs
): Promise<ModelResponseSeries> {
  return request<ModelResponseSeries>(`/api/model-response/${feature}`, {
    method: 'POST',
    body: JSON.stringify(inputs),
  });
}

export async function getAllModelResponseSeries(
  inputs: PredictionInputs
): Promise<ModelResponseSeries[]> {
  const features: FeatureKey[] = ['power', 'heart_rate', 'vo2', 'height', 'weight', 'age'];
  const results = await Promise.allSettled(
    features.map((f) => getModelResponseSeries(f, inputs))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<ModelResponseSeries> => r.status === 'fulfilled')
    .map((r) => r.value);
}

export async function getResponseCurve(
  inputs: PredictionInputs
): Promise<ResponseCurveData> {
  return request<ResponseCurveData>('/api/response-curve', {
    method: 'POST',
    body: JSON.stringify(inputs),
  });
}

export async function getDataInsights(): Promise<DataInsights> {
  return request<DataInsights>('/api/data-insights');
}

export async function getModelEvaluation(): Promise<ComparisonData> {
  return request<ComparisonData>('/api/model-evaluation');
}

export type {
  PredictionInputs,
  PredictionResult,
  FeatureStats,
  ScatterSeries,
  ModelResponseSeries,
  ResponseCurveData,
  DataInsights,
  ComparisonData,
};
