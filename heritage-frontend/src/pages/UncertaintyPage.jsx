import { useState } from 'react';
import { ShieldAlert, HelpCircle, RefreshCw, Layers, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useUncertainty } from '../hooks/useUncertainty';
import { ImageDropzone } from '../components/upload/ImageDropzone';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatFileSize } from '../utils/image';
import { toMs } from '../utils/format';

// Simple SVG Semicircular Gauge Component
function SemiCircularGauge({ value, max, label, color = '#A63A2A', description = '' }) {
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const rotation = -90 + percentage * 180; // Map [0, 1] to [-90, 90] degrees

  return (
    <div className="flex flex-col items-center p-4 rounded-xl border border-stone-custom-light bg-white">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{label}</span>
      <div className="relative flex items-center justify-center w-36 h-20 overflow-hidden">
        {/* Outer arc */}
        <svg className="absolute top-0 w-32 h-32" viewBox="0 0 100 100">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#E2DCD6"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 * (1 - percentage)}
          />
        </svg>

        {/* Needle */}
        <div
          className="absolute bottom-0 w-1 h-16 origin-bottom transition-transform duration-1000 ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="w-1.5 h-12 bg-text rounded-full" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-text border-2 border-white" />
        </div>
      </div>
      <span className="text-xl font-bold mt-1 text-text">{value.toFixed(3)}</span>
      <span className="text-2xs text-text-muted mt-0.5 text-center leading-tight">{description}</span>
    </div>
  );
}

