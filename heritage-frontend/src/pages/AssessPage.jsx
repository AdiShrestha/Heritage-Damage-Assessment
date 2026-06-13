import { useState } from 'react';
import { Building2, X, FileText, Settings } from 'lucide-react';
import { usePrediction } from '../hooks/usePrediction';
import { useModels } from '../hooks/useModels';
import { ImageDropzone } from '../components/upload/ImageDropzone';
import { ModelSelector } from '../components/assessment/ModelSelector';
import { ResultCard } from '../components/assessment/ResultCard';
import { ReportViewer } from '../components/assessment/ReportViewer';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatFileSize } from '../utils/image';

export default function AssessPage() {
  const { models } = useModels();
  const {
    status,
    result,
    error,
    selectedFile,
    previewURL,
    selectedModel,
    isReportMode,
    siteId,
    siteName,
    surveyor,
    notes,
    setFile,
    setModel,
    setIsReportMode,
    setSiteId,
    setSiteName,
    setSurveyor,
    setNotes,
    run,
    reset,
  } = usePrediction();
  
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
      <div className="mb-8 print:hidden">
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

      <div className="grid gap-8 md:grid-cols-[400px_1fr] print:grid-cols-1">
        {/* Left Side Controls (hidden during print if showing report) */}
        <div className="space-y-6 print:hidden">
          {/* Upload Card */}
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

          {/* Model Selector Card */}
          <section className="heritage-card p-5">
            <h2 className="text-sm font-semibold tracking-tight text-text">
              <span className="heritage-ornament">Select Model</span>
            </h2>
            <div className="mt-4">
              <ModelSelector value={selectedModel} onChange={setModel} models={models} disabled={status === 'loading'} />
            </div>
          </section>

          {/* Report Options Card */}
          <section className="heritage-card p-5 space-y-4">
            <h2 className="text-sm font-semibold tracking-tight text-text">
              <span className="heritage-ornament">Assessment Options</span>
            </h2>
            
            <div className="flex items-center gap-2 mt-2">
              <input
                id="isReportMode"
                type="checkbox"
                checked={isReportMode}
                onChange={(e) => setIsReportMode(e.target.checked)}
                className="h-4 w-4 rounded border-stone-custom-light text-[#A63A2A] focus:ring-[#A63A2A]/20"
                disabled={status === 'loading'}
              />
              <label htmlFor="isReportMode" className="text-xs font-semibold text-text flex items-center gap-1.5 cursor-pointer">
                <FileText className="h-3.5 w-3.5 text-[#A63A2A]" />
                Generate Structured Report
              </label>
            </div>

            {isReportMode && (
              <div className="mt-3 space-y-3 border-t border-stone-custom-light pt-3 text-xs fade-in">
                <div>
                  <label htmlFor="siteId" className="block font-medium text-text-muted mb-1">Site ID</label>
                  <input
                    id="siteId"
                    type="text"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    placeholder="e.g. patan_durbar_01"
                    className="w-full rounded-lg border border-stone-custom-light bg-bg px-3 py-2 text-xs text-text placeholder-text-muted focus:border-primary focus:outline-none"
                    disabled={status === 'loading'}
                  />
                </div>
                <div>
                  <label htmlFor="siteName" className="block font-medium text-text-muted mb-1">Site Name</label>
                  <input
                    id="siteName"
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="e.g. Patan Durbar Square"
                    className="w-full rounded-lg border border-stone-custom-light bg-bg px-3 py-2 text-xs text-text placeholder-text-muted focus:border-primary focus:outline-none"
                    disabled={status === 'loading'}
                  />
                </div>
                <div>
                  <label htmlFor="surveyor" className="block font-medium text-text-muted mb-1">Surveyor Name</label>
                  <input
                    id="surveyor"
                    type="text"
                    value={surveyor}
                    onChange={(e) => setSurveyor(e.target.value)}
                    placeholder="e.g. Ar. Rajesh Shrestha"
                    className="w-full rounded-lg border border-stone-custom-light bg-bg px-3 py-2 text-xs text-text placeholder-text-muted focus:border-primary focus:outline-none"
                    disabled={status === 'loading'}
                  />
                </div>
                <div>
                  <label htmlFor="notes" className="block font-medium text-text-muted mb-1">Field Notes</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe cracks, weathering, or stability concerns..."
                    rows="3"
                    className="w-full rounded-lg border border-stone-custom-light bg-bg px-3 py-2 text-xs text-text placeholder-text-muted focus:border-primary focus:outline-none"
                    disabled={status === 'loading'}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Trigger Card */}
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
                  {isReportMode ? 'Generating Report...' : 'Analysing...'}
                </span>
              ) : (
                isReportMode ? 'Generate Survey Report' : 'Run Assessment'
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

        {/* Right Side Visual Results */}
        <div className="print:w-full">
          {status === 'loading' ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-stone-custom-light bg-white/80 p-8 shadow-card backdrop-blur-sm print:hidden">
              <div className="text-center">
                <LoadingSpinner size="lg" label={isReportMode ? 'Compiling structured report...' : 'Running inference...'} />
              </div>
            </div>
          ) : showEmptyState ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-brick-light bg-white/80 p-8 text-center shadow-card print:hidden">
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
            isReportMode ? (
              <ReportViewer report={result} />
            ) : (
              <ResultCard result={result} originalSrc={previewURL} />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
