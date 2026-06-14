import client from './client';

/**
 * Submit a batch of images for damage assessment.
 * files: array of react-native image-picker results { uri, type, fileName }
 */
export async function submitBatch(files, modelName) {
  const formData = new FormData();

  files.forEach((file, idx) => {
    formData.append('files', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || `image_${idx}.jpg`,
    });
  });

  return client.post(
    `/predict/batch?model=${encodeURIComponent(modelName)}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000,
    }
  );
}
