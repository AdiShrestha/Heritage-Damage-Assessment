import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { estimateUncertainty } from '../api/uncertainty';
import { createPreviewURL, revokePreviewURL, validateFile } from '../utils/image';

const initialState = {
  status: 'idle',
  result: null,
  error: null,
  selectedFile: null,
  previewURL: null,
  passes: 15,
};

export function useUncertainty() {
  const [status, setStatus] = useState(initialState.status);
  const [result, setResult] = useState(initialState.result);
  const [error, setError] = useState(initialState.error);
  const [selectedFile, setSelectedFile] = useState(initialState.selectedFile);
  const [previewURL, setPreviewURL] = useState(initialState.previewURL);
  const [passes, setPasses] = useState(initialState.passes);
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

  async function run() {
    if (!selectedFile) return;

    setStatus('loading');
    setError(null);

    try {
      const response = await estimateUncertainty(selectedFile, passes);
      setResult(response);
      setStatus('success');
      toast.success('Uncertainty analysis complete');
    } catch (normalizedError) {
      setError(normalizedError);
      setStatus('error');
      toast.error(normalizedError.message || 'Analysis failed.');
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
    setPasses(initialState.passes);
  }

  return {
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
  };
}
