import { useRef, useState } from 'react';
import { predict } from '../api/predict';

const initialState = {
  status: 'idle',
  result: null,
  error: null,
  selectedFile: null,
  preview: null,
  selectedModel: 'mock',
};

export function usePrediction() {
  const [status, setStatus] = useState(initialState.status);
  const [result, setResult] = useState(initialState.result);
  const [error, setError] = useState(initialState.error);
  const [selectedFile, setSelectedFile] = useState(initialState.selectedFile);
  const [preview, setPreview] = useState(initialState.preview);
  const [selectedModel, setSelectedModel] = useState(initialState.selectedModel);
  const fileRef = useRef(null);

  function setFile(file) {
    fileRef.current = file;
    setSelectedFile(file);
    setPreview(file.uri);
    setStatus('idle');
    setResult(null);
    setError(null);
  }

  function setModel(name) {
    setSelectedModel(name);
  }

  async function run() {
    if (!selectedFile) {
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await predict(selectedFile, selectedModel);
      setResult(response);
      setStatus('success');
    } catch (normalizedError) {
      setError(normalizedError);
      setStatus('error');
    }
  }

  function reset() {
    fileRef.current = null;
    setStatus(initialState.status);
    setResult(initialState.result);
    setError(initialState.error);
    setSelectedFile(initialState.selectedFile);
    setPreview(initialState.preview);
    setSelectedModel(initialState.selectedModel);
  }

  return {
    status,
    result,
    error,
    selectedFile,
    preview,
    selectedModel,
    setFile,
    setModel,
    run,
    reset,
  };
}
