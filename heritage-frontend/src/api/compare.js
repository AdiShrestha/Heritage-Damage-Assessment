import client from './client';

export async function compareImages(imageT1, imageT2, siteId = null) {
  const formData = new FormData();
  formData.append('image_t1', imageT1);
  formData.append('image_t2', imageT2);

  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);

  const url = `/compare${params.toString() ? `?${params.toString()}` : ''}`;

  return client.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000,
  });
}
