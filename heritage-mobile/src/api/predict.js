import client from './client';

export async function predict(file, modelName) {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    type: file.type || 'image/jpeg',
    name: file.fileName || 'image.jpg',
  });

  return client.post(`/predict/?model_name=${encodeURIComponent(modelName)}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000,
  });
}
