import { useState } from 'react';
import Toast from 'react-native-toast-message';
import { submitBatch } from '../api/batch';

const MAX_FILES = 20;

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
    setSelectedFiles((prev) => {
      const existingUris = new Set(prev.map((f) => f.uri));
      const unique = newFiles.filter((f) => !existingUris.has(f.uri));
      const next = [...prev, ...unique];
      if (next.length > MAX_FILES) {
        Toast.show({ type: 'error', text1: `Maximum ${MAX_FILES} images per batch` });
        return next.slice(0, MAX_FILES);
      }
      return next;
    });
    setStatus('idle');
    setResults(null);
    setError(null);
  }

  function removeFile(uri) {
    setSelectedFiles((prev) => prev.filter((f) => f.uri !== uri));
  }

  function setModel(name) {
    setSelectedModel(name);
  }

  async function run() {
    if (selectedFiles.length === 0) {
      Toast.show({ type: 'error', text1: 'Select at least one image' });
      return;
    }

    setStatus('loading');
    setError(null);
    setResults(null);

    try {
      const data = await submitBatch(selectedFiles, selectedModel);
      setResults(data);
      setStatus('success');
      const count = data.results?.length ?? 0;
      Toast.show({
        type: 'success',
        text1: `Batch complete — ${count} image${count !== 1 ? 's' : ''} assessed`,
      });
    } catch (err) {
      setError(err);
      setStatus('error');
      Toast.show({ type: 'error', text1: err.message || 'Batch failed' });
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
