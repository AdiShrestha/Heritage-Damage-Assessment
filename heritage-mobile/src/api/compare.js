import client from './client';

/**
 * Compare two heritage site images (temporal comparison).
 * file objects are react-native image-picker results: { uri, type, fileName }
 */
export async function compareImages(fileT1, fileT2, siteId = null) {
  const formData = new FormData();

  formData.append('image_t1', {
    uri: fileT1.uri,
    type: fileT1.type || 'image/jpeg',
    name: fileT1.fileName || 'image_t1.jpg',
  });
  formData.append('image_t2', {
    uri: fileT2.uri,
    type: fileT2.type || 'image/jpeg',
    name: fileT2.fileName || 'image_t2.jpg',
  });

  const params = siteId ? `?site_id=${encodeURIComponent(siteId)}` : '';

  return client.post(`/compare${params}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
}
