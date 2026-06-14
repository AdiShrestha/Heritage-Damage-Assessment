import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { compareImages } from '../api/compare';
import { createPreviewURL, revokePreviewURL, validateFile } from '../utils/image';

const initialState = {
  status: 'idle',
  result: null,
  error: null,
  fileT1: null,
  fileT2: null,
  previewT1: null,
  previewT2: null,
  siteId: '',
};

export function useComparison() {
  const [status, setStatus] = useState(initialState.status);
  const [result, setResult] = useState(initialState.result);
  const [error, setError] = useState(initialState.error);
  const [fileT1, setFileT1] = useState(initialState.fileT1);
  const [fileT2, setFileT2] = useState(initialState.fileT2);
  const [previewT1, setPreviewT1] = useState(initialState.previewT1);
  const [previewT2, setPreviewT2] = useState(initialState.previewT2);
  const [siteId, setSiteId] = useState(initialState.siteId);
  const previewRefT1 = useRef(null);
  const previewRefT2 = useRef(null);

  function setFile(index, file) {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    if (index === 1) {
      if (previewRefT1.current) {
        revokePreviewURL(previewRefT1.current);
      }
      const url = createPreviewURL(file);
      previewRefT1.current = url;
      setFileT1(file);
      setPreviewT1(url);
    } else {
      if (previewRefT2.current) {
        revokePreviewURL(previewRefT2.current);
      }
      const url = createPreviewURL(file);
      previewRefT2.current = url;
      setFileT2(file);
      setPreviewT2(url);
    }

    setStatus('idle');
    setResult(null);
    setError(null);
  }

  async function run() {
    if (!fileT1 || !fileT2) {
      toast.error('Please upload both images');
      return;
    }

    setStatus('loading');
    setResult(null);
    setError(null);

    try {
      const data = await compareImages(fileT1, fileT2, siteId || undefined);
      setResult(data);
      toast.success('Comparison completed');
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Comparison failed');
    } finally {
      setStatus('done');
    }
  }

  function reset() {
    if (previewRefT1.current) revokePreviewURL(previewRefT1.current);
    if (previewRefT2.current) revokePreviewURL(previewRefT2.current);
    
    setStatus(initialState.status);
    setResult(initialState.result);
    setError(initialState.error);
    setFileT1(initialState.fileT1);
    setFileT2(initialState.fileT2);
    setPreviewT1(initialState.previewT1);
    setPreviewT2(initialState.previewT2);
  }

  return {
    status,
    result,
    error,
    fileT1,
    fileT2,
    previewT1,
    previewT2,
    siteId,
    setFileT1: (file) => setFile(1, file),
    setFileT2: (file) => setFile(2, file),
    setSiteId,
    run,
    reset,
  };
}