export default function UncertaintyPage() {
  const {
    status,
    result,
    error,
    selectedFile,
    previewURL,
    passes,
    setFile,
    setPasses,
    run,
    reset,
  } = useUncertainty();

  const [previewLabel, setPreviewLabel] = useState(null);

  function handleFile(file) {
    setPreviewLabel({ name: file.name, size: file.size });
    setFile(file);
  }

  function handleReset() {
    setPreviewLabel(null);
    reset();
  }

  const showEmptyState = (status === 'idle' || status === 'error') && !result;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Layers className="h-6 w-6 text-[#A63A2A]" />
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text">
            Uncertainty Estimation (MC Dropout)
          </h1>
        </div>
        <p className="ml-[52px] text-sm text-text-muted">
          Measure model reliability and confidence boundaries. Submits the image to multiple stochastic passes to extract Epistemic Uncertainty.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[400px_1fr]">
        {/* Left Control Panel */}
        <div className="space-y-6">
          <section className="heritage-card p-5">
            <h2 className="text-sm font-semibold tracking-tight text-text">
              <span className="heritage-ornament">Upload Image</span>
            </h2>
            <div className="mt-4">
              <ImageDropzone onFile={handleFile} disabled={status === 'loading'} />
            </div>

            {selectedFile ? (
              <div className="mt-4 rounded-xl border border-stone-custom-light bg-bg p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={previewURL}
                    alt="Selected survey image"
                    className="h-20 w-20 rounded-lg object-cover ring-1 ring-stone-custom-light"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{previewLabel?.name}</p>
                    <p className="mt-1 text-xs text-text-muted">{formatFileSize(previewLabel?.size || 0)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-custom-light text-stone-custom transition-colors duration-150 ease-in-out hover:border-primary hover:text-primary"
                    aria-label="Remove selected image"
                    disabled={status === 'loading'}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="heritage-card p-5">
            <h2 className="text-sm font-semibold tracking-tight text-text mb-4">
              <span className="heritage-ornament">Parameters</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label htmlFor="n-passes" className="font-medium text-text">Stochastic Passes (N)</label>
                  <span className="font-semibold text-[#A63A2A]">{passes} runs</span>
                </div>
                <input
                  id="n-passes"
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={passes}
                  onChange={(e) => setPasses(parseInt(e.target.value))}
                  disabled={status === 'loading'}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#A63A2A]"
                />
                <div className="flex justify-between text-2xs text-text-muted mt-1">
                  <span>5 (Fastest)</span>
                  <span>15 (Balanced)</span>
                  <span>50 (Highest accuracy)</span>
                </div>
              </div>

              <div className="rounded-lg bg-bg p-3 text-xs text-text-muted leading-relaxed">
                MC Dropout runs inference <strong>N times</strong> with dropout layers activated. Higher N yields more precise distributions but scales computational time.
              </div>
            </div>
          </section>

          <section className="heritage-card p-5">
            <button
              type="button"
              onClick={run}
              disabled={!selectedFile || status === 'loading'}
              className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#A63A2A] to-[#C54F3A] px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-150 ease-in-out hover:from-[#8B2A1A] hover:to-[#A63A2A] disabled:cursor-not-allowed disabled:from-stone-custom-light disabled:to-stone-custom-light disabled:opacity-60"
            >
              {status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Running {passes} Passes...
                </span>
              ) : (
                'Measure Uncertainty'
              )}
            </button>
          </section>

          {status === 'error' && error ? (
            <ErrorAlert title="Analysis Failed" message={error.message} onRetry={run} />
          ) : null}
        </div>

        {/* Right Output Panel */}
        <div className="space-y-6">
          {status === 'loading' ? (
            <div className="flex min-h-[450px] items-center justify-center rounded-xl border border-dashed border-stone-custom-light bg-white/80 p-8 shadow-card backdrop-blur-sm">
              <div className="text-center space-y-4">
                <LoadingSpinner size="lg" label={`Performing ${passes} forward passes...`} />
                <p className="text-xs text-text-muted max-w-[280px]">
                  Activating stochastic dropout layers and evaluating variance in probability space.
                </p>
              </div>
            </div>
          ) : showEmptyState ? (
            <div className="flex min-h-[450px] flex-col items-center justify-center rounded-xl border border-dashed border-brick-light bg-white/80 p-8 text-center shadow-card">
              <HelpCircle className="h-12 w-12 text-stone-custom/40 mb-4" />
              <h2 className="font-display text-xl font-semibold tracking-tight text-text">Uncertainty Diagnostics Ready</h2>
              <p className="mt-2 text-sm leading-6 text-text-muted max-w-sm">
                Select an image, configure your pass count, and perform uncertainty diagnostics. Recommended for images flagged with low confidence or high ensemble voting discrepancies.
              </p>
            </div>
          ) : result ? (
            <div className="heritage-card p-6 space-y-6">
              {/* Header result */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-custom-light pb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-text">Reliability Assessment</h2>
                  <p className="text-xs text-text-muted mt-0.5">Diagnostics resolved in {toMs(result.inference_time_ms)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {result.uncertain_flag ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      Unreliable Prediction
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Reliable Prediction
                    </span>
                  )}
                </div>
              </div>

              {/* Recommendation Banner */}
              <div className={`flex gap-3 rounded-xl border p-4 ${result.uncertain_flag ? 'bg-red-50 border-red-200 text-red-950' : 'bg-emerald-50 border-emerald-200 text-emerald-950'}`}>
                {result.uncertain_flag ? (
                  <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">Recommendation</h4>
                  <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{result.recommendation}</p>
                </div>
              </div>

              {/* Gating statistics / Consensus */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-custom-light p-4">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Most Common Class Vote</p>
                  <p className="font-display text-xl font-bold text-text">{result.predicted_class}</p>
                  <div className="mt-2 text-2xs text-text-muted">
                    Consensus prediction across all {passes} stochastic runs.
                  </div>
                </div>

                <div className="rounded-xl border border-stone-custom-light p-4">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Expert Agreement Rate</p>
                  <p className="font-display text-xl font-bold text-[#A63A2A]">
                    {(result.expert_agreement_rate * 100).toFixed(0)}%
                  </p>
                  <div className="mt-2 text-2xs text-text-muted">
                    Fraction of passes where all gating experts were aligned.
                  </div>
                </div>
              </div>

              <div className="pagoda-divider">
                <div className="pagoda-divider-dot" />
              </div>

              {/* Gauges section */}
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-text mb-4">Uncertainty Metrics</h3>
                <div className="grid gap-6 sm:grid-cols-3">
                  {/* Gauge 1: Mean Confidence */}
                  <SemiCircularGauge
                    value={result.confidence}
                    max={1}
                    label="Mean Confidence"
                    color="#1E6B3C"
                    description="Mean confidence of consensus prediction class"
                  />
                  {/* Gauge 2: Epistemic Std Dev */}
                  <SemiCircularGauge
                    value={result.epistemic_std}
                    max={0.5} // Maximum probability standard deviation is 0.5
                    label="Epistemic Uncertainty"
                    color="#A63A2A"
                    description="Model parameter standard deviation. Higher = weights variance"
                  />
                  {/* Gauge 3: Predictive Entropy */}
                  <SemiCircularGauge
                    value={result.predictive_entropy}
                    max={1.1} // Maximum entropy for 3 classes is ln(3) ~= 1.098 nats
                    label="Predictive Entropy"
                    color={result.predictive_entropy > 0.6 ? '#B8860B' : '#8B6F4A'}
                    description="Information entropy. Exceeding 0.60 nats implies high confusion"
                  />
                </div>
              </div>

              <div className="pagoda-divider">
                <div className="pagoda-divider-dot" />
              </div>

              {/* Educational info */}
              <section className="bg-bg rounded-xl p-4 text-xs space-y-2 text-text-muted">
                <h4 className="font-semibold text-text">What are these metrics?</h4>
                <p className="leading-relaxed">
                  <strong>Epistemic Uncertainty (Model Uncertainty):</strong> Measures the lack of knowledge about the best model parameters. It is high in regions with sparse training data and can be reduced by feeding the model more training data.
                </p>
                <p className="leading-relaxed">
                  <strong>Predictive Entropy:</strong> Reflects the overall information disorder in the model's predictions. When predictions vary wildly between forward passes, entropy increases, indicating that the model's structure is unable to form a confident consensus.
                </p>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
