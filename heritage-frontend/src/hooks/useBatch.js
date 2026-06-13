import { useState } from 'react';
import toast from 'react-hot-toast';
import { submitBatch } from '../api/batch';
import { validateFile } from '../utils/image';

const initialState = {
  status: 'idle',
  results: null,
  error: null,
  selectedFiles: [],
  selectedModel: 'mock',
};

export function useBatch() {
  const [status, setStatus] = useState(initialState.status);
  const [results, setResults] = useState(initialState.results);
  const [error, setError] = useState(initialState.error);
  const [selectedFiles, setSelectedFiles] = useState(initialState.selectedFiles);
  const [selectedModel, setSelectedModel] = useState(initialState.selectedModel);

  function addFiles(newFiles) {
    const valid = [];
    newFiles.forEach((file) => {
      const v = validateFile(file);
      if (!v.valid) {
        toast.error(`${file.name}: ${v.error}`);
      } else {
        valid.push(file);
      }
    });

    setSelectedFiles((prev) => {
      // deduplicate by name
      const names = new Set(prev.map((f) => f.name));
      const unique = valid.filter((f) => !names.has(f.name));
      const next = [...prev, ...unique];
      if (next.length > 20) {
        toast.error('Maximum 20 images per batch');
        return next.slice(0, 20);
      }
      return next;
    });

    setStatus('idle');
    setResults(null);
    setError(null);
  }

  function removeFile(fileName) {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName));
  }

  function setModel(name) {
    setSelectedModel(name);
  }

  async function run() {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setStatus('loading');
    setError(null);
    setResults(null);

    try {
      const data = await submitBatch(selectedFiles, selectedModel);
      setResults(data);
      setStatus('success');
      toast.success(
        `Batch complete — ${data.results?.length ?? 0} image${
          data.results?.length !== 1 ? 's' : ''
        } assessed`
      );
    } catch (err) {
      setError(err);
      setStatus('error');
      toast.error(err.message || 'Batch assessment failed');
    }
  }

  function reset() {
    setStatus(initialState.status);
    setResults(initialState.results);
    setError(initialState.error);
    setSelectedFiles(initialState.selectedFiles);
    setSelectedModel(initialState.selectedModel);
  }

  return {
    status,
    results,
    error,
    selectedFiles,
    selectedModel,
    addFiles,
    removeFile,
    setModel,
    run,
    reset,
  };
}
