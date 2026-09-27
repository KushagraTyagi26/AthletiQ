'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AppShell } from '@/components/app-shell';
import { PageHeader, SectionHeading } from '@/components/page-shell';
import {
  Gauge,
  Server,
  Spline,
  Brain,
  Activity,
  LineChart,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const PIPELINE_STEPS = [
  {
    step: '01',
    icon: Gauge,
    title: 'Six Entered Measurements',
    subtitle: 'Input acquisition & physiological context',
    description:
      'The athlete or practitioner enters six specific parameters: cycling power (W), heart rate (bpm), VO₂ (mL/kg/min), height (m), weight (kg), and age (years). Cycling power represents external mechanical work, heart rate and VO₂ measure active cardiorespiratory demand, while height, weight, and age provide anthropometric and demographic context.',
    details: '6 raw input variables collected during or corresponding to a graded cycling test stage.',
  },
  {
    step: '02',
    icon: Server,
    title: 'FastAPI Validation',
    subtitle: 'Bound verification against observed data',
    description:
      'The values are submitted via HTTP POST to the FastAPI backend service. Before model evaluation, inputs are rigorously checked against the observed minimum and maximum ranges of the underlying exercise-test dataset. If any value exceeds measured laboratory bounds, FastAPI rejects the request with a descriptive 422 error to prevent out-of-distribution extrapolations.',
    details: 'Pydantic schema validation + dataset boundary verification (GET /api/feature-stats).',
  },
  {
    step: '03',
    icon: Spline,
    title: 'Scaling and Degree-2 Polynomial Features',
    subtitle: 'Standardization and quadratic term expansion',
    description:
      'Inputs pass through scikit-learn’s StandardScaler to center features at zero mean and scale them to unit variance. Next, PolynomialFeatures(degree=2, include_bias=False) transforms the 6 standardized features into 27 features: 6 original linear terms, 6 squared terms (capturing parabolic curvature), and 15 pairwise interaction terms (modeling interdependent physiological responses, such as power × VO₂).',
    details: 'Pipeline: StandardScaler() → PolynomialFeatures(degree=2, include_bias=False).',
  },
  {
    step: '04',
    icon: Brain,
    title: 'Degree-2 polynomial feature expansion → fitted nonlinear response using linear regression',
    subtitle: 'Polynomial regression model / Nonlinear regression relationship',
    description:
      'A LinearRegression algorithm evaluates the 27 transformed features using coefficients learned via ordinary least squares on training data. Crucially, while LinearRegression fits a linear combination of its inputs, the inputs themselves are quadratic and interactive. This polynomial regression model creates a true nonlinear regression relationship, allowing predicted lactate to bend and accelerate realistically across exercise intensities.',
    details: 'Linear in feature space, curved and nonlinear with respect to original physical measurements.',
  },
  {
    step: '05',
    icon: Activity,
    title: 'Estimated Blood Lactate',
    subtitle: 'Served mmol/L concentration output',
    description:
      'The pipeline calculates and returns the estimated blood lactate concentration in millimoles per liter (mmol/L). This represents a dataset-level expectation of physiological response for an athlete exhibiting the entered profile, rather than an invasive laboratory blood draw.',
    details: 'Returned as JSON payload: { lactate: float, unit: "mmol/L", model: "..." }.',
  },
  {
    step: '06',
    icon: LineChart,
    title: 'Model-Response Chart',
    subtitle: 'Multivariate sensitivity visualization',
    description:
      'The predicted result connects directly to the interactive sensitivity chart. By holding five inputs constant and stepping the sixth across its verified range (via POST /api/model-response/{feature}), AthletiQ plots the model’s mathematical response curve, clearly marking the user’s current input and returned estimate.',
    details: 'Interactive 81-point hypothetical response curves across verified dataset boundaries.',
  },
];

export default function HowItWorksPage() {
  return (
    <AppShell>
      <PageHeader
        title="How It Works"
        subtitle="Inside AthletiQ's machine learning architecture: from six raw measurements to an estimated blood lactate concentration through a verified polynomial regression pipeline."
      />

      <SectionHeading
        title="Vertical Prediction Pipeline"
        description="A step-by-step walkthrough of how inputs travel through validation, scaling, polynomial expansion, and regression estimation."
      />

      {/* Vertical Step-by-Step Pipeline */}
      <div className="relative space-y-6 pt-2 pb-6 max-w-4xl">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === PIPELINE_STEPS.length - 1;

          return (
            <div key={step.step} className="relative">
              {/* Connector line between steps */}
              {!isLast && (
                <div
                  className="absolute left-6 top-16 bottom-[-24px] w-0.5 bg-gradient-to-b from-primary/60 to-primary/20 -z-10 hidden sm:block"
                  aria-hidden="true"
                />
              )}

              <Card className="border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    {/* Step Badge & Icon */}
                    <div className="flex items-center sm:flex-col items-center gap-3 shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white font-black text-lg shadow-md">
                        {step.step}
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <h3 className="text-lg font-bold text-foreground tracking-tight">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {step.subtitle}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground pt-1">
                        {step.description}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-muted/50 border border-border/80 px-3 py-1.5 text-xs font-mono text-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{step.details}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Arrow indicator between steps for mobile */}
              {!isLast && (
                <div className="flex justify-center sm:hidden py-1">
                  <ArrowDown className="h-5 w-5 text-primary/60" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Advisory & Scope Card */}
      <Card className="border-primary/30 bg-primary/5 shadow-sm max-w-4xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 shrink-0 text-primary mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground">
                Physiological Scope & Modeling Intent
              </h3>
              <p className="text-sm leading-relaxed text-foreground">
                AthletiQ models how blood lactate responds to cycling power, giving athletes and coaches a way to explore exercise intensity and physiological response. It does not directly predict race results or overall athletic performance.
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground pt-1">
                The model learns population-level statistical mappings from graded cycling laboratory tests. Because individual lactate kinetics depend on muscle fiber composition, glycogen status, and recent training fatigue, model outputs represent benchmark expectations rather than individualized medical diagnoses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
