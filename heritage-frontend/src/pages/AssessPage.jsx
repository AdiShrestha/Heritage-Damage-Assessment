import { useState } from 'react';
import { Building2, X } from 'lucide-react';
import { usePrediction } from '../hooks/usePrediction';
import { useModels } from '../hooks/useModels';
import { ImageDropzone } from '../components/upload/ImageDropzone';
import { ModelSelector } from '../components/assessment/ModelSelector';
import { ResultCard } from '../components/assessment/ResultCard';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatFileSize } from '../utils/image';

export default function AssessPage() {
  const { models } = useModels();
  const { status, result, error, selectedFile, previewURL, selectedModel, setFile, setModel, run, reset } = usePrediction();
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
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none" aria-hidden="true" className="text-[#A63A2A]">
            <rect x="8" y="24" width="48" height="36" rx="2" fill="currentColor" opacity="0.85" />
            <rect x="14" y="14" width="36" height="12" rx="2" fill="currentColor" opacity="0.7" />
            <rect x="20" y="6" width="24" height="10" rx="2" fill="currentColor" opacity="0.55" />
            <rect x="22" y="32" width="20" height="20" rx="1" fill="rgba(255,255,255,0.2)" />
            <path d="M32 34l5 10H27z" fill="currentColor" opacity="0.4" />
          </svg>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text">
            Damage Assessment
          </h1>
        </div>
        <p className="ml-[52px] text-sm text-text-muted">
          Upload a photograph of a heritage structure to classify its damage level.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[420px_1fr]">
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
                    alt="Selected heritage preview"
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
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="heritage-card p-5">
            <h2 className="text-sm font-semibold tracking-tight text-text">
              <span className="heritage-ornament">Select Model</span>
            </h2>
            <div className="mt-4">
              <ModelSelector value={selectedModel} onChange={setModel} models={models} disabled={status === 'loading'} />
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
                  Analysing...
                </span>
              ) : (
                'Run Assessment'
              )}
            </button>

            {status === 'idle' && selectedFile ? (
              <p className="mt-3 text-sm text-text-muted text-center">Results appear on the right after analysis.</p>
            ) : null}
          </section>

          {status === 'error' && error ? (
            <ErrorAlert title="Assessment Failed" message={error.message} onRetry={run} />
          ) : null}
        </div>

        <div>
          {status === 'loading' ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-stone-custom-light bg-white/80 p-8 shadow-card backdrop-blur-sm">
              <div className="text-center">
                <LoadingSpinner size="lg" label="Running inference..." />
              </div>
            </div>
          ) : showEmptyState ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-brick-light bg-white/80 p-8 text-center shadow-card">
              <div>
                <div className="mx-auto mb-4 flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true" className="text-stone-custom/40">
                    <rect x="8" y="24" width="48" height="36" rx="2" fill="currentColor" />
                    <rect x="14" y="14" width="36" height="12" rx="2" fill="currentColor" opacity="0.7" />
                    <rect x="20" y="6" width="24" height="10" rx="2" fill="currentColor" opacity="0.55" />
                    <rect x="22" y="32" width="20" height="20" rx="1" fill="rgba(255,255,255,0.3)" />
                    <path d="M32 34l5 10H27z" fill="currentColor" opacity="0.3" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-text">No Assessment Yet</h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  Upload an image and run the model to see results here.
                </p>
              </div>
            </div>
          ) : result ? (
            <ResultCard result={result} originalSrc={previewURL} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
