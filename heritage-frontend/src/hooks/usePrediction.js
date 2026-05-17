import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { predict } from '../api/predict';
import { createPreviewURL, revokePreviewURL, validateFile } from '../utils/image';

const initialState = {
  status: 'idle',
  result: null,
  error: null,
  selectedFile: null,
  previewURL: null,
  selectedModel: 'mock',
};

export function usePrediction() {
  const [status, setStatus] = useState(initialState.status);
  const [result, setResult] = useState(initialState.result);
  const [error, setError] = useState(initialState.error);
  const [selectedFile, setSelectedFile] = useState(initialState.selectedFile);
  const [previewURL, setPreviewURL] = useState(initialState.previewURL);
  const [selectedModel, setSelectedModel] = useState(initialState.selectedModel);
  const previewRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        revokePreviewURL(previewRef.current);
      }
    };
  }, []);

  function setFile(file) {
    const validation = validateFile(file);

    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    if (previewRef.current) {
      revokePreviewURL(previewRef.current);
    }

    const url = createPreviewURL(file);
    previewRef.current = url;
    setSelectedFile(file);
    setPreviewURL(url);
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
      toast.success('Assessment complete');
    } catch (normalizedError) {
      setError(normalizedError);
      setStatus('error');
      toast.error(normalizedError.message);
    }
  }

  function reset() {
    if (previewRef.current) {
      revokePreviewURL(previewRef.current);
      previewRef.current = null;
    }

    setStatus(initialState.status);
    setResult(initialState.result);
    setError(initialState.error);
    setSelectedFile(initialState.selectedFile);
    setPreviewURL(initialState.previewURL);
    setSelectedModel(initialState.selectedModel);
  }

  return {
    status,
    result,
    error,
    selectedFile,
    previewURL,
    selectedModel,
    setFile,
    setModel,
    run,
    reset,
  };
}
