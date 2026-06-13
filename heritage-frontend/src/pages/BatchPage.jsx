import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useBatch } from '../hooks/useBatch';
import { useModels } from '../hooks/useModels';
import { ImageDropzone } from '../components/upload/ImageDropzone';
import { ModelSelector } from '../components/assessment/ModelSelector';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { BatchResults } from '../components/assessment/BatchResults';
import { formatFileSize } from '../utils/image';

export default function BatchPage() {
  const { models } = useModels();
  const { status, results, error, selectedFiles, selectedModel, addFiles, removeFile: hookRemoveFile, setModel, run, reset } = useBatch();
  const [filePreviews, setFilePreviews] = useState({});

  function handleFiles(files) {
    const newFiles = Array.from(files);
    addFiles(newFiles);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews((prev) => ({
          ...prev,
          [file.name]: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeFile(fileName) {
    hookRemoveFile(fileName);
    setFilePreviews((prev) => {
      const next = { ...prev };
      delete next[fileName];
      return next;
    });
  }

  const showEmptyState = (status === 'idle' || status === 'error') && !results;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Upload className="h-6 w-6 text-[#A63A2A]" />
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text">
            Batch Assessment
          </h1>
        </div>
        <p className="ml-[52px] text-sm text-text-muted">
          Upload multiple images for parallel processing. Results include damage classification for each image.
        </p>
      </div>

      {showEmptyState ? (
        <div className="space-y-6">
          <section className="heritage-card p-6">
            <h2 className="text-sm font-semibold tracking-tight text-text mb-4">
              <span className="heritage-ornament">Upload Images</span>
            </h2>
            <ImageDropzone
              onFile={(file) => handleFiles([file])}
              disabled={status === 'loading'}
              multiple={true}
            />

            {selectedFiles.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Selected Images ({selectedFiles.length})
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {selectedFiles.map((file) => (
                    <div
                      key={file.name}
                      className="relative group rounded-lg overflow-hidden border-2 border-stone-custom-light"
                    >
                      {filePreviews[file.name] && (
                        <img
                          src={filePreviews[file.name]}
                          alt={file.name}
                          className="h-24 w-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(file.name)}
                        className="absolute top-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <p className="absolute bottom-0 left-0 right-0 truncate bg-black/40 px-2 py-1 text-xs text-white">
                        {file.name.slice(0, 12)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="heritage-card p-6">
            <h2 className="text-sm font-semibold tracking-tight text-text mb-4">
              <span className="heritage-ornament">Select Model</span>
            </h2>
            <ModelSelector
              value={selectedModel}
              onChange={setModel}
              models={models}
              disabled={status === 'loading'}
            />
          </section>

          <section className="heritage-card p-6">
            <button
              type="button"
              onClick={run}
              disabled={selectedFiles.length === 0 || status === 'loading'}
              className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#A63A2A] to-[#C54F3A] px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-150 ease-in-out hover:from-[#8B2A1A] hover:to-[#A63A2A] disabled:cursor-not-allowed disabled:from-stone-custom-light disabled:to-stone-custom-light disabled:opacity-60"
            >
              {status === 'loading'
                ? `Processing ${selectedFiles.length} image${selectedFiles.length !== 1 ? 's' : ''}...`
                : `Assess ${selectedFiles.length} image${selectedFiles.length !== 1 ? 's' : ''}`}
            </button>
          </section>
        </div>
      ) : null}

      {status === 'loading' ? <LoadingSpinner message="Processing batch..." /> : null}
      {error ? <ErrorAlert error={error} /> : null}
      {results ? (
        <div className="space-y-6">
          <BatchResults results={results} />
          <button
            type="button"
            onClick={reset}
            className="flex w-full items-center justify-center rounded-lg border-2 border-stone-custom-light px-4 py-3 text-sm font-medium text-text transition-all duration-150 ease-in-out hover:border-primary hover:text-primary"
          >
            Process Another Batch
          </button>
        </div>
      ) : null}
    </div>
  );
}
