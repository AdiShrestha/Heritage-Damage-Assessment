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
        <h1 className="text-3xl font-semibold tracking-tight text-text">Damage Assessment</h1>
        <p className="mt-2 text-sm text-text-muted">
          Upload a photograph of a heritage structure to classify its damage level.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-stone-custom-light bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold tracking-tight text-text">Upload Image</h2>
            <div className="mt-4">
              <ImageDropzone onFile={handleFile} disabled={status === 'loading'} />
            </div>

            {selectedFile ? (
              <div className="mt-4 rounded-xl border border-stone-custom-light bg-bg p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={previewURL}
                    alt="Selected heritage preview"
                    className="h-20 w-20 rounded-lg object-cover"
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

          <section className="rounded-xl border border-stone-custom-light bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold tracking-tight text-text">Select Model</h2>
            <div className="mt-4">
              <ModelSelector value={selectedModel} onChange={setModel} models={models} disabled={status === 'loading'} />
            </div>
          </section>

          <section className="rounded-xl border border-stone-custom-light bg-white p-5 shadow-card">
            <button
              type="button"
              onClick={run}
              disabled={!selectedFile || status === 'loading'}
              className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors duration-150 ease-in-out hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
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
              <p className="mt-3 text-sm text-text-muted">Results appear on the right after analysis.</p>
            ) : null}
          </section>

          {status === 'error' && error ? (
            <ErrorAlert title="Assessment Failed" message={error.message} onRetry={run} />
          ) : null}
        </div>

        <div>
          {status === 'loading' ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-stone-custom-light bg-white p-8 shadow-card">
              <div className="text-center">
                <LoadingSpinner size="lg" label="Running inference..." />
              </div>
            </div>
          ) : showEmptyState ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-stone-custom-light bg-white p-8 text-center shadow-card">
              <div>
                <Building2 className="mx-auto h-14 w-14 text-stone-custom/40" />
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-text">No Assessment Yet</h2>
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
