import { useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import { compareImages } from '../api/compare';

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
  const [fileT1, setFileT1State] = useState(initialState.fileT1);
  const [fileT2, setFileT2State] = useState(initialState.fileT2);
  const [previewT1, setPreviewT1] = useState(initialState.previewT1);
  const [previewT2, setPreviewT2] = useState(initialState.previewT2);
  const [siteId, setSiteId] = useState(initialState.siteId);

  function setFileT1(file) {
    setFileT1State(file);
    setPreviewT1(file?.uri ?? null);
    setStatus('idle');
    setResult(null);
    setError(null);
  }

  function setFileT2(file) {
    setFileT2State(file);
    setPreviewT2(file?.uri ?? null);
    setStatus('idle');
    setResult(null);
    setError(null);
  }

  async function run() {
    if (!fileT1 || !fileT2) {
      Toast.show({ type: 'error', text1: 'Upload both images first' });
      return;
    }

    setStatus('loading');
    setResult(null);
    setError(null);

    try {
      const data = await compareImages(fileT1, fileT2, siteId || null);
      setResult(data);
      setStatus('success');
      Toast.show({ type: 'success', text1: 'Comparison complete' });
    } catch (err) {
      setError(err);
      setStatus('error');
      Toast.show({ type: 'error', text1: err.message || 'Comparison failed' });
    }
  }

  function reset() {
    setStatus(initialState.status);
    setResult(initialState.result);
    setError(initialState.error);
    setFileT1State(initialState.fileT1);
    setFileT2State(initialState.fileT2);
    setPreviewT1(initialState.previewT1);
    setPreviewT2(initialState.previewT2);
    setSiteId(initialState.siteId);
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
    setSiteId,
    setFileT1,
    setFileT2,
    run,
    reset,
  };
}
