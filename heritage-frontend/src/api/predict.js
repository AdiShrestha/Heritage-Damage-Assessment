import client from './client';

export async function predict(file, modelName) {
  const formData = new FormData();
  formData.append('file', file);

  return client.post(`/predict?model_name=${encodeURIComponent(modelName)}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
