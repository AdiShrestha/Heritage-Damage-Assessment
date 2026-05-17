import axios from 'axios';
import { API_BASE_URL } from '../constants';

function createRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function fallbackMessage(status) {
  if (status === 413) return 'File too large. Maximum size is 10MB.';
  if (status === 415) return 'Unsupported format. Use JPEG, PNG, or WebP.';
  if (status === 422) return 'Invalid image. Please try a different file.';
  if (status === 404) return 'Requested model not found.';
  if (status === 500) return 'Server error during inference. Please try again.';
  return 'Something went wrong. Please try again.';
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const requestId = createRequestId();
  config.headers = config.headers || {};
  config.headers['X-Request-ID'] = requestId;
  return config;
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data || {};
    const normalized = {
      message: data.message || fallbackMessage(status),
      error_code: data.error_code || 'REQUEST_ERROR',
      status: status || 0,
      request_id: data.request_id || error?.response?.headers?.['x-request-id'] || null,
    };

    return Promise.reject(normalized);
  },
);

export default client;
