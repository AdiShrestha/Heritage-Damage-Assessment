import client from './client';

export async function estimateUncertainty(file, nPasses = 15) {
  const formData = new FormData();
  formData.append('file', file);

  return client.post(`/predict/uncertainty?n_passes=${nPasses}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 180000, // MC Dropout runs N times, might take longer
  });
}
