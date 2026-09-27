'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppShell } from '@/components/app-shell';
import { PageHeader, SectionHeading } from '@/components/page-shell';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Spline,
  TrendingUp,
  Brain,
  Layers,
  Scale,
  ShieldCheck,
  CheckCircle2,
  Info,
  Network,
} from 'lucide-react';

export default function PolynomialFittingPage() {
  return (
    <AppShell>
      <PageHeader
        title="Polynomial Curve Fitting & Machine Learning Architecture"
        subtitle="How degree-2 polynomial expansion, feature standardization, and linear regression combine to capture curved physiological relationships in exercise science."
      />

      {/* 1. What Polynomial Curve Fitting Is */}
      <SectionHeading
        title="1. What Is Polynomial Curve Fitting?"
        description="Extending linear regression to capture curved patterns without abandoning optimal parameter estimation."
      />
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Spline className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground">
                Modeling Non-Constant Rates of Change
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                Standard simple linear regression assumes that the target variable changes at a constant, uniform rate across the entire input domain. In human exercise physiology, however, blood lactate concentration does not increase along a rigid straight line. During an incremental cycling protocol, blood lactate remains low and relatively stable at baseline intensities before accumulating at an accelerating, upward-curving rate as workload intensifies.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                <strong>Polynomial curve fitting</strong> is a machine learning technique that addresses this nonlinearity. Rather than passing raw inputs directly to a straight-line model, the feature space is mathematically expanded with powers and products of the original variables. A linear regression solver then determines the optimal coefficients across this enriched basis, producing a curved multidimensional response surface.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Why a Degree-2 Model Was Chosen */}
      <SectionHeading
        title="2. Why a Degree-2 Model?"
        description="The rationale for quadratic expansion over linear or higher-order polynomials."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Parabolic Curvature
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              A quadratic (degree-2) term allows the model response to bend smoothly upward, reflecting the empirical acceleration of blood lactate accumulation as exercise intensity advances toward maximal aerobic capacity.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Resistance to Overfitting
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Higher-order polynomials (degree 3, 4, or higher) are prone to Runge&apos;s phenomenon and boundary instability, producing wild, spurious oscillations at the extremes of the measured data. Degree-2 maintains smooth, controlled generalization.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Pairwise Synergy
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Degree-2 expansion naturally generates cross-product interaction terms (such as power × heart rate), enabling the model to account for how metabolic and cardiorespiratory strain compound under heavy work rates.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Feature Breakdown: Six Inputs to 27 Expanded Terms */}
      <SectionHeading
        title="3. From Six Inputs to 27 Expanded Features"
        description="How PolynomialFeatures(degree=2, include_bias=False) constructs original, squared, and interaction terms."
      />
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 pt-5 px-6">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Mathematical Composition of the Feature Space
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            For our six input variables (power, heart rate, VO₂, height, weight, age), degree-2 expansion yields exactly 27 terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Original Linear Terms
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
                  6 terms
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Direct linear terms representing base measurements:
              </p>
              <div className="mt-2 text-xs font-mono bg-card rounded p-2 border border-border/80 text-foreground space-y-1">
                <div>power, heart_rate, VO₂,</div>
                <div>height, weight, age</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Squared Quadratic Terms
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
                  6 terms
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Squared terms enabling parabolic curvature:
              </p>
              <div className="mt-2 text-xs font-mono bg-card rounded p-2 border border-border/80 text-foreground space-y-1">
                <div>power², heart_rate², VO₂²,</div>
                <div>height², weight², age²</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Pairwise Interaction Terms
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
                  15 terms
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cross-products for all pairs (6 × 5 / 2 = 15):
              </p>
              <div className="mt-2 text-xs font-mono bg-card rounded p-2 border border-border/80 text-foreground space-y-1">
                <div>power × heart_rate, power × VO₂,</div>
                <div>heart_rate × VO₂, weight × VO₂, …</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 text-sm text-foreground">
            <p className="font-semibold text-foreground">
              Total expanded feature count: 6 linear + 6 squared + 15 interaction = 27 features.
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              When evaluated with LinearRegression (which fits an intercept term β₀), the model learns 28 parameters total across the standardized training data.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. The AthletiQ Pipeline: StandardScaler, PolynomialFeatures, LinearRegression */}
      <SectionHeading
        title="4. The Scikit-Learn Pipeline"
        description="StandardScaler → PolynomialFeatures(degree=2, include_bias=False) → LinearRegression()."
      />
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 pt-5 px-6">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Execution Pipeline Architecture
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            How data standardization and regression fitting are coupled into a leak-free estimator.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs sm:text-sm text-foreground overflow-x-auto">
            <p className="text-muted-foreground">// Exact backend pipeline definition:</p>
            <p className="mt-1 font-bold text-primary">
              make_pipeline(StandardScaler(), PolynomialFeatures(degree=2, include_bias=False), LinearRegression())
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-foreground">1. StandardScaler</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Centers each feature at zero mean and scales to unit variance. This prevents power (up to 480 W) or heart rate (up to 210 bpm) from numerically dominating height (1.6–1.95 m) during matrix inversion.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-foreground">2. PolynomialFeatures(degree=2)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Expands the 6 standardized features into the 27 linear, squared, and interactive columns, creating the nonlinear multidimensional basis.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-foreground">3. LinearRegression</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fits ordinary least squares coefficients across all 27 basis terms simultaneously, finding the globally optimal weight vector that minimizes prediction errors on training data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Why the Resulting Response Is Nonlinear */}
      <SectionHeading
        title="5. Linearity in Parameters vs Nonlinearity in Inputs"
        description="Understanding why the model is called &ldquo;linear regression&rdquo; while producing curved response surfaces."
      />
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Brain className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Linear Combination of Nonlinear Basis Functions
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                In statistical learning theory, a model is classified as <strong>linear</strong> if it is linear with respect to its learned coefficients (β), meaning the prediction is written as a weighted sum:
              </p>
              <div className="p-3 my-2 rounded-lg border border-border bg-muted/40 text-center font-mono text-xs sm:text-sm font-semibold text-foreground">
                Estimated Lactate = β₀ + β₁·z₁ + β₂·z₂ + … + β₆·z₁² + … + β₂₇·(z₅ × z₆)
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                Because the basis transformations include squared values and cross-products, the mathematical response surface is <strong>fundamentally curved and nonlinear</strong> with respect to the entered measurements (watts, heart rate, VO₂, etc.). The model bends in multi-dimensional space, capturing complex physiological interactions while retaining the fast, closed-form computational guarantees of linear regression.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Model Evaluation on Held-Out Test Files */}
      <SectionHeading
        title="6. Model Evaluation on Held-Out Exercise-Test Files"
        description="Preventing intra-subject data leakage with GroupShuffleSplit."
      />
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Grouped File-Level Partitioning
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                During a graded exercise test, a single participant performs multiple consecutive stages (e.g., 100 W, 140 W, 180 W, 220 W). If individual stages from the same athlete were randomly shuffled into both the training and test sets, the model could easily memorize individual baseline physiology, producing artificially optimistic evaluation scores (data leakage).
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                To prevent this, AthletiQ partitions data using <strong>GroupShuffleSplit(test_size=0.2, random_state=42)</strong> grouped by <code>test_id</code>. All stages from a given exercise test are kept strictly in either the training set (80%) or the held-out validation set (20%). The model is evaluated solely on unseen test files using Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and the Coefficient of Determination (R²).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scope Disclaimer */}
      <Alert className="border-border/80 bg-muted/40 p-4">
        <Info className="h-5 w-5 text-primary shrink-0" />
        <div>
          <AlertTitle className="text-sm font-bold text-foreground">
            Scientific Scope & Limitations
          </AlertTitle>
          <AlertDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground mt-1">
            AthletiQ models how blood lactate responds to cycling power, giving athletes and coaches a way to explore exercise intensity and physiological response. It does not directly predict race results or overall athletic performance. The model does not identify an individual clinical lactate threshold (such as LT1 or LT2), and plotted associations do not prove cause and effect.
          </AlertDescription>
        </div>
      </Alert>
    </AppShell>
  );
}
