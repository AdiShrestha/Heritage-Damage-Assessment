import client from './client';

export async function submitBatch(files, modelName) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  return client.post(
    `/predict/batch?model=${encodeURIComponent(modelName)}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
    }
  );
}
