import { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { useComparison } from '../hooks/useComparison';
import { ImageDropzone } from '../components/upload/ImageDropzone';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ComparisonResult } from '../components/assessment/ComparisonResult';
import { formatFileSize } from '../utils/image';

export default function ComparePage() {
  const {
    status,
    result,
    error,
    fileT1,
    fileT2,
    previewT1,
    previewT2,
    siteId,
    setFileT1,
    setFileT2,
    setSiteId,
    run,
    reset,
  } = useComparison();

  const [previewLabelT1, setPreviewLabelT1] = useState(null);
  const [previewLabelT2, setPreviewLabelT2] = useState(null);

  function handleFileT1(file) {
    setPreviewLabelT1({ name: file.name, size: file.size });
    setFileT1(file);
  }

  function handleFileT2(file) {
    setPreviewLabelT2({ name: file.name, size: file.size });
    setFileT2(file);
  }

  function handleReset() {
    reset();
    setPreviewLabelT1(null);
    setPreviewLabelT2(null);
  }

  const showEmptyState = (status === 'idle' || status === 'error') && !result;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="h-6 w-6 text-[#A63A2A]" />
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text">
            Temporal Comparison
          </h1>
        </div>
        <p className="ml-[52px] text-sm text-text-muted">
          Upload two photographs of the same heritage site (earlier and later) to detect deterioration.
        </p>
      </div>

      {showEmptyState ? (
        <div className="grid gap-8 md:grid-cols-2">
          <section className="heritage-card p-6">
            <h2 className="text-sm font-semibold tracking-tight text-text mb-4">
              <span className="heritage-ornament">Earlier Survey</span>
            </h2>
            <ImageDropzone
              onFile={handleFileT1}
              disabled={status === 'loading'}
              placeholder="Upload earlier photograph"
            />
            {fileT1 ? (
              <div className="mt-4 rounded-xl border border-stone-custom-light bg-bg p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={previewT1}
                    alt="Earlier survey preview"
                    className="h-20 w-20 rounded-lg object-cover ring-1 ring-stone-custom-light"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{previewLabelT1?.name}</p>
                    <p className="mt-1 text-xs text-text-muted">{formatFileSize(previewLabelT1?.size || 0)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileT1(null);
                      setPreviewT1(null);
                      setPreviewLabelT1(null);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-custom-light text-stone-custom transition-colors duration-150 ease-in-out hover:border-primary hover:text-primary"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="heritage-card p-6">
            <h2 className="text-sm font-semibold tracking-tight text-text mb-4">
              <span className="heritage-ornament">Later Survey</span>
            </h2>
            <ImageDropzone
              onFile={handleFileT2}
              disabled={status === 'loading'}
              placeholder="Upload later photograph"
            />
            {fileT2 ? (
              <div className="mt-4 rounded-xl border border-stone-custom-light bg-bg p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={previewT2}
                    alt="Later survey preview"
                    className="h-20 w-20 rounded-lg object-cover ring-1 ring-stone-custom-light"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{previewLabelT2?.name}</p>
                    <p className="mt-1 text-xs text-text-muted">{formatFileSize(previewLabelT2?.size || 0)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileT2(null);
                      setPreviewT2(null);
                      setPreviewLabelT2(null);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-custom-light text-stone-custom transition-colors duration-150 ease-in-out hover:border-primary hover:text-primary"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {showEmptyState ? (
        <section className="heritage-card mt-8 p-5">
          <div className="space-y-3">
            <div>
              <label htmlFor="siteId" className="block text-sm font-medium text-text mb-2">
                Site ID (Optional)
              </label>
              <input
                id="siteId"
                type="text"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="Enter site identifier for tracking"
                className="w-full rounded-lg border border-stone-custom-light bg-bg px-4 py-2.5 text-sm text-text placeholder-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                disabled={status === 'loading'}
              />
            </div>
            <button
              type="button"
              onClick={run}
              disabled={!fileT1 || !fileT2 || status === 'loading'}
              className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#A63A2A] to-[#C54F3A] px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-150 ease-in-out hover:from-[#8B2A1A] hover:to-[#A63A2A] disabled:cursor-not-allowed disabled:from-stone-custom-light disabled:to-stone-custom-light disabled:opacity-60"
            >
              {status === 'loading' ? 'Comparing...' : 'Compare Images'}
            </button>
          </div>
        </section>
      ) : null}

      {status === 'loading' ? <LoadingSpinner /> : null}
      {error ? <ErrorAlert error={error} /> : null}
      {result ? (
        <div className="space-y-6">
          <ComparisonResult result={result} />
          <button
            type="button"
            onClick={handleReset}
            className="flex w-full items-center justify-center rounded-lg border-2 border-stone-custom-light px-4 py-3 text-sm font-medium text-text transition-all duration-150 ease-in-out hover:border-primary hover:text-primary"
          >
            Compare Another Pair
          </button>
        </div>
      ) : null}
    </div>
  );
}
